import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../core/Constants';
import { BuildingType, PlacedBuilding } from '../core/types';
import { Grid } from '../simulation/Grid';
import { Camera } from './Camera';

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export class ViewportRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private animFrameId: number = 0;
  private pulseOffset: number = 0;
  private tickTime: number = 0;

  public hoveredTile: { x: number; y: number } | null = null;
  public selectedBuildingType: BuildingType | null = null;
  public isDemolishMode: boolean = false;

  private floatingTexts: FloatingText[] = [];

  // Cute astronaut buddy wandering around the base
  private astronaut = {
    x: 8 * TILE_SIZE,
    y: 7 * TILE_SIZE,
    targetX: 8 * TILE_SIZE,
    targetY: 7 * TILE_SIZE,
    bobble: 0,
    facingRight: true,
  };

  // Background stars
  private stars: { x: number; y: number; size: number; speed: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, private grid: Grid) {
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas);
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
      this.updateAstronaut(time);
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

  private updateAstronaut(time: number): void {
    this.astronaut.bobble = Math.sin(time / 200) * 3;

    // Occasionally pick a nearby random tile to wander
    if (Math.random() < 0.01) {
      const randX = Math.floor(Math.random() * 6) + 6;
      const randY = Math.floor(Math.random() * 4) + 5;
      this.astronaut.targetX = randX * TILE_SIZE;
      this.astronaut.targetY = randY * TILE_SIZE;
    }

    const dx = this.astronaut.targetX - this.astronaut.x;
    const dy = this.astronaut.targetY - this.astronaut.y;
    if (Math.abs(dx) > 1) {
      this.astronaut.x += Math.sign(dx) * 0.8;
      this.astronaut.facingRight = dx > 0;
    }
    if (Math.abs(dy) > 1) {
      this.astronaut.y += Math.sign(dy) * 0.8;
    }
  }

  private render(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Deep cosmic space background with colorful star gradients
    const bgGrad = this.ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height)
    );
    bgGrad.addColorStop(0, '#1a103c'); // Cosmic purple center
    bgGrad.addColorStop(0.5, '#0c0f2b'); // Deep blue
    bgGrad.addColorStop(1, '#050714'); // Space black
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

    // 5. Draw Little Astronaut Buddy
    this.drawAstronaut();

    // 6. Draw Placement Hover Preview
    this.drawHover();

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
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.grid.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Warm, friendly lunar soil colors
        if (tile.elevation === 2) {
          // Sunny Gold-Silver Ridge
          this.ctx.fillStyle = '#9cb3c9';
        } else if (tile.elevation === 1) {
          // Mid Regolith
          this.ctx.fillStyle = '#6b7f99';
        } else {
          // Shadowed Crater
          this.ctx.fillStyle = '#2c354d';
        }

        // Rounded chunky terrain tile
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Gentle surface dots/craters
        if ((x + y * 3) % 7 === 0) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          this.ctx.beginPath();
          this.ctx.arc(px + 10, py + 12, 4, 0, Math.PI * 2);
          this.ctx.fill();
        }

        // Sparkling Blue Ice Crystals in shadowed crater floor
        if (tile.hasIceDeposit) {
          const sparkle = Math.sin(this.tickTime * 0.005 + x + y) * 0.4 + 0.6;
          this.ctx.fillStyle = `rgba(56, 189, 248, ${0.35 * sparkle})`;
          this.ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          // Shiny diamond glint
          this.ctx.fillStyle = '#7dd3fc';
          this.ctx.beginPath();
          this.ctx.arc(px + 12, py + 12, 2.5, 0, Math.PI * 2);
          this.ctx.arc(px + 22, py + 20, 1.8, 0, Math.PI * 2);
          this.ctx.fill();
        }

        // Grid border (soft, kid-friendly)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
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

      this.drawFunBuildingSprite(b, px, py);

      // Playful bouncy status bubble
      const isOk = b.isPowered;
      const bubbleColor = isOk ? '#22c55e' : '#f59e0b';
      const bounce = Math.sin(this.tickTime * 0.008 + b.x) * 2;

      this.ctx.fillStyle = bubbleColor;
      this.ctx.beginPath();
      this.ctx.arc(px + TILE_SIZE - 6, py + 6 + bounce, 5, 0, Math.PI * 2);
      this.ctx.fill();

      // White shine dot on status bubble
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(px + TILE_SIZE - 7, py + 5 + bounce, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawFunBuildingSprite(b: PlacedBuilding, px: number, py: number): void {
    this.ctx.save();

    // Soft drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, 12, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    switch (b.type) {
      case 'solar_array': {
        // Cheerful blue photovoltaic panel with glossy highlights
        const tilt = Math.sin(this.tickTime * 0.002) * 2;
        this.ctx.fillStyle = '#1e40af';
        this.roundRect(px + 4, py + 4 + tilt, TILE_SIZE - 8, TILE_SIZE - 10, 4);
        this.ctx.fill();
        this.ctx.strokeStyle = '#60a5fa';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Sunlight reflection bar
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.fillRect(px + 7, py + 7 + tilt, 4, TILE_SIZE - 16);

        // Metallic stand
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillRect(px + TILE_SIZE / 2 - 2, py + TILE_SIZE - 6, 4, 6);
        break;
      }

      case 'battery_bank': {
        // Green battery capsule with glowing charge bars
        this.ctx.fillStyle = '#065f46';
        this.roundRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 10, 5);
        this.ctx.fill();
        this.ctx.strokeStyle = '#34d399';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Glowing battery level bars
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(px + 9, py + 14, 14, 3);
        this.ctx.fillRect(px + 9, py + 19, 14, 3);

        // Cute terminal cap
        this.ctx.fillStyle = '#facc15';
        this.ctx.fillRect(px + 13, py + 3, 6, 3);
        break;
      }

      case 'kilopower_reactor': {
        // Orange/red futuristic nuclear turbine
        this.ctx.fillStyle = '#ea580c';
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 11, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Glowing core
        const coreGlow = Math.sin(this.tickTime * 0.006) * 2 + 5;
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, coreGlow, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'oxygen_electrolyzer': {
        // Twin bubbling tanks with energetic blue bubbles
        this.ctx.fillStyle = '#0284c7';
        this.roundRect(px + 5, py + 6, 9, 20, 4);
        this.roundRect(px + 18, py + 6, 9, 20, 4);
        this.ctx.fill();

        // Animated bubbles floating up
        const bubY = (this.tickTime * 0.02) % 12;
        this.ctx.fillStyle = '#bae6fd';
        this.ctx.beginPath();
        this.ctx.arc(px + 9, py + 20 - bubY, 2, 0, Math.PI * 2);
        this.ctx.arc(px + 22, py + 22 - bubY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'crew_habitat': {
        // Cozy white dome with smiling yellow windows
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4, 13, Math.PI, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Warm cozy yellow cabin window
        this.ctx.fillStyle = '#fef08a';
        this.roundRect(px + 11, py + 12, 10, 5, 2);
        this.ctx.fill();
        break;
      }

      case 'regolith_shield': {
        // Tough moon rock fortress shield
        this.ctx.fillStyle = '#64748b';
        this.ctx.beginPath();
        this.ctx.moveTo(px + 3, py + TILE_SIZE - 4);
        this.ctx.lineTo(px + TILE_SIZE / 2, py + 4);
        this.ctx.lineTo(px + TILE_SIZE - 3, py + TILE_SIZE - 4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        break;
      }

      case 'subterranean_vault': {
        // Purple underground bunker dome
        this.ctx.fillStyle = '#4f46e5';
        this.roundRect(px + 4, py + 6, TILE_SIZE - 8, TILE_SIZE - 10, 6);
        this.ctx.fill();
        this.ctx.strokeStyle = '#a5b4fc';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Secure hatch wheel
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 1, 4, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'hydroponics_tray': {
        // Cute planter box with happy green lettuce leaves
        this.ctx.fillStyle = '#15803d';
        this.roundRect(px + 4, py + 12, TILE_SIZE - 8, 14, 4);
        this.ctx.fill();

        // 3 bouncing green sprouts
        const bounce = Math.sin(this.tickTime * 0.005) * 1.5;
        this.ctx.fillStyle = '#4ade80';
        this.ctx.beginPath();
        this.ctx.arc(px + 9, py + 10 + bounce, 4, 0, Math.PI * 2);
        this.ctx.arc(px + 16, py + 9 - bounce, 4, 0, Math.PI * 2);
        this.ctx.arc(px + 23, py + 10 + bounce, 4, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'water_extractor': {
        // Cyan drill rig mining blue ice
        this.ctx.fillStyle = '#0891b2';
        this.roundRect(px + 6, py + 4, TILE_SIZE - 12, 16, 4);
        this.ctx.fill();
        // Spinning drill tip
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(px + 14, py + 20, 4, 10);
        break;
      }

      default: {
        this.ctx.fillStyle = '#94a3b8';
        this.roundRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8, 4);
        this.ctx.fill();
        break;
      }
    }

    this.ctx.restore();
  }

  private drawAstronaut(): void {
    const { x, y, bobble, facingRight } = this.astronaut;
    this.ctx.save();
    this.ctx.translate(x, y + bobble);

    // Direction flip
    if (!facingRight) {
      this.ctx.scale(-1, 1);
    }

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 6, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // White Spacesuit Body
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(-5, 0, 10, 12, 3);
    this.ctx.fill();

    // Blue mission patch on chest
    this.ctx.fillStyle = '#0284c7';
    this.ctx.fillRect(-2, 3, 4, 3);

    // White Helmet
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.beginPath();
    this.ctx.arc(0, -5, 7, 0, Math.PI * 2);
    this.ctx.fill();

    // Shiny Gold Visor (cute reflection!)
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(2, -5, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Visor white glint
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(3.5, -6.5, 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Little waving hand
    const wave = Math.sin(this.tickTime * 0.008) * 3;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(6, -2 + wave, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawHover(): void {
    if (!this.hoveredTile) return;

    const px = this.hoveredTile.x * TILE_SIZE;
    const py = this.hoveredTile.y * TILE_SIZE;

    if (this.isDemolishMode) {
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 3;
      this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 6);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (this.selectedBuildingType) {
      const tile = this.grid.getTile(this.hoveredTile.x, this.hoveredTile.y);
      const isValid = tile && !tile.building;

      this.ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
      this.ctx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
      this.ctx.lineWidth = 3;
      this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 6);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 2;
      this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 4);
      this.ctx.stroke();
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
