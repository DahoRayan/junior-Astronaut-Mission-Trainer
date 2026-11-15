import { BUILDING_DEFINITIONS } from '../core/Constants';
import { PlacedBuilding } from '../core/types';
import { Grid } from './Grid';

export interface PowerNetworkResult {
  totalGeneratedKw: number;
  totalConsumedKw: number;
  netPowerKw: number;
  batteryCapacityKwh: number;
  unpoweredBuildings: PlacedBuilding[];
}

export class PowerNetwork {
  public calculate(grid: Grid, isDaylight: boolean): PowerNetworkResult {
    let totalGeneratedKw = 0;
    let totalConsumedKw = 0;
    let batteryCapacityKwh = 0;
    const unpoweredBuildings: PlacedBuilding[] = [];

    // Reset cable power statuses
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.tiles[y][x];
        tile.cablePowered = false;
      }
    }

    // 1. Identify all connected components via BFS on adjacent cables & buildings
    const visited = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const startTile = grid.tiles[y][x];
        if ((!startTile.building && !startTile.hasCable) || visited.has(key(x, y))) {
          continue;
        }

        // Run BFS for this connected network island
        const islandBuildings: PlacedBuilding[] = [];
        const islandTiles: { x: number; y: number }[] = [];
        const queue: { x: number; y: number }[] = [{ x, y }];
        visited.add(key(x, y));

        let islandGenKw = 0;
        let islandConKw = 0;
        let islandBatCap = 0;

        while (queue.length > 0) {
          const curr = queue.shift()!;
          islandTiles.push(curr);
          const currTile = grid.getTile(curr.x, curr.y)!;

          if (currTile.building) {
            const b = currTile.building;
            islandBuildings.push(b);
            const def = BUILDING_DEFINITIONS[b.type];

            // Calculate generation
            if (b.type === 'solar_array') {
              if (currTile.inSunlight && isDaylight && !b.isFaulty) {
                islandGenKw += def.powerGenerationKw;
              }
            } else if (b.type === 'kilopower_reactor') {
              if (!b.isFaulty) {
                islandGenKw += def.powerGenerationKw;
              }
            }

            // Calculate battery capacity
            if (b.type === 'battery_bank') {
              islandBatCap += def.batteryCapacityKwh;
            }

            // Calculate consumption
            islandConKw += def.powerConsumptionKw;
          }

          // Check 4 adjacent neighbors (North, South, East, West)
          const neighbors = [
            { x: curr.x + 1, y: curr.y },
            { x: curr.x - 1, y: curr.y },
            { x: curr.x, y: curr.y + 1 },
            { x: curr.x, y: curr.y - 1 },
          ];

          for (const n of neighbors) {
            const nTile = grid.getTile(n.x, n.y);
            const nKey = key(n.x, n.y);
            if (nTile && !visited.has(nKey) && (nTile.building || nTile.hasCable)) {
              // Cable fault simulation: if marked faulty, don't conduct
              if (nTile.building?.isFaulty && nTile.building.type === 'power_cable') {
                continue;
              }
              visited.add(nKey);
              queue.push(n);
            }
          }
        }

        // Check if island has active power supply (either solar generation or battery storage)
        const hasPowerSource = islandGenKw > 0 || islandBatCap > 0;
        islandBuildings.forEach((b) => {
          b.isPowered = hasPowerSource;
          if (!hasPowerSource && BUILDING_DEFINITIONS[b.type].powerConsumptionKw > 0) {
            unpoweredBuildings.push(b);
          }
        });

        // Mark powered cables in this island
        if (hasPowerSource) {
          islandTiles.forEach((pos) => {
            const t = grid.getTile(pos.x, pos.y);
            if (t) t.cablePowered = true;
          });
        }

        totalGeneratedKw += islandGenKw;
        totalConsumedKw += islandConKw;
        batteryCapacityKwh += islandBatCap;
      }
    }

    return {
      totalGeneratedKw,
      totalConsumedKw,
      netPowerKw: totalGeneratedKw - totalConsumedKw,
      batteryCapacityKwh,
      unpoweredBuildings,
    };
  }
}
