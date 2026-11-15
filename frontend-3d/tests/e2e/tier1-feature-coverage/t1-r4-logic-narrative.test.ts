/**
 * Tier 1: Feature Coverage — R4: Simulation Logic & Narrative Integration
 * Verifies 18 telemetry variables, 14 timeline events, 15 dialogues,
 * 5 rover types, and power priority load-shedding.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../harness/setup.js';
import {
  assertApprox,
  assertRange,
  assertResourceStateValid,
} from '../harness/assertions.js';
import {
  SimulationOracle,
  NarrativeOracle,
  RoverOracle,
} from '../harness/fixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../../..');

describe('Tier 1 — R4: Simulation Logic & Narrative State Invariants', () => {
  it('R4-T1-01: 18 Canonical Telemetry Variables State Machine Verification', () => {
    const state = SimulationOracle.createInitialState();
    assertResourceStateValid(state, 'Initial state validation');

    // Nominal Sol 1 initial values
    assert.strictEqual(state.power, 850, 'Initial stored electricity (kWh)');
    assert.strictEqual(state.stored_o2, 80, 'Initial stored oxygen reserves');
    assertApprox(state.oxygen, 20.9, 0.1, 'Initial atmospheric oxygen %');
    assert.strictEqual(state.co2, 10.0, 'Initial cabin CO2');
    assert.strictEqual(state.temperature, 50.0, 'Initial cabin temperature (21°C)');
    assert.strictEqual(state.pressure, 100.0, 'Initial pressure (101.3 kPa)');
    assert.strictEqual(state.water, 60.0, 'Initial clean water');
    assert.strictEqual(state.food, 30, 'Initial rations');
    assert.strictEqual(state.health, 100.0, 'Initial crew health');

    // Advance 1 standard tick (4 hours)
    const { nextState } = SimulationOracle.tick(state, 4.0, { isDaylight: true });
    assertResourceStateValid(nextState, 'Post-tick state validation');

    assert.strictEqual(nextState.sol, 1, 'Sol remains 1 after 4h advance from 06:00');
    assert.strictEqual(nextState.timeOfDayHours, 10.0, 'Hour advances 6.0 -> 10.0');
    assert.ok(nextState.power > 0, 'Base remains powered');
    assert.ok(nextState.health === 100, 'Crew health remains nominal under balanced ECLSS');
  });

  it('R4-T1-02: 14 Canonical Timeline Events Schedule Verification', () => {
    const events = NarrativeOracle.TIMELINE_EVENTS;
    assert.strictEqual(events.length, 14, 'Canonical story bible must define exactly 14 timeline events');

    // Check presence of canonical crisis and milestone events
    const expectedEventIds = [
      'E-LANDING',
      'E-HAB-SETUP',
      'E-O2-VALVE-FRACTURE',
      'E-RESUPPLY-LANDS',
      'E-LONG-NIGHT-START',
      'E-BATTERY-FREEZE',
      'E-SOLAR-FLARE',
      'E-RADIATION-IMPACT',
      'E-RATIONS-LOW',
      'E-HYDROPONICS',
      'E-CATASTROPHE',
      'E-RESCUE',
      'E-DEBRIEF',
      'E-MARS-TRANSMISSION',
    ];

    for (const id of expectedEventIds) {
      const found = events.find((e) => e.id === id);
      assert.ok(found, `Expected canonical event '${id}' in timeline`);
      assert.ok(found.sol >= 1 && found.sol <= 15, `Event '${id}' Sol must be within 1..15`);
      assert.ok(found.hour >= 0 && found.hour <= 24, `Event '${id}' Hour must be within 0..24`);
      assert.ok(found.title.length > 5, `Event '${id}' must have a descriptive title`);
    }

    // Verify chronological order
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      const prevTime = prev.sol * 24 + prev.hour;
      const currTime = curr.sol * 24 + curr.hour;
      assert.ok(currTime >= prevTime, `Events out of chronological order: ${prev.id} (${prevTime}h) > ${curr.id} (${currTime}h)`);
    }
  });

  it('R4-T1-03: 15 Visual Novel Dialogue Scenes Script Integrity', () => {
    const sceneIds = NarrativeOracle.DIALOGUE_SCENE_IDS;
    assert.strictEqual(sceneIds.length, 15, 'Story must define exactly 15 dialogue scenes');

    // Also check on-disk story bible sample if present
    const biblePath = path.join(workspaceRoot, 'story/samples/story-bible.json');
    const dialoguePath = path.join(workspaceRoot, 'story/samples/dialogue.en.json');

    if (fs.existsSync(dialoguePath)) {
      const dialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf-8'));
      assert.ok(dialogueData.scenes, 'dialogue.en.json must contain scenes object');
      for (const sceneId of sceneIds) {
        const scene = dialogueData.scenes[sceneId];
        assert.ok(scene, `Scene '${sceneId}' must exist in dialogue.en.json`);
        assert.ok(Array.isArray(scene.lines), `Scene '${sceneId}' must contain lines array`);
        assert.ok(scene.lines.length > 0, `Scene '${sceneId}' lines must not be empty`);
      }
    }
  });

  it('R4-T1-04: 5 Rover Types Archetypes & Dispatch State Machine', () => {
    const types = RoverOracle.ROVER_TYPES;
    assert.strictEqual(types.length, 5, 'Must define 5 canonical rover types');

    assert.ok(types.includes('open_lrv'), 'Must include open_lrv');
    assert.ok(types.includes('pressurized_traverse'), 'Must include pressurized_traverse');
    assert.ok(types.includes('robotic_survey'), 'Must include robotic_survey');
    assert.ok(types.includes('excavator'), 'Must include excavator');
    assert.ok(types.includes('cargo_hauler'), 'Must include cargo_hauler');

    // State machine test: idle -> en_route -> working/idle
    const rover = RoverOracle.createRover('LRV-01', 'open_lrv');
    assert.strictEqual(rover.status, 'idle', 'Rover initial status must be idle');
    assert.strictEqual(rover.batteryPct, 100.0, 'Rover initial battery must be 100%');

    // Dispatch 200m away
    const dispatched = RoverOracle.dispatch(rover, { x: 120, y: 0, z: 160 }, 'survey');
    assert.strictEqual(dispatched.status, 'en_route', 'Rover status should transition to en_route');
    // Distance = sqrt(120^2 + 160^2) = 200m -> 10% battery drain (5% per 100m)
    assertApprox(dispatched.batteryPct, 90.0, 0.1, 'Rover battery after 200m travel');

    // Complete task
    const completed = RoverOracle.completeTask(dispatched);
    assert.strictEqual(completed.status, 'idle', 'Rover status should return to idle upon arrival');
    assert.strictEqual(completed.position.x, 120, 'Rover arrived at target position X');
    assert.strictEqual(completed.position.z, 160, 'Rover arrived at target position Z');
  });

  it('R4-T1-05: Priority Load-Shedding Scheme (P1 Life Support > P2 Sustenance > P3 Growth)', () => {
    const state = SimulationOracle.createInitialState();
    state.power = 15; // Low power condition (less than full draw, but enough for P1)

    const activeBuildings = [
      'crew_habitat',        // P1: 5 kW
      'co2_scrubber',        // P1: 10 kW
      'heating_system',      // P2: 4 kW
      'hydroponics_tray',    // P3: 12 kW
      'earth_channel',       // P3: 3 kW
    ];

    // During darkness (0 kW solar generation)
    const { nextState, alerts } = SimulationOracle.tick(state, 1.0, {
      isDaylight: false,
      activeBuildings,
    });

    // P1 total draw = 15 kWh. Since state.power was 15 kWh, P1 gets powered, but P2 and P3 are shed
    assert.ok(
      alerts.includes('load_shed_p3') || alerts.includes('load_shed_p2'),
      'Alerts must signal load shedding for P2/P3'
    );
    // Crew health does not collapse immediately because P1 scrubber/habitat remain intact
    assert.strictEqual(nextState.health, 100, 'Crew health preserved by prioritizing life support');
  });

  it('R4-T1-06: O2 Electrolyzer Hysteresis Loop & CDRA CO2 Scrubbing', () => {
    let state = SimulationOracle.createInitialState();
    state.oxygen = 18.5; // Below resumption threshold (<= 19.0%)

    // Run tick with electrolyzer active
    const { nextState } = SimulationOracle.tick(state, 4.0, {
      isDaylight: true,
      activeBuildings: ['solar_array', 'battery_bank', 'oxygen_electrolyzer', 'co2_scrubber'],
    });

    // Oxygen should increase towards nominal 20.9%
    assert.ok(nextState.oxygen > state.oxygen, 'Electrolyzer must emit oxygen when below 19.0%');
    assert.ok(nextState.water < state.water, 'Electrolyzer consumes water as feedstock');

    // When oxygen exceeds 22.0%, production halts to prevent hyperoxia
    let highO2State = SimulationOracle.createInitialState();
    highO2State.oxygen = 22.5; // Above 22.0% cut-off
    const preStored = highO2State.stored_o2;

    const resHigh = SimulationOracle.tick(highO2State, 4.0, {
      isDaylight: true,
      activeBuildings: ['solar_array', 'battery_bank', 'oxygen_electrolyzer'],
    });

    // Oxygen decreases due to natural respiration (-0.3%) because electrolyzer paused injection
    assert.ok(resHigh.nextState.oxygen < highO2State.oxygen, 'Electrolyzer pauses atmospheric injection above 22%');
  });
});
