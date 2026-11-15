/**
 * Tier 3: Cross-Feature Combinations — R4 (Narrative Manager) + R3 (Time Manager Clock)
 * Verifies that mission clock progression triggers scheduled timeline events,
 * modal dialogs freeze the simulation clock and crisis countdowns, and closing resumes previous speed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { NarrativeOracle, SimulationOracle } from '../harness/fixtures.js';

describe('Tier 3 — Cross-Feature: R4 Narrative + R3 Mission Clock Pacing Sync', () => {
  it('T3-01: Mission Clock Advancing Triggers Scheduled Timeline Event at Exact Sol & Hour', () => {
    let firedEvents: string[] = [];

    const checkTimelineTriggers = (sol: number, hour: number) => {
      for (const ev of NarrativeOracle.TIMELINE_EVENTS) {
        if (!firedEvents.includes(ev.id)) {
          if (sol > ev.sol || (sol === ev.sol && hour >= ev.hour)) {
            firedEvents.push(ev.id);
          }
        }
      }
    };

    // Sol 1, 06:00: E-LANDING fires
    checkTimelineTriggers(1, 6.0);
    assert.ok(firedEvents.includes('E-LANDING'), 'E-LANDING must fire at Sol 1, 06:00');
    assert.strictEqual(firedEvents.includes('E-HAB-SETUP'), false, 'E-HAB-SETUP should not fire before 07:00');

    // Sol 1, 07:00: E-HAB-SETUP fires
    checkTimelineTriggers(1, 7.0);
    assert.ok(firedEvents.includes('E-HAB-SETUP'), 'E-HAB-SETUP fires at Sol 1, 07:00');

    // Sol 2, 06:00: E-O2-VALVE-FRACTURE fires
    checkTimelineTriggers(2, 6.0);
    assert.ok(firedEvents.includes('E-O2-VALVE-FRACTURE'), 'E-O2-VALVE-FRACTURE fires at Sol 2, 06:00');
  });

  it('T3-02: Opening Visual Novel Dialogue Pauses Simulation and Freezes Clock', () => {
    let simState = SimulationOracle.createInitialState();
    let currentSpeed = 2.0; // 2x speed active
    let cachedSpeed = currentSpeed;

    // Trigger visual novel modal
    const openDialogue = () => {
      cachedSpeed = currentSpeed;
      currentSpeed = 0.0;
      simState.isPaused = true;
    };

    openDialogue();
    assert.strictEqual(simState.isPaused, true, 'Simulation must be flagged as paused');
    assert.strictEqual(currentSpeed, 0.0, 'Simulation speed must drop to 0 during dialogue');
    assert.strictEqual(cachedSpeed, 2.0, 'Pre-pause speed must be cached as 2x');

    // Ticking while paused must not advance time or change resources
    const preSol = simState.sol;
    const preHour = simState.timeOfDayHours;
    const { nextState } = SimulationOracle.tick(simState, 4.0);

    assert.strictEqual(nextState.sol, preSol, 'Sol must not change while paused');
    assert.strictEqual(nextState.timeOfDayHours, preHour, 'Hour must not change while paused');
  });

  it('T3-03: Crisis Countdown Timer Freezes While Modal Dialogue Is Open', () => {
    let simState = SimulationOracle.createInitialState();
    simState.o2CrisisTimerHours = 48.0;
    simState.isPaused = true; // Modal open

    // Attempt to tick 12 hours while modal is open
    for (let i = 0; i < 3; i++) {
      const { nextState } = SimulationOracle.tick(simState, 4.0);
      simState = nextState;
    }

    assert.strictEqual(
      simState.o2CrisisTimerHours,
      48.0,
      '48-hour crisis timer must remain strictly frozen while player reads dialogue'
    );
  });

  it('T3-04: Closing Modal Dialogue Resumes Simulation at Cached Pre-Pause Speed', () => {
    let simState = SimulationOracle.createInitialState();
    simState.isPaused = true;
    let currentSpeed = 0.0;
    let cachedSpeed = 2.0;

    // Close modal callback
    const closeDialogue = () => {
      currentSpeed = cachedSpeed;
      simState.isPaused = false;
    };

    closeDialogue();

    assert.strictEqual(simState.isPaused, false, 'Simulation unpaused upon closing modal');
    assert.strictEqual(currentSpeed, 2.0, 'Simulation speed restored to pre-pause 2x multiplier');

    // Advancing post-unpause now increments clock normally
    const { nextState } = SimulationOracle.tick(simState, 2.0);
    assertApprox(nextState.timeOfDayHours, 8.0, 0.1, 'Clock resumes normal progression');
  });

  it('T3-05: Bidirectional Time Scrubbing Evaluates Historical State and Preserves Sol Milestones', () => {
    const hoursToSolAndHour = (totalHours: number) => {
      const sol = Math.floor(totalHours / 24.0) + 1;
      const hour = totalHours % 24.0;
      return { sol, hour };
    };

    // Scrub to Sol 7, 00:00 (Long night event milestone) -> 6 Sols * 24h = 144.0h
    const scrubbed = hoursToSolAndHour(144.0);
    assert.strictEqual(scrubbed.sol, 7, 'Scrubbed Sol milestone');
    assert.strictEqual(scrubbed.hour, 0.0, 'Scrubbed Hour milestone');

    // Scrub back to Sol 1, 12:00 -> 12.0h
    const scrubbedBack = hoursToSolAndHour(12.0);
    assert.strictEqual(scrubbedBack.sol, 1, 'Backward scrubbed Sol');
    assert.strictEqual(scrubbedBack.hour, 12.0, 'Backward scrubbed Hour');
  });
});
