import { STORY_SCENES_3D, type DialogueScene } from './StoryData3D';
import type { TimeManager } from '../astronomy/TimeManager';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { RoverManager } from '../rovers/RoverManager';
import type { MissionDecisionManager } from '../simulation/MissionDecisionManager';

export interface TimelineEvent {
  id: string;
  sol: number;
  hour: number;
  title: string;
  sceneId?: string;
}

export class NarrativeManager {
  public static readonly TIMELINE_EVENTS: TimelineEvent[] = [
    { id: 'E-LANDING', sol: 1, hour: 6.0, title: 'Touchdown on Shackleton Crater Rim', sceneId: 'S-PRO-1' },
    { id: 'E-HAB-SETUP', sol: 1, hour: 7.0, title: 'Habitat Pressurization & Base Tour', sceneId: 'S-BASE-TOUR' },
    { id: 'E-O2-VALVE-FRACTURE', sol: 2, hour: 6.0, title: 'Primary Cryo-Valve Fracture Alert', sceneId: 'S-C1-2' },
    { id: 'E-RESUPPLY-LANDS', sol: 4, hour: 8.0, title: 'Falcon Heavy Cargo Lander Touchdown', sceneId: 'S-C1-3' },
    { id: 'E-LONG-NIGHT-START', sol: 7, hour: 0.0, title: 'Polar Mountain Shadow Eclipse Entry', sceneId: 'S-C2-1' },
    { id: 'E-BATTERY-FREEZE', sol: 7, hour: 12.0, title: 'Battery Cooling Loop Freeze (-180°C)', sceneId: 'S-C2-2' },
    { id: 'E-SOLAR-FLARE', sol: 10, hour: 6.0, title: 'Category X Solar Storm Detected (DONKI)', sceneId: 'S-C3-1' },
    { id: 'E-RADIATION-IMPACT', sol: 10, hour: 8.0, title: '140 mSv/h Radiation Shockwave Impact', sceneId: 'S-C3-2' },
    { id: 'E-RATIONS-LOW', sol: 12, hour: 6.0, title: 'Food Reserves Depletion Warning' },
    { id: 'E-HYDROPONICS', sol: 12, hour: 8.0, title: 'Hydroponics Bay Harvest & Extraction' },
    { id: 'E-CATASTROPHE', sol: 14, hour: 6.0, title: 'Moonquake 5.2 & Jammed Airlock Catastrophe', sceneId: 'S-C5-1' },
    { id: 'E-RESCUE', sol: 14, hour: 10.0, title: 'Capt. Leo Ruiz 4-Step Rescue Completed', sceneId: 'S-C5-2' },
    { id: 'E-DEBRIEF', sol: 15, hour: 6.0, title: 'NASA Artemis Commendation & Debrief', sceneId: 'S-EPI-1' },
    { id: 'E-MARS-TRANSMISSION', sol: 15, hour: 8.0, title: 'Mars Logistics Transmission & Sandbox Unlock', sceneId: 'S-EPI-2' },
  ];

  public triggeredEvents: Set<string> = new Set();
  public isModalOpen: boolean = false;
  /**
   * User preference: When false, only the initial welcome modal opens automatically;
   * subsequent story events display as a discreet top radio toast without freezing time.
   */
  public autoOpenDialogues: boolean = false;
  public unreadTransmissions: TimelineEvent[] = [];
  private lastToastTimeMs: number = 0;

  private cachedSpeed: number = 1.0;
  private timeManager: TimeManager;
  private simEngine: SimulationEngine;
  private roverManager?: RoverManager;
  private decisionManager?: MissionDecisionManager;
  private modalRoot: HTMLElement | null = null;
  private onTransmissionCallback?: (ev: TimelineEvent) => void;
  private onDismissCallback?: () => void;

  constructor(
    timeManager: TimeManager,
    simEngine: SimulationEngine,
    roverManager?: RoverManager,
    decisionManager?: MissionDecisionManager
  ) {
    this.timeManager = timeManager;
    this.simEngine = simEngine;
    this.roverManager = roverManager;
    this.decisionManager = decisionManager;

    if (typeof document !== 'undefined') {
      this.modalRoot = document.getElementById('modal-root');
    }
  }

  public setDecisionManager(dm: MissionDecisionManager): void {
    this.decisionManager = dm;
  }

  public onIncidentDismissed(cb: () => void): void {
    this.onDismissCallback = cb;
  }

  public onIncomingTransmission(cb: (ev: TimelineEvent) => void): void {
    this.onTransmissionCallback = cb;
  }

  /**
   * Called every tick to evaluate timeline triggers.
   */
  public checkTimeline(sol: number, hour: number): void {
    if (this.isModalOpen) return;

    // Throttle automated event triggers during rapid scrubbing (at least 1.5s between events)
    if (!this.autoOpenDialogues && Date.now() - this.lastToastTimeMs < 1500) {
      return;
    }

    for (const ev of NarrativeManager.TIMELINE_EVENTS) {
      if (!this.triggeredEvents.has(ev.id)) {
        if (sol > ev.sol || (sol === ev.sol && hour >= ev.hour)) {
          this.triggeredEvents.add(ev.id);
          this.lastToastTimeMs = Date.now();
          this.executeEvent(ev);
          break; // trigger one event per tick to avoid modal stacking
        }
      }
    }
  }

