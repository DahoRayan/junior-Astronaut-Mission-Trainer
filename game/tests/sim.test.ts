import { describe, expect, it } from 'vitest';
import { allRuleIds, computeStars, computeStats, createInitialState, legalActions, step } from '../src/sim';
import type { BuildingType, Plan, RoleId, State } from '../src/sim';

const emptyPlan = (): Plan => ({ builds: [], removes: [], toggles: {} });

function run(state: State, planner: (current: State) => Plan): State {
  let current = state;
  while (current.history.length < 12 && (current.history.at(-1)?.outcome ?? 'continue') === 'continue') {
    const result = step(current, planner(current));
    current = result.state;
    if (result.report.outcome !== 'continue') break;
  }
  return current;
}

function tileFor(state: State): { x: number; y: number } {
  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      if (!state.modules.some((module) => module.tile.x === x && module.tile.y === y)) return { x, y };
    }
  }
  return { x: 5, y: 5 };
}

function buildIfAffordable(state: State, type: BuildingType): Plan['builds'] {
  const action = legalActions(state);
  return action.buildTypes.includes(type) ? [{ type, tile: tileFor(state) }] : [];
}

function goodPlan(state: State): Plan {
  const builds =
    state.day === 1
      ? buildIfAffordable(state, state.modules.some((module) => module.type === 'airMaker') ? 'battery' : 'airMaker')
      : state.day === 2
        ? buildIfAffordable(state, 'solar')
        : state.day === 3
          ? buildIfAffordable(state, 'airMaker')
          : state.day === 4
            ? buildIfAffordable(state, 'radiationWall')
            : state.day === 7
              ? buildIfAffordable(state, 'rover')
              : [];
  const choice = state.day === 2 ? 'patchLeak' : state.day === 9 ? 'shelter' : state.day === 12 ? 'quickRepair' : undefined;
  const toggles: Record<string, boolean> = {};
  for (const module of state.modules) {
    if ((state.day === 5 || state.day === 6) && (module.type === 'greenhouse' || module.type === 'rover')) {
      toggles[module.id] = false;
    }
  }
  return { builds, removes: [], toggles, choice, shelter: state.day === 9, useSpecial: state.day === 1, openWhy: state.day <= 3 };
}

