/**
 * Interactive Time Scrubber UI Component
 * NASA Outpost 3D Lunar Frontend
 *
 * Mounts into #hud-overlay with non-blocking pointer events.
 * Provides bidirectional 0..708.7h scrubber slider with drag isolation,
 * 1x..708x speed multiplier toggles, play/pause controls, sector preset jump buttons,
 * and live Sol / Hour / Phase telemetry badges.
 */

import { CameraController } from '../interaction/CameraController';
import { TimeManager } from '../astronomy/TimeManager';
import type { CameraPresetId, CelestialTimeState, SolarEphemeris } from '../core/types';

export interface TimeScrubberUIOptions {
  timeManager: TimeManager;
  cameraController: CameraController;
  containerId?: string; // default: 'hud-overlay'
}

export class TimeScrubberUI {
  private readonly timeManager: TimeManager;
  private readonly cameraController: CameraController;
  private readonly rootContainer: HTMLElement;
  private widgetElement!: HTMLElement;

  // DOM element references
  private solBadge!: HTMLElement;
  private hourBadge!: HTMLElement;
  private totalBadge!: HTMLElement;
  private phaseBadge!: HTMLElement;
  private scrubSlider!: HTMLInputElement;
  private playPauseBtn!: HTMLButtonElement;
  private speedButtons: Map<number, HTMLButtonElement> = new Map();
  private presetButtons: Map<CameraPresetId, HTMLButtonElement> = new Map();

  private isUserScrubbing: boolean = false;
  private boundKeydownHandler: (e: KeyboardEvent) => void;

  constructor(options: TimeScrubberUIOptions) {
    this.timeManager = options.timeManager;
    this.cameraController = options.cameraController;

    const targetId = options.containerId ?? 'hud-overlay';
    const found = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    this.rootContainer = (found ?? (typeof document !== 'undefined' ? document.body : ({} as unknown))) as HTMLElement;

    this.boundKeydownHandler = this.handleKeydown.bind(this);

    this.init();
  }

  private init(): void {
    if (typeof document === 'undefined') return;

    this.ensureStyles();
    this.buildDOM();
    this.bindEvents();
  }

  private ensureStyles(): void {
    if (typeof document === 'undefined' || document.getElementById('time-scrubber-styles')) return;

    const style = document.createElement('style');
    style.id = 'time-scrubber-styles';
    style.textContent = `
      .time-scrubber-widget {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: clamp(340px, 92vw, 840px);
        background: rgba(10, 14, 23, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 210, 255, 0.25);
        border-radius: 14px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75), 0 0 1px rgba(0, 210, 255, 0.4) inset;
        padding: 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        user-select: none;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        z-index: 20;
      }
      .scrubber-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
      }
      .telemetry-badges {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .hud-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        font-family: ui-monospace, SFMono-Regular, "Roboto Mono", monospace;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #e0e8f0;
      }
      .hud-badge.sol-badge {
        background: rgba(0, 210, 255, 0.15);
        border-color: rgba(0, 210, 255, 0.4);
        color: #00d2ff;
      }
      .hud-badge.daylight {
        background: rgba(255, 200, 50, 0.15);
        border-color: rgba(255, 200, 50, 0.4);
        color: #ffd24d;
      }
      .hud-badge.earthshine {
        background: rgba(130, 180, 255, 0.15);
        border-color: rgba(130, 180, 255, 0.4);
        color: #82b4ff;
      }
      .camera-presets-group, .speed-buttons-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .preset-btn, .speed-btn, .playback-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .preset-btn:hover, .speed-btn:hover, .playback-btn:hover {
        background: rgba(0, 210, 255, 0.2);
        border-color: #00d2ff;
        color: #ffffff;
      }
      .preset-btn.active, .speed-btn.active {
        background: #00d2ff;
        border-color: #00d2ff;
        color: #0a0e17;
        font-weight: 700;
        box-shadow: 0 0 8px rgba(0, 210, 255, 0.5);
      }
      .slider-container {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .time-scrub-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(90deg, #ffd24d 0%, #3a4b66 25%, #101c38 50%, #3a4b66 75%, #ffd24d 100%);
        outline: none;
        cursor: ew-resize;
      }
      .time-scrub-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00d2ff;
        border: 2px solid #ffffff;
        box-shadow: 0 0 8px rgba(0, 210, 255, 0.8);
        cursor: pointer;
        transition: transform 0.1s ease;
      }
      .slider-ticks {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #64748b;
        font-family: ui-monospace, monospace;
      }
      .scrubber-hints {
        font-size: 10px;
        color: #64748b;
        font-family: ui-monospace, monospace;
      }
    `;
    document.head.appendChild(style);
  }

