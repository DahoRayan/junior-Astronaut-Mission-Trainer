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
    this.placeCentralBase();
  }

  public placeCentralBase(): void {
    const baseId = 'central_outpost_base';
    // Occupies a 2x2 footprint in the exact center: (11, 7), (12, 7), (11, 8), (12, 8)
    const centralBase: PlacedBuilding = {
      id: baseId,
      type: 'outpost_base',
      x: 11,
      y: 7,
      isPowered: true,
      isEnabled: true,
    };

    const tiles = [
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 11, y: 8 },
      { x: 12, y: 8 },
    ];

    for (const pos of tiles) {
      const tile = this.getTile(pos.x, pos.y);
      if (tile) {
        tile.building = centralBase;
        tile.hasCable = false;
        tile.cablePowered = false;
      }
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
    // The central base cannot be demolished
    if (tile.building.type === 'outpost_base') {
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
    const seen = new Set<string>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const b = this.tiles[y][x].building;
        if (b && !seen.has(b.id)) {
          seen.add(b.id);
          buildings.push(b);
        }
      }
    }
    return buildings;
  }
}
