/**
 * Tier 2: Boundary & Corner Cases — R4: Simulation Extremes & Life-Support Failure Thresholds
 * Verifies 48h valve crisis timeout casualty, Apollo 1 flash fire (O2>25% & T>55),
 * lethal CO2 (>=95), deep freeze (T<=5), total blackout, and player action clock invariance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { SimulationOracle } from '../harness/fixtures.js';

describe('Tier 2 — R4: Simulation Boundary & Compound Hazard Cases', () => {
  it('R4-T2-01: 48-Hour Valve Crisis Timeout Casualty', () => {
    let state = SimulationOracle.createInitialState();
    state.o2CrisisTimerHours = 48.0;
    state.o2ResupplyOrdered = false;

    // Advance 44 hours: crisis timer reaches 4 hours, crew is still alive
    for (let i = 0; i < 11; i++) {
      const res = SimulationOracle.tick(state, 4.0, { isDaylight: true });
      state = res.nextState;
    }
    assertApprox(state.o2CrisisTimerHours!, 4.0, 0.1, 'Crisis timer after 44h');
    assert.ok(state.health > 0, 'Crew alive before 48h crisis timeout');

    // Advance final 4 hours to reach 48h timeout: resupply was never ordered
    const resFinal = SimulationOracle.tick(state, 4.0, { isDaylight: true });
    state = resFinal.nextState;

    assert.strictEqual(state.o2CrisisTimerHours, 0.0, 'Crisis timer reached 0');
    assert.strictEqual(state.stored_o2, 0, 'Oxygen depleted on crisis timeout');
    assert.strictEqual(state.health, 0, 'Casualty occurred on crisis timeout');
    assert.ok(
      resFinal.alerts.includes('life_support_failed_casualty'),
      'Alert life_support_failed_casualty must be emitted'
    );
  });

  it('R4-T2-02: Apollo 1 Class Atmospheric Flash Fire Disaster (O2 > 25.0% & Temp > 55.0)', () => {
    let state = SimulationOracle.createInitialState();
    state.oxygen = 26.5;    // Hyperoxic atmosphere (> 25.0%)
    state.temperature = 58.0; // Overheated cabin (> 55.0 = 25°C+)

    const { nextState, alerts } = SimulationOracle.tick(state, 1.0, { isDaylight: true });

    assert.strictEqual(nextState.health, 0, 'Flash fire must cause immediate casualty (health = 0)');
    assert.ok(
      alerts.includes('cabin_fire'),
      'Alert cabin_fire must be emitted upon reaching flash fire conditions'
    );
  });

  it('R4-T2-03: Lethal CO2 Hypercapnia (CO2 >= 95.0 u)', () => {
    let state = SimulationOracle.createInitialState();
    state.co2 = 96.0; // Severe toxic CO2 concentration

    const { nextState, alerts } = SimulationOracle.tick(state, 1.0, {
      isDaylight: true,
      activeBuildings: ['solar_array', 'battery_bank'], // No scrubbers
    });

    assert.strictEqual(nextState.health, 0, 'Lethal CO2 must cause crew fatality');
    assert.ok(alerts.includes('co2_lethal'), 'Alert co2_lethal must be emitted');
  });

  it('R4-T2-04: Deep Freeze Lethal Exposure (Temp <= 5.0)', () => {
    let state = SimulationOracle.createInitialState();
    state.temperature = 4.0; // Habitat freezing condition

    const { nextState, alerts } = SimulationOracle.tick(state, 1.0, {
      isDaylight: false,
      activeBuildings: ['battery_bank'], // Heaters turned off
    });

    assert.strictEqual(nextState.health, 0, 'Sub-zero freezing exposure must cause fatality');
    assert.ok(alerts.includes('freezing_lethal'), 'Alert freezing_lethal must be emitted');
  });

  it('R4-T2-05: Total Blackout & Cascading Life-Support Collapse', () => {
    let state = SimulationOracle.createInitialState();
    state.power = 0; // Total battery exhaustion

    const activeBuildings = [
      'crew_habitat',
      'co2_scrubber',
      'heating_system',
      'oxygen_electrolyzer',
    ];

    // During shadow (night)
    const { nextState, alerts } = SimulationOracle.tick(state, 4.0, {
      isDaylight: false,
      activeBuildings,
    });

    assert.strictEqual(nextState.power, 0, 'Power remains 0 during blackout');
    assert.ok(
      alerts.includes('load_shed_p1_blackout'),
      'Cascading blackout alert must be triggered'
    );
    // Unheated habitat drops temperature rapidly (-2.5 per tick)
    assert.ok(nextState.temperature < state.temperature, 'Habitat begins freezing without power');
  });

  it('R4-T2-06: Player UI Actions Clock Invariance During Active Crisis', () => {
    let state = SimulationOracle.createInitialState();
    state.o2CrisisTimerHours = 48.0;

    // Player cleans solar panels 5 times and orders Earth resupply
    for (let i = 0; i < 5; i++) {
      const res = SimulationOracle.cleanSolarPanels(state);
      state = res.nextState;
    }
    state = SimulationOracle.orderEarthResupply(state);

    // Player UI actions do NOT advance mission Sol or clock
    assert.strictEqual(state.sol, 1, 'Sol must remain 1 during immediate UI actions');
    assert.strictEqual(state.timeOfDayHours, 6.0, 'Hour must remain 6.0 during immediate UI actions');
    assert.strictEqual(state.o2CrisisTimerHours, 48.0, 'Crisis timer must NOT decrement during UI actions');
    assert.strictEqual(state.o2ResupplyOrdered, true, 'Earth resupply order recorded');
  });
});
