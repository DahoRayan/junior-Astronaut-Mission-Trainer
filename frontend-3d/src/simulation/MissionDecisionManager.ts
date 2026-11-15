/**
 * Mission Decision & Anomaly Incidents Engine
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements canonical lunar anomalies directly from anomalies.json:
 * 1. Oxygen Leak
 * 2. Solar Storm
 * 3. Long Lunar Night
 * 4. Lunar Dust on Solar Panels
 * 5. Water Electrolyzer Failure
 *
 * Kid-friendly, high-stakes decision making where captain choices
 * directly alter ECLSS life support, power balance, crew safety, and mission success score.
 */

import type { SimulationEngine } from './SimulationEngine';
import type { AstronautManager } from '../actors/AstronautManager';
import type { RoverManager } from '../rovers/RoverManager';
import type { NarrativeManager } from '../narrative/NarrativeManager';
import { soundSystem } from '../audio/SoundSystem';

export interface DecisionChoice {
  id: string;
  title: string;
  description: string;
  tradeoffText: string;
  materialsCost?: number;
  powerCost?: number;
  moraleChange?: number;
  successPoints: number;
  execute: (sim: SimulationEngine, astro: AstronautManager, rovers: RoverManager) => string;
}

export interface MissionAnomaly {
  id: string;
  name: string;
  emoji: string;
  description: string;
  danger: string;
  impact: string;
  minSol: number;
  choices: DecisionChoice[];
}

export interface DecisionRecord {
  anomalyId: string;
  anomalyName: string;
  choiceId: string;
  choiceTitle: string;
  sol: number;
  hour: number;
  resultSummary: string;
  successPoints: number;
}

export class MissionDecisionManager {
  private simEngine: SimulationEngine;
  private astronautManager: AstronautManager;
  private roverManager: RoverManager;
  private narrativeManager?: NarrativeManager;

  public activeAnomaly: MissionAnomaly | null = null;
  public missionSuccessScore: number = 85; // 0 - 100%
  public pastDecisions: DecisionRecord[] = [];
  public resolvedAnomalyIds: Set<string> = new Set();
  public lastAnomalySol: number = 0;
  public cooldownHours: number = 48.0; // 48 simulation hours (2 full Sols)
  public lastAnomalyHour: number = -48.0; // Initialized so first anomaly can trigger at minSol once Sol 1 grace period ends
  public minSolInterval: number = 2.0; // Prevent anomaly spam (48h / 24h = 2 full Sols)

  private onDecisionEventCallback?: (record: DecisionRecord) => void;

