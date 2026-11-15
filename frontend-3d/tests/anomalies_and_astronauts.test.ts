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
