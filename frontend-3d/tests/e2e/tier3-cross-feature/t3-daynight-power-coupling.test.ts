/**
 * Tier 3: Cross-Feature Combinations — R3 (Day-Night) + R4 (Simulation Power Grid)
 * Verifies that astronomical solar elevation drives solar array power generation,
 * polar shadow entry triggers battery depletion, and darkness accelerates habitat cooling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { AstronomicalOracle, SimulationOracle } from '../harness/fixtures.js';

describe('Tier 3 — Cross-Feature: R3 Ephemeris + R4 Power Simulation Coupling', () => {
  it('T3-01: Solar Elevation Directly Drives Solar Power Generation Efficiency', () => {
    // Peak solar elevation at noon during southern summer
    const ephemNoon = AstronomicalOracle.calculate(0.0, { season: 'summer_solstice' });
    assert.ok(ephemNoon.sunElevationRad > 0, 'Noon solar elevation must be positive');
    assert.ok(ephemNoon.solarYieldFactor > 0.8, 'Noon solar yield factor should be near 1.0');

    // Ephemeris at night / shadow (sun below horizon)
    const ephemNight = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS / 2, { season: 'equinox' });
    assert.strictEqual(ephemNight.solarYieldFactor, 0.0, 'Nocturnal solar yield factor must be 0.0');

    // Simulate power generation coupling
    const baseSolarKw = 60.0;
    const noonGenKw = baseSolarKw * ephemNoon.solarYieldFactor;
    const nightGenKw = baseSolarKw * ephemNight.solarYieldFactor;

    assertApprox(noonGenKw, 60.0, 10.0, 'Daylight solar generation should produce ~60 kW');
    assert.strictEqual(nightGenKw, 0.0, 'Nocturnal solar generation must produce 0.0 kW');
  });

  it('T3-02: Polar Mountain Shadow Entry Depletes Battery Reserve Without Grid Blackout', () => {
    let state = SimulationOracle.createInitialState();
    state.power = 400.0; // 400 kWh in battery bank

    // Active life support & thermal buildings drawing ~25 kW
    const buildings = ['crew_habitat', 'co2_scrubber', 'heating_system', 'battery_bank'];

    // Simulate 8 hours of polar darkness (2 ticks)
    for (let tick = 0; tick < 2; tick++) {
      const { nextState } = SimulationOracle.tick(state, 4.0, {
        isDaylight: false, // 0 kW solar yield
        activeBuildings: buildings,
      });
      state = nextState;
    }

    // Battery should have discharged to cover 8h * (5+10+4) kW = ~152 kWh
    assert.ok(state.power < 400.0, 'Battery bank must discharge to sustain unpowered night');
    assertRange(state.power, 200.0, 300.0, 'Battery remaining after 8 hours of polar shadow');
    assert.strictEqual(state.health, 100, 'Crew health preserved during nominal battery discharge');
  });

  it('T3-03: Sustained 48h Lunar Mountain Eclipse Forces Battery Depletion & Load Shedding', () => {
    let state = SimulationOracle.createInitialState();
    state.power = 150.0; // Limited initial battery

    const buildings = [
      'crew_habitat',        // P1: 5 kW
      'co2_scrubber',        // P1: 10 kW
      'heating_system',      // P2: 4 kW
      'oxygen_electrolyzer', // P2: 8 kW
      'hydroponics_tray',    // P3: 12 kW
    ];

    let p3SheddingTriggered = false;
    let blackoutTriggered = false;

    // Simulate 48 hours of continuous night (12 ticks of 4 hours)
    for (let tick = 0; tick < 12; tick++) {
      const { nextState, alerts } = SimulationOracle.tick(state, 4.0, {
        isDaylight: false,
        activeBuildings: buildings,
      });
      state = nextState;
      if (alerts.includes('load_shed_p3')) p3SheddingTriggered = true;
      if (alerts.includes('load_shed_p1_blackout')) blackoutTriggered = true;
    }

    assert.ok(p3SheddingTriggered, 'Load-shedding must deactivate P3 (hydroponics)');
    assert.ok(blackoutTriggered, 'Sustained night without power input leads to critical battery exhaustion');
    assert.strictEqual(state.power, 0.0, 'Battery completely exhausted after 48h eclipse without nuclear reactor');
  });

  it('T3-04: Nocturnal Passive Thermal Dissipation Rate Invariance', () => {
    // In daytime, solar radiation offsets habitat thermal loss (-1.0/tick)
    const stateDay = SimulationOracle.createInitialState();
    const resDay = SimulationOracle.tick(stateDay, 4.0, { isDaylight: true, activeBuildings: [] });

    // In polar night, vacuum thermal radiative loss accelerates (-2.5/tick)
    const stateNight = SimulationOracle.createInitialState();
    const resNight = SimulationOracle.tick(stateNight, 4.0, { isDaylight: false, activeBuildings: [] });

    const dayLoss = stateDay.temperature - resDay.nextState.temperature;
    const nightLoss = stateNight.temperature - resNight.nextState.temperature;

    assertApprox(dayLoss, 1.0, 1e-4, 'Daytime unheated thermal loss');
    assertApprox(nightLoss, 2.5, 1e-4, 'Nighttime unheated thermal loss');
    assert.ok(nightLoss > dayLoss, 'Night thermal dissipation must exceed daytime rate');
  });

  it('T3-05: Sunrise Restores Full Solar Generation and Recharges Battery Grid', () => {
    let state = SimulationOracle.createInitialState();
    state.power = 50.0; // Discharged battery
    state.dust = 0.0;   // Clean panels

    // Transition to daytime at peak elevation (60 kW solar generation)
    // Habitat draw: 5 kW (habitat) + 10 kW (scrubber) = 15 kW draw
    // Surplus: 60 - 15 = 45 kW net charging per hour
    const { nextState } = SimulationOracle.tick(state, 4.0, {
      isDaylight: true,
      activeBuildings: ['crew_habitat', 'co2_scrubber', 'solar_array', 'battery_bank'],
    });

    // Over 4 hours, surplus energy is 4h * 45 kW = 180 kWh
    // Battery = 50 + 180 = 230 kWh
    assert.ok(nextState.power > state.power, 'Solar sunrise must recharge battery reserves');
    assertApprox(nextState.power, 230.0, 5.0, 'Battery level after 4 hours of post-dawn solar charging');
  });
});