  public static readonly CANONICAL_ANOMALIES: MissionAnomaly[] = [
    {
      id: 'o2_leak',
      name: 'Oxygen Leak',
      emoji: '🫧',
      description: 'A micro-fracture developed in the habitat oxygen distribution loop, causing breathable pressure to decline!',
      danger: 'Continuous oxygen loss threatens cabin atmosphere and crew respiration if not isolated.',
      impact: 'O₂ reserves declining • Cabin pressure drops by 0.8% per hour.',
      minSol: 2.5,
      choices: [
        {
          id: 'eva_repair',
          title: '🧑‍🚀 EVA Spacewalk Repair',
          description: 'Dispatch an astronaut on emergency EVA with sealing tape and replacement sealant kit.',
          tradeoffText: 'Costs 20 🧱 Materials • Preserves 100% Oxygen • +10% Morale',
          materialsCost: 20,
          successPoints: 20,
          execute: (sim, astro) => {
            sim.spendMaterials(20);
            sim.state.oxygen = 21.0;
            sim.state.stored_o2 = Math.min(100.0, (sim.state.stored_o2 ?? 80) + 10);
            // Command nearest astronaut to perform repair
            const lead = astro.getAllAstronauts()[0];
            if (lead) {
              lead.status = 'repairing';
              lead.currentTask = '🔧 Successfully sealed O₂ pipe during emergency EVA!';
              lead.morale = Math.min(100, lead.morale + 10);
            }
            return 'Cmdr. Sarah Glenn executed an emergency spacewalk and welded the cryo-fitting! Oxygen pressure fully restored!';
          },
        },
        {
          id: 'isolate_section',
          title: '🚪 Isolate Damaged Habitat Bay',
          description: 'Close emergency pressure bulkheads to seal off the leaking habitat corridor.',
          tradeoffText: 'Zero materials cost • Crew living quarters temporarily cramped (-5% Morale)',
          materialsCost: 0,
          successPoints: 12,
          execute: (sim) => {
            sim.state.oxygen = Math.max(19.5, sim.state.oxygen);
            return 'Isolation bulkheads sealed the damaged bay. Leak halted safely with zero materials spent!';
          },
        },
        {
          id: 'backup_tanks',
          title: '🧪 Engage Backup O₂ Reserves',
          description: 'Open emergency reserve oxygen cylinders while setting cabin scrubbers to low-rationing mode.',
          tradeoffText: 'Consumes 15 units of Stored O₂ • Fast and safe',
          materialsCost: 0,
          successPoints: 10,
          execute: (sim) => {
            sim.state.stored_o2 = Math.max(0, (sim.state.stored_o2 ?? 80) - 15);
            sim.state.oxygen = 20.8;
            return 'Backup oxygen cylinders activated. Cabin atmosphere stabilized at normal 20.8% O₂!';
          },
        },
      ],
    },
    {
      id: 'dust_on_panels',
      name: 'Lunar Dust on Solar Panels',
      emoji: '🧹',
      description: 'A cloud of abrasive electrostatically charged lunar dust settled over the tracking solar arrays!',
      danger: 'Reduced solar panel sunlight conversion cuts electrical power generation by 50%.',
      impact: 'Solar efficiency down to 45% • Battery charging slowed.',
      minSol: 3.5,
      choices: [
        {
          id: 'rover_clean_sweep',
          title: '🚜 Dispatch Automated Cleaning Rovers',
          description: 'Deploy LRV-01 and the robotic survey bot equipped with electrostatic wiper sweeps.',
          tradeoffText: 'Cleans 100% dust • Uses 15% rover battery • +18 Mission Points',
          materialsCost: 0,
          successPoints: 20,
          execute: (sim, _astro, rovers) => {
            sim.cleanSolarPanels();
            sim.state.dust = 0.0;
            rovers.dispatchCleanSolarArrays();
            return 'Rover cleaning sweep completed! Solar panels polished clean, restoring 100% peak solar generation!';
          },
        },
        {
          id: 'electrostatic_pulse',
          title: '⚡ High-Voltage Dust Repulsion Pulse',
          description: 'Trigger a brief electrostatic charge pulse through the solar panel surface glass to repel the dust.',
          tradeoffText: 'Consumes 60 kWh base electricity • Instant 1-second cleaning',
          powerCost: 60,
          successPoints: 16,
          execute: (sim) => {
            sim.state.power = Math.max(0, sim.state.power - 60);
            sim.state.dust = Math.max(0, sim.state.dust - 80);
            return 'Electrostatic repulsion pulse triggered! Charged dust lifted and floated away from arrays!';
          },
        },
        {
          id: 'manual_eva_sweep',
          title: '🧑‍🚀 Astronaut Manual EVA Dust Sweeping',
          description: 'Assign two astronauts to perform a walking EVA with manual carbon-fiber brushes.',
          tradeoffText: 'Zero power or materials cost • Builds great crew spirit (+10% Morale)',
          materialsCost: 0,
          successPoints: 15,
          execute: (sim, astro) => {
            sim.state.dust = Math.max(0, sim.state.dust - 65);
            for (const a of astro.getAllAstronauts()) {
              a.morale = Math.min(100, a.morale + 10);
            }
            return 'Astronaut EVA dust sweep complete! Astronaut morale boosted by outdoor teamwork!';
          },
        },
      ],
    },
    {
      id: 'solar_storm',
      name: 'Solar Storm',
      emoji: '☀️',
      description: 'Intense coronal mass ejection (CME) shockwave approaching the Shackleton Crater rim from the Sun!',
      danger: 'High-energy proton radiation exceeds 120 mSv/h outside, hazardous to astronauts on the surface.',
      impact: 'Surface radiation rising • Communications static • Surface activities hazardous.',
      minSol: 5.5,
      choices: [
        {
          id: 'vault_evac',
          title: '🛡️ Evacuate Crew to Regolith Storm Vault',
          description: 'Sound the general siren and move all astronauts into the deep subterranean radiation bunker.',
          tradeoffText: '100% Astronaut Safety • Research temporarily paused • Maximum mission commendation',
          materialsCost: 0,
          successPoints: 25,
          execute: (_sim, astro) => {
            astro.commandShelterAll();
            return 'All astronauts scrambled into the 3-meter regolith storm vault! Crew completely shielded from solar protons!';
          },
        },
        {
          id: 'shield_boost',
          title: '⚡ Overcharge Deflector Coil Field',
          description: 'Pump stored battery energy into the habitat external electromagnetic deflection coils.',
          tradeoffText: 'Consumes 120 kWh battery power • Crew remains at work stations',
          powerCost: 120,
          successPoints: 15,
          execute: (sim) => {
            sim.state.power = Math.max(0, sim.state.power - 120);
            sim.state.radiation_protection = 90.0;
            return 'Magnetic deflection coils hummed to life! Radiation deflected away from the surface habitats!';
          },
        },
        {
          id: 'recall_rovers',
          title: '🚜 Recall Rovers & Bunker In Core Hub',
          description: 'Bring survey rovers back to charging dock and shelter astronauts in the central dome.',
          tradeoffText: 'Moderate safety • Preserves base power',
          materialsCost: 0,
          successPoints: 12,
          execute: (_sim, _astro, rovers) => {
            rovers.returnAllRovers();
            return 'Rovers safely docked in base berths and crew stationed in the reinforced central core.';
          },
        },
      ],
    },
    {
      id: 'electrolyzer_failure',
      name: 'Water Electrolyzer Failure',
      emoji: '💧',
      description: 'The main water electrolysis unit suffered a pump valve breakdown and cannot extract oxygen from water!',
      danger: 'Oxygen production stalled; continuing to water crops without O₂ extraction burns through water reserves.',
      impact: 'Electrolyzer offline • Oxygen generation halted until repaired.',
      minSol: 6.5,
      choices: [
        {
          id: '3d_print_valve',
          title: '🖨️ 3D-Print Replacement Sintered Valve',
          description: 'Use the regolith sintering 3D print gantry to fabricate a custom titanium-regolith replacement valve.',
          tradeoffText: 'Costs 30 🧱 Materials • Fully restores 100% electrolyzer function',
          materialsCost: 30,
          successPoints: 22,
          execute: (sim) => {
            sim.spendMaterials(30);
            sim.state.stored_o2 = Math.min(100.0, (sim.state.stored_o2 ?? 80) + 15);
            sim.state.oxygen = 21.0;
            return 'Replacement valve 3D-printed and installed! Water electrolysis and oxygen extraction running at 100% capacity!';
          },
        },
        {
          id: 'conserve_water',
          title: '🌱 Pause Greenhouse Irrigation to Save Water',
          description: 'Temporarily pause crop watering, diverting all available purified water to emergency life support.',
          tradeoffText: 'Zero materials cost • Preserves drinking water • Crops slightly delayed',
          materialsCost: 0,
          successPoints: 14,
          execute: (sim) => {
            sim.state.water = Math.min(100.0, sim.state.water + 15);
            return 'Water conserved for critical life-support breathing loops. Water reserves remain safe!';
          },
        },
        {
          id: 'bypass_filter',
          title: '🔄 Reroute Through Auxiliary Recycler',
          description: 'Bypass the primary electrolyzer and run water through secondary catalytic filter beds.',
          tradeoffText: 'Operates at 75% efficiency • No materials required',
          materialsCost: 0,
          successPoints: 12,
          execute: (sim) => {
            sim.state.oxygen = Math.max(20.4, sim.state.oxygen);
            return 'Secondary catalytic loop engaged. Outpost oxygen production safely stabilized!';
          },
        },
      ],
    },
    {
      id: 'long_lunar_night',
      name: 'Long Lunar Night',
      emoji: '🌑',
      description: 'The Sun sinks below the lunar horizon for an extended period, dropping solar panel electricity to zero!',
      danger: 'Excessive electricity consumption can exhaust stored battery energy before daylight returns.',
      impact: 'Solar generation 0.0 kW • Base running entirely on stored battery reserves.',
      minSol: 8.0,
      choices: [
        {
          id: 'deep_load_shed',
          title: '🔌 Deep Load-Shedding Protocol',
          description: 'Shut down non-essential lighting and research bays, preserving all power for ECLSS life support.',
          tradeoffText: 'Preserves 80% battery energy • Pauses hydroponic crop growth for 1 sol',
          materialsCost: 0,
          successPoints: 20,
          execute: (sim) => {
            sim.state.power = Math.min(sim.state.maxBattery ?? 1000, sim.state.power + 150);
            return 'Load shedding engaged. Essential life-support and thermal heaters operating steadily through the night.';
          },
        },
        {
          id: 'aux_kilopower',
          title: '⚛️ Boost Auxiliary Nuclear Reactor',
          description: 'Spin up the Kilopower Stirling generator to provide steady continuous thermal electricity.',
          tradeoffText: 'Costs 35 🧱 Materials • Keeps entire colony and greenhouses fully lit!',
          materialsCost: 35,
          successPoints: 25,
          execute: (sim) => {
            sim.spendMaterials(35);
            sim.state.power = Math.min(sim.state.maxBattery ?? 1000, sim.state.power + 350);
            return 'Auxiliary Kilopower reactor ignited! 40 kW continuous electricity flowing through base grid!';
          },
        },
        {
          id: 'rover_grid_tether',
          title: '🔋 Tether Rover Batteries to Hab Grid',
          description: 'Plug LRV-01 and the Heavy Excavator into the main power junction to back-feed stored rover power.',
          tradeoffText: 'Adds +120 kWh emergency power • Rovers immobilized until sunrise',
          materialsCost: 0,
          successPoints: 14,
          execute: (sim, _astro, rovers) => {
            sim.state.power = Math.min(sim.state.maxBattery ?? 1000, sim.state.power + 120);
            const lrv = rovers.getRover('LRV-01');
            if (lrv) lrv.batteryPct = 40.0;
            return 'Rover battery banks interconnected with habitat bus! Colony power reserves safely bolstered!';
          },
        },
      ],
    },
  ];

