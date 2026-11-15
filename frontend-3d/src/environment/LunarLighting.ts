/**
 * Lunar Surface Lighting Rig
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements physically calibrated lunar polar lighting:
 * - Collimated Sun DirectionalLight with PCF soft shadows, anti-acne biasing,
 *   and 4096x4096 shadow map covering the outpost radius [-50, 50]m
 * - Sunward elevated fill light (~35° elevation) to illuminate horizontal regolith and roofs
 * - Opposing exosphere bounce fill light (~30° elevation) to eliminate crushed pitch-black shadows
 * - Phase-opposed Earthshine fill light (0x8ec2ff, 0.35 to 2.8 lx)
 * - Lunar regolith bounce & cosmic background ambient HemisphereLight (0xbcd0ea / 0x7c8898, 1.10 day / 0.70 night)
 * - Multi-point industrial workspace floodlights covering central hab, landing pad, and power yard
 */

import * as THREE from 'three';
import type { SolarEphemeris } from '../core/types';

export interface LunarLightingOptions {
  sunColor?: number;
  sunIntensity?: number;
  earthshineColor?: number;
  maxEarthshineIntensity?: number;
  shadowMapSize?: number;
  baseRadiusMeters?: number;
  ambientSkyColor?: number;
  ambientGroundColor?: number;
  ambientIntensity?: number;
  nightAmbientIntensity?: number;
  workLightIntensity?: number;
}

export class LunarLighting {
  public readonly sunLight: THREE.DirectionalLight;
  public readonly sunFillLight: THREE.DirectionalLight;
  public readonly opposingFillLight: THREE.DirectionalLight;
  public readonly earthLight: THREE.DirectionalLight;
  public readonly ambientLight: THREE.HemisphereLight;
  public readonly baseWorkLight: THREE.PointLight;
  public readonly padWorkLight: THREE.PointLight;
  public readonly powerWorkLight: THREE.PointLight;
  public readonly lightGroup: THREE.Group;

  private readonly maxSunIntensity: number;
  private readonly maxEarthIntensity: number;
  private readonly dayAmbientIntensity: number;
  private readonly nightAmbientIntensity: number;
  private readonly maxWorkLightIntensity: number;
  private readonly sunDistance: number = 500.0;
  private isDaylightState: boolean = true;
  private onDayNightChangeCallbacks: Array<(isDaylight: boolean) => void> = [];

