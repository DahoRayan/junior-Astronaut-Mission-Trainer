import type { BuildingType, RoleId } from './types';

export type RoleDefinition = {
  id: RoleId;
  startingPower: number;
  startingAir: number;
  loadout: BuildingType[];
  special: 'quickFix' | 'iceScan' | 'healthCheck';
};

export const roles: Record<RoleId, RoleDefinition> = {
  engineer: {
    id: 'engineer',
    startingPower: 60,
    startingAir: 60,
    loadout: ['solar', 'solar', 'battery'],
    special: 'quickFix',
  },
  scientist: {
    id: 'scientist',
    startingPower: 50,
    startingAir: 70,
    loadout: ['solar', 'greenhouse', 'radiationWall'],
    special: 'iceScan',
  },
  medic: {
    id: 'medic',
    startingPower: 50,
    startingAir: 80,
    loadout: ['solar', 'airMaker'],
    special: 'healthCheck',
  },
};

export const roleTiles = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 2, y: 3 },
];

export function roleDefinition(roleId: RoleId): RoleDefinition {
  const role = roles[roleId];
  if (!role) {
    throw new Error(`Unknown role "${roleId}".`);
  }
  return role;
}

