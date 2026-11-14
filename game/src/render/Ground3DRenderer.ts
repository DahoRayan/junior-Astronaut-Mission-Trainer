import * as THREE from 'three';
import { Camera } from './Camera';

export class Ground3DRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private groundMesh: THREE.Mesh;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private isDestroyed: boolean = false;

  private diffTexture: THREE.Texture | null = null;
  private bumpTexture: THREE.Texture | null = null;

  constructor(private canvas: HTMLCanvasElement, private gameCamera: Camera) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101318);

    // Orthographic top-down camera: 100% strictly prevents ANY horizon or sky void from appearing
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 600;
    this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 5000);
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);

    // Realistic Lunar South Pole grazing lighting
    this.hemiLight = new THREE.HemisphereLight(0x3a4254, 0x0c0e14, 0.7);
    this.scene.add(this.hemiLight);

    // Low-angle sun skims crater rims creating authentic high-contrast relief
    this.dirLight = new THREE.DirectionalLight(0xfff3e0, 2.6);
    this.dirLight.position.set(1200, -900, 600);
    this.scene.add(this.dirLight);

    // Huge ground plane covering 40,000 x 40,000 units
    const planeGeo = new THREE.PlaneGeometry(40000, 40000, 32, 32);

    // Load authentic 4K textures
    const texLoader = new THREE.TextureLoader();
    this.diffTexture = texLoader.load('/textures/moon_01_diff_4k.jpg');
    this.diffTexture.wrapS = THREE.RepeatWrapping;
    this.diffTexture.wrapT = THREE.RepeatWrapping;
    this.diffTexture.repeat.set(20, 20);

    this.bumpTexture = texLoader.load('/textures/moon_01_disp_4k.png');
    this.bumpTexture.wrapS = THREE.RepeatWrapping;
    this.bumpTexture.wrapT = THREE.RepeatWrapping;
    this.bumpTexture.repeat.set(20, 20);

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.diffTexture,
      bumpMap: this.bumpTexture,
      bumpScale: 1.5,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.groundMesh = new THREE.Mesh(planeGeo, groundMat);
    this.scene.add(this.groundMesh);

    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.resize();
  };

  public resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.renderer.setSize(width, height, false);
    }
  }

  public render(): void {
    if (this.isDestroyed) return;

    this.resize();

    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width === 0 || height === 0) return;

    // Synchronize 3D camera bounds with 2D Camera viewport
    const topLeft = this.gameCamera.screenToWorld(0, 0);
    const bottomRight = this.gameCamera.screenToWorld(width, height);

    const centerX = (topLeft.x + bottomRight.x) / 2;
    const centerY = (topLeft.y + bottomRight.y) / 2;

    const viewWidth = bottomRight.x - topLeft.x;
    const viewHeight = bottomRight.y - topLeft.y;

    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();

    // Align camera with game view (inverting Y for canvas 2D vs WebGL)
    this.camera.position.set(centerX, -centerY, 1000);
    this.camera.lookAt(centerX, -centerY, 0);

    // The ground plane centers with camera: horizon and boundaries are mathematically impossible to see
    this.groundMesh.position.set(centerX, -centerY, 0);

    // Texture offset tracking to simulate seamless continuous terrain as camera pans
    if (this.diffTexture && this.bumpTexture) {
      const texScale = 1 / 2000;
      this.diffTexture.offset.set(centerX * texScale, -centerY * texScale);
      this.bumpTexture.offset.set(centerX * texScale, -centerY * texScale);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public setSunAngle(hourFraction: number): void {
    // Sun position shifts slightly over lunar day/night cycle
    const angle = hourFraction * Math.PI * 2;
    const sunDist = 1500;
    this.dirLight.position.set(
      Math.cos(angle) * sunDist,
      Math.sin(angle) * sunDist,
      500 + Math.sin(angle * 0.5) * 200
    );
  }

  public destroy(): void {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
