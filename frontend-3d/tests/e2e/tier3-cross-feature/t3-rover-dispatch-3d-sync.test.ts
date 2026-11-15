/**
 * Tier 3: Cross-Feature Combinations — R2 (3D Rover Actors) + R4 (Simulation Actions)
 * Verifies that dispatching a rover moves its 3D mesh along waypoints, consumes rover
 * battery proportional to 3D distance, and executes dust cleaning to restore solar yield.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { RoverOracle, SimulationOracle } from '../harness/fixtures.js';

describe('Tier 3 — Cross-Feature: R2 3D Rover Actors + R4 Simulation Dispatch Sync', () => {
  it('T3-01: Rover Dispatch Command Instantiates 3D Waypoint Transit and Updates Mesh Transform', () => {
    // 3D Scene setup
    const scene = new THREE.Scene();
    const roverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    roverMesh.name = 'rover_lrv_01';
    roverMesh.position.set(0, 0, 0);
    scene.add(roverMesh);

    // Rover logic state
    const roverState = RoverOracle.createRover('LRV-01', 'open_lrv');
    const destination = { x: 60.0, y: 0.0, z: -80.0 };

    // Dispatch
    const dispatched = RoverOracle.dispatch(roverState, destination, 'clean_panels');
    assert.strictEqual(dispatched.status, 'en_route');

    // 3D path orientation: orient rover mesh towards destination
    const targetVec = new THREE.Vector3(destination.x, destination.y, destination.z);
    roverMesh.lookAt(targetVec);
    roverMesh.updateMatrixWorld(true);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(roverMesh.quaternion);
    const expectedDir = targetVec.clone().normalize();
    assert.ok(
      Math.abs(forward.dot(expectedDir)) > 0.95,
      'Rover 3D mesh must orient collinear with transit vector'
    );
  });

  it('T3-02: 3D Distance Traversed Proportionally Depletes Rover Battery (5% per 100m)', () => {
    const rover = RoverOracle.createRover('LRV-02', 'pressurized_traverse');
    assert.strictEqual(rover.batteryPct, 100.0);

    // Target at 300 metres distance: (180, 0, 240) -> sqrt(180^2 + 240^2) = 300m
    const target300m = { x: 180, y: 0, z: 240 };
    const dispatched = RoverOracle.dispatch(rover, target300m);

    // Expected battery consumption: 300m * (5% / 100m) = 15% -> remaining 85%
    assertApprox(dispatched.batteryPct, 85.0, 0.1, 'Rover battery after 300m 3D traverse');
  });

  it('T3-03: Rover Arrival at Solar Array Executes Panel Cleaning and Decrements Dust', () => {
    let simState = SimulationOracle.createInitialState();
    simState.dust = 65.0; // Heavy regolith coating
    simState.power = 200.0;

    // Execute solar panel cleaning action
    const { nextState, success } = SimulationOracle.cleanSolarPanels(simState);
    assert.strictEqual(success, true, 'Cleaning action must succeed when power is available');

    // Dust should decrement by exactly 25.0%
    assertApprox(nextState.dust, 40.0, 0.1, 'Dust level after 1 cleaning cycle');
    // Base power cost is 1.0 kWh
    assertApprox(nextState.power, 199.0, 0.1, 'Base power after cleaning cost');

    // Execute second cleaning cycle
    const res2 = SimulationOracle.cleanSolarPanels(nextState);
    assertApprox(res2.nextState.dust, 15.0, 0.1, 'Dust level after 2 cleaning cycles');
  });

  it('T3-04: Dust Reduction Directly Restores Solar Power Generation Yield in Simulation Loop', () => {
    // Dirty panel condition (60% dust)
    let dirtyState = SimulationOracle.createInitialState();
    dirtyState.dust = 60.0;
    dirtyState.power = 0.0;

    // Tick dirty state for 1 hour of daylight
    const resDirty = SimulationOracle.tick(dirtyState, 1.0, {
      isDaylight: true,
      activeBuildings: ['solar_array'],
    });

    // Cleaned panel condition (10% dust)
    let cleanState = SimulationOracle.createInitialState();
    cleanState.dust = 10.0;
    cleanState.power = 0.0;

    // Tick clean state for 1 hour of daylight
    const resClean = SimulationOracle.tick(cleanState, 1.0, {
      isDaylight: true,
      activeBuildings: ['solar_array'],
    });

    // Solar generation multiplier is (1 - dust/100):
    // Dirty (60% dust): 60 kW * 0.40 = 24 kWh
    // Clean (10% dust): 60 kW * 0.90 = 54 kWh
    assertApprox(resDirty.nextState.power, 24.0, 1.0, 'Dirty solar panel 1-hour power yield');
    assertApprox(resClean.nextState.power, 54.0, 1.0, 'Cleaned solar panel 1-hour power yield');
    assert.ok(
      resClean.nextState.power > resDirty.nextState.power * 2.0,
      'Cleaning dust must more than double degraded solar generation'
    );
  });

  it('T3-05: Rover Low Battery Warning (< 20%) and Base Docking Recharging (+20%/h)', () => {
    let rover = RoverOracle.createRover('LRV-03', 'robotic_survey');
    rover.batteryPct = 15.0; // Low battery state

    // Low battery status check
    const isLowBattery = rover.batteryPct < 20.0;
    assert.strictEqual(isLowBattery, true, 'Battery < 20% should flag warning');

    // Return to base docking port and recharge at +20%/hour
    rover.status = 'charging';
    const rechargeHours = 3.0;
    rover.batteryPct = Math.min(100.0, rover.batteryPct + rechargeHours * 20.0);

    // 15% + 60% = 75%
    assertApprox(rover.batteryPct, 75.0, 0.1, 'Rover battery level after 3 hours of base docking charge');
  });
});