describe('V02 simulation core', () => {
  it('is deterministic for the same state, plan, and seed', () => {
    const state = createInitialState('engineer', 42);
    const plan = emptyPlan();
    expect(step(state, plan)).toEqual(step(createInitialState('engineer', 42), plan));
  });

  it.each(['engineer', 'scientist', 'medic'] as RoleId[])('do-nothing bot fails for %s', (role) => {
    const result = run(createInitialState(role, 7), emptyPlan);
    expect(result.history.at(-1)?.outcome).toBe('failed');
  });

  it.each(['engineer', 'scientist', 'medic'] as RoleId[])('good bot wins for %s', (role) => {
    const result = run(createInitialState(role, 7), goodPlan);
    expect(result.history.at(-1)?.outcome).toBe('success');
    expect(computeStats(result).stars).toBeGreaterThanOrEqual(1);
  });

  it('keeps meters in range and reports explanation rules', () => {
    let state = createInitialState('medic', 1);
    for (let index = 0; index < 12 && state.history.at(-1)?.outcome !== 'success'; index += 1) {
      const result = step(state, emptyPlan());
      state = result.state;
      expect(Number.isNaN(state.power)).toBe(false);
      expect(state.power).toBeGreaterThanOrEqual(0);
      expect(state.power).toBeLessThanOrEqual(state.capacity);
      expect(state.air).toBeGreaterThanOrEqual(0);
      expect(state.air).toBeLessThanOrEqual(100);
      expect(state.crewHealth).toBeGreaterThanOrEqual(0);
      expect(state.crewHealth).toBeLessThanOrEqual(100);
      for (const rule of result.report.reasons) expect(allRuleIds()).toContain(rule.id);
    }
  });

  it('exposes legal event choices and shelter', () => {
    let state = createInitialState('engineer', 2);
    state = step(state, emptyPlan()).state;
    expect(legalActions(state).choices).toEqual(['callEarth', 'patchLeak']);
    state = step(state, { ...emptyPlan(), choice: 'patchLeak' }).state;
    state = { ...state, day: 9 };
    expect(legalActions(state).canShelter).toBe(true);
  });

  it('covers the documented choices and event effects', () => {
    let state = { ...createInitialState('medic', 3), day: 2, bricks: 40 };
    expect(step(state, { ...emptyPlan(), choice: 'callEarth' }).report.events).toContain('Call Earth');
    expect(step(state, { ...emptyPlan(), choice: 'patchLeak' }).report.events).toContain('Patch leak');

    state = { ...createInitialState('engineer', 3), day: 9, power: 80 };
    expect(step(state, { ...emptyPlan(), choice: 'stay' }).report.events).toContain('Storm damage');
    expect(step(state, { ...emptyPlan(), choice: 'shelter', shelter: true }).report.events).toContain('Shelter');

    state = { ...createInitialState('engineer', 3), day: 12, power: 60, bricks: 40 };
    const repaired = step(state, { ...emptyPlan(), choice: 'quickRepair' });
    expect(repaired.state.air).toBeGreaterThan(step(state, { ...emptyPlan(), choice: 'keepGoing' }).state.air);

    state = { ...createInitialState('scientist', 3), day: 10 };
    expect(step(state, emptyPlan()).report.events).toContain('First harvest');
  });

  it('shows the night, shelter, and toggle trade-offs', () => {
    const night = { ...createInitialState('engineer', 4), day: 5, power: 0 };
    expect(step(night, emptyPlan()).report.events).toContain('BLACKOUT');

    const withRover = {
      ...createInitialState('engineer', 4),
      day: 9,
      power: 80,
      modules: [
        ...createInitialState('engineer', 4).modules,
        { id: 'rover-extra', type: 'rover' as const, tile: { x: 5, y: 5 }, online: true },
      ],
    };
    const stay = step(withRover, { ...emptyPlan(), choice: 'stay' });
    const shelter = step(withRover, { ...emptyPlan(), choice: 'shelter', shelter: true });
    expect(shelter.state.crewHealth).toBeGreaterThan(stay.state.crewHealth);
    expect(shelter.state.bricks).toBeLessThan(stay.state.bricks);

    const scientist = { ...createInitialState('scientist', 4), day: 3, power: 30 };
    const greenhouseId = scientist.modules.find((module) => module.type === 'greenhouse')?.id;
    expect(greenhouseId).toBeDefined();
    const on = step(scientist, emptyPlan()).state;
    const off = step(scientist, { ...emptyPlan(), toggles: { [greenhouseId as string]: false } }).state;
    expect(on.air).toBeGreaterThan(off.air);
  });

  it('forces prioritization because bricks cannot buy everything by day 8', () => {
    const state = createInitialState('engineer', 8);
    const types: BuildingType[] = ['solar', 'battery', 'airMaker', 'radiationWall', 'greenhouse', 'rover'];
    const builds = types.map((type, index) => ({ type, tile: { x: index, y: 5 } }));
    const result = step(state, { ...emptyPlan(), builds });
    expect(result.state.bricks).toBeLessThan(40);
    expect(result.state.modules.length).toBeLessThan(state.modules.length + types.length);
  });

  it('computes one, two, and three-star outcomes from sim history', () => {
    const base = createInitialState('medic', 5);
    expect(computeStats(base).bestDay).toBe(0);
    const success = {
      ...base,
      whyOpenedCount: 0,
      history: [
        {
          day: 12,
          meters: { power: 20, air: 20, shield: 20, crewHealth: 80, bricks: 10 },
          deltas: { power: 0, air: 0, shield: 0, crewHealth: 0, bricks: 0 },
          rules: [],
          outcome: 'success' as const,
          whyOpened: false,
        },
      ],
    };
    expect(computeStars(success)).toBe(1);
    expect(computeStars({ ...success, history: [{ ...success.history[0], meters: { ...success.history[0].meters, power: 40, air: 40, shield: 40 } }] })).toBe(2);
    expect(computeStars({ ...success, whyOpenedCount: 3 })).toBe(3);
    expect(computeStats(success).bestDay).toBe(12);
  });
});
