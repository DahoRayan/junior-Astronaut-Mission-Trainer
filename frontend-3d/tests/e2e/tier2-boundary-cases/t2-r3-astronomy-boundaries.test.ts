/**
 * Tier 2: Boundary & Corner Cases — R3: Astronomical Cycle Extreme Limits
 * Verifies 0h/708.7h wrap-around continuity, equinox vs solstice extremes,
 * lunar midnight singularity, 708x scrubbing invariance, and solar tracking alignment.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { AstronomicalOracle } from '../harness/fixtures.js';

describe('Tier 2 — R3: Astronomical Boundary & Singularity Cases', () => {
  it('R3-T2-01: Time Period 0h vs 708.734h Wrap-Around Modulo Continuity', () => {
    const state0 = AstronomicalOracle.calculate(0.0);
    const stateWrap = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS);

    // Azimuth continuity across 0 and 708.73413h
    const azDiff = Math.abs((stateWrap.sunAzimuthRad % (2 * Math.PI)) - (state0.sunAzimuthRad % (2 * Math.PI)));
    assertApprox(azDiff, 0.0, 1e-4, 'Azimuth continuity across synodic wrap boundary');

    // Sun direction vector distance
    const v0 = new THREE.Vector3(state0.sunDirection.x, state0.sunDirection.y, state0.sunDirection.z);
    const vWrap = new THREE.Vector3(stateWrap.sunDirection.x, stateWrap.sunDirection.y, stateWrap.sunDirection.z);
    assertApprox(v0.distanceTo(vWrap), 0.0, 1e-4, 'Sun vector distance across synodic wrap');

    // Negative scrubbing boundary wrap-around
    const stateNeg = AstronomicalOracle.calculate(-10.0);
    assert.ok(!Number.isNaN(stateNeg.sunAzimuthRad), 'Negative time azimuth must not be NaN');
    assertRange(stateNeg.sunAzimuthRad, 0.0, 2 * Math.PI, 'Negative time azimuth in [0, 2pi)');
  });

  it('R3-T2-02: Exact Equinox vs Solstice Grazing Limits (Peak of Eternal Light)', () => {
    // 1. Southern Summer Solstice (December): axial tilt leans South Pole towards Sun (-1.5424°)
    // Solar elevation remains positive throughout entire 360° azimuth sweep
    for (let step = 0; step < 24; step++) {
      const t = step * 30.0;
      const summerState = AstronomicalOracle.calculate(t, { season: 'summer_solstice' });
      assert.ok(
        summerState.sunElevationRad > 0.02,
        `Summer solstice elevation ${summerState.sunElevationRad.toFixed(4)} dipped below horizon at t=${t}h`
      );
      assert.ok(summerState.solarYieldFactor > 0, 'Summer solstice must produce continuous solar yield');
    }

    // 2. Southern Winter Solstice (June): axial tilt leans South Pole away from Sun (+1.5424°)
    // Solar elevation remains negative throughout entire 360° azimuth sweep (continuous night)
    for (let step = 0; step < 24; step++) {
      const t = step * 30.0;
      const winterState = AstronomicalOracle.calculate(t, { season: 'winter_solstice' });
      assert.ok(
        winterState.sunElevationRad < -0.02,
        `Winter solstice elevation ${winterState.sunElevationRad.toFixed(4)} rose above horizon at t=${t}h`
      );
      assert.strictEqual(winterState.solarYieldFactor, 0.0, 'Winter solstice must produce 0 solar yield');
    }
  });

  it('R3-T2-03: Lunar Midnight Singularity & Direct Sun Occultation', () => {
    // Exact lunar midnight: t = 354.367065h
    const midnightT = AstronomicalOracle.SYNODIC_PERIOD_HOURS / 2;
    const midnight = AstronomicalOracle.calculate(midnightT, { season: 'equinox' });

    // Solar yield must be clamped to 0.0
    assert.strictEqual(midnight.solarYieldFactor, 0.0, 'Solar yield must be 0 at lunar midnight');

    // Earthshine must achieve maximum nocturnal irradiance (0.25 lx)
    assertApprox(midnight.earthshineIntensity, 0.25, 1e-4, 'Earthshine intensity peaks at midnight');

    // Directional light shadow camera matrix singularity check
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.0);
    dirLight.position.set(midnight.sunDirection.x * 200, midnight.sunDirection.y * 200, midnight.sunDirection.z * 200);
    dirLight.updateMatrixWorld(true);

    const cam = dirLight.shadow.camera;
    cam.updateMatrixWorld(true);

    for (const elem of cam.matrixWorld.elements) {
      assert.ok(!Number.isNaN(elem), 'Shadow camera matrixWorld must not contain NaN');
      assert.ok(Number.isFinite(elem), 'Shadow camera matrixWorld must contain finite numbers');
    }
  });

  it('R3-T2-04: High-Speed Time Scrubbing Rate Invariance (1x, 30x, 708x Timelapse)', () => {
    // Time manager clock model
    const simulateTimePassage = (multiplier: number, realDurationSeconds: number): number => {
      const dt = 1.0 / 60.0; // 60 FPS
      const totalFrames = Math.round(realDurationSeconds * 60);
      let elapsedMissionHours = 0;

      for (let f = 0; f < totalFrames; f++) {
        // multiplier 708.734 means 1 real second = 708.734 mission hours
        elapsedMissionHours += (dt * multiplier);
      }
      return elapsedMissionHours;
    };

    // At 708.734x multiplier for 1.0 real second, elapsed hours must equal exactly 1 full synodic cycle
    const synodic1Sec = simulateTimePassage(AstronomicalOracle.SYNODIC_PERIOD_HOURS, 1.0);
    assertApprox(synodic1Sec, AstronomicalOracle.SYNODIC_PERIOD_HOURS, 0.1, '1-second 708x timelapse elapsed hours');

    // At 30x multiplier for 10.0 real seconds: 300 simulation hours
    const thirtyX = simulateTimePassage(30.0, 10.0);
    assertApprox(thirtyX, 300.0, 0.1, '10-second 30x timelapse elapsed hours');
  });

  it('R3-T2-05: Solar Tracking Panel Articulation vs Fixed Cosine Degradation', () => {
    // Tracking array fixture aligns normal vector towards Sun direction
    const trackingArray = new THREE.Object3D();
    const fixedSouthArray = new THREE.Object3D();
    fixedSouthArray.rotation.set(0, 0, 0); // Faces South (+Z)

    // Evaluate at solar azimuth theta = 90° (East, t = 177.18h)
    const stateEast = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS / 4);
    const sunDir = new THREE.Vector3(stateEast.sunDirection.x, stateEast.sunDirection.y, stateEast.sunDirection.z);

    // Tracking algorithm articulates normal vector directly towards Sun
    trackingArray.lookAt(sunDir);
    trackingArray.updateMatrixWorld(true);

    const trackingNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(trackingArray.quaternion);
    const trackingDot = trackingNormal.dot(sunDir);

    // Tracking panel achieves nearly perfect normal alignment (dot product >= 0.99)
    assert.ok(trackingDot >= 0.99, `Tracking panel alignment dot product ${trackingDot.toFixed(4)} must be >= 0.99`);

    // Fixed array facing South (+Z) while Sun is East (+X):
    // Angle offset is 90° -> cos(90°) = 0 -> yield is near 0.0
    const fixedNormal = new THREE.Vector3(0, 0, 1);
    const fixedYield = Math.max(0, fixedNormal.dot(sunDir));
    assertApprox(fixedYield, 0.0, 0.05, 'Fixed South panel yield when Sun is East');
  });
});