  constructor(
    simEngine: SimulationEngine,
    astronautManager: AstronautManager,
    roverManager: RoverManager,
    narrativeManager?: NarrativeManager
  ) {
    this.simEngine = simEngine;
    this.astronautManager = astronautManager;
    this.roverManager = roverManager;
    this.narrativeManager = narrativeManager;
    this.lastAnomalyHour = -this.cooldownHours;
  }

  public setNarrativeManager(nm: NarrativeManager): void {
    this.narrativeManager = nm;
  }

  public setCooldownHours(hours: number): void {
    this.cooldownHours = hours;
    this.minSolInterval = hours / 24.0;
  }

  public reset(): void {
    this.activeAnomaly = null;
    this.missionSuccessScore = 85;
    this.pastDecisions = [];
    this.resolvedAnomalyIds.clear();
    this.lastAnomalySol = 0;
    this.lastAnomalyHour = -this.cooldownHours;
  }

  public onDecision(cb: (record: DecisionRecord) => void): void {
    this.onDecisionEventCallback = cb;
  }

  /**
   * Resets the anomaly cooldown timer starting from the specified simulation time.
   * Enforces a mandatory quiet period (cooldownHours) following dismissal or resolution
   * of an anomaly or incident notification.
   */
  public resetCooldown(currentTotalHours?: number, currentSol?: number): void {
    let sol = currentSol ?? this.simEngine.state.sol;
    let hour = this.simEngine.state.timeOfDayHours;
    let totalHours = currentTotalHours ?? ((sol - 1) * 24.0 + hour);
    if (currentTotalHours !== undefined && currentSol === undefined) {
      sol = Math.floor(currentTotalHours / 24.0) + 1;
      hour = currentTotalHours % 24.0;
    }

    this.lastAnomalyHour = totalHours;
    this.lastAnomalySol = sol;
    console.log(
      `[MissionDecisionManager] Cooldown timer reset at Sol ${sol}, ${totalHours.toFixed(1)}h. Quiet period active until ${(totalHours + this.cooldownHours).toFixed(1)}h.`
    );
  }

