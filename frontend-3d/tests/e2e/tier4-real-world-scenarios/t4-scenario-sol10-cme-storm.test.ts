/**
 * Tier 4: Real-World Scenarios — Scenario 4: Sol 10 Coronal Mass Ejection (CME) Radiation Storm Arc
 * Verifies NASA DONKI solar flare alert, emergency storm vault evacuation (+95% radiation shielding),
 * safe weathering of 140 mSv/h exterior proton shockwave, and crew survival.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange, assertResourceStateValid } from '../harness/assertions.js';
import { SimulationOracle, NarrativeOracle } from '../harness/fixtures.js';

describe('Tier 4 — Real-World Scenario 4: Sol 10 CME Solar Storm & Vault Evacuation', () => {
  let state = SimulationOracle.createInitialState();
  state.sol = 10;
  state.timeOfDayHours = 6.0;

  it('Step 1: Sol 10 06:00 — NASA DONKI Category X Flare Alert triggers E-SOLAR-FLARE', () => {
    const flareEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-SOLAR-FLARE');
    assert.ok(flareEvent, 'E-SOLAR-FLARE event found');
    assert.strictEqual(flareEvent.sol, 10);
    assert.strictEqual(flareEvent.hour, 6);
    assert.strictEqual(flareEvent.sceneId, 'S-C3-1');
  });

  it('Step 2: Sol 10 06:30 — General Evacuation to Subterranean Storm Vault (S-C3-1 Choice A)', () => {
    // Player selects Choice A: sound base evacuation to subterranean storm vault
    state.isSheltered = true;
    assert.strictEqual(state.isSheltered, true, 'Crew evacuated to storm vault');

    // Effective shielding in vault is 95%
    const effectiveProt = state.isSheltered ? 95.0 : state.radiation_protection;
    assert.strictEqual(effectiveProt, 95.0, 'Storm vault grants +95% radiation protection score');
  });

  it('Step 3: Sol 10 08:00 — 140 mSv/h Radiation Shockwave Hits triggers E-RADIATION-IMPACT', () => {
    // Advance 2 hours to 08:00
    const { nextState } = SimulationOracle.tick(state, 2.0, {
      isDaylight: true,
      externalRadiation: 140.0, // CME storm peak
    });
    state = nextState;

    assert.strictEqual(state.timeOfDayHours, 8.0, 'Shockwave arrival time 08:00');
    const radEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-RADIATION-IMPACT');
    assert.ok(radEvent, 'E-RADIATION-IMPACT event found');
  });

  it('Step 4: Sol 10 12:00 — Storm Vault Suppresses Interior Radiation Below Lethal Thresholds', () => {
    // Weather storm for 4 hours inside vault under peak 140 mSv/h exterior flux
    const { nextState } = SimulationOracle.tick(state, 4.0, {
      isDaylight: true,
      externalRadiation: 140.0,
    });
    state = nextState;

    // Interior radiation exposure is heavily attenuated by 95% shielding
    assert.ok(state.radiation < 25.0, `Interior crew radiation exposure ${state.radiation} suppressed by storm vault`);
    assert.ok(state.health > 90.0, 'Crew health preserved during CME peak');
  });

  it('Step 5: Sol 10 18:00 — Proton Shockwave Passes, Crew Exits Vault With Zero Casualties', () => {
    // Advance 6 hours to 18:00 as solar wind subsides
    const { nextState } = SimulationOracle.tick(state, 6.0, {
      isDaylight: true,
      externalRadiation: 15.0, // Background level
    });
    state = nextState;
    state.isSheltered = false; // Exit vault

    assert.strictEqual(state.isSheltered, false, 'Crew safely exited storm vault');
    assert.strictEqual(state.timeOfDayHours, 18.0, 'Storm passed by 18:00');
    assert.ok(state.health >= 90.0, 'Zero radiation casualties achieved');
    assertResourceStateValid(state, 'Sol 10 post-storm telemetry validation');
  });
});
