import type { ResourceState, SolarEphemeris, BuildingProductionRates } from '../core/types';

export interface TickAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export class SimulationEngine {
  public state: ResourceState;
  public alerts: TickAlert[] = [];
  public activeAlertKeys: Set<string> = new Set();
  public buildingProduction: BuildingProductionRates = {
    extraSolarKw: 0,
    extraContinuousKw: 0,
    extraBatteryKwh: 0,
    foodPerTick: 0,
    waterPerTick: 0,
    o2PerTick: 0,
    materialsPerTick: 0,
  };

  constructor() {
    this.state = this.createInitialState();
  }

  public setBuildingProduction(rates: Partial<BuildingProductionRates>): void {
    this.buildingProduction = {
      ...this.buildingProduction,
      ...rates,
    };
    this.state.buildingProduction = this.buildingProduction;
    this.state.continuousPowerKw = this.buildingProduction.extraContinuousKw;
    this.state.maxBattery = 1000.0 + this.buildingProduction.extraBatteryKwh;
  }

  public createInitialState(): ResourceState {
    return {
      power: 850,
      stored_o2: 80,
      oxygen: 20.9,
      co2: 10.0,
      temperature: 50.0, // 21°C
      pressure: 100.0,   // 101.3 kPa
      water: 60.0,
      food: 30,
      food_growth: 0.0,
      radiation: 5.0,
      radiation_protection: 70.0,
      shield: 70.0,
      dust: 0.0,
      light_cycle: 100.0,
      saturation: 80.0,
      quenching: 80.0,
      enthusiasm: 95.0,
      health: 100.0,
      sol: 1,
      timeOfDayHours: 6.0,
      isSheltered: false,
      o2ResupplyOrdered: false,
      o2CrisisTimerHours: undefined,
      isPaused: false,
      materials: 800,
      crew: 4,
      maxCrew: 8,
      cityLevel: 1,
      placedCount: 0,
    };
  }

