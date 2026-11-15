import { balance } from './balance';
import { eventForDay } from './events';
import { fireRule, makeExplanation } from './explain';
import { roleDefinition, roleTiles } from './roles';
import { nextRngState } from './rng';
import { computeStars } from './stats';
import type {
  BuildingType,
  LegalActions,
  MeterDeltas,
  Module,
  Plan,
  Report,
  RoleId,
  RuleFired,
  State,
  StepResult,
  Tile,
} from './types';

const toggleable = new Set<BuildingType>(['airMaker', 'greenhouse', 'rover']);
const allTypes: BuildingType[] = ['solar', 'battery', 'airMaker', 'radiationWall', 'greenhouse', 'rover'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function moduleCount(state: State, type: BuildingType): number {
  return state.modules.filter((module) => module.type === type).length;
}

function hasModule(state: State, type: BuildingType): boolean {
  return moduleCount(state, type) > 0;
}

function isTileFree(modules: Module[], tile: Tile): boolean {
  return !modules.some((module) => module.tile.x === tile.x && module.tile.y === tile.y);
}

function recalculateDerived(state: State): void {
  state.capacity = balance.baseCapacity + moduleCount(state, 'battery') * balance.batteryCapacity;
  state.shield = balance.baseShield + moduleCount(state, 'radiationWall') * balance.buildings.radiationWall.shield;
  state.power = clamp(state.power, 0, state.capacity);
}

export function createInitialState(roleId: RoleId, seed: number): State {
  const role = roleDefinition(roleId);
  const modules: Module[] = role.loadout.map((type, index) => ({
    id: `${type}-${index + 1}`,
    type,
    tile: roleTiles[index],
    online: true,
  }));
  const state: State = {
    day: 1,
    power: role.startingPower,
    capacity: balance.baseCapacity,
    air: role.startingAir,
    shield: balance.baseShield,
    crewHealth: balance.maxCrewHealth,
    bricks: balance.startingBricks,
    modules,
    roleId,
    specialUsed: false,
    rngState: seed >>> 0,
    airDeliveryDay4: false,
    history: [],
    whyOpenedCount: 0,
  };
  recalculateDerived(state);
  return state;
}

function addRule(rules: RuleFired[], id: string, inputs: Record<string, number | string | boolean> = {}): void {
  if (!rules.some((rule) => rule.id === id)) rules.push(fireRule(id, inputs));
}

function buildingCost(type: BuildingType): number {
  return balance.buildings[type].cost;
}

function applyBuilds(state: State, plan: Plan): void {
  for (const build of plan.builds) {
    if (
      state.modules.length >= balance.maxBuildings ||
      build.tile.x < 0 ||
      build.tile.y < 0 ||
      build.tile.x >= balance.gridSize ||
      build.tile.y >= balance.gridSize ||
      !isTileFree(state.modules, build.tile) ||
      moduleCount(state, build.type) >= balance.buildings[build.type].max
    ) {
      continue;
    }
    const cost = buildingCost(build.type);
    if (state.bricks < cost) continue;
    state.bricks -= cost;
    state.modules.push({
      id: `${build.type}-${state.modules.length + 1}`,
      type: build.type,
      tile: { ...build.tile },
      online: true,
    });
  }
}

function applyRemoves(state: State, plan: Plan): void {
  if (plan.removes.length === 0) return;
  state.modules = state.modules.filter((module) => !plan.removes.includes(module.id));
  recalculateDerived(state);
}

function applyToggles(state: State, plan: Plan): void {
  for (const module of state.modules) {
    if (toggleable.has(module.type) && plan.toggles[module.id] !== undefined) {
      module.online = plan.toggles[module.id];
    }
  }
}

function applyChoice(state: State, plan: Plan, rules: RuleFired[], events: string[]): { leak: number; quakeFixed: boolean } {
  const event = eventForDay(state.day);
  let leak = -20;
  let quakeFixed = false;
  if (event?.id === 'oxygenLeak') {
    if (plan.choice === 'callEarth' && state.bricks >= 20) {
      state.bricks -= 20;
      state.airDeliveryDay4 = true;
      addRule(rules, 'R-LEAK-CHOICE', { choice: 'callEarth', bricks: 20, air: 40 });
      events.push('Call Earth');
    } else if (plan.choice === 'patchLeak' && state.bricks >= 10) {
      state.bricks -= 10;
      state.power = Math.max(0, state.power - 15);
      leak = -5;
      addRule(rules, 'R-LEAK-CHOICE', { choice: 'patchLeak', bricks: 10, power: 15 });
      events.push('Patch leak');
    }
  }
  if (event?.id === 'moonquake' && plan.choice === 'quickRepair' && state.bricks >= 10) {
    state.bricks -= 10;
    quakeFixed = true;
    addRule(rules, 'R-QUAKE-DUST', { choice: 'quickRepair', bricks: 10 });
    events.push('Quick repair');
  }
  return { leak, quakeFixed };
}

function addDelta(before: State, after: State): MeterDeltas {
  return {
    power: after.power - before.power,
    air: after.air - before.air,
    shield: after.shield - before.shield,
    crewHealth: after.crewHealth - before.crewHealth,
    bricks: after.bricks - before.bricks,
  };
}

export function legalActions(state: State): LegalActions {
  return {
    buildTypes: allTypes.filter(
      (type) =>
        state.modules.length < balance.maxBuildings &&
        moduleCount(state, type) < balance.buildings[type].max &&
        state.bricks >= balance.buildings[type].cost,
    ),
    removableIds: state.modules.map((module) => module.id),
    toggleableIds: state.modules.filter((module) => toggleable.has(module.type)).map((module) => module.id),
    choices: eventForDay(state.day)?.choices ?? [],
    canShelter: state.day === 9,
    canUseSpecial: !state.specialUsed,
  };
}

export function step(input: State, plan: Plan): StepResult {
  const before = structuredClone(input);
  const state = structuredClone(input);
  const rules: RuleFired[] = [];
  const events: string[] = [];
  const day = state.day;
  const choiceResult = applyChoice(state, plan, rules, events);
  let quickFixActive = false;
  applyBuilds(state, plan);
  applyRemoves(state, plan);
  applyToggles(state, plan);

  if (plan.useSpecial && !state.specialUsed) {
    state.specialUsed = true;
    if (state.roleId === 'scientist') {
      state.bricks += 40;
      events.push('Ice scan');
    } else if (state.roleId === 'medic') {
      state.crewHealth = clamp(state.crewHealth + 25, 0, balance.maxCrewHealth);
      events.push('Health check');
    } else {
      quickFixActive = true;
      events.push('Quick fix ready');
    }
  }
  const quakeFixed = choiceResult.quakeFixed || quickFixActive;

  if (day === 4 && state.airDeliveryDay4) {
    state.air = clamp(state.air + 40, 0, balance.maxAir);
    state.airDeliveryDay4 = false;
    events.push('Air delivery');
  }

  if (choiceResult.leak !== 0 && day === 2 && !quickFixActive) {
    state.air += choiceResult.leak;
    if (choiceResult.leak === -20) {
      addRule(rules, 'R-AIR-BALANCE', { leak: 20 });
    }
  }
  if (day === 12 && !quakeFixed) {
    state.air -= 10;
    addRule(rules, 'R-QUAKE-DUST', { air: 10, solarFactor: 0.5 });
  }

  const solarFactor = balance.nightDays.includes(day) ? 0 : day === 12 && !quakeFixed ? 0.5 : 1;
  const solarCount = moduleCount(state, 'solar');
  const generated = solarCount * balance.buildings.solar.power * solarFactor;
  const stored = state.power;
  const pool = Math.min(state.capacity, stored + generated);
  if (pool < stored + generated) {
    addRule(rules, 'R-BATTERY-FULL-WASTE', { generated, capacity: state.capacity });
    events.push('Battery full: power wasted');
  }
  state.power = pool;
  if (solarFactor === 0) addRule(rules, 'R-SOLAR-NIGHT', { panels: solarCount });
  else addRule(rules, 'R-SOLAR-SUN', { panels: solarCount, generated });

  let blackout = false;
  let airMakerOnline = false;
  let greenhouseOnline = false;
  let roverOnline = false;
  const consume = (type: BuildingType, amount: number): boolean => {
    const online = state.modules.some((module) => module.type === type && module.online);
    if (!online || state.power < amount) {
      if (online) addRule(rules, 'R-POWER-SHORT-OFFLINE', { module: type, needed: amount, power: state.power });
      return false;
    }
    state.power -= amount;
    return true;
  };
  if (state.power < balance.habitatUpkeep) {
    blackout = true;
    state.power = 0;
    state.crewHealth -= 20;
    addRule(rules, 'R-BLACKOUT-COLD', { power: balance.habitatUpkeep });
    events.push('BLACKOUT');
  } else {
    state.power -= balance.habitatUpkeep;
    airMakerOnline = consume('airMaker', balance.buildings.airMaker.power);
    greenhouseOnline = consume('greenhouse', balance.buildings.greenhouse.power);
    roverOnline = consume('rover', balance.buildings.rover.power);
  }

  if (solarFactor === 0 && state.modules.some((module) => module.online && toggleable.has(module.type))) {
    addRule(rules, 'R-POWER-SHORT-OFFLINE', { day, power: state.power });
  }
  const airBefore = state.air;
  state.air += (airMakerOnline ? balance.buildings.airMaker.air : 0);
  state.air += greenhouseOnline ? balance.buildings.greenhouse.air : 0;
  state.air -= balance.crewAirUse;
  state.air = clamp(state.air, 0, balance.maxAir);
  if (state.air !== airBefore) addRule(rules, 'R-AIR-BALANCE', { before: airBefore, after: state.air });
  if (state.air < 25) {
    state.crewHealth -= 10;
    addRule(rules, 'R-AIR-THIN', { air: state.air });
    events.push('Thin air');
  }
  if (state.air === 0) state.crewHealth -= 25;

  const storm = day === 9;
  let stormDamage = 0;
  const shelter = Boolean(plan.shelter || plan.choice === 'shelter');
  if (storm && !quickFixActive) {
    if (shelter) {
      state.power = Math.max(0, state.power - 12);
      roverOnline = false;
      addRule(rules, 'R-SHELTER-TRADE', { power: 12, rover: 'offline' });
      events.push('Shelter');
    }
    const required = balance.stormRequiredShield[String(balance.stormSeverity)];
    const effectiveShield = state.shield + (shelter ? 30 : 0);
    stormDamage = Math.round(Math.max(0, required - effectiveShield) * 0.8);
    if (stormDamage > 0) {
      state.crewHealth -= stormDamage;
      addRule(rules, 'R-STORM-SHIELD', { required, shield: effectiveShield, damage: stormDamage });
      events.push('Storm damage');
    }
  }

  if (state.air >= 40 && !blackout && stormDamage === 0) {
    state.crewHealth += 2 + (greenhouseOnline ? 3 : 0);
  }
  if (day === 10 && hasModule(state, 'greenhouse')) {
    state.crewHealth += 5;
    addRule(rules, 'R-HARVEST', { greenhouse: true, crew: 5 });
    events.push('First harvest');
  }
  state.bricks += balance.baseBrickIncome + (roverOnline ? balance.buildings.rover.bricks : 0);
  state.crewHealth = clamp(state.crewHealth, 0, balance.maxCrewHealth);
  recalculateDerived(state);
  state.rngState = nextRngState(state.rngState);
  if (plan.openWhy) state.whyOpenedCount += 1;

  let outcome: State['history'][number]['outcome'] = 'continue';
  if (state.crewHealth <= 0) outcome = 'failed';
  else if (day === balance.missionDays) outcome = 'success';
  const deltas = addDelta(before, state);
  const reasons = rules.slice(0, 2);
  const report: Report = {
    deltas,
    events,
    reasons,
    explanation: makeExplanation(reasons[0], reasons[0]?.inputs),
    outcome,
  };
  if (outcome === 'success') {
    state.history.push({
      day,
      meters: { power: state.power, air: state.air, shield: state.shield, crewHealth: state.crewHealth, bricks: state.bricks },
      deltas,
      rules: rules.map((rule) => rule.id),
      outcome,
      whyOpened: Boolean(plan.openWhy),
    });
    report.stars = computeStars(state);
  } else {
    state.history.push({
      day,
      meters: { power: state.power, air: state.air, shield: state.shield, crewHealth: state.crewHealth, bricks: state.bricks },
      deltas,
      rules: rules.map((rule) => rule.id),
      outcome,
      whyOpened: Boolean(plan.openWhy),
    });
  }
  if (outcome === 'continue') state.day = Math.min(balance.missionDays, day + 1);
  return { state, report };
}