  private executeEvent(ev: TimelineEvent): void {
    console.log(`[NarrativeManager] Triggered Event: ${ev.id} — ${ev.title}`);

    // Event-specific simulation state changes
    if (ev.id === 'E-O2-VALVE-FRACTURE') {
      this.simEngine.state.o2CrisisTimerHours = 48.0;
      this.simEngine.state.stored_o2 = 25.0;
    } else if (ev.id === 'E-RESUPPLY-LANDS') {
      this.simEngine.landEarthResupply();
    } else if (ev.id === 'E-LONG-NIGHT-START') {
      // 48-hour mountain shadow eclipse
    } else if (ev.id === 'E-BATTERY-FREEZE') {
      this.simEngine.state.temperature = 18.0;
    }

    if (ev.sceneId && STORY_SCENES_3D[ev.sceneId]) {
      // Sol 1 Touchdown opens automatically on start; other dialogs appear minimally via radio banner
      if (ev.id === 'E-LANDING' || this.autoOpenDialogues) {
        this.playScene(ev.sceneId);
      } else {
        // Queue as non-intrusive incoming transmission
        this.unreadTransmissions.unshift(ev);
        this.showRadioTransmissionToast(ev);
        if (this.onTransmissionCallback) {
          this.onTransmissionCallback(ev);
        }
      }
    }
  }

