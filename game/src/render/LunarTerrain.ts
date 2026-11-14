import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../core/Constants';
import { Grid } from '../simulation/Grid';

export class LunarTerrain {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(private grid: Grid) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GRID_WIDTH * TILE_SIZE;
    this.canvas.height = GRID_HEIGHT * TILE_SIZE;
    this.ctx = this.canvas.getContext('2d')!;
    this.generateTerrain();
  }

  private generateTerrain(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Base Lunar Mare / Highland Regolith Layer
    // Authentic lunar greys: highland anorthosite (light grey/silver) vs mare basalt (darker charcoal)
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const tile = this.grid.getTile(tileX, tileY);

        let baseBrightness = 135; // Standard lunar grey
        if (tile) {
          if (tile.elevation === 2) {
            baseBrightness = 175; // Sunlit high rim crest (bright silver anorthosite)
          } else if (tile.elevation === 0) {
            baseBrightness = 50; // Deep permanently shadowed crater floor (dark basalt)
          }
        }

        // Add organic micro-noise for powdery regolith texture
        const noise = (Math.sin(x * 0.15) * Math.cos(y * 0.15) * 18) +
                      (Math.sin(x * 0.4) * 8) +
                      ((Math.random() - 0.5) * 12);

        const v = Math.min(230, Math.max(25, Math.floor(baseBrightness + noise)));
        // Slightly cool lunar tone: R=v-2, G=v, B=v+5
        this.ctx.fillStyle = `rgb(${v - 2}, ${v}, ${v + 6})`;
        this.ctx.fillRect(x, y, 4, 4);
      }
    }

    // 2. Shackleton Crater Rim Slope Gradient & Dramatic Shadow Line
    const shadowGrad = this.ctx.createLinearGradient(0, 0, w, h);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); // Top-left high crest sunlight
    shadowGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.0)');
    shadowGrad.addColorStop(0.75, 'rgba(10, 15, 30, 0.7)'); // Bottom-right shadow drop
    shadowGrad.addColorStop(1, 'rgba(5, 8, 20, 0.95)'); // Pitch black deep crater floor
    this.ctx.fillStyle = shadowGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 3. Pre-generated Authentic Lunar Impact Craters
    const craters = [
      // Large impact crater on western ridge
      { x: 120, y: 160, r: 42 },
      // Medium craters
      { x: 380, y: 110, r: 28 },
      { x: 260, y: 340, r: 34 },
      { x: 520, y: 220, r: 24 },
      { x: 680, y: 120, r: 30 },
      // Small micro-meteorite craters
      { x: 80, y: 80, r: 12 },
      { x: 210, y: 70, r: 14 },
      { x: 470, y: 60, r: 10 },
      { x: 600, y: 320, r: 16 },
      { x: 150, y: 440, r: 18 },
      { x: 330, y: 240, r: 15 },
      { x: 420, y: 400, r: 12 },
      { x: 650, y: 420, r: 22 },
      { x: 50, y: 280, r: 16 },
    ];

    craters.forEach((c) => this.drawCrater(c.x, c.y, c.r));

    // 4. Apollo/Artemis Lunar Lander Touchdown Blast Ring
    this.drawLandingSite(8 * TILE_SIZE + 16, 7 * TILE_SIZE + 16);

    // 5. Rover Wheels / Astronaut Boot Trails in the Lunar Dust
    this.drawRoverTrails();

    // 6. Scattered Lunar Boulders & Rocks with Sunlit Highlights and Cast Shadows
    this.drawBoulders();
  }

  private drawCrater(cx: number, cy: number, r: number): void {
    this.ctx.save();

    // Outer crater bowl shadow (cast into the depression from the top-left sun)
    const bowlGrad = this.ctx.createRadialGradient(
      cx - r * 0.25, cy - r * 0.25, r * 0.1,
      cx, cy, r
    );
    bowlGrad.addColorStop(0, '#1c2230'); // Inner floor
    bowlGrad.addColorStop(0.7, '#283142');
    bowlGrad.addColorStop(0.9, '#4b5568');
    bowlGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = bowlGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Dark inner crescent shadow on the southeast slope
    this.ctx.fillStyle = 'rgba(10, 14, 24, 0.65)';
    this.ctx.beginPath();
    this.ctx.arc(cx + r * 0.2, cy + r * 0.2, r * 0.8, 0, Math.PI * 2);
    this.ctx.fill();

    // Bright sunlit raised crest on the northwest rim (facing sunlight)
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = Math.max(2, r * 0.12);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r - 1, Math.PI * 0.8, Math.PI * 1.7);
    this.ctx.stroke();

    // Dark shadow on southeast outer rim
    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    this.ctx.lineWidth = Math.max(2, r * 0.1);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, -Math.PI * 0.2, Math.PI * 0.7);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawLandingSite(lx: number, ly: number): void {
    this.ctx.save();

    // Radial blast halo where lander descent engine blew away fine dark regolith
    const blastGrad = this.ctx.createRadialGradient(lx, ly, 10, lx, ly, 75);
    blastGrad.addColorStop(0, 'rgba(241, 245, 249, 0.45)');
    blastGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.2)');
    blastGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = blastGrad;
    this.ctx.beginPath();
    this.ctx.arc(lx, ly, 75, 0, Math.PI * 2);
    this.ctx.fill();

    // 4 Footpad indentation marks
    const pads = [
      { x: lx - 20, y: ly - 20 },
      { x: lx + 20, y: ly - 20 },
      { x: lx - 20, y: ly + 20 },
      { x: lx + 20, y: ly + 20 },
    ];
    this.ctx.fillStyle = '#1e293b';
    pads.forEach((p) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  private drawRoverTrails(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([3, 4]);

    // Track 1: from landing site towards the solar ridge
    this.ctx.beginPath();
    this.ctx.moveTo(8 * TILE_SIZE + 16, 7 * TILE_SIZE + 16);
    this.ctx.bezierCurveTo(240, 180, 180, 120, 100, 90);
    this.ctx.stroke();

    // Track 2: towards crater rim
    this.ctx.beginPath();
    this.ctx.moveTo(8 * TILE_SIZE + 16, 7 * TILE_SIZE + 16);
    this.ctx.bezierCurveTo(340, 260, 400, 310, 480, 360);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawBoulders(): void {
    this.ctx.save();
    // Deterministic boulders scattered naturally across the regolith
    const boulders = [
      { x: 190, y: 120, r: 5 },
      { x: 310, y: 80, r: 6 },
      { x: 440, y: 160, r: 7 },
      { x: 160, y: 270, r: 4 },
      { x: 290, y: 290, r: 6 },
      { x: 410, y: 310, r: 8 },
      { x: 540, y: 180, r: 5 },
      { x: 620, y: 260, r: 6 },
      { x: 110, y: 380, r: 7 },
      { x: 230, y: 410, r: 5 },
      { x: 370, y: 440, r: 6 },
      { x: 500, y: 460, r: 5 },
      { x: 670, y: 360, r: 7 },
      { x: 720, y: 210, r: 5 },
    ];

    boulders.forEach((b) => {
      // Long cast shadow from low lunar sun (pointing towards bottom-right)
      this.ctx.fillStyle = 'rgba(10, 15, 30, 0.6)';
      this.ctx.beginPath();
      this.ctx.ellipse(b.x + b.r * 1.2, b.y + b.r * 0.8, b.r * 1.5, b.r * 0.6, Math.PI * 0.25, 0, Math.PI * 2);
      this.ctx.fill();

      // Rock body
      this.ctx.fillStyle = '#64748b';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      this.ctx.fill();

      // Sunlit specular facet
      this.ctx.fillStyle = '#f1f5f9';
      this.ctx.beginPath();
      this.ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }
}
