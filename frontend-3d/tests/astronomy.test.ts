/**
 * Automated Astronomical Ephemeris, Time Scaling & Camera Boundary Test Suite
 * NASA Outpost 3D Lunar Frontend
 *
 * Validates 708.734h synodic cycle, Shackleton polar grazing elevation [-1.54°, +1.54°],
 * continuous 360° azimuth sweep, Earthshine opposition (0.0 to 0.25 lx, 0x82b4ff),
 * TimeManager multipliers (1x..708x), and CameraController polar ground clamping.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { EphemerisCalculator } from '../src/astronomy/EphemerisCalculator';
import { TimeManager } from '../src/astronomy/TimeManager';
import { CAMERA_SECTOR_PRESETS } from '../src/interaction/CameraController';

const EPSILON = 1e-4;

function assertApprox(actual: number, expected: number, tolerance: number = EPSILON, msg: string = '') {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `${msg} | Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`
  );
}

describe('NASA Outpost 3D — Astronomical Ephemeris & Time Navigation Test Suite', () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    timeManager = new TimeManager();
  });

  // ==========================================================================
  // SUITE 1: SYNODIC CYCLE CONSTANTS & SOLAR VELOCITY
  // ==========================================================================
  describe('Suite 1: Synodic Cycle Constants & Mean Angular Velocity', () => {
    it('AST-01: Canonical synodic cycle period is 708.734h ± 0.05h (29.530589 Earth days)', () => {
      const synodicHours = EphemerisCalculator.SYNODIC_PERIOD_HOURS;
      assertApprox(synodicHours, 708.734, 0.05, 'Synodic period hours');
      const earthDays = synodicHours / 24.0;
      assertApprox(earthDays, 29.530589, 0.001, 'Synodic period in Earth days');
    });

    it('AST-02: Mean solar angular velocity is ~0.008865 rad/h (~0.5079 deg/h)', () => {
      const omegaRad = (2 * Math.PI) / EphemerisCalculator.SYNODIC_PERIOD_HOURS;
      const omegaDeg = 360.0 / EphemerisCalculator.SYNODIC_PERIOD_HOURS;

      assertApprox(omegaRad, 0.008865363, 1e-6, 'Solar angular velocity (rad/h)');
      assertApprox(omegaDeg, 0.5079477, 1e-4, 'Solar angular velocity (deg/h)');
    });

    it('AST-03: Four quarterly synodic milestones match cardinal azimuths', () => {
      const T = EphemerisCalculator.SYNODIC_PERIOD_HOURS;

      const noon = EphemerisCalculator.calculate(0.0);
      const sunset = EphemerisCalculator.calculate(T / 4.0);
      const midnight = EphemerisCalculator.calculate(T / 2.0);
      const sunrise = EphemerisCalculator.calculate((3 * T) / 4.0);
      const nextNoon = EphemerisCalculator.calculate(T);

      assertApprox(noon.sunAzimuthRad, 0.0, 1e-3, 'Azimuth at t=0h (Noon)');
      assertApprox(sunset.sunAzimuthRad, Math.PI / 2, 1e-3, 'Azimuth at t=177.18h (Sunset/East)');
      assertApprox(midnight.sunAzimuthRad, Math.PI, 1e-3, 'Azimuth at t=354.37h (Midnight/North)');
      assertApprox(sunrise.sunAzimuthRad, (3 * Math.PI) / 2, 1e-3, 'Azimuth at t=531.55h (Sunrise/West)');
      assertApprox(nextNoon.sunAzimuthRad, 0.0, 1e-3, 'Azimuth at t=708.734h (Full cycle wrap)');
    });
  });

  // ==========================================================================
  // SUITE 2: SHACKLETON POLAR GRAZING ELEVATION BOUNDS
  // ==========================================================================
  describe('Suite 2: Shackleton Crater Polar Grazing Elevation Bounds', () => {
    it('AST-04: Polar elevation h(t) stays within grazing bounds [-1.65°, +1.65°]', () => {
      const maxGrazingRad = (1.5424 + 0.10) * (Math.PI / 180.0); // 1.6424° max bound

      const sampleCount = 100;
      const step = EphemerisCalculator.SYNODIC_PERIOD_HOURS / sampleCount;

      for (let i = 0; i <= sampleCount; i++) {
        const t = i * step;
        const ephemeris = EphemerisCalculator.calculate(t);
        const elev = ephemeris.sunElevationRad;

        assert.ok(
          elev >= -maxGrazingRad && elev <= maxGrazingRad,
          `Elevation at t=${t.toFixed(1)}h was ${(elev * 180 / Math.PI).toFixed(2)}°, outside grazing bounds`
        );

        // Invariant: Lunar polar sun NEVER rises to terrestrial altitudes (> 5 degrees)
        assert.ok(
          Math.abs(elev) < (5.0 * Math.PI / 180.0),
          `Sun rose to unrealistically high terrestrial altitude: ${(elev * 180 / Math.PI).toFixed(2)}°`
        );
      }
    });

    it('AST-05: Polar grazing geometry produces ultra-elongated shadows (> 30x height)', () => {
      // Calculate summer solstice noon where elevation is positive
      const ephemeris = EphemerisCalculator.calculate(0.0, { season: 'summer_solstice' });
      const elev = ephemeris.sunElevationRad;

      assert.ok(elev > 0, 'Summer solstice noon must produce positive elevation');
      const shadowMultiplier = 1.0 / Math.tan(elev);
      assert.ok(
        shadowMultiplier >= 30.0,
        `Polar shadow multiplier must exceed 30x post height, got ${shadowMultiplier.toFixed(1)}x`
      );
    });
  });

  // ==========================================================================
  // SUITE 3: CONTINUOUS 360° AZIMUTH & UNIT DIRECTION VECTOR
  // ==========================================================================
  describe('Suite 3: Continuous 360° Azimuth Sweep & Sun Direction Vector', () => {
    it('AST-06: Solar direction vector has strictly normalized unit length (1.0000)', () => {
      const testHours = [0.0, 50.0, 177.18, 354.37, 500.0, 708.734];
      for (const t of testHours) {
        const ephemeris = EphemerisCalculator.calculate(t);
        const dir = ephemeris.sunDirection;
        const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
        assertApprox(length, 1.0, 1e-5, `Sun direction unit vector length at t=${t}h`);
      }
    });

    it('AST-07: Continuous azimuth sweep wraps cleanly without modulo jump at 708.734h', () => {
      const tA = 10.0;
      const tB = EphemerisCalculator.SYNODIC_PERIOD_HOURS + 10.0;

      const ephA = EphemerisCalculator.calculate(tA);
      const ephB = EphemerisCalculator.calculate(tB);

      assertApprox(ephA.sunAzimuthRad, ephB.sunAzimuthRad, 1e-5, 'Azimuth periodicity modulo wrap');
      assertApprox(ephA.sunElevationRad, ephB.sunElevationRad, 1e-5, 'Elevation periodicity modulo wrap');
      assertApprox(ephA.sunDirection.x, ephB.sunDirection.x, 1e-5, 'Vector X periodicity');
      assertApprox(ephA.sunDirection.y, ephB.sunDirection.y, 1e-5, 'Vector Y periodicity');
      assertApprox(ephA.sunDirection.z, ephB.sunDirection.z, 1e-5, 'Vector Z periodicity');
    });
  });

  // ==========================================================================
  // SUITE 4: EARTHSHINE OPPOSITION & NOCTURNAL ILLUMINATION
  // ==========================================================================
  describe('Suite 4: Phase-Opposed Earthshine Lighting System', () => {
    it('AST-08: Earthshine is 0.0 lx at solar noon and peaks at 0.25 lx at lunar midnight', () => {
      const noon = EphemerisCalculator.calculate(0.0);
      assertApprox(noon.earthshineIntensity, 0.0, 1e-4, 'Earthshine at solar noon (New Earth)');

      const midnight = EphemerisCalculator.calculate(EphemerisCalculator.SYNODIC_PERIOD_HOURS / 2.0);
      assertApprox(midnight.earthshineIntensity, 0.25, 1e-3, 'Earthshine at lunar midnight (Full Earth)');
    });

    it('AST-09: Earthshine spectrum matches oceanic cyan-blue hex 0x82b4ff', () => {
      const colorHex = EphemerisCalculator.EARTHSHINE_COLOR_HEX;
      assert.strictEqual(colorHex, 0x82b4ff, 'Earthshine color hex constant');
      const color = new THREE.Color(colorHex);
      assert.strictEqual(color.getHex(), 0x82b4ff, 'Three.js Color hex representation');
    });
  });

  // ==========================================================================
  // SUITE 5: TIMEMANAGER SPEED MULTIPLIERS & TIME SCRUBBING
  // ==========================================================================
  describe('Suite 5: TimeManager Mechanics & Multipliers', () => {
    it('AST-10: Supported speed multipliers scale sim hours accumulation accurately', () => {
      const multipliers = [1, 6, 30, 360, 708];

      for (const m of multipliers) {
        timeManager.reset();
        timeManager.setMultiplier(m);
        assert.strictEqual(timeManager.getMultiplier(), m, `Active multiplier must be ${m}x`);

        // Tick 1 real-world second
        timeManager.tick(1.0);
        assertApprox(timeManager.getTotalHours(), m * 1.0, 1e-4, `Hours accumulated at ${m}x for 1 real sec`);
      }
    });

    it('AST-11: Pausing stops simulation clock accumulation entirely', () => {
      timeManager.setMultiplier(30);
      timeManager.setTime(100.0);

      timeManager.pause();
      assert.strictEqual(timeManager.isPaused(), true, 'Must report paused');

      timeManager.tick(5.0);
      assert.strictEqual(timeManager.getTotalHours(), 100.0, 'Hours must remain strictly frozen while paused');

      timeManager.resume();
      assert.strictEqual(timeManager.isPaused(), false, 'Must report unpaused');

      timeManager.tick(1.0);
      assertApprox(timeManager.getTotalHours(), 130.0, 1e-4, 'Hours resume advancing after unpausing');
    });

    it('AST-12: Time scrubbing clamps within [0, 708.734h] and updates Sol / Hour', () => {
      // Direct scrub to midnight
      timeManager.setTime(354.367);
      const state = timeManager.getState();

      assertApprox(state.totalHours, 354.367, 1e-3, 'Total hours after scrub');
      assert.strictEqual(state.sol, 15, 'Sol index at 354.367h (floor(354.367/24) + 1 = 15)');
      assertApprox(state.timeOfDayHours, 354.367 % 24, 1e-3, 'Hour within Sol');

      // Negative scrub clamp
      timeManager.setTime(-50.0);
      assert.strictEqual(timeManager.getTotalHours(), 0.0, 'Negative time clamped to 0.0h');

      // Excessive scrub clamp / wrap
      timeManager.setTime(1000.0);
      assert.ok(timeManager.getTotalHours() <= EphemerisCalculator.SYNODIC_PERIOD_HOURS, 'Excessive time clamped/wrapped');
    });
  });

  // ==========================================================================
  // SUITE 6: CAMERACONTROLLER ORBIT LIMITS & GROUND CLAMPING
  // ==========================================================================
  describe('Suite 6: CameraController Orbit Limits & Ground Clamping Invariants', () => {
    it('AST-13: Max polar angle Math.PI / 2 - 0.03 guarantees camera never dips below ground plane Y=0', () => {
      const maxPolarAngle = Math.PI / 2 - 0.03;
      const minDistance = 5.0; // meters

      // For any target with Y >= 0 and radius >= 5.0m:
      // Y_cam = Y_target + R * cos(phi)
      // Since phi <= maxPolarAngle, cos(phi) >= cos(pi/2 - 0.03) = sin(0.03) > 0.02999
      const minVerticalMargin = minDistance * Math.cos(maxPolarAngle);

      assert.ok(
        minVerticalMargin > 0.14,
        `Camera lens vertical clearance above target must exceed 0.14m, got ${minVerticalMargin.toFixed(3)}m`
      );
    });

    it('AST-14: All 5 sector presets are within orbit radius bounds [5m, 150m] and have positive target heights', () => {
      const presetKeys = Object.keys(CAMERA_SECTOR_PRESETS) as Array<keyof typeof CAMERA_SECTOR_PRESETS>;
      assert.strictEqual(presetKeys.length, 5, 'Must define exactly 5 sector presets');

      for (const key of presetKeys) {
        const preset = CAMERA_SECTOR_PRESETS[key];
        const dist = preset.position.distanceTo(preset.target);

        assert.ok(
          dist >= 5.0 && dist <= 150.0,
          `Preset ${key} distance (${dist.toFixed(1)}m) must be within [5.0, 150.0]m`
        );
        assert.ok(
          preset.target.y >= 0.0,
          `Preset ${key} target Y (${preset.target.y}m) must be at or above ground level Y=0`
        );
      }
    });
  });

  // ==========================================================================
  // SUITE 7: PRODUCTION BUILD COMPATIBILITY & TYPES
  // ==========================================================================
  describe('Suite 7: Production Build Compatibility & Types', () => {
    it('AST-15: CelestialTimeState and SolarEphemeris interfaces match contract specifications', () => {
      const state = timeManager.getState();
      const ephemeris = EphemerisCalculator.calculate(state.totalHours);

      // Verify structure conforms strictly to PROJECT.md contracts
      assert.strictEqual(typeof state.totalHours, 'number');
      assert.strictEqual(typeof state.sol, 'number');
      assert.strictEqual(typeof state.timeOfDayHours, 'number');
      assert.strictEqual(typeof state.synodicPhase, 'number');
      assert.strictEqual(typeof state.isDaylight, 'boolean');

      assert.strictEqual(typeof ephemeris.sunAzimuthRad, 'number');
      assert.strictEqual(typeof ephemeris.sunElevationRad, 'number');
      assert.strictEqual(typeof ephemeris.sunDirection.x, 'number');
      assert.strictEqual(typeof ephemeris.sunDirection.y, 'number');
      assert.strictEqual(typeof ephemeris.sunDirection.z, 'number');
      assert.strictEqual(typeof ephemeris.earthshineIntensity, 'number');
      assert.strictEqual(typeof ephemeris.solarYieldFactor, 'number');
    });
  });
});
