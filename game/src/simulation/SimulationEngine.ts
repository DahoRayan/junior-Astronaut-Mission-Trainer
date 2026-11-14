import { BUILDING_DEFINITIONS } from '../core/Constants';
import { eventBus } from '../core/EventBus';
import { GameSnapshot, PlacedBuilding, ResourceState } from '../core/types';
import { Grid } from './Grid';
import { PowerNetwork } from './PowerNetwork';

export class SimulationEngine {
  public grid: Grid;
  private powerNetwork: PowerNetwork;

  public state: ResourceState;
  public simulationSpeed: number = 1; // 0 = paused, 1 = 1x, 2 = 2x
  public currentChapter: number = 1;

  private tickIntervalId: number | null = null;
  private isDaylight: boolean = true;

  constructor() {
    this.grid = new Grid();
    this.powerNetwork = new PowerNetwork();

    this.state = {
      sol: 1,
      timeOfDayHours: 6.0,
      materials: 250,
      powerKwGenerated: 0,
      powerKwConsumed: 0,
      powerBalanceKw: 0,
      batteryChargeKwh: 50,
      batteryCapacityKwh: 100,
      oxygenKgRemaining: 100,
      oxygenBalanceKgH: 0,
      waterLiters: 100,
      waterRecycledLiters: 0,
      radiationDoseMitigatedPct: 20,
      crewHealthAvg: 100,
      crewMoraleAvg: 95,
      activeAlert: null,
    };
  }

  public start(): void {
    if (this.tickIntervalId !== null) return;
    // Tick every 1000ms in real time
    this.tickIntervalId = window.setInterval(() => {
      if (this.simulationSpeed > 0) {
        this.tick(this.simulationSpeed);
      }
    }, 1000);
  }

