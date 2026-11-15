/**
 * Interactive 3D Lunar City Builder Engine
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements intuitive, kid-friendly 3D colony construction:
 * - Raycasted ground pointer tracking with 4-metre grid snapping
 * - Glowing holographic placement reticle (emerald valid / coral blocked)
 * - Semi-transparent 3D ghost preview following cursor with orientation rotation
 * - Instant GLB model instantiation with procedural fallback for zero latency
 * - Interactive building selection and inspection in the 3D scene
 * - Clean deselection via toggle, Escape key, right-click, or ground click
 * - Live astronaut actor spawning when placing Moonwalking Astronauts
 * - Bulldoze / recycle mode with 70% materials refund and audio feedback
 * - Placement dust puff / sparkle particle rings
 * - Seamless integration with 18-variable ECLSS and power simulation
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BUILDING_CATALOG, type BuildingDefinition } from './BuildingCatalog';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { SoundSystem } from '../audio/SoundSystem';
import type { AstronautManager, AstronautEntity } from '../actors/AstronautManager';
import type { RoverManager, RoverEntity } from '../rovers/RoverManager';
import type { BaseLoader, BaseModuleInfo } from '../base/BaseLoader';

export interface PlacedBuildingInstance {
  uid: string;
  def: BuildingDefinition;
  x: number;
  z: number;
  rotationY: number;
  rootMesh: THREE.Object3D;
  timestamp: number;
}

export type CityBuilderEventCallback = (
  event: 'placed' | 'demolished' | 'selected' | 'selected_building' | 'selected_astronaut' | 'selected_rover' | 'selected_base_module' | 'deselected_all' | 'error',
  data?: unknown
) => void;

export class CityBuilder {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private groundMesh: THREE.Mesh;
  private simEngine: SimulationEngine;
  private sound: SoundSystem;
  public astronautManager?: AstronautManager;
  public roverManager?: RoverManager;
  public baseLoader?: BaseLoader;

  public activeDef: BuildingDefinition | null = null;
  public isBulldozeMode: boolean = false;
  public placementRotation: number = 0; // In radians
  public placedBuildings: Map<string, PlacedBuildingInstance> = new Map();
  public selectedBuilding: PlacedBuildingInstance | null = null;
  public selectedAstronaut: AstronautEntity | null = null;
  public selectedRover: RoverEntity | null = null;
  public selectedBaseModule: BaseModuleInfo | null = null;

  private buildingGroup: THREE.Group;
  private previewGroup: THREE.Group;
  private reticleMesh: THREE.Mesh;
  private selectionMarker: THREE.Mesh;
  private raycaster: THREE.Raycaster;
  private mouseVec: THREE.Vector2;
  private currentGridPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isPointerOverGround: boolean = false;
  private isValidPlacement: boolean = false;
  private gltfLoader: GLTFLoader;
  private modelCache: Map<string, THREE.Group> = new Map();
  private listeners: CityBuilderEventCallback[] = [];

  constructor(options: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    domElement: HTMLElement;
    groundMesh: THREE.Mesh;
    simEngine: SimulationEngine;
    sound: SoundSystem;
    astronautManager?: AstronautManager;
    roverManager?: RoverManager;
    baseLoader?: BaseLoader;
  }) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.groundMesh = options.groundMesh;
    this.simEngine = options.simEngine;
    this.sound = options.sound;
    this.astronautManager = options.astronautManager;
    this.roverManager = options.roverManager;
    this.baseLoader = options.baseLoader;

    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();
    this.gltfLoader = new GLTFLoader();

    // Scene groups
    this.buildingGroup = new THREE.Group();
    this.buildingGroup.name = 'city_builder_buildings';
    this.scene.add(this.buildingGroup);

    this.previewGroup = new THREE.Group();
    this.previewGroup.name = 'city_builder_preview';
    this.scene.add(this.previewGroup);

    // Glowing ground placement reticle
    const reticleGeo = new THREE.RingGeometry(3.5, 4.2, 32);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    this.reticleMesh.position.set(0, 0.05, 0);
    this.reticleMesh.visible = false;
    this.scene.add(this.reticleMesh);

    // Obvious glowing emerald green selection ring for kids
    const selectGeo = new THREE.RingGeometry(1.0, 1.35, 48);
    selectGeo.rotateX(-Math.PI / 2);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Vivid neon emerald green
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.selectionMarker = new THREE.Mesh(selectGeo, selectMat);
    this.selectionMarker.position.set(0, 0.07, 0);
    this.selectionMarker.visible = false;
    this.scene.add(this.selectionMarker);

    this.setupEventListeners();
  }

  public addEventListener(cb: CityBuilderEventCallback): void {
    this.listeners.push(cb);
  }

  private emit(
    event:
      | 'placed'
      | 'demolished'
      | 'selected'
      | 'selected_building'
      | 'selected_astronaut'
      | 'selected_rover'
      | 'selected_base_module'
      | 'deselected_all'
      | 'error',
    data?: unknown
  ): void {
    for (const cb of this.listeners) {
      cb(event, data);
    }
  }

  private pointerDownClientX: number = 0;
  private pointerDownClientY: number = 0;
  private isPointerPressed: boolean = false;

  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !this.domElement) return;

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onPointerMove = (e: MouseEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateRaycast();
  };

  private onPointerDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.pointerDownClientX = e.clientX;
      this.pointerDownClientY = e.clientY;
      this.isPointerPressed = true;
    } else if (e.button === 2) {
      // Right click: cancel active building, bulldoze mode, or ANY entity selection immediately!
      this.cancelAction();
    }
  };

  private onPointerUp = (e: MouseEvent): void => {
    if (e.button !== 0 || !this.isPointerPressed) return;
    this.isPointerPressed = false;

    // Camera orbit vs click check: if moved > 6px, player was dragging/orbiting camera!
    const dragDistance = Math.hypot(e.clientX - this.pointerDownClientX, e.clientY - this.pointerDownClientY);
    if (dragDistance > 6.0) {
      return;
    }

    // Ignore if click was on UI overlay buttons
    const target = e.target as HTMLElement;
    if (target && target !== this.domElement && target.closest('#hud-overlay')) {
      return;
    }

    if (this.isBulldozeMode) {
      this.attemptDemolish();
    } else if (this.activeDef) {
      this.attemptPlace();
    } else {
      // World click: select building, astronaut, rover, base module, or deselect!
      this.raycastSelectEntity();
    }
  };

  private raycastSelectEntity(): void {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    // 1. Check placed buildings
    const buildingTargets: THREE.Object3D[] = [];
    this.placedBuildings.forEach((b) => buildingTargets.push(b.rootMesh));
    const bHits = this.raycaster.intersectObjects(buildingTargets, true);
    if (bHits.length > 0) {
      let top: THREE.Object3D | null = bHits[0].object;
      while (top && top.parent && top.parent !== this.buildingGroup) {
        top = top.parent;
      }
      for (const instance of this.placedBuildings.values()) {
        if (instance.rootMesh === top) {
          this.sound.playSelect();
          this.selectPlacedBuilding(instance);
          return;
        }
      }
    }

    // 2. Check Artemis crew astronauts
    if (this.astronautManager) {
      const astroTargets: THREE.Object3D[] = [];
      for (const a of this.astronautManager.astronauts.values()) {
        if (!a.isSheltered && a.mesh.visible) {
          astroTargets.push(a.mesh);
        }
      }
      const aHits = this.raycaster.intersectObjects(astroTargets, true);
      if (aHits.length > 0) {
        let top: THREE.Object3D | null = aHits[0].object;
        while (top && top.parent && top.parent !== this.astronautManager.group) {
          top = top.parent;
        }
        for (const astro of this.astronautManager.astronauts.values()) {
          if (astro.mesh === top) {
            this.sound.playSelect();
            this.selectAstronaut(astro);
            return;
          }
        }
      }
    }

    // 3. Check lunar rovers
    if (this.roverManager) {
      const roverTargets: THREE.Object3D[] = [];
      for (const r of this.roverManager.rovers.values()) {
        if (r.mesh.visible) {
          roverTargets.push(r.mesh);
        }
      }
      const rHits = this.raycaster.intersectObjects(roverTargets, true);
      if (rHits.length > 0) {
        let top: THREE.Object3D | null = rHits[0].object;
        while (top && top.parent && top.parent !== this.roverManager.group) {
          top = top.parent;
        }
        for (const rover of this.roverManager.rovers.values()) {
          if (rover.mesh === top) {
            this.sound.playSelect();
            this.selectRover(rover);
            return;
          }
        }
      }
    }

    // 4. Check starter base modules
    if (this.baseLoader && this.baseLoader.group.children.length > 0) {
      const baseHits = this.raycaster.intersectObjects(this.baseLoader.group.children, true);
      if (baseHits.length > 0) {
        let top: THREE.Object3D | null = baseHits[0].object;
        while (top && top.parent && top.parent !== this.baseLoader.group) {
          top = top.parent;
        }
        if (top) {
          const mod = this.baseLoader.modules.find((m) => m.name === top?.name || m.mesh === top) || {
            name: top.name || 'Outpost Module',
            category: 'outpost',
            position: top.position.clone(),
            mesh: top,
          };
          this.sound.playSelect();
          this.selectBaseModule(mod);
          return;
        }
      }
    }

    // 5. Clicked empty lunar ground or sky -> cleanly deselect!
    this.cancelAction();
  }

  public selectPlacedBuilding(instance: PlacedBuildingInstance | null): void {
    this.selectedBuilding = instance;
    if (instance) {
      this.selectedAstronaut = null;
      this.selectedRover = null;
      this.selectedBaseModule = null;
      if (this.astronautManager) this.astronautManager.selectAstronaut(null);

      const r = (instance.def.radiusMeters || 3.0) * 1.25;
      this.selectionMarker.scale.set(r, r, r);
      this.selectionMarker.position.set(instance.x, 0.07, instance.z);
      this.selectionMarker.visible = true;
      this.emit('selected_building', instance);
    } else {
      this.selectionMarker.visible = false;
      this.emit('selected_building', null);
    }
  }

  public selectAstronaut(astro: AstronautEntity | null): void {
    this.selectedAstronaut = astro;
    if (astro) {
      this.selectedBuilding = null;
      this.selectedRover = null;
      this.selectedBaseModule = null;
      if (this.astronautManager) this.astronautManager.selectAstronaut(astro.id);

      this.selectionMarker.scale.set(1.5, 1.5, 1.5);
      this.selectionMarker.position.set(astro.mesh.position.x, 0.07, astro.mesh.position.z);
      this.selectionMarker.visible = true;
      this.emit('selected_astronaut', astro);
    } else {
      if (this.astronautManager) this.astronautManager.selectAstronaut(null);
    }
  }

  public selectRover(rover: RoverEntity | null): void {
    this.selectedRover = rover;
    if (rover) {
      this.selectedBuilding = null;
      this.selectedAstronaut = null;
      this.selectedBaseModule = null;
      if (this.astronautManager) this.astronautManager.selectAstronaut(null);

      this.selectionMarker.scale.set(3.2, 3.2, 3.2);
      this.selectionMarker.position.set(rover.mesh.position.x, 0.07, rover.mesh.position.z);
      this.selectionMarker.visible = true;
      this.emit('selected_rover', rover);
    }
  }

  public selectBaseModule(mod: BaseModuleInfo | null): void {
    this.selectedBaseModule = mod;
    if (mod) {
      this.selectedBuilding = null;
      this.selectedAstronaut = null;
      this.selectedRover = null;
      if (this.astronautManager) this.astronautManager.selectAstronaut(null);

      this.selectionMarker.scale.set(4.5, 4.5, 4.5);
      this.selectionMarker.position.set(mod.position.x, 0.07, mod.position.z);
      this.selectionMarker.visible = true;
      this.emit('selected_base_module', mod);
    }
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault(); // Don't show browser right-click menu when right-clicking 3D scene
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'r' || e.key === 'R') {
      this.rotatePlacement();
    } else if (e.key === 'Escape') {
      this.cancelAction();
    } else if (e.key === 'b' || e.key === 'B') {
      this.toggleBulldoze();
    }
  };

  public selectBuilding(defId: string | null): void {
    // If user clicks the currently selected building again -> TOGGLE OFF (deselect)!
    if (defId && this.activeDef && this.activeDef.id === defId) {
      this.cancelAction();
      return;
    }

    if (!defId) {
      this.cancelAction();
      return;
    }

    const def = BUILDING_CATALOG[defId];
    if (!def) return;

    this.selectPlacedBuilding(null);
    this.activeDef = def;
    this.isBulldozeMode = false;
    this.sound.playSelect();
    this.emit('selected', def);
    this.updatePreviewMesh();
  }

  public toggleBulldoze(): boolean {
    this.isBulldozeMode = !this.isBulldozeMode;
    if (this.isBulldozeMode) {
      this.activeDef = null;
      this.selectPlacedBuilding(null);
      this.clearPreview();
      this.reticleMesh.visible = false;
      this.sound.playSelect();
    }
    this.emit('selected', this.isBulldozeMode ? 'bulldoze' : null);
    return this.isBulldozeMode;
  }

  public rotatePlacement(): void {
    this.placementRotation = (this.placementRotation + Math.PI / 4) % (Math.PI * 2);
    this.sound.playRotate();
    if (this.previewGroup) {
      this.previewGroup.rotation.y = this.placementRotation;
    }
  }

  public cancelAction(): void {
    this.activeDef = null;
    this.isBulldozeMode = false;
    this.selectPlacedBuilding(null);
    this.selectAstronaut(null);
    this.selectedRover = null;
    this.selectedBaseModule = null;
    this.clearPreview();
    this.reticleMesh.visible = false;
    this.selectionMarker.visible = false;
    this.emit('selected', null);
    this.emit('deselected_all', null);
  }

  private updateRaycast(): void {
    if (!this.activeDef && !this.isBulldozeMode) {
      this.reticleMesh.visible = false;
      this.clearPreview();
      return;
    }

    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    if (this.isBulldozeMode) {
      // Raycast against placed buildings
      const targets: THREE.Object3D[] = [];
      this.placedBuildings.forEach((b) => targets.push(b.rootMesh));
      const intersects = this.raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let top: THREE.Object3D | null = intersects[0].object;
        while (top && top.parent && top.parent !== this.buildingGroup) {
          top = top.parent;
        }
        if (top) {
          this.reticleMesh.position.set(top.position.x, 0.05, top.position.z);
          (this.reticleMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
          this.reticleMesh.visible = true;
          return;
        }
      }
      this.reticleMesh.visible = false;
      return;
    }

    // Placing mode: Raycast against lunar ground
    const hits = this.raycaster.intersectObject(this.groundMesh);
    if (hits.length > 0) {
      const hit = hits[0].point;
      // Snap to 4-meter grid
      const gridX = Math.round(hit.x / 4.0) * 4.0;
      const gridZ = Math.round(hit.z / 4.0) * 4.0;
      this.currentGridPos.set(gridX, 0, gridZ);
      this.isPointerOverGround = true;

      // Check distance from boundaries (-180m to 180m)
      const withinBounds = Math.abs(gridX) <= 180 && Math.abs(gridZ) <= 180;

      // Starter habitat core reserve zone (keep central dome clear)
      const distFromCenter = Math.hypot(gridX, gridZ);
      const isTooCloseToStarter = distFromCenter < 8.0;

      // Check overlap with existing placed buildings
      let collides = false;
      const reqRadius = this.activeDef?.radiusMeters ?? 4.0;
      for (const placed of this.placedBuildings.values()) {
        const dx = placed.x - gridX;
        const dz = placed.z - gridZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < (placed.def.radiusMeters + reqRadius) * 0.75) {
          collides = true;
          break;
        }
      }

      this.isValidPlacement = withinBounds && !isTooCloseToStarter && !collides;

      // Update reticle position & color
      this.reticleMesh.position.set(gridX, 0.06, gridZ);
      (this.reticleMesh.material as THREE.MeshBasicMaterial).color.setHex(
        this.isValidPlacement ? 0x10b981 : 0xef4444
      );
      this.reticleMesh.visible = true;

      // Update preview ghost position & rotation
      this.previewGroup.position.set(gridX, 0, gridZ);
      this.previewGroup.rotation.y = this.placementRotation;
      this.previewGroup.visible = true;
    } else {
      this.isPointerOverGround = false;
      this.reticleMesh.visible = false;
      this.previewGroup.visible = false;
    }
  }

  private updatePreviewMesh(): void {
    this.clearPreview();
    if (!this.activeDef) return;

    const def = this.activeDef;
    const cacheKey = def.modelFile;

    // Fast ghost placeholder representation while loading GLB
    const placeholder = this.createProceduralMesh(def, true);
    this.previewGroup.add(placeholder);

    // Load actual GLB ghost model if in browser
    if (typeof document !== 'undefined') {
      const cached = this.modelCache.get(cacheKey);
      if (cached) {
        this.clearPreview();
        const ghost = cached.clone();
        this.applyHologramMaterial(ghost);
        this.previewGroup.add(ghost);
      } else {
        this.gltfLoader.load(
          `./models/${def.modelFile}`,
          (gltf) => {
            this.modelCache.set(cacheKey, gltf.scene);
            if (this.activeDef?.modelFile === def.modelFile) {
              this.clearPreview();
              const ghost = gltf.scene.clone();
              this.applyHologramMaterial(ghost);
              this.previewGroup.add(ghost);
            }
          },
          undefined,
          () => {
            // Keep procedural placeholder if load fails
          }
        );
      }
    }
  }

  private applyHologramMaterial(obj: THREE.Object3D): void {
    obj.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.65,
          roughness: 0.2,
          metalness: 0.5,
        });
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
  }

  private clearPreview(): void {
    while (this.previewGroup.children.length > 0) {
      const child = this.previewGroup.children[0];
      this.previewGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }
  }

  public attemptPlace(): boolean {
    if (!this.activeDef || !this.isPointerOverGround) {
      this.sound.playError();
      this.emit('error', 'Select a spot on the moon ground to build!');
      return false;
    }

    const distFromCenter = Math.hypot(this.currentGridPos.x, this.currentGridPos.z);
    if (distFromCenter < 8.0) {
      this.sound.playError();
      this.emit('error', 'That spot is reserved for our main habitat dome! Build outward in the crater basin.');
      return false;
    }

    if (!this.isValidPlacement) {
      this.sound.playError();
      this.emit('error', 'Cannot build here! Leave room between buildings.');
      return false;
    }

    const cost = this.activeDef.materialsCost;
    const currentMaterials = this.simEngine.state.materials ?? 800;

    if (currentMaterials < cost) {
      this.sound.playError();
      this.emit('error', `Need ${cost} Materials 🧱 (You have ${Math.floor(currentMaterials)})`);
      return false;
    }

    // Deduct materials
    this.simEngine.state.materials = currentMaterials - cost;

    const x = this.currentGridPos.x;
    const z = this.currentGridPos.z;
    const rot = this.placementRotation;
    const def = this.activeDef;
    const uid = `b_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create root building container
    const rootMesh = new THREE.Group();
    rootMesh.name = `placed_${def.id}_${uid}`;
    rootMesh.position.set(x, 0, z);
    rootMesh.rotation.y = rot;

    // Use GLTF model if cached or load asynchronously, with immediate procedural representation
    const cached = this.modelCache.get(def.modelFile);
    if (cached) {
      const clone = cached.clone();
      this.setupMeshShadows(clone);
      rootMesh.add(clone);
    } else {
      const procedural = this.createProceduralMesh(def, false);
      rootMesh.add(procedural);

      if (typeof document !== 'undefined') {
        this.gltfLoader.load(`./models/${def.modelFile}`, (gltf) => {
          this.modelCache.set(def.modelFile, gltf.scene);
          // Replace procedural with loaded model
          while (rootMesh.children.length > 0) {
            rootMesh.remove(rootMesh.children[0]);
          }
          const realMesh = gltf.scene.clone();
          this.setupMeshShadows(realMesh);
          rootMesh.add(realMesh);
        });
      }
    }

    this.buildingGroup.add(rootMesh);

    const instance: PlacedBuildingInstance = {
      uid,
      def,
      x,
      z,
      rotationY: rot,
      rootMesh,
      timestamp: Date.now(),
    };

    this.placedBuildings.set(uid, instance);

    // If placing an astronaut, also spawn a live walking Artemis astronaut actor!
    if (def.id === 'astronaut' && this.astronautManager) {
      const crewCount = this.astronautManager.getAllAstronauts().length + 1;
      this.astronautManager.addAstronaut({
        id: `AST_EXTRA_${Date.now()}`,
        name: `Astronaut Explorer #${crewCount}`,
        role: 'Lunar Field Specialist',
        initialPosition: new THREE.Vector3(x + 1.2, 0, z + 1.2),
        speed: 2.1,
        task: 'Conducting geological exploration',
      });
    }

    // Update simulation engine
    this.simEngine.state.placedCount = (this.simEngine.state.placedCount ?? 0) + 1;
    this.applyBuildingBonuses();

    // Trigger placement effects & audio
    this.sound.playPlace();
    this.spawnPlacementEffect(x, z);

    this.emit('placed', instance);
    this.updateRaycast();
    return true;
  }

  public attemptDemolish(): boolean {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const targets: THREE.Object3D[] = [];
    this.placedBuildings.forEach((b) => targets.push(b.rootMesh));

    const intersects = this.raycaster.intersectObjects(targets, true);
    if (intersects.length === 0) return false;

    let targetRoot: THREE.Object3D | null = intersects[0].object;
    while (targetRoot && targetRoot.parent && targetRoot.parent !== this.buildingGroup) {
      targetRoot = targetRoot.parent;
    }
    if (!targetRoot) return false;

    // Find instance
    let foundKey: string | null = null;
    let foundInstance: PlacedBuildingInstance | null = null;

    for (const [key, b] of this.placedBuildings.entries()) {
      if (b.rootMesh === targetRoot) {
        foundKey = key;
        foundInstance = b;
        break;
      }
    }

    if (!foundKey || !foundInstance) return false;

    // Refund 70% of construction materials
    const refund = Math.floor(foundInstance.def.materialsCost * 0.7);
    this.simEngine.state.materials = (this.simEngine.state.materials ?? 800) + refund;

    // Remove from scene & map
    this.buildingGroup.remove(foundInstance.rootMesh);
    this.disposeHierarchy(foundInstance.rootMesh);
    this.placedBuildings.delete(foundKey);

    if (this.selectedBuilding?.uid === foundInstance.uid) {
      this.selectPlacedBuilding(null);
    }

    this.simEngine.state.placedCount = Math.max(0, (this.simEngine.state.placedCount ?? 1) - 1);
    this.applyBuildingBonuses();

    this.sound.playDemolish();
    this.spawnDemolishEffect(foundInstance.x, foundInstance.z);

    this.emit('demolished', { instance: foundInstance, refund });
    this.updateRaycast();
    return true;
  }

  public clearAllBuildings(): void {
    for (const b of this.placedBuildings.values()) {
      this.buildingGroup.remove(b.rootMesh);
      this.disposeHierarchy(b.rootMesh);
    }
    this.placedBuildings.clear();
    this.selectPlacedBuilding(null);
    this.simEngine.state.placedCount = 0;
    this.applyBuildingBonuses();
    this.updateRaycast();
  }

  private applyBuildingBonuses(): void {
    // Calculates total dynamic contributions from all active buildings
    let extraSolarKw = 0;
    let extraContinuousKw = 0;
    let extraBatteryKwh = 0;
    let extraCrewCapacity = 0;
    let extraMorale = 0;
    let extraShield = 0;
    let foodPerTick = 0;
    let waterPerTick = 0;
    let o2PerTick = 0;
    let materialsPerTick = 0;

    for (const b of this.placedBuildings.values()) {
      const def = b.def;
      if (def.powerGenKw) {
        if (def.category === 'power' && def.id === 'nuclear_reactor') {
          extraContinuousKw += def.powerGenKw;
        } else {
          extraSolarKw += def.powerGenKw;
        }
      }
      if (def.batteryCapKwh) extraBatteryKwh += def.batteryCapKwh;
      if (def.crewCapacity) extraCrewCapacity += def.crewCapacity;
      if (def.moraleBonus) extraMorale += def.moraleBonus;
      if (def.shieldBonus) extraShield += def.shieldBonus;
      if (def.foodPerTick) foodPerTick += def.foodPerTick;
      if (def.waterPerTick) waterPerTick += def.waterPerTick;
      if (def.o2PerTick) o2PerTick += def.o2PerTick;
      if (def.materialsPerTick) materialsPerTick += def.materialsPerTick;
    }

    // Dynamic state updates connected to simulation engine
    this.simEngine.setBuildingProduction({
      extraSolarKw,
      extraContinuousKw,
      extraBatteryKwh,
      foodPerTick,
      waterPerTick,
      o2PerTick,
      materialsPerTick,
    });

    this.simEngine.state.maxCrew = 4 + extraCrewCapacity;
    this.simEngine.state.crew = Math.min(this.simEngine.state.maxCrew, 4 + Math.floor(extraCrewCapacity * 0.8));
    this.simEngine.state.enthusiasm = Math.min(100.0, 85.0 + extraMorale);
    this.simEngine.state.shield = Math.min(100.0, 70.0 + extraShield);
  }

  private setupMeshShadows(obj: THREE.Object3D): void {
    obj.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = Math.max(0.3, mat.roughness ?? 0.6);
        }
      }
    });
  }

  private createProceduralMesh(def: BuildingDefinition, isGhost: boolean): THREE.Object3D {
    const group = new THREE.Group();
    const color = isGhost ? 0x38bdf8 : 0xf1f5f9;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: isGhost ? 0.2 : 0.4,
      metalness: isGhost ? 0.6 : 0.2,
      transparent: isGhost,
      opacity: isGhost ? 0.6 : 1.0,
      emissive: isGhost ? 0x0284c7 : 0x000000,
      emissiveIntensity: isGhost ? 0.5 : 0.0,
    });

    if (def.category === 'living') {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(def.radiusMeters * 0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        mat
      );
      dome.castShadow = !isGhost;
      dome.receiveShadow = !isGhost;
      group.add(dome);
    } else if (def.category === 'power') {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(def.radiusMeters * 1.5, 0.4, def.radiusMeters),
        mat
      );
      panel.position.set(0, 1.8, 0);
      panel.rotation.x = 0.3;
      panel.castShadow = !isGhost;
      panel.receiveShadow = !isGhost;
      group.add(panel);
    } else {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(def.radiusMeters * 1.2, 2.8, def.radiusMeters * 1.2),
        mat
      );
      box.position.set(0, 1.4, 0);
      box.castShadow = !isGhost;
      box.receiveShadow = !isGhost;
      group.add(box);
    }

    return group;
  }

  private spawnPlacementEffect(x: number, z: number): void {
    // Expanding glowing ring effect on lunar regolith
    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.08, z);
    this.scene.add(ring);

    let progress = 0;
    const animate = () => {
      progress += 0.05;
      const s = 1.0 + progress * 4.5;
      ring.scale.set(s, s, s);
      ringMat.opacity = Math.max(0, 0.9 * (1.0 - progress));

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  private spawnDemolishEffect(x: number, z: number): void {
    const ringGeo = new THREE.RingGeometry(1.0, 2.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.08, z);
    this.scene.add(ring);

    let progress = 0;
    const animate = () => {
      progress += 0.06;
      const s = 1.0 + progress * 3.0;
      ring.scale.set(s, s, s);
      ringMat.opacity = Math.max(0, 0.9 * (1.0 - progress));

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  private disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
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
  }

  public dispose(): void {
    if (typeof window !== 'undefined' && this.domElement) {
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerdown', this.onPointerDown);
      this.domElement.removeEventListener('pointerup', this.onPointerUp);
      this.domElement.removeEventListener('contextmenu', this.onContextMenu);
      window.removeEventListener('keydown', this.onKeyDown);
    }
    this.clearAllBuildings();
    this.clearPreview();
    this.scene.remove(this.buildingGroup);
    this.scene.remove(this.previewGroup);
    this.scene.remove(this.reticleMesh);
    this.scene.remove(this.selectionMarker);
    if (this.reticleMesh.geometry) this.reticleMesh.geometry.dispose();
    if (this.selectionMarker.geometry) this.selectionMarker.geometry.dispose();
  }
}
