import { BUILDING_DEFINITIONS } from '../core/Constants';
import { eventBus } from '../core/EventBus';
import { GameSnapshot, PlacedBuilding, ResourceState } from '../core/types';
import { Grid } from './Grid';
import { PowerNetwork } from './PowerNetwork';

export type DayCycleMode = 'shackleton_polar' | 'lunar_synodic' | 'compressed_24h';

export class SimulationEngine {
  public grid: Grid;
  private powerNetwork: PowerNetwork;

  public state: ResourceState;
  public simulationSpeed: number = 1; // 0 = paused, 1 = 1x, 2 = 2x
  public currentChapter: number = 1;

  private tickIntervalId: number | null = null;
  public isDaylight: boolean = true;
  public dayCycleMode: DayCycleMode = 'lunar_synodic'; // Default: Standard Lunar Synodic (15 days day / 15 days night)
  private isEmergencyO2Active: boolean = false;
  public isO2AtmosphereEmissionPaused: boolean = false;

  // Earth Resupply Cooldowns (in ticks/hours)
  private o2ResupplyCooldown: number = 0;
  private waterResupplyCooldown: number = 0;

  constructor() {
    this.grid = new Grid();
    this.powerNetwork = new PowerNetwork();

    // Initial state strictly aligned with Lunar Outpost Equipment Specification (§2.3, §10.2)
    this.state = {
      sol: 1,
      timeOfDayHours: 6.0,
      is_daylight: true,
      materials: 350,

      // 18 Core Simulation Variables
      power: 850, // kWh stored
      stored_o2: 80, // 0-100 u (1u = 10 kg)
      oxygen: 20, // Nominal atmospheric O2 percentage (20% O2)
      co2: 10, // 0-100 u (1u = 2.5 kg)
      temperature: 50, // 0-100 (nominal 50 = 21°C)
      pressure: 100, // 0-100 (nominal 100)
      water: 60, // 0-100 u (1u = 10 kg)
      food: 30, // food rations
      food_growth: 0, // 0-100%
      radiation: 30, // 0-100
      radiation_protection: 60, // 0-100
      shield: 70, // 0-100
      dust: 0, // 0-100%
      light_cycle: 80, // 0-100%
      saturation: 80, // 0-100%
      quenching: 80, // 0-100%
      enthusiasm: 95, // 0-100%
      health: 100, // 0-100%

      // Electrical & Derived Rates
      powerKwGenerated: 0,
      powerKwConsumed: 0,
      powerBalanceKw: 0,
      batteryCapacityKwh: 850,
      isSheltering: false,
      activeAlert: null,

      // Backward Compatibility Aliases
      batteryChargeKwh: 850,
      oxygenKgRemaining: 80,
      oxygenBalanceKgH: 0,
      waterLiters: 60,
      waterRecycledLiters: 0,
      foodGrowth: 0,
      radiationProtection: 60,
      lightCycle: 80,
      radiationDoseMitigatedPct: 60,
      crewHealthAvg: 100,
      crewMoraleAvg: 95,
    };

    this.updateDaylightStatus();
    // At startup, player sees a complete, active, interacting lunar outpost base
    this.loadPrebuiltBase();
  }