  /**
   * Advances ECLSS simulation physics by deltaHours.
   */
  public tick(
    deltaHours: number,
    ephemeris?: SolarEphemeris
  ): { nextState: ResourceState; newAlerts: TickAlert[] } {
    if (this.state.isPaused || deltaHours <= 0) {
      return { nextState: this.state, newAlerts: [] };
    }

    const s = this.state;
    const newAlerts: TickAlert[] = [];
    const isDaylight = ephemeris ? ephemeris.sunElevationRad > 0 : true;
    const solarYield = ephemeris ? ephemeris.solarYieldFactor : 1.0;
    const rate = deltaHours / 4.0; // 4h nominal reference tick

    // 1. Clock Advancement
    s.timeOfDayHours += deltaHours;
    while (s.timeOfDayHours >= 24.0) {
      s.timeOfDayHours -= 24.0;
      s.sol += 1;
    }

    // 2. Power Generation & Load Shedding
    // 8 Solar Arrays = 480 kW nominal, scaled by dust and polar sun elevation + placed solar structures
    const totalSolarKw = 480.0 + (this.buildingProduction?.extraSolarKw ?? 0);
    const solarGenKw = isDaylight ? totalSolarKw * Math.max(0, 1.0 - s.dust / 100.0) * solarYield : 0.0;
    // Continuous generation (e.g. Kilopower Nuclear Reactor runs 24/7 day and night)
    const continuousGenKw = this.buildingProduction?.extraContinuousKw ?? 0;
    const powerGenKwh = (solarGenKw + continuousGenKw) * deltaHours;
    let powerAvailable = s.power + powerGenKwh;

    // Outpost Power Draws
    const p1DrawKw = 25.0; // Life support (ECLSS, O2, Scrubbers)
    const p2DrawKw = 20.0; // Thermal heating & water recycling
    const p3DrawKw = 15.0; // Hydroponics bay & Earth comms

    const p1Total = p1DrawKw * deltaHours;
    const p2Total = p2DrawKw * deltaHours;
    const p3Total = p3DrawKw * deltaHours;

    let p1Frac = 1.0;
    let p2Frac = 1.0;
    let p3Frac = 1.0;

    if (powerAvailable >= p1Total + p2Total + p3Total) {
      powerAvailable -= (p1Total + p2Total + p3Total);
    } else if (powerAvailable >= p1Total + p2Total) {
      powerAvailable -= (p1Total + p2Total);
      p3Frac = powerAvailable / (p3Total || 1);
      powerAvailable = 0;
      this.addAlert('load_shed_p3', 'warning', '⚡ Priority 3 Load Shed: Hydroponics & Research paused to conserve power.', newAlerts);
    } else if (powerAvailable >= p1Total) {
      powerAvailable -= p1Total;
      p2Frac = powerAvailable / (p2Total || 1);
      p3Frac = 0;
      powerAvailable = 0;
      this.addAlert('load_shed_p2', 'warning', '⚡ Priority 2 Load Shed: Water Recycling & Secondary Heaters disabled.', newAlerts);
    } else {
      p1Frac = powerAvailable / (p1Total || 1);
      p2Frac = 0;
      p3Frac = 0;
      powerAvailable = 0;
      this.addAlert('load_shed_p1_blackout', 'critical', '🚨 CRITICAL BLACKOUT: Main battery bus exhausted! Life Support operating on emergency reserves!', newAlerts);
    }
    const maxBattery = 1000.0 + (this.buildingProduction?.extraBatteryKwh ?? 0);
    s.power = Math.min(maxBattery, Math.max(0, powerAvailable));

    // 3. Respiration & Oxygen Electrolyzer Loop + Placed Greenhouses & Life Support Skids
    s.oxygen -= 0.3 * rate;
    s.food_growth = Math.min(100.0, s.food_growth + 0.5 * p3Frac * rate);

    // Food production from hydroponic greenhouses
    if (this.buildingProduction?.foodPerTick && this.buildingProduction.foodPerTick > 0) {
      s.food = Math.min(100.0, s.food + this.buildingProduction.foodPerTick * rate);
    }

    // Water production from water extraction skids
    if (this.buildingProduction?.waterPerTick && this.buildingProduction.waterPerTick > 0) {
      s.water = Math.min(100.0, s.water + this.buildingProduction.waterPerTick * rate);
    }

    // Oxygen production from oxygen extraction plant skids
    if (this.buildingProduction?.o2PerTick && this.buildingProduction.o2PerTick > 0) {
      s.stored_o2 = Math.min(100.0, s.stored_o2 + this.buildingProduction.o2PerTick * rate);
    }

    // Electrolyzer hysteresis: pauses atmospheric emission at >= 22.0%, resumes if <= 19.0%
    if (p2Frac > 0.5 && s.water >= 0.5) {
      if (s.oxygen < 22.0) {
        s.oxygen += 0.6 * p2Frac * rate;
        s.stored_o2 = Math.min(100.0, s.stored_o2 + 2.0 * p2Frac * rate);
        s.water = Math.max(0, s.water - 0.7 * rate);
      }
    } else if (s.oxygen < 20.0 && s.stored_o2 > 0) {
      // Emergency regulator replenishment from stored tanks
      const needed = 20.0 - s.oxygen;
      const injected = Math.min(needed, s.stored_o2, 1.0 * rate);
      s.oxygen += injected;
      s.stored_o2 = Math.max(0, s.stored_o2 - injected);
    }

    // 4. Exhalation & CO2 Scrubbing
    s.co2 += 1.0 * rate;
    if (p1Frac > 0.5) {
      s.co2 = Math.max(0, s.co2 - 2.0 * p1Frac * rate);
    }

    // 5. Thermal Control Loop & Passive Heat Loss
    const passiveLoss = isDaylight ? 1.0 : 2.5;
    s.temperature -= passiveLoss * rate;
    if (s.temperature < 50.0 && p2Frac > 0.5) {
      s.temperature = Math.min(50.0, s.temperature + 3.0 * p2Frac * rate);
    }

    // 6. Dust Accumulation
    s.dust = Math.min(100.0, s.dust + 0.5 * rate);

    // 7. Radiation & Storm Vault
    const effectiveProt = s.isSheltered ? 95.0 : s.radiation_protection;
    const targetRad = Math.max(0, 100.0 - effectiveProt);
    s.radiation += (targetRad - s.radiation) * 0.1 * rate;

    // 8. Sol 2 O2 Valve Crisis Countdown
    if (s.o2CrisisTimerHours !== undefined) {
      s.o2CrisisTimerHours = Math.max(0, s.o2CrisisTimerHours - deltaHours);
      if (s.o2CrisisTimerHours === 0 && !s.o2ResupplyOrdered) {
        s.stored_o2 = 0;
        s.oxygen = 0;
        s.health = 0;
        this.addAlert('life_support_failed_casualty', 'critical', '💀 MISSION FAILED: 48-Hour O2 Crisis Timer expired without Earth Resupply. Crew suffocated.', newAlerts);
      }
    }

    // 9. Consequence & Lethality Threshold Checks
    // Apollo 1 Flash Fire: O2 > 25.0% AND Temp > 55.0
    if (s.oxygen > 25.0 && s.temperature > 55.0) {
      s.health = 0;
      this.addAlert('cabin_fire', 'critical', '🔥 CATASTROPHIC INCIDENT: Flammable oxygen-enriched atmosphere ignited! Flash fire disaster.', newAlerts);
    }

    // Lethal CO2 Poisoning: CO2 >= 95.0
    if (s.co2 >= 95.0) {
      s.health = 0;
      this.addAlert('co2_lethal', 'critical', '💀 FATAL HYPERCAPNIA: Cabin CO2 concentration reached lethal toxic saturation (>= 95 u).', newAlerts);
    }

    // Deep Freeze: Temp <= 5.0
    if (s.temperature <= 5.0) {
      s.health = 0;
      this.addAlert('freezing_lethal', 'critical', '❄️ HYPOTHERMIA FATALITY: Habitat heating bus failure resulted in fatal freezing.', newAlerts);
    }

    // Hypoxia: Oxygen <= 0
    if (s.oxygen <= 0) {
      s.health = 0;
      this.addAlert('hypoxia_lethal', 'critical', '💀 FATAL HYPOXIA: Cabin oxygen depleted.', newAlerts);
    }

    // Extreme Radiation: Radiation > 80
    if (s.radiation > 80.0) {
      s.health = Math.max(0, s.health - 8.0 * rate);
      this.addAlert('radiation_critical', 'critical', '☢️ RADIATION SICKNESS: Surface dosage exceeded 80 mSv! Vault evacuation mandatory.', newAlerts);
    }

    // Passive regolith prospecting & materials resupply + placed workshop/mining bonuses
    if (s.materials !== undefined) {
      const bonusMaterials = (this.buildingProduction?.materialsPerTick ?? 0) * rate;
      s.materials = Math.min(9999, s.materials + 1.5 * rate + bonusMaterials);
    }

    // Clamp variables to nominal operational bounds [0, 100]
    s.oxygen = Math.max(0, Math.min(100.0, s.oxygen));
    s.stored_o2 = Math.max(0, Math.min(100.0, s.stored_o2));
    s.co2 = Math.max(0, Math.min(100.0, s.co2));
    s.temperature = Math.max(0, Math.min(100.0, s.temperature));
    s.health = Math.max(0, Math.min(100.0, s.health));
    s.radiation = Math.max(0, Math.min(100.0, s.radiation));
    s.water = Math.max(0, Math.min(100.0, s.water));
    s.food = Math.max(0, Math.min(100.0, s.food));
    s.dust = Math.max(0, Math.min(100.0, s.dust));
    s.power = Math.max(0, Math.min(maxBattery, s.power));
    if (s.materials !== undefined) {
      s.materials = Math.max(0, Math.min(9999, s.materials));
    }

    return { nextState: s, newAlerts };
  }

