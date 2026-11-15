/**
 * Shared Type Definitions for Beyond Earth: First Light
 * Strictly aligned with context/api-contract.md and context/game-design.md
 */

export type BuildingType =
  | 'solar_array'
  | 'battery_bank'
  | 'emergency_o2_generator'
  | 'oxygen_electrolyzer'
  | 'co2_scrubber'
  | 'water_recycler'
  | 'heating_system'
  | 'crew_habitat'
  | 'regolith_shield'
  | 'subterranean_vault'
  | 'hydroponics_tray'
  | 'water_extractor'
  | 'earth_channel'
  | 'power_cable'
  | 'outpost_base';

export type BuildingCategory =
  | 'energy'
  | 'life_support'
  | 'thermal'
  | 'defense'
  | 'farming'
  | 'water_isru'
  | 'communication'
  | 'network';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  category: BuildingCategory;
  buildCost: number; // in Materials (NO points)
  powerGenerationKw: number; // in direct sunlight
  powerConsumptionKw: number;
  batteryCapacityKwh: number;
  oxygenProductionKgH: number;
  waterConsumptionL: number;
  waterProductionL: number;
  shieldingBonusPct: number;
  priority?: 1 | 2 | 3;
  description: string;
  educationalFact: string;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  isPowered: boolean;
  isEnabled?: boolean; // Manual player power switch (default true = ON, false = OFF)
  isFaulty?: boolean;
}

export interface Tile {
  x: number;
  y: number;
  elevation: number;
  inSunlight: boolean;
  hasIceDeposit: boolean;
  building?: PlacedBuilding;
  hasCable: boolean;
  cablePowered: boolean;
}

export interface ResourceState {
  sol: number;
  timeOfDayHours: number; // 0 to 24 (12h day, 12h night)
  is_daylight: boolean; // Clock flag
  materials: number; // Construction budget (NO points)

  // 18 Core Simulation Variables from Specification (§2.3, §10.2)
  power: number; // Stored electricity (kWh, 0 to capacity)
  stored_o2: number; // Reserve tank of breathable O2 (0-100 u, 1u = 10 kg)
  oxygen: number; // Cabin atmosphere quality % (0-100, nominal 100)
  co2: number; // Cabin CO2 (0-100 u, 1u = 2.5 kg, nominal 10)
  temperature: number; // Cabin temperature gauge (0-100, nominal 50 = 21°C)
  pressure: number; // Hull integrity pressure gauge (0-100, nominal 100)
  water: number; // Water stock (0-100 u, 1u = 10 kg)
  food: number; // Food stock (rations/units)
  food_growth: number; // Crop progress (0-100)
  radiation: number; // Crew exposure (0-100)
  radiation_protection: number; // Effective shielding (0-100)
  shield: number; // Condition of regolith layer (0-100)
  dust: number; // Dust on solar panels (0-100)
  light_cycle: number; // Circadian lighting (0-100)
  saturation: number; // Hunger gauge (0-100)
  quenching: number; // Thirst gauge (0-100)
  enthusiasm: number; // Crew morale (0-100)
  health: number; // Crew health (0-100)

  // Derived Rates & Electrical State
  powerKwGenerated: number;
  powerKwConsumed: number;
  powerBalanceKw: number;
  batteryCapacityKwh: number;
  isSheltering: boolean; // Crew sheltering in storm vault
  activeAlert: string | null;

  // Backward-compatibility Aliases
  batteryChargeKwh: number; // alias of power
  oxygenKgRemaining: number; // alias of stored_o2
  oxygenBalanceKgH: number;
  waterLiters: number; // alias of water
  waterRecycledLiters: number;
  foodGrowth: number; // alias of food_growth
  radiationProtection: number; // alias of radiation_protection
  lightCycle: number; // alias of light_cycle
  radiationDoseMitigatedPct: number;
  crewHealthAvg: number; // alias of health
  crewMoraleAvg: number; // alias of enthusiasm
}

export interface GameSnapshot {
  chapter: number;
  sol: number;
  power_kw_generated: number;
  power_kw_consumed: number;
  battery_charge_kwh: number;
  battery_capacity_kwh: number;
  oxygen_kg_remaining: number;
  crew_health_avg: number;
  crew_morale_avg: number;
  active_alert: string | null;
}

export interface DecisionEvaluationRequest {
  chapter: number;
  sol: number;
  action_type: string;
  building_type: BuildingType;
  power_balance_kw: number;
  battery_charge_kwh: number;
  oxygen_balance_kg_h: number;
  crew_sheltered: boolean;
  active_alert: string | null;
}

export interface DecisionEvaluationResponse {
  rating: 'great' | 'ok' | 'risky';
  efficiency_score: number;
  tradeoff: {
    gained: string;
    cost: string;
  };
  feedback: string;
  science_fact: {
    text: string;
    source: string;
  };
  data_source: 'live' | 'curated';
  fallback_used: boolean;
}

export interface MissionDebriefRequest {
  chapter: number;
  sols_completed: number;
  total_kwh_generated: number;
  total_o2_produced_kg: number;
  total_water_recycled_l: number;
  radiation_dose_mitigated_pct: number;
  crew_final_health: number;
  crew_final_morale: number;
  anomalies_resolved: number;
}

export interface MissionFailedData {
  reason: string;
  lesson: string;
  sol: number;
  sols_completed: number;
}

export interface MissionDebriefResponse {
  survivability_score: number;
  strengths: string[];
  lessons: string[];
  summary: string;
  nasa_badge_awarded: string;
  fallback_used: boolean;
}

export interface SpaceWeatherResponse {
  risk_level: 'low' | 'moderate' | 'high' | 'extreme';
  headline: string;
  recommendation: string;
  data_source: 'live' | 'curated';
  source_name: string;
  as_of: string;
}

export interface ChatMessage {
  speaker: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  speaker: string;
  data_source: 'live' | 'curated';
  fallback_used: boolean;
}

export type CharacterId = 'elena' | 'leo' | 'amir' | 'nia' | 'daniel' | 'milo' | 'narrator' | 'director';

export interface DialogueEntry {
  speakerId: CharacterId;
  speakerName: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'surprised' | 'serious' | 'excited';
  options?: {
    text: string;
    nextId?: string;
    action?: string;
  }[];
}
