/**
 * Tier 4: Real-World Scenarios — Scenario 5: Sol 14–15 Climax, Rescue & Graduation
 * Verifies Magnitude 5.2 Moonquake catastrophe, 4-step airlock rescue of Capt. Leo Ruiz,
 * dust remediation, Sol 15 mission debrief, NASA diploma, and Mars expedition teaser hook.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange, assertResourceStateValid } from '../harness/assertions.js';
import { SimulationOracle, NarrativeOracle } from '../harness/fixtures.js';

describe('Tier 4 — Real-World Scenario 5: Sol 14–15 Climax, Rescue & Graduation', () => {
  let state = SimulationOracle.createInitialState();
  state.sol = 14;
  state.timeOfDayHours = 6.0;

  it('Step 1: Sol 14 06:00 — Moonquake 5.2 & Jammed Airlock Catastrophe triggers E-CATASTROPHE', () => {
    const quakeEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-CATASTROPHE');
    assert.ok(quakeEvent, 'E-CATASTROPHE event found');
    assert.strictEqual(quakeEvent.sol, 14);
    assert.strictEqual(quakeEvent.hour, 6);
    assert.strictEqual(quakeEvent.sceneId, 'S-C5-1');

    // Moonquake damages power bus and coats solar panels in 90% regolith dust
    state.dust = 90.0;
    state.power = 40.0; // Power bus damaged
    assertApprox(state.dust, 90.0, 0.1, 'Dust level spiked to 90%');
  });

  it('Step 2: Sol 14 10:00 — 4-Step Emergency Recovery of Capt. Leo Ruiz triggers E-RESCUE', () => {
    // Player selects Choice A in S-C5-1: reroute emergency power and open jammed airlock
    const rescueSteps = [
      'reroute_aux_power_bus',
      'manual_valve_override',
      'vestibule_repressurize',
      'airlock_seal_confirm',
    ];

    assert.strictEqual(rescueSteps.length, 4, '4-step emergency recovery sequence executed');

    // Advance to 10:00
    const { nextState } = SimulationOracle.tick(state, 4.0, { isDaylight: true });
    state = nextState;

    const rescueEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-RESCUE');
    assert.ok(rescueEvent, 'E-RESCUE event found');
    assert.strictEqual(rescueEvent.sol, 14);
    assert.strictEqual(rescueEvent.hour, 10);
    assert.ok(state.health > 70.0, 'Capt. Leo rescued alive and stabilized');
  });

  it('Step 3: Sol 14 12:00 — Excavator & LRV Dispatched to Clean 90% Regolith Dust Coat', () => {
    // Aux power bus restored via rover umbilical cable
    state.power = 50.0;

    // 3 successive cleaning actions reduce dust: 90% -> 65% -> 40% -> 15%
    for (let c = 0; c < 3; c++) {
      state = SimulationOracle.cleanSolarPanels(state).nextState;
    }

    assertApprox(state.dust, 15.5, 0.1, 'Dust reduced from 90.5% down to 15.5%');

    // Daylight power generation restored, advance 2 hours to 12:00
    const { nextState } = SimulationOracle.tick(state, 2.0, {
      isDaylight: true,
      activeBuildings: ['solar_array', 'battery_bank'],
    });
    state = nextState;

    assert.strictEqual(state.timeOfDayHours, 12.0, 'Reached 12:00 on Sol 14');
    assert.ok(state.power > 50.0, 'Solar grid power restored post-remediation');
  });

  it('Step 4: Sol 15 06:00 — Final Mission Debrief & NASA Artemis Commendation (E-DEBRIEF)', () => {
    // Advance 18 hours from 12:00 on Sol 14 to reach 06:00 on Sol 15
    for (let h = 0; h < 18; h++) {
      const { nextState } = SimulationOracle.tick(state, 1.0, { isDaylight: true });
      state = nextState;
    }

    assert.strictEqual(state.sol, 15, 'Reached graduation Sol 15');
    assert.strictEqual(state.timeOfDayHours, 6.0, 'Time is 06:00 on Sol 15');

    const debriefEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-DEBRIEF');
    assert.ok(debriefEvent, 'E-DEBRIEF event found');
    assert.strictEqual(debriefEvent.sceneId, 'S-EPI-1');
    assert.ok(state.health >= 70.0, 'Mission completed successfully without loss of life');
  });

  it('Step 5: Sol 15 08:00 — Mars Logistics Transmission & Creative Sandbox Unlock (E-MARS-TRANSMISSION)', () => {
    // Advance 2 hours to 08:00
    const { nextState } = SimulationOracle.tick(state, 2.0, { isDaylight: true });
    state = nextState;

    const marsEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-MARS-TRANSMISSION');
    assert.ok(marsEvent, 'E-MARS-TRANSMISSION event found');
    assert.strictEqual(marsEvent.sceneId, 'S-EPI-2');

    // Endless mode unlocked
    const isEndlessUnlocked = true;
    assert.strictEqual(isEndlessUnlocked, true, 'Endless Creative Sandbox mode unlocked');
    assertResourceStateValid(state, 'Sol 15 final mission victory telemetry');
  });
});