  public stop(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  public setSpeed(speed: number): void {
    this.simulationSpeed = speed;
    eventBus.emit('speed_changed', speed);
  }

  public placeStructure(type: PlacedBuilding['type'], x: number, y: number): boolean {
    const def = BUILDING_DEFINITIONS[type];
    if (this.state.materials < def.buildCost) {
      eventBus.emit('notification', {
        type: 'warning',
        message: `Not enough materials! Need ${def.buildCost}, have ${this.state.materials}.`,
      });
      return false;
    }

    const building: PlacedBuilding = {
      id: `${type}_${Date.now()}`,
      type,
      x,
      y,
      isPowered: false,
    };

    if (type === 'power_cable') {
      const success = this.grid.setCable(x, y, true);
      if (success) {
        this.state.materials -= def.buildCost;
        this.recalculate();
        eventBus.emit('cable_placed', { x, y });
        eventBus.emit('resources_updated', this.state);
        return true;
      }
      return false;
    }

    const success = this.grid.placeBuilding(building);
    if (success) {
      this.state.materials -= def.buildCost;
      this.recalculate();
      eventBus.emit('structure_placed', building);
      eventBus.emit('resources_updated', this.state);
      return true;
    }

    return false;
  }

  public removeStructure(x: number, y: number): boolean {
    const tile = this.grid.getTile(x, y);
    if (!tile) return false;

    if (tile.hasCable) {
      this.grid.setCable(x, y, false);
      this.recalculate();
      eventBus.emit('cable_removed', { x, y });
      eventBus.emit('resources_updated', this.state);
      return true;
    }

    if (tile.building) {
      const removed = this.grid.removeBuilding(x, y);
      if (removed) {
        // Refund 50% materials
        const refund = Math.floor(BUILDING_DEFINITIONS[removed.type].buildCost * 0.5);
        this.state.materials += refund;
        this.recalculate();
        eventBus.emit('structure_demolished', removed);
        eventBus.emit('resources_updated', this.state);
        return true;
      }
    }

    return false;
  }

  public tick(multiplier: number = 1): void {
    // 1 hour passes every tick * multiplier
    const deltaHours = 0.5 * multiplier;
    this.state.timeOfDayHours += deltaHours;

    if (this.state.timeOfDayHours >= 24) {
      this.state.timeOfDayHours -= 24;
      this.state.sol += 1;
      eventBus.emit('sol_changed', this.state.sol);
    }

    // Solar cycle on Shackleton Rim: Near-constant sun at high peaks, shadows rotate
    this.isDaylight = !(this.state.timeOfDayHours > 18 || this.state.timeOfDayHours < 4);

    this.recalculate();

    // Battery charge/discharge
    if (this.state.powerBalanceKw > 0) {
      this.state.batteryChargeKwh = Math.min(
        this.state.batteryCapacityKwh,
        this.state.batteryChargeKwh + this.state.powerBalanceKw * (deltaHours / 4)
      );
    } else if (this.state.powerBalanceKw < 0) {
      const deficit = Math.abs(this.state.powerBalanceKw) * (deltaHours / 4);
      if (this.state.batteryChargeKwh >= deficit) {
        this.state.batteryChargeKwh -= deficit;
      } else {
        this.state.batteryChargeKwh = 0;
        this.triggerAlert('power_outage');
      }
    }

    // Oxygen consumption & production
    // 4 crew consume 0.84 kg O2 per sol = ~0.14 kg/h
    const crewConsumptionKgH = 0.14;
    this.state.oxygenKgRemaining += (this.state.oxygenBalanceKgH - crewConsumptionKgH) * (deltaHours / 2);
    if (this.state.oxygenKgRemaining <= 0) {
      this.state.oxygenKgRemaining = 0;
      this.state.crewHealthAvg = Math.max(20, this.state.crewHealthAvg - 5);
      this.triggerAlert('oxygen_depletion');
    } else if (this.state.oxygenKgRemaining > 150) {
      this.state.oxygenKgRemaining = 150;
    }

    eventBus.emit('resources_updated', this.state);
    eventBus.emit('simulation_tick', this.getSnapshot());
  }

  public recalculate(): void {
    const powerResult = this.powerNetwork.calculate(this.grid, this.isDaylight);
    this.state.powerKwGenerated = powerResult.totalGeneratedKw;
    this.state.powerKwConsumed = powerResult.totalConsumedKw;
    this.state.powerBalanceKw = powerResult.netPowerKw;
    this.state.batteryCapacityKwh = Math.max(100, powerResult.batteryCapacityKwh);

    // Life support calculations
    let totalO2Prod = 0;
    let totalShieldBonus = 20;

    const buildings = this.grid.getPlacedBuildings();
    for (const b of buildings) {
      if (b.isPowered) {
        const def = BUILDING_DEFINITIONS[b.type];
        totalO2Prod += def.oxygenProductionKgH;
        totalShieldBonus += def.shieldingBonusPct;
      }
    }

    this.state.oxygenBalanceKgH = totalO2Prod;
    this.state.radiationDoseMitigatedPct = Math.min(98, totalShieldBonus);
  }

  public triggerAlert(alertKey: string): void {
    this.state.activeAlert = alertKey;
    eventBus.emit('alert_triggered', alertKey);
  }

  public clearAlert(): void {
    this.state.activeAlert = null;
    eventBus.emit('alert_cleared', null);
  }

  public getSnapshot(): GameSnapshot {
    return {
      chapter: this.currentChapter,
      sol: this.state.sol,
      power_kw_generated: this.state.powerKwGenerated,
      power_kw_consumed: this.state.powerKwConsumed,
      battery_charge_kwh: this.state.batteryChargeKwh,
      battery_capacity_kwh: this.state.batteryCapacityKwh,
      oxygen_kg_remaining: this.state.oxygenKgRemaining,
      crew_health_avg: this.state.crewHealthAvg,
      crew_morale_avg: this.state.crewMoraleAvg,
      active_alert: this.state.activeAlert,
    };
  }
}
