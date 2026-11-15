/**
 * Application Entry Point & 3D Engine Bootstrap
 * NASA Outpost 3D Lunar Frontend
 *
 * Fully integrated production web application wiring together:
 * - Three.js WebGL Engine with shadow maps & HDR tone mapping
 * - Shackleton Crater vacuum celestial starfield & Earthshine system
 * - Collimated grazing solar directional lighting with realistic long polar shadows
 * - Procedural & GLB loaded lunar base habitats, tunnels, and landing pad
 * - Articulated lunar rover actors with waypoint transit and battery management
 * - Artemis lunar astronauts with realistic 1/6th-g hopping locomotion & shelter routines
 * - Mission Decision & Anomaly incident system based on anomalies.json
 * - 18-variable ECLSS life support and power simulation engine
 * - Canonical story timeline and Visual Novel dialogue modal
 * - Interactive HUD overlay with telemetry monitors, rover commands, and time scrubbing
 */

import * as THREE from 'three';
import { Engine } from './core/Engine';
import { EphemerisCalculator } from './astronomy/EphemerisCalculator';
import { TimeManager } from './astronomy/TimeManager';
import { LunarSky } from './environment/LunarSky';
import { LunarLighting } from './environment/LunarLighting';
import { TerrainManager } from './environment/TerrainManager';
import { CameraController } from './interaction/CameraController';
import { BaseLoader } from './base/BaseLoader';
import { RoverManager } from './rovers/RoverManager';
import { AstronautManager } from './actors/AstronautManager';
import { SimulationEngine } from './simulation/SimulationEngine';
import { MissionDecisionManager } from './simulation/MissionDecisionManager';
import { NarrativeManager } from './narrative/NarrativeManager';
import { HUDController } from './ui/HUDController';
import { CityBuilder } from './city/CityBuilder';
import { soundSystem } from './audio/SoundSystem';

console.log('[NASA Outpost 3D] Bootstrapping Production 3D Lunar Outpost Frontend...');
console.log(`[NASA Outpost 3D] Three.js revision: ${THREE.REVISION}`);

export interface AppInstance {
  engine: Engine;
  sky: LunarSky;
  lighting: LunarLighting;
  terrain: TerrainManager;
  baseLoader: BaseLoader;
  roverManager: RoverManager;
  astronautManager: AstronautManager;
  decisionManager: MissionDecisionManager;
  simEngine: SimulationEngine;
  narrativeManager: NarrativeManager;
  timeManager: TimeManager;
  cameraController: CameraController;
  hudController: HUDController;
  cityBuilder?: CityBuilder;
}

let appInstance: AppInstance | null = null;

