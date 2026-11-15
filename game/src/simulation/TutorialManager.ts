import { eventBus } from '../core/EventBus';
import { BuildingType } from '../core/types';
import { Grid } from './Grid';

export enum TutorialStep {
  SOLAR_ARRAY = 'SOLAR_ARRAY',
  BATTERY_BANK = 'BATTERY_BANK',
  POWER_CABLE = 'POWER_CABLE',
  CREW_HABITAT = 'CREW_HABITAT',
  LIFE_SUPPORT = 'LIFE_SUPPORT',
  HEATING_SYSTEM = 'HEATING_SYSTEM',
  COMPLETE = 'COMPLETE',
}

export interface TutorialTarget {
  x: number;
  y: number;
  label: string;
  type: BuildingType;
}

export interface MilestoneInfo {
  step: TutorialStep;
  title: string;
  tag: string;
  instruction: string;
  miloTip: string;
  target: TutorialTarget | null;
  tool: BuildingType | null;
  completed: boolean;
  current: boolean;
}

export class TutorialManager {
  public currentStep: TutorialStep = TutorialStep.SOLAR_ARRAY;
  public isActive: boolean = true;

  // Recommended blueprint layout coordinates on the lunar surface
  // Symmetrically aligned compact survival outpost (T-junction power spine & living wing)
  public readonly SPOT_SOLAR: TutorialTarget = {
    x: 9,
    y: 4,
    label: '⚡ STEP 1: SOLAR ARRAY (HARVEST SUN)',
    type: 'solar_array',
  };

  public readonly SPOT_BATTERY: TutorialTarget = {
    x: 9,
    y: 6,
    label: '🔋 STEP 2: BATTERY BANK (NIGHT STORAGE)',
    type: 'battery_bank',
  };

  public readonly SPOT_CABLE: TutorialTarget = {
    x: 9,
    y: 5,
    label: '🔌 STEP 3: POWER CABLE (CONDUIT)',
    type: 'power_cable',
  };

  public readonly SPOT_HABITAT: TutorialTarget = {
    x: 9,
    y: 7,
    label: '🏠 STEP 4: CREW HABITAT (LIVING QUARTERS)',
    type: 'crew_habitat',
  };

  public readonly SPOT_LIFE_SUPPORT: TutorialTarget = {
    x: 8,
    y: 7,
    label: '🫁 STEP 5: O2 ELECTROLYZER (LIFE SUPPORT)',
    type: 'oxygen_electrolyzer',
  };

