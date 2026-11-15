import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../core/Constants';
import { Grid } from '../simulation/Grid';

export class LunarTerrain {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public isPhotoLoaded = false;

  constructor(_grid: Grid) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GRID_WIDTH * TILE_SIZE;
    this.canvas.height = GRID_HEIGHT * TILE_SIZE;
    this.ctx = this.canvas.getContext('2d')!;

    // Initial clean neutral background
    this.renderInitialBackground();

    // Load actual photographic lunar scan texture
    this.loadActualMoonTexture();
  }

  private loadActualMoonTexture(): void {
    const img = new Image();
    img.src = './textures/lunar_terrain_real.jpg';
    img.onload = () => {
      this.isPhotoLoaded = true;
      this.renderPhotographicTerrain(img);
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = './textures/moon_01_diff_4k.jpg';
      fallbackImg.onload = () => {
        this.isPhotoLoaded = true;
        this.renderPhotographicTerrain(fallbackImg);
      };
      fallbackImg.onerror = () => {
        const rootImg = new Image();
        rootImg.src = '/textures/moon_01_diff_4k.jpg';
        rootImg.onload = () => {
          this.isPhotoLoaded = true;
          this.renderPhotographicTerrain(rootImg);
        };
      };
    };
  }

  private renderPhotographicTerrain(img: HTMLImageElement): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Pure, clean actual photographic moon texture — no artificial overlays
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(img, 0, 0, w, h);
  }

  private renderInitialBackground(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = '#1e2433';
    this.ctx.fillRect(0, 0, w, h);
  }
}