export function initApp(): AppInstance | null {
  if (typeof document === 'undefined') {
    console.warn('[NASA Outpost 3D] Running in headless environment, skipping DOM mounting.');
    return null;
  }

  const container = document.getElementById('scene-container');
  if (!container) {
    console.error('[NASA Outpost 3D] Critical: #scene-container element not found.');
    return null;
  }

  // 1. Core 3D Engine & WebGLRenderer (calibrated for high-dynamic-range brightness)
  const engine = new Engine({
    container,
    fov: 60,
    near: 0.1,
    far: 2500.0,
    antialias: true,
    shadows: true,
    toneMapping: THREE.NeutralToneMapping,
    toneMappingExposure: 1.35,
  });

  // 2. Unscattered Vacuum Sky & Celestial Starfield (5,000 stars + Earth in opposition)
  const sky = new LunarSky(engine.scene, {
    starCount: 5000,
    starSphereRadius: 1500.0,
    earthDistance: 1200.0,
    earthRadius: 20.0,
  });

  // 3. Polar Grazing Lighting Rig & Earthshine Fill (bright, clear visibility day & night)
  const lighting = new LunarLighting(engine.scene, {
    sunColor: 0xfffaed,
    sunIntensity: 3.8,
    earthshineColor: 0x8ec2ff,
    maxEarthshineIntensity: 1.6,
    ambientIntensity: 0.95,
    nightAmbientIntensity: 0.55,
    workLightIntensity: 5.0,
    shadowMapSize: 4096,
    baseRadiusMeters: 75.0,
  });

  // 4. Shackleton Crater Ground Regolith Plane (400x400m with 4K diffuse & bump textures)
  const terrain = new TerrainManager(engine.scene, {
    size: 400.0,
    segments: 64,
    regolithColor: 0xd5dbe4,
    roughness: 0.82,
    metalness: 0.02,
    repeat: 16,
  });

  // 5. Central Mission Time Manager (Initial Sol 1, 06:00 LST = 6.0 hours)
  const timeManager = new TimeManager({
    initialHours: 6.0,
    defaultMultiplier: 1.0,
    season: 'equinox',
  });

  // 6. Camera Controller with Polar Ground Clamping & WASD Free Flight
  const cameraController = new CameraController(engine.camera, engine.renderer.domElement);
  cameraController.setPresetInstant('central_hab');

  // 7. Base Colony Loader (colony-overview.glb with 24 assembled modules + procedural fallback)
  const baseLoader = new BaseLoader(engine.scene);
  baseLoader.loadBase('./models/colony-overview.glb');

  // 8. Articulated Lunar Rovers (Survey Bot, Open LRV, Heavy Excavator)
  const roverManager = new RoverManager(engine.scene);

  // 9. Articulated Lunar Astronaut Actors (Low-g bunny hopping locomotion)
  const astronautManager = new AstronautManager(engine.scene);

  // 10. 18-Variable ECLSS Life Support & Power Simulation Engine
  const simEngine = new SimulationEngine();

  // 11. Canonical 14-Event Story Timeline & Visual Novel Narrative Manager
  const narrativeManager = new NarrativeManager(timeManager, simEngine, roverManager);

  // 12. Strategic Mission Decision & Anomaly Incidents Engine (anomalies.json)
  const decisionManager = new MissionDecisionManager(simEngine, astronautManager, roverManager, narrativeManager);
  narrativeManager.setDecisionManager(decisionManager);

  // 13. Interactive 3D City Builder Engine (snapping, holographic reticle, audio)
  const cityBuilder = new CityBuilder({
    scene: engine.scene,
    camera: engine.camera,
    domElement: engine.renderer.domElement,
    groundMesh: terrain.groundMesh,
    simEngine,
    sound: soundSystem,
    astronautManager,
  });

  // 14. Production Kid-Friendly HUD Overlay (City Builder Dock, MILO Guide, Telemetry, Inspector)
  const hudController = new HUDController({
    timeManager,
    cameraController,
    simEngine,
    roverManager,
    astronautManager,
    decisionManager,
    cityBuilder,
    baseLoader,
    containerId: 'hud-overlay',
  });

  // Initial ephemeris update
  const initialEphemeris = timeManager.getEphemeris();
  lighting.update(initialEphemeris);
  hudController.update(timeManager.getState(), initialEphemeris);

  // Day / Night state listener for nocturnal base illumination
  lighting.onDayNightChange((isDaylight) => {
    baseLoader.setNightMode(!isDaylight);
  });

  // 15. Register Main Simulation & Physics Tick Loop
  engine.addUpdateCallback('main_simulation_loop', (delta: number) => {
    // A. Advance astronomical clock
    const { timeState, ephemeris } = timeManager.update(delta);

    // B. Update celestial starfield and Earth rotation
    sky.update(ephemeris, delta);

    // C. Update solar azimuth, grazing polar elevation, and Earthshine
    lighting.update(ephemeris);

    // D. Update rover kinematics and waypoint movement
    roverManager.update(delta, (rover, task) => {
      if (task === 'clean_panels') {
        const res = simEngine.cleanSolarPanels();
        console.log('[main] Solar panels cleaned by rover. New dust level:', res.nextDust);
      } else if (task === 'rescue') {
        console.log('[main] Rescue operation complete by', rover.name);
      } else if (task === 'survey') {
        console.log('[main] Geological survey completed by', rover.name);
      }
    });

    // E. Update astronaut low-g hopping locomotion & patrol waypoints
    const baseLandmarks: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-12, 0, 4),
      new THREE.Vector3(15, 0, -10),
      new THREE.Vector3(28, 0, 20),
    ];
    if (cityBuilder) {
      for (const b of cityBuilder.placedBuildings.values()) {
        baseLandmarks.push(new THREE.Vector3(b.x, 0, b.z));
      }
    }
    astronautManager.update(delta, baseLandmarks);

    // F. Advance ECLSS simulation physics
    const simSpeed = timeManager.getMultiplier();
    if (simSpeed > 0 && !simEngine.state.isPaused) {
      const deltaHours = delta * simSpeed;
      simEngine.tick(deltaHours, ephemeris);
      simEngine.syncTime(timeState.sol, timeState.timeOfDayHours);
    }

    // G. Evaluate narrative story timeline triggers
    narrativeManager.checkTimeline(timeState.sol, timeState.timeOfDayHours);

    // H. Update camera transitions, keyboard flight, and chase target
    cameraController.update(delta);

    // I. Refresh HUD overlay telemetry, alerts, and time scrubber
    hudController.update(timeState, ephemeris);
  });

  // 16. Start Engine Rendering Loop
  engine.start();

  console.log('[NASA Outpost 3D] Production 3D Lunar Outpost successfully initialized.');

  appInstance = {
    engine,
    sky,
    lighting,
    terrain,
    baseLoader,
    roverManager,
    astronautManager,
    decisionManager,
    simEngine,
    narrativeManager,
    timeManager,
    cameraController,
    hudController,
    cityBuilder,
  };

  return appInstance;
}

// Auto-initialize when running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initApp();
    });
  } else {
    initApp();
  }
}

export {
  THREE,
  Engine,
  EphemerisCalculator,
  TimeManager,
  LunarSky,
  LunarLighting,
  TerrainManager,
  CameraController,
  BaseLoader,
  RoverManager,
  AstronautManager,
  SimulationEngine,
  MissionDecisionManager,
  NarrativeManager,
  HUDController,
  CityBuilder,
  soundSystem,
  appInstance,
};