  constructor(scene: THREE.Scene, options: LunarLightingOptions = {}) {
    this.lightGroup = new THREE.Group();
    this.lightGroup.name = 'lunar_lighting_rig';

    this.maxSunIntensity = options.sunIntensity ?? 3.8;
    this.maxEarthIntensity = options.maxEarthshineIntensity ?? 1.6;
    this.dayAmbientIntensity = options.ambientIntensity ?? 0.95;
    this.nightAmbientIntensity = options.nightAmbientIntensity ?? 0.55;
    this.maxWorkLightIntensity = options.workLightIntensity ?? 5.0;

    // 1. Primary Collimated Sun Light
    this.sunLight = new THREE.DirectionalLight(
      options.sunColor ?? 0xfffaed,
      this.maxSunIntensity
    );
    this.sunLight.name = 'lunar_sun_directional_light';
    this.sunLight.castShadow = true;

    // Shadow Map Configuration (4096 x 4096 for crisp polar shadows)
    const mapSize = options.shadowMapSize ?? 4096;
    this.sunLight.shadow.mapSize.width = mapSize;
    this.sunLight.shadow.mapSize.height = mapSize;

    // Frustum sized to colony footprint ([-50, 50] meters)
    const baseRadius = options.baseRadiusMeters ?? 50.0;
    this.sunLight.shadow.camera.left = -baseRadius;
    this.sunLight.shadow.camera.right = baseRadius;
    this.sunLight.shadow.camera.top = baseRadius;
    this.sunLight.shadow.camera.bottom = -baseRadius;
    this.sunLight.shadow.camera.near = 10.0;
    this.sunLight.shadow.camera.far = 1200.0;

    // Anti-Acne Biasing for Low-Angle Grazing
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.02;

    // Center target at base origin
    this.sunLight.target.position.set(0, 0, 0);
    this.lightGroup.add(this.sunLight.target);
    this.lightGroup.add(this.sunLight);

    // 2. Sunward Secondary Elevation Fill (illuminates horizontal ground & roofs at low grazing sun)
    this.sunFillLight = new THREE.DirectionalLight(
      options.sunColor ?? 0xfff8ea,
      0.0
    );
    this.sunFillLight.name = 'lunar_sun_fill_light';
    this.sunFillLight.castShadow = false; // Never casts shadows; keeps primary polar shadows crisp
    this.sunFillLight.target.position.set(0, 0, 0);
    this.lightGroup.add(this.sunFillLight.target);
    this.lightGroup.add(this.sunFillLight);

    // 3. Opposing Horizon Bounce Fill (prevents dark tone crushing on module backs and shadows)
    this.opposingFillLight = new THREE.DirectionalLight(
      0x90a8c8,
      0.0
    );
    this.opposingFillLight.name = 'lunar_opposing_bounce_fill';
    this.opposingFillLight.castShadow = false;
    this.opposingFillLight.target.position.set(0, 0, 0);
    this.lightGroup.add(this.opposingFillLight.target);
    this.lightGroup.add(this.opposingFillLight);

    // 4. Earthshine Secondary Fill Light (Oceanic cyan-blue 0x8ec2ff)
    this.earthLight = new THREE.DirectionalLight(
      options.earthshineColor ?? 0x8ec2ff,
      0.0 // Adjusted dynamically by ephemeris
    );
    this.earthLight.name = 'earthshine_fill_light';
    this.earthLight.castShadow = false; // Diffuse irradiance from 1.9° Earth disk
    this.earthLight.position.set(0, 200, 450);
    this.earthLight.target.position.set(0, 0, 0);
    this.lightGroup.add(this.earthLight.target);
    this.lightGroup.add(this.earthLight);

    // 5. Regolith Bounce & Cosmic Ambient
    this.ambientLight = new THREE.HemisphereLight(
      options.ambientSkyColor ?? 0xbcd0ea,   // Bright crisp celestial sky bounce / starlight
      options.ambientGroundColor ?? 0x7c8898, // Bright diffuse regolith floor bounce
      this.dayAmbientIntensity
    );
    this.ambientLight.name = 'lunar_regolith_bounce_ambient';
    this.lightGroup.add(this.ambientLight);

    // 6. Central Outpost Workspace Floodlight
    this.baseWorkLight = new THREE.PointLight(
      0xfff8ee,
      this.maxWorkLightIntensity * 0.6,
      280.0,
      0.7
    );
    this.baseWorkLight.name = 'outpost_workspace_floodlight';
    this.baseWorkLight.position.set(0, 18.0, 0);
    this.baseWorkLight.castShadow = false;
    this.lightGroup.add(this.baseWorkLight);

    // 7. Landing Pad Perimeter Floodlight
    this.padWorkLight = new THREE.PointLight(
      0xfff2e0,
      this.maxWorkLightIntensity * 0.5,
      200.0,
      0.8
    );
    this.padWorkLight.name = 'landing_pad_floodlight';
    this.padWorkLight.position.set(45.0, 14.0, 35.0);
    this.padWorkLight.castShadow = false;
    this.lightGroup.add(this.padWorkLight);

    // 8. Power Yard Perimeter Floodlight
    this.powerWorkLight = new THREE.PointLight(
      0xd8eeff,
      this.maxWorkLightIntensity * 0.5,
      200.0,
      0.8
    );
    this.powerWorkLight.name = 'power_yard_floodlight';
    this.powerWorkLight.position.set(-18.0, 14.0, -20.0);
    this.powerWorkLight.castShadow = false;
    this.lightGroup.add(this.powerWorkLight);

    scene.add(this.lightGroup);
  }