  public syncTime(sol: number, timeOfDayHours: number): void {
    this.state.sol = sol;
    this.state.timeOfDayHours = timeOfDayHours;
  }

  public setTime(totalHours: number): void {
    this.state.sol = Math.floor(totalHours / 24.0) + 1;
    this.state.timeOfDayHours = totalHours % 24.0;
  }

  private addAlert(id: string, level: 'info' | 'warning' | 'critical', message: string, list: TickAlert[]): void {
    if (!this.activeAlertKeys.has(id)) {
      this.activeAlertKeys.add(id);
      const alert: TickAlert = {
        id,
        level,
        message,
        timestamp: `Sol ${this.state.sol} ${this.state.timeOfDayHours.toFixed(1)}h`,
      };
      this.alerts.unshift(alert);
      list.push(alert);
    }
  }

  public cleanSolarPanels(): { success: boolean; nextDust: number } {
    if (this.state.power < 1.0) {
      return { success: false, nextDust: this.state.dust };
    }
    this.state.power -= 1.0;
    this.state.dust = Math.max(0, this.state.dust - 25.0);
    return { success: true, nextDust: this.state.dust };
  }

  public orderEarthResupply(): void {
    this.state.o2ResupplyOrdered = true;
    this.alerts.unshift({
      id: 'resupply_ordered',
      level: 'info',
      message: '🚀 Deep Space Network confirmed: Falcon Heavy Cargo Lander en route from Kennedy Space Center.',
      timestamp: `Sol ${this.state.sol} ${this.state.timeOfDayHours.toFixed(1)}h`,
    });
  }

  public landEarthResupply(): void {
    this.state.o2CrisisTimerHours = undefined;
    this.state.stored_o2 = 100.0;
    this.state.oxygen = 21.0;
    this.activeAlertKeys.delete('o2_valve_fracture');
    this.alerts.unshift({
      id: 'cargo_touchdown',
      level: 'info',
      message: '📦 Cargo Lander Touchdown on Sintered Pad! 10,000 kg liquid oxygen delivered. ECLSS fully nominal.',
      timestamp: `Sol ${this.state.sol} ${this.state.timeOfDayHours.toFixed(1)}h`,
    });
  }

  public toggleShelter(): boolean {
    this.state.isSheltered = !this.state.isSheltered;
    return this.state.isSheltered;
  }

  public canAfford(cost: number): boolean {
    return (this.state.materials ?? 0) >= cost;
  }

  public spendMaterials(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.state.materials = (this.state.materials ?? 0) - cost;
    return true;
  }

  public refundMaterials(amount: number): void {
    this.state.materials = (this.state.materials ?? 0) + amount;
  }
}