  private buildDOM(): void {
    if (typeof document === 'undefined') return;

    this.widgetElement = document.createElement('div');
    this.widgetElement.className = 'time-scrubber-widget';
    this.widgetElement.id = 'time-scrubber-widget';

    // Header Row: Badges & Camera Presets
    const headerRow = document.createElement('div');
    headerRow.className = 'scrubber-row scrubber-header-row';

    const badges = document.createElement('div');
    badges.className = 'telemetry-badges';

    this.solBadge = document.createElement('span');
    this.solBadge.className = 'hud-badge sol-badge';
    this.solBadge.textContent = 'SOL 01';

    this.hourBadge = document.createElement('span');
    this.hourBadge.className = 'hud-badge';
    this.hourBadge.textContent = '06:00 LST';

    this.totalBadge = document.createElement('span');
    this.totalBadge.className = 'hud-badge';
    this.totalBadge.textContent = '006.0 / 708.7h';

    this.phaseBadge = document.createElement('span');
    this.phaseBadge.className = 'hud-badge daylight';
    this.phaseBadge.textContent = '☀ DAYLIGHT (+1.2°)';

    badges.appendChild(this.solBadge);
    badges.appendChild(this.hourBadge);
    badges.appendChild(this.totalBadge);
    badges.appendChild(this.phaseBadge);

    const presetGroup = document.createElement('div');
    presetGroup.className = 'camera-presets-group';

    const presets: Array<{ id: CameraPresetId; label: string }> = [
      { id: 'central_hab', label: 'Hab' },
      { id: 'greenhouse', label: 'Greenhouse' },
      { id: 'power_yard', label: 'Power' },
      { id: 'landing_pad', label: 'Pad' },
      { id: 'rim_horizon', label: 'Horizon' },
    ];

    presets.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = `preset-btn ${p.id === 'central_hab' ? 'active' : ''}`;
      btn.dataset.preset = p.id;
      btn.textContent = p.label;
      btn.title = `Focus ${p.label}`;
      this.presetButtons.set(p.id, btn);
      presetGroup.appendChild(btn);
    });

    headerRow.appendChild(badges);
    headerRow.appendChild(presetGroup);

    // Slider Row: Bidirectional Scrub
    const sliderRow = document.createElement('div');
    sliderRow.className = 'scrubber-row scrubber-slider-row';

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    this.scrubSlider = document.createElement('input');
    this.scrubSlider.type = 'range';
    this.scrubSlider.className = 'time-scrub-slider';
    this.scrubSlider.min = '0';
    this.scrubSlider.max = '708.734';
    this.scrubSlider.step = '0.1';
    this.scrubSlider.value = '6.0';
    this.scrubSlider.setAttribute('aria-label', 'Mission Time Scrubber');

    const ticks = document.createElement('div');
    ticks.className = 'slider-ticks';
    ticks.innerHTML = `
      <span>Sol 1 (Noon)</span>
      <span>Sol 8 (Sunset)</span>
      <span>Sol 15 (Midnight)</span>
      <span>Sol 22 (Dawn)</span>
      <span>Sol 30 (Noon)</span>
    `;

    sliderContainer.appendChild(this.scrubSlider);
    sliderContainer.appendChild(ticks);
    sliderRow.appendChild(sliderContainer);

    // Controls Row: Play/Pause, Speeds, Shortcuts hint
    const controlsRow = document.createElement('div');
    controlsRow.className = 'scrubber-row scrubber-controls-row';

    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.className = 'playback-btn';
    this.playPauseBtn.innerHTML = '⏸ PAUSE';
    this.playPauseBtn.title = 'Toggle Simulation Clock (Space)';

    const speedGroup = document.createElement('div');
    speedGroup.className = 'speed-buttons-group';

    const multipliers = [1, 6, 30, 360, 708];
    multipliers.forEach((m) => {
      const btn = document.createElement('button');
      btn.className = `speed-btn ${m === 1 ? 'active' : ''}`;
      btn.dataset.speed = String(m);
      btn.textContent = `${m}x`;
      btn.title = `${m} sim hr / real sec`;
      this.speedButtons.set(m, btn);
      speedGroup.appendChild(btn);
    });

    const hints = document.createElement('div');
    hints.className = 'scrubber-hints';
    hints.textContent = 'Space: Pause | 1-5: Speed | Drag: Scrub';

    controlsRow.appendChild(this.playPauseBtn);
    controlsRow.appendChild(speedGroup);
    controlsRow.appendChild(hints);

    this.widgetElement.appendChild(headerRow);
    this.widgetElement.appendChild(sliderRow);
    this.widgetElement.appendChild(controlsRow);

    if (this.rootContainer && typeof this.rootContainer.appendChild === 'function') {
      this.rootContainer.appendChild(this.widgetElement);
    }
  }

  private bindEvents(): void {
    if (!this.scrubSlider) return;

    // Slider Events with Drag Isolation
    this.scrubSlider.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.isUserScrubbing = true;
    });

    this.scrubSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      this.isUserScrubbing = true;
      const targetHours = parseFloat(this.scrubSlider.value);
      this.timeManager.setTime(targetHours);
    });

    const onRelease = (e: Event) => {
      e.stopPropagation();
      if (this.isUserScrubbing) {
        this.isUserScrubbing = false;
        const targetHours = parseFloat(this.scrubSlider.value);
        this.timeManager.setTime(targetHours);
      }
    };

    this.scrubSlider.addEventListener('pointerup', onRelease);
    this.scrubSlider.addEventListener('change', onRelease);

    // Play/Pause Button
    this.playPauseBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Speed Multipliers
    this.speedButtons.forEach((btn, multiplier) => {
      btn.addEventListener('click', () => {
        this.setSpeedMultiplier(multiplier);
      });
    });

    // Camera Preset Buttons
    this.presetButtons.forEach((btn, presetId) => {
      btn.addEventListener('click', () => {
        this.selectPreset(presetId);
      });
    });

    // Global keyboard listener
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeydownHandler);
    }
  }

  public togglePlayPause(): void {
    const isPaused = this.timeManager.togglePause();
    if (this.playPauseBtn) {
      this.playPauseBtn.innerHTML = isPaused ? '▶ PLAY' : '⏸ PAUSE';
    }
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.timeManager.setMultiplier(multiplier);
    this.speedButtons.forEach((btn, m) => {
      btn.classList.toggle('active', m === multiplier);
    });
    if (this.playPauseBtn) {
      this.playPauseBtn.innerHTML = '⏸ PAUSE';
    }
  }

  public selectPreset(presetId: CameraPresetId): void {
    this.cameraController.moveToPreset(presetId);
    this.presetButtons.forEach((btn, id) => {
      btn.classList.toggle('active', id === presetId);
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (typeof document !== 'undefined' && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      return; // Ignore if focused in text field
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'Digit1':
        this.setSpeedMultiplier(1);
        break;
      case 'Digit2':
        this.setSpeedMultiplier(6);
        break;
      case 'Digit3':
        this.setSpeedMultiplier(30);
        break;
      case 'Digit4':
        this.setSpeedMultiplier(360);
        break;
      case 'Digit5':
        this.setSpeedMultiplier(708);
        break;
      case 'KeyH':
        this.selectPreset('central_hab');
        break;
      case 'KeyG':
        this.selectPreset('greenhouse');
        break;
      case 'KeyP':
        this.selectPreset('power_yard');
        break;
      case 'KeyL':
        this.selectPreset('landing_pad');
        break;
      case 'KeyR':
        this.selectPreset('rim_horizon');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.timeManager.setTime(this.timeManager.getTotalHours() - (e.shiftKey ? 6.0 : 1.0));
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.timeManager.setTime(this.timeManager.getTotalHours() + (e.shiftKey ? 6.0 : 1.0));
        break;
    }
  }

  /**
   * Called each frame by the render loop to update telemetry readouts.
   */
  public update(timeState: CelestialTimeState, ephemeris: SolarEphemeris): void {
    if (!this.widgetElement) return;

    // Update Sol badge
    const solStr = String(timeState.sol).padStart(2, '0');
    if (this.solBadge) {
      this.solBadge.textContent = `SOL ${solStr}`;
    }

    // Update Hour badge
    const totalMinutes = Math.floor(timeState.timeOfDayHours * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    if (this.hourBadge) {
      this.hourBadge.textContent = `${hh}:${mm} LST`;
    }

    // Update Mission Hours badge
    if (this.totalBadge) {
      this.totalBadge.textContent = `${timeState.totalHours.toFixed(1)} / 708.7h`;
    }

    // Update Lighting Phase badge
    const elevDeg = ephemeris.sunElevationRad * (180 / Math.PI);
    if (this.phaseBadge) {
      if (timeState.isDaylight) {
        this.phaseBadge.className = 'hud-badge daylight';
        this.phaseBadge.textContent = `☀ DAYLIGHT (+${elevDeg.toFixed(1)}°)`;
      } else {
        this.phaseBadge.className = 'hud-badge earthshine';
        this.phaseBadge.textContent = `🌑 NIGHT (EARTHSHINE ${ephemeris.earthshineIntensity.toFixed(2)} lx)`;
      }
    }

    // Update Slider position only when not actively dragged by user
    if (!this.isUserScrubbing && this.scrubSlider) {
      this.scrubSlider.value = String(timeState.totalHours);
    }
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeydownHandler);
    }
    if (this.widgetElement && this.widgetElement.parentElement) {
      this.widgetElement.parentElement.removeChild(this.widgetElement);
    }
  }
}
