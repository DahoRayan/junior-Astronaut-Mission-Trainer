/**
 * NASA Outpost Mathematical & Simulation Oracles (Reference Models)
 * Authoritative mathematical and logical reference implementations
 * derived directly from PROJECT.md, SCOPE.md, and ORIGINAL_REQUEST.md.
 */

import type {
  SolarEphemeris,
  CelestialTimeState,
  ResourceState,
  BuildingDefinition,
  RoverState,
  RoverType,
  TimelineEvent,
  DialogueScene,
} from './types.js';

// ============================================================================
// 1. ASTRONOMICAL ORACLE (R3)
// ============================================================================

export class AstronomicalOracle {
  public static readonly SYNODIC_PERIOD_HOURS = 708.73413;
  public static readonly MEAN_ANGULAR_VELOCITY_RAD_H = (2 * Math.PI) / 708.73413; // ~0.008865363 rad/h
  public static readonly MEAN_ANGULAR_VELOCITY_DEG_H = 360 / 708.73413;           // ~0.5079477 deg/h
  public static readonly MOON_AXIAL_TILT_RAD = 1.5424 * (Math.PI / 180);         // ~0.02692 rad
  public static readonly SHACKLETON_LAT_RAD = -89.9 * (Math.PI / 180);            // -1.56905 rad
  public static readonly EARTHSHINE_COLOR_HEX = 0x82b4ff;
  public static readonly SKY_BACKGROUND_HEX = 0x000000;

  /**
   * Calculates exact solar and earthshine ephemeris for mission hour t.
   */
  public static calculate(
    hours: number,
    options: {
      latitudeRad?: number;
      season?: 'equinox' | 'summer_solstice' | 'winter_solstice';
    } = {}
  ): SolarEphemeris {
    const lat = options.latitudeRad ?? this.SHACKLETON_LAT_RAD;
    const season = options.season ?? 'equinox';

    // Declination depends on lunar seasonal tilt to ecliptic
    let declinationRad = 0;
    if (season === 'summer_solstice') {
      declinationRad = -this.MOON_AXIAL_TILT_RAD; // Southern summer (tilted towards Sun)
    } else if (season === 'winter_solstice') {
      declinationRad = +this.MOON_AXIAL_TILT_RAD; // Southern winter (tilted away from Sun)
    }

    // Wrap hours into [0, SYNODIC_PERIOD_HOURS)
    let t = hours % this.SYNODIC_PERIOD_HOURS;
    if (t < 0) t += this.SYNODIC_PERIOD_HOURS;

    // Azimuth sweeps 360 deg (2pi rad) continuously
    const azimuth = (this.MEAN_ANGULAR_VELOCITY_RAD_H * t) % (2 * Math.PI);

    // Polar grazing elevation equation:
    let sinH: number;
    if (season === 'summer_solstice' || season === 'winter_solstice') {
      sinH = Math.sin(lat) * Math.sin(declinationRad) +
             Math.cos(lat) * Math.cos(declinationRad) * Math.cos(azimuth);
    } else {
      sinH = Math.sin(this.MOON_AXIAL_TILT_RAD) * Math.cos(azimuth);
    }
    const elevation = Math.asin(Math.max(-1, Math.min(1, sinH)));

    // Directional light unit vector pointing from origin to Sun
    // Right-handed coordinate system (+Y up, +X East/right, +Z South/towards viewer)
    const cosH = Math.cos(elevation);
    const dirX = cosH * Math.sin(azimuth);
    const dirY = Math.sin(elevation);
    const dirZ = cosH * Math.cos(azimuth);

    // Normalize
    const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    const sunDirection = {
      x: dirX / len,
      y: dirY / len,
      z: dirZ / len,
    };

    // Earthshine is in phase opposition to Sun (peaks at lunar midnight t = 354.367h)
    // Formula: I_earth = 0.25 * (1 - cos(azimuth)) / 2
    const earthshine = 0.25 * ((1 - Math.cos(azimuth)) / 2);

    // Solar yield factor: if sun is below astronomical horizon, yield is 0;
    // Otherwise proportional to elevation normalized to peak daytime elevation
    const solarYieldFactor = elevation > 0 ? Math.min(1.0, Math.sin(elevation) / Math.sin(this.MOON_AXIAL_TILT_RAD)) : 0;

    return {
      sunAzimuthRad: azimuth,
      sunElevationRad: elevation,
      sunDirection,
      earthshineIntensity: earthshine,
      solarYieldFactor,
    };
  }
}