  /**
   * Dismisses the active anomaly notification without taking a strategic action.
   * Clears the active anomaly state and resets the cooldown timer so that absolutely
   * NO new anomaly notifications or popups can be sent until the full cooldown has elapsed.
   */
  public dismissActiveAnomaly(currentTotalHours?: number): void {
    if (this.activeAnomaly) {
      console.log(`[MissionDecisionManager] Anomaly modal dismissed: ${this.activeAnomaly.name}`);
      this.activeAnomaly = null;
    }
    this.resetCooldown(currentTotalHours);
  }

  /**
   * Alias for dismissActiveAnomaly matching incident terminology.
   */
  public closeIncidentNotification(currentTotalHours?: number): void {
    this.dismissActiveAnomaly(currentTotalHours);
  }

  /**
   * Evaluates whether an anomaly should trigger at the current Sol and Hour.
   * Enforces:
   * 1. Active anomaly blocking (no stacking)
   * 2. Narrative modal suppression (never interrupt active story dialogue)
   * 3. Sol 1 Peaceful Grace Period: Suppress all random anomaly notifications during Sol 1
   * 4. Strict Anomaly Notification Cooldown: Enforces lastAnomalyHour + cooldownHours <= currentTotalHours
   * 5. Minimum Sol interval: sol - lastAnomalySol >= minSolInterval
   */
  public checkAnomalies(solOrTotalHours: number, hour?: number, explicitTotalHours?: number): MissionAnomaly | null {
    if (this.activeAnomaly) return null;

    // Suppress anomaly popups if a narrative visual novel modal is currently displayed
    if (this.narrativeManager?.isModalOpen) return null;

    let sol: number;
    let currentHour: number;
    let currentTotalHours: number;

    if (hour === undefined) {
      currentTotalHours = solOrTotalHours;
      sol = Math.floor(currentTotalHours / 24.0) + 1;
      currentHour = currentTotalHours % 24.0;
    } else {
      sol = solOrTotalHours;
      currentHour = hour;
      currentTotalHours = explicitTotalHours ?? ((sol - 1) * 24.0 + currentHour);
    }

    // Backward scrub defense: clamp lastAnomalyHour to currentTotalHours to avoid runaway deadlocks
    if (this.lastAnomalyHour > currentTotalHours) {
      this.lastAnomalyHour = currentTotalHours;
      this.lastAnomalySol = sol;
    }

    // 1. Sol 1 Peaceful Grace Period: Suppress all random anomaly notifications during Sol 1
    if (sol <= 1 || currentTotalHours < 24.0) {
      return null;
    }

    // 2. Strict Anomaly Notification Cooldown in simulation hours
    // Strictly respects: lastAnomalyHour + cooldownHours <= currentTotalHours
    if (this.lastAnomalyHour + this.cooldownHours > currentTotalHours) {
      return null;
    }

    // 3. Minimum sol interval check using continuous Sol
    const effectiveSol = Math.max(sol, 1.0 + currentTotalHours / 24.0);
    if (effectiveSol - this.lastAnomalySol < this.minSolInterval) {
      return null;
    }

    for (const anom of MissionDecisionManager.CANONICAL_ANOMALIES) {
      if (!this.resolvedAnomalyIds.has(anom.id) && effectiveSol >= anom.minSol) {
        this.triggerAnomaly(anom, currentTotalHours, sol);
        return anom;
      }
    }

    return null;
  }

