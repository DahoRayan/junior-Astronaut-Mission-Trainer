import type { State } from './types';

export type SimStats = {
  daily: State['history'];
  bestDay: number;
  worstDay: number;
  ruleFrequency: Record<string, number>;
  stars: number;
};

export function computeStars(state: State): number {
  if (!state.history.some((record) => record.outcome === 'success')) {
    return 0;
  }
  const final = state.history[state.history.length - 1];
  if (!final || final.outcome !== 'success') {
    return 0;
  }
  let stars = 1;
  if (final.meters.power >= 30 && final.meters.air >= 30 && final.meters.shield >= 30) {
    stars = 2;
  }
  if (state.whyOpenedCount >= 3) {
    stars = 3;
  }
  return stars;
}

export function computeStats(state: State): SimStats {
  const ruleFrequency: Record<string, number> = {};
  for (const record of state.history) {
    for (const rule of record.rules) {
      ruleFrequency[rule] = (ruleFrequency[rule] ?? 0) + 1;
    }
  }
  const score = (index: number) => {
    const record = state.history[index];
    return record ? record.meters.power + record.meters.air + record.meters.crewHealth : 0;
  };
  let bestIndex = 0;
  let worstIndex = 0;
  for (let index = 1; index < state.history.length; index += 1) {
    if (score(index) > score(bestIndex)) bestIndex = index;
    if (score(index) < score(worstIndex)) worstIndex = index;
  }
  return {
    daily: state.history,
    bestDay: state.history[bestIndex]?.day ?? 0,
    worstDay: state.history[worstIndex]?.day ?? 0,
    ruleFrequency,
    stars: computeStars(state),
  };
}
