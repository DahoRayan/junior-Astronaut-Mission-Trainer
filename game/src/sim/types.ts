export type BuildingType =
  | 'solar'
  | 'battery'
  | 'airMaker'
  | 'radiationWall'
  | 'greenhouse'
  | 'rover';

export type RoleId = 'engineer' | 'scientist' | 'medic';
export type ChoiceId = 'callEarth' | 'patchLeak' | 'shelter' | 'stay' | 'quickRepair' | 'keepGoing';
export type Outcome = 'continue' | 'success' | 'failed';

export type Tile = { x: number; y: number };

export type Module = {
  id: string;
  type: BuildingType;
  tile: Tile;
  online: boolean;
};

export type Plan = {
  builds: { type: BuildingType; tile: Tile }[];
  removes: string[];
  toggles: Record<string, boolean>;
  choice?: ChoiceId;
  useSpecial?: boolean;
  shelter?: boolean;
  openWhy?: boolean;
};

export type Source = {
  name: string;
  kind: 'simulated' | 'saved' | 'live';
};

export type RuleFired = {
  id: string;
  kidText: string;
  inputs: Record<string, number | string | boolean>;
  sources: Source[];
};

export type Explanation = {
  because: string;
  so: string;
  try: string;
  inputs: Record<string, number | string | boolean>;
  sources: Source[];
};

export type MeterDeltas = {
  power: number;
  air: number;
  shield: number;
  crewHealth: number;
  bricks: number;
};

export type DayRecord = {
  day: number;
  meters: Pick<State, 'power' | 'air' | 'shield' | 'crewHealth' | 'bricks'>;
  deltas: MeterDeltas;
  rules: string[];
  outcome: Outcome;
  whyOpened: boolean;
};

export type State = {
  day: number;
  power: number;
  capacity: number;
  air: number;
  shield: number;
  crewHealth: number;
  bricks: number;
  modules: Module[];
  roleId: RoleId;
  specialUsed: boolean;
  rngState: number;
  airDeliveryDay4: boolean;
  history: DayRecord[];
  whyOpenedCount: number;
};

export type Report = {
  deltas: MeterDeltas;
  events: string[];
  reasons: RuleFired[];
  explanation: Explanation;
  outcome: Outcome;
  stars?: number;
};

export type StepResult = { state: State; report: Report };

export type Forecast = {
  day: number;
  event: string;
  solarFactor: number;
  storm: boolean;
  source: Source;
};

export type LegalActions = {
  buildTypes: BuildingType[];
  removableIds: string[];
  toggleableIds: string[];
  choices: ChoiceId[];
  canShelter: boolean;
  canUseSpecial: boolean;
};
