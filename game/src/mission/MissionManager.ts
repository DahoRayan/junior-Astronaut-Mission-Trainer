import { eventBus } from '../core/EventBus';
import { MissionDebriefRequest, PlacedBuilding, ResourceState } from '../core/types';
import { aiClient } from '../network/AIClient';
import { DebriefModal } from '../ui/DebriefModal';

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export class MissionManager {
  public currentChapter: number = 1;
  public objectives: Objective[] = [];
  private debriefModal: DebriefModal;

  constructor(debriefModal: DebriefModal) {
    this.debriefModal = debriefModal;
    this.loadChapter(1);
    this.bindEvents();
  }

  private bindEvents(): void {
    eventBus.on<PlacedBuilding>('structure_placed', (b) => {
      this.checkBuildingObjectives(b);
    });

    eventBus.on('cable_placed', () => {
      this.checkObjective('connect_cables');
    });

    eventBus.on<ResourceState>('resources_updated', (state) => {
      if (state.oxygenBalanceKgH > 0) {
        this.checkObjective('electrolyzer_powered');
      }
    });
  }

  public loadChapter(ch: number): void {
    this.currentChapter = ch;

    if (ch === 1) {
      this.objectives = [
        { id: 'place_solar', text: 'Deploy a Solar Array on the high sunlit ridge (+20 kW)', completed: false },
        { id: 'connect_cables', text: 'Run Power Cables along the surface to bridge the gap', completed: false },
        { id: 'place_electrolyzer', text: 'Construct an Oxygen Electrolyzer module', completed: false },
        { id: 'electrolyzer_powered', text: 'Verify power delivery to generate breathable air (+15 kg/h O₂)', completed: false },
      ];
    }

    this.renderObjectives();
  }

  private checkBuildingObjectives(b: PlacedBuilding): void {
    if (b.type === 'solar_array') {
      this.checkObjective('place_solar');
    } else if (b.type === 'oxygen_electrolyzer') {
      this.checkObjective('place_electrolyzer');
    }
  }

  private checkObjective(id: string): void {
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
    const req: MissionDebriefRequest = {
      chapter: this.currentChapter,
      sols_completed: 2,
      total_kwh_generated: 280,
      total_o2_produced_kg: 45,
      total_water_recycled_l: 30,
      radiation_dose_mitigated_pct: 85,
      crew_final_health: 100,
      crew_final_morale: 95,
      anomalies_resolved: 1,
    };

    const debrief = await aiClient.evaluateMission(req);
    this.debriefModal.show(debrief, () => {
      // Advance to next chapter
      eventBus.emit('chapter_advanced', this.currentChapter + 1);
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
