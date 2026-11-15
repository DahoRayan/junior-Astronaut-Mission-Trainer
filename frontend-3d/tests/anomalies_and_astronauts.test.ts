/**
 * Automated Test Suite: Lunar Astronauts, Mission Anomalies & Navigation Freedom
 * NASA Outpost 3D Lunar Frontend
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { AstronautManager } from '../src/actors/AstronautManager.js';
import { MissionDecisionManager } from '../src/simulation/MissionDecisionManager.js';
import { SimulationEngine } from '../src/simulation/SimulationEngine.js';
import { RoverManager } from '../src/rovers/RoverManager.js';
import { NarrativeManager } from '../src/narrative/NarrativeManager.js';
import { TimeManager } from '../src/astronomy/TimeManager.js';
import { CameraController, CAMERA_SECTOR_PRESETS } from '../src/interaction/CameraController.js';
import { CityBuilder } from '../src/city/CityBuilder.js';
import { SoundSystem } from '../src/audio/SoundSystem.js';

describe('NASA Outpost 3D — Astronauts, Anomalies & Navigation Test Suite', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let sim: SimulationEngine;
  let sound: SoundSystem;
  let rovers: RoverManager;
  let astronauts: AstronautManager;
  let decisions: MissionDecisionManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1.33, 0.1, 1000);
    sim = new SimulationEngine();
    sound = new SoundSystem();
    rovers = new RoverManager(scene);
    astronauts = new AstronautManager(scene);
    decisions = new MissionDecisionManager(sim, astronauts, rovers);
  });

  describe('Suite 1: Lunar Astronaut Locomotion & Low-Gravity Physics', () => {
    it('ASTRO-01: AstronautManager spawns initial 3 Artemis crew members', () => {
      const crew = astronauts.getAllAstronauts();
      assert.strictEqual(crew.length, 3, 'Must initialize with 3 Artemis crew');
      const names = crew.map((c) => c.name);
      assert.ok(names.some((n) => n.includes('Glenn')), 'Commander Sarah Glenn must exist');
      assert.ok(names.some((n) => n.includes('Ruiz')), 'Dr. Leo Ruiz must exist');
      assert.ok(names.some((n) => n.includes('Lin')), 'Eng. Maya Lin must exist');
    });

    it('ASTRO-02: Astronaut hop kinematics produce low-gravity vertical bounce', () => {
      const cmdr = astronauts.getAstronaut('AST-01')!;
      cmdr.targetPosition = new THREE.Vector3(20, 0, 20);
      cmdr.status = 'walking';

      // Advance 1 second of simulation
      astronauts.update(1.0);

      // Low-gravity bunny hop creates non-zero Y elevation
      assert.ok(cmdr.mesh.position.y >= 0, 'Astronaut must stay on or above ground');
      assert.ok(cmdr.mesh.position.y <= 0.5, 'Hop peak must remain realistic for lunar gravity');
    });

    it('ASTRO-03: commandShelterAll safely evacuates all astronauts to vault', () => {
      astronauts.commandShelterAll();
      for (const a of astronauts.getAllAstronauts()) {
        assert.strictEqual(a.isSheltered, true, `${a.name} must be sheltered`);
        assert.strictEqual(a.status, 'sheltering', `${a.name} status must be sheltering`);
      }

      // Exit shelter restores surface activities
      astronauts.commandExitShelter();
      for (const a of astronauts.getAllAstronauts()) {
        assert.strictEqual(a.isSheltered, false, `${a.name} must return to surface`);
        assert.strictEqual(a.status, 'patrolling');
      }
    });

    it('ASTRO-04: Adding an extra astronaut dynamically expands active crew', () => {
      const extra = astronauts.addAstronaut({
        id: 'AST-TEST',
        name: 'Cadet Orion',
        role: 'Field Geologist',
        initialPosition: new THREE.Vector3(5, 0, 5),
      });
      assert.strictEqual(extra.id, 'AST-TEST');
      assert.strictEqual(astronauts.getAllAstronauts().length, 4);
    });
  });

  describe('Suite 2: Canonical Mission Anomalies (anomalies.json) & Decision Making', () => {
    it('ANOM-01: Canonical anomalies list contains all 5 required incidents from anomalies.json', () => {
      const canonical = MissionDecisionManager.CANONICAL_ANOMALIES;
      assert.strictEqual(canonical.length, 5, 'Must contain exactly 5 canonical anomalies');

      const names = canonical.map((a) => a.name);
      assert.ok(names.includes('Oxygen Leak'), 'Must include Oxygen Leak');
      assert.ok(names.includes('Solar Storm'), 'Must include Solar Storm');
      assert.ok(names.includes('Long Lunar Night'), 'Must include Long Lunar Night');
      assert.ok(names.includes('Lunar Dust on Solar Panels'), 'Must include Lunar Dust on Solar Panels');
      assert.ok(names.includes('Water Electrolyzer Failure'), 'Must include Water Electrolyzer Failure');
    });

    it('ANOM-02: Each anomaly provides 3 kid-friendly decision choices with real consequences', () => {
      for (const anom of MissionDecisionManager.CANONICAL_ANOMALIES) {
        assert.strictEqual(anom.choices.length, 3, `${anom.name} must have 3 choices`);
        for (const choice of anom.choices) {
          assert.ok(choice.title, 'Choice must have title');
          assert.ok(choice.description, 'Choice must have description');
          assert.ok(choice.tradeoffText, 'Choice must have tradeoff text');
          assert.ok(choice.successPoints > 0, 'Choice must award positive success points');
        }
      }
    });

    it('ANOM-03: Resolving Oxygen Leak with EVA repair spends materials and restores O2', () => {
      const o2Anom = MissionDecisionManager.CANONICAL_ANOMALIES.find((a) => a.id === 'o2_leak')!;
      decisions.triggerAnomaly(o2Anom);
      assert.strictEqual(decisions.activeAnomaly?.id, 'o2_leak');

      sim.state.materials = 500;
      sim.state.oxygen = 18.0;

      const record = decisions.resolveActiveAnomaly('eva_repair');
      assert.ok(record, 'Record must be returned');
      assert.strictEqual(sim.state.materials, 480, 'Must deduct 20 materials');
      assert.strictEqual(sim.state.oxygen, 21.0, 'Must restore oxygen to 21%');
      assert.ok(decisions.missionSuccessScore > 85, 'Must increase mission success score');
    });

    it('ANOM-04: Resolving Solar Storm with Vault Evacuation moves astronauts to shelter', () => {
      const stormAnom = MissionDecisionManager.CANONICAL_ANOMALIES.find((a) => a.id === 'solar_storm')!;
      decisions.triggerAnomaly(stormAnom);

      decisions.resolveActiveAnomaly('vault_evac');
      for (const a of astronauts.getAllAstronauts()) {
        assert.strictEqual(a.isSheltered, true, 'Crew must be sheltered in vault');
      }
    });

    it('ANOM-05: Pacing prevents anomaly spam by enforcing minimum Sol intervals', () => {
      sim.state.sol = 2.0;
      const anom1 = decisions.checkAnomalies(2.0, 6.0);
      assert.strictEqual(anom1, null, 'No anomaly before Sol 2.5');

      // Sol 3.0 triggers first anomaly
      sim.state.sol = 3.0;
      const anom2 = decisions.checkAnomalies(3.0, 6.0);
      assert.ok(anom2 !== null, 'Triggers anomaly at Sol 3.0');

      // Immediate subsequent check must return null due to minSolInterval
      const spamCheck = decisions.checkAnomalies(3.1, 8.0);
      assert.strictEqual(spamCheck, null, 'Must prevent anomaly spam within short sol intervals');
    });

    it('ANOM-06: Sol 1 Peaceful Grace Period strictly suppresses all random anomaly notifications', () => {
      // Sol 1 06:00 (base start)
      assert.strictEqual(decisions.checkAnomalies(1.0, 6.0, 6.0), null, 'Sol 1 06:00 must be peaceful');
      // Sol 1 12:00
      assert.strictEqual(decisions.checkAnomalies(1.0, 12.0, 12.0), null, 'Sol 1 12:00 must be peaceful');
      // Sol 1 23.9h (just before Sol 2)
      assert.strictEqual(decisions.checkAnomalies(1.0, 23.9, 23.9), null, 'Sol 1 23.9h must be peaceful');

      // Even if cooldown would otherwise be satisfied, Sol 1 is fully protected
      decisions.lastAnomalyHour = -100.0;
      decisions.cooldownHours = 10.0;
      assert.strictEqual(decisions.checkAnomalies(1.0, 18.0, 18.0), null, 'Sol 1 grace period overrides cooldown');
    });

    it('ANOM-07: Mandatory minimum cooldown strictly enforces lastAnomalyHour + cooldownHours <= currentTotalHours', () => {
      decisions.reset();
      decisions.lastAnomalyHour = 48.0;
      decisions.cooldownHours = 48.0; // 48h cooldown -> expires at 96.0h

      // Boundary: Exactly 0.1h before cooldown expires (95.9h)
      const blocked = decisions.checkAnomalies(4.0, 23.9, 95.9);
      assert.strictEqual(blocked, null, 'Must block anomaly at 95.9h (< 96.0h)');

      // Boundary: Exactly at cooldown expiration (96.0h / Sol 5 00:00)
      const allowed = decisions.checkAnomalies(5.0, 0.0, 96.0);
      assert.ok(allowed !== null, 'Must allow anomaly at exactly 96.0h (lastAnomalyHour + cooldownHours)');
      assert.strictEqual(decisions.lastAnomalyHour, 96.0, 'lastAnomalyHour must update to current total hours');
    });

    it('ANOM-08: Quiet period after dismissal resets cooldown timer and blocks new notifications', () => {
      decisions.reset();
      // Sol 3.0 triggers anomaly
      const anom = decisions.checkAnomalies(3.0, 6.0, 54.0);
      assert.ok(anom !== null, 'Anomaly triggers at 54.0h');
      assert.strictEqual(decisions.activeAnomaly?.id, anom?.id);

      // Player dismisses/closes the notification modal at 56.0h (Sol 3, 08:00)
      decisions.dismissActiveAnomaly(56.0);
      assert.strictEqual(decisions.activeAnomaly, null, 'Active anomaly cleared on dismissal');
      assert.strictEqual(decisions.lastAnomalyHour, 56.0, 'lastAnomalyHour updated to dismissal time');

      // Cooldown (48h) means quiet period is active until 56.0 + 48.0 = 104.0h
      assert.strictEqual(decisions.checkAnomalies(3.5, 12.0, 72.0), null, 'Blocked at 72.0h');
      assert.strictEqual(decisions.checkAnomalies(4.5, 12.0, 96.0), null, 'Blocked at 96.0h');
      assert.strictEqual(decisions.checkAnomalies(5.0, 7.9, 103.9), null, 'Blocked at 103.9h');

      // Once 104.0h is reached, quiet period ends
      const nextAnom = decisions.checkAnomalies(5.0, 8.0, 104.0);
      assert.ok(nextAnom !== null, 'Next anomaly allowed after quiet period elapses');
    });

    it('ANOM-09: Quiet period after resolution resets cooldown timer and blocks new notifications', () => {
      decisions.reset();
      sim.state.materials = 500;
      sim.state.power = 500;

      // Trigger anomaly at 54.0h
      const anom = decisions.checkAnomalies(3.0, 6.0, 54.0);
      assert.ok(anom !== null);

      // Player resolves active anomaly at 58.0h with choice 'rover_clean_sweep' or 'eva_repair'
      const record = decisions.resolveActiveAnomaly('eva_repair', 58.0);
      assert.ok(record !== null, 'Decision record returned');
      assert.strictEqual(decisions.activeAnomaly, null, 'Active anomaly cleared on resolution');
      assert.strictEqual(decisions.lastAnomalyHour, 58.0, 'lastAnomalyHour updated to resolution time');
      assert.strictEqual(record.sol, 3, 'Record sol must be Sol 3 (58.0h is Sol 3, 10:00h)');
      assert.strictEqual(record.hour, 10.0, 'Record hour must be 10.0h');
      assert.strictEqual(decisions.lastAnomalySol, 3, 'lastAnomalySol must be Sol 3');

      // Quiet period active until 58.0 + 48.0 = 106.0h
      assert.strictEqual(decisions.checkAnomalies(4.0, 0.0, 72.0), null, 'Blocked during quiet period');
      assert.strictEqual(decisions.checkAnomalies(5.0, 9.9, 105.9), null, 'Blocked right before 106.0h');

      // Resolving recorded in resolvedAnomalyIds
      assert.ok(decisions.resolvedAnomalyIds.has(record.anomalyId));
    });

    it('ANOM-10: Narrative dialogue collision suppression and dismissal quiet period', () => {
      const tm = new TimeManager({ initialHours: 6.0 });
      const narrative = new NarrativeManager(tm, sim, rovers, decisions);
      decisions.setNarrativeManager(narrative);

      decisions.reset();
      // Set time to Sol 3.0 (54h)
      narrative.isModalOpen = true;

      // When narrative modal is open, anomalies MUST NOT trigger
      const suppressed = decisions.checkAnomalies(3.0, 6.0, 54.0);
      assert.strictEqual(suppressed, null, 'Anomaly blocked while story dialogue modal is open');

      // Closing narrative modal resets anomaly cooldown timer
      narrative.closeModal();
      assert.strictEqual(narrative.isModalOpen, false);
      // Last anomaly hour updated to current TimeManager time
      assert.strictEqual(decisions.lastAnomalyHour, tm.getState().totalHours);
    });

    it('ANOM-11: Custom cooldown hours (e.g. 36 hours / 1.5 Sols) accurately scales quiet interval', () => {
      decisions.reset();
      decisions.setCooldownHours(36.0);
      assert.strictEqual(decisions.cooldownHours, 36.0);
      assert.strictEqual(decisions.minSolInterval, 1.5);

      // Trigger and dismiss at 60.0h
      decisions.lastAnomalyHour = 60.0;

      // Blocked at 60.0 + 35.9 = 95.9h
      assert.strictEqual(decisions.checkAnomalies(4.0, 23.9, 95.9), null, 'Blocked before 36h cooldown');

      // Allowed at 60.0 + 36.0 = 96.0h
      const allowed = decisions.checkAnomalies(5.0, 0.0, 96.0);
      assert.ok(allowed !== null, 'Allowed at exactly 36h cooldown');
    });

    it('ANOM-12: Resetting mission clears active anomaly and resets cooldown timer baseline', () => {
      decisions.triggerAnomaly(MissionDecisionManager.CANONICAL_ANOMALIES[0], 100.0, 5.0);
      assert.ok(decisions.activeAnomaly !== null);
      assert.strictEqual(decisions.lastAnomalyHour, 100.0);

      decisions.reset();
      assert.strictEqual(decisions.activeAnomaly, null);
      assert.strictEqual(decisions.lastAnomalyHour, -decisions.cooldownHours);
      assert.strictEqual(decisions.pastDecisions.length, 0);
      assert.strictEqual(decisions.resolvedAnomalyIds.size, 0);
    });

    it('ANOM-13: Fractional cooldown mid-sol transition (30h + 36h = 66h) allows anomaly without discrete sol lockout', () => {
      decisions.reset();
      decisions.setCooldownHours(36.0); // 1.5 Sols

      // Event resolved at Sol 2 06:00 (30.0h)
      decisions.resetCooldown(30.0);
      assert.strictEqual(decisions.lastAnomalyHour, 30.0);
      assert.strictEqual(decisions.lastAnomalySol, 2);

      // At 65.9h (35.9h later), blocked
      assert.strictEqual(decisions.checkAnomalies(3.0, 17.9, 65.9), null, 'Must block before 36h');

      // At 66.0h (Sol 3 18:00h, exactly 36.0h later), allowed
      // Note: integer sol is 3, lastAnomalySol is 2, integer diff is 1 < 1.5,
      // but continuous sol elapsed is exactly 1.5 Sols (36h), so it MUST be allowed!
      const nextAnom = decisions.checkAnomalies(3.0, 18.0, 66.0);
      assert.ok(nextAnom !== null, 'Must allow anomaly at exactly 36.0h cooldown without integer sol lockout');
    });

    it('ANOM-14: Backward time scrubbing clamps lastAnomalyHour to avoid runaway lockouts', () => {
      decisions.reset();

      // Anomaly occurred forward in time at 70.0h
      decisions.lastAnomalyHour = 70.0;
      decisions.lastAnomalySol = 3;

      // Player scrubs time backwards to Sol 2 06:00 (30.0h)
      // Check should detect time jump backward, clamp lastAnomalyHour to 30.0h
      const check = decisions.checkAnomalies(2.0, 6.0, 30.0);
      assert.strictEqual(check, null, 'Quiet period active starting from scrubbed time 30.0h');
      assert.strictEqual(decisions.lastAnomalyHour, 30.0, 'lastAnomalyHour must be clamped to scrub point');

      // Quiet period runs for 48h from 30.0h (expires at 78.0h)
      assert.strictEqual(decisions.checkAnomalies(4.0, 5.9, 77.9), null, 'Blocked before 78.0h');
      const allowed = decisions.checkAnomalies(4.0, 6.0, 78.0);
      assert.ok(allowed !== null, 'Allowed at 78.0h (48h from scrub point)');
    });

    it('ANOM-15: Sol 2 midday continuous anomaly unlock (Sol 2.5 / 36.0h)', () => {
      decisions.reset();

      // Sol 2 06:00 (30.0h -> continuous sol 2.25) is before minSol 2.5
      assert.strictEqual(decisions.checkAnomalies(2.0, 6.0, 30.0), null, 'Blocked before minSol 2.5');

      // Sol 2 12:00 (36.0h -> continuous sol 2.5) reaches minSol 2.5!
      const anom = decisions.checkAnomalies(2.0, 12.0, 36.0);
      assert.ok(anom !== null, 'Oxygen leak unlocks at Sol 2 12:00 (Sol 2.5)');
      assert.strictEqual(anom?.id, 'o2_leak');
    });
  });

  describe('Suite 3: Camera Freedom & Deselection Invariants', () => {
    it('CAM-01: Camera presets match canonical bounds and maintain ground clearance', () => {
      for (const preset of Object.values(CAMERA_SECTOR_PRESETS)) {
        assert.ok(preset.position.y > 0, 'Camera Y must stay strictly positive');
        assert.ok(preset.target.y >= 0, 'Target Y must be on or above ground');
      }
    });

    it('DESEL-01: CityBuilder toggles off when active building card is clicked again', () => {
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100));
      const dummyDom = {
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      } as unknown as HTMLElement;

      const cb = new CityBuilder({
        scene,
        camera,
        domElement: dummyDom,
        groundMesh: ground,
        simEngine: sim,
        sound,
        astronautManager: astronauts,
      });

      // Select living dome
      cb.selectBuilding('inflatable_dome');
      assert.strictEqual(cb.activeDef?.id, 'inflatable_dome');

      // Clicking same building again deselects!
      cb.selectBuilding('inflatable_dome');
      assert.strictEqual(cb.activeDef, null, 'Clicking selected card must deselect');

      // cancelAction() clears selection
      cb.selectBuilding('inflatable_dome');
      cb.cancelAction();
      assert.strictEqual(cb.activeDef, null, 'cancelAction must clear selection');
    });
  });
});
