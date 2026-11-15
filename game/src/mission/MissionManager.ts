import { eventBus } from '../core/EventBus';
import { PlacedBuilding, ResourceState } from '../core/types';
import { NarrativeManager } from '../narrative/NarrativeManager';
import { aiClient } from '../network/AIClient';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { DebriefModal } from '../ui/DebriefModal';

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface StoryTimelineEvent {
  id: string;
  sol: number;
  hour: number;
  chapter: number;
  type: string;
  sceneId: string;
  title: string;
  summary: string;
}

export class MissionManager {
  public currentChapter: number = 1;
  public objectives: Objective[] = [];
  private debriefModal: DebriefModal;
  private simulation: SimulationEngine;
  private narrative: NarrativeManager;

  private firedEvents: Set<string> = new Set();
  public oxygenLeakActive: boolean = false;
  public airlockEmergencyActive: boolean = false;

  // Canonical 14 Events from story-bible.json
  private readonly timeline: StoryTimelineEvent[] = [
    {
      id: 'E-LANDING',
      sol: 1,
      hour: 6,
      chapter: 0,
      type: 'landing',
      sceneId: 'S-PRO-1',
      title: 'Touchdown at Shackleton Rim',
      summary: 'The First Light lander touches down on the Shackleton Crater rim; crew and player are introduced.',
    },
    {
      id: 'E-HAB-SETUP',
      sol: 1,
      hour: 7,
      chapter: 1,
      type: 'setup',
      sceneId: 'S-C1-1',
      title: 'Habitat Deployment & First Light',
      summary: 'Habitat inflated, solar array connected, compressed oxygen valve opened, CDRA scrubbers powered.',
    },
    {
      id: 'E-O2-VALVE-FRACTURE',
      sol: 2,
      hour: 6,
      chapter: 1,
      type: 'oxygen_leak',
      sceneId: 'S-C1-2',
      title: 'Primary Valve Fracture',
      summary: 'Primary compressed oxygen tank valve fractures; player must demand an emergency resupply from Earth.',
    },
    {
      id: 'E-RESUPPLY-LANDS',
      sol: 4,
      hour: 8,
      chapter: 1,
      type: 'resupply_arrival',
      sceneId: 'S-C1-3',
      title: 'Emergency Resupply Cargo Touchdown',
      summary: 'The emergency cargo lander arrives after a 2-sol transit and Amir swaps the oxygen tanks.',
    },
    {
      id: 'E-LONG-NIGHT-START',
      sol: 7,
      hour: 0,
      chapter: 2,
      type: 'lunar_night',
      sceneId: 'S-C2-1',
      title: 'The Mountain Ridge Shadow (48h Darkness)',
      summary: 'A mountain ridge will shadow the base for 48 consecutive hours; no solar power; outside falls to -180 C.',
    },
    {
      id: 'E-BATTERY-FREEZE',
      sol: 7,
      hour: 12,
      chapter: 2,
      type: 'thermal_failure',
      sceneId: 'S-C2-2',
      title: 'Battery Core Freeze Alert',
      summary: 'Battery cooling lines freeze and cabin temperature falls until heating is rerouted.',
    },
    {
      id: 'E-SOLAR-FLARE',
      sol: 10,
      hour: 6,
      chapter: 3,
      type: 'solar_flare',
      sceneId: 'S-C3-1',
      title: 'NASA DONKI Alert: X-Class Flare (Sunspot 4109)',
      summary: 'DONKI alert: X-class flare sends CME along Earth-Moon line; proton shockwave arrives in 90 minutes.',
    },
    {
      id: 'E-RADIATION-IMPACT',
      sol: 10,
      hour: 8,
      chapter: 3,
      type: 'radiation_storm',
      sceneId: 'S-C3-2',
      title: 'Proton Storm Impact (140 mSv/h)',
      summary: 'The radiation storm hits; crew survives in the subterranean storm vault behind regolith shielding.',
    },
    {
      id: 'E-RATIONS-LOW',
      sol: 11,
      hour: 6,
      chapter: 4,
      type: 'food_shortage',
      sceneId: 'S-C4-1',
      title: 'Earth Rations Depletion',
      summary: 'Earth rations are down to the last week; the player starts water-ice extraction in the crater.',
    },
    {
      id: 'E-HYDROPONICS',
      sol: 12,
      hour: 8,
      chapter: 4,
      type: 'resource_gain',
      sceneId: 'S-C4-2',
      title: 'Greenhouse Sprouting & First Harvest',
      summary: 'Hydroponic lettuce and radishes planted in greenhouse trays; the first fresh salad harvest.',
    },
    {
      id: 'E-CATASTROPHE',
      sol: 14,
      hour: 6,
      chapter: 5,
      type: 'compound_failure',
      sceneId: 'S-C5-1',
      title: 'Compound Moonquake Emergency',
      summary: 'Moonquake cuts power, thick dust covers arrays, and Captain Leo is trapped outside at jammed airlock.',
    },
    {
      id: 'E-RESCUE',
      sol: 14,
      hour: 10,
      chapter: 5,
      type: 'rescue',
      sceneId: 'S-C5-2',
      title: 'Rescue of Captain Ruiz',
      summary: 'The player restores power, cleans solar panels, and repressurizes airlock; Leo is pulled inside alive.',
    },
    {
      id: 'E-DEBRIEF',
      sol: 15,
      hour: 6,
      chapter: 6,
      type: 'debrief',
      sceneId: 'S-EPI-1',
      title: 'First Light Diploma & Commendation',
      summary: 'Mission debrief, official NASA commendation and First Light diploma.',
    },
    {
      id: 'E-MARS-TRANSMISSION',
      sol: 15,
      hour: 8,
      chapter: 6,
      type: 'hook',
      sceneId: 'S-EPI-2',
      title: 'The Mars Horizon',
      summary: 'NASA transmits a new expedition target: Mars, 225 million km away. Sandbox mode unlocked.',
    },
  ];