  private showRadioTransmissionToast(ev: TimelineEvent): void {
    if (typeof document === 'undefined') return;

    // Remove any existing active toast to prevent overlapping
    const activeToasts = document.querySelectorAll('.radio-toast-active');
    activeToasts.forEach((t) => t.remove());

    const toast = document.createElement('div');
    toast.id = `radio-toast-${ev.id}`;
    toast.className = 'radio-toast-active kid-pop-in';
    toast.style.cssText = `
      position: fixed;
      top: 72px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 100%);
      border: 2.5px solid #38bdf8;
      border-radius: 18px;
      padding: 12px 18px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12.5px;
      color: #f1f5f9;
      pointer-events: auto;
      max-width: 90vw;
      animation: kid-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    toast.innerHTML = `
      <div style="font-size:24px; animation: kid-star-twinkle 2s infinite ease-in-out;">📻</div>
      <div>
        <div style="font-weight:800; color:#38bdf8; font-size:11px; letter-spacing:0.8px; text-transform:uppercase;">Incoming Lunar Comms</div>
        <div style="font-weight:700; color:#ffffff;">${ev.title}</div>
      </div>
      <div style="display:flex; gap:8px; margin-left:10px;">
        <button id="btn-read-toast" class="kid-arcade-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; border:1.5px solid #38bdf8; padding:6px 14px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; box-shadow:0 3px 8px rgba(2,132,199,0.4);">View</button>
        <button id="btn-dismiss-toast" class="kid-arcade-btn" style="background:transparent; color:#94a3b8; border:1px solid #475569; padding:6px 10px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:700;">✕</button>
      </div>
    `;

    const btnRead = toast.querySelector('#btn-read-toast') as HTMLButtonElement;
    btnRead.onclick = () => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
      if (ev.sceneId) this.playScene(ev.sceneId);
    };

    const btnDismiss = toast.querySelector('#btn-dismiss-toast') as HTMLButtonElement;
    btnDismiss.onclick = () => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
      if (this.decisionManager) {
        this.decisionManager.resetCooldown(this.timeManager.getState().totalHours);
      }
      if (this.onDismissCallback) {
        this.onDismissCallback();
      }
    };

    // Auto-fade after 10 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 10000);

    document.body.appendChild(toast);
  }

  public playScene(sceneId: string): void {
    const scene = STORY_SCENES_3D[sceneId];
    if (!scene) return;

    // Freeze simulation clock and cache current speed
    this.cachedSpeed = this.timeManager.getMultiplier();
    this.timeManager.setMultiplier(0);
    this.simEngine.state.isPaused = true;
    this.isModalOpen = true;

    this.renderDialogueModal(scene);
  }

  private renderDialogueModal(scene: DialogueScene): void {
    if (!this.modalRoot) return;

    this.modalRoot.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding-bottom: 35px;
      z-index: 9999;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      pointer-events: auto;
      width: 90%;
      max-width: 780px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 100%);
      border: 3px solid rgba(56, 189, 248, 0.65);
      border-radius: 24px;
      box-shadow: 0 10px 45px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.35);
      padding: 22px 26px;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: kid-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    let currentLineIdx = 0;

    const getSpeakerAvatar = (speaker: string) => {
      const s = speaker.toLowerCase();
      if (s.includes('milo')) return '🤖';
      if (s.includes('director')) return '🚀';
      if (s.includes('amir')) return '🔧';
      if (s.includes('nia')) return '🌿';
      if (s.includes('daniel')) return '🩺';
      return '🧑‍🚀';
    };

    const updateLineDisplay = () => {
      const line = scene.lines[currentLineIdx];
      const isLast = currentLineIdx === scene.lines.length - 1;
      const avatar = line.type === 'line' && line.speaker ? getSpeakerAvatar(line.speaker) : '📡';

      box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(56,189,248,0.25); padding-bottom:10px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">💬</span>
            <div style="font-size:12.5px; font-weight:800; letter-spacing:0.5px; color:#38bdf8;">
              MISSION COMMS — ${scene.title} (SOL ${scene.sol})
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:11.5px; color:#94a3b8; font-weight:700;">${currentLineIdx + 1} / ${scene.lines.length}</span>
            <button id="btn-skip-dialogue" class="kid-arcade-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#94a3b8; cursor:pointer; font-size:12px; border-radius:10px; padding:3px 8px; font-weight:700;" title="Skip dialogue">✕ Close</button>
          </div>
        </div>

        <div style="min-height:85px; margin-bottom:18px; display:flex; gap:14px; align-items:flex-start;">
          <div style="font-size:36px; line-height:1; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4)); flex-shrink:0;">${avatar}</div>
          <div style="flex:1;">
            ${line.type === 'line' ? `
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span style="color:#f59e0b; font-weight:800; font-size:15px;">${line.speaker}</span>
                ${line.role ? `<span style="font-size:11px; font-weight:700; background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.35); color:#7dd3fc; padding:2px 8px; border-radius:9999px;">${line.role}</span>` : ''}
              </div>
              <p style="font-size:14.5px; line-height:1.55; color:#f8fafc; font-weight:500;">${line.text}</p>
            ` : `
              <p style="font-style:italic; color:#94a3b8; font-size:14px; line-height:1.55;">${line.text}</p>
            `}
          </div>
        </div>

        <div id="modal-controls" style="display:flex; justify-content:flex-end; gap:10px;"></div>
      `;

      const btnSkip = box.querySelector('#btn-skip-dialogue') as HTMLButtonElement;
      if (btnSkip) btnSkip.onclick = () => this.closeModal();

      const controls = box.querySelector('#modal-controls') as HTMLElement;

      if (!isLast) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'kid-arcade-btn';
        nextBtn.textContent = 'Continue ▶';
        nextBtn.style.cssText = `
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: 2px solid #38bdf8; padding: 9px 22px; border-radius: 14px;
          cursor: pointer; font-weight: 800; font-size: 13px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
        `;
        nextBtn.onclick = () => {
          currentLineIdx++;
          updateLineDisplay();
        };
        controls.appendChild(nextBtn);
      } else {
        // Choices or Close
        if (scene.choices && scene.choices.length > 0) {
          for (const ch of scene.choices) {
            const btn = document.createElement('button');
            btn.className = 'kid-arcade-btn';
            btn.textContent = ch.text;
            btn.style.cssText = `
              background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #ffffff; border: 2px solid #14b8a6; padding: 9px 18px; border-radius: 14px;
              cursor: pointer; font-weight: 800; font-size: 13px; margin-left: 6px; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.45);
            `;
            btn.onclick = () => {
              if (ch.action) this.handleAction(ch.action);
              this.closeModal();
            };
            controls.appendChild(btn);
          }
        } else {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'kid-arcade-btn';
          closeBtn.textContent = 'Acknowledge ✔';
          closeBtn.style.cssText = `
            background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; border: 2px solid #10b981; padding: 9px 22px; border-radius: 14px;
            cursor: pointer; font-weight: 800; font-size: 13px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.45);
          `;
          closeBtn.onclick = () => this.closeModal();
          controls.appendChild(closeBtn);
        }
      }
    };

    updateLineDisplay();
    overlay.appendChild(box);
    this.modalRoot.appendChild(overlay);
  }

  private handleAction(action: string): void {
    if (action === 'order_resupply') {
      this.simEngine.orderEarthResupply();
    } else if (action === 'ration_o2') {
      this.simEngine.state.o2CrisisTimerHours = 48.0;
    } else if (action === 'evacuate_vault') {
      this.simEngine.state.isSheltered = true;
    } else if (action === 'exit_vault') {
      this.simEngine.state.isSheltered = false;
    } else if (action === 'dispatch_rescue' && this.roverManager) {
      this.roverManager.dispatchRescue();
    }
  }

  public reset(): void {
    this.triggeredEvents.clear();
    this.closeModal();
  }

  public closeModal(): void {
    if (this.modalRoot) {
      this.modalRoot.innerHTML = '';
    }
    this.isModalOpen = false;
    this.simEngine.state.isPaused = false;

    // Restore cached pre-pause simulation multiplier
    this.timeManager.setMultiplier(this.cachedSpeed);

    // Enforce quiet period on decision engine following story/incident dialogue closure
    if (this.decisionManager) {
      this.decisionManager.resetCooldown(this.timeManager.getState().totalHours);
    }
    if (this.onDismissCallback) {
      this.onDismissCallback();
    }

    console.log(`[NarrativeManager] Modal dismissed. Restored simulation multiplier to ${this.cachedSpeed}x.`);
  }
}
