import { eventBus } from '../core/EventBus';
import { BuildingType } from '../core/types';

export enum TutorialStep {
  SELECT_SOLAR = 'SELECT_SOLAR',
  PLACE_SOLAR_1 = 'PLACE_SOLAR_1',
  PLACE_SOLAR_2 = 'PLACE_SOLAR_2',
  SELECT_CABLE = 'SELECT_CABLE',
  PLACE_CABLE_BETWEEN = 'PLACE_CABLE_BETWEEN',
  COMPLETE = 'COMPLETE',
}

export interface TutorialTarget {
  x: number;
  y: number;
  label: string;
  type: BuildingType;
}

export class TutorialManager {
  public currentStep: TutorialStep = TutorialStep.SELECT_SOLAR;
  public isActive: boolean = true;

  // The canonical tutorial coordinates on the sunlit rim
  public readonly SPOT_1: TutorialTarget = { x: 10, y: 7, label: '⚡ SPOT 1: SOLAR ARRAY', type: 'solar_array' };
  public readonly SPOT_2: TutorialTarget = { x: 12, y: 7, label: '⚡ SPOT 2: SOLAR ARRAY', type: 'solar_array' };
  public readonly SPOT_CABLE: TutorialTarget = { x: 11, y: 7, label: '🔌 CABLE: CONNECT GRID', type: 'power_cable' };

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    // Listen for tool selections in catalog
    eventBus.on<BuildingType | null>('building_selected', (type) => {
      if (!this.isActive) return;

      if (this.currentStep === TutorialStep.SELECT_SOLAR && type === 'solar_array') {
        this.currentStep = TutorialStep.PLACE_SOLAR_1;
        eventBus.emit('tutorial_step_changed', this.currentStep);
      } else if (this.currentStep === TutorialStep.SELECT_CABLE && type === 'power_cable') {
        this.currentStep = TutorialStep.PLACE_CABLE_BETWEEN;
        eventBus.emit('tutorial_step_changed', this.currentStep);
      }
    });

    // Listen for structure placements
    eventBus.on<{ type: string; x: number; y: number }>('structure_placed', (b) => {
      if (!this.isActive) return;

      if (this.currentStep === TutorialStep.PLACE_SOLAR_1 && b.x === this.SPOT_1.x && b.y === this.SPOT_1.y) {
        this.currentStep = TutorialStep.PLACE_SOLAR_2;
        eventBus.emit('tutorial_step_changed', this.currentStep);
      } else if (this.currentStep === TutorialStep.PLACE_SOLAR_2 && b.x === this.SPOT_2.x && b.y === this.SPOT_2.y) {
        this.currentStep = TutorialStep.SELECT_CABLE;
        // Clear active selection so player is prompted to click the cable button
        eventBus.emit('building_selected', null);
        eventBus.emit('tutorial_step_changed', this.currentStep);
      }
    });

    // Listen for cable placements
    eventBus.on('cable_placed', () => {
      if (!this.isActive) return;

      if (this.currentStep === TutorialStep.PLACE_CABLE_BETWEEN) {
        this.currentStep = TutorialStep.COMPLETE;
        this.isActive = false;
        eventBus.emit('tutorial_step_changed', this.currentStep);
        eventBus.emit('tutorial_power_complete', null);
      }
    });
  }

  /**
   * Returns true if placement on (x, y) with given building type is allowed during this phase
   */
  public isTileAllowed(x: number, y: number, type: BuildingType): boolean {
    if (!this.isActive) return true;

    if (this.currentStep === TutorialStep.PLACE_SOLAR_1) {
      return x === this.SPOT_1.x && y === this.SPOT_1.y && type === 'solar_array';
    }
    if (this.currentStep === TutorialStep.PLACE_SOLAR_2) {
      return x === this.SPOT_2.x && y === this.SPOT_2.y && type === 'solar_array';
    }
    if (this.currentStep === TutorialStep.PLACE_CABLE_BETWEEN) {
      return x === this.SPOT_CABLE.x && y === this.SPOT_CABLE.y && type === 'power_cable';
    }

    return false;
  }

  /**
   * Returns the currently highlighted target on the moon, or null if none
   */
  public getActiveMoonTarget(): TutorialTarget | null {
    if (!this.isActive) return null;

    if (this.currentStep === TutorialStep.PLACE_SOLAR_1) return this.SPOT_1;
    if (this.currentStep === TutorialStep.PLACE_SOLAR_2) return this.SPOT_2;
    if (this.currentStep === TutorialStep.PLACE_CABLE_BETWEEN) return this.SPOT_CABLE;

    return null;
  }

  /**
   * Returns which catalog button should be highlighted, or null
   */
  public getHighlightedTool(): BuildingType | null {
    if (!this.isActive) return null;

    if (this.currentStep === TutorialStep.SELECT_SOLAR || this.currentStep === TutorialStep.PLACE_SOLAR_1 || this.currentStep === TutorialStep.PLACE_SOLAR_2) {
      return 'solar_array';
    }
    if (this.currentStep === TutorialStep.SELECT_CABLE || this.currentStep === TutorialStep.PLACE_CABLE_BETWEEN) {
      return 'power_cable';
    }

    return null;
  }

  public getInstructionText(): string {
    switch (this.currentStep) {
      case TutorialStep.SELECT_SOLAR:
        return 'Step 1: Select the glowing [Solar Array] button in the Catalog.';
      case TutorialStep.PLACE_SOLAR_1:
        return 'Step 2: Place Solar Array #1 on the glowing beacon on the Moon.';
      case TutorialStep.PLACE_SOLAR_2:
        return 'Step 3: Place Solar Array #2 on the second glowing beacon on the Moon.';
      case TutorialStep.SELECT_CABLE:
        return 'Step 4: Select the glowing [Power Cable] tool in the Catalog.';
      case TutorialStep.PLACE_CABLE_BETWEEN:
        return 'Step 5: Place the Cable between both solar panels to connect the Habitat!';
      default:
        return 'Power Grid Established!';
    }
  }
}
