import rawBalance from '../data/balance.json';

export type Balance = {
  missionDays: number;
  nightDays: number[];
  gridSize: number;
  maxBuildings: number;
  baseCapacity: number;
  batteryCapacity: number;
  habitatUpkeep: number;
  crewAirUse: number;
  baseBrickIncome: number;
  baseShield: number;
  maxAir: number;
  maxCrewHealth: number;
  startingBricks: number;
  stormSeverity: number;
  stormRequiredShield: Record<string, number>;
  buildings: Record<
    string,
    { cost: number; power: number; air: number; heal: number; shield: number; capacity: number; bricks: number; max: number }
  >;
};

export function loadBalance(value: unknown): Balance {
  if (!value || typeof value !== 'object') {
    throw new Error('Balance data must be an object.');
  }
  const balance = value as Partial<Balance>;
  if (
    typeof balance.missionDays !== 'number' ||
    !Array.isArray(balance.nightDays) ||
    typeof balance.baseCapacity !== 'number' ||
    typeof balance.buildings !== 'object' ||
    !balance.buildings
  ) {
    throw new Error('Balance data is missing required simulation values.');
  }
  return value as Balance;
}

export const balance = loadBalance(rawBalance);