  constructor(debriefModal: DebriefModal, simulation: SimulationEngine, narrative: NarrativeManager) {
    this.debriefModal = debriefModal;
    this.simulation = simulation;
    this.narrative = narrative;

    this.loadChapter(1);
    this.bindEvents();
  }

  private bindEvents(): void {
    // Coordinate prologue with startup
    eventBus.on('prologue_start', () => {
      this.firedEvents.add('E-LANDING');
    });

    // Monitor building placements
    eventBus.on<PlacedBuilding>('structure_placed', (b) => {
      this.checkBuildingObjectives(b);
    });

    // Monitor cables
    eventBus.on('cable_placed', () => {
      this.checkObjective('connect_cables');
      this.checkObjective('reconnect_cables');
    });

    // Monitor simulation ticks for story timeline triggers & physical event effects
    eventBus.on<ResourceState>('resources_updated', (state) => {
      this.checkTimelineProgression(state);
      this.checkSimulationObjectives(state);
    });

    // Handle chapter advancements
    eventBus.on<number>('chapter_advanced', (ch) => {
      this.loadChapter(ch);
    });

    // Handle guided power tutorial completion
    eventBus.on('tutorial_power_complete', () => {
      this.firedEvents.add('E-HAB-SETUP');
      this.checkObjective('place_solar');
      this.checkObjective('connect_cables');
      this.narrative.playScene('S-C1-1');
    });
  }

  private checkTimelineProgression(state: ResourceState): void {
    // Check timeline events that match current sol & hour
    for (const ev of this.timeline) {
      if (this.firedEvents.has(ev.id)) continue;
      // E-HAB-SETUP is triggered interactively upon completing the power tutorial
      if (ev.id === 'E-HAB-SETUP') continue;

      if (state.sol > ev.sol || (state.sol === ev.sol && state.timeOfDayHours >= ev.hour)) {
        this.fireTimelineEvent(ev);
      }
    }

    // Apply active crisis leak if valve fractured
    if (this.oxygenLeakActive && state.oxygenKgRemaining > 0) {
      state.oxygenKgRemaining = Math.max(0, state.oxygenKgRemaining - 0.25);
    }
  }

