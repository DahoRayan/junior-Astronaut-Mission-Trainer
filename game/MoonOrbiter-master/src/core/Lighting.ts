import * as THREE from 'three';
import { SPHERE_RADIUS } from '../utils/config';

const SUN_DIST = SPHERE_RADIUS * 50;

export class Lighting {
  readonly sunLight: THREE.DirectionalLight;
  readonly ambientLight: THREE.AmbientLight;
  readonly frontFillLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene) {
    // Primary directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sunLight.position.set(SUN_DIST, 0, 0);
    scene.add(this.sunLight);

    // Earthshine / Ambient illumination: ensures the night side is never pitch black
    // and all lunar surface features (maria, craters) are always visible!
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(this.ambientLight);

    // Front soft fill light from Earth direction (+X)
    this.frontFillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    this.frontFillLight.position.set(SUN_DIST, SPHERE_RADIUS * 5, 0);
    scene.add(this.frontFillLight);
  }

  /** Set sun position from a normalized direction vector (astronomical mode) */
  setSunDirection(dir: THREE.Vector3): void {
    this.sunLight.position.copy(dir).multiplyScalar(SUN_DIST);
  }

  /** Set ambient illumination intensity (0.0 = deep space dark, 1.0+ = full daylight) */
  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }
}
