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

    // 1. High-Detail Multi-Octave Regolith Surface
    // Simulates authentic lunar soil texture with fine regolith grain, anorthosite feldspar, and basalt
    const imgData = this.ctx.createImageData(w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const tile = this.grid.getTile(tileX, tileY);

        // Base elevation tone:
        // Shackleton Rim Peak: 165 (silver-grey anorthosite in low-angle sunlight)
        // Mid Slope: 125
        // Permanently Shadowed Basin: 45 (deep dark basalt cold trap)
        let baseTone = 125;
        if (tile) {
          if (tile.elevation === 2) baseTone = 165;
          else if (tile.elevation === 0) baseTone = 45;
        }

        // Multi-frequency harmonic terrain noise
        const n1 = Math.sin(x * 0.04) * Math.cos(y * 0.04) * 22;
        const n2 = Math.sin(x * 0.12 + y * 0.08) * 12;
        const n3 = (Math.sin(x * 0.35) * Math.cos(y * 0.35) * 6);
        const n4 = ((Math.sin((x * 7919 + y * 6571) % 1000) - 0.5) * 8); // High-frequency dust grain

        const val = Math.min(235, Math.max(20, Math.floor(baseTone + n1 + n2 + n3 + n4)));
        const idx = (y * w + x) * 4;

        // Authentic lunar hue: subtle cool slate-blue tint
        data[idx] = Math.max(0, val - 3);     // R
        data[idx + 1] = val;                  // G
        data[idx + 2] = Math.min(255, val + 5); // B
        data[idx + 3] = 255;                  // Alpha
      }
    }
    this.ctx.putImageData(imgData, 0, 0);

    // 2. Shackleton Crater Rim Low-Angle Sunlight & Shadow Gradient
    const sunSlopeGrad = this.ctx.createLinearGradient(0, 0, w, h);
    sunSlopeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Sunlit rim crest
    sunSlopeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    sunSlopeGrad.addColorStop(0.72, 'rgba(12, 17, 32, 0.75)'); // Rim shadow line
    sunSlopeGrad.addColorStop(1, 'rgba(6, 9, 20, 0.96)');      // Permanently shadowed floor
    this.ctx.fillStyle = sunSlopeGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 3. Realistic 3D Lunar Impact Craters
    const craters = [
      // Major Geological Craters
      { x: 190, y: 220, r: 65 },
      { x: 560, y: 160, r: 48 },
      { x: 380, y: 510, r: 55 },
      { x: 790, y: 340, r: 42 },
      { x: 980, y: 190, r: 50 },
      // Medium Impact Craters
      { x: 120, y: 110, r: 26 },
      { x: 320, y: 90, r: 24 },
      { x: 720, y: 90, r: 22 },
      { x: 890, y: 480, r: 30 },
      { x: 240, y: 640, r: 28 },
      { x: 510, y: 360, r: 25 },
      { x: 640, y: 620, r: 35 },
      { x: 1020, y: 610, r: 38 },
      // Micro-Craters
      { x: 70, y: 380, r: 16 },
      { x: 440, y: 260, r: 14 },
      { x: 620, y: 220, r: 18 },
      { x: 810, y: 230, r: 15 },
      { x: 320, y: 390, r: 16 },
      { x: 160, y: 520, r: 15 },
      { x: 920, y: 110, r: 18 },
    ];

    craters.forEach((c) => this.drawCrater(c.x, c.y, c.r));

    // 4. Artemis Descent Engine Landing Scorch Ring
    this.drawLandingSite(8 * TILE_SIZE + 24, 7 * TILE_SIZE + 24);

    // 5. Curved Lunar Rover Tracks & Exploration Trails
    this.drawRoverTrails();

    // 6. Scattered Lunar Boulders with Low-Angle Shadows
    this.drawBoulders();
  }

  private drawCrater(cx: number, cy: number, r: number): void {
    this.ctx.save();

    // Crater Deep Bowl Depression
    const bowlGrad = this.ctx.createRadialGradient(
      cx - r * 0.28, cy - r * 0.28, r * 0.1,
      cx, cy, r
    );
    bowlGrad.addColorStop(0, '#131826');
    bowlGrad.addColorStop(0.65, '#20283a');
    bowlGrad.addColorStop(0.88, '#3d485e');
    bowlGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = bowlGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Dramatic Inner Cast Shadow (Southeast bowl slope in shadow)
    this.ctx.fillStyle = 'rgba(7, 10, 18, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(cx + r * 0.22, cy + r * 0.22, r * 0.78, 0, Math.PI * 2);
    this.ctx.fill();

    // Bright Raised Northwest Rim Crest (catching sharp low-angle sunlight)
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = Math.max(2.5, r * 0.14);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r - 1, Math.PI * 0.75, Math.PI * 1.75);
    this.ctx.stroke();

    // Outer Southeast Rim Shadow
    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.lineWidth = Math.max(2, r * 0.1);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, -Math.PI * 0.25, Math.PI * 0.75);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawLandingSite(lx: number, ly: number): void {
    this.ctx.save();

    // Radial blast halo where the descent engine blew away fine dark regolith
    const blastGrad = this.ctx.createRadialGradient(lx, ly, 15, lx, ly, 110);
    blastGrad.addColorStop(0, 'rgba(248, 250, 252, 0.55)');
    blastGrad.addColorStop(0.4, 'rgba(226, 232, 240, 0.25)');
    blastGrad.addColorStop(0.8, 'rgba(148, 163, 184, 0.08)');
    blastGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = blastGrad;
    this.ctx.beginPath();
    this.ctx.arc(lx, ly, 110, 0, Math.PI * 2);
    this.ctx.fill();

    // 4 Landing Pad Impressions in the lunar dust
    const padDist = 28;
    const pads = [
      { x: lx - padDist, y: ly - padDist },
      { x: lx + padDist, y: ly - padDist },
      { x: lx - padDist, y: ly + padDist },
      { x: lx + padDist, y: ly + padDist },
    ];
    this.ctx.fillStyle = '#1e293b';
    pads.forEach((p) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Metallic footpad edge
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  private drawRoverTrails(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
    this.ctx.lineWidth = 2.5;
    this.ctx.setLineDash([4, 6]);

    const startX = 8 * TILE_SIZE + 24;
    const startY = 7 * TILE_SIZE + 24;

    // Trail 1: from landing site towards the solar ridge
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.bezierCurveTo(360, 260, 260, 160, 140, 120);
    this.ctx.stroke();

    // Trail 2: towards crater rim
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.bezierCurveTo(520, 380, 620, 460, 740, 540);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawBoulders(): void {
    this.ctx.save();
    const boulders = [
      { x: 260, y: 170, r: 8 },
      { x: 440, y: 110, r: 9 },
      { x: 640, y: 220, r: 10 },
      { x: 220, y: 390, r: 7 },
      { x: 410, y: 420, r: 9 },
      { x: 590, y: 440, r: 11 },
      { x: 780, y: 250, r: 8 },
      { x: 890, y: 360, r: 9 },
      { x: 150, y: 550, r: 10 },
      { x: 330, y: 590, r: 8 },
      { x: 530, y: 640, r: 9 },
      { x: 720, y: 660, r: 8 },
      { x: 960, y: 510, r: 10 },
      { x: 1040, y: 300, r: 7 },
    ];

    boulders.forEach((b) => {
      // Long cast shadow from low lunar sun
      this.ctx.fillStyle = 'rgba(8, 12, 24, 0.65)';
      this.ctx.beginPath();
      this.ctx.ellipse(b.x + b.r * 1.3, b.y + b.r * 0.9, b.r * 1.6, b.r * 0.65, Math.PI * 0.25, 0, Math.PI * 2);
      this.ctx.fill();

      // Rock 3D Body
      ctx3dRock(this.ctx, b.x, b.y, b.r);
    });

    this.ctx.restore();

    function ctx3dRock(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
      const rockGrad = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      rockGrad.addColorStop(0, '#f1f5f9'); // Sunlit facet
      rockGrad.addColorStop(0.5, '#64748b'); // Mid body
      rockGrad.addColorStop(1, '#1e293b');   // Shadow side
      c.fillStyle = rockGrad;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  }
}