  public onDayNightChange(callback: (isDaylight: boolean) => void): void {
    this.onDayNightChangeCallbacks.push(callback);
  }

  public update(ephemeris: SolarEphemeris): void {
    // 1. Position Sun along ephemeris unit vector
    const dir = ephemeris.sunDirection;
    this.sunLight.position.set(
      dir.x * this.sunDistance,
      dir.y * this.sunDistance,
      dir.z * this.sunDistance
    );
    this.sunLight.updateMatrixWorld(true);

    // 2. Elevate Sun Fill Light along same azimuth (~35° elevation) to illuminate ground
    const fillElevation = Math.max(ephemeris.sunElevationRad, 0.60);
    const fillCos = Math.cos(fillElevation);
    const fillSin = Math.sin(fillElevation);
    this.sunFillLight.position.set(
      fillCos * Math.sin(ephemeris.sunAzimuthRad) * this.sunDistance,
      fillSin * this.sunDistance,
      fillCos * Math.cos(ephemeris.sunAzimuthRad) * this.sunDistance
    );
    this.sunFillLight.updateMatrixWorld(true);

    // 3. Opposing Fill Light (from azimuth + PI, ~30° elevation) for shadow fill
    const oppAzimuth = ephemeris.sunAzimuthRad + Math.PI;
    const oppElev = 0.52; // ~30 degrees
    this.opposingFillLight.position.set(
      Math.cos(oppElev) * Math.sin(oppAzimuth) * this.sunDistance,
      Math.sin(oppElev) * this.sunDistance,
      Math.cos(oppElev) * Math.cos(oppAzimuth) * this.sunDistance
    );
    this.opposingFillLight.updateMatrixWorld(true);

    // 4. Modulate Direct Sunlight & Fill Intensities
    const isDay = ephemeris.solarYieldFactor > 0 && ephemeris.sunElevationRad > -0.005;
    if (isDay) {
      this.sunLight.intensity = this.maxSunIntensity * ephemeris.solarYieldFactor;
      this.sunFillLight.intensity = (this.maxSunIntensity * 0.65) * ephemeris.solarYieldFactor;
      this.opposingFillLight.intensity = (this.maxSunIntensity * 0.35) * ephemeris.solarYieldFactor;
      this.ambientLight.intensity = this.dayAmbientIntensity;
      this.baseWorkLight.intensity = this.maxWorkLightIntensity * 0.6;
      this.padWorkLight.intensity = this.maxWorkLightIntensity * 0.5;
      this.powerWorkLight.intensity = this.maxWorkLightIntensity * 0.5;
    } else {
      this.sunLight.intensity = 0.0;
      this.sunFillLight.intensity = 0.0;
      this.opposingFillLight.intensity = 0.0;
      this.ambientLight.intensity = this.nightAmbientIntensity;
      this.baseWorkLight.intensity = this.maxWorkLightIntensity;
      this.padWorkLight.intensity = this.maxWorkLightIntensity * 0.9;
      this.powerWorkLight.intensity = this.maxWorkLightIntensity * 0.9;
    }

    // 5. Modulate Earthshine Fill Light
    // ephemeris.earthshineIntensity ranges from 0.0 (solar noon) to 0.25 (lunar midnight).
    // Normalize to [0, 1] and provide a clear nocturnal baseline so night base is clearly lit.
    const earthshineRatio = Math.max(0, Math.min(1.0, ephemeris.earthshineIntensity / 0.25));
    this.earthLight.intensity = 0.35 + (this.maxEarthIntensity - 0.35) * earthshineRatio;

    // 6. Day / Night State Transition Notification
    if (isDay !== this.isDaylightState) {
      this.isDaylightState = isDay;
      for (const cb of this.onDayNightChangeCallbacks) {
        cb(this.isDaylightState);
      }
    }
  }

  public get isDaylight(): boolean {
    return this.isDaylightState;
  }

  public dispose(): void {
    if (this.sunLight.shadow && this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
    }
    this.onDayNightChangeCallbacks = [];
  }
}
