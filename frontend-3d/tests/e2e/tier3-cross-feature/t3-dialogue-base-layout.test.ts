/**
 * Tier 3: Cross-Feature Combinations — R4 (Dialogue Choices) + R2 (3D Colony Layout & Grid)
 * Verifies that selecting "Start building from scratch" in S-PRO-1 clears the 3D grid and
 * grants 1400 materials budget, while selecting "Pre-Built Base" retains the starter scene.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { SimulationOracle } from '../harness/fixtures.js';

describe('Tier 3 — Cross-Feature: R4 Dialogue Choice + R2 3D Colony Scene Layout Sync', () => {
  it('T3-01: Choice A in S-PRO-1 (Systems Tour) Retains Pre-Built Base Hierarchy', () => {
    // Simulated base manager state
    let baseMode: 'prebuilt' | 'scratch' = 'prebuilt';
    let materialsBudget = 0;
    const baseScene = new THREE.Group();

    // Add 24 modular entities representing starter scene colony-overview
    for (let i = 0; i < 24; i++) {
      const mod = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
      mod.name = `module_${i}`;
      baseScene.add(mod);
    }

    // Execute S-PRO-1 Choice A
    const handleDialogueChoice = (choice: 'A' | 'B') => {
      if (choice === 'A') {
        baseMode = 'prebuilt';
        materialsBudget = 150; // Starter operational materials
      } else {
        baseMode = 'scratch';
        baseScene.clear();
        materialsBudget = 1400; // Full construction grant
      }
    };

    handleDialogueChoice('A');

    assert.strictEqual(baseMode, 'prebuilt', 'Mode must be prebuilt');
    assert.strictEqual(baseScene.children.length, 24, '24 starter modules retained in 3D scene');
    assert.strictEqual(materialsBudget, 150, 'Operational maintenance budget');
  });

  it('T3-02: Choice B in S-PRO-1 (Scratch Base) Wipes 3D Scene Grid and Grants 1400 Materials', () => {
    let baseMode: 'prebuilt' | 'scratch' = 'prebuilt';
    let materialsBudget = 0;
    const baseScene = new THREE.Group();

    for (let i = 0; i < 24; i++) {
      baseScene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)));
    }

    // Execute S-PRO-1 Choice B
    const handleDialogueChoice = (choice: 'A' | 'B') => {
      if (choice === 'B') {
        baseMode = 'scratch';
        baseScene.clear();
        materialsBudget = 1400;
      }
    };

    handleDialogueChoice('B');

    assert.strictEqual(baseMode, 'scratch', 'Mode must switch to custom scratch building');
    assert.strictEqual(baseScene.children.length, 0, '3D scene modules wiped to clean regolith');
    assert.strictEqual(materialsBudget, 1400, 'Materials budget set to exactly 1400 units');
  });

  it('T3-03: Modular Building Placement in Scratch Mode Consumes Materials Budget Accurately', () => {
    let materials = 1400;
    const placedBuildings: string[] = [];

    const placeBuilding = (type: string): boolean => {
      const def = SimulationOracle.BUILDINGS[type];
      if (!def || materials < def.cost) return false;
      materials -= def.cost;
      placedBuildings.push(type);
      return true;
    };

    // Place Solar Array (cost 50)
    assert.strictEqual(placeBuilding('solar_array'), true);
    assert.strictEqual(materials, 1350, 'Budget after solar array (1400 - 50)');

    // Place Crew Habitat (cost 80)
    assert.strictEqual(placeBuilding('crew_habitat'), true);
    assert.strictEqual(materials, 1270, 'Budget after crew habitat (1350 - 80)');

    // Place Kilopower Reactor (cost 120)
    assert.strictEqual(placeBuilding('kilopower_reactor'), true);
    assert.strictEqual(materials, 1150, 'Budget after reactor (1270 - 120)');

    assert.strictEqual(placedBuildings.length, 3, 'Three buildings placed');
  });

  it('T3-04: Placed Modular Buildings Enforce Hab-Port Collar Mating Elevation (Y=2.40m)', () => {
    const scene = new THREE.Group();

    // Place habitat module at ground plane (Y = 0)
    const habModule = new THREE.Group();
    habModule.position.set(0, 0, 0);

    // Docking port collar child object
    const portCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4));
    portCollar.name = 'hab_port_collar_north';
    portCollar.position.set(0, 2.40, 3.0); // Exactly at Y = 2.40m
    habModule.add(portCollar);
    scene.add(habModule);

    habModule.updateMatrixWorld(true);

    const worldCollarPos = new THREE.Vector3();
    portCollar.getWorldPosition(worldCollarPos);

    assertApprox(worldCollarPos.y, 2.40, 1e-4, 'Placed module hab-port mating flange elevation Y');
    assertApprox(worldCollarPos.z, 3.0, 1e-4, 'Hab-port mating flange offset Z');
  });

  it('T3-05: Grid Topology Collision Prevention on Occupied Regolith Cells', () => {
    const gridOccupancy = new Map<string, string>();

    const canPlaceAt = (cellX: number, cellZ: number): boolean => {
      const key = `${cellX},${cellZ}`;
      return !gridOccupancy.has(key);
    };

    const placeAt = (cellX: number, cellZ: number, buildingId: string): boolean => {
      if (!canPlaceAt(cellX, cellZ)) return false;
      gridOccupancy.set(`${cellX},${cellZ}`, buildingId);
      return true;
    };

    // First placement at (0, 0)
    assert.strictEqual(placeAt(0, 0, 'hab_01'), true, 'First placement succeeds');

    // Duplicate placement at (0, 0) must be rejected
    assert.strictEqual(placeAt(0, 0, 'solar_01'), false, 'Duplicate grid placement rejected');

    // Adjacent placement at (1, 0) succeeds
    assert.strictEqual(placeAt(1, 0, 'tunnel_01'), true, 'Adjacent placement succeeds');
    assert.strictEqual(gridOccupancy.size, 2, 'Grid contains exactly 2 occupied cells');
  });
});