// ============================================================================
// 2. SIMULATION ORACLE (R4)
// ============================================================================

export class SimulationOracle {
  public static readonly BUILDINGS: Record<string, BuildingDefinition> = {
    solar_array: { type: 'solar_array', name: 'Solar Array', cost: 50, powerDrawKw: 0, priority: 1, category: 'power' },
    battery_bank: { type: 'battery_bank', name: 'Battery Bank', cost: 50, powerDrawKw: 0, priority: 1, category: 'power' },
    kilopower_reactor: { type: 'kilopower_reactor', name: 'Kilopower Reactor', cost: 120, powerDrawKw: 0, priority: 1, category: 'power' },
    emergency_o2_generator: { type: 'emergency_o2_generator', name: 'Emergency O2 Generator', cost: 25, powerDrawKw: 10, priority: 1, category: 'life_support' },
    oxygen_electrolyzer: { type: 'oxygen_electrolyzer', name: 'Oxygen Electrolyzer', cost: 60, powerDrawKw: 8, priority: 2, category: 'life_support' },
    co2_scrubber: { type: 'co2_scrubber', name: 'CO2 Scrubber', cost: 35, powerDrawKw: 10, priority: 1, category: 'life_support' },
    water_recycler: { type: 'water_recycler', name: 'Water Recycler', cost: 30, powerDrawKw: 6, priority: 2, category: 'resource' },
    heating_system: { type: 'heating_system', name: 'Habitat Heating Loop', cost: 40, powerDrawKw: 4, priority: 2, category: 'thermal' },
    crew_habitat: { type: 'crew_habitat', name: 'Rigid Crew Habitat', cost: 80, powerDrawKw: 5, priority: 1, category: 'structure' },
    regolith_shield: { type: 'regolith_shield', name: 'Regolith Radiation Shield', cost: 40, powerDrawKw: 0, priority: 1, category: 'structure' },
    subterranean_vault: { type: 'subterranean_vault', name: 'Storm Vault', cost: 80, powerDrawKw: 5, priority: 1, category: 'structure' },
    hydroponics_tray: { type: 'hydroponics_tray', name: 'Hydroponics Bay', cost: 45, powerDrawKw: 12, priority: 3, category: 'resource' },
    water_extractor: { type: 'water_extractor', name: 'Ice Water Extractor', cost: 70, powerDrawKw: 15, priority: 2, category: 'resource' },
    earth_channel: { type: 'earth_channel', name: 'Deep Space Comms Channel', cost: 60, powerDrawKw: 3, priority: 3, category: 'comms' },
  };

