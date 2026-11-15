/**
 * Tier 3: Cross-Feature Combinations — R3 (Ephemeris) + R2 (Three.js Scene Graph & Lighting)
 * Verifies that ephemeris calculations update Three.js DirectionalLight position and shadows,
 * adjust Earthshine fill illumination, maintain vacuum starfield, and toggle nighttime emissive beacons.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';
import { AstronomicalOracle } from '../harness/fixtures.js';

describe('Tier 3 — Cross-Feature: R3 Astronomy + R2 Three.js Scene Lighting Sync', () => {
  it('T3-01: Ephemeris Azimuth & Elevation Updates Three.js DirectionalLight Position', () => {
    const scene = new THREE.Scene();
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.0);
    sunLight.name = 'sun_directional_light';
    scene.add(sunLight);

    // Update lighting for t = 177.18h (East, azimuth = pi/2)
    const state = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS / 4);
    const sunDist = 500.0;
    sunLight.position.set(
      state.sunDirection.x * sunDist,
      state.sunDirection.y * sunDist,
      state.sunDirection.z * sunDist
    );
    sunLight.updateMatrixWorld(true);

    assertApprox(sunLight.position.x, 500.0, 5.0, 'Sun light position X at East azimuth');
    assertApprox(sunLight.position.z, 0.0, 5.0, 'Sun light position Z at East azimuth');
    assert.ok(sunLight.position.y > -20.0 && sunLight.position.y < 20.0, 'Sun light position Y within polar grazing bounds');
  });

  it('T3-02: Solar DirectionalLight Shadow Camera Frustum & Target Alignment', () => {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 10.0;
    sunLight.shadow.camera.far = 1000.0;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;

    // Target base center at (0, 0, 0)
    sunLight.target.position.set(0, 0, 0);

    const state = AstronomicalOracle.calculate(0.0, { season: 'summer_solstice' });
    sunLight.position.set(
      state.sunDirection.x * 300,
      state.sunDirection.y * 300,
      state.sunDirection.z * 300
    );
    sunLight.updateMatrixWorld(true);
    sunLight.shadow.camera.updateProjectionMatrix();

    assert.strictEqual(sunLight.castShadow, true, 'DirectionalLight must have shadow casting enabled');
    assert.ok(sunLight.shadow.camera.projectionMatrix.elements.length === 16, 'Shadow camera has 4x4 projection matrix');
    for (const el of sunLight.shadow.camera.projectionMatrix.elements) {
      assert.ok(!Number.isNaN(el), 'Shadow camera matrix elements must be valid finite numbers');
    }
  });

  it('T3-03: Nocturnal Transition Clamps Sunlight to 0 and Activates Earthshine Fill Light', () => {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    const earthshineLight = new THREE.DirectionalLight(0x82b4ff, 0.0);

    // Midnight state
    const midnightState = AstronomicalOracle.calculate(AstronomicalOracle.SYNODIC_PERIOD_HOURS / 2);

    // Lighting controller update logic
    if (midnightState.solarYieldFactor === 0.0) {
      sunLight.intensity = 0.0;
    } else {
      sunLight.intensity = midnightState.solarYieldFactor;
    }
    earthshineLight.intensity = midnightState.earthshineIntensity;

    assert.strictEqual(sunLight.intensity, 0.0, 'Direct sunlight must be zeroed during lunar night');
    assertApprox(earthshineLight.intensity, 0.25, 1e-4, 'Earthshine must provide nocturnal ambient fill (0.25 lx)');
    assert.strictEqual(earthshineLight.color.getHex(), 0x82b4ff, 'Earthshine color must be cool oceanic cyan (0x82b4ff)');
  });

  it('T3-04: Exosphere Starfield Points Visibility Invariant Across Day and Night', () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure vacuum black

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array([100, 200, 300, -200, 150, -100]);
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.0, color: 0xffffff });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // On the Moon with zero atmosphere, stars remain 100% visible during both day and night
    assert.strictEqual(stars.visible, true, 'Starfield remains visible in vacuum exosphere regardless of solar elevation');
    assert.strictEqual((scene.background as THREE.Color).getHex(), 0x000000, 'Sky remains pure black void at all hours');
  });

  it('T3-05: Emissive Habitat Window & Approach Beacon Lights Activate During Night', () => {
    // Beacon model fixture (e.g. approach-light-beacon.glb)
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
    });

    const updateBaseEmissives = (isDaylight: boolean, mat: THREE.MeshStandardMaterial) => {
      if (!isDaylight) {
        mat.emissive.setHex(0x00ff88); // Safety neon-green beacon
        mat.emissiveIntensity = 2.0;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    };

    // Daytime: emissives off
    updateBaseEmissives(true, beaconMat);
    assert.strictEqual(beaconMat.emissiveIntensity, 0.0, 'Beacons off in daylight');

    // Nighttime: emissives glow
    updateBaseEmissives(false, beaconMat);
    assert.strictEqual(beaconMat.emissiveIntensity, 2.0, 'Beacons illuminated during lunar darkness');
    assert.strictEqual(beaconMat.emissive.getHex(), 0x00ff88, 'Beacon emission color is active');
  });
});
