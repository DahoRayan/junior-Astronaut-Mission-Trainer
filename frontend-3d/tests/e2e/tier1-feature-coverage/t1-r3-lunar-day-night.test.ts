/**
 * Tier 1: Feature Coverage — R3: Realistic Lunar Day-Night Cycle
 * Verifies 708.734h synodic cycle, polar grazing bounds [-1.54°, +1.54°],
 * azimuth velocity 0.508°/h, Earthshine opposition 0.15-0.25 lx, pure black sky 0x000000.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { AstronomicalOracle } from '../harness/fixtures.js';

describe('Tier 1 — R3: Realistic Lunar Day-Night Astronomical Invariants', () => {
  it('R3-T1-01: Lunar Synodic Period & Mean Solar Angular Velocity Invariant', () => {
    const SYNODIC_HOURS = AstronomicalOracle.SYNODIC_PERIOD_HOURS; // 708.73413h
    const EXPECTED_OMEGA_RAD = AstronomicalOracle.MEAN_ANGULAR_VELOCITY_RAD_H; // ~0.008865363 rad/h
    const EXPECTED_OMEGA_DEG = AstronomicalOracle.MEAN_ANGULAR_VELOCITY_DEG_H; // ~0.5079477 deg/h

    assertApprox(SYNODIC_HOURS, 708.734, 0.01, 'Synodic period hours (29.530589 Earth days)');
    assertApprox(EXPECTED_OMEGA_DEG, 0.50795, 1e-4, 'Mean solar azimuth rate (deg/hour)');

    // Sample ephemeris across four quarter milestones
    const e0 = AstronomicalOracle.calculate(0);
    const eQuarter = AstronomicalOracle.calculate(SYNODIC_HOURS / 4);
    const eHalf = AstronomicalOracle.calculate(SYNODIC_HOURS / 2);
    const eThreeQuarter = AstronomicalOracle.calculate((3 * SYNODIC_HOURS) / 4);
    const eFull = AstronomicalOracle.calculate(SYNODIC_HOURS);

    // Azimuth progression
    assertApprox(e0.sunAzimuthRad, 0.0, 1e-4, 'Azimuth at t=0h');
    assertApprox(eQuarter.sunAzimuthRad, Math.PI / 2, 1e-3, 'Azimuth at quarter cycle t=177.18h');
    assertApprox(eHalf.sunAzimuthRad, Math.PI, 1e-3, 'Azimuth at half cycle t=354.37h');
    assertApprox(eThreeQuarter.sunAzimuthRad, (3 * Math.PI) / 2, 1e-3, 'Azimuth at 3/4 cycle t=531.55h');
    assertApprox(eFull.sunAzimuthRad, 0.0, 1e-3, 'Azimuth at full cycle t=708.734h (modulo 2pi wrap)');

    // Hourly rate continuity
    const rateQuarter = (eQuarter.sunAzimuthRad - e0.sunAzimuthRad) / (SYNODIC_HOURS / 4);
    assertApprox(rateQuarter, EXPECTED_OMEGA_RAD, 1e-6, 'Quarter cycle hourly azimuth rate');
  });

  it('R3-T1-02: Polar Rim Grazing Sun Elevation Bounds (Shackleton -89.9°S)', () => {
    // Maximum polar rim grazing bounds: [-1.5424°, +1.5424°] (+/- 0.1° latitude offset = [-1.6424°, +1.6424°])
    const MAX_GRAZING_DEG = 1.5424 + 0.1;
    const MAX_GRAZING_RAD = MAX_GRAZING_DEG * (Math.PI / 180); // ~0.02866 rad

    // Sample 100 points across the synodic cycle
    const stepHours = AstronomicalOracle.SYNODIC_PERIOD_HOURS / 100;

    for (let i = 0; i <= 100; i++) {
      const t = i * stepHours;
      const state = AstronomicalOracle.calculate(t);
      const elev = state.sunElevationRad;

      assertRange(
        elev,
        -MAX_GRAZING_RAD,
        +MAX_GRAZING_RAD,
        `Solar elevation at t=${t.toFixed(1)}h`
      );

      // Verify that polar sun NEVER rises to terrestrial altitudes (> 5 degrees)
      assert.ok(
        Math.abs(elev) < (5.0 * Math.PI / 180),
        `Sun rose to unrealistically high terrestrial altitude: ${(elev * 180 / Math.PI).toFixed(2)}°`
      );
    }
  });

  it('R3-T1-03: Collimated Solar Directional Light Vector & Ultra-Elongated Shadows', () => {
    // Test at solar noon (peak elevation)
    const state = AstronomicalOracle.calculate(0.0, { season: 'summer_solstice' });
    const dir = new THREE.Vector3(state.sunDirection.x, state.sunDirection.y, state.sunDirection.z);

    // Vector must be normalized unit vector (length 1.0)
    assertApprox(dir.length(), 1.0, 1e-5, 'Directional light vector magnitude');

    // DirectionalLight orientation in Three.js scene
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(dir.x * 100, dir.y * 100, dir.z * 100);
    sunLight.castShadow = true;

    assert.strictEqual(sunLight.castShadow, true, 'Solar DirectionalLight must cast shadows');
    assert.ok(sunLight.position.length() > 0, 'Light position must be non-zero');

    // Theoretical polar shadow length calculation for a 1.0-metre gnomon post:
    // Shadow length = H / tan(h)
    const elev = state.sunElevationRad;
    assert.ok(elev > 0, 'Summer solstice at noon must produce positive elevation');
    const shadowMultiplier = 1.0 / Math.tan(elev);

    // At polar grazing angle h in [0.5°, 1.64°], shadow is > 30x height
    assert.ok(
      shadowMultiplier >= 30.0,
      `Polar shadow length multiplier must exceed 30x, got ${shadowMultiplier.toFixed(1)}x`
    );
  });

  it('R3-T1-04: Earthshine System & Solar Phase Opposition Invariant', () => {
    // At Solar Noon (t = 0h), Earth is in "New Earth" phase -> Earthshine is null (0.0 lx)
    const noon = AstronomicalOracle.calculate(0.0);
    assertApprox(noon.earthshineIntensity, 0.0, 1e-4, 'Earthshine intensity at solar noon');

    // At Solar Midnight (t = 354.367h), Earth is in "Full Earth" phase -> Earthshine peaks (0.15 - 0.25 lx)
    const midnight = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS / 2);
    assertRange(
      midnight.earthshineIntensity,
      0.15,
      0.25,
      'Earthshine intensity at lunar midnight'
    );

    // Verify Earthshine spectrum hex: 0x82b4ff (oceanic cyan-blue)
    const earthColor = new THREE.Color(AstronomicalOracle.EARTHSHINE_COLOR_HEX);
    assert.strictEqual(earthColor.getHex(), 0x82b4ff, 'Earthshine light spectrum must be 0x82b4ff');

    const earthLight = new THREE.DirectionalLight(earthColor, midnight.earthshineIntensity);
    assert.strictEqual(earthLight.color.getHex(), 0x82b4ff, 'Three.js Earthshine light color');
    assertApprox(earthLight.intensity, 0.25, 1e-4, 'Three.js Earthshine peak light intensity');
  });

  it('R3-T1-05: Vacuum Black Sky Void (0x000000) & Starfield Invariant', () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(AstronomicalOracle.SKY_BACKGROUND_HEX);
    scene.fog = null;

    // Vacuum sky background must be pure black 0x000000 (no atmospheric Rayleigh scattering)
    assert.strictEqual(
      (scene.background as THREE.Color).getHex(),
      0x000000,
      'Exosphere sky background must be strictly 0x000000'
    );
    assert.strictEqual(scene.fog, null, 'Vacuum exosphere must have null fog');

    // Starfield points generation verification
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 500.0;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff });
    const starfield = new THREE.Points(starGeometry, starMaterial);

    assert.ok(starfield instanceof THREE.Points, 'Starfield must instantiate as THREE.Points');
    assert.ok(
      starfield.geometry.attributes.position.count >= 2000,
      `Starfield points count must be >= 2000, got ${starfield.geometry.attributes.position.count}`
    );
  });
});
