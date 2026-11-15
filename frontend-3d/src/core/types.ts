/**
 * Core Astronomical and Simulation Types
 * NASA Outpost 3D Lunar Frontend
 * Conforms to PROJECT.md § Interface Contracts
 */

import type * as THREE from 'three';

/**
 * Celestial Time State contract per PROJECT.md § Interface Contracts
 */
export interface CelestialTimeState {
  totalHours: number;       // Elapsed mission hours (0 .. 708.734)
  sol: number;              // Current Sol (1 .. 30)
  timeOfDayHours: number;   // Sol hour (0 .. 24)
  synodicPhase: number;     // Normalized phase [0.0 .. 1.0)
  isDaylight: boolean;      // True if direct solar illumination > threshold
}

/**
 * Solar Ephemeris contract per PROJECT.md § Interface Contracts
 */
export interface SolarEphemeris {
  sunAzimuthRad: number;       // Solar azimuth angle [0 .. 2pi)
  sunElevationRad: number;     // Solar elevation angle [-0.0269 .. +0.0269] for polar rim
  sunDirection: THREE.Vector3; // Normalized unit vector pointing to sun
  earthshineIntensity: number; // 0.0 (lunar noon) to 0.25 (lunar midnight)
  solarYieldFactor: number;    // Normalized solar power generation efficiency [0 .. 1]
}

export type TimeMultiplier = 0 | 1 | 6 | 30 | 360 | 708;

export interface BuildingProductionRates {
  extraSolarKw: number;
  extraContinuousKw: number;
  extraBatteryKwh: number;
  foodPerTick: number;
  waterPerTick: number;
  o2PerTick: number;
  materialsPerTick: number;
}

export interface ResourceState {
  power: number;
  battery?: number;
  battery_max?: number;
  maxBattery?: number;
  continuousPowerKw?: number;
  stored_o2: number;
  oxygen: number;
  oxygen_pct?: number;
  co2: number;
  temperature: number;
  pressure: number;
  water: number;
  food: number;
  food_growth: number;
  radiation: number;
  radiation_protection: number;
  shield: number;
  dust: number;
  light_cycle: number;
  saturation: number;
  quenching: number;
  enthusiasm: number;
  health: number;
  sol: number;
  timeOfDayHours: number;
  isSheltered?: boolean;
  o2ResupplyOrdered?: boolean;
  o2CrisisTimerHours?: number;
  isPaused?: boolean;
  materials?: number;
  crew?: number;
  maxCrew?: number;
  cityLevel?: number;
  placedCount?: number;
  buildingProduction?: BuildingProductionRates;
}

export type CameraPresetId = 'central_hab' | 'greenhouse' | 'power_yard' | 'landing_pad' | 'rim_horizon';

export interface CameraPreset {
  id: CameraPresetId;
  name: string;
  description: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}