  public readonly SPOT_HEATING: TutorialTarget = {
    x: 10,
    y: 7,
    label: '🔥 STEP 6: HEATER (-180°C NIGHT DEFENSE)',
    type: 'heating_system',
  };

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    // Structure and cable placement tracking are driven via evaluateGrid()
  }

  /**
   * Evaluates the current grid state and advances/updates the active guided tutorial step.
   */
  public evaluateGrid(grid: Grid): TutorialStep {
    const buildings = grid.getPlacedBuildings();
    const hasSolar = buildings.some((b) => b.type === 'solar_array');
    const hasBattery = buildings.some((b) => b.type === 'battery_bank');
    const hasCable = grid.tiles.some((row) => row.some((t) => t.hasCable));
    const hasHabitat = buildings.some((b) => b.type === 'crew_habitat');
    const hasLifeSupport = buildings.some((b) => b.type === 'oxygen_electrolyzer' || b.type === 'co2_scrubber');
    const hasHeating = buildings.some((b) => b.type === 'heating_system');

    let nextStep: TutorialStep;

    if (!hasSolar) {
      nextStep = TutorialStep.SOLAR_ARRAY;
    } else if (!hasBattery) {
      nextStep = TutorialStep.BATTERY_BANK;
    } else if (!hasCable) {
      nextStep = TutorialStep.POWER_CABLE;
    } else if (!hasHabitat) {
      nextStep = TutorialStep.CREW_HABITAT;
    } else if (!hasLifeSupport) {
      nextStep = TutorialStep.LIFE_SUPPORT;
    } else if (!hasHeating) {
      nextStep = TutorialStep.HEATING_SYSTEM;
    } else {
      nextStep = TutorialStep.COMPLETE;
    }

    if (nextStep !== this.currentStep) {
      this.currentStep = nextStep;
      eventBus.emit('tutorial_step_changed', this.currentStep);
    }

    return this.currentStep;
  }

  /**
   * Resets the tutorial state to Step 1.
   */
  public reset(): void {
    this.currentStep = TutorialStep.SOLAR_ARRAY;
    this.isActive = true;
    eventBus.emit('tutorial_step_changed', this.currentStep);
  }

  /**
   * Returns true if placement is allowed.
   * In freeform "build my own base", player is free to place on any valid tile,
   * while the beacon and highlights suggest the optimal architectural placement.
   */
  public isTileAllowed(_x: number, _y: number, _type: BuildingType): boolean {
    return true;
  }

  /**
   * Returns the active holographic beacon target on the moon.
   */
  public getActiveMoonTarget(grid?: Grid): TutorialTarget | null {
    if (!this.isActive) return null;

    let target: TutorialTarget | null = null;
    switch (this.currentStep) {
      case TutorialStep.SOLAR_ARRAY:
        target = this.SPOT_SOLAR;
        break;
      case TutorialStep.BATTERY_BANK:
        target = this.SPOT_BATTERY;
        break;
      case TutorialStep.POWER_CABLE:
        target = this.SPOT_CABLE;
        break;
      case TutorialStep.CREW_HABITAT:
        target = this.SPOT_HABITAT;
        break;
      case TutorialStep.LIFE_SUPPORT:
        target = this.SPOT_LIFE_SUPPORT;
        break;
      case TutorialStep.HEATING_SYSTEM:
        target = this.SPOT_HEATING;
        break;
      default:
        return null;
    }

    if (grid && target) {
      const tile = grid.getTile(target.x, target.y);
      const isOccupied = target.type === 'power_cable'
        ? !!tile?.hasCable
        : (!!tile?.building && tile.building.type !== target.type);

      // If the target tile is already occupied by a different structure, find an adjacent vacant tile
      if (isOccupied) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const adj = grid.getTile(target.x + dx, target.y + dy);
            if (adj) {
              const adjOccupied = target.type === 'power_cable' ? adj.hasCable : !!adj.building;
              if (!adjOccupied) {
                return { ...target, x: target.x + dx, y: target.y + dy };
              }
            }
          }
        }
      }
    }

    return target;
  }

  /**
   * Returns the catalog tool type that should pulse with guided highlight.
   */
  public getHighlightedTool(): BuildingType | null {
    if (!this.isActive) return null;

    switch (this.currentStep) {
      case TutorialStep.SOLAR_ARRAY:
        return 'solar_array';
      case TutorialStep.BATTERY_BANK:
        return 'battery_bank';
      case TutorialStep.POWER_CABLE:
        return 'power_cable';
      case TutorialStep.CREW_HABITAT:
        return 'crew_habitat';
      case TutorialStep.LIFE_SUPPORT:
        return 'oxygen_electrolyzer';
      case TutorialStep.HEATING_SYSTEM:
        return 'heating_system';
      default:
        return null;
    }
  }

  public getStepTag(): string {
    switch (this.currentStep) {
      case TutorialStep.SOLAR_ARRAY:
        return 'STEP 1 OF 6 • HARVEST SOLAR POWER';
      case TutorialStep.BATTERY_BANK:
        return 'STEP 2 OF 6 • NIGHT ENERGY STORAGE';
      case TutorialStep.POWER_CABLE:
        return 'STEP 3 OF 6 • LINK POWER GRID';
      case TutorialStep.CREW_HABITAT:
        return 'STEP 4 OF 6 • CREW LIVING QUARTERS';
      case TutorialStep.LIFE_SUPPORT:
        return 'STEP 5 OF 6 • LIFE SUPPORT & AIR';
      case TutorialStep.HEATING_SYSTEM:
        return 'STEP 6 OF 6 • THERMAL CONTROL';
      case TutorialStep.COMPLETE:
        return 'MISSION ACCOMPLISHED • BASE ESTABLISHED';
      default:
        return 'BASE BUILDING GUIDE';
    }
  }

  public getInstructionText(): string {
    switch (this.currentStep) {
      case TutorialStep.SOLAR_ARRAY:
        return 'Place a Solar Array on the sunlit ridge to harvest energy during the 15-day Moon Day.';
      case TutorialStep.BATTERY_BANK:
        return 'Place a Battery Bank to store power. The lunar night lasts 15 Earth days of total darkness!';
      case TutorialStep.POWER_CABLE:
        return 'Lay Power Cable to link your Solar Array and Battery Bank into a shared grid.';
      case TutorialStep.CREW_HABITAT:
        return 'Deploy a Crew Habitat to provide safe pressurized living quarters for the astronauts.';
      case TutorialStep.LIFE_SUPPORT:
        return 'Install an Oxygen Electrolyzer (or CO₂ Scrubber) to maintain breathable air.';
      case TutorialStep.HEATING_SYSTEM:
        return 'Install a Heating System to prevent freezing during the -180°C 15-day lunar night.';
      case TutorialStep.COMPLETE:
        return '🎉 Outpost Operational! All critical systems are established to survive both the 15-day daylight and 15-day night. Expand freely!';
      default:
        return 'Follow the glowing highlights to establish your lunar base step-by-step.';
    }
  }

  public getMiloTip(): string {
    switch (this.currentStep) {
      case TutorialStep.SOLAR_ARRAY:
        return 'M.I.L.O. advisor: A Moon Day consists of 30 Earth days — 15 Earth days of continuous sunlight followed by 15 Earth days of darkness. Place a Solar Array on the sunlit ridge to harvest energy while the Sun is up!';
      case TutorialStep.BATTERY_BANK:
        return 'M.I.L.O. advisor: Outstanding! Now deploy a Battery Bank. During the 15-day lunar night, solar panels produce 0 kW. Without battery storage, all life support and heaters will shut down in the cold!';
      case TutorialStep.POWER_CABLE:
        return 'M.I.L.O. advisor: Lay Power Cable between the Solar Array and Battery Bank. Power conduits distribute harvested electricity into storage and base life support!';
      case TutorialStep.CREW_HABITAT:
        return 'M.I.L.O. advisor: Deploy the central Crew Habitat living quarters! This gives our astronauts an inflatable, multi-layer pressurized haven against the hard vacuum.';
      case TutorialStep.LIFE_SUPPORT:
        return 'M.I.L.O. advisor: Deploy an Oxygen Electrolyzer! Crew members consume 0.84 kg of oxygen every Earth day. Electrolyzers split water into pure breathable O₂.';
      case TutorialStep.HEATING_SYSTEM:
        return 'M.I.L.O. advisor: During the 15-day lunar night, temperatures plummet to -180°C! Install a Heating System so habitat loops and electronics do not freeze solid.';
      case TutorialStep.COMPLETE:
        return 'M.I.L.O. advisor: Base establishment mission successful! Your outpost is powered, heated, and oxygenated to endure both the 15-day daytime and 15-day night of the Moon. Great job, Commander!';
      default:
        return '';
    }
  }

  /**
   * Returns list of all 6 milestones with completion status for UI rendering.
   */
  public getAllMilestones(grid?: Grid): MilestoneInfo[] {
    const buildings = grid ? grid.getPlacedBuildings() : [];
    const hasSolar = buildings.some((b) => b.type === 'solar_array');
    const hasBattery = buildings.some((b) => b.type === 'battery_bank');
    const hasCable = grid ? grid.tiles.some((row) => row.some((t) => t.hasCable)) : false;
    const hasHabitat = buildings.some((b) => b.type === 'crew_habitat');
    const hasLifeSupport = buildings.some((b) => b.type === 'oxygen_electrolyzer' || b.type === 'co2_scrubber');
    const hasHeating = buildings.some((b) => b.type === 'heating_system');

    return [
      {
        step: TutorialStep.SOLAR_ARRAY,
        title: '1. Harvest Solar Power (Solar Array on sunlit ridge)',
        tag: 'STEP 1 OF 6',
        instruction: 'Place a Solar Array on the sunlit ridge to harvest energy during the 15-day Moon Day.',
        miloTip: 'Solar arrays capture power during the 15-day lunar sunlight phase.',
        target: this.SPOT_SOLAR,
        tool: 'solar_array',
        completed: hasSolar,
        current: this.currentStep === TutorialStep.SOLAR_ARRAY,
      },
      {
        step: TutorialStep.BATTERY_BANK,
        title: '2. Night Power Storage (Battery Bank for 15-day night)',
        tag: 'STEP 2 OF 6',
        instruction: 'Place a Battery Bank to store power for the 15-day lunar night.',
        miloTip: 'Batteries store energy to power the outpost through the 15-day darkness.',
        target: this.SPOT_BATTERY,
        tool: 'battery_bank',
        completed: hasBattery,
        current: this.currentStep === TutorialStep.BATTERY_BANK,
      },
      {
        step: TutorialStep.POWER_CABLE,
        title: '3. Grid Conduits (Link Solar & Battery with Power Cable)',
        tag: 'STEP 3 OF 6',
        instruction: 'Lay Power Cables to connect your Solar Array and Battery Bank.',
        miloTip: 'Cables distribute generated electricity to batteries and life support modules.',
        target: this.SPOT_CABLE,
        tool: 'power_cable',
        completed: hasCable,
        current: this.currentStep === TutorialStep.POWER_CABLE,
      },
      {
        step: TutorialStep.CREW_HABITAT,
        title: '4. Crew Quarters (Deploy Crew Habitat living module)',
        tag: 'STEP 4 OF 6',
        instruction: 'Deploy Crew Habitat to establish pressurized living quarters for astronauts.',
        miloTip: 'Provides pressurized quarters and radiation shielding for astronauts.',
        target: this.SPOT_HABITAT,
        tool: 'crew_habitat',
        completed: hasHabitat,
        current: this.currentStep === TutorialStep.CREW_HABITAT,
      },
      {
        step: TutorialStep.LIFE_SUPPORT,
        title: '5. Life Support (Deploy Oxygen Electrolyzer & Scrubber)',
        tag: 'STEP 5 OF 6',
        instruction: 'Install an Oxygen Electrolyzer to produce breathable air.',
        miloTip: 'Generates breathable oxygen from water and scrubs carbon dioxide.',
        target: this.SPOT_LIFE_SUPPORT,
        tool: 'oxygen_electrolyzer',
        completed: hasLifeSupport,
        current: this.currentStep === TutorialStep.LIFE_SUPPORT,
      },
      {
        step: TutorialStep.HEATING_SYSTEM,
        title: '6. Thermal Control (Heating System for -180°C Lunar Night)',
        tag: 'STEP 6 OF 6',
        instruction: 'Install Heating System to prevent freezing during the 15-day lunar night (-180°C).',
        miloTip: 'Maintains 21°C inside the habitat against the extreme vacuum deep freeze.',
        target: this.SPOT_HEATING,
        tool: 'heating_system',
        completed: hasHeating,
        current: this.currentStep === TutorialStep.HEATING_SYSTEM,
      },
    ];
  }
}
