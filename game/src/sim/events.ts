import type { ChoiceId, Forecast, State } from './types';
import { balance } from './balance';

export type EventDefinition = {
  id: string;
  day: number;
  choices: ChoiceId[];
};

export const timeline: EventDefinition[] = [
  { id: 'landing', day: 1, choices: [] },
  { id: 'oxygenLeak', day: 2, choices: ['callEarth', 'patchLeak'] },
  { id: 'nightForecast', day: 4, choices: [] },
  { id: 'stormForecast', day: 8, choices: [] },
  { id: 'solarStorm', day: 9, choices: ['shelter', 'stay'] },
  { id: 'firstHarvest', day: 10, choices: [] },
  { id: 'moonquake', day: 12, choices: ['quickRepair', 'keepGoing'] },
];

export function eventForDay(day: number): EventDefinition | undefined {
  return timeline.find((event) => event.day === day);
}

export function forecast(state: State, daysAhead: number): Forecast {
  const day = Math.min(balance.missionDays, Math.max(1, state.day + daysAhead));
  const event = eventForDay(day);
  return {
    day,
    event: event?.id ?? 'calm',
    solarFactor: balance.nightDays.includes(day) ? 0 : day === 12 ? 0.5 : 1,
    storm: day === 9,
    source: { name: 'simulation timeline', kind: 'simulated' },
  };
}
