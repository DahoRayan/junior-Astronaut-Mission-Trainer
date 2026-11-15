export class Camera {
  public x: number = 0;
  public y: number = 0;
  public zoom: number = 1.0;
  public minZoom: number = 0.6;
  public maxZoom: number = 2.4;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor(public canvas: HTMLCanvasElement) {
    this.setupControls();
  }

  public recenter(worldWidth: number, worldHeight: number): void {
    this.zoom = 1.2;
    this.x = (worldWidth * this.zoom - this.canvas.width) / 2;
    this.y = (worldHeight * this.zoom - this.canvas.height) / 2;
  }

  public panToWorld(worldX: number, worldY: number): void {
    this.x = worldX * this.zoom - this.canvas.width / 2;
    this.y = worldY * this.zoom - this.canvas.height / 2;
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom - this.x,
      y: worldY * this.zoom - this.y,
    };
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX + this.x) / this.zoom,
      y: (screenY + this.y) / this.zoom,
    };
  }

  private setupControls(): void {
    // Mouse drag pan
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 1) { // Left or middle click drag
        this.isDragging = true;
        this.dragStartX = e.clientX + this.x;
        this.dragStartY = e.clientY + this.y;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.x = this.dragStartX - e.clientX;
        this.y = this.dragStartY - e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * zoomFactor));

      // Zoom towards mouse position
      const mouseWorldBefore = this.screenToWorld(e.offsetX, e.offsetY);
      this.zoom = newZoom;
      const mouseWorldAfter = this.screenToWorld(e.offsetX, e.offsetY);

      this.x += (mouseWorldBefore.x - mouseWorldAfter.x) * this.zoom;
      this.y += (mouseWorldBefore.y - mouseWorldAfter.y) * this.zoom;
    }, { passive: false });

    // Keyboard pan (WASD / Arrows)
    window.addEventListener('keydown', (e) => {
      const step = 30;
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          this.y -= step;
          break;
        case 's':
        case 'ArrowDown':
          this.y += step;
          break;
        case 'a':
        case 'ArrowLeft':
          this.x -= step;
          break;
        case 'd':
        case 'ArrowRight':
          this.x += step;
          break;
        case 'r':
        case 'R':
          // Recenter shortcut
          this.recenter(24 * 32, 16 * 32);
          break;
      }
    });
  }
}