  /**
   * Initializes the complete reference lunar outpost with all 12 machines + habitat
   * fully connected by power cables and interacting in real-time.
   */
  public loadPrebuiltBase(): void {
    // 1. Clear grid
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const tile = this.grid.tiles[y][x];
        tile.building = undefined;
        tile.hasCable = false;
        tile.cablePowered = false;
      }
    }

    // 2. Solar Farm: 8 Solar Panels along elevated sunlit ridge (y = 4)
    for (let x = 6; x <= 13; x++) {
      this.grid.placeBuilding({
        id: `solar_array_${x}`,
        type: 'solar_array',
        x,
        y: 4,
        isPowered: true,
        isEnabled: true,
      });
    }

    // 3. Energy Storage: 8 Battery Banks along (y = 6)
    for (let x = 6; x <= 13; x++) {
      this.grid.placeBuilding({
        id: `battery_bank_${x}`,
        type: 'battery_bank',
        x,
        y: 6,
        isPowered: true,
        isEnabled: true,
      });
    }

    // 4. Central Crew Habitat (Core Living Quarters) at (10, 8)
    this.grid.placeBuilding({
      id: 'crew_habitat_main',
      type: 'crew_habitat',
      x: 10,
      y: 8,
      isPowered: true,
      isEnabled: true,
    });

    // 5. Life Support: Emergency Generator, 2 CO2 Scrubbers, Oxygen Electrolyzer, Water Recycler
    this.grid.placeBuilding({ id: 'emergency_o2_gen', type: 'emergency_o2_generator', x: 7, y: 8, isPowered: false, isEnabled: true });
    this.grid.placeBuilding({ id: 'co2_scrubber_1', type: 'co2_scrubber', x: 8, y: 8, isPowered: true, isEnabled: true });
    this.grid.placeBuilding({ id: 'co2_scrubber_2', type: 'co2_scrubber', x: 8, y: 9, isPowered: true, isEnabled: true });
    this.grid.placeBuilding({ id: 'oxygen_electrolyzer', type: 'oxygen_electrolyzer', x: 9, y: 9, isPowered: true, isEnabled: true });
    this.grid.placeBuilding({ id: 'water_recycler', type: 'water_recycler', x: 11, y: 9, isPowered: true, isEnabled: true });

    // 6. Thermal Control & Agriculture: Heating System and Growth Farm
    this.grid.placeBuilding({ id: 'heating_system', type: 'heating_system', x: 12, y: 8, isPowered: true, isEnabled: true });
    this.grid.placeBuilding({ id: 'growth_farm', type: 'hydroponics_tray', x: 12, y: 9, isPowered: true, isEnabled: true });

    // 7. Radiation Defense: Lunar Soil Regolith Shield & Subterranean Storm Vault
    this.grid.placeBuilding({ id: 'regolith_shield', type: 'regolith_shield', x: 10, y: 7, isPowered: true, isEnabled: true });
    this.grid.placeBuilding({ id: 'storm_vault', type: 'subterranean_vault', x: 13, y: 8, isPowered: true, isEnabled: true });

    // 8. Communication Link: Earth Connection Channel
    this.grid.placeBuilding({ id: 'earth_channel', type: 'earth_channel', x: 14, y: 7, isPowered: true, isEnabled: true });

    // 9. Comprehensive Power Cable Grid
    // East-West Main Conduit Highway along y = 5
    for (let x = 6; x <= 14; x++) {
      this.grid.setCable(x, 5, true);
    }
    // North-South distribution feeder lines
    const feeders = [
      { x: 7, y: 7 }, { x: 7, y: 8 },
      { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 9 },
      { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
      { x: 10, y: 7 }, { x: 10, y: 8 }, { x: 10, y: 9 },
      { x: 11, y: 7 }, { x: 11, y: 8 }, { x: 11, y: 9 },
      { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 },
      { x: 13, y: 7 }, { x: 13, y: 8 },
      { x: 14, y: 6 }, { x: 14, y: 7 },
    ];
    feeders.forEach((pt) => {
      this.grid.setCable(pt.x, pt.y, true);
    });

    // 10. Nominal Reference Outpost Starting Values (§7.2 & §10.2)
    this.state.materials = 350;
    this.state.batteryCapacityKwh = 50 + 8 * 100; // 850 kWh
    this.state.power = 850;
    this.state.batteryChargeKwh = 850;
    this.state.stored_o2 = 80;
    this.state.oxygen = 20;
    this.state.oxygenKgRemaining = 80;
    this.state.co2 = 10;
    this.state.temperature = 50; // 21°C
    this.state.pressure = 100;
    this.state.water = 60;
    this.state.waterLiters = 60;
    this.state.food = 30;
    this.state.food_growth = 0;
    this.state.foodGrowth = 0;
    this.state.radiation = 30;
    this.state.radiation_protection = 60;
    this.state.radiationProtection = 60;
    this.state.shield = 70;
    this.state.dust = 0;
    this.state.light_cycle = 80;
    this.state.lightCycle = 80;
    this.state.saturation = 80;
    this.state.quenching = 80;
    this.state.enthusiasm = 95;
    this.state.crewMoraleAvg = 95;
    this.state.health = 100;
    this.state.crewHealthAvg = 100;
    this.state.isSheltering = false;

    // Recalculate grid network and broadcast telemetry
    this.updateDaylightStatus();
    this.powerNetwork.calculate(this.grid, this.isDaylight);
    eventBus.emit('resources_updated', this.state);
  }

  /**
   * Resets the entire grid to clean lunar regolith with 1400 materials
   * for building from scratch with zero guidance.
   */
  public clearBaseForScratch(): void {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const tile = this.grid.tiles[y][x];
        tile.building = undefined;
        tile.hasCable = false;
        tile.cablePowered = false;
      }
    }

    // Starting budget of 1400 materials (as recommended in Section 11.1 of Equipment Specification)
    this.state.materials = 1400;
    this.state.batteryCapacityKwh = 50;
    this.state.power = 50;
    this.state.batteryChargeKwh = 50;
    this.state.powerKwGenerated = 0;
    this.state.powerKwConsumed = 0;
    this.state.powerBalanceKw = 0;
    this.state.stored_o2 = 80;
    this.state.oxygen = 20;
    this.state.oxygenKgRemaining = 80;
    this.state.co2 = 10;
    this.state.temperature = 50;
    this.state.pressure = 100;
    this.state.water = 60;
    this.state.waterLiters = 60;
    this.state.food = 20;
    this.state.food_growth = 0;
    this.state.foodGrowth = 0;
    this.state.radiation = 30;
    this.state.radiation_protection = 0;
    this.state.radiationProtection = 0;
    this.state.shield = 0;
    this.state.dust = 0;
    this.state.light_cycle = 80;
    this.state.lightCycle = 80;
    this.state.saturation = 80;
    this.state.quenching = 80;
    this.state.enthusiasm = 95;
    this.state.crewMoraleAvg = 95;
    this.state.health = 100;
    this.state.crewHealthAvg = 100;
    this.state.isSheltering = false;

    this.updateDaylightStatus();
    this.powerNetwork.calculate(this.grid, this.isDaylight);
    eventBus.emit('resources_updated', this.state);
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
      isEnabled: true,
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

  // --- Manual Device Power Switch (§1.1 A6) ---
  public toggleDevicePower(x: number, y: number): { building: PlacedBuilding; isEnabled: boolean } | null {
    const tile = this.grid.getTile(x, y);
    if (!tile || !tile.building) return null;
    const b = tile.building;
    if (b.type === 'power_cable' || b.type === 'regolith_shield') {
      return null;
    }
    b.isEnabled = b.isEnabled === undefined ? false : !b.isEnabled;
    this.recalculate();
    eventBus.emit('device_toggled', { building: b, isEnabled: b.isEnabled });
    eventBus.emit('resources_updated', this.state);
    return { building: b, isEnabled: b.isEnabled };
  }

  public setDeviceEnabled(buildingId: string, isEnabled: boolean): boolean {
    const buildings = this.grid.getPlacedBuildings();
    const b = buildings.find((item) => item.id === buildingId);
    if (!b) return false;
    b.isEnabled = isEnabled;
    this.recalculate();
    eventBus.emit('device_toggled', { building: b, isEnabled: b.isEnabled });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  // --- Crew Action Events (§5.2) ---
  public eat(): boolean {
    if (this.state.food < 4) {
      eventBus.emit('notification', { type: 'warning', message: 'Not enough food! Need 4 food rations.' });
      return false;
    }
    this.state.food -= 4;
    this.state.saturation = Math.min(100, this.state.saturation + 10);
    this.state.enthusiasm = Math.min(100, this.state.enthusiasm + 1);
    this.state.crewMoraleAvg = this.state.enthusiasm;
    eventBus.emit('notification', { type: 'info', message: 'Crew meal served: saturation +10, morale +1.' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public drink(): boolean {
    if (this.state.water < 3) {
      eventBus.emit('notification', { type: 'warning', message: 'Not enough water! Need 3 water units.' });
      return false;
    }
    this.state.water -= 3;
    this.state.waterLiters = this.state.water;
    this.state.quenching = Math.min(100, this.state.quenching + 5);
    this.state.enthusiasm = Math.min(100, this.state.enthusiasm + 1);
    this.state.crewMoraleAvg = this.state.enthusiasm;
    eventBus.emit('notification', { type: 'info', message: 'Crew hydrated: quenching +5, morale +1.' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public cleanSolarPanels(): boolean {
    if (this.state.power < 1) {
      eventBus.emit('notification', { type: 'warning', message: 'Insufficient power for panel cleaning!' });
      return false;
    }
    this.state.power -= 1;
    this.state.batteryChargeKwh = this.state.power;
    this.state.dust = Math.max(0, this.state.dust - 25);
    eventBus.emit('notification', { type: 'info', message: `Solar panels dusted: dust is now ${Math.round(this.state.dust)}%.` });
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public reshield(): boolean {
    if (this.state.power < 2) {
      eventBus.emit('notification', { type: 'warning', message: 'Insufficient power to reshield habitat!' });
      return false;
    }
    if (this.state.shield >= 100) {
      eventBus.emit('notification', { type: 'info', message: 'Regolith shield is already at maximum integrity (100%)!' });
      return false;
    }
    this.state.power -= 2;
    this.state.batteryChargeKwh = this.state.power;
    this.state.shield = Math.min(100, this.state.shield + 15);
    this.state.radiation_protection = Math.min(100, this.state.radiation_protection + 10);
    this.state.radiationProtection = this.state.radiation_protection;
    eventBus.emit('notification', { type: 'info', message: 'Regolith shield reinforced: shield +15, protection +10!' });
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public farm(): boolean {
    if (this.state.isSheltering) {
      eventBus.emit('notification', { type: 'warning', message: 'Crew cannot farm while sheltering in the storm vault!' });
      return false;
    }
    const buildings = this.grid.getPlacedBuildings();
    const hasFarm = buildings.some((b) => b.type === 'hydroponics_tray' && b.isPowered);
    if (!hasFarm) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires an active, powered Growth Farm!' });
      return false;
    }
    if (this.state.water < 2 || this.state.power < 1) {
      eventBus.emit('notification', { type: 'warning', message: 'Requires 2 water and 1 kWh power.' });
      return false;
    }
    this.state.water -= 2;
    this.state.waterLiters = this.state.water;
    this.state.power -= 1;
    this.state.batteryChargeKwh = this.state.power;
    this.state.food_growth = Math.min(100, this.state.food_growth + 5);
    this.state.foodGrowth = this.state.food_growth;
    eventBus.emit('notification', { type: 'info', message: `Crops tended: food growth is now ${this.state.food_growth}%.` });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public harvast(): boolean {
    if (this.state.isSheltering) {
      eventBus.emit('notification', { type: 'warning', message: 'Crew cannot harvest while sheltering in the storm vault!' });
      return false;
    }
    if (this.state.food_growth < 10) {
      eventBus.emit('notification', { type: 'warning', message: 'Crops not ready! Need food growth >= 10.' });
      return false;
    }
    const yieldAmount = Math.floor(this.state.food_growth / 10);
    this.state.food += yieldAmount;
    this.state.food_growth -= 10;
    this.state.foodGrowth = this.state.food_growth;
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
    if (this.state.isSheltering) {
      eventBus.emit('notification', { type: 'warning', message: 'Communications offline while sheltering in the storm vault!' });
      return false;
    }
    if (this.state.radiation > 80) {
      eventBus.emit('notification', { type: 'warning', message: 'Earth link blacked out by intense radiation (> 80)!' });
      return false;
    }
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
    this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 60);
    this.state.oxygenKgRemaining = this.state.stored_o2;
    this.state.enthusiasm = Math.min(100, this.state.enthusiasm + 10);
    this.state.crewMoraleAvg = this.state.enthusiasm;
    this.o2ResupplyCooldown = 24;
    eventBus.emit('notification', { type: 'info', message: 'Emergency Earth O₂ resupply received (+60 stored O₂, +10 morale)!' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  public demandEarthWaterResupply(): boolean {
    if (this.state.isSheltering) {
      eventBus.emit('notification', { type: 'warning', message: 'Communications offline while sheltering in the storm vault!' });
      return false;
    }
    if (this.state.radiation > 80) {
      eventBus.emit('notification', { type: 'warning', message: 'Earth link blacked out by intense radiation (> 80)!' });
      return false;
    }
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
    this.state.water = Math.min(100, this.state.water + 50);
    this.state.waterLiters = this.state.water;
    this.state.enthusiasm = Math.min(100, this.state.enthusiasm + 5);
    this.state.crewMoraleAvg = this.state.enthusiasm;
    this.waterResupplyCooldown = 24;
    eventBus.emit('notification', { type: 'info', message: 'Emergency Earth water resupply received (+50 water, +5 morale)!' });
    eventBus.emit('resources_updated', this.state);
    return true;
  }

  // --- Accurate Lunar Day & Solar Azimuth Tracking ---
  public getSunAzimuth(): number {
    // 720 hours = 30 Earth days (15 days day, 15 days night) = 1 full circuit
    const totalHours = (this.state.sol - 1) * 24 + this.state.timeOfDayHours;
    return (totalHours / 720) * (2 * Math.PI);
  }

  public updateDaylightStatus(): void {
    if (this.dayCycleMode === 'shackleton_polar') {
      // Shackleton Crater Rim (89.9°S) receives near-constant polar grazing sunlight (~86% annual illumination).
      // Sols 7 & 8: The 48-hour mountain ridge shadow eclipse from Chapter 2 ("The Long Night")
      if (this.state.sol === 7 || this.state.sol === 8) {
        this.isDaylight = false;
      } else {
        this.isDaylight = true;
      }
    } else if (this.dayCycleMode === 'compressed_24h') {
      // Compressed educational cycle (12h day, 12h night)
      this.isDaylight = this.state.timeOfDayHours >= 0 && this.state.timeOfDayHours < 12;
    } else {
      // Standard Lunar Synodic Cycle: 15 days daylight, 15 days night (30-day cycle, 720h)
      const solInCycle = ((this.state.sol - 1) % 30) + 1; // Sol 1 to 30
      this.isDaylight = solInCycle <= 15;
    }

    eventBus.emit('sun_updated', {
      azimuth: this.getSunAzimuth(),
      isDaylight: this.isDaylight,
      mode: this.dayCycleMode,
      sol: this.state.sol,
      hour: this.state.timeOfDayHours,
    });
  }

  public toggleDayCycleMode(): DayCycleMode {
    if (this.dayCycleMode === 'lunar_synodic') {
      this.dayCycleMode = 'compressed_24h';
      eventBus.emit('notification', {
        type: 'info',
        message: 'Day Cycle: Compressed 24h Educational Cycle (12h Day / 12h Night).',
      });
    } else if (this.dayCycleMode === 'compressed_24h') {
      this.dayCycleMode = 'shackleton_polar';
      eventBus.emit('notification', {
        type: 'info',
        message: 'Day Cycle: Shackleton Polar Rim (Continuous 86% Sun + 48h Shadow Eclipse on Sol 7-8).',
      });
    } else {
      this.dayCycleMode = 'lunar_synodic';
      eventBus.emit('notification', {
        type: 'info',
        message: 'Day Cycle: Standard Lunar Synodic (15 Days Day / 15 Days Night, 1 Tick = 4h).',
      });
    }
    this.updateDaylightStatus();
    this.recalculate();
    eventBus.emit('resources_updated', this.state);
    return this.dayCycleMode;
  }

  // --- Simulation Tick: 1 Tick = 4 Hours (§User request) ---
  public tick(multiplier: number = 1): void {
    const deltaHours = 4 * multiplier;

    // 1. Clock (§6.1 #1)
    this.state.timeOfDayHours += deltaHours;
    while (this.state.timeOfDayHours >= 24) {
      this.state.timeOfDayHours -= 24;
      this.state.sol += 1;
      eventBus.emit('sol_changed', this.state.sol);
    }
    this.updateDaylightStatus();
    this.state.is_daylight = this.isDaylight;

    // Resupply transit cooldowns
    if (this.o2ResupplyCooldown > 0) this.o2ResupplyCooldown = Math.max(0, this.o2ResupplyCooldown - deltaHours);
    if (this.waterResupplyCooldown > 0) this.waterResupplyCooldown = Math.max(0, this.waterResupplyCooldown - deltaHours);

    // Dust accumulation from lunar regolith: dust +0.5% per tick
    this.state.dust = Math.min(100, this.state.dust + 0.5 * (deltaHours / 4));

    // Evaluate power cables & machine connectivity
    const powerResult = this.powerNetwork.calculate(this.grid, this.isDaylight);
    for (const unp of powerResult.unpoweredBuildings) {
      unp.isPowered = false;
    }

    const buildings = this.grid.getPlacedBuildings();
    let solarPanels = 0;
    let batteryBanks = 0;
    for (const b of buildings) {
      if (b.type === 'battery_bank') {
        batteryBanks++;
      } else if (b.type === 'solar_array' && b.isPowered && b.isEnabled !== false) {
        solarPanels++;
      }
    }
    this.state.batteryCapacityKwh = 50 + 100 * batteryBanks;

    // 2. Solar Generation: Dynamically varies with sun elevation across the 15-day daytime (§User request)
    const solarRating = BUILDING_DEFINITIONS.solar_array.powerGenerationKw;
    let sunIntensity = 0;
    if (this.isDaylight) {
      // 15 days of daylight = 360 hours. Sun rises at Sol 1, reaches zenith at Sol 8, sets at Sol 15
      const solInCycle = ((this.state.sol - 1) % 30) + 1;
      const daytimeHour = ((solInCycle - 1) * 24) + this.state.timeOfDayHours;
      const sunAngle = (daytimeHour / 360) * Math.PI;
      // Smooth dynamic variation from 0.15 at dawn/dusk to 1.0 at solar noon
      sunIntensity = Math.max(0.15, Math.sin(sunAngle));
    }
    const dustMultiplier = Math.max(0, 1 - this.state.dust / 100);
    const solarGenKw = solarRating * solarPanels * sunIntensity * dustMultiplier;
    const energyGeneratedKwh = solarGenKw * deltaHours;

    // Add solar power capped at battery capacity
    this.state.power = Math.min(this.state.batteryCapacityKwh, this.state.power + energyGeneratedKwh);

    // 3. Habitat Baseline Load
    let baselineDrawKw = 2; // Default baseline avionics draw
    let baselineWater = 0;
    let baselineLight = -5;

    if (this.state.power >= 25) {
      baselineDrawKw = 14; // 7 heat loops + 5 light + 2 avionics
      baselineWater = 2;
      baselineLight = 4;
    } else if (this.state.power >= 20) {
      baselineDrawKw = 10; // 7 heat loops + 1 light + 2 avionics
      baselineWater = 2;
      baselineLight = -5;
    } else if (this.state.power > 0) {
      baselineDrawKw = 2; // Avionics only
      baselineWater = 0;
      baselineLight = -5;
    } else {
      baselineDrawKw = 0; // Total outage
      baselineWater = 0;
      baselineLight = -15; // Complete darkness
      this.state.food_growth = Math.max(0, this.state.food_growth - 10 * (deltaHours / 4));
    }

    const actualBaselineDrawn = Math.min(this.state.power, baselineDrawKw * deltaHours);
    this.state.power -= actualBaselineDrawn;
    this.state.water += baselineWater * (deltaHours / 4);
    this.state.light_cycle += baselineLight * (deltaHours / 4);

    // 4. Machine Demand
    // Emergency O2 generator auto start (< 20) and stop (>= 40)
    if (this.state.stored_o2 < 20) {
      this.isEmergencyO2Active = true;
    } else if (this.state.stored_o2 >= 40) {
      this.isEmergencyO2Active = false;
    }

    let p1DemandKw = 0;
    let p2DemandKw = 0;
    let p3DemandKw = 0;

    let activeScrubbers = 0;
    let activeEmergencyO2 = 0;
    let activeElectrolyzers = 0;
    let activeWaterRecyclers = 0;
    let activeHeaters = 0;
    let activeFarms = 0;

    for (const b of buildings) {
      if (!b.isPowered || b.isEnabled === false) continue;

      if (b.type === 'co2_scrubber') {
        p1DemandKw += 10;
        activeScrubbers++;
      } else if (b.type === 'emergency_o2_generator') {
        if (this.isEmergencyO2Active) {
          p1DemandKw += 10;
          activeEmergencyO2++;
        }
      } else if (b.type === 'subterranean_vault') {
        if (this.state.isSheltering) {
          p1DemandKw += 5;
        }
      } else if (b.type === 'oxygen_electrolyzer') {
        // Oxygen electrolyzer does NOT shut down at night (§User request).
        // It operates day and night as long as enabled by the player and has water
        if (this.state.water >= 0.5) {
          p2DemandKw += 8;
          activeElectrolyzers++;
        }
      } else if (b.type === 'water_recycler') {
        if (this.state.power >= 20) {
          p2DemandKw += 6;
          activeWaterRecyclers++;
        }
      } else if (b.type === 'heating_system') {
        // Heater draws 4 kW whenever active
        p2DemandKw += 4;
        activeHeaters++;
      } else if (b.type === 'hydroponics_tray') {
        if (this.state.power >= 25) {
          p3DemandKw += 12;
          activeFarms++;
        }
      } else if (b.type === 'earth_channel') {
        if (this.state.power >= 25 && this.state.radiation <= 80) {
          p3DemandKw += 3;
        }
      }
    }

    // 5. Allocation by Priority (§6.1 #5 & §6.3)
    const availableKwh = this.state.power;
    const p1Kwh = p1DemandKw * deltaHours;
    const p2Kwh = p2DemandKw * deltaHours;
    const p3Kwh = p3DemandKw * deltaHours;
    const totalDemandKwh = p1Kwh + p2Kwh + p3Kwh;

    let eta1 = 0;
    let eta2 = 0;
    let eta3 = 0;
    let machineEnergyUsedKwh = 0;

    if (availableKwh >= totalDemandKwh) {
      eta1 = 1.0;
      eta2 = 1.0;
      eta3 = 1.0;
      machineEnergyUsedKwh = totalDemandKwh;
      this.state.power -= totalDemandKwh;
    } else {
      // Shortage: serve P1 first, then P2, then P3
      if (availableKwh >= p1Kwh) {
        eta1 = 1.0;
        machineEnergyUsedKwh += p1Kwh;
        const remP1 = availableKwh - p1Kwh;
        if (remP1 >= p2Kwh) {
          eta2 = 1.0;
          machineEnergyUsedKwh += p2Kwh;
          const remP2 = remP1 - p2Kwh;
          eta3 = p3Kwh > 0 ? (remP2 / p3Kwh) : 0;
          machineEnergyUsedKwh += remP2;
          this.state.power = 0;
        } else {
          eta2 = p2Kwh > 0 ? (remP1 / p2Kwh) : 0;
          eta3 = 0;
          machineEnergyUsedKwh += remP1;
          this.state.power = 0;
        }
      } else {
        eta1 = p1Kwh > 0 ? (availableKwh / p1Kwh) : 0;
        eta2 = 0;
        eta3 = 0;
        machineEnergyUsedKwh = availableKwh;
        this.state.power = 0;
      }
    }

    const machineKwConsumed = deltaHours > 0 ? (machineEnergyUsedKwh / deltaHours) : 0;
    this.state.powerKwGenerated = solarGenKw;
    this.state.powerKwConsumed = baselineDrawKw + machineKwConsumed;
    this.state.powerBalanceKw = this.state.powerKwGenerated - this.state.powerKwConsumed;

    // 6. Production & Atmospheric Management
    // The CO2 scrubber does NOT shut down automatically
    const enabledScrubbers = buildings.filter((b) => b.type === 'co2_scrubber' && b.isEnabled !== false).length;
    this.state.co2 = Math.max(0, this.state.co2 - 2.0 * enabledScrubbers * (deltaHours / 4));
    this.state.co2 += 1.0 * (deltaHours / 4); // Crew exhalation

    // Water Recycler output
    this.state.water += 1.5 * eta2 * activeWaterRecyclers * (deltaHours / 4);

    // Temperature is maintained by Heating System (§User request):
    // If the heating system is turned off, temperature is affected and drops!
    const vacuumThermalLoss = (this.isDaylight ? 1.0 : 2.5) * (deltaHours / 4);
    if (activeHeaters > 0) {
      // Heating system is ON: maintains temperature around nominal 50 (21°C)
      if (this.state.temperature < 50) {
        this.state.temperature = Math.min(50, this.state.temperature + 3.0 * (deltaHours / 4) * activeHeaters);
      } else if (this.state.temperature > 50) {
        this.state.temperature = Math.max(50, this.state.temperature - 1.0 * (deltaHours / 4));
      }
    } else {
      // Heating system is OFF: temperature drops towards lunar vacuum cold
      this.state.temperature = Math.max(0, this.state.temperature - vacuumThermalLoss);
    }

    // Oxygen Electrolyzer is responsible for producing oxygen (§User request)
    // Hysteresis loop: on oxygen reaches >= 22%, emission into atmosphere is paused and resumes on <= 19%
    if (this.state.oxygen >= 22.0) {
      this.isO2AtmosphereEmissionPaused = true;
    } else if (this.state.oxygen <= 19.0) {
      this.isO2AtmosphereEmissionPaused = false;
    }

    if (activeElectrolyzers > 0) {
      const waterUsed = Math.min(this.state.water, 0.7 * (deltaHours / 4) * activeElectrolyzers);
      this.state.water -= waterUsed;
      this.state.waterLiters = this.state.water;

      if (!this.isO2AtmosphereEmissionPaused) {
        // Emitting oxygen into the cabin atmosphere:
        this.state.oxygen = Math.min(100, this.state.oxygen + 0.6 * (deltaHours / 4) * activeElectrolyzers);
        // Produced O2 also fills reserve storage
        this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 2.0 * (deltaHours / 4) * activeElectrolyzers);
      } else {
        // Atmospheric emission PAUSED (at >= 22%): all produced O2 routed to reserve tanks
        this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 3.0 * (deltaHours / 4) * activeElectrolyzers);
      }
    }

    // Backup Emergency O2 candle if active
    if (activeEmergencyO2 > 0) {
      this.state.stored_o2 = Math.min(100, this.state.stored_o2 + 2.0 * eta1 * (deltaHours / 4) * activeEmergencyO2);
    }

    if (activeFarms > 0) {
      this.state.food_growth = Math.min(100, this.state.food_growth + 1.0 * eta3 * (deltaHours / 4));
    }

    // Crew respiration draws down atmospheric oxygen (-0.3% per 4h tick) and stored reserves
    this.state.oxygen = Math.max(0, this.state.oxygen - 0.3 * (deltaHours / 4));
    this.state.stored_o2 = Math.max(0, this.state.stored_o2 - 1.0 * (deltaHours / 4));

    if (this.state.stored_o2 <= 0) {
      // Stock empty: atmospheric oxygen begins depleting rapidly
      this.state.oxygen = Math.max(0, this.state.oxygen - 1.5 * (deltaHours / 4));
      this.triggerAlert('oxygen_tank_empty');
    }

    // Hunger and Thirst
    this.state.saturation = Math.max(0, this.state.saturation - 0.8 * (deltaHours / 4));
    this.state.quenching = Math.max(0, this.state.quenching - 1.2 * (deltaHours / 4));
    if (this.state.temperature > 65) {
      this.state.quenching = Math.max(0, this.state.quenching - 1.0 * (deltaHours / 4));
    }

    // Radiation drift towards 100 - effective_protection
    const effectiveProt = this.state.isSheltering
      ? Math.min(100, this.state.radiation_protection + 95)
      : this.state.radiation_protection;
    const targetRadiation = Math.max(0, 100 - effectiveProt);
    if (this.state.radiation < targetRadiation) {
      this.state.radiation = Math.min(targetRadiation, this.state.radiation + 1.0 * (deltaHours / 4));
    } else if (this.state.radiation > targetRadiation) {
      this.state.radiation = Math.max(targetRadiation, this.state.radiation - 1.0 * (deltaHours / 4));
    }

    // Crop bonus rule
    if (this.state.power > 75) {
      this.state.food_growth = Math.min(100, this.state.food_growth + 2 * (deltaHours / 4));
    }

    // Consequence and Threshold Rules
    if (this.state.co2 > 50) {
      this.state.health = Math.max(0, this.state.health - 2 * (deltaHours / 4));
      this.state.enthusiasm = Math.max(0, this.state.enthusiasm - 2 * (deltaHours / 4));
      this.triggerAlert('co2_high');
    }
    if (this.state.co2 > 75) {
      this.state.health = Math.max(0, this.state.health - 6 * (deltaHours / 4));
    }
    if (this.state.co2 >= 95) {
      this.state.health = 0;
      this.triggerAlert('co2_lethal');
    }

    if (this.state.stored_o2 < 20) {
      this.state.enthusiasm = Math.max(0, this.state.enthusiasm - 5 * (deltaHours / 4));
      this.triggerAlert('stored_o2_low');
    }

    // Atmospheric Oxygen Warnings & Flash Fire Incident
    if (this.state.oxygen > 22.0) {
      this.triggerAlert('oxygen_high');
    }

    // High oxygen (> 25%) AND high temperature (> 55) triggers catastrophic flash fire incident (Apollo 1 class)
    if (this.state.oxygen > 25.0 && this.state.temperature > 55.0) {
      this.state.health = 0;
      this.triggerAlert('cabin_fire');
      eventBus.emit('notification', {
        type: 'critical',
        message: `🔥 CATASTROPHIC INCIDENT: Flammable oxygen-enriched atmosphere (${this.state.oxygen.toFixed(1)}%) ignited at elevated temperature (${this.state.temperature.toFixed(0)}°)! Flash fire disaster (Apollo 1 class incident). Mission Failed!`,
      });
    }

    if (this.state.oxygen < 16.0) {
      this.state.health = Math.max(0, this.state.health - 4 * (deltaHours / 4));
      this.triggerAlert('oxygen_cabin_low');
    }
    if (this.state.oxygen < 10.0) {
      this.state.health = Math.max(0, this.state.health - 10 * (deltaHours / 4));
    }
    if (this.state.oxygen <= 0) {
      this.state.health = 0;
      this.triggerAlert('oxygen_cabin_depleted');
    }

    // Thermal limits
    if (this.state.temperature < 35.0) {
      this.state.health = Math.max(0, this.state.health - 2 * (deltaHours / 4));
      this.triggerAlert('cabin_cold');
    }
    if (this.state.temperature < 15.0) {
      this.state.health = Math.max(0, this.state.health - 6 * (deltaHours / 4));
    }
    if (this.state.temperature <= 5.0) {
      this.state.health = 0;
      this.triggerAlert('freezing_lethal');
    }

    if (this.state.radiation > 50) {
      this.state.food_growth = Math.max(0, this.state.food_growth - 3 * deltaHours);
    }
    if (this.state.radiation > 60) {
      this.state.health = Math.max(0, this.state.health - 4 * deltaHours);
      this.state.enthusiasm = Math.max(0, this.state.enthusiasm - 2 * deltaHours);
      this.triggerAlert('radiation_high');
    }
    if (this.state.radiation > 75) {
      this.state.power = Math.max(0, this.state.power - 3 * deltaHours);
    }
    if (this.state.radiation > 80) {
      this.state.health = Math.max(0, this.state.health - 8 * deltaHours);
    }

    if (this.state.saturation <= 0) {
      this.state.health = Math.max(0, this.state.health - 3 * deltaHours);
    }
    if (this.state.quenching <= 0) {
      this.state.health = Math.max(0, this.state.health - 5 * deltaHours);
    }

    // 7. Clamp All Gauges to 0–100 (§6.1 #7 & §1.1 A3)
    this.state.power = Math.max(0, Math.min(this.state.batteryCapacityKwh, this.state.power));
    this.state.stored_o2 = Math.max(0, Math.min(100, this.state.stored_o2));
    this.state.oxygen = Math.max(0, Math.min(100, this.state.oxygen));
    this.state.co2 = Math.max(0, Math.min(100, this.state.co2));
    this.state.temperature = Math.max(0, Math.min(100, this.state.temperature));
    this.state.pressure = Math.max(0, Math.min(100, this.state.pressure));
    this.state.water = Math.max(0, Math.min(100, this.state.water));
    this.state.food = Math.max(0, this.state.food);
    this.state.food_growth = Math.max(0, Math.min(100, this.state.food_growth));
    this.state.radiation = Math.max(0, Math.min(100, this.state.radiation));
    this.state.radiation_protection = Math.max(0, Math.min(100, this.state.radiation_protection));
    this.state.shield = Math.max(0, Math.min(100, this.state.shield));
    this.state.dust = Math.max(0, Math.min(100, this.state.dust));
    this.state.light_cycle = Math.max(0, Math.min(100, this.state.light_cycle));
    this.state.saturation = Math.max(0, Math.min(100, this.state.saturation));
    this.state.quenching = Math.max(0, Math.min(100, this.state.quenching));
    this.state.enthusiasm = Math.max(0, Math.min(100, this.state.enthusiasm));
    this.state.health = Math.max(0, Math.min(100, this.state.health));

    // Synchronize legacy aliases
    this.state.batteryChargeKwh = this.state.power;
    this.state.oxygenKgRemaining = this.state.stored_o2;
    this.state.waterLiters = this.state.water;
    this.state.foodGrowth = this.state.food_growth;
    this.state.radiationProtection = this.state.radiation_protection;
    this.state.lightCycle = this.state.light_cycle;
    this.state.crewHealthAvg = this.state.health;
    this.state.crewMoraleAvg = this.state.enthusiasm;
    this.state.radiationDoseMitigatedPct = effectiveProt;
    this.state.oxygenBalanceKgH = (activeEmergencyO2 * 1.5 + activeElectrolyzers * 2.5 + activeFarms * 0.5) - 3.0;

    eventBus.emit('resources_updated', this.state);
    eventBus.emit('simulation_tick', this.getSnapshot());
  }

  public recalculate(): void {
    const powerResult = this.powerNetwork.calculate(this.grid, this.isDaylight);
    for (const unp of powerResult.unpoweredBuildings) {
      unp.isPowered = false;
    }

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
        if (this.state.power < 25) {
          b.isPowered = false;
          continue;
        }
      }
      if (b.type === 'water_recycler' || b.type === 'heating_system') {
        if (this.state.power < 20) {
          b.isPowered = false;
          continue;
        }
      }

      if (b.isPowered && b.isEnabled !== false) {
        if (b.type === 'solar_array') {
          let sunIntensity = 0;
          if (this.isDaylight) {
            const solInCycle = ((this.state.sol - 1) % 30) + 1;
            const daytimeHour = ((solInCycle - 1) * 24) + this.state.timeOfDayHours;
            const sunAngle = (daytimeHour / 360) * Math.PI;
            sunIntensity = Math.max(0.15, Math.sin(sunAngle));
          }
          totalSolarGen += def.powerGenerationKw * sunIntensity * dustMultiplier;
        } else {
          totalOtherGen += def.powerGenerationKw;
        }

        // Draw consumption only if active
        if (b.type === 'emergency_o2_generator') {
          if (this.isEmergencyO2Active) {
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
    let baselineDrawKw = 2;
    if (this.state.power >= 25) baselineDrawKw = 14;
    else if (this.state.power >= 20) baselineDrawKw = 10;
    else if (this.state.power <= 0) baselineDrawKw = 0;

    this.state.powerKwConsumed = baselineDrawKw + totalConsumed;
    this.state.powerBalanceKw = this.state.powerKwGenerated - this.state.powerKwConsumed;
    this.state.batteryCapacityKwh = 50 + 100 * batteryBanks;
    this.state.oxygenBalanceKgH = totalO2Prod - 3.0;
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
      battery_charge_kwh: this.state.power,
      battery_capacity_kwh: this.state.batteryCapacityKwh,
      oxygen_kg_remaining: this.state.stored_o2,
      crew_health_avg: this.state.health,
      crew_morale_avg: this.state.enthusiasm,
      active_alert: this.state.activeAlert,
    };
  }
}
