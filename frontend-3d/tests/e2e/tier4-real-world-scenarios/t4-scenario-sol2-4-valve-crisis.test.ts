/**
 * Tier 4: Real-World Scenarios — Scenario 2: Sol 2–4 Valve Fracture Crisis & Emergency Resupply
 * Verifies Sol 2 valve fracture, 48-hour countdown initiation, emergency Earth resupply order,
 * cargo lander touchdown on Sol 4, and oxygen restoration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange, assertResourceStateValid } from '../harness/assertions.js';
import { SimulationOracle, NarrativeOracle } from '../harness/fixtures.js';

describe('Tier 4 — Real-World Scenario 2: Sol 2–4 O2 Valve Fracture & Resupply Arc', () => {
  let state = SimulationOracle.createInitialState();
  state.sol = 2;
  state.timeOfDayHours = 6.0;

  it('Step 1: Sol 2 06:00 — Valve Fracture Alert triggers E-O2-VALVE-FRACTURE & 48h Countdown', () => {
    // E-O2-VALVE-FRACTURE event triggers
    const ev = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-O2-VALVE-FRACTURE');
    assert.ok(ev, 'E-O2-VALVE-FRACTURE event found');
    assert.strictEqual(ev.crisisTimerHours, 48, 'Crisis timer initiates at 48 hours');
    assert.strictEqual(ev.sceneId, 'S-C1-2');

    // Primary compressed tank drops to near zero
    state.stored_o2 = 12.0; // Critical threshold < 20
    state.o2CrisisTimerHours = 48.0;
    state.o2ResupplyOrdered = false;

    assert.strictEqual(state.o2CrisisTimerHours, 48.0, 'Timer active at 48 hours');
    assert.ok(state.stored_o2 < 20.0, 'Primary O2 reserve is below 20u critical alert limit');
  });

  it('Step 2: Sol 2 06:30 — Commander Orders Emergency Earth Resupply via Deep Space Network', () => {
    // Interactive dialogue choice A in S-C1-2
    state = SimulationOracle.orderEarthResupply(state);

    assert.strictEqual(state.o2ResupplyOrdered, true, 'Emergency Earth resupply order recorded');
    assert.strictEqual(state.o2CrisisTimerHours, 48.0, 'Countdown timer has not yet decremented');
  });

  it('Step 3: Sol 3 06:00 — 24 Hours Elapse in Transit, Crew Survives on Emergency Rationing', () => {
    // Advance 24 hours (6 ticks of 4 hours)
    for (let i = 0; i < 6; i++) {
      const { nextState } = SimulationOracle.tick(state, 4.0, {
        isDaylight: true,
        activeBuildings: ['solar_array', 'battery_bank', 'crew_habitat', 'co2_scrubber', 'emergency_o2_generator'],
      });
      state = nextState;
    }

    assert.strictEqual(state.sol, 3, 'Now on Sol 3');
    assert.strictEqual(state.timeOfDayHours, 6.0, 'Time is 06:00 on Sol 3');
    assertApprox(state.o2CrisisTimerHours!, 24.0, 0.1, 'Crisis timer has decremented to 24h remaining');
    assert.ok(state.health > 80.0, 'Crew health preserved during resupply transit');
  });

  it('Step 4: Sol 4 08:00 — Falcon Heavy Cargo Lander Arrives and triggers E-RESUPPLY-LANDS', () => {
    // Advance remaining 26 hours to Sol 4, 08:00
    // Sol 3 06:00 -> Sol 4 08:00 is 26 hours (6 ticks of 4h + 1 tick of 2h)
    for (let i = 0; i < 6; i++) {
      const { nextState } = SimulationOracle.tick(state, 4.0, { isDaylight: true });
      state = nextState;
    }
    const { nextState } = SimulationOracle.tick(state, 2.0, { isDaylight: true });
    state = nextState;

    assert.strictEqual(state.sol, 4, 'Now on Sol 4');
    assert.strictEqual(state.timeOfDayHours, 8.0, 'Time is 08:00 on Sol 4');

    const resupplyEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-RESUPPLY-LANDS');
    assert.ok(resupplyEvent, 'E-RESUPPLY-LANDS event found');
    assert.strictEqual(resupplyEvent.sol, 4);
    assert.strictEqual(resupplyEvent.hour, 8);
  });

  it('Step 5: Sol 4 08:30 — Cargo Offload Restores Stored O2 to 100% and Clears Crisis', () => {
    // Land resupply cargo
    state = SimulationOracle.landEarthResupply(state);

    assert.strictEqual(state.stored_o2, 100.0, 'Stored oxygen restored to 100% capacity');
    assertApprox(state.oxygen, 21.0, 0.5, 'Cabin atmosphere replenished to 21% O2');
    assert.strictEqual(state.o2CrisisTimerHours, undefined, 'Crisis timer cleared');
    assert.ok(state.health > 80.0, 'Crew completes crisis arc alive');
    assertResourceStateValid(state, 'Sol 4 post-resupply telemetry validation');
  });
});
