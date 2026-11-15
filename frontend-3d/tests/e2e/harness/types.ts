/**
 * E2E Testing Harness Types & Interfaces
 * NASA Outpost 3D Lunar Frontend (frontend-3d)
 */

export type TestTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export type RequirementId = 'R1' | 'R2' | 'R3' | 'R4' | 'CROSS' | 'SCENARIO';

export interface TestCaseResult {
  name: string;
  tier: TestTier;
  requirement: RequirementId;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
  error?: string;
}

export interface TierSummary {
  tier: TestTier;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDurationMs: number;
  tiers: Record<TestTier, TierSummary>;
  results: TestCaseResult[];
}

/**
 * R3 Ephemeris and Celestial Time State
 */
export interface CelestialTimeState {
  totalHours: number;       // Elapsed mission hours (0 .. 708.734)
  sol: number;              // Current Sol (1 .. 30)
  timeOfDayHours: number;   // Sol hour (0.0 .. 24.0)
  synodicPhase: number;     // Normalized phase [0.0 .. 1.0)
  isDaylight: boolean;      // True if direct solar illumination > threshold
}

export interface SolarEphemeris {
  sunAzimuthRad: number;       // Solar azimuth angle [0 .. 2pi)
  sunElevationRad: number;     // Solar elevation angle [-0.0269 .. +0.0269] for polar rim
  sunDirection: { x: number; y: number; z: number }; // Normalized unit vector pointing to sun
  earthshineIntensity: number; // 0.0 (lunar noon) to 0.25 (lunar midnight)
  solarYieldFactor: number;    // Normalized solar power generation efficiency [0 .. 1]
}

/**
 * R4 Telemetry State (18 Canonical Variables)
 */
export interface ResourceState {
  power: number;                 // Stored electricity (kWh, 0 .. batteryCapacityKwh, nominal 850)
  stored_o2: number;             // Compressed reserve oxygen (0 .. 100 u, 1u = 10 kg, nominal 80)
  oxygen: number;                // Cabin atmosphere quality percentage (0 .. 100%, nominal 20-21%)
  co2: number;                   // Cabin CO2 concentration (0 .. 100 u, 1u = 2.5 kg, nominal 10)
  temperature: number;           // Cabin temperature gauge (0 .. 100, nominal 50 = 21°C)
  pressure: number;              // Hull integrity pressure gauge (0 .. 100, nominal 100 = 101.3 kPa)
  water: number;                 // Clean water inventory (0 .. 100 u, 1u = 10 kg, nominal 60)
  food: number;                  // Food rations count (nominal 30)
  food_growth: number;           // Hydroponic crop progress (0 .. 100%)
  radiation: number;             // Crew exposure (0 .. 100)
  radiation_protection: number;  // Effective shielding score (0 .. 100)
  shield: number;                // Regolith roof integrity condition (0 .. 100, nominal 70)
  dust: number;                  // Solar panel regolith dust layer (0 .. 100%)
  light_cycle: number;           // Circadian lighting score (0 .. 100%)
  saturation: number;            // Crew nutrition/hunger gauge (0 .. 100%, nominal 80%)
  quenching: number;             // Crew hydration/thirst gauge (0 .. 100%, nominal 80%)
  enthusiasm: number;            // Crew morale (0 .. 100%, nominal 95%)
  health: number;                // Overall crew health vital (0 .. 100%, nominal 100%)
  sol: number;                   // Current mission Sol (1 .. 15+)
  timeOfDayHours: number;        // Current hour of Sol (0 .. 24)
  isSheltered?: boolean;         // Crew sheltering in storm vault flag
  o2ResupplyOrdered?: boolean;   // Emergency Earth resupply ordered flag
  o2CrisisTimerHours?: number;   // 48-hour valve crisis countdown timer
  isPaused?: boolean;            // Simulation paused state
}

/**
 * Building Entities and Power Priorities
 */
export type BuildingPriority = 1 | 2 | 3;

export interface BuildingDefinition {
  type: string;
  name: string;
  cost: number;
  powerDrawKw: number;
  priority: BuildingPriority;
  category: 'life_support' | 'power' | 'thermal' | 'resource' | 'structure' | 'comms';
}

/**
 * Rover Definitions & Actors
 */
export type RoverType = 'open_lrv' | 'pressurized_traverse' | 'robotic_survey' | 'excavator' | 'cargo_hauler';
export type RoverStatus = 'idle' | 'en_route' | 'working' | 'charging';

export interface RoverState {
  id: string;
  type: RoverType;
  status: RoverStatus;
  batteryPct: number;
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  currentTask?: string;
}

/**
 * Narrative Timeline & Dialogue
 */
export interface TimelineEvent {
  id: string;
  sol: number;
  hour: number;
  title: string;
  type: string;
  sceneId: string;
  crisisTimerHours?: number;
}

export interface DialogueChoice {
  text: string;
  action?: string;
  nextSceneId?: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
}

export interface DialogueScene {
  id: string;
  title?: string;
  lines: DialogueLine[];
}
