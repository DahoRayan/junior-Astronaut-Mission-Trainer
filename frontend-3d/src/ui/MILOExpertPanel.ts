import { EXPERT_DATA } from '../data/expertQuestionsData';
import { EXPERT_README_TEXT } from '../data/expertReadme';
import { soundSystem } from '../audio/SoundSystem';

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

export interface MILOSimulationStateProvider {
  oxygenPct?: number;
  powerKwh?: number;
  storedO2?: number;
  radiationLevel?: number;
  shieldingPct?: number;
  temperatureC?: number;
  materials?: number;
}

export class MILOExpertPanel {
  public readonly panelEl: HTMLElement;
  public readonly pillEl: HTMLElement;

  private categories: ExpertCategory[] = [];
  private questions: ExpertQuestion[] = [];
  private selectedCategory: string = 'all';
  private searchQuery: string = '';
  private expandedIds: Set<string> = new Set<string>();
  private activeTab: 'questions' | 'readme' = 'questions';
  public getActiveTab(): 'questions' | 'readme' {
    return this.activeTab;
  }

  private isPanelOpen: boolean = true;
  private isMinimized: boolean = false;
  private cachedMessage: string = 'Commander! Explore all 67 NASA science topics or ask me anything!';

  // DOM Elements
  private speechTextEl: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private clearSearchBtn: HTMLButtonElement | null = null;
  private questionsContainer: HTMLElement | null = null;
  private categoriesBar: HTMLElement | null = null;
  private readmeContainer: HTMLElement | null = null;
  private tabQuestionsBtn: HTMLButtonElement | null = null;
  private tabReadmeBtn: HTMLButtonElement | null = null;
  private countBadgeEl: HTMLElement | null = null;

  private stateProvider?: () => MILOSimulationStateProvider;
  private onStateChangeCallback?: (isOpen: boolean) => void;