  /**
   * Creates nominal baseline state for Sol 1.
   */
  public static createInitialState(): ResourceState {
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
    };
  }

  /**
   * Advances simulation state by 1 standard tick (deltaHours = 4.0 or custom).
   */
  public static tick(
    state: ResourceState,
    deltaHours = 4.0,
    options: {
      isDaylight?: boolean;
      activeBuildings?: string[];
      externalRadiation?: number;
    } = {}
  ): { nextState: ResourceState; alerts: string[] } {
    if (state.isPaused) {
      return { nextState: { ...state }, alerts: [] };
    }

    const s = { ...state };
    const alerts: string[] = [];
    const isDaylight = options.isDaylight ?? true;
    const buildings = options.activeBuildings ?? [
      'solar_array', 'battery_bank', 'crew_habitat',
      'co2_scrubber', 'heating_system', 'oxygen_electrolyzer', 'water_recycler'
    ];

    // 1. Time Advancement
    s.timeOfDayHours += deltaHours;
    while (s.timeOfDayHours >= 24.0) {
      s.timeOfDayHours -= 24.0;
      s.sol += 1;
    }

    // 2. Power Priority Calculation
    let solarGenKw = isDaylight ? 60 * Math.max(0, 1 - s.dust / 100) : 0;
    let powerGenKwh = solarGenKw * deltaHours;
    let powerAvailable = s.power + powerGenKwh;

    // Categorize building draws
    let p1Draw = 0;
    let p2Draw = 0;
    let p3Draw = 0;

    for (const bType of buildings) {
      const b = this.BUILDINGS[bType];
      if (!b) continue;
      const draw = b.powerDrawKw * deltaHours;
      if (b.priority === 1) p1Draw += draw;
      else if (b.priority === 2) p2Draw += draw;
      else if (b.priority === 3) p3Draw += draw;
    }

    let p1Fraction = 1.0;
    let p2Fraction = 1.0;
    let p3Fraction = 1.0;

    if (powerAvailable >= p1Draw + p2Draw + p3Draw) {
      powerAvailable -= (p1Draw + p2Draw + p3Draw);
    } else if (powerAvailable >= p1Draw + p2Draw) {
      powerAvailable -= (p1Draw + p2Draw);
      p3Fraction = powerAvailable / (p3Draw || 1);
      powerAvailable = 0;
      alerts.push('load_shed_p3');
    } else if (powerAvailable >= p1Draw) {
      powerAvailable -= p1Draw;
      p2Fraction = powerAvailable / (p2Draw || 1);
      p3Fraction = 0;
      powerAvailable = 0;
      alerts.push('load_shed_p2');
    } else {
      p1Fraction = powerAvailable / (p1Draw || 1);
      p2Fraction = 0;
      p3Fraction = 0;
      powerAvailable = 0;
      alerts.push('load_shed_p1_blackout');
    }
    s.power = Math.max(0, powerAvailable);

    // 3. Respiration & Oxygen Electrolyzer Loop
    const rate = deltaHours / 4.0;
    // Respiration: -0.3% O2 per tick (scaled by rate)
    s.oxygen -= 0.3 * rate;

    // Electrolyzer hysteresis: pauses atmospheric injection if O2 >= 22.0%, resumes if <= 19.0%
    const electrolyzerActive = buildings.includes('oxygen_electrolyzer') && p2Fraction > 0.5 && s.water >= 0.5;
    if (electrolyzerActive) {
      if (s.oxygen < 22.0) {
        s.oxygen += 0.6 * p2Fraction * rate;
        s.stored_o2 = Math.min(100, s.stored_o2 + 2.0 * p2Fraction * rate);
        s.water = Math.max(0, s.water - 0.7 * deltaHours);
      }
    }

    // 4. Exhalation & CO2 Scrubbing
    s.co2 += 1.0 * rate;
    if (buildings.includes('co2_scrubber') && p1Fraction > 0.5) {
      s.co2 = Math.max(0, s.co2 - 2.0 * p1Fraction * rate);
    }

    // 5. Thermal Loop & Vacuum Heat Loss
    const passiveLoss = isDaylight ? 1.0 : 2.5;
    s.temperature -= passiveLoss * rate;
    if (s.temperature < 50.0 && buildings.includes('heating_system') && p2Fraction > 0.5) {
      s.temperature = Math.min(50.0, s.temperature + 3.0 * p2Fraction * rate);
    }

    // 6. Dust Accumulation
    s.dust = Math.min(100, s.dust + 0.5 * rate);

    // 7. Radiation & Storm Vault
    const ambientRad = options.externalRadiation ?? (s.isSheltered ? 5.0 : 20.0);
    const effectiveProt = s.isSheltered ? 95.0 : s.radiation_protection;
    const targetRad = Math.max(0, 100 - effectiveProt);
    s.radiation += (targetRad - s.radiation) * 0.1 * rate;

    // 8. O2 Crisis Timer Countdown (Sol 2 valve fracture)
    if (s.o2CrisisTimerHours !== undefined) {
      s.o2CrisisTimerHours = Math.max(0, s.o2CrisisTimerHours - deltaHours);
      if (s.o2CrisisTimerHours === 0 && !s.o2ResupplyOrdered) {
        s.stored_o2 = 0;
        s.oxygen = 0;
        s.health = 0;
        alerts.push('life_support_failed_casualty');
      }
    }

    // 9. Lethal Threshold Checks
    // Apollo 1 Flash Fire: O2 > 25.0% AND Temp > 55.0
    if (s.oxygen > 25.0 && s.temperature > 55.0) {
      s.health = 0;
      alerts.push('cabin_fire');
    }

    // Lethal CO2 Poisoning: CO2 >= 95.0
    if (s.co2 >= 95.0) {
      s.health = 0;
      alerts.push('co2_lethal');
    }

    // Deep Freeze: Temp <= 5.0
    if (s.temperature <= 5.0) {
      s.health = 0;
      alerts.push('freezing_lethal');
    }

    // Hypoxia: Oxygen <= 0%
    if (s.oxygen <= 0) {
      s.health = 0;
      alerts.push('hypoxia_lethal');
    }

    // Extreme Radiation: Radiation > 80
    if (s.radiation > 80.0) {
      s.health = Math.max(0, s.health - 8.0);
      alerts.push('radiation_critical');
    }

    // Clamp variables to [0, 100]
    s.oxygen = Math.max(0, Math.min(100, s.oxygen));
    s.co2 = Math.max(0, Math.min(100, s.co2));
    s.temperature = Math.max(0, Math.min(100, s.temperature));
    s.health = Math.max(0, Math.min(100, s.health));
    s.radiation = Math.max(0, Math.min(100, s.radiation));

    return { nextState: s, alerts };
  }

  /**
   * Action: Clean solar panels.
   */
  public static cleanSolarPanels(state: ResourceState): { nextState: ResourceState; success: boolean } {
    if (state.power < 1.0) return { nextState: state, success: false };
    return {
      nextState: {
        ...state,
        power: state.power - 1.0,
        dust: Math.max(0, state.dust - 25.0),
      },
      success: true,
    };
  }

  /**
   * Action: Order emergency Earth O2 resupply.
   */
  public static orderEarthResupply(state: ResourceState): ResourceState {
    return {
      ...state,
      o2ResupplyOrdered: true,
    };
  }

  /**
   * Action: Land emergency Earth resupply (Sol 4).
   */
  public static landEarthResupply(state: ResourceState): ResourceState {
    return {
      ...state,
      stored_o2: 100.0,
      oxygen: 21.0,
      water: Math.min(100, state.water + 50.0),
      food: state.food + 20,
      enthusiasm: Math.min(100, state.enthusiasm + 10.0),
      o2CrisisTimerHours: undefined,
    };
  }
}

