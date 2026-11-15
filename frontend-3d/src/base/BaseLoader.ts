import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface BaseModuleInfo {
  name: string;
  category: string;
  position: THREE.Vector3;
  mesh?: THREE.Object3D;
}

export class BaseLoader {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public isLoaded: boolean = false;
  public modules: BaseModuleInfo[] = [];

  private loader: GLTFLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'lunar_colony_base';
    this.scene.add(this.group);
    this.loader = new GLTFLoader();
  }

  /**
   * Loads colony-overview.glb starter scene containing the 24 assembled modules.
   * If loading fails (e.g. offline or path resolution), instantiates procedural fallback modules.
   */
  public async loadBase(url: string = './models/colony-overview.glb'): Promise<THREE.Group> {
    return new Promise((resolve) => {
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          root.name = 'colony_root';
          root.position.set(0, 0, 0);

          // Configure shadows and PBR materials across all meshes
          root.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.roughness = Math.max(0.4, mat.roughness ?? 0.6);
                mat.envMapIntensity = 0.5;
              }
            }
          });

          this.group.add(root);
          this.isLoaded = true;
          this.indexModules(root);
          console.log('[BaseLoader] Successfully loaded colony-overview.glb with', root.children.length, 'root nodes');
          resolve(this.group);
        },
        undefined,
        (err) => {
          console.warn('[BaseLoader] Could not load colony-overview.glb, constructing procedural reference base:', err);
          this.createProceduralBase();
          this.isLoaded = true;
          resolve(this.group);
        }
      );
    });
  }

  private indexModules(root: THREE.Object3D): void {
    root.traverse((node) => {
      if (node.name && node.name.length > 2 && node !== root) {
        const worldPos = new THREE.Vector3();
        node.getWorldPosition(worldPos);
        this.modules.push({
          name: node.name,
          category: this.categorizeNode(node.name),
          position: worldPos,
          mesh: node,
        });
      }
    });
  }

  private categorizeNode(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('solar') || n.includes('battery') || n.includes('nuclear') || n.includes('power')) return 'power';
    if (n.includes('hab') || n.includes('dome') || n.includes('cylinder') || n.includes('care')) return 'habitat';
    if (n.includes('tunnel') || n.includes('airlock') || n.includes('port')) return 'corridor';
    if (n.includes('landing') || n.includes('pad') || n.includes('berm') || n.includes('ramp')) return 'infrastructure';
    if (n.includes('greenhouse') || n.includes('water') || n.includes('oxygen')) return 'life_support';
    if (n.includes('rover') || n.includes('sled') || n.includes('cart')) return 'rover';
    return 'outpost';
  }

  /**
   * Procedural reference base fallback representing First Light Outpost
   * adhering to 1:1 metre scale, Y=0.0m ground plane, and Y=2.40m hab-port centerline.
   */
  public createProceduralBase(): void {
    const habMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.30, metalness: 0.15 });
    const regolithShieldMat = new THREE.MeshStandardMaterial({ color: 0x949ca8, roughness: 0.80, metalness: 0.04 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x284a8c, roughness: 0.15, metalness: 0.80, emissive: new THREE.Color(0x0c1e38), emissiveIntensity: 0.25 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xb4c2d2, roughness: 0.35, metalness: 0.60 });
    const emissiveGold = new THREE.MeshStandardMaterial({ color: 0xf0ce50, metalness: 0.85, roughness: 0.15, emissive: new THREE.Color(0x554210), emissiveIntensity: 0.25 });

    // 1. Central Inflatable Dome Habitat (radius: 5.3m, height: 6.3m, touches Y=0)
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(5.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      habMat
    );
    dome.position.set(0, 0, 0);
    dome.castShadow = true;
    dome.receiveShadow = true;
    dome.name = 'inflatable_dome_habitat_central';
    this.group.add(dome);

    // Regolith protective berm around dome base
    const berm = new THREE.Mesh(
      new THREE.CylinderGeometry(6.2, 7.5, 2.2, 32, 1, true),
      regolithShieldMat
    );
    berm.position.set(0, 1.1, 0);
    berm.castShadow = true;
    berm.receiveShadow = true;
    berm.name = 'regolith_shield_berm';
    this.group.add(berm);

    // 2. Rigid Crew Habitat Cylinder (elevation legs, port centerline at Y=2.40m)
    const crewCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 8.0, 24),
      habMat
    );
    crewCyl.rotation.x = Math.PI * 0.5;
    crewCyl.position.set(-12, 2.40, 0);
    crewCyl.castShadow = true;
    crewCyl.receiveShadow = true;
    crewCyl.name = 'rigid_cylinder_crew_habitat';
    this.group.add(crewCyl);

    // 3. Straight Connecting Tunnel (Port Centerline Y=2.40m)
    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 6.0, 16),
      metalMat
    );
    tunnel.rotation.z = Math.PI * 0.5;
    tunnel.position.set(-6, 2.40, 0);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    tunnel.name = 'pressurised_connecting_tunnel_straight_bay';
    this.group.add(tunnel);

    // 4. Pressurised Greenhouse Bay (East wing)
    const greenhouse = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 7.0, 20),
      new THREE.MeshStandardMaterial({ color: 0x3d704d, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.85 })
    );
    greenhouse.rotation.z = Math.PI * 0.5;
    greenhouse.position.set(10, 2.40, 0);
    greenhouse.castShadow = true;
    greenhouse.receiveShadow = true;
    greenhouse.name = 'pressurised_greenhouse_module';
    this.group.add(greenhouse);

    // 5. Polar Solar Array Ridge (8 Tracking Solar Arrays, rotated facing Sun)
    for (let i = 0; i < 8; i++) {
      const arrayPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.2, 8), metalMat);
      arrayPole.position.set(-25 + i * 7, 1.6, -30);
      arrayPole.castShadow = true;

      const panel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 0.1), solarMat);
      panel.position.set(-25 + i * 7, 3.2, -30);
      panel.rotation.x = 0.25; // tilted towards polar horizon
      panel.castShadow = true;
      panel.receiveShadow = true;
      panel.name = `tracking_solar_array_row_${i + 1}`;

      this.group.add(arrayPole);
      this.group.add(panel);
    }

    // 6. Battery Storage Container Unit
    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.6, 2.4),
      metalMat
    );
    battery.position.set(0, 1.3, -20);
    battery.castShadow = true;
    battery.receiveShadow = true;
    battery.name = 'battery_storage_container';
    this.group.add(battery);

    // 7. Sintered Regolith Landing Pad (Radius 16m at Y=0.05m)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(16.0, 16.0, 0.1, 48),
      new THREE.MeshStandardMaterial({ color: 0x6e747e, roughness: 0.85, metalness: 0.05 })
    );
    pad.position.set(45, 0.05, 35);
    pad.receiveShadow = true;
    pad.name = 'sintered_landing_pad';
    this.group.add(pad);

    // Artemis Crew Lander on Pad
    const landerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 3.2, 4.5, 8),
      emissiveGold
    );
    landerBody.position.set(45, 3.8, 35);
    landerBody.castShadow = true;
    landerBody.receiveShadow = true;
    landerBody.name = 'crew_lander_with_ascent_cabin';
    this.group.add(landerBody);

    // Comms Mast (tall antenna)
    const commsMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.2, 14.0, 8),
      metalMat
    );
    commsMast.position.set(-18, 7.0, -15);
    commsMast.castShadow = true;
    commsMast.name = 'communications_relay_mast';
    this.group.add(commsMast);

    this.indexModules(this.group);
  }

  public setNightMode(isNight: boolean): void {
    this.group.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const name = (mesh.name || node.name || '').toLowerCase();
          if (name.includes('beacon') || name.includes('light')) {
            mat.emissive.setHex(isNight ? 0x00ff88 : 0x000000);
            mat.emissiveIntensity = isNight ? 2.0 : 0.0;
          } else if (name.includes('window') || name.includes('cupola') || name.includes('greenhouse')) {
            mat.emissive.setHex(isNight ? 0xffe8b0 : 0x000000);
            mat.emissiveIntensity = isNight ? 0.8 : 0.0;
          }
        }
      }
    });
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
    this.scene.remove(this.group);
  }
}
