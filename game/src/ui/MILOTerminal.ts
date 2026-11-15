import expertDataRaw from '../data/expert_questions.json';
import { eventBus } from '../core/EventBus';
import { GameSnapshot, ResourceState } from '../core/types';

export interface ExpertCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface ExpertQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  source: string;
  source_url: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  related_resource: string | null;
  triggers: string[];
}

export interface ExpertDatabase {
  version: string;
  description?: string;
  categories: ExpertCategory[];
  questions: ExpertQuestion[];
}

export class MILOTerminal {
  private categories: ExpertCategory[] = [];
  private questions: ExpertQuestion[] = [];
  private selectedCategory: string = 'all';
  private searchQuery: string = '';
  private expandedIds: Set<string> = new Set<string>();
  private latestAdvisorMessage: string = 'Welcome to Shackleton Crater Rim! Ask me anything about space survival or search 67 NASA scientific topics below.';

  private lastResourceState: ResourceState | null = null;
  private lastSnapshot: GameSnapshot | null = null;

  // DOM references
  private searchInput: HTMLInputElement | null = null;
  private clearBtn: HTMLButtonElement | null = null;
  private categoriesBar: HTMLElement | null = null;
  private questionsList: HTMLElement | null = null;
  private recommendBar: HTMLElement | null = null;
  private recommendText: HTMLElement | null = null;

  constructor() {
    const db = expertDataRaw as unknown as ExpertDatabase;
    this.categories = db.categories || [];
    this.questions = db.questions || [];

    this.searchInput = document.getElementById('milo-search-input') as HTMLInputElement | null;
    this.clearBtn = document.getElementById('milo-search-clear') as HTMLButtonElement | null;
    this.categoriesBar = document.getElementById('milo-categories-bar');
    this.questionsList = document.getElementById('milo-questions-list');
    this.recommendBar = document.getElementById('milo-recommend-bar');
    this.recommendText = document.getElementById('milo-recommend-text');

    this.bindEvents();
    this.renderCategories();
    this.renderQuestions();
  }