  private fireTimelineEvent(ev: StoryTimelineEvent): void {
    this.firedEvents.add(ev.id);
    console.log(`[MissionManager] Firing Event: ${ev.id} (${ev.title})`);

    // Banner notification
    eventBus.emit('notification', {
      type: ev.type.includes('leak') || ev.type.includes('failure') || ev.type.includes('flare') ? 'warning' : 'info',
      message: `MISSION EVENT: ${ev.title}`,
    });

    // Physical Crisis Effects
    if (ev.id === 'E-O2-VALVE-FRACTURE') {
      this.oxygenLeakActive = true;
      this.simulation.triggerAlert('cryo_valve_fracture');
    } else if (ev.id === 'E-RESUPPLY-LANDS') {
      this.oxygenLeakActive = false;
      this.simulation.clearAlert();
      this.simulation.state.oxygenKgRemaining = 100;
      this.checkObjective('resupply_delivered');
    } else if (ev.id === 'E-LONG-NIGHT-START') {
      this.simulation.dayCycleMode = 'shackleton_polar';
      this.simulation.isDaylight = false;
      this.simulation.triggerAlert('mountain_shadow_eclipse');
    } else if (ev.id === 'E-BATTERY-FREEZE') {
      this.simulation.triggerAlert('battery_cooling_frozen');
    } else if (ev.id === 'E-SOLAR-FLARE') {
      this.simulation.triggerAlert('cme_solar_flare_imminent');
    } else if (ev.id === 'E-RADIATION-IMPACT') {
      this.simulation.state.radiation = 90;
      if (this.simulation.state.isSheltering) {
        this.checkObjective('shelter_cme');
      }
    } else if (ev.id === 'E-RATIONS-LOW') {
      this.simulation.state.food = 6;
      this.simulation.triggerAlert('food_rations_low');
    } else if (ev.id === 'E-CATASTROPHE') {
      this.airlockEmergencyActive = true;
      this.simulation.state.dust = 90; // Panels covered in regolith
      this.simulation.triggerAlert('moonquake_compound_catastrophe');
    } else if (ev.id === 'E-RESCUE') {
      this.airlockEmergencyActive = false;
      this.simulation.clearAlert();
      this.checkObjective('rescue_leo');
    }

    // Launch matching Visual Novel Scene
    if (ev.sceneId) {
      this.narrative.playScene(ev.sceneId);
    }
  }

  public loadChapter(ch: number): void {
    this.currentChapter = ch;
    this.simulation.currentChapter = ch;

    switch (ch) {
      case 1:
        this.objectives = [
          { id: 'place_solar', text: 'Deploy Solar Array on high sunlit ridge (+20 kW)', completed: false },
          { id: 'connect_cables', text: 'Run Power Cables along surface to connect grid', completed: false },
          { id: 'power_scrubber', text: 'Construct & power CO₂ Scrubber or Hab Module', completed: false },
          { id: 'demand_resupply', text: 'Construct Earth Channel & demand emergency O₂ resupply', completed: false },
        ];
        break;

      case 2:
        this.objectives = [
          { id: 'build_batteries', text: 'Build Battery Banks to store at least 200 kWh energy', completed: false },
          { id: 'power_heater', text: 'Construct Habitat Heating System to prevent freezing', completed: false },
          { id: 'survive_shadow', text: 'Survive the 48-hour mountain shadow eclipse until Sol 9', completed: false },
        ];
        break;

      case 3:
        this.objectives = [
          { id: 'build_shield', text: 'Build Lunar Soil Radiation Shield over base (+40% Shield)', completed: false },
          { id: 'build_vault', text: 'Construct Subterranean Storm Vault bunker', completed: false },
          { id: 'shelter_cme', text: 'Shelter crew in Storm Vault during Sol 10 CME impact', completed: false },
        ];
        break;

      case 4:
        this.objectives = [
          { id: 'build_ice_extractor', text: 'Build Ice Core Extractor in permanent crater shadow', completed: false },
          { id: 'build_farm', text: 'Construct Growth Farm (CSA Hydroponics Unit)', completed: false },
          { id: 'harvest_food', text: 'Tend crops and harvest fresh lunar lettuce (🥗 Harvest)', completed: false },
        ];
        break;

      case 5:
        this.objectives = [
          { id: 'clean_dust', text: 'Clean 90% moonquake dust from solar panels (🧹 Clean)', completed: false },
          { id: 'reconnect_cables', text: 'Reconnect severed power cables to habitat airlock', completed: false },
          { id: 'rescue_leo', text: 'Restore airlock pressure to pull Capt. Leo Ruiz inside alive', completed: false },
        ];
        break;

      case 6: // Epilogue
        this.objectives = [
          { id: 'diploma', text: 'Receive official NASA Artemis Mission Diploma', completed: true },
          { id: 'sandbox', text: 'Creative Sandbox Mode unlocked! Build without constraints', completed: true },
        ];
        break;
    }

    this.renderObjectives();
    eventBus.emit('chapter_loaded', ch);
  }

