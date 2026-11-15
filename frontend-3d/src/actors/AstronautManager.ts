/**
 * Articulated Lunar Astronaut Actors & Low-Gravity Locomotion Engine
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements:
 * - Dynamic Artemis astronaut crew on the lunar surface
 * - Realistic 1/6th-g lunar bunny-hopping locomotion physics
 * - Autonomous waypoint patrolling between base structures & newly placed modules
 * - Emergency shelter evacuation during solar radiation flares
 * - Interactive astronaut selection, inspection, and dispatch
 * - Procedural Artemis spacesuit with gold visor, life-support PLSS backpack, and GLB loading
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type AstronautStatus = 'idle' | 'patrolling' | 'walking' | 'inspecting' | 'sheltering' | 'repairing';

export interface AstronautEntity {
  id: string;
  name: string;
  role: string;
  status: AstronautStatus;
  morale: number; // 0 - 100%
  suitO2Pct: number; // 0 - 100%
  heartRateBpm: number;
  currentTask: string;
  homePosition: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  mesh: THREE.Group;
  hopPhase: number;
  speedMetersSec: number;
  isSheltered: boolean;
  assignedStructure?: string;
  inspectionTimer: number;
}

export class AstronautManager {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public astronauts: Map<string, AstronautEntity> = new Map();
  public selectedAstronautId: string | null = null;

  private loader: GLTFLoader;
  private selectionRing: THREE.Mesh;
  private modelGlbCache: THREE.Group | null = null;
  private isGlbLoaded: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'lunar_astronauts_group';
    this.scene.add(this.group);
    this.loader = new GLTFLoader();

    // Glowing selection ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.05, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.visible = false;
    this.selectionRing.position.set(0, 0.05, 0);
    this.group.add(this.selectionRing);

    this.preloadModel();
    this.spawnInitialCrew();
  }

  private preloadModel(): void {
    if (typeof document === 'undefined') return;
    this.loader.load(
      './models/surface-eva-suit.glb',
      (gltf) => {
        this.modelGlbCache = gltf.scene;
        this.isGlbLoaded = true;
        // Upgrade existing procedural meshes to GLB
        for (const astro of this.astronauts.values()) {
          this.applyGlbToAstronaut(astro);
        }
      },
      undefined,
      (err) => {
        console.warn('[AstronautManager] Using procedural spacesuits (GLB fallback):', err);
      }
    );
  }

  private spawnInitialCrew(): void {
    // 1. Mission Commander
    this.addAstronaut({
      id: 'AST-01',
      name: 'Cmdr. Sarah Glenn',
      role: 'Outpost Commander',
      initialPosition: new THREE.Vector3(2.5, 0, 4.0),
      speed: 2.2,
      task: 'Inspecting Central Airlock Vestibule',
    });

    // 2. Astrobiology Specialist
    this.addAstronaut({
      id: 'AST-02',
      name: 'Dr. Leo Ruiz',
      role: 'Life Support & Botanist',
      initialPosition: new THREE.Vector3(-10.0, 0, 8.0),
      speed: 2.0,
      task: 'Monitoring Greenhouse O₂ Exchange',
    });

    // 3. Systems Flight Engineer
    this.addAstronaut({
      id: 'AST-03',
      name: 'Eng. Maya Lin',
      role: 'Power & Robotics Specialist',
      initialPosition: new THREE.Vector3(14.0, 0, -8.0),
      speed: 2.4,
      task: 'Surveying Solar Array Tracking Bus',
    });
  }

  public addAstronaut(config: {
    id: string;
    name: string;
    role: string;
    initialPosition: THREE.Vector3;
    speed?: number;
    task?: string;
  }): AstronautEntity {
    const astroGroup = new THREE.Group();
    astroGroup.name = `astronaut_${config.id}`;
    astroGroup.position.copy(config.initialPosition);

    // Initial procedural mesh representation
    const fallbackMesh = this.createProceduralAstronautMesh();
    astroGroup.add(fallbackMesh);
    this.group.add(astroGroup);

    const entity: AstronautEntity = {
      id: config.id,
      name: config.name,
      role: config.role,
      status: 'patrolling',
      morale: 95,
      suitO2Pct: 98,
      heartRateBpm: 76,
      currentTask: config.task ?? 'Lunar surface patrol',
      homePosition: config.initialPosition.clone(),
      targetPosition: null,
      mesh: astroGroup,
      hopPhase: Math.random() * Math.PI * 2,
      speedMetersSec: config.speed ?? 2.1,
      isSheltered: false,
      inspectionTimer: 3.0 + Math.random() * 5.0,
    };

    this.astronauts.set(config.id, entity);

    if (this.isGlbLoaded && this.modelGlbCache) {
      this.applyGlbToAstronaut(entity);
    }

    return entity;
  }

  private applyGlbToAstronaut(astro: AstronautEntity): void {
    if (!this.modelGlbCache) return;
    const glbClone = this.modelGlbCache.clone();
    glbClone.scale.set(0.9, 0.9, 0.9);
    glbClone.position.set(0, 0, 0);

    glbClone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Remove placeholder procedural mesh and replace with GLB model
    while (astro.mesh.children.length > 0) {
      astro.mesh.remove(astro.mesh.children[0]);
    }
    astro.mesh.add(glbClone);
  }

  /**
   * Procedural spacesuit with helmet, gold visor, chest computer, and life support backpack.
   */
  private createProceduralAstronautMesh(): THREE.Group {
    const root = new THREE.Group();

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.45,
      metalness: 0.1,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
    });
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });

    // 1. Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), suitMat);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    root.add(torso);

    // 2. Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), suitMat);
    helmet.position.set(0, 1.65, 0);
    helmet.castShadow = true;
    root.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), visorMat);
    visor.rotation.x = -Math.PI / 2;
    visor.position.set(0, 1.65, 0.12);
    root.add(visor);

    // 3. Life-Support Backpack (PLSS)
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), packMat);
    backpack.position.set(0, 1.18, -0.25);
    backpack.castShadow = true;
    root.add(backpack);

    // Status LED on PLSS
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    led.position.set(0.18, 1.4, -0.4);
    root.add(led);

    // 4. Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.75, 12);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(-0.16, 0.45, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(0.16, 0.45, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    // 5. Boots
    const bootGeo = new THREE.BoxGeometry(0.18, 0.12, 0.3);
    const leftBoot = new THREE.Mesh(bootGeo, jointMat);
    leftBoot.position.set(-0.16, 0.06, 0.05);
    leftBoot.castShadow = true;
    root.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, jointMat);
    rightBoot.position.set(0.16, 0.06, 0.05);
    rightBoot.castShadow = true;
    root.add(rightBoot);

    // 6. Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.6, 12);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.35, 1.15, 0);
    leftArm.rotation.z = Math.PI / 16;
    leftArm.castShadow = true;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.35, 1.15, 0);
    rightArm.rotation.z = -Math.PI / 16;
    rightArm.castShadow = true;
    root.add(rightArm);

    return root;
  }

  /**
   * Main per-frame physics & low-gravity hop animation update.
   */
  public update(deltaSeconds: number, landmarkPositions: THREE.Vector3[] = []): void {
    if (deltaSeconds <= 0) return;

    for (const astro of this.astronauts.values()) {
      // If sheltered in subterranean vault, hide mesh
      if (astro.isSheltered) {
        astro.mesh.visible = false;
        continue;
      }
      astro.mesh.visible = true;

      // 1. Check if we need a new target waypoint
      if (!astro.targetPosition) {
        astro.inspectionTimer -= deltaSeconds;
        if (astro.inspectionTimer <= 0) {
          // Pick a base landmark or nearby point to patrol
          astro.targetPosition = this.pickNextPatrolTarget(astro, landmarkPositions);
          astro.status = 'walking';
          astro.currentTask = `Heading to patrol station at (${astro.targetPosition.x.toFixed(0)}, ${astro.targetPosition.z.toFixed(0)})`;
        }
      }

      // 2. Move towards target
      if (astro.targetPosition) {
        const toTarget = new THREE.Vector3().subVectors(astro.targetPosition, astro.mesh.position);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist <= 0.8) {
          // Arrived!
          astro.mesh.position.x = astro.targetPosition.x;
          astro.mesh.position.z = astro.targetPosition.z;
          astro.targetPosition = null;
          astro.status = 'inspecting';
          astro.inspectionTimer = 6.0 + Math.random() * 8.0;
          astro.currentTask = `Conducting module telemetry inspection`;
          // Settle feet on ground
          astro.mesh.position.y = 0;
          astro.mesh.rotation.z = 0;
        } else {
          // Hop locomotion in Moon 1/6 g
          toTarget.normalize();

          // Face movement direction smoothly
          const targetAngle = Math.atan2(toTarget.x, toTarget.z);
          const currentAngle = astro.mesh.rotation.y;
          // Smooth angular interpolation
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          astro.mesh.rotation.y += diff * Math.min(1.0, deltaSeconds * 6.0);

          // Advance forward
          const moveDist = Math.min(dist, astro.speedMetersSec * deltaSeconds);
          astro.mesh.position.addScaledVector(toTarget, moveDist);

          // Lunar Bunny-Hop Locomotion: vertical sinusoidal arc
          astro.hopPhase += deltaSeconds * 5.2; // hop frequency
          const hopHeight = 0.38; // peak bounce in meters
          astro.mesh.position.y = Math.abs(Math.sin(astro.hopPhase)) * hopHeight;

          // Subtle forward pitch and lateral sway during hop
          astro.mesh.rotation.x = Math.sin(astro.hopPhase) * 0.08;
          astro.mesh.rotation.z = Math.cos(astro.hopPhase) * 0.04;
        }
      } else {
        // Idle gentle breathing sway
        astro.hopPhase += deltaSeconds * 1.5;
        astro.mesh.position.y = Math.sin(astro.hopPhase) * 0.03;
        astro.mesh.rotation.x = 0;
        astro.mesh.rotation.z = 0;
      }
    }

    // Update selection ring under selected astronaut
    if (this.selectedAstronautId) {
      const selected = this.astronauts.get(this.selectedAstronautId);
      if (selected && !selected.isSheltered) {
        this.selectionRing.visible = true;
        this.selectionRing.position.set(selected.mesh.position.x, 0.06, selected.mesh.position.z);
      } else {
        this.selectionRing.visible = false;
      }
    } else {
      this.selectionRing.visible = false;
    }
  }

  private pickNextPatrolTarget(astro: AstronautEntity, landmarks: THREE.Vector3[]): THREE.Vector3 {
    if (landmarks.length > 0 && Math.random() < 0.65) {
      // Pick a random landmark (placed building or key base module)
      const target = landmarks[Math.floor(Math.random() * landmarks.length)].clone();
      // Offset slightly so astronaut stands outside rather than inside the building center
      const angle = Math.random() * Math.PI * 2;
      const offsetDist = 3.5 + Math.random() * 2.5;
      target.x += Math.cos(angle) * offsetDist;
      target.z += Math.sin(angle) * offsetDist;
      target.y = 0;
      return target;
    }

    // Wander within home territory
    const wanderRadius = 16.0;
    const angle = Math.random() * Math.PI * 2;
    const dist = 4.0 + Math.random() * wanderRadius;
    return new THREE.Vector3(
      astro.homePosition.x + Math.cos(angle) * dist,
      0,
      astro.homePosition.z + Math.sin(angle) * dist
    );
  }

  public selectAstronaut(id: string | null): void {
    this.selectedAstronautId = id;
    if (!id) {
      this.selectionRing.visible = false;
    }
  }

  public commandMove(id: string, targetPos: THREE.Vector3): boolean {
    const astro = this.astronauts.get(id);
    if (!astro || astro.isSheltered) return false;

    astro.targetPosition = targetPos.clone();
    astro.targetPosition.y = 0;
    astro.status = 'walking';
    astro.currentTask = `Command dispatched: moving to (${targetPos.x.toFixed(0)}, ${targetPos.z.toFixed(0)})`;
    return true;
  }

  /**
   * Solar flare alert: Scramble all astronauts outside into subterranean storm vault.
   */
  public commandShelterAll(): void {
    for (const astro of this.astronauts.values()) {
      astro.isSheltered = true;
      astro.status = 'sheltering';
      astro.currentTask = '🛡️ Sheltered inside Subterranean Radiation Vault';
      astro.targetPosition = null;
    }
    this.selectionRing.visible = false;
  }

  public commandExitShelter(): void {
    for (const astro of this.astronauts.values()) {
      astro.isSheltered = false;
      astro.status = 'patrolling';
      astro.mesh.position.copy(astro.homePosition);
      astro.currentTask = 'Surface patrol resumed';
      astro.targetPosition = null;
    }
  }

  public getAstronaut(id: string): AstronautEntity | undefined {
    return this.astronauts.get(id);
  }

  public getAllAstronauts(): AstronautEntity[] {
    return Array.from(this.astronauts.values());
  }
}
