import { BUILDING_DEFINITIONS } from '../core/Constants';
import { eventBus } from '../core/EventBus';
import { BuildingType } from '../core/types';

export class CatalogPanel {
  private activeSelection: BuildingType | null = null;
  private isDemolishActive: boolean = false;

  constructor() {
    this.render();
  }

  private render(): void {
    const container = document.getElementById('catalog-content');
    if (!container) return;

    container.innerHTML = '';

    // Group buildings by category matching Equipment Specification
    const categories: Record<string, BuildingType[]> = {
      'Energy': ['solar_array', 'battery_bank', 'kilopower_reactor'],
      'Life Support': ['emergency_o2_generator', 'oxygen_electrolyzer', 'co2_scrubber', 'water_recycler', 'crew_habitat'],
      'Thermal & Defense': ['heating_system', 'regolith_shield', 'subterranean_vault'],
      'Food & Resources': ['hydroponics_tray', 'water_extractor'],
      'Communications': ['earth_channel'],
      'Network': ['power_cable'],
    };

    Object.entries(categories).forEach(([categoryName, types]) => {
      const catSection = document.createElement('div');
      catSection.className = 'catalog-category';

      const catTitle = document.createElement('h4');
      catTitle.className = 'catalog-category-title';
      catTitle.textContent = categoryName;
      catSection.appendChild(catTitle);

      const grid = document.createElement('div');
      grid.className = 'catalog-items-grid';

      types.forEach((type) => {
        const def = BUILDING_DEFINITIONS[type];
        const itemBtn = document.createElement('button');
        itemBtn.className = 'catalog-item-btn';
        itemBtn.dataset.type = type;

        const badges: string[] = [];
        if (def.powerGenerationKw > 0) badges.push(`<span class="spec-tag badge-prod">+${def.powerGenerationKw} kW ⚡</span>`);
        if (def.powerConsumptionKw > 0) badges.push(`<span class="spec-tag badge-cons">-${def.powerConsumptionKw} kW ⚡</span>`);
        if (def.oxygenProductionKgH > 0) badges.push(`<span class="spec-tag badge-prod">+${def.oxygenProductionKgH} kg/h 🫁</span>`);
        if (def.waterConsumptionL > 0) badges.push(`<span class="spec-tag badge-cons">-${def.waterConsumptionL} L 💧</span>`);
        if (def.waterProductionL > 0) badges.push(`<span class="spec-tag badge-prod">+${def.waterProductionL} L 💧</span>`);
        if (def.shieldingBonusPct > 0) badges.push(`<span class="spec-tag badge-spec">+${def.shieldingBonusPct}% 🛡️</span>`);
        if (def.batteryCapacityKwh > 0) badges.push(`<span class="spec-tag badge-spec">${def.batteryCapacityKwh} kWh 🔋</span>`);
        if (def.priority) badges.push(`<span class="spec-tag badge-spec">P${def.priority}</span>`);

        itemBtn.innerHTML = `
          <div class="item-header">
            <span class="item-name">${def.name}</span>
            <span class="item-cost">🧱 ${def.buildCost} Mat</span>
          </div>
          <div class="item-impact">${def.description}</div>
          ${badges.length > 0 ? `<div class="item-badges">${badges.join('')}</div>` : ''}
        `;

        itemBtn.addEventListener('click', () => {
          this.selectBuilding(type, itemBtn);
        });

        grid.appendChild(itemBtn);
      });

      catSection.appendChild(grid);
      container.appendChild(catSection);
    });

    // Demolish button
    const demolishBtn = document.getElementById('btn-demolish');
    if (demolishBtn) {
      demolishBtn.addEventListener('click', () => {
        this.toggleDemolish();
      });
    }
  }

  private selectBuilding(type: BuildingType, btn: HTMLElement): void {
    this.isDemolishActive = false;
    this.updateDemolishButton();

    if (this.activeSelection === type) {
      this.clearSelection();
      return;
    }

    this.clearSelection();
    this.activeSelection = type;
    btn.classList.add('selected');
    eventBus.emit('building_selected', type);
  }

  public clearSelection(): void {
    this.activeSelection = null;
    document.querySelectorAll('.catalog-item-btn').forEach((b) => b.classList.remove('selected'));
    eventBus.emit('building_selected', null);
  }

  public highlightTool(type: BuildingType | null): void {
    const buttons = document.querySelectorAll<HTMLElement>('.catalog-item-btn');
    let highlightedBtn: HTMLElement | null = null;

    buttons.forEach((btn) => {
      btn.classList.remove('tutorial-highlight');
      btn.classList.remove('tutorial-dimmed');
      if (type) {
        if (btn.dataset.type === type) {
          btn.classList.add('tutorial-highlight');
          highlightedBtn = btn;
        } else {
          btn.classList.add('tutorial-dimmed');
        }
      }
    });

    // Auto-scroll to the highlighted item so the kid sees it immediately
    if (highlightedBtn) {
      setTimeout(() => {
        highlightedBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }

    const demolishBtn = document.getElementById('btn-demolish');
    if (demolishBtn) {
      if (type) {
        demolishBtn.classList.add('tutorial-dimmed');
      } else {
        demolishBtn.classList.remove('tutorial-dimmed');
      }
    }
  }

  private toggleDemolish(): void {
    this.clearSelection();
    this.isDemolishActive = !this.isDemolishActive;
    this.updateDemolishButton();
    eventBus.emit('demolish_toggled', this.isDemolishActive);
  }

  private updateDemolishButton(): void {
    const btn = document.getElementById('btn-demolish');
    if (btn) {
      if (this.isDemolishActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }
}