  constructor(
    private readonly container: HTMLElement,
    stateProvider?: () => MILOSimulationStateProvider,
    onStateChange?: (isOpen: boolean) => void
  ) {
    this.stateProvider = stateProvider;
    this.onStateChangeCallback = onStateChange;

    const db = EXPERT_DATA as unknown as ExpertDatabase;
    this.categories = db.categories || [];
    this.questions = db.questions || [];

    // Create Main Panel Element anchored at bottom-right
    this.panelEl = document.createElement('div');
    this.panelEl.id = 'hud-milo-panel';
    this.panelEl.style.cssText = `
      position: absolute; bottom: 12px; right: 14px;
      width: 380px; max-width: calc(100vw - 28px);
      height: 520px; max-height: calc(100vh - 120px);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 30, 50, 0.96) 100%);
      border: 2.5px solid #38bdf8;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.35);
      backdrop-filter: blur(14px);
      display: flex; flex-direction: column;
      z-index: 45;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      user-select: none;
      box-sizing: border-box;
      overflow: hidden;
      animation: kid-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // Create Minimized Pill Element in bottom-right
    this.pillEl = document.createElement('button');
    this.pillEl.id = 'hud-milo-pill';
    this.pillEl.className = 'kid-arcade-btn';
    this.pillEl.style.cssText = `
      position: absolute; bottom: 12px; right: 14px;
      height: 42px; padding: 6px 14px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%);
      border: 2px solid #38bdf8;
      border-radius: 9999px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.45);
      display: none; align-items: center; gap: 8px;
      color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 800; font-size: 12px;
      cursor: pointer; z-index: 45; pointer-events: auto;
      user-select: none;
      backdrop-filter: blur(12px);
    `;
    this.pillEl.innerHTML = `
      <span style="font-size:20px; animation: kid-milo-bounce 2.5s infinite ease-in-out;">🤖</span>
      <span style="color:#38bdf8; letter-spacing:0.3px;">M.I.L.O. Expert (67)</span>
      <span style="background:#0284c7; color:#fff; font-size:10px; padding:2px 6px; border-radius:9999px;">▲</span>
    `;
    this.pillEl.onclick = () => {
      this.expand();
      soundSystem.playSelect();
    };

    this.container.appendChild(this.panelEl);
    this.container.appendChild(this.pillEl);

    this.renderShell();
    this.bindEvents();
    this.renderCategories();
    this.renderQuestions();
    this.renderReadme();
  }

  private renderShell(): void {
    this.panelEl.innerHTML = `
      <!-- Header: Robot Avatar, Title, Advice Bubble & Action Buttons -->
      <div style="padding:10px 14px 8px 14px; background:rgba(30, 41, 59, 0.5); border-bottom:1.5px solid rgba(56, 189, 248, 0.25); flex-shrink:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px; animation: kid-milo-bounce 2.5s infinite ease-in-out; filter:drop-shadow(0 0 6px rgba(56,189,248,0.7));">🤖</span>
            <div>
              <div style="font-size:13px; font-weight:800; color:#38bdf8; letter-spacing:0.5px;">
                M.I.L.O. NASA BUDDY
              </div>
              <div style="font-size:9.5px; color:#94a3b8; font-weight:600;">
                Junior Astronaut Knowledge Base • 67 Topics
              </div>
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button id="btn-milo-min" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:3px 8px; border-radius:8px; font-size:11px; cursor:pointer;" title="Minimise to bottom-right pill">─</button>
            <button id="btn-milo-close" class="kid-arcade-btn" style="background:#1e293b; color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:3px 8px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;" title="Close Expert Panel">✕</button>
          </div>
        </div>

        <!-- M.I.L.O. Speech / Advice Balloon -->
        <div style="background:rgba(15, 23, 42, 0.8); border:1.5px solid rgba(56, 189, 248, 0.35); border-radius:12px; padding:6px 10px; font-size:11px; color:#e2e8f0; line-height:1.35; display:flex; gap:6px; align-items:center;">
          <span style="color:#38bdf8; font-weight:800; font-size:12px;">💬</span>
          <span id="milo-panel-speech" style="flex:1; word-break:break-word;">${this.cachedMessage}</span>
        </div>
      </div>

      <!-- Navigation Tabs: Expert Q&A vs Field Guide (README.md) -->
      <div style="display:flex; border-bottom:1.5px solid rgba(56, 189, 248, 0.2); background:rgba(15, 23, 42, 0.4); flex-shrink:0;">
        <button id="tab-milo-questions" class="kid-arcade-btn" style="flex:1; padding:7px 10px; background:#0284c7; color:#fff; border:none; border-bottom:2.5px solid #38bdf8; font-weight:800; font-size:11.5px; cursor:pointer;">
          🧠 Expert Q&A (67)
        </button>
        <button id="tab-milo-readme" class="kid-arcade-btn" style="flex:1; padding:7px 10px; background:#1e293b; color:#94a3b8; border:none; font-weight:800; font-size:11.5px; cursor:pointer;">
          📖 Field Guide (README)
        </button>
      </div>

      <!-- Tab View 1: Expert Q&A Content -->
      <div id="milo-view-questions" style="display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden;">
        <!-- Search and Quick Category Filters -->
        <div style="padding:8px 12px 6px 12px; border-bottom:1px solid rgba(56, 189, 248, 0.15); flex-shrink:0;">
          <div style="position:relative; margin-bottom:6px;">
            <input
              id="milo-question-search"
              type="text"
              placeholder="🔍 Search questions (e.g. oxygen, solar, radiation)..."
              style="width:100%; box-sizing:border-box; background:rgba(15, 23, 42, 0.85); border:1.5px solid #334155; border-radius:10px; padding:6px 26px 6px 10px; color:#f1f5f9; font-size:11px; outline:none;"
            />
            <button
              id="milo-search-clear"
              style="position:absolute; right:6px; top:50%; transform:translateY(-50%); background:none; border:none; color:#94a3b8; font-size:12px; cursor:pointer; display:none;"
            >✕</button>
          </div>

          <!-- Category Horizontal Scroll Strip -->
          <div id="milo-categories-strip" style="display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; padding-bottom:3px; white-space:nowrap; -webkit-overflow-scrolling:touch;">
            <!-- Categories injected dynamically -->
          </div>
        </div>

        <!-- Result count & Recommended header -->
        <div style="padding:4px 12px; background:rgba(30, 41, 59, 0.4); display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#94a3b8; border-bottom:1px solid rgba(56, 189, 248, 0.1); flex-shrink:0;">
          <span id="milo-results-count">Showing 67 questions</span>
          <span style="color:#fbbf24;">⭐ Grounded in Real NASA Data</span>
        </div>

        <!-- Scrollable Questions Accordion Tray -->
        <div id="milo-questions-tray" style="flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:7px; scrollbar-width:thin;">
          <!-- Question cards injected dynamically -->
        </div>
      </div>

      <!-- Tab View 2: Field Guide (README.md) Content -->
      <div id="milo-view-readme" style="display:none; flex:1; min-height:0; overflow-y:auto; padding:12px 14px; font-size:11.5px; line-height:1.45; scrollbar-width:thin; color:#cbd5e1;">
        <!-- README HTML injected dynamically -->
      </div>
    `;

    this.speechTextEl = this.panelEl.querySelector('#milo-panel-speech');
    this.searchInput = this.panelEl.querySelector('#milo-question-search');
    this.clearSearchBtn = this.panelEl.querySelector('#milo-search-clear');
    this.questionsContainer = this.panelEl.querySelector('#milo-questions-tray');
    this.categoriesBar = this.panelEl.querySelector('#milo-categories-strip');
    this.readmeContainer = this.panelEl.querySelector('#milo-view-readme');
    this.tabQuestionsBtn = this.panelEl.querySelector('#tab-milo-questions');
    this.tabReadmeBtn = this.panelEl.querySelector('#tab-milo-readme');
    this.countBadgeEl = this.panelEl.querySelector('#milo-results-count');
  }

  private bindEvents(): void {
    // Minimise button
    const minBtn = this.panelEl.querySelector('#btn-milo-min') as HTMLButtonElement | null;
    if (minBtn) {
      minBtn.onclick = () => {
        this.minimise();
        soundSystem.playSelect();
      };
    }

    // Close button
    const closeBtn = this.panelEl.querySelector('#btn-milo-close') as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.close();
        soundSystem.playSelect();
      };
    }

    // Tabs toggle
    if (this.tabQuestionsBtn && this.tabReadmeBtn) {
      this.tabQuestionsBtn.onclick = () => this.switchTab('questions');
      this.tabReadmeBtn.onclick = () => this.switchTab('readme');
    }

    // Search bar
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.searchQuery = this.searchInput?.value.trim().toLowerCase() || '';
        if (this.clearSearchBtn) {
          this.clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderQuestions();
      });

      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const firstCard = this.questionsContainer?.querySelector<HTMLElement>('.milo-q-card');
          if (firstCard && firstCard.dataset.qid) {
            this.toggleQuestion(firstCard.dataset.qid);
          }
        }
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.onclick = () => {
        if (this.searchInput) this.searchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn!.style.display = 'none';
        this.renderQuestions();
        this.searchInput?.focus();
      };
    }
  }

  public switchTab(tab: 'questions' | 'readme'): void {
    this.activeTab = tab;
    const viewQuestions = this.panelEl.querySelector('#milo-view-questions') as HTMLElement | null;
    const viewReadme = this.panelEl.querySelector('#milo-view-readme') as HTMLElement | null;

    if (tab === 'questions') {
      if (viewQuestions) viewQuestions.style.display = 'flex';
      if (viewReadme) viewReadme.style.display = 'none';
      if (this.tabQuestionsBtn) {
        this.tabQuestionsBtn.style.background = '#0284c7';
        this.tabQuestionsBtn.style.color = '#fff';
        this.tabQuestionsBtn.style.borderBottom = '2.5px solid #38bdf8';
      }
      if (this.tabReadmeBtn) {
        this.tabReadmeBtn.style.background = '#1e293b';
        this.tabReadmeBtn.style.color = '#94a3b8';
        this.tabReadmeBtn.style.borderBottom = 'none';
      }
    } else {
      if (viewQuestions) viewQuestions.style.display = 'none';
      if (viewReadme) viewReadme.style.display = 'block';
      if (this.tabReadmeBtn) {
        this.tabReadmeBtn.style.background = '#0284c7';
        this.tabReadmeBtn.style.color = '#fff';
        this.tabReadmeBtn.style.borderBottom = '2.5px solid #38bdf8';
      }
      if (this.tabQuestionsBtn) {
        this.tabQuestionsBtn.style.background = '#1e293b';
        this.tabQuestionsBtn.style.color = '#94a3b8';
        this.tabQuestionsBtn.style.borderBottom = 'none';
      }
    }
    soundSystem.playSelect();
  }

  public renderCategories(): void {
    if (!this.categoriesBar) return;
    this.categoriesBar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'milo-cat-btn kid-arcade-btn';
    allBtn.textContent = `All (${this.questions.length})`;
    allBtn.style.cssText = this.getCategoryBtnStyle(this.selectedCategory === 'all');
    allBtn.onclick = () => {
      this.selectedCategory = 'all';
      this.updateCategoryButtons();
      this.renderQuestions();
      soundSystem.playSelect();
    };
    this.categoriesBar.appendChild(allBtn);

    const recBtn = document.createElement('button');
    recBtn.className = 'milo-cat-btn kid-arcade-btn';
    recBtn.textContent = '⭐ Recommended';
    recBtn.style.cssText = this.getCategoryBtnStyle(this.selectedCategory === 'recommended');
    recBtn.onclick = () => {
      this.selectedCategory = 'recommended';
      this.updateCategoryButtons();
      this.renderQuestions();
      soundSystem.playSelect();
    };
    this.categoriesBar.appendChild(recBtn);

    for (const cat of this.categories) {
      const count = this.questions.filter((q) => q.category === cat.id).length;
      const btn = document.createElement('button');
      btn.className = 'milo-cat-btn kid-arcade-btn';
      btn.dataset.cat = cat.id;
      btn.textContent = `${cat.label.split(' ')[0]} ${cat.id.replace(/_/g, ' ')} (${count})`;
      btn.style.cssText = this.getCategoryBtnStyle(this.selectedCategory === cat.id);
      btn.onclick = () => {
        this.selectedCategory = cat.id;
        this.updateCategoryButtons();
        this.renderQuestions();
        soundSystem.playSelect();
      };
      this.categoriesBar.appendChild(btn);
    }
  }

  private getCategoryBtnStyle(isActive: boolean): string {
    return `
      background: ${isActive ? '#0284c7' : '#1e293b'};
      color: ${isActive ? '#ffffff' : '#cbd5e1'};
      border: ${isActive ? '1.5px solid #38bdf8' : '1px solid #334155'};
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
      flex-shrink: 0;
      white-space: nowrap;
      text-transform: capitalize;
    `;
  }

  private updateCategoryButtons(): void {
    if (!this.categoriesBar) return;
    const btns = this.categoriesBar.querySelectorAll<HTMLButtonElement>('.milo-cat-btn');
    btns.forEach((b) => {
      const isAll = b.textContent?.startsWith('All') && this.selectedCategory === 'all';
      const isRec = b.textContent?.startsWith('⭐') && this.selectedCategory === 'recommended';
      const isCat = b.dataset.cat === this.selectedCategory;
      const active = isAll || isRec || isCat;
      b.style.background = active ? '#0284c7' : '#1e293b';
      b.style.color = active ? '#ffffff' : '#cbd5e1';
      b.style.borderColor = active ? '#38bdf8' : '#334155';
    });
  }

  public getActiveTriggers(): Set<string> {
    const triggers = new Set<string>();
    triggers.add('any');
    triggers.add('site_moon'); // We are building on the Moon!

    if (this.stateProvider) {
      const state = this.stateProvider();
      if (state.oxygenPct !== undefined) {
        if (state.oxygenPct < 15) {
          triggers.add('oxygen_critical');
          triggers.add('oxygen_low');
        } else if (state.oxygenPct < 30) {
          triggers.add('oxygen_low');
        } else if (state.oxygenPct <= 60) {
          triggers.add('oxygen_medium');
        }
      }

      if (state.powerKwh !== undefined) {
        if (state.powerKwh < 150) {
          triggers.add('power_critical');
          triggers.add('power_low');
        } else if (state.powerKwh < 300) {
          triggers.add('power_low');
        }
      }

      if (state.shieldingPct !== undefined) {
        if (state.shieldingPct < 20) {
          triggers.add('shielding_critical');
          triggers.add('shielding_low');
        } else if (state.shieldingPct < 40) {
          triggers.add('shielding_low');
        }
      }
    }

    return triggers;
  }

  public renderQuestions(): void {
    if (!this.questionsContainer) return;
    this.questionsContainer.innerHTML = '';

    const triggers = this.getActiveTriggers();

    let filtered = this.questions.filter((q) => {
      // Category filter
      if (this.selectedCategory === 'recommended') {
        const matchesTrigger = q.triggers.some((t) => triggers.has(t) && t !== 'any');
        if (!matchesTrigger) return false;
      } else if (this.selectedCategory !== 'all' && q.category !== this.selectedCategory) {
        return false;
      }

      // Search filter
      if (this.searchQuery) {
        const matchQ = q.question.toLowerCase().includes(this.searchQuery);
        const matchA = q.answer.toLowerCase().includes(this.searchQuery);
        const matchTag = q.tags.some((t) => t.toLowerCase().includes(this.searchQuery));
        const matchSrc = q.source.toLowerCase().includes(this.searchQuery);
        return matchQ || matchA || matchTag || matchSrc;
      }

      return true;
    });

    // Sort: recommended first, then difficulty beginner -> intermediate -> advanced
    filtered.sort((a, b) => {
      const aRec = a.triggers.some((t) => triggers.has(t) && t !== 'any') ? 1 : 0;
      const bRec = b.triggers.some((t) => triggers.has(t) && t !== 'any') ? 1 : 0;
      if (bRec !== aRec) return bRec - aRec;
      return 0;
    });

    if (this.countBadgeEl) {
      this.countBadgeEl.textContent = `Showing ${filtered.length} of ${this.questions.length} questions`;
    }

    if (filtered.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.cssText = `
        text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 11.5px;
      `;
      emptyEl.innerHTML = `
        <div style="font-size:24px; margin-bottom:6px;">🔍</div>
        <b>No NASA questions match "${this.searchQuery}"</b><br/>
        <span style="font-size:10.5px; color:#64748b;">Try searching for "oxygen", "radiation", "regolith", or "solar".</span>
      `;
      this.questionsContainer.appendChild(emptyEl);
      return;
    }

    const difficultyColors: Record<string, string> = {
      beginner: '#22c55e',
      intermediate: '#f59e0b',
      advanced: '#a855f7',
    };

    const categoryIcons: Record<string, string> = {
      radiation: '☢️',
      oxygen: '💨',
      power: '⚡',
      space_weather: '🌞',
      life_support: '🛠️',
      moon: '🌙',
      mars: '🔴',
      strategy: '🧠',
      crew_health: '🧑‍🚀',
      thermal: '🌡️',
    };

    for (const q of filtered) {
      const isExpanded = this.expandedIds.has(q.id);
      const isRecommended = q.triggers.some((t) => triggers.has(t) && t !== 'any');

      const card = document.createElement('div');
      card.className = 'milo-q-card';
      card.dataset.qid = q.id;
      card.style.cssText = `
        background: ${isExpanded ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.75)'};
        border: 1.5px solid ${isExpanded ? '#38bdf8' : isRecommended ? '#fbbf24' : 'rgba(56, 189, 248, 0.2)'};
        border-radius: 12px;
        padding: 8px 10px;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      `;

      const diffColor = difficultyColors[q.difficulty] || '#38bdf8';
      const catIcon = categoryIcons[q.category] || '🔬';

      card.innerHTML = `
        <!-- Card Header: Badges & Chevron -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:9.5px; gap:4px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
            <span style="background:rgba(56,189,248,0.2); color:#7dd3fc; padding:1px 6px; border-radius:6px; font-weight:800;">
              ${catIcon} ${q.category.toUpperCase()}
            </span>
            <span style="background:${diffColor}22; color:${diffColor}; border:1px solid ${diffColor}55; padding:1px 5px; border-radius:6px; font-weight:700;">
              ${q.difficulty}
            </span>
            ${
              q.related_resource
                ? `<span style="background:rgba(234,179,8,0.2); color:#fef08a; padding:1px 5px; border-radius:6px; font-weight:700;">${q.related_resource}</span>`
                : ''
            }
            ${
              isRecommended
                ? `<span style="background:rgba(245,158,11,0.3); color:#fde68a; border:1px solid #f59e0b; padding:1px 6px; border-radius:6px; font-weight:800;">⭐ Recommended</span>`
                : ''
            }
          </div>
          <span style="color:#38bdf8; font-weight:bold; font-size:11px;">${isExpanded ? '▲' : '▼'}</span>
        </div>

        <!-- Question Text -->
        <div style="font-size:11.5px; font-weight:800; color:#ffffff; line-height:1.35; margin-bottom:${isExpanded ? '8px' : '0'};">
          ${q.question}
        </div>

        <!-- Expanded Answer Body -->
        ${
          isExpanded
            ? `
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(56,189,248,0.2); font-size:11px; color:#e2e8f0; line-height:1.45;">
            <p style="margin:0 0 8px 0; color:#f1f5f9;">${q.answer}</p>
            
            <!-- Citation & Source Link -->
            <div style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.25); border-radius:8px; padding:6px 8px; font-size:10px; margin-top:6px;">
              <div style="color:#7dd3fc; font-weight:700; margin-bottom:2px;">
                🔬 NASA Source: <span style="color:#ffffff; font-weight:normal;">${q.source}</span>
              </div>
              ${
                q.source_url
                  ? `<a href="${q.source_url.startsWith('//') ? 'https:' + q.source_url : q.source_url}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-top:3px; color:#38bdf8; text-decoration:underline; font-weight:700;" onclick="event.stopPropagation();">
                      🌐 Open NASA Reference Data ↗
                    </a>`
                  : ''
              }
            </div>

            <!-- Tags -->
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:6px;">
              ${q.tags
                .map(
                  (t) =>
                    `<span style="font-size:9px; background:rgba(255,255,255,0.08); color:#94a3b8; padding:1px 5px; border-radius:4px;">#${t}</span>`
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        this.toggleQuestion(q.id);
        soundSystem.playSelect();
      };

      this.questionsContainer.appendChild(card);
    }
  }

  public toggleQuestion(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
    this.renderQuestions();
  }

  public renderReadme(): void {
    if (!this.readmeContainer) return;

    // Convert README.md markdown text into clean HTML presentation
    this.readmeContainer.innerHTML = `
      <div style="margin-bottom:12px; border-bottom:1.5px solid rgba(56, 189, 248, 0.3); padding-bottom:8px;">
        <h2 style="margin:0 0 4px 0; font-size:14px; color:#38bdf8;">📖 Expert System — Knowledge Base Field Guide</h2>
        <span style="font-size:10px; color:#94a3b8;">Source: C:\\Users\\acer i7\\Downloads\\README.md • Verified NASA Science</span>
      </div>

      <div style="background:rgba(30,41,59,0.7); border:1.5px solid rgba(56,189,248,0.25); border-radius:12px; padding:10px 12px; margin-bottom:12px;">
        <b style="color:#7dd3fc; font-size:12px;">🌟 Overview</b>
        <p style="margin:4px 0 0 0; font-size:11px; line-height:1.45; color:#f1f5f9;">
          A pre-built, self-contained question-and-answer database that the game loads directly (no AI service, no LLM, no network required). When you click the <b>"Mission Expert"</b> button, you see a categorized list of questions relevant to your current lunar base situation. Each answer is kid-friendly (ages 7–12), grounded in real NASA data, and cites its official source.
        </p>
      </div>

      <div style="margin-bottom:12px;">
        <b style="color:#fbbf24; font-size:12px;">🔬 Content Summary (10 Science Domains & 67 Questions)</b>
        <div style="display:grid; grid-template-columns: 1fr; gap:6px; margin-top:6px;">
          
          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#fca5a5;">
              <span>☢️ Radiation & Shielding</span>
              <span>12 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">GCRs, SPEs, RadLab dose rates, Van Allen belts, water & regolith shielding</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(20,184,166,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#99f6e4;">
              <span>💨 Oxygen & Air</span>
              <span>7 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">O₂ generation, MOXIE (Mars air ISRU), leaks, pressure loss, CO₂ scrubbing</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#7dd3fc;">
              <span>⚡ Power & Energy</span>
              <span>8 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Solar arrays, Kilopower nuclear, battery cold limits, crisis rationing</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#fde68a;">
              <span>🌞 Space Weather</span>
              <span>8 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Flares, CMEs, DONKI, storm duration, radio blackouts, 11-year solar cycle</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#bbf7d0;">
              <span>🛠️ Life Support</span>
              <span>6 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">ECLSS, water recovery (90%), Sabatier reactor, Veggie plants, humidity control</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#e9d5ff;">
              <span>🌙 Moon Mission</span>
              <span>5 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Hazards, regolith, 14-day night, South Pole water ice, lava tubes</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(244,63,94,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#fecdd3;">
              <span>🔴 Mars Mission</span>
              <span>5 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Thin atmosphere, dust storms, comms delay, sub-surface ice, extreme cold</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#fbcfe8;">
              <span>🧑‍🚀 Crew Health & Fitness</span>
              <span>4 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Microgravity bone loss, ARED exercise, sleep disruption, immune suppression</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#fef08a;">
              <span>🌡️ Thermal & Temperature</span>
              <span>2 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Active radiators, cooling loops, multi-layer insulation (MLI)</div>
          </div>

          <div style="background:rgba(15,23,42,0.75); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:6px 10px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:#bae6fd;">
              <span>🧠 Mission Strategy</span>
              <span>10 Questions</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Triage priority, delayed effect debt, post-storm recovery, trade-off balance</div>
          </div>
        </div>
      </div>

      <div style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:8px 12px; margin-bottom:12px;">
        <b style="color:#7dd3fc; font-size:11.5px;">🛰️ NASA Data Sources Referenced</b>
        <ul style="margin:4px 0 0 16px; padding:0; font-size:10.5px; color:#e2e8f0; line-height:1.5;">
          <li>NASA OSDR RadLab (CRaTER lunar data, MSL-RAD Mars data)</li>
          <li>NASA DONKI (space weather events & solar flare forecasting)</li>
          <li>NASA ECLSS Reference (life support systems architecture)</li>
          <li>NASA HRP Space Radiation Element</li>
          <li>NASA Space Radiation Challenge Guide (educator PDF)</li>
          <li>NASA Mars Exploration Program</li>
        </ul>
      </div>

      <details style="margin-bottom:12px; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:8px 10px;">
        <summary style="cursor:pointer; color:#38bdf8; font-weight:bold; font-size:11px;">
          📄 View Full Verbatim Markdown (README.md)
        </summary>
        <pre style="font-size:9.5px; overflow-x:auto; white-space:pre-wrap; color:#94a3b8; font-family:monospace; margin-top:8px; line-height:1.4; max-height:240px; overflow-y:auto;">${EXPERT_README_TEXT.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </details>

      <div style="font-size:10px; color:#94a3b8; text-align:center; padding-top:6px;">
        🚀 Junior Astronaut Mission Trainer • NASA Space Apps Challenge Edition
      </div>
    `;
  }

  public setMessage(msg: string): void {
    this.cachedMessage = msg;
    if (this.speechTextEl) {
      this.speechTextEl.textContent = msg;
    }
  }

  public open(): void {
    this.isPanelOpen = true;
    this.isMinimized = false;
    this.panelEl.style.display = 'flex';
    this.pillEl.style.display = 'none';
    this.onStateChangeCallback?.(true);
  }

  public close(): void {
    this.isPanelOpen = false;
    this.panelEl.style.display = 'none';
    this.pillEl.style.display = 'flex';
    this.onStateChangeCallback?.(false);
  }

  public toggle(): void {
    if (this.isPanelOpen && !this.isMinimized) {
      this.close();
    } else {
      this.open();
    }
  }

  public minimise(): void {
    this.isMinimized = true;
    this.isPanelOpen = false;
    this.panelEl.style.display = 'none';
    this.pillEl.style.display = 'flex';
    this.onStateChangeCallback?.(false);
  }

  public expand(): void {
    this.isMinimized = false;
    this.isPanelOpen = true;
    this.panelEl.style.display = 'flex';
    this.pillEl.style.display = 'none';
    this.onStateChangeCallback?.(true);
  }

  public isOpen(): boolean {
    return this.isPanelOpen && !this.isMinimized;
  }
}
