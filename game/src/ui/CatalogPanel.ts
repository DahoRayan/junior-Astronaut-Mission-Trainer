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

    // Group buildings by category
    const categories: Record<string, BuildingType[]> = {
      'Energy': ['solar_array', 'battery_bank', 'kilopower_reactor'],
      'Life Support': ['oxygen_electrolyzer', 'co2_scrubber', 'crew_habitat'],
      'Defense': ['regolith_shield', 'subterranean_vault'],
      'Food & Water': ['hydroponics_tray', 'water_extractor'],
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

        itemBtn.innerHTML = `
          <div class="item-header">
            <span class="item-name">${def.name}</span>
            <span class="item-cost">⚡ ${def.buildCost} Mat</span>
          </div>
          <div class="item-impact">${def.description}</div>
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
