/**
 * Three.js 3D Core Engine
 * NASA Outpost 3D Lunar Frontend
 *
 * Configures hardware WebGLRenderer with PCF soft shadows, ACES Filmic tone mapping,
 * sRGB color space, responsive container resizing via ResizeObserver,
 * PerspectiveCamera, and requestAnimationFrame render loop with delta clamping.
 */

import * as THREE from 'three';

export interface EngineOptions {
  container: HTMLElement;
  fov?: number;
  near?: number;
  far?: number;
  antialias?: boolean;
  shadows?: boolean;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
}

export type TickCallback = (delta: number, elapsed: number) => void;

export class Engine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly clock: THREE.Clock;
  public readonly container: HTMLElement;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly tickCallbacks: Map<string, TickCallback> = new Map();

  constructor(options: EngineOptions) {
    this.container = options.container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);

    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 60,
      width / (height || 1),
      options.near ?? 0.1,
      options.far ?? 2500.0
    );
    this.camera.position.set(25, 12, 35);
    this.camera.lookAt(0, 2.4, 0);

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      powerPreference: 'high-performance',
      alpha: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: true,
    });

    const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Shadow Mapping: PCFSoftShadowMap for authentic soft lunar shadows
    if (options.shadows ?? true) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // High Dynamic Range Tone Mapping & Exposure
    // Defaults to Khronos Neutral tone mapping to prevent harsh shadow crushing in lunar vacuum
    this.renderer.toneMapping = options.toneMapping ?? THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = options.toneMappingExposure ?? 1.35;

    // Mount canvas into container
    this.container.appendChild(this.renderer.domElement);

    // 4. Clock
    this.clock = new THREE.Clock();

    // 5. Setup Resize Listener
    this.setupResize();
  }

  private setupResize(): void {
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  private onWindowResize = (): void => {
    this.resize();
  };

  public resize(): void {
    const width = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public addUpdateCallback(id: string, callback: TickCallback): void {
    this.tickCallbacks.set(id, callback);
  }

  public removeUpdateCallback(id: string): void {
    this.tickCallbacks.delete(id);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // Delta time clamped to 100ms to prevent simulation explosion on backgrounded tabs
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    for (const callback of this.tickCallbacks.values()) {
      callback(delta, elapsed);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
    }

    this.tickCallbacks.clear();

    // Recursive scene graph cleanup
    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => this.disposeMaterial(mat));
          } else {
            this.disposeMaterial(mesh.material);
          }
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.remove();
    }
  }

  private disposeMaterial(material: THREE.Material): void {
    material.dispose();
    for (const key of Object.keys(material)) {
      const prop = (material as unknown as Record<string, unknown>)[key];
      if (prop && typeof (prop as THREE.Texture).dispose === 'function') {
        (prop as THREE.Texture).dispose();
      }
    }
  }
}
