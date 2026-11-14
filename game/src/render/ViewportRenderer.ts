import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../core/Constants';
import { BuildingType, PlacedBuilding } from '../core/types';
import { Grid } from '../simulation/Grid';
import { BuildingRenderer } from './BuildingRenderer';
import { Camera } from './Camera';
import { LunarTerrain } from './LunarTerrain';

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

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
  private lunarTerrain: LunarTerrain;
  private animFrameId: number = 0;
  private pulseOffset: number = 0;
  private tickTime: number = 0;

  public hoveredTile: { x: number; y: number } | null = null;
  public selectedBuildingType: BuildingType | null = null;
  public isDemolishMode: boolean = false;

  private floatingTexts: FloatingText[] = [];
  private confettiParticles: ConfettiParticle[] = [];

  // Background stars
  private stars: { x: number; y: number; size: number; speed: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, private grid: Grid) {
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas);
    this.lunarTerrain = new LunarTerrain(grid);
    this.setupHoverListener();
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * (GRID_WIDTH * TILE_SIZE * 2),
        y: Math.random() * (GRID_HEIGHT * TILE_SIZE * 2),
        size: Math.random() < 0.3 ? 2 : 1,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
  }

  public addFloatingText(text: string, worldX: number, worldY: number, color: string = '#facc15'): void {
    this.floatingTexts.push({
      text,
      x: worldX,
      y: worldY,
      color,
      alpha: 1.0,
      vy: -1.2,
    });
  }

  public start(): void {
    const renderLoop = (time: number) => {
      this.tickTime = time;
      this.pulseOffset = (time / 80) % 16;
      this.render();
      this.animFrameId = requestAnimationFrame(renderLoop);
    };
    this.animFrameId = requestAnimationFrame(renderLoop);
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
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
    this.ctx.clearRect(0, 0, width, height);

    // Deep cosmic space background (sleek neutral obsidian)
    const bgGrad = this.ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height)
    );
    bgGrad.addColorStop(0, '#12141a'); // Dark titanium center
    bgGrad.addColorStop(0.5, '#08090c'); // Deep obsidian
    bgGrad.addColorStop(1, '#020304'); // Cosmic black
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    // Camera Transform
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // 1. Draw Twinkling Cosmic Stars
    this.drawStars();

    // 2. Draw Colorful Lunar Landscape
    this.drawTerrain();

    // 3. Draw Animated Power Cables
    this.drawCables();

    // 4. Draw Chunky Fun Buildings
    this.drawBuildings();

    // 5. Draw Placement Hover & Ghost Preview
    this.drawHover();

    // 6. Draw Confetti Celebrations
    this.drawConfetti();

    // 7. Draw Floating Text Particles
    this.drawFloatingTexts();

    this.ctx.restore();
  }

  private drawStars(): void {
    for (const star of this.stars) {
      const twinkle = Math.sin(this.tickTime * 0.003 * star.speed) * 0.5 + 0.5;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawTerrain(): void {
    // 1. Draw clean actual photographic moon texture background
    this.ctx.drawImage(this.lunarTerrain.canvas, 0, 0);

    // 2. Sparkling Blue Ice Crystals only on tiles that contain ice deposits
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.grid.tiles[y][x];
        if (!tile.hasIceDeposit) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const sparkle = Math.sin(this.tickTime * 0.005 + x + y) * 0.4 + 0.6;
        this.ctx.fillStyle = `rgba(56, 189, 248, ${0.28 * sparkle})`;
        this.ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Shiny diamond glints
        this.ctx.fillStyle = '#bae6fd';
        this.ctx.beginPath();
        this.ctx.arc(px + 10, py + 10, 2, 0, Math.PI * 2);
        this.ctx.arc(px + 22, py + 20, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
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

  private drawFloatingTexts(): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      // Outline for readability
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
  }
}
