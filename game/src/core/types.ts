/**
 * Shared Type Definitions for Beyond Earth: First Light
 * Strictly aligned with context/api-contract.md and context/game-design.md
 */

export type BuildingType =
  | 'solar_array'
  | 'battery_bank'
  | 'kilopower_reactor'
  | 'oxygen_electrolyzer'
  | 'co2_scrubber'
  | 'crew_habitat'
  | 'regolith_shield'
  | 'subterranean_vault'
  | 'hydroponics_tray'
  | 'water_extractor'
  | 'power_cable';

export type BuildingCategory =
  | 'energy'
  | 'life_support'
  | 'defense'
  | 'farming'
  | 'water_isru'
  | 'network';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  category: BuildingCategory;
  buildCost: number; // in Materials
  powerGenerationKw: number; // in direct sunlight
  powerConsumptionKw: number;
  batteryCapacityKwh: number;
  oxygenProductionKgH: number;
  waterConsumptionL: number;
  waterProductionL: number;
  shieldingBonusPct: number;
  description: string;
  educationalFact: string;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  isPowered: boolean;
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
  timeOfDayHours: number; // 0 to 24
  materials: number;
  powerKwGenerated: number;
  powerKwConsumed: number;
  powerBalanceKw: number;
  batteryChargeKwh: number;
  batteryCapacityKwh: number;
  oxygenKgRemaining: number;
  oxygenBalanceKgH: number;
  waterLiters: number;
  waterRecycledLiters: number;
  radiationDoseMitigatedPct: number;
  crewHealthAvg: number; // 0-100
  crewMoraleAvg: number; // 0-100
  activeAlert: string | null;
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

export type CharacterId = 'elena' | 'amir' | 'nia' | 'daniel' | 'milo';

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
