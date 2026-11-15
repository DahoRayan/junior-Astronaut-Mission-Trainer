/**
 * Lunar Sky Environment Rig
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements the unscattered lunar celestial vacuum:
 * - Pure pitch-black background (0x000000) with zero atmospheric fog
 * - Procedural 5,000-star celestial sphere (sizeAttenuation: false, Harvard spectral colors)
 * - 3D Earth mesh with 23.44° axial tilt, diurnal rotation, and low-horizon selenographic placement
 */

import * as THREE from 'three';
import type { SolarEphemeris } from '../core/types';

export interface LunarSkyOptions {
  starCount?: number;
  starSphereRadius?: number;
  earthDistance?: number;
  earthRadius?: number;
}

export class LunarSky {
  public readonly group: THREE.Group;
  public readonly starfield: THREE.Points;
  public readonly earthGroup: THREE.Group;
  public readonly earthMesh: THREE.Mesh;
  private readonly earthDistance: number;

  constructor(scene: THREE.Scene, options: LunarSkyOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'lunar_sky_rig';

    // 1. Vacuum Black Background (Zero atmospheric scattering in lunar exosphere)
    scene.background = new THREE.Color(0x000000);
    scene.fog = null;

    // 2. Starfield Points (~5,000 stars)
    const starCount = options.starCount ?? 5000;
    const starRadius = options.starSphereRadius ?? 1500.0;
    this.starfield = this.createStarfield(starCount, starRadius);
    this.group.add(this.starfield);

    // 3. 3D Earth System
    this.earthDistance = options.earthDistance ?? 1200.0;
    const earthRadius = options.earthRadius ?? 20.0;
    const { earthContainer, earthMesh } = this.createEarthSystem(this.earthDistance, earthRadius);
    this.earthGroup = earthContainer;
    this.earthMesh = earthMesh;
    this.group.add(this.earthGroup);

    scene.add(this.group);
  }

  private createStarfield(count: number, radius: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Spectral Class Palette based on Harvard Spectral Classification
    const spectralColors = [
      new THREE.Color(0x9bb0ff), // O/B: Blue-white (hot)
      new THREE.Color(0xffffff), // A: Pure white
      new THREE.Color(0xf8f9fa), // F: Yellow-white
      new THREE.Color(0xfff4e8), // G: Solar yellow
      new THREE.Color(0xffddb4), // K: Orange
      new THREE.Color(0xffb56c), // M: Red dwarf (cool)
    ];

    for (let i = 0; i < count; i++) {
      // Marsaglia / Archimedes uniform sphere surface projection
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Random stellar spectral type and visual magnitude
      const spectral = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      const magnitude = 0.4 + Math.random() * 0.6; // Varied stellar brightness
      colors[i * 3] = spectral.r * magnitude;
      colors[i * 3 + 1] = spectral.g * magnitude;
      colors[i * 3 + 2] = spectral.b * magnitude;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: false, // Pinprick sharpness invariant: never blurs with distance
      transparent: false,
      depthWrite: false,      // Distant celestial sphere never occludes base geometry
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'celestial_starfield_points';
    return points;
  }

  private createEarthSystem(distance: number, radius: number): {
    earthContainer: THREE.Group;
    earthMesh: THREE.Mesh;
  } {
    const container = new THREE.Group();
    container.name = 'earth_celestial_container';

    // Position Earth low on lunar horizon (~1.8° elevation) towards +Z (lunar prime meridian)
    const elevationRad = THREE.MathUtils.degToRad(1.8);
    const posY = distance * Math.sin(elevationRad);
    const posZ = distance * Math.cos(elevationRad);
    container.position.set(0, posY, posZ);

    // Earth Axial Tilt (23.44° relative to ecliptic plane)
    const tiltGroup = new THREE.Group();
    tiltGroup.name = 'earth_axial_tilt_group';
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(23.44);
    container.add(tiltGroup);

    // Earth Mesh
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2b65ec,      // Oceanic blue
      roughness: 0.6,
      metalness: 0.05,
      emissive: new THREE.Color(0x0a1930), // Faint atmospheric luminescence
      emissiveIntensity: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'earth_globe_mesh';
    tiltGroup.add(mesh);

    return { earthContainer: container, earthMesh: mesh };
  }

  public update(_ephemeris: SolarEphemeris, delta: number): void {
    // Diurnal axial spin of Earth
    const spinSpeed = 0.05; // Visual rotation rate
    this.earthMesh.rotation.y += delta * spinSpeed;
  }

  public dispose(): void {
    if (this.starfield.geometry) this.starfield.geometry.dispose();
    if (this.starfield.material instanceof THREE.Material) this.starfield.material.dispose();

    if (this.earthMesh.geometry) this.earthMesh.geometry.dispose();
    if (this.earthMesh.material instanceof THREE.Material) this.earthMesh.material.dispose();
  }
}
