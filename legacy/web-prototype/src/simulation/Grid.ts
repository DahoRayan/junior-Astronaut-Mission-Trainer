import { GRID_HEIGHT, GRID_WIDTH } from '../core/Constants';
import { PlacedBuilding, Tile } from '../core/types';

export class Grid {
  public readonly width: number = GRID_WIDTH;
  public readonly height: number = GRID_HEIGHT;
  public tiles: Tile[][] = [];

  constructor() {
    this.initGrid();
  }

  private initGrid(): void {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        // High rim on top/middle (elevated, constant sunlight), crater floor on bottom right (ice, permanent shadow)
        const isCraterFloor = y > 10 && x > 12;
        const isRimPeak = y < 6 || (y < 10 && x < 10);

        row.push({
          x,
          y,
          elevation: isRimPeak ? 2 : isCraterFloor ? 0 : 1,
          inSunlight: !isCraterFloor,
          hasIceDeposit: isCraterFloor,
          hasCable: false,
          cablePowered: false,
        });
      }
      this.tiles.push(row);
    }
  }

  public getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y][x];
  }

  public placeBuilding(building: PlacedBuilding): boolean {
    const tile = this.getTile(building.x, building.y);
    if (!tile || tile.building) {
      return false;
    }
    tile.building = building;
    return true;
  }

  public removeBuilding(x: number, y: number): PlacedBuilding | null {
    const tile = this.getTile(x, y);
    if (!tile || !tile.building) {
      return null;
    }
    const removed = tile.building;
    tile.building = undefined;
    return removed;
  }

  public setCable(x: number, y: number, hasCable: boolean): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    tile.hasCable = hasCable;
    return true;
  }

  public getPlacedBuildings(): PlacedBuilding[] {
    const buildings: PlacedBuilding[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].building) {
          buildings.push(this.tiles[y][x].building!);
        }
      }
    }
    return buildings;
  }
}