  private checkBuildingObjectives(b: PlacedBuilding): void {
    if (b.type === 'solar_array') {
      this.checkObjective('place_solar');
    } else if (b.type === 'co2_scrubber' || b.type === 'crew_habitat') {
      this.checkObjective('power_scrubber');
    } else if (b.type === 'earth_channel') {
      this.checkObjective('demand_resupply');
    } else if (b.type === 'battery_bank') {
      const banks = this.simulation.grid.getPlacedBuildings().filter((x) => x.type === 'battery_bank').length;
      if (banks >= 2) this.checkObjective('build_batteries');
    } else if (b.type === 'heating_system') {
      this.checkObjective('power_heater');
    } else if (b.type === 'regolith_shield') {
      this.checkObjective('build_shield');
    } else if (b.type === 'subterranean_vault') {
      this.checkObjective('build_vault');
    } else if (b.type === 'water_extractor') {
      this.checkObjective('build_ice_extractor');
    } else if (b.type === 'hydroponics_tray') {
      this.checkObjective('build_farm');
    }
  }

  private checkSimulationObjectives(state: ResourceState): void {
    if (this.currentChapter === 1) {
      if (state.oxygenKgRemaining >= 95 && this.firedEvents.has('E-RESUPPLY-LANDS')) {
        this.checkObjective('demand_resupply');
      }
    } else if (this.currentChapter === 2) {
      if (state.sol >= 9) {
        this.checkObjective('survive_shadow');
      }
    } else if (this.currentChapter === 3) {
      if (state.isSheltering && state.sol >= 10 && state.timeOfDayHours >= 8) {
        this.checkObjective('shelter_cme');
      }
    } else if (this.currentChapter === 4) {
      if (state.food > 20) {
        this.checkObjective('harvest_food');
      }
    } else if (this.currentChapter === 5) {
      if (state.dust <= 20) {
        this.checkObjective('clean_dust');
      }
      if (this.firedEvents.has('E-RESCUE')) {
        this.checkObjective('rescue_leo');
      }
    }
  }

  public checkObjective(id: string): void {
    const obj = this.objectives.find((o) => o.id === id);
    if (obj && !obj.completed) {
      obj.completed = true;
      this.renderObjectives();
      eventBus.emit('notification', {
        type: 'success',
        message: `Objective Complete: ${obj.text}`,
      });

      this.checkChapterCompletion();
    }
  }

  private checkChapterCompletion(): void {
    const allDone = this.objectives.every((o) => o.completed);
    if (allDone) {
      setTimeout(() => {
        this.triggerChapterDebrief();
      }, 1500);
    }
  }

  private async triggerChapterDebrief(): Promise<void> {
    const debrief = await aiClient.evaluateMission({
      chapter: this.currentChapter,
      sols_completed: this.simulation.state.sol,
      total_kwh_generated: Math.round(this.simulation.state.powerKwGenerated * 24),
      total_o2_produced_kg: Math.round(this.simulation.state.oxygenKgRemaining),
      total_water_recycled_l: Math.round(this.simulation.state.waterLiters),
      radiation_dose_mitigated_pct: Math.round(this.simulation.state.radiationDoseMitigatedPct),
      crew_final_health: Math.round(this.simulation.state.crewHealthAvg),
      crew_final_morale: Math.round(this.simulation.state.crewMoraleAvg),
      anomalies_resolved: this.currentChapter,
    });

    this.debriefModal.show(debrief, () => {
      // Advance to next chapter
      if (this.currentChapter < 6) {
        this.loadChapter(this.currentChapter + 1);
      }
    });
  }

  public renderObjectives(): void {
    const container = document.getElementById('mission-objectives-list');
    if (!container) return;

    container.innerHTML = '';
    this.objectives.forEach((obj) => {
      const li = document.createElement('li');
      li.className = `objective-item ${obj.completed ? 'completed' : 'pending'}`;
      li.innerHTML = `
        <span class="obj-check">${obj.completed ? '✓' : '○'}</span>
        <span class="obj-text">${obj.text}</span>
      `;
      container.appendChild(li);
    });
  }
}
