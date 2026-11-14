import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../core/Constants';
import { eventBus } from '../core/EventBus';
import { BuildingType, PlacedBuilding } from '../core/types';
import { Grid } from '../simulation/Grid';
import { BuildingRenderer } from './BuildingRenderer';
import { Camera } from './Camera';
import { Ground3DRenderer } from './Ground3DRenderer';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
}

export class ViewportRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private ground3D: Ground3DRenderer | null = null;
  private animFrameId: number = 0;
  private pulseOffset: number = 0;
  private tickTime: number = 0;

  public hoveredTile: { x: number; y: number } | null = null;
  public selectedBuildingType: BuildingType | null = null;
  public isDemolishMode: boolean = false;

  private confettiParticles: ConfettiParticle[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private grid: Grid,
    groundCanvas?: HTMLCanvasElement | null
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas);
    if (groundCanvas) {
      this.ground3D = new Ground3DRenderer(groundCanvas, this.camera);
    }
    this.setupHoverListener();

    // Listen for realistic sun azimuth & illumination changes
    eventBus.on<{ azimuth: number; isDaylight: boolean }>('sun_updated', ({ azimuth, isDaylight }) => {
      if (this.ground3D) {
        this.ground3D.setSunAngle(azimuth, isDaylight);
      }
    });
  }

  public start(): void {
    const renderLoop = (time: number) => {
      this.tickTime = time;
      this.pulseOffset = (time / 80) % 16;
      if (this.ground3D) {
        this.ground3D.render();
      }
      this.render();
      this.animFrameId = requestAnimationFrame(renderLoop);
    };
    this.animFrameId = requestAnimationFrame(renderLoop);
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.ground3D) {
      this.ground3D.destroy();
    }
  }

  public recenter(): void {
    this.camera.recenter(GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
  }

  public getCamera(): Camera {
    return this.camera;
  }

  private setupHoverListener(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = this.camera.screenToWorld(screenX, screenY);

      const tileX = Math.floor(world.x / TILE_SIZE);
      const tileY = Math.floor(world.y / TILE_SIZE);

      if (tileX >= 0 && tileX < GRID_WIDTH && tileY >= 0 && tileY < GRID_HEIGHT) {
        this.hoveredTile = { x: tileX, y: tileY };
      } else {
        this.hoveredTile = null;
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredTile = null;
    });
  }

  private render(): void {
    const { width, height } = this.canvas;
    // Clear 2D overlay canvas to transparent so the 3D lunar terrain underneath is visible
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    // Camera Transform
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // 1. Draw Subtle Tactical Grid Bounds & Alignment Crosses
    this.drawTacticalGrid();

    // 2. Draw Animated Power Cables
    this.drawCables();

    // 3. Draw Chunky Detailed Buildings
    this.drawBuildings();

    // 4. Draw Placement Hover & Ghost Preview
    this.drawHover();

    // 5. Draw Confetti Celebrations
    this.drawConfetti();

    this.ctx.restore();
  }

  private drawTacticalGrid(): void {
    const worldW = GRID_WIDTH * TILE_SIZE;
    const worldH = GRID_HEIGHT * TILE_SIZE;

    this.ctx.save();
    // Subtle tactical perimeter border for the colony base zone
    this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Warm Artemis gold
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, worldW, worldH);

    // Subtle corner markers and grid alignment crosses
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= GRID_WIDTH; x += 4) {
      for (let y = 0; y <= GRID_HEIGHT; y += 4) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        this.ctx.beginPath();
        this.ctx.moveTo(px - 4, py);
        this.ctx.lineTo(px + 4, py);
        this.ctx.moveTo(px, py - 4);
        this.ctx.lineTo(px, py + 4);
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  private drawCables(): void {
    this.ctx.save();
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.grid.tiles[y][x];
        if (!tile.hasCable) continue;

        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE + TILE_SIZE / 2;

        // Base cable conduit (chunky neon tube)
        this.ctx.strokeStyle = tile.cablePowered ? '#0284c7' : '#475569';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';

        const neighbors = [
          { nx: x + 1, ny: y, dx: TILE_SIZE / 2, dy: 0 },
          { nx: x - 1, ny: y, dx: -TILE_SIZE / 2, dy: 0 },
          { nx: x, ny: y + 1, dx: 0, dy: TILE_SIZE / 2 },
          { nx: x, ny: y - 1, dx: 0, dy: -TILE_SIZE / 2 },
        ];

        neighbors.forEach(({ nx, ny, dx, dy }) => {
          const neighbor = this.grid.getTile(nx, ny);
          if (neighbor && (neighbor.hasCable || neighbor.building)) {
            // Draw main tube
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + dx, cy + dy);
            this.ctx.stroke();

            // Glowing energetic neon spark traveling along cable
            if (tile.cablePowered) {
              this.ctx.strokeStyle = '#38bdf8';
              this.ctx.lineWidth = 3;
              this.ctx.setLineDash([6, 10]);
              this.ctx.lineDashOffset = -this.pulseOffset;
              this.ctx.stroke();
              this.ctx.setLineDash([]);
              this.ctx.strokeStyle = '#0284c7';
              this.ctx.lineWidth = 6;
            }
          }
        });

        // Center hub node
        this.ctx.fillStyle = tile.cablePowered ? '#38bdf8' : '#64748b';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  private drawBuildings(): void {
    const buildings = this.grid.getPlacedBuildings();
    for (const b of buildings) {
      const px = b.x * TILE_SIZE;
      const py = b.y * TILE_SIZE;
      BuildingRenderer.drawBuilding(this.ctx, b, px, py, this.tickTime);
    }
  }

  private drawHover(): void {
    if (!this.hoveredTile) return;

    const px = this.hoveredTile.x * TILE_SIZE;
    const py = this.hoveredTile.y * TILE_SIZE;

    if (this.isDemolishMode) {
      // Demolition hazard preview
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2.5;
      this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 6);
      this.ctx.fill();
      this.ctx.stroke();

      // Hazard cross
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(px + 6, py + 6);
      this.ctx.lineTo(px + TILE_SIZE - 6, py + TILE_SIZE - 6);
      this.ctx.moveTo(px + TILE_SIZE - 6, py + 6);
      this.ctx.lineTo(px + 6, py + TILE_SIZE - 6);
      this.ctx.stroke();
      this.ctx.restore();
    } else if (this.selectedBuildingType) {
      const tile = this.grid.getTile(this.hoveredTile.x, this.hoveredTile.y);
      const isValid = tile && !tile.building;

      if (isValid) {
        // 1. Ghost Silhouette Preview of Building
        this.ctx.save();
        this.ctx.globalAlpha = 0.58;
        const ghost: PlacedBuilding = {
          id: '__ghost__',
          type: this.selectedBuildingType,
          x: this.hoveredTile.x,
          y: this.hoveredTile.y,
          isPowered: true,
        };
        BuildingRenderer.drawBuilding(this.ctx, ghost, px, py, this.tickTime);
        this.ctx.restore();

        // 2. High-visibility green placement reticle
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
        this.ctx.strokeStyle = '#4ade80';
        this.ctx.lineWidth = 2.5;
        this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Corner tick marks
        const s = 6;
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py + s); this.ctx.lineTo(px, py); this.ctx.lineTo(px + s, py);
        this.ctx.moveTo(px + TILE_SIZE - s, py); this.ctx.lineTo(px + TILE_SIZE, py); this.ctx.lineTo(px + TILE_SIZE, py + s);
        this.ctx.moveTo(px, py + TILE_SIZE - s); this.ctx.lineTo(px, py + TILE_SIZE); this.ctx.lineTo(px + s, py + TILE_SIZE);
        this.ctx.moveTo(px + TILE_SIZE - s, py + TILE_SIZE); this.ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE); this.ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE - s);
        this.ctx.stroke();
        this.ctx.restore();
      } else {
        // Occupied / invalid tile
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2.5;
        this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Warning slash
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(px + 8, py + 8);
        this.ctx.lineTo(px + TILE_SIZE - 8, py + TILE_SIZE - 8);
        this.ctx.stroke();
        this.ctx.restore();
      }
    } else {
      // Gentle subtle inspection cursor
      this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      this.ctx.lineWidth = 1.5;
      this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 4);
      this.ctx.stroke();
    }
  }

  public triggerConfetti(centerX?: number, centerY?: number): void {
    const cx = centerX ?? (this.hoveredTile ? this.hoveredTile.x * TILE_SIZE + 16 : (GRID_WIDTH * TILE_SIZE) / 2);
    const cy = centerY ?? (this.hoveredTile ? this.hoveredTile.y * TILE_SIZE + 16 : (GRID_HEIGHT * TILE_SIZE) / 2);
    const colors = ['#f59e0b', '#10b981', '#38bdf8', '#c084fc', '#f472b6', '#ffffff'];

    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.0;
      this.confettiParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.8,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }
  }

  private drawConfetti(): void {
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.09; // slight gravity
      p.vx *= 0.985;
      p.rotation += p.vRot;
      p.alpha -= 0.016;

      if (p.alpha <= 0) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      this.ctx.restore();
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
  }
}
