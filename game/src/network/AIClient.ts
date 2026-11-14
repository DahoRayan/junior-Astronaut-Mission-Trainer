/**
 * AIClient — Client <-> AI Service HTTP Bridge
 * Strictly adheres to context/api-contract.md:
 * - Base path: /v1
 * - Timeout <= 3.0s via AbortController
 * - Bundled local deterministic fallback on any error, offline status, or timeout.
 * - 100% offline-playable guarantee
 */

import {
  ChatResponse,
  DecisionEvaluationRequest,
  DecisionEvaluationResponse,
  GameSnapshot,
  MissionDebriefRequest,
  MissionDebriefResponse,
  SpaceWeatherResponse,
} from '../core/types';
import { BUILDING_DEFINITIONS } from '../core/Constants';

export class AIClient {
  private baseUrl: string;
  private readonly timeoutMs: number = 3000;

  constructor(baseUrl: string = '/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Health probe
   */
  async getHealth(): Promise<{ status: string; llm: boolean; nasa_live: boolean }> {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/health`);
    } catch {
      return { status: 'offline', llm: false, nasa_live: false };
    }
  }

  /**
   * Space Weather Telemetry (DONKI)
   */
  async getSpaceWeather(): Promise<SpaceWeatherResponse> {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/space-weather`);
    } catch (err) {
      console.warn('[AIClient] Space weather offline fallback used:', err);
      return this.getLocalSpaceWeatherFallback();
    }
  }

  /**
   * M.I.L.O. Assistant Chat
   */
  async askMILO(snapshot: GameSnapshot, message: string): Promise<ChatResponse> {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot,
          message: message.slice(0, 300),
          history: [],
        }),
      });
    } catch (err) {
      console.warn('[AIClient] M.I.L.O. offline fallback used:', err);
      return this.getLocalMILOFallback(snapshot, message);
    }
  }

  /**
   * Building / Action Decision Evaluator
   */
  async evaluateDecision(request: DecisionEvaluationRequest): Promise<DecisionEvaluationResponse> {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/evaluate/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (err) {
      console.warn('[AIClient] Decision evaluation offline fallback used:', err);
      return this.getLocalDecisionFallback(request);
    }
  }

  /**
   * Mission Debrief Certificate
   */
  async evaluateMission(request: MissionDebriefRequest): Promise<MissionDebriefResponse> {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/evaluate/mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (err) {
      console.warn('[AIClient] Mission debrief offline fallback used:', err);
      return this.getLocalMissionDebriefFallback(request);
    }
  }

  // --- Internal Fetch with AbortController ---

  private async fetchWithTimeout<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- Bundled Deterministic Offline Fallbacks ---

  private getLocalSpaceWeatherFallback(): SpaceWeatherResponse {
    return {
      risk_level: 'low',
      headline: 'The Sun is calm today with low solar flare activity.',
      recommendation: 'Normal EVAs and construction permitted on Shackleton Rim.',
      data_source: 'curated',
      source_name: 'NASA DONKI (Curated)',
      as_of: '2026-01-01T00:00:00Z',
    };
  }

  private getLocalMILOFallback(snapshot: GameSnapshot, message: string): ChatResponse {
    const lower = message.toLowerCase();
    let reply = "M.I.L.O. reporting: All systems are operational, Commander! Keep monitoring our power balance and life support reserves.";

    if (snapshot.active_alert === 'cable_disconnected' || lower.includes('cable') || lower.includes('power')) {
      reply = "M.I.L.O. reporting: Check our power cable connection to the solar array. The oxygen electrolyzer needs 10 kW of electricity to split lunar ice water into breathable air!";
    } else if (lower.includes('oxygen') || lower.includes('air') || snapshot.oxygen_kg_remaining < 50) {
      reply = "M.I.L.O. reporting: The crew breathes 0.84 kg of oxygen per person each day. Ensure the electrolyzer is connected to power to keep oxygen levels above safe limits!";
    } else if (lower.includes('night') || lower.includes('battery')) {
      reply = "M.I.L.O. reporting: During the 48-hour lunar night, solar arrays produce zero electricity. Our battery banks must store enough kilowatt-hours to maintain life support!";
    } else if (lower.includes('storm') || lower.includes('radiation') || lower.includes('sun')) {
      reply = "M.I.L.O. reporting: Solar radiation storms emit high-energy protons. Build a regolith roof or move Elena, Amir, Nia, and Daniel into the subterranean vault!";
    }

    return {
      reply,
      speaker: 'M.I.L.O.',
      data_source: 'curated',
      fallback_used: true,
    };
  }

  private getLocalDecisionFallback(req: DecisionEvaluationRequest): DecisionEvaluationResponse {
    const def = BUILDING_DEFINITIONS[req.building_type];
    const isRisky = req.power_balance_kw < 0 && req.battery_charge_kwh < 20;

    return {
      rating: isRisky ? 'risky' : 'great',
      efficiency_score: isRisky ? 45 : 88,
      tradeoff: {
        gained: def.powerGenerationKw > 0
          ? `+${def.powerGenerationKw} kW power generation`
          : def.oxygenProductionKgH > 0
          ? `+${def.oxygenProductionKgH} kg/h oxygen production`
          : `Operational ${def.name}`,
        cost: `${def.buildCost} Materials from landing reserves`,
      },
      feedback: isRisky
        ? `Caution, Commander: Operating power consumption is exceeding available generation. Consider deploying another Solar Array first!`
        : `Excellent placement! Our base systems are balanced, and life support continues operating smoothly.`,
      science_fact: {
        text: def.educationalFact,
        source: 'NASA Space Apps Mission Archive',
      },
      data_source: 'curated',
      fallback_used: true,
    };
  }

  private getLocalMissionDebriefFallback(req: MissionDebriefRequest): MissionDebriefResponse {
    const score = Math.min(100, Math.max(60, Math.round((req.crew_final_health + req.crew_final_morale) / 2)));

    return {
      survivability_score: score,
      strengths: [
        'Maintained a continuous power surplus before the lunar solar angle dipped.',
        'Quickly resolved the life support cable anomaly with Systems Engineer Amir.',
      ],
      lessons: [
        'Always verify battery storage depth-of-discharge before the prolonged lunar night.',
      ],
      summary: `Outstanding leadership, Commander! You established First Light Outpost and guaranteed safe life support for all 4 crew members.`,
      nasa_badge_awarded: 'Artemis Junior Outpost Pioneer',
      fallback_used: true,
    };
  }
}

export const aiClient = new AIClient();