// ============================================================================
// 3. ROVER ORACLE (R2/R4)
// ============================================================================

export class RoverOracle {
  public static readonly ROVER_TYPES: RoverType[] = [
    'open_lrv',
    'pressurized_traverse',
    'robotic_survey',
    'excavator',
    'cargo_hauler',
  ];

  public static createRover(id: string, type: RoverType): RoverState {
    return {
      id,
      type,
      status: 'idle',
      batteryPct: 100.0,
      position: { x: 0, y: 0, z: 0 },
    };
  }

  public static dispatch(
    rover: RoverState,
    target: { x: number; y: number; z: number },
    task = 'transit'
  ): RoverState {
    const dx = target.x - rover.position.x;
    const dy = target.y - rover.position.y;
    const dz = target.z - rover.position.z;
    const distMeters = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 5% battery per 100 meters
    const drain = (distMeters / 100.0) * 5.0;

    return {
      ...rover,
      status: 'en_route',
      targetPosition: target,
      currentTask: task,
      batteryPct: Math.max(0, rover.batteryPct - drain),
    };
  }

  public static completeTask(rover: RoverState): RoverState {
    return {
      ...rover,
      status: 'idle',
      position: rover.targetPosition ?? rover.position,
      targetPosition: undefined,
      currentTask: undefined,
    };
  }
}