  private bindEvents(): void {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.searchQuery = this.searchInput?.value.trim().toLowerCase() || '';
        if (this.clearBtn) {
          if (this.searchQuery.length > 0) {
            this.clearBtn.classList.remove('hidden');
          } else {
            this.clearBtn.classList.add('hidden');
          }
        }
        this.renderQuestions();
      });

      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // If 1 or more questions shown, expand first result
          const firstCard = this.questionsList?.querySelector<HTMLElement>('.expert-card');
          if (firstCard && firstCard.dataset.qid) {
            this.toggleQuestion(firstCard.dataset.qid);
          }
        }
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        this.searchQuery = '';
        this.clearBtn?.classList.add('hidden');
        this.renderQuestions();
        this.searchInput?.focus();
      });
    }

    // Telemetry updates
    eventBus.on<ResourceState>('resources_updated', (state) => {
      this.lastResourceState = state;
      this.updateRecommendationBar();
    });

    eventBus.on<GameSnapshot>('simulation_tick', (snap) => {
      this.lastSnapshot = snap;
      this.updateRecommendationBar();
    });

    // Alert triggered notification
    eventBus.on<string>('alert_triggered', (alertKey) => {
      this.handleAlertTriggered(alertKey);
    });
  }

  public appendMILOMessage(text: string): HTMLElement {
    this.latestAdvisorMessage = text;
    this.renderQuestions();

    const dummy = document.createElement('div');
    dummy.className = 'chat-bubble milo';
    dummy.textContent = text;
    return dummy;
  }

  private handleAlertTriggered(alertKey: string): void {
    // Match alert key to category
    const key = alertKey.toLowerCase();
    let targetCat: string | null = null;
    if (key.includes('rad') || key.includes('flare') || key.includes('cme') || key.includes('storm')) {
      targetCat = 'radiation';
    } else if (key.includes('o2') || key.includes('oxygen')) {
      targetCat = 'oxygen';
    } else if (key.includes('power') || key.includes('cable') || key.includes('battery')) {
      targetCat = 'power';
    }

    if (targetCat) {
      this.setCategory(targetCat);
    } else {
      this.updateRecommendationBar();
      this.renderQuestions();
    }
  }

  public getActiveTriggers(): Set<string> {
    const triggers = new Set<string>();
    triggers.add('any');
    triggers.add('site_moon'); // Mission is Moon outpost

    const state = this.lastResourceState;
    if (state) {
      // Oxygen triggers
      if (state.oxygen < 15) {
        triggers.add('oxygen_critical');
        triggers.add('oxygen_low');
      } else if (state.oxygen < 30) {
        triggers.add('oxygen_low');
      } else if (state.oxygen <= 60) {
        triggers.add('oxygen_medium');
      }

      // Power triggers
      if (state.power < 15) {
        triggers.add('power_critical');
        triggers.add('power_low');
      } else if (state.power < 30) {
        triggers.add('power_low');
      }

      // Shielding triggers
      const shield = Math.min(state.shield, state.radiationProtection);
      if (shield < 15) {
        triggers.add('shielding_critical');
        triggers.add('shielding_low');
      } else if (shield < 30) {
        triggers.add('shielding_low');
      }

      // Multiple low
      let lowCount = 0;
      if (state.oxygen < 30) lowCount++;
      if (state.power < 30) lowCount++;
      if (shield < 30) lowCount++;
      if (state.water < 30) lowCount++;
      if (state.food < 30) lowCount++;
      if (lowCount >= 2) triggers.add('multiple_low');

      // Alerts
      const alert = (state.activeAlert || '').toLowerCase();
      if (alert.includes('flare')) triggers.add('event_solar_flare');
      if (alert.includes('cme')) triggers.add('event_cme');
      if (alert.includes('dust')) triggers.add('event_dust_storm');
      if (alert.includes('fault') || alert.includes('equipment')) triggers.add('event_equipment_fault');
      if (alert.includes('comms') || alert.includes('delay')) triggers.add('event_comms_delay');
    }

    if (this.lastSnapshot) {
      if (this.lastSnapshot.active_alert) {
        const a = this.lastSnapshot.active_alert.toLowerCase();
        if (a.includes('flare')) triggers.add('event_solar_flare');
        if (a.includes('cme')) triggers.add('event_cme');
        if (a.includes('dust')) triggers.add('event_dust_storm');
      }
    }

    return triggers;
  }

  private isQuestionRecommended(q: ExpertQuestion, activeTriggers: Set<string>): boolean {
    return q.triggers.some((t) => t !== 'any' && t !== 'site_moon' && activeTriggers.has(t));
  }

  private updateRecommendationBar(): void {
    if (!this.recommendBar || !this.recommendText) return;

    const activeTriggers = this.getActiveTriggers();
    const recommended = this.questions.filter((q) => this.isQuestionRecommended(q, activeTriggers));

    if (recommended.length > 0) {
      this.recommendBar.classList.remove('hidden');
      this.recommendText.textContent = `${recommended.length} topic${recommended.length > 1 ? 's' : ''} recommended for your base right now`;
    } else {
      this.recommendBar.classList.add('hidden');
    }
  }

  public setCategory(catId: string): void {
    this.selectedCategory = catId;
    this.renderCategories();
    this.renderQuestions();
  }

  private renderCategories(): void {
    const bar = this.categoriesBar;
    if (!bar) return;
    bar.innerHTML = '';

    // 'All' button
    const allBtn = document.createElement('button');
    allBtn.className = `milo-cat-btn ${this.selectedCategory === 'all' ? 'active' : ''}`;
    allBtn.innerHTML = `<span>🌟 All</span> <span>(${this.questions.length})</span>`;
    allBtn.addEventListener('click', () => this.setCategory('all'));
    bar.appendChild(allBtn);

    // Each defined category
    this.categories.forEach((cat) => {
      const count = this.questions.filter((q) => q.category === cat.id).length;
      if (count === 0) return;

      const btn = document.createElement('button');
      btn.className = `milo-cat-btn ${this.selectedCategory === cat.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${cat.label}</span> <span>(${count})</span>`;
      btn.title = cat.description;
      btn.addEventListener('click', () => this.setCategory(cat.id));
      bar.appendChild(btn);
    });
  }

  public renderQuestions(): void {
    const list = this.questionsList;
    if (!list) return;
    list.innerHTML = '';

    // 1. Live M.I.L.O. speech card
    if (this.latestAdvisorMessage) {
      const advisorCard = document.createElement('div');
      advisorCard.className = 'milo-advisor-card';
      advisorCard.innerHTML = `
        <div class="milo-advisor-header">
          <span class="milo-avatar">🤖</span>
          <strong>M.I.L.O. Live Advisor</strong>
        </div>
        <div class="milo-advisor-text">${this.latestAdvisorMessage}</div>
      `;
      list.appendChild(advisorCard);
    }

    const activeTriggers = this.getActiveTriggers();

    // 2. Filter questions
    let filtered = this.questions.filter((q) => {
      // Category filter
      if (this.selectedCategory !== 'all' && q.category !== this.selectedCategory) {
        return false;
      }
      // Search query filter
      if (this.searchQuery) {
        const query = this.searchQuery;
        const inQuestion = q.question.toLowerCase().includes(query);
        const inAnswer = q.answer.toLowerCase().includes(query);
        const inTags = q.tags.some((t) => t.toLowerCase().includes(query));
        const inSource = q.source.toLowerCase().includes(query);
        return inQuestion || inAnswer || inTags || inSource;
      }
      return true;
    });

    // 3. Sort: Recommended first, then keep list stable
    filtered.sort((a, b) => {
      const aRec = this.isQuestionRecommended(a, activeTriggers) ? 1 : 0;
      const bRec = this.isQuestionRecommended(b, activeTriggers) ? 1 : 0;
      return bRec - aRec;
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'expert-empty';
      empty.style.textAlign = 'center';
      empty.style.padding = '30px 15px';
      empty.style.color = '#94a3b8';
      empty.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 8px;">🛰️</div>
        <div style="font-weight: 700; color: #e2e8f0;">No matching NASA topics found</div>
        <div style="font-size: 0.72rem; margin-top: 4px;">Try searching for "solar", "oxygen", "radiation", or select "All".</div>
      `;
      list.appendChild(empty);
      return;
    }

    filtered.forEach((q) => {
      const isRec = this.isQuestionRecommended(q, activeTriggers);
      const card = this.createQuestionCard(q, isRec);
      list.appendChild(card);
    });
  }

  private toggleQuestion(qid: string): void {
    if (this.expandedIds.has(qid)) {
      this.expandedIds.delete(qid);
    } else {
      this.expandedIds.add(qid);
    }
    this.renderQuestions();
  }

  private createQuestionCard(q: ExpertQuestion, isRecommended: boolean): HTMLElement {
    const card = document.createElement('div');
    const isOpen = this.expandedIds.has(q.id);
    card.className = `expert-card ${isRecommended ? 'recommended' : ''} ${isOpen ? 'open' : ''}`;
    card.dataset.qid = q.id;

    // Category label lookup
    const catDef = this.categories.find((c) => c.id === q.category);
    const catLabel = catDef ? catDef.label.split(' ')[0] : '🚀';

    // Difficulty badge
    const diffClass = `badge-diff-${q.difficulty}`;
    const diffLabel = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);

    // Header
    const header = document.createElement('div');
    header.className = 'expert-card-header';
    header.innerHTML = `
      <div class="expert-badge-row">
        ${isRecommended ? '<span class="expert-badge badge-recommended">⭐ Recommended</span>' : ''}
        <span class="expert-badge badge-category">${catLabel}</span>
        <span class="expert-badge ${diffClass}">${diffLabel}</span>
        ${q.related_resource ? `<span class="expert-badge" style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1;">${q.related_resource.toUpperCase()}</span>` : ''}
      </div>
      <div class="expert-question-title-row">
        <span class="expert-question-text">${q.question}</span>
        <span class="expert-expand-arrow">▼</span>
      </div>
    `;

    header.addEventListener('click', () => {
      this.toggleQuestion(q.id);
    });
    card.appendChild(header);

    // Body (if open)
    if (isOpen) {
      const body = document.createElement('div');
      body.className = 'expert-card-body';

      // Split answer into paragraphs
      const paragraphs = q.answer
        .split('\n\n')
        .filter((p) => p.trim().length > 0)
        .map((p) => `<p>${p.trim()}</p>`)
        .join('');

      body.innerHTML = `
        <div class="expert-answer">${paragraphs}</div>
        <div class="expert-science-corner">
          <span class="science-corner-label">🔬 SCIENCE CORNER — NASA DATA SOURCE</span>
          <span class="science-corner-source">Source: <strong>${q.source}</strong></span>
          ${q.source_url ? `<a href="${q.source_url}" target="_blank" rel="noopener noreferrer" class="science-corner-link">🔗 Read official NASA research ↗</a>` : ''}
        </div>
      `;
      card.appendChild(body);
    }

    return card;
  }
}
