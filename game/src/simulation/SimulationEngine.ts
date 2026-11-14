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
  public isDaylight: boolean = true;

  // Earth Resupply Cooldowns (in ticks/hours)
  private o2ResupplyCooldown: number = 0;
  private waterResupplyCooldown: number = 0;

  constructor() {
    this.grid = new Grid();
    this.powerNetwork = new PowerNetwork();

    // Initial state aligned with Lunar Outpost Equipment Specification
    this.state = {
      sol: 1,
      timeOfDayHours: 6.0,
      materials: 250,
      powerKwGenerated: 0,
      powerKwConsumed: 0,
      powerBalanceKw: 0,
      batteryChargeKwh: 50,
      batteryCapacityKwh: 100, // 50 base buffer + 100 per bank
      oxygenKgRemaining: 80, // Stored O2 tank (0-100)
      oxygenBalanceKgH: 0,
      co2: 15, // Nominal cabin CO2 (0-100)
      waterLiters: 60, // Water stock (0-100)
      waterRecycledLiters: 0,
      temperature: 50, // Nominal cabin temperature (0-100, setpoint 50 = 21°C)
      food: 20, // Food stock
      foodGrowth: 0, // Crop progress (0-100)
      dust: 0, // Solar panel dust (0-100)
      shield: 40, // Regolith condition (0-100)
      radiationProtection: 30, // Effective shielding (0-100)
      radiation: 30, // Radiation exposure (0-100)
      lightCycle: 80, // Circadian lighting (0-100)
      saturation: 80, // Hunger (0-100)
      quenching: 80, // Thirst (0-100)
      radiationDoseMitigatedPct: 30,
      crewHealthAvg: 100,
      crewMoraleAvg: 95, // Enthusiasm
      isSheltering: false,
      activeAlert: null,
    };
  }

  public start(): void {
    if (this.tickIntervalId !== null) return;
    // 1 tick = 1 hour (runs every 1000ms real time at 1x speed)
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

      // On-construction immediate bonuses
      if (type === 'regolith_shield') {
        this.state.shield = Math.min(100, this.state.shield + 40);
        this.state.radiationProtection = Math.min(100, this.state.radiationProtection + 30);
      }

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

  // --- Crew Action Events (§5.2) ---
  public eat(): boolean {
    if (this.state.food < 4) {
      eventBus.emit('notification', { type: 'warning', message: 'Not enough food! Need 4 food rations.' });
      return false;
    }
    this.state.food -= 4;
    this.state.saturation = Math.min(100, this.state.saturation + 10);
    this.state.crewMoraleAvg = Math.min(100, this.state.crewMoraleAvg + 1);
    eventBus.emit('notification', { type: 'info', message: 'Crew ate dinner: saturation +10, morale +1.' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public drink(): boolean {
    if (this.state.waterLiters < 3) {
      eventBus.emit('notification', { type: 'warning', message: 'Not enough water! Need 3 L.' });
      return false;
    }
    this.state.waterLiters -= 3;
    this.state.quenching = Math.min(100, this.state.quenching + 5);
    this.state.crewMoraleAvg = Math.min(100, this.state.crewMoraleAvg + 1);
    eventBus.emit('notification', { type: 'info', message: 'Crew hydrated: quenching +5, morale +1.' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public cleanSolarPanels(): boolean {
    if (this.state.batteryChargeKwh < 1) {
      eventBus.emit('notification', { type: 'warning', message: 'Insufficient power for panel cleaning!' });
      return false;
    }
    this.state.batteryChargeKwh -= 1;
    this.state.dust = Math.max(0, this.state.dust - 25);
    eventBus.emit('notification', { type: 'info', message: `Solar panels dusted: dust is now ${Math.round(this.state.dust)}%.` });
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public reshield(): boolean {
    if (this.state.batteryChargeKwh < 2) {
      eventBus.emit('notification', { type: 'warning', message: 'Insufficient power to reshield habitat!' });
      return false;
    }
    this.state.batteryChargeKwh -= 2;
    this.state.shield = Math.min(100, this.state.shield + 15);
    this.state.radiationProtection = Math.min(100, this.state.radiationProtection + 10);
    eventBus.emit('notification', { type: 'info', message: 'Regolith shield reinforced: protection +10!' });
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public farm(): boolean {
    const buildings = this.grid.getPlacedBuildings();
    const hasFarm = buildings.some((b) => b.type === 'hydroponics_tray' && b.isPowered);
    if (!hasFarm) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires an active, powered Growth Farm!' });
      return false;
    }
    if (this.state.waterLiters < 2 || this.state.batteryChargeKwh < 1) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires 2 L water and 1 kWh power.' });
      return false;
    }
    this.state.waterLiters -= 2;
    this.state.batteryChargeKwh -= 1;
    this.state.foodGrowth = Math.min(100, this.state.foodGrowth + 5);
    eventBus.emit('notification', { type: 'info', message: `Crops tended: food growth is now ${this.state.foodGrowth}%.` });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public harvast(): boolean {
    if (this.state.foodGrowth < 10) {
      eventBus.emit('notification', { type: 'warning', message: 'Crops not ready! Need food growth >= 10.' });
      return false;
    }
    const yieldAmount = Math.floor(this.state.foodGrowth / 10);
    this.state.food += yieldAmount;
    this.state.foodGrowth -= 10;
    eventBus.emit('notification', { type: 'info', message: `Harvested +${yieldAmount} food rations! Fresh lunar salad.` });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public toggleShelter(): boolean {
    const buildings = this.grid.getPlacedBuildings();
    const hasVault = buildings.some((b) => b.type === 'subterranean_vault');
    if (!hasVault) {
      eventBus.emit('notification', { type: 'warning', message: 'No Subterranean Storm Vault constructed!' });
      return false;
    }
    this.state.isSheltering = !this.state.isSheltering;
    eventBus.emit('notification', {
      type: this.state.isSheltering ? 'warning' : 'info',
      message: this.state.isSheltering ? 'Crew safely sheltered in Storm Vault (+95% Shielding).' : 'Crew exited Storm Vault.',
    });
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public demandEarthOxygenResupply(): boolean {
    const buildings = this.grid.getPlacedBuildings();
    const hasComms = buildings.some((b) => b.type === 'earth_channel' && b.isPowered);
    if (!hasComms) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires an active Earth Connection Channel!' });
      return false;
    }
    if (this.o2ResupplyCooldown > 0) {
      eventBus.emit('notification', { type: 'warning', message: `Resupply transit on cooldown: ${this.o2ResupplyCooldown} h remaining.` });
      return false;
    }
    this.state.oxygenKgRemaining = Math.min(100, this.state.oxygenKgRemaining + 60);
    this.state.crewMoraleAvg = Math.min(100, this.state.crewMoraleAvg + 10);
    this.o2ResupplyCooldown = 24;
    eventBus.emit('notification', { type: 'info', message: 'Emergency Earth O₂ resupply received (+60 stored O₂, +10 morale)!' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public demandEarthWaterResupply(): boolean {
    const buildings = this.grid.getPlacedBuildings();
    const hasComms = buildings.some((b) => b.type === 'earth_channel' && b.isPowered);
    if (!hasComms) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires an active Earth Connection Channel!' });
      return false;
    }
    if (this.waterResupplyCooldown > 0) {
      eventBus.emit('notification', { type: 'warning', message: `Resupply transit on cooldown: ${this.waterResupplyCooldown} h remaining.` });
      return false;
    }
    this.state.waterLiters = Math.min(100, this.state.waterLiters + 50);
    this.state.crewMoraleAvg = Math.min(100, this.state.crewMoraleAvg + 5);
    this.waterResupplyCooldown = 24;
    eventBus.emit('notification', { type: 'info', message: 'Emergency Earth water resupply received (+50 L, +5 morale)!' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  // --- Hourly Simulation Tick (§6.1) ---
  public tick(multiplier: number = 1): void {
    // 1 tick = 1 hour
    const deltaHours = 1 * multiplier;
    this.state.timeOfDayHours += deltaHours;

    if (this.state.timeOfDayHours >= 24) {
      this.state.timeOfDayHours -= 24;
      this.state.sol += 1;
      eventBus.emit('sol_changed', this.state.sol);
    }

    // Daylight cycle: 12h daylight (0-12), 12h night (12-24)
    this.isDaylight = this.state.timeOfDayHours >= 0 && this.state.timeOfDayHours < 12;

    // Resupply cooldowns
    if (this.o2ResupplyCooldown > 0) this.o2ResupplyCooldown = Math.max(0, this.o2ResupplyCooldown - deltaHours);
    if (this.waterResupplyCooldown > 0) this.waterResupplyCooldown = Math.max(0, this.waterResupplyCooldown - deltaHours);

    // Dust accumulation: dust +2 per tick
    this.state.dust = Math.min(100, this.state.dust + 2 * deltaHours);

    // Apply baseline rules & machine priorities
    this.recalculate();

    // 1. Habitat Baseline Load (§1.2 & §6.1)
    let baselineDraw = 2; // Default baseline avionics draw
    let baselineHeating = 0;
    let baselineLight = -5;

    if (this.state.batteryChargeKwh >= 25) {
      baselineDraw = 14; // 7 + 5 + 2
      baselineHeating = 5;
      baselineLight = 4;
    } else if (this.state.batteryChargeKwh >= 20) {
      baselineDraw = 10; // 7 + 1 + 2
      baselineHeating = 5;
      baselineLight = -5;
    } else if (this.state.batteryChargeKwh > 0) {
      baselineDraw = 2;
      baselineHeating = 0;
      baselineLight = -5;
    } else {
      baselineDraw = 0;
      baselineHeating = 0;
      baselineLight = -15; // Complete blackout
      this.state.foodGrowth = Math.max(0, this.state.foodGrowth - 10);
    }

    // 2. Machine Energy Allocation by Priority (§6.2, §6.3)
    let powerGen = this.state.powerKwGenerated;
    let machineDemand = this.state.powerKwConsumed;

    // Net battery change for this tick
    const netPower = powerGen - machineDemand - baselineDraw;
    this.state.powerBalanceKw = netPower;

    if (netPower > 0) {
      this.state.batteryChargeKwh = Math.min(this.state.batteryCapacityKwh, this.state.batteryChargeKwh + netPower * deltaHours);
    } else if (netPower < 0) {
      const drain = Math.abs(netPower) * deltaHours;
      if (this.state.batteryChargeKwh >= drain) {
        this.state.batteryChargeKwh -= drain;
      } else {
        this.state.batteryChargeKwh = 0;
        this.triggerAlert('power_outage');
      }
    }

    // 3. Time Rule Drains (§1.1, §2.3)
    this.state.stored_o2 = this.state.oxygenKgRemaining;
    this.state.stored_o2 = Math.max(0, this.state.stored_o2 - 3 * deltaHours); // Crew respiration (-3/h)
    this.state.co2 = Math.min(100, this.state.co2 + 4 * deltaHours); // Crew exhalation (+4/h)
    this.state.waterLiters = Math.min(100, this.state.waterLiters + 2 * deltaHours); // Habitat baseline water (+2/h)
    this.state.saturation = Math.max(0, this.state.saturation - 2 * deltaHours); // Hunger (-2/h)
    this.state.quenching = Math.max(0, this.state.quenching - 3 * deltaHours); // Thirst (-3/h)

    // Baseline temperature balance
    this.state.temperature = Math.max(0, Math.min(100, this.state.temperature + (baselineHeating - 5) * deltaHours));
    this.state.lightCycle = Math.max(0, Math.min(100, this.state.lightCycle + baselineLight * deltaHours));

    // Radiation drift towards 100 - effective_protection by 2 per tick
    const effectiveProt = this.state.isSheltering
      ? Math.min(100, this.state.radiationProtection + 95)
      : this.state.radiationProtection;
    const targetRadiation = Math.max(0, 100 - effectiveProt);
    if (this.state.radiation < targetRadiation) {
      this.state.radiation = Math.min(targetRadiation, this.state.radiation + 2 * deltaHours);
    } else if (this.state.radiation > targetRadiation) {
      this.state.radiation = Math.max(targetRadiation, this.state.radiation - 2 * deltaHours);
    }
    this.state.radiationDoseMitigatedPct = effectiveProt;

    // 4. Machine Outputs (§5.1)
    const buildings = this.grid.getPlacedBuildings();
    for (const b of buildings) {
      if (!b.isPowered) continue;

      if (b.type === 'emergency_o2_generator') {
        // Runs if stored_o2 < 20 until >= 40
        if (this.state.stored_o2 < 40) {
          this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 1.5 * deltaHours);
        }
      } else if (b.type === 'oxygen_electrolyzer') {
        if (this.state.batteryChargeKwh >= 20 && this.state.waterLiters >= 2.81) {
          this.state.waterLiters -= 2.81 * deltaHours;
          this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 2.5 * deltaHours);
        }
      } else if (b.type === 'co2_scrubber') {
        this.state.co2 = Math.max(0, this.state.co2 - 2 * deltaHours);
      } else if (b.type === 'water_recycler') {
        if (this.state.batteryChargeKwh >= 20) {
          this.state.waterLiters = Math.min(100, this.state.waterLiters + 3 * deltaHours);
        }
      } else if (b.type === 'heating_system') {
        if (this.state.batteryChargeKwh >= 20 && this.state.temperature < 50) {
          this.state.temperature = Math.min(50, this.state.temperature + 4 * deltaHours);
        }
      } else if (b.type === 'hydroponics_tray') {
        if (this.state.batteryChargeKwh >= 25) {
          this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 0.5 * deltaHours);
        }
      }
    }

    // Sync back stored O2
    this.state.oxygenKgRemaining = this.state.stored_o2;

    // 5. Bonus rules
    if (this.state.batteryChargeKwh > 75) {
      this.state.foodGrowth = Math.min(100, this.state.foodGrowth + 2 * deltaHours);
    }

    // 6. Consequence / Threshold Rules (§1.2, §5.3)
    if (this.state.co2 > 50) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 2);
      this.state.crewMoraleAvg = Math.max(0, this.state.crewMoraleAvg - 2);
      this.triggerAlert('co2_high');
    }
    if (this.state.co2 > 75) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 6);
    }
    if (this.state.co2 >= 95) {
      this.state.crewHealthAvg = 0;
      this.triggerAlert('co2_lethal');
    }

    if (this.state.oxygenKgRemaining < 20) {
      this.state.crewMoraleAvg = Math.max(0, this.state.crewMoraleAvg - 5);
      this.triggerAlert('oxygen_low');
    }
    if (this.state.oxygenKgRemaining <= 0) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 10);
      this.triggerAlert('oxygen_depletion');
    }

    if (this.state.temperature < 35) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 2);
      this.state.foodGrowth = Math.max(0, this.state.foodGrowth - 3);
      this.triggerAlert('freezing');
    }
    if (this.state.temperature < 15) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 6);
    }

    if (this.state.radiation > 50) {
      this.state.foodGrowth = Math.max(0, this.state.foodGrowth - 3);
    }
    if (this.state.radiation > 60) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 4);
      this.state.crewMoraleAvg = Math.max(0, this.state.crewMoraleAvg - 2);
      this.triggerAlert('radiation_high');
    }
    if (this.state.radiation > 75) {
      this.state.batteryChargeKwh = Math.max(0, this.state.batteryChargeKwh - 3);
    }
    if (this.state.radiation > 80) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 8);
    }

    if (this.state.saturation === 0) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 3);
    }
    if (this.state.quenching === 0) {
      this.state.crewHealthAvg = Math.max(0, this.state.crewHealthAvg - 5);
    }

    eventBus.emit('resources_updated', this.state);
    eventBus.emit('simulation_tick', this.getSnapshot());
  }

  public recalculate(): void {
    const powerResult = this.powerNetwork.calculate(this.grid, this.isDaylight);
    for (const unp of powerResult.unpoweredBuildings) {
      unp.isPowered = false;
    }

    // Apply dust factor to solar generation
    const dustMultiplier = Math.max(0, 1 - this.state.dust / 100);
    let totalSolarGen = 0;
    let totalOtherGen = 0;

    const buildings = this.grid.getPlacedBuildings();
    let batteryBanks = 0;
    let totalConsumed = 0;
    let totalO2Prod = 0;

    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];

      if (b.type === 'battery_bank') {
        batteryBanks++;
      }

      // Check priority load-shedding lockouts (§6.3)
      if (b.type === 'hydroponics_tray' || b.type === 'earth_channel') {
        // P3 locked out if power < 25
        if (this.state.batteryChargeKwh < 25) {
          b.isPowered = false;
          continue;
        }
      }
      if (b.type === 'oxygen_electrolyzer' || b.type === 'water_recycler' || b.type === 'heating_system') {
        // P2 locked out if power < 20
        if (this.state.batteryChargeKwh < 20) {
          b.isPowered = false;
          continue;
        }
      }

      if (b.isPowered) {
        if (b.type === 'solar_array') {
          totalSolarGen += def.powerGenerationKw * dustMultiplier;
        } else {
          totalOtherGen += def.powerGenerationKw;
        }

        // Draw consumption only if active
        if (b.type === 'emergency_o2_generator') {
          if (this.state.oxygenKgRemaining < 40) {
            totalConsumed += def.powerConsumptionKw;
          }
        } else if (b.type === 'subterranean_vault') {
          if (this.state.isSheltering) {
            totalConsumed += def.powerConsumptionKw;
          }
        } else if (b.type === 'heating_system') {
          if (this.state.temperature < 50) {
            totalConsumed += def.powerConsumptionKw;
          }
        } else {
          totalConsumed += def.powerConsumptionKw;
        }

        totalO2Prod += def.oxygenProductionKgH;
      }
    }

    this.state.powerKwGenerated = totalSolarGen + totalOtherGen;
    this.state.powerKwConsumed = totalConsumed;
    this.state.batteryCapacityKwh = 50 + 100 * batteryBanks;
    this.state.oxygenBalanceKgH = totalO2Prod;
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
