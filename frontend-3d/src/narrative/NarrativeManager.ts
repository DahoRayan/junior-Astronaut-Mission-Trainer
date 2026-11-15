import { STORY_SCENES_3D, type DialogueScene } from './StoryData3D';
import type { TimeManager } from '../astronomy/TimeManager';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { RoverManager } from '../rovers/RoverManager';

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

  private cachedSpeed: number = 1.0;
  private timeManager: TimeManager;
  private simEngine: SimulationEngine;
  private roverManager?: RoverManager;
  private modalRoot: HTMLElement | null = null;
  private onTransmissionCallback?: (ev: TimelineEvent) => void;

  constructor(timeManager: TimeManager, simEngine: SimulationEngine, roverManager?: RoverManager) {
    this.timeManager = timeManager;
    this.simEngine = simEngine;
    this.roverManager = roverManager;

    if (typeof document !== 'undefined') {
      this.modalRoot = document.getElementById('modal-root');
    }
  }

  public onIncomingTransmission(cb: (ev: TimelineEvent) => void): void {
    this.onTransmissionCallback = cb;
  }

  /**
   * Called every tick to evaluate timeline triggers.
   */
  public checkTimeline(sol: number, hour: number): void {
    if (this.isModalOpen) return;

    for (const ev of NarrativeManager.TIMELINE_EVENTS) {
      if (!this.triggeredEvents.has(ev.id)) {
        if (sol > ev.sol || (sol === ev.sol && hour >= ev.hour)) {
          this.triggeredEvents.add(ev.id);
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

    const existing = document.getElementById(`radio-toast-${ev.id}`);
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = `radio-toast-${ev.id}`;
    toast.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.94);
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 10px 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #f1f5f9;
      animation: fadeIn 0.3s ease;
      pointer-events: auto;
    `;

    toast.innerHTML = `
      <div style="font-size:18px;">📻</div>
      <div>
        <div style="font-weight:bold; color:#38bdf8; font-size:11px;">INCOMING COMMS TRANSMISSION</div>
        <div>${ev.title}</div>
      </div>
      <div style="display:flex; gap:6px; margin-left:6px;">
        <button id="btn-read-toast" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">View</button>
        <button id="btn-dismiss-toast" style="background:transparent; color:#94a3b8; border:1px solid #475569; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px;">✕</button>
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
    };

    // Auto-fade after 12 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 12000);

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
      background: rgba(0, 0, 0, 0.45);
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding-bottom: 30px;
      z-index: 9999;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      pointer-events: auto;
      width: 90%;
      max-width: 780px;
      background: rgba(10, 16, 28, 0.95);
      border: 1px solid rgba(80, 160, 240, 0.5);
      border-radius: 12px;
      box-shadow: 0 0 35px rgba(0, 140, 255, 0.25);
      padding: 20px 24px;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    let currentLineIdx = 0;

    const updateLineDisplay = () => {
      const line = scene.lines[currentLineIdx];
      const isLast = currentLineIdx === scene.lines.length - 1;

      box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:12px;">
          <div style="font-size:12px; font-weight:bold; letter-spacing:0.5px; color:#38bdf8;">
            ◈ MISSION LOG — ${scene.title} (SOL ${scene.sol})
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; color:#94a3b8;">${currentLineIdx + 1} / ${scene.lines.length}</span>
            <button id="btn-skip-dialogue" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:12px;" title="Skip dialogue">✕ Close</button>
          </div>
        </div>

        <div style="min-height:75px; margin-bottom:16px;">
          ${line.type === 'line' ? `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span style="color:#f59e0b; font-weight:bold; font-size:14px;">${line.speaker}</span>
              ${line.role ? `<span style="font-size:11px; background:rgba(56,189,248,0.15); color:#7dd3fc; padding:2px 6px; border-radius:4px;">${line.role}</span>` : ''}
            </div>
            <p style="font-size:14.5px; line-height:1.5; color:#f8fafc;">${line.text}</p>
          ` : `
            <p style="font-style:italic; color:#94a3b8; font-size:13.5px; line-height:1.5;">${line.text}</p>
          `}
        </div>

        <div id="modal-controls" style="display:flex; justify-content:flex-end; gap:10px;"></div>
      `;

      const btnSkip = box.querySelector('#btn-skip-dialogue') as HTMLButtonElement;
      if (btnSkip) btnSkip.onclick = () => this.closeModal();

      const controls = box.querySelector('#modal-controls') as HTMLElement;

      if (!isLast) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Continue ▶';
        nextBtn.style.cssText = `
          background: #0284c7; color: #ffffff; border: none; padding: 7px 16px; border-radius: 6px;
          cursor: pointer; font-weight: bold; font-size: 12px;
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
            btn.textContent = ch.text;
            btn.style.cssText = `
              background: #0f766e; color: #ffffff; border: 1px solid #14b8a6; padding: 7px 14px; border-radius: 6px;
              cursor: pointer; font-weight: bold; font-size: 12px; margin-left: 6px;
            `;
            btn.onclick = () => {
              if (ch.action) this.handleAction(ch.action);
              this.closeModal();
            };
            controls.appendChild(btn);
          }
        } else {
          const closeBtn = document.createElement('button');
          closeBtn.textContent = 'Acknowledge ✔';
          closeBtn.style.cssText = `
            background: #059669; color: #ffffff; border: none; padding: 7px 16px; border-radius: 6px;
            cursor: pointer; font-weight: bold; font-size: 12px;
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
    console.log(`[NarrativeManager] Modal dismissed. Restored simulation multiplier to ${this.cachedSpeed}x.`);
  }
}
