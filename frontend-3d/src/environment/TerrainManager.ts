/**
 * Shackleton Crater Terrain Manager
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements the horizontal Shackleton Crater basin ground plane:
 * - 400x400m horizontal regolith surface plane at Y=0.0m
 * - PBR MeshStandardMaterial (color 0x555555, roughness 0.92, metalness 0.04)
 * - Shadow reception enabled for elongated polar shadows
 * - Preserves the hab-port grid mating plane invariant at Y=2.40m
 */

import * as THREE from 'three';

export interface TerrainOptions {
  size?: number;
  segments?: number;
  regolithColor?: number;
  roughness?: number;
  metalness?: number;
  diffuseTexture?: string;
  dispTexture?: string;
  repeat?: number;
}

export class TerrainManager {
  public readonly group: THREE.Group;
  public readonly groundMesh: THREE.Mesh;
  private readonly groundMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, options: TerrainOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'shackleton_terrain_group';

    const size = options.size ?? 400.0;
    const segments = options.segments ?? 64;

    // 1. Plane Geometry rotated to horizontal XZ plane
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Normal points +Y up

    // 2. High-Roughness PBR Regolith Material calibrated for authentic lunar relief & vibrant visibility
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: options.regolithColor ?? 0xd5dbe4,
      roughness: options.roughness ?? 0.82,
      metalness: options.metalness ?? 0.02,
    });

    // Load authentic 4K textures from local public textures folder if running in browser
    if (typeof document !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        const diffUrl = options.diffuseTexture ?? './textures/moon_01_diff_4k.jpg';
        const dispUrl = options.dispTexture ?? './textures/moon_01_disp_4k.png';
        const repeat = options.repeat ?? 16;

        const diffTex = texLoader.load(diffUrl, undefined, undefined, () => {
          const fallbackTex = texLoader.load('/textures/moon_01_diff_4k.jpg');
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(repeat, repeat);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          this.groundMaterial.map = fallbackTex;
          this.groundMaterial.needsUpdate = true;
        });
        diffTex.wrapS = THREE.RepeatWrapping;
        diffTex.wrapT = THREE.RepeatWrapping;
        diffTex.repeat.set(repeat, repeat);
        diffTex.colorSpace = THREE.SRGBColorSpace;
        this.groundMaterial.map = diffTex;

        const dispTex = texLoader.load(dispUrl, undefined, undefined, () => {
          const fallbackDisp = texLoader.load('/textures/moon_01_disp_4k.png');
          fallbackDisp.wrapS = THREE.RepeatWrapping;
          fallbackDisp.wrapT = THREE.RepeatWrapping;
          fallbackDisp.repeat.set(repeat, repeat);
          this.groundMaterial.bumpMap = fallbackDisp;
          this.groundMaterial.bumpScale = 0.85;
          this.groundMaterial.needsUpdate = true;
        });
        dispTex.wrapS = THREE.RepeatWrapping;
        dispTex.wrapT = THREE.RepeatWrapping;
        dispTex.repeat.set(repeat, repeat);
        this.groundMaterial.bumpMap = dispTex;
        this.groundMaterial.bumpScale = 0.85;

        this.groundMaterial.needsUpdate = true;
      } catch (e) {
        console.warn('[TerrainManager] Texture loading fallback:', e);
      }
    }

    // 3. Ground Mesh positioned at Y=0.0m
    this.groundMesh = new THREE.Mesh(geometry, this.groundMaterial);
    this.groundMesh.name = 'shackleton_basin_regolith_ground';
    this.groundMesh.position.set(0, 0, 0); // Ground plane at Y = 0
    this.groundMesh.receiveShadow = true;
    this.groundMesh.castShadow = false;

    this.group.add(this.groundMesh);
    scene.add(this.group);
  }

  public dispose(): void {
    if (this.groundMesh.geometry) {
      this.groundMesh.geometry.dispose();
    }
    if (this.groundMaterial) {
      if (this.groundMaterial.map) this.groundMaterial.map.dispose();
      if (this.groundMaterial.bumpMap) this.groundMaterial.bumpMap.dispose();
      this.groundMaterial.dispose();
    }
  }
}