  public triggerAnomaly(anom: MissionAnomaly, currentTotalHours?: number, sol?: number): void {
    this.activeAnomaly = anom;
    const currentSol = sol ?? this.simEngine.state.sol;
    const currentHour = this.simEngine.state.timeOfDayHours;
    const totalHours = currentTotalHours ?? ((currentSol - 1) * 24.0 + currentHour);

    this.lastAnomalySol = currentSol;
    this.lastAnomalyHour = totalHours;
    soundSystem.playError();
    console.log(`[MissionDecisionManager] Anomaly Triggered: ${anom.name} at Sol ${currentSol}, ${totalHours.toFixed(1)}h`);
  }

  public resolveActiveAnomaly(choiceId: string, currentTotalHours?: number): DecisionRecord | null {
    if (!this.activeAnomaly) return null;

    const choice = this.activeAnomaly.choices.find((c) => c.id === choiceId);
    if (!choice) return null;

    // Check afford cost if any
    if (choice.materialsCost && !this.simEngine.canAfford(choice.materialsCost)) {
      soundSystem.playError();
      return null;
    }
    if (choice.powerCost && (this.simEngine.state.power ?? 0) < choice.powerCost) {
      soundSystem.playError();
      return null;
    }

    // Execute choice
    const summary = choice.execute(this.simEngine, this.astronautManager, this.roverManager);

    // Update mission success score
    this.missionSuccessScore = Math.min(100, this.missionSuccessScore + choice.successPoints);

    let sol = this.simEngine.state.sol;
    let hour = this.simEngine.state.timeOfDayHours;
    const totalHours = currentTotalHours ?? ((sol - 1) * 24.0 + hour);
    if (currentTotalHours !== undefined) {
      sol = Math.floor(currentTotalHours / 24.0) + 1;
      hour = currentTotalHours % 24.0;
    }

    const record: DecisionRecord = {
      anomalyId: this.activeAnomaly.id,
      anomalyName: this.activeAnomaly.name,
      choiceId: choice.id,
      choiceTitle: choice.title,
      sol,
      hour,
      resultSummary: summary,
      successPoints: choice.successPoints,
    };

    this.pastDecisions.push(record);
    this.resolvedAnomalyIds.add(this.activeAnomaly.id);
    const resolvedName = this.activeAnomaly.name;
    this.activeAnomaly = null;

    // Reset cooldown timer upon resolution to enforce quiet period
    this.resetCooldown(totalHours, sol);

    soundSystem.playMilestone();

    if (this.onDecisionEventCallback) {
      this.onDecisionEventCallback(record);
    }

    console.log(`[MissionDecisionManager] Resolved ${resolvedName} with choice "${choice.title}": ${summary}`);
    return record;
  }
}
