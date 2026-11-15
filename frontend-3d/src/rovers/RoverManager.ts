import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type RoverType = 'open_lrv' | 'survey_bot' | 'pressurized_traverse' | 'regolith_excavator' | 'crane_rover';
export type RoverStatus = 'idle' | 'en_route' | 'operating' | 'returning' | 'charging';
export type RoverTask = 'idle' | 'clean_panels' | 'survey' | 'excavate' | 'rescue';

export interface RoverEntity {
  id: string;
  name: string;
  type: RoverType;
  modelFile: string;
  speedMetersSec: number;
  batteryPct: number;
  status: RoverStatus;
  currentTask: RoverTask;
  homePosition: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  mesh: THREE.Group;
  wheels: THREE.Object3D[];
  totalDistanceTraversedM: number;
}

export class RoverManager {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public rovers: Map<string, RoverEntity> = new Map();
  public selectedRoverId: string = 'LRV-01';

  private loader: GLTFLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'lunar_rovers_group';
    this.scene.add(this.group);
    this.loader = new GLTFLoader();

    this.spawnRovers();
  }

  private spawnRovers(): void {
    // 1. Robotic Survey Rover
    this.addRover({
      id: 'ROV-SURVEY',
      name: 'Small Survey Rover (SURV-1)',
      type: 'survey_bot',
      modelFile: './models/small-robotic-survey-rover.glb',
      speedMetersSec: 6.0,
      batteryPct: 100.0,
      homePosition: new THREE.Vector3(-8, 0, 10),
    });

    // 2. Open Crew LRV (Apollo / Artemis Heritage)
    this.addRover({
      id: 'LRV-01',
      name: 'Artemis Lunar Rover (LRV-01)',
      type: 'open_lrv',
      modelFile: './models/open-crew-rover-science-fit.glb',
      speedMetersSec: 9.0,
      batteryPct: 100.0,
      homePosition: new THREE.Vector3(-15, 0, 12),
    });

    // 3. Heavy Bucket Drum Excavator
    this.addRover({
      id: 'ROV-EXCAVATOR',
      name: 'Bucket Drum Excavator (EXC-01)',
      type: 'regolith_excavator',
      modelFile: './models/regolith-bucket-drum-excavator.glb',
      speedMetersSec: 3.5,
      batteryPct: 95.0,
      homePosition: new THREE.Vector3(12, 0, 15),
    });
  }

  private addRover(config: {
    id: string;
    name: string;
    type: RoverType;
    modelFile: string;
    speedMetersSec: number;
    batteryPct: number;
    homePosition: THREE.Vector3;
  }): void {
    const roverGroup = new THREE.Group();
    roverGroup.name = `rover_${config.id}`;
    roverGroup.position.copy(config.homePosition);

    // Initial procedural mesh representation while GLB loads
    const fallbackMesh = this.createProceduralRoverMesh(config.type);
    roverGroup.add(fallbackMesh);
    this.group.add(roverGroup);

    const entity: RoverEntity = {
      id: config.id,
      name: config.name,
      type: config.type,
      modelFile: config.modelFile,
      speedMetersSec: config.speedMetersSec,
      batteryPct: config.batteryPct,
      status: 'idle',
      currentTask: 'idle',
      homePosition: config.homePosition.clone(),
      targetPosition: null,
      mesh: roverGroup,
      wheels: [],
      totalDistanceTraversedM: 0,
    };

    this.rovers.set(config.id, entity);

    // Asynchronously load real asset pack GLB in browser
    if (typeof document !== 'undefined') {
      this.loader.load(
        config.modelFile,
        (gltf) => {
          const glbRoot = gltf.scene;
          glbRoot.name = `model_${config.id}`;
          glbRoot.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const m = node as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
            }
            if (node.name.toLowerCase().includes('wheel')) {
              entity.wheels.push(node);
            }
          });

          // Swap out procedural fallback
          roverGroup.remove(fallbackMesh);
          roverGroup.add(glbRoot);
        },
        undefined,
        (err) => {
          console.warn(`[RoverManager] Fallback active for ${config.id}:`, err);
        }
      );
    }
  }

  private createProceduralRoverMesh(type: RoverType): THREE.Group {
    const group = new THREE.Group();
    const chassisMat = new THREE.MeshStandardMaterial({
      color: type === 'regolith_excavator' ? 0xffb320 : 0xf2f4f8,
      metalness: 0.35,
      roughness: 0.35,
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x4e5462, roughness: 0.70 });

    // Chassis Box
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 3.0), chassisMat);
    chassis.position.set(0, 0.7, 0);
    chassis.castShadow = true;
    group.add(chassis);

    // Forward Exploration Headlight
    const headlight = new THREE.SpotLight(0xfffaee, 4.0, 45.0, Math.PI / 4, 0.4, 1.0);
    headlight.position.set(0, 0.9, 1.6);
    headlight.target.position.set(0, 0, 8.0);
    group.add(headlight);
    group.add(headlight.target);

    // Wheels (4 wheels)
    const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
    wheelGeom.rotateZ(Math.PI / 2);

    const wheelOffsets = [
      [-1.1, 0.4, 1.1],
      [1.1, 0.4, 1.1],
      [-1.1, 0.4, -1.1],
      [1.1, 0.4, -1.1],
    ];

    for (const offset of wheelOffsets) {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(offset[0], offset[1], offset[2]);
      wheel.castShadow = true;
      group.add(wheel);
    }

    return group;
  }

  /**
   * Dispatches a rover to target coordinates with specified task.
   */
  public dispatch(
    roverId: string,
    target: THREE.Vector3,
    task: RoverTask = 'idle'
  ): { success: boolean; message: string } {
    const rover = this.rovers.get(roverId);
    if (!rover) return { success: false, message: `Rover ${roverId} not found.` };
    if (rover.batteryPct <= 5.0) {
      return { success: false, message: `Rover ${rover.name} battery depleted (${rover.batteryPct.toFixed(0)}%). Cannot dispatch.` };
    }

    rover.targetPosition = target.clone();
    rover.currentTask = task;
    rover.status = 'en_route';

    // Orient mesh toward target
    const currentPos = rover.mesh.position.clone();
    const lookTarget = new THREE.Vector3(target.x, currentPos.y, target.z);
    rover.mesh.lookAt(lookTarget);

    console.log(`[RoverManager] Dispatched ${rover.name} to (${target.x}, ${target.z}) for task: ${task}`);
    return { success: true, message: `${rover.name} dispatched on ${task}.` };
  }

  /**
   * Dispatches the active LRV or Survey rover to clean the solar array.
   */
  public dispatchCleanSolarArrays(): { success: boolean; message: string } {
    const rover = this.rovers.get(this.selectedRoverId) || this.rovers.get('LRV-01');
    if (!rover) return { success: false, message: 'No rover available' };

    const solarArrayPosition = new THREE.Vector3(0, 0, -26);
    return this.dispatch(rover.id, solarArrayPosition, 'clean_panels');
  }

  /**
   * Dispatches heavy excavator to the habitat airlock disaster site for crew rescue.
   */
  public dispatchRescue(): { success: boolean; message: string } {
    const rover = this.rovers.get('ROV-EXCAVATOR') || this.rovers.get('LRV-01');
    if (!rover) return { success: false, message: 'No rescue vehicle available' };

    const airlockPosition = new THREE.Vector3(-6, 0, 8);
    return this.dispatch(rover.id, airlockPosition, 'rescue');
  }

  /**
   * Recalls rover back to home docking cradle.
   */
  public returnToBase(roverId: string): void {
    const rover = this.rovers.get(roverId);
    if (!rover) return;

    rover.targetPosition = rover.homePosition.clone();
    rover.status = 'returning';
    rover.mesh.lookAt(rover.homePosition.x, rover.mesh.position.y, rover.homePosition.z);
  }

  /**
   * Recalls all rovers back to home docking cradles.
   */
  public returnAllRovers(): void {
    for (const rover of this.rovers.values()) {
      this.returnToBase(rover.id);
    }
  }

  /**
   * Update loop per frame: moves rovers, drains battery, charges at home base, rotates wheels.
   */
  public update(
    deltaSec: number,
    onTaskComplete?: (rover: RoverEntity, task: RoverTask) => void
  ): void {
    for (const rover of this.rovers.values()) {
      // 1. Battery Recharging when docked at Home Base
      if (rover.status === 'idle' || rover.status === 'charging') {
        const distToHome = rover.mesh.position.distanceTo(rover.homePosition);
        if (distToHome < 1.0 && rover.batteryPct < 100.0) {
          rover.status = 'charging';
          // Charge at +20% per hour (0.0055% per second)
          rover.batteryPct = Math.min(100.0, rover.batteryPct + (20.0 / 3600.0) * deltaSec);
        } else {
          rover.status = 'idle';
        }
      }

      // 2. Navigation & Waypoint Movement
      if ((rover.status === 'en_route' || rover.status === 'returning') && rover.targetPosition) {
        const currentPos = rover.mesh.position;
        const targetPos = rover.targetPosition;
        const diff = new THREE.Vector3().subVectors(targetPos, currentPos);
        diff.y = 0; // lock to horizontal plane
        const dist = diff.length();

        if (dist > 0.4 && rover.batteryPct > 0) {
          const moveStep = Math.min(dist, rover.speedMetersSec * deltaSec);
          const dir = diff.clone().normalize();
          currentPos.addScaledVector(dir, moveStep);

          // Battery depletion: 5% per 100 metres (0.05% per metre)
          const battDrain = moveStep * 0.05;
          rover.batteryPct = Math.max(0, rover.batteryPct - battDrain);
          rover.totalDistanceTraversedM += moveStep;

          // Rotate wheels
          const wheelTurn = moveStep / 0.4;
          for (const wheel of rover.wheels) {
            wheel.rotation.x += wheelTurn;
          }

          // Face direction of travel
          rover.mesh.lookAt(targetPos.x, currentPos.y, targetPos.z);
        } else {
          // Reached destination
          if (rover.status === 'en_route') {
            rover.status = 'operating';
            console.log(`[RoverManager] ${rover.name} arrived at target. Executing task: ${rover.currentTask}`);

            if (onTaskComplete) {
              onTaskComplete(rover, rover.currentTask);
            }

            // After completing task, return to base
            setTimeout(() => {
              this.returnToBase(rover.id);
            }, 1500);
          } else if (rover.status === 'returning') {
            rover.status = 'idle';
            rover.currentTask = 'idle';
            rover.targetPosition = null;
            console.log(`[RoverManager] ${rover.name} safely docked at base.`);
          }
        }
      }
    }
  }

  public getRover(id: string): RoverEntity | undefined {
    return this.rovers.get(id);
  }

  public getAllRovers(): RoverEntity[] {
    return Array.from(this.rovers.values());
  }
}