// ============================================================================
// 4. NARRATIVE ORACLE (R4)
// ============================================================================

export class NarrativeOracle {
  public static readonly TIMELINE_EVENTS: TimelineEvent[] = [
    { id: 'E-LANDING', sol: 1, hour: 6, title: 'Touchdown on Shackleton Rim', type: 'landing', sceneId: 'S-PRO-1' },
    { id: 'E-HAB-SETUP', sol: 1, hour: 7, title: 'Habitat Pressurization', type: 'setup', sceneId: 'S-C1-1' },
    { id: 'E-O2-VALVE-FRACTURE', sol: 2, hour: 6, title: 'Primary O2 Tank Valve Fracture', type: 'oxygen_leak', sceneId: 'S-C1-2', crisisTimerHours: 48 },
    { id: 'E-RESUPPLY-LANDS', sol: 4, hour: 8, title: 'Falcon Heavy Resupply Touchdown', type: 'resupply_arrival', sceneId: 'S-C1-3' },
    { id: 'E-LONG-NIGHT-START', sol: 7, hour: 0, title: 'Polar Mountain Eclipse Shadow Entry', type: 'lunar_night', sceneId: 'S-C2-1' },
    { id: 'E-BATTERY-FREEZE', sol: 7, hour: 12, title: 'Battery Bank Thermal Line Freeze', type: 'thermal_failure', sceneId: 'S-C2-2' },
    { id: 'E-SOLAR-FLARE', sol: 10, hour: 6, title: 'NASA DONKI Category X Solar Flare Alert', type: 'solar_flare', sceneId: 'S-C3-1' },
    { id: 'E-RADIATION-IMPACT', sol: 10, hour: 8, title: '140 mSv/h CME Shockwave Arrival', type: 'radiation_storm', sceneId: 'S-C3-2' },
    { id: 'E-RATIONS-LOW', sol: 11, hour: 6, title: 'Final Earth Rations Week', type: 'food_shortage', sceneId: 'S-C4-1' },
    { id: 'E-HYDROPONICS', sol: 12, hour: 8, title: 'CSA Hydroponic Radish Harvest', type: 'resource_gain', sceneId: 'S-C4-2' },
    { id: 'E-CATASTROPHE', sol: 14, hour: 6, title: 'Moonquake 5.2 & Dust Storm', type: 'compound_failure', sceneId: 'S-C5-1' },
    { id: 'E-RESCUE', sol: 14, hour: 10, title: 'Commander Ruiz Airlock Rescue', type: 'rescue', sceneId: 'S-C5-2' },
    { id: 'E-DEBRIEF', sol: 15, hour: 6, title: 'NASA Artemis Commendation', type: 'debrief', sceneId: 'S-EPI-1' },
    { id: 'E-MARS-TRANSMISSION', sol: 15, hour: 8, title: 'Mars Logistics Hook & Endless Mode', type: 'hook', sceneId: 'S-EPI-2' },
  ];

  public static readonly DIALOGUE_SCENE_IDS: string[] = [
    'S-PRO-1', 'S-BASE-TOUR', 'S-C1-1', 'S-C1-2', 'S-C1-3',
    'S-C2-1', 'S-C2-2', 'S-C3-1', 'S-C3-2', 'S-C4-1',
    'S-C4-2', 'S-C5-1', 'S-C5-2', 'S-EPI-1', 'S-EPI-2',
  ];
}
