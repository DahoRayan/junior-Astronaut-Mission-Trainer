/**
 * Camera Navigation & Sector Presets Controller
 * NASA Outpost 3D Lunar Frontend
 *
 * Manages Three.js OrbitControls, polar ground lock invariant (maxPolarAngle = Math.PI / 2 - 0.03),
 * 5 sector presets (Central Hab, Greenhouse, Power Yard, Landing Pad, Rim Horizon),
 * quintic smootherstep easing transitions, WASD / Arrow free-flight navigation,
 * focus-on-entity transitions, and user interruption handling.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraPreset, CameraPresetId } from '../core/types';

export const CAMERA_SECTOR_PRESETS: Record<CameraPresetId, CameraPreset> = {
  central_hab: {
    id: 'central_hab',
    name: 'Central Hab Complex',
    description: 'Inflatable habitat dome, core connecting hub, airlock and dust lock vestibule',
    position: new THREE.Vector3(12.0, 8.0, 15.0),
    target: new THREE.Vector3(0.0, 2.0, 0.0),
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse & Life Support',
    description: 'Bioregenerative food production bays, O2 loop and water recycling skids',
    position: new THREE.Vector3(-8.0, 6.0, 12.0),
    target: new THREE.Vector3(-12.0, 1.5, 4.0),
  },
  power_yard: {
    id: 'power_yard',
    name: 'Power Generation Yard',
    description: 'Solar tracking arrays, vertical solar tower, Kilopower reactor, and battery banks',
    position: new THREE.Vector3(25.0, 5.0, -15.0),
    target: new THREE.Vector3(15.0, 2.0, -10.0),
  },
  landing_pad: {
    id: 'landing_pad',
    name: 'Sintered Landing Pad',
    description: 'Spacecraft touchdown zone, blast deflectors, propellant farm, and cargo lander',
    position: new THREE.Vector3(35.0, 14.0, 30.0),
    target: new THREE.Vector3(28.0, 3.0, 20.0),
  },
  rim_horizon: {
    id: 'rim_horizon',
    name: 'Shackleton Crater Rim & Horizon',
    description: 'Panoramic crater rim vista overlooking grazing low-angle sun and Earth in the sky',
    position: new THREE.Vector3(0.0, 4.0, 45.0),
    target: new THREE.Vector3(0.0, 3.0, 0.0),
  },
};

interface TransitionState {
  active: boolean;
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  duration: number; // in seconds
  elapsed: number;
  onComplete?: () => void;
}

interface FollowConfig {
  target: THREE.Object3D;
  distance: number;
  height: number;
  smoothFactor: number;
}

export class CameraController {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;
  public readonly domElement: HTMLElement;

  private transition: TransitionState = {
    active: false,
    startPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    duration: 1.2,
    elapsed: 0,
  };

  private followTarget: FollowConfig | null = null;
  private currentPresetId: CameraPresetId = 'central_hab';
  private keysPressed: Set<string> = new Set();

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Instantiate Three.js OrbitControls
    this.controls = new OrbitControls(this.camera, this.domElement);

    // Apply configuration: generous navigation bounds [3.0m - 280.0m]
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3.0;   // 3m inspection
    this.controls.maxDistance = 280.0; // 280m full base panoramic view

    // Polar ground clamping: Math.PI / 2 - 0.03 strictly prevents clipping below Y=0
    this.controls.minPolarAngle = 0.05; // ~2.86° prevents zenith gimbal singularity
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // ~88.28° ground lock invariant

    this.controls.screenSpacePanning = false; // Pan across XZ ground plane
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 1.15;
    this.controls.panSpeed = 1.0;

    // Initial position matching default preset
    this.setPresetInstant('central_hab');

    // User override cancels active transition
    this.controls.addEventListener('start', () => {
      if (this.transition.active) {
        this.cancelTransition();
      }
      if (this.followTarget) {
        this.clearFollowTarget();
      }
    });

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Avoid capturing keys when typing in input fields
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    this.keysPressed.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysPressed.delete(e.code);
  }

  /**
   * Smoothly animates camera to a predefined sector preset using quintic smootherstep.
   */
  public moveToPreset(presetId: CameraPresetId, durationSeconds: number = 1.2, onComplete?: () => void): void {
    const preset = CAMERA_SECTOR_PRESETS[presetId];
    if (!preset) {
      console.warn(`[CameraController] Unknown preset ID: "${presetId}"`);
      return;
    }

    this.currentPresetId = presetId;
    this.clearFollowTarget();
    this.transitionTo(preset.position, preset.target, durationSeconds, onComplete);
  }

  /**
   * Instantly snaps camera to a sector preset without animation.
   */
  public setPresetInstant(presetId: CameraPresetId): void {
    const preset = CAMERA_SECTOR_PRESETS[presetId];
    if (!preset) return;

    this.currentPresetId = presetId;
    this.cancelTransition();
    this.clearFollowTarget();

    this.camera.position.copy(preset.position);
    this.controls.target.copy(preset.target);
    this.camera.lookAt(preset.target);
    this.controls.update();
  }

  /**
   * Smoothly transitions camera to an arbitrary position and lookAt target.
   */
  public transitionTo(
    position: THREE.Vector3,
    target: THREE.Vector3,
    durationSeconds: number = 1.2,
    onComplete?: () => void
  ): void {
    this.transition.active = true;
    this.transition.startPosition.copy(this.camera.position);
    this.transition.endPosition.copy(position);
    this.transition.startTarget.copy(this.controls.target);
    this.transition.endTarget.copy(target);
    this.transition.duration = Math.max(0.1, durationSeconds);
    this.transition.elapsed = 0;
    this.transition.onComplete = onComplete;
  }

  /**
   * Smoothly focuses camera on an arbitrary 3D entity or location.
   */
  public focusOn(targetPos: THREE.Vector3, distance: number = 14.0, height: number = 6.0, duration: number = 1.0): void {
    this.clearFollowTarget();
    const dir = this.camera.position.clone().sub(this.controls.target);
    dir.y = 0;
    if (dir.lengthSq() < 0.01) {
      dir.set(0, 0, 1);
    }
    dir.normalize();

    const newPos = targetPos.clone().addScaledVector(dir, distance).add(new THREE.Vector3(0, height, 0));
    const newTarget = targetPos.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.transitionTo(newPos, newTarget, duration);
  }

  public cancelTransition(): void {
    this.transition.active = false;
    this.transition.onComplete = undefined;
  }

  public isTransitioning(): boolean {
    return this.transition.active;
  }

  public getCurrentPreset(): CameraPresetId {
    return this.currentPresetId;
  }

  /**
   * Locks camera into third-person chase mode behind a target object (e.g. Rover or Astronaut).
   */
  public setFollowTarget(
    target: THREE.Object3D,
    distance: number = 12.0,
    height: number = 4.0,
    smoothFactor: number = 0.08
  ): void {
    this.cancelTransition();
    this.followTarget = {
      target,
      distance,
      height,
      smoothFactor,
    };
  }

  public clearFollowTarget(): void {
    this.followTarget = null;
  }

  public isFollowing(): boolean {
    return this.followTarget !== null;
  }

  /**
   * Per-frame update method called by the main engine render loop.
   */
  public update(deltaSeconds: number): void {
    // 1. Keyboard Navigation (WASD / Arrow Keys free pan across the crater)
    if (this.keysPressed.size > 0) {
      let moveZ = 0;
      let moveX = 0;
      let moveY = 0;
      if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) moveZ += 1;
      if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) moveZ -= 1;
      if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) moveX += 1;
      if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) moveX -= 1;
      if (this.keysPressed.has('Space')) moveY += 1;
      if (this.keysPressed.has('KeyC')) moveY -= 1;

      if (moveZ !== 0 || moveX !== 0 || moveY !== 0) {
        if (this.transition.active) this.cancelTransition();
        if (this.followTarget) this.clearFollowTarget();

        const fwd = new THREE.Vector3();
        this.camera.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, this.camera.up).normalize();

        const isSprint = this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight');
        const speed = (isSprint ? 60.0 : 25.0) * deltaSeconds;

        const moveVec = new THREE.Vector3()
          .addScaledVector(fwd, moveZ)
          .addScaledVector(right, moveX);
        if (moveVec.lengthSq() > 0.001) {
          moveVec.normalize().multiplyScalar(speed);
        }
        if (moveY !== 0) {
          moveVec.y = moveY * speed;
        }

        // Apply movement while strictly enforcing polar ground lock minimum height
        const nextCamY = Math.max(1.2, this.camera.position.y + moveVec.y);
        const nextTargetY = Math.max(0.2, this.controls.target.y + moveVec.y);
        moveVec.y = nextCamY - this.camera.position.y;
        this.camera.position.add(moveVec);
        this.controls.target.x += moveVec.x;
        this.controls.target.z += moveVec.z;
        this.controls.target.y = nextTargetY;
      }

      // Q / E: Smooth Azimuth Orbit Rotation
      if (this.keysPressed.has('KeyQ')) {
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), 1.8 * deltaSeconds);
        this.camera.position.copy(this.controls.target).add(offset);
      }
      if (this.keysPressed.has('KeyE')) {
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -1.8 * deltaSeconds);
        this.camera.position.copy(this.controls.target).add(offset);
      }
    }

    // 2. Active Transition Easing
    if (this.transition.active) {
      this.transition.elapsed += deltaSeconds;
      const progress = Math.min(1.0, this.transition.elapsed / this.transition.duration);

      // Quintic Smootherstep: u(t) = t^3 * (t * (6t - 15) + 10)
      const u = progress * progress * progress * (progress * (progress * 6 - 15) + 10);

      this.camera.position.lerpVectors(this.transition.startPosition, this.transition.endPosition, u);
      this.controls.target.lerpVectors(this.transition.startTarget, this.transition.endTarget, u);

      if (progress >= 1.0) {
        this.transition.active = false;
        const callback = this.transition.onComplete;
        this.transition.onComplete = undefined;
        if (callback) callback();
      }
    } else if (this.followTarget) {
      const targetObj = this.followTarget.target;
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(targetObj.quaternion).normalize();
      const desiredPos = targetObj.position.clone()
        .sub(fwd.clone().multiplyScalar(this.followTarget.distance))
        .add(new THREE.Vector3(0, this.followTarget.height, 0));

      this.camera.position.lerp(desiredPos, this.followTarget.smoothFactor);
      const desiredTarget = targetObj.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      this.controls.target.lerp(desiredTarget, this.followTarget.smoothFactor);
    }

    this.controls.update();
  }

  public handleResize(aspectRatio: number): void {
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
    }
    this.cancelTransition();
    this.clearFollowTarget();
    this.controls.dispose();
  }
}
