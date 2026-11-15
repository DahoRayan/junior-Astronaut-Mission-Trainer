/**
 * Production HUD Controller & City Builder Interface
 * NASA Outpost 3D Lunar Frontend
 *
 * Kid-Friendly, Approachable Aerospace UI Overlay (Ages 7–12):
 * - Top glowing resource ribbon (Materials 🧱, Power ⚡, Crew 🧑‍🚀, Food 🥦, Water 💧, O2 🌬️, Health ❤️, Morale 😊, Mission Rating 🏆)
 * - Centered, non-overlapping bottom City Builder dock with cheerful categorized tabs, building cards, rotate, and bulldoze tools
 * - Full deselection support (toggle card click, ESC key, right-click, Inspector close button)
 * - Obvious vivid green highlight rings for building selection and placement reticle
 * - Interactive 3D Entity Inspector card giving meaning, real-time stats, and camera focus for every structure
 * - Live Astronaut operations roster with camera focus, vault evacuation, and tasks
 * - Integrated Mission Decision & Anomaly incident system based on anomalies.json
 * - M.I.L.O. Robot Assistant speech bubble with non-overlapping placement and minimize toggle
 * - Integrated astronomical time scrubber with speed multipliers
 * - Dedicated Mission Sol Evaluation Screen with star ratings, achievements, and friendly coaching
 */

import type { TimeManager } from '../astronomy/TimeManager';
import type { CameraController } from '../interaction/CameraController';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { RoverManager, RoverEntity } from '../rovers/RoverManager';
import type { AstronautManager, AstronautEntity } from '../actors/AstronautManager';
import { MissionDecisionManager, type MissionAnomaly, type DecisionRecord } from '../simulation/MissionDecisionManager';
import type { BaseLoader, BaseModuleInfo } from '../base/BaseLoader';
import type { CityBuilder, PlacedBuildingInstance } from '../city/CityBuilder';
import { BUILDING_LIST } from '../city/BuildingCatalog';
import { soundSystem } from '../audio/SoundSystem';
import { MILOExpertPanel } from './MILOExpertPanel';
import type { SolarEphemeris, CelestialTimeState } from '../core/types';
import * as THREE from 'three';

export interface HUDControllerOptions {
  timeManager: TimeManager;
  cameraController: CameraController;
  simEngine: SimulationEngine;
  roverManager: RoverManager;
  astronautManager?: AstronautManager;
  decisionManager?: MissionDecisionManager;
  cityBuilder?: CityBuilder;
  baseLoader?: BaseLoader;
  containerId?: string;
}

export class HUDController {
  private timeManager: TimeManager;
  private cameraController: CameraController;
  private simEngine: SimulationEngine;
  private roverManager: RoverManager;
  private astronautManager?: AstronautManager;
  private decisionManager?: MissionDecisionManager;
  private cityBuilder?: CityBuilder;
  public baseLoader?: BaseLoader;
  private container: HTMLElement;

  private topBarEl!: HTMLElement;
  private leftTelemetryEl!: HTMLElement;
  private rightControlsEl!: HTMLElement;
  private inspectorEl!: HTMLElement;
  private incidentModalEl!: HTMLElement;
  private solEvalModalEl!: HTMLElement;
  private crisisBannerEl!: HTMLElement;
  private cityDockEl!: HTMLElement;
  public miloExpertPanel!: MILOExpertPanel;
  private miloBubbleEl!: HTMLElement;
  private miloTextEl!: HTMLElement;
  private cachedMiloMessage: string =
    'Welcome to Shackleton Crater, Captain! Select structures from the dock below to expand our moon base!';
  private isMiloCollapsed: boolean = false;

  // Cached dynamic elements in Top Bar
  private solBadgeEl!: HTMLElement;
  private lightingBadgeEl!: HTMLElement;
  private speedValEl!: HTMLElement;

  // Top Bar kid resource elements
  private resMaterialsEl!: HTMLElement;
  private resPowerEl!: HTMLElement;
  private resCrewEl!: HTMLElement;
  private resFoodEl!: HTMLElement;
  private resWaterEl!: HTMLElement;
  private resO2El!: HTMLElement;
  private resHealthTopEl!: HTMLElement;
  private resMoraleEl!: HTMLElement;
  private resScoreEl!: HTMLElement;

  // Status pills in Top Bar
  private pillMaterialsEl!: HTMLElement;
  private pillPowerEl!: HTMLElement;
  private pillO2El!: HTMLElement;
  private pillWaterEl!: HTMLElement;
  private pillFoodEl!: HTMLElement;
  private pillHealthEl!: HTMLElement;
  private pillMoraleEl!: HTMLElement;


  // Left Telemetry Panel elements
  private telPower!: HTMLElement;
  private telHealth!: HTMLElement;
  private telO2!: HTMLElement;
  private telStoredO2!: HTMLElement;
  private telCO2!: HTMLElement;
  private telTemp!: HTMLElement;
  private telWater!: HTMLElement;
  private telFood!: HTMLElement;
  private telRad!: HTMLElement;
  private telShield!: HTMLElement;
  private telDust!: HTMLElement;
  private telShelter!: HTMLElement;

  // Telemetry status pills
  private telPillPower!: HTMLElement;
  private telPillHealth!: HTMLElement;
  private telPillO2!: HTMLElement;
  private telPillStoredO2!: HTMLElement;
  private telPillCO2!: HTMLElement;
  private telPillTemp!: HTMLElement;
  private telPillWater!: HTMLElement;
  private telPillFood!: HTMLElement;
  private telPillRad!: HTMLElement;
  private telPillShield!: HTMLElement;
  private telPillDust!: HTMLElement;
  private telPillShelter!: HTMLElement;

  // Bottom Scrubber & Multipliers
  private scrubberInput!: HTMLInputElement;
  private speedButtons: Map<number, HTMLButtonElement> = new Map();
  private isUserScrubbing: boolean = false;

  // Right Panel Tabs
  private activeRightTab: 'astronauts' | 'rovers' | 'presets' = 'astronauts';
  private rightContentEl!: HTMLElement;
  private cachedSpeedBeforeIncident: number = 1.0;

  // City builder dock state
  private activeCategory: 'living' | 'power' | 'life_support' | 'spaceport' | 'rovers' = 'living';
  private cardButtons: Map<string, HTMLButtonElement> = new Map();
  private btnBulldoze!: HTMLButtonElement;
  private btnRotate!: HTMLButtonElement;
  private btnSound!: HTMLButtonElement;
  public selectedBuildingInstance: PlacedBuildingInstance | null = null;

  constructor(options: HUDControllerOptions) {
    this.timeManager = options.timeManager;
    this.cameraController = options.cameraController;
    this.simEngine = options.simEngine;
    this.roverManager = options.roverManager;
    this.astronautManager = options.astronautManager;
    this.decisionManager = options.decisionManager;
    this.cityBuilder = options.cityBuilder;
    this.baseLoader = options.baseLoader;

    const id = options.containerId ?? 'hud-overlay';
    const found = document.getElementById(id);
    if (!found) {
      throw new Error(`HUD container #${id} not found in DOM`);
    }
    this.container = found;

    this.mount();
  }

  public setCityBuilder(cb: CityBuilder): void {
    this.cityBuilder = cb;
    this.bindCityBuilderEvents();
  }

  public setAstronautManager(am: AstronautManager): void {
    this.astronautManager = am;
    this.renderRightTabContent();
  }

  public setDecisionManager(dm: MissionDecisionManager): void {
    this.decisionManager = dm;
    this.decisionManager.onDecision((record) => {
      this.showDecisionOutcomeToast(record);
    });
  }

  private mount(): void {
    this.container.innerHTML = '';

    // 1. Top Bar: Playful header ribbon with two clean rows (Row 1: Nav/Actions, Row 2: Scrollable Vitals)
    this.topBarEl = document.createElement('div');
    this.topBarEl.id = 'hud-top-bar';
    this.topBarEl.style.cssText = `
      position: absolute; top: 10px; left: 14px; right: 14px;
      height: 84px; max-height: 84px; overflow: hidden;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%);
      border: 2.5px solid rgba(56, 189, 248, 0.5);
      border-radius: 18px;
      padding: 6px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.25);
      user-select: none;
      pointer-events: auto;
      z-index: 30;
      display: flex; flex-direction: column; justify-content: space-between;
      box-sizing: border-box;
    `;

    // 2. Crisis Alert Banner (permanently disabled & hidden per user request)
    this.crisisBannerEl = document.createElement('div');
    this.crisisBannerEl.id = 'hud-crisis-banner';
    this.crisisBannerEl.style.cssText = `
      position: absolute; top: 96px; left: 50%; transform: translateX(-50%);
      width: 90%; max-width: 680px;
      display: none !important;
      pointer-events: none;
    `;

    // 3. Left Panel: ECLSS Telemetry Monitors (compact, clamped strictly between Top Bar & Dock)
    this.leftTelemetryEl = document.createElement('div');
    this.leftTelemetryEl.id = 'hud-telemetry-panel';
    this.leftTelemetryEl.style.cssText = `
      position: absolute; top: 96px; left: 14px; width: 270px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.94) 100%);
      border: 2.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 18px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      backdrop-filter: blur(12px);
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      pointer-events: auto;
      display: none;
      z-index: 20;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 18px rgba(56, 189, 248, 0.2);
      box-sizing: border-box;
    `;

    // 4. Right Panel: Astronauts, Rovers & Sector Presets (clamped strictly between Top Bar & Dock)
    this.rightControlsEl = document.createElement('div');
    this.rightControlsEl.id = 'hud-controls-panel';
    this.rightControlsEl.style.cssText = `
      position: absolute; top: 96px; right: 14px; width: 280px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.94) 100%);
      border: 2.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 18px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      backdrop-filter: blur(12px);
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      pointer-events: auto;
      display: none;
      z-index: 20;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 18px rgba(56, 189, 248, 0.2);
      box-sizing: border-box;
    `;

    // 5. Inspector Panel: Anchored in Left Sidebar, clamped strictly between Top Bar & Dock
    this.inspectorEl = document.createElement('div');
    this.inspectorEl.id = 'hud-inspector-card';
    this.inspectorEl.style.cssText = `
      position: absolute; top: 96px; left: 14px; width: 270px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 30, 50, 0.96) 100%);
      border: 2.5px solid #22c55e;
      border-radius: 18px;
      padding: 14px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(34, 197, 94, 0.45);
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      display: none;
      pointer-events: auto;
      z-index: 25;
      animation: kid-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-sizing: border-box;
    `;

    // 6. M.I.L.O. Assistant Speech Bubble (internal fallback)
    this.miloBubbleEl = document.createElement('div');
    this.miloBubbleEl.id = 'hud-milo-bubble';
    this.miloBubbleEl.style.display = 'none';

    // 6b. M.I.L.O. NASA Expert Knowledge Panel in Bottom Right
    this.miloExpertPanel = new MILOExpertPanel(
      this.container,
      () => ({
        oxygenPct: this.simEngine.state.oxygen,
        powerKwh: this.simEngine.state.power,
        storedO2: this.simEngine.state.stored_o2,
        radiationLevel: this.simEngine.state.radiation,
        shieldingPct: this.simEngine.state.shield,
        temperatureC: this.simEngine.state.temperature,
        materials: this.simEngine.state.materials,
      }),
      (isOpen: boolean) => {
        const topBtn = this.topBarEl?.querySelector('#btn-toggle-milo') as HTMLButtonElement | null;
        if (topBtn) topBtn.style.background = isOpen ? '#0284c7' : '#1e293b';
      }
    );

    // 7. City Builder Centered Bottom Dock (Spacious, comfortable, cards never cut off)
    this.cityDockEl = document.createElement('div');
    this.cityDockEl.id = 'hud-city-builder-dock';
    this.cityDockEl.style.cssText = `
      position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
      width: min(1180px, calc(100vw - 28px));
      height: 198px; min-height: 198px; max-height: 205px;
      background: linear-gradient(135deg, rgba(10, 18, 32, 0.96) 0%, rgba(20, 30, 50, 0.94) 100%);
      border: 2.5px solid rgba(56, 189, 248, 0.5);
      border-radius: 20px;
      padding: 8px 14px;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.25);
      pointer-events: auto;
      z-index: 20;
      box-sizing: border-box;
      display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden;
    `;

    // 8. Incident Decision Modal Overlay (mounted into body/container)
    this.incidentModalEl = document.createElement('div');
    this.incidentModalEl.id = 'hud-incident-modal';
    this.incidentModalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: none; justify-content: center; align-items: center;
      z-index: 1000;
      pointer-events: auto;
    `;

    // 9. Dedicated Mission Sol Evaluation Screen Modal
    this.solEvalModalEl = document.createElement('div');
    this.solEvalModalEl.id = 'hud-sol-eval-modal';
    this.solEvalModalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: none; justify-content: center; align-items: center;
      z-index: 1001;
      pointer-events: auto;
    `;

    this.container.appendChild(this.topBarEl);
    // Red alert / crisis banner removed per user request: omitted from DOM
    this.container.appendChild(this.leftTelemetryEl);
    this.container.appendChild(this.rightControlsEl);
    this.container.appendChild(this.inspectorEl);
    this.container.appendChild(this.miloBubbleEl);
    this.container.appendChild(this.cityDockEl);
    this.container.appendChild(this.incidentModalEl);
    this.container.appendChild(this.solEvalModalEl);

    this.setupTopBar();
    this.setupCrisisBanner();
    this.setupLeftTelemetry();
    this.setupRightControls();
    this.setupMiloBubble();
    this.setupCityDock();

    this.positionInspector();
    this.positionMilo();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.positionInspector();
        this.positionMilo();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.deselectAll();
        }
      });
    }

    if (this.cityBuilder) {
      this.bindCityBuilderEvents();
    }
  }

  private setupTopBar(): void {
    this.topBarEl.innerHTML = `
      <!-- Row 1: Logo & Sol Time (Left) + Tactile Arcade Controls & Toggles (Right) -->
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; height:32px; gap:8px;">
        <!-- Left: Cheerful Logo & Sol Time -->
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <span style="font-size:15px; font-weight:800; color:#38bdf8; letter-spacing:0.5px; text-shadow:0 0 10px rgba(56,189,248,0.5); white-space:nowrap;">
            🚀 MOON BASE
          </span>
          <span id="hud-sol-badge" style="background:rgba(56,189,248,0.22); color:#7dd3fc; border:1px solid rgba(56,189,248,0.45); padding:2px 8px; border-radius:9999px; font-size:11.5px; font-weight:800; font-family:monospace; box-shadow:0 2px 6px rgba(0,0,0,0.3); white-space:nowrap;">
            📅 SOL 1 | 06.0h
          </span>
          <span id="hud-lighting-badge" style="color:#fbbf24; background:rgba(251,191,36,0.18); border:1px solid #fbbf24; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap;">
            ☀️ POLAR DAY
          </span>
        </div>

        <!-- Right: Tactile Arcade Controls & Toggles -->
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
          <span style="font-family:monospace; background:rgba(15,23,42,0.6); padding:2px 7px; border-radius:8px; border:1px solid rgba(56,189,248,0.25); font-size:11px; white-space:nowrap;">
            SPD: <b id="hud-speed-val" style="color:#38bdf8;">1x</b>
          </span>
          <button id="btn-toggle-tel" class="kid-arcade-btn" style="background:#1e293b; color:#fff; border:1.5px solid #38bdf8; padding:4px 8px; border-radius:9px; font-size:11px; font-weight:700;" title="Toggle ECLSS Telemetry Vitals">📊 Vitals</button>
          <button id="btn-toggle-ctrl" class="kid-arcade-btn" style="background:#1e293b; color:#fff; border:1.5px solid #38bdf8; padding:4px 8px; border-radius:9px; font-size:11px; font-weight:700;" title="Toggle Artemis Crew & Fleet Operations">🧑‍🚀 Base Ops</button>
          <button id="btn-trigger-anom" class="kid-arcade-btn" style="background:linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color:#fff; border:1.5px solid #a855f7; padding:4px 9px; border-radius:9px; font-size:11px; font-weight:bold; box-shadow:0 2px 6px rgba(124,58,237,0.35);" title="Test / Trigger Mission Anomaly Incident">⚠️ Decisions</button>
          <button id="btn-open-sol-eval" class="kid-arcade-btn" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#fff; border:1.5px solid #fbbf24; padding:4px 9px; border-radius:9px; font-size:11px; font-weight:bold; box-shadow:0 2px 6px rgba(245,158,11,0.35);" title="Open Sol Mission Evaluation Report">⭐ Sol Report</button>
          <button id="btn-toggle-milo" class="kid-arcade-btn" style="background:#0284c7; color:#fff; border:1.5px solid #38bdf8; padding:4px 8px; border-radius:9px; font-size:11px; font-weight:700;" title="Toggle M.I.L.O. Assistant Bubble">🤖 M.I.L.O.</button>
        </div>
      </div>

      <!-- Row 2: Kid-Friendly Resource Ribbon (Horizontal scroll strip, never wraps) -->
      <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:700; width:100%; height:32px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; white-space:nowrap; -webkit-overflow-scrolling:touch; padding-bottom:2px;">
        <!-- Materials 🧱 -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(234,179,8,0.18); border:2px solid #eab308; padding:2px 8px; border-radius:12px; color:#fef08a; flex-shrink:0;" title="Materials for building new lunar structures">
          <span style="font-size:14px;">🧱</span>
          <span id="res-materials" style="font-weight:800; font-size:12px;">800</span>
          <span id="pill-materials" style="font-size:9.5px; background:rgba(234,179,8,0.35); color:#fef08a; padding:1px 5px; border-radius:9999px; font-weight:700;">Rich</span>
        </div>

        <!-- Power ⚡ -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(56,189,248,0.18); border:2px solid #38bdf8; padding:2px 8px; border-radius:12px; color:#bae6fd; flex-shrink:0;" title="Power stored in solar batteries">
          <span style="font-size:14px;">⚡</span>
          <span id="res-power" style="font-weight:800; font-size:12px;">850 kWh</span>
          <span id="pill-power" style="font-size:9.5px; background:rgba(56,189,248,0.35); color:#bae6fd; padding:1px 5px; border-radius:9999px; font-weight:700;">Charged</span>
        </div>

        <!-- Oxygen 🌬️ -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(20,184,166,0.18); border:2px solid #14b8a6; padding:2px 8px; border-radius:12px; color:#99f6e4; flex-shrink:0;" title="Cabin atmospheric oxygen">
          <span style="font-size:14px;">🌬️</span>
          <span id="res-o2" style="font-weight:800; font-size:12px;">20.9%</span>
          <span id="pill-o2" style="font-size:9.5px; background:rgba(20,184,166,0.35); color:#99f6e4; padding:1px 5px; border-radius:9999px; font-weight:700;">Fresh</span>
        </div>

        <!-- Water 💧 -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(14,165,233,0.18); border:2px solid #0ea5e9; padding:2px 8px; border-radius:12px; color:#7dd3fc; flex-shrink:0;" title="Clean drinking water">
          <span style="font-size:14px;">💧</span>
          <span id="res-water" style="font-weight:800; font-size:12px;">60</span>
          <span id="pill-water" style="font-size:9.5px; background:rgba(14,165,233,0.35); color:#7dd3fc; padding:1px 5px; border-radius:9999px; font-weight:700;">Pure</span>
        </div>

        <!-- Food 🥦 -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(34,197,94,0.18); border:2px solid #22c55e; padding:2px 8px; border-radius:12px; color:#bbf7d0; flex-shrink:0;" title="Hydroponic greenhouse crops">
          <span style="font-size:14px;">🥦</span>
          <span id="res-food" style="font-weight:800; font-size:12px;">30</span>
          <span id="pill-food" style="font-size:9.5px; background:rgba(34,197,94,0.35); color:#bbf7d0; padding:1px 5px; border-radius:9999px; font-weight:700;">Yum</span>
        </div>

        <!-- Crew Health ❤️ -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(244,63,94,0.18); border:2px solid #f43f5e; padding:2px 8px; border-radius:12px; color:#fecdd3; flex-shrink:0;" title="Astronaut crew physical health">
          <span style="font-size:14px;">❤️</span>
          <span id="res-health-top" style="font-weight:800; font-size:12px;">100%</span>
          <span id="pill-health" style="font-size:9.5px; background:rgba(244,63,94,0.35); color:#fecdd3; padding:1px 5px; border-radius:9999px; font-weight:700;">Safe</span>
        </div>

        <!-- Astronaut Crew 🧑‍🚀 -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(168,85,247,0.18); border:2px solid #a855f7; padding:2px 8px; border-radius:12px; color:#e9d5ff; flex-shrink:0;" title="Astronaut crew capacity">
          <span style="font-size:14px;">🧑‍🚀</span>
          <span id="res-crew" style="font-weight:800; font-size:12px;">4/8</span>
        </div>

        <!-- Morale 😊 -->
        <div class="kid-resource-capsule" style="display:inline-flex; align-items:center; gap:5px; background:rgba(236,72,153,0.18); border:2px solid #ec4899; padding:2px 8px; border-radius:12px; color:#fbcfe8; flex-shrink:0;" title="Astronaut happiness and spirits">
          <span style="font-size:14px;">😊</span>
          <span id="res-morale" style="font-weight:800; font-size:12px;">95%</span>
          <span id="pill-morale" style="font-size:9.5px; background:rgba(236,72,153,0.35); color:#fbcfe8; padding:1px 5px; border-radius:9999px; font-weight:700;">Happy</span>
        </div>

        <!-- Mission Trophy Rating 🏆 -->
        <div id="hud-trophy-badge" class="kid-resource-capsule kid-arcade-btn" style="display:inline-flex; align-items:center; gap:5px; background:rgba(245,158,11,0.25); border:2px solid #f59e0b; padding:2px 8px; border-radius:12px; color:#fde68a; cursor:pointer; flex-shrink:0;" title="Click for Sol Mission Evaluation Report!">
          <span style="font-size:14px;">🏆</span>
          <span id="res-score" style="font-weight:800; font-size:12px;">85%</span>
          <span style="font-size:9.5px; background:rgba(245,158,11,0.45); color:#fef08a; padding:1px 5px; border-radius:9999px; font-weight:800;">⭐ Report</span>
        </div>
      </div>
    `;

    this.solBadgeEl = this.topBarEl.querySelector('#hud-sol-badge') as HTMLElement;
    this.lightingBadgeEl = this.topBarEl.querySelector('#hud-lighting-badge') as HTMLElement;
    this.speedValEl = this.topBarEl.querySelector('#hud-speed-val') as HTMLElement;

    this.resMaterialsEl = this.topBarEl.querySelector('#res-materials') as HTMLElement;
    this.resPowerEl = this.topBarEl.querySelector('#res-power') as HTMLElement;
    this.resCrewEl = this.topBarEl.querySelector('#res-crew') as HTMLElement;
    this.resFoodEl = this.topBarEl.querySelector('#res-food') as HTMLElement;
    this.resWaterEl = this.topBarEl.querySelector('#res-water') as HTMLElement;
    this.resO2El = this.topBarEl.querySelector('#res-o2') as HTMLElement;
    this.resHealthTopEl = this.topBarEl.querySelector('#res-health-top') as HTMLElement;
    this.resMoraleEl = this.topBarEl.querySelector('#res-morale') as HTMLElement;
    this.resScoreEl = this.topBarEl.querySelector('#res-score') as HTMLElement;

    this.pillMaterialsEl = this.topBarEl.querySelector('#pill-materials') as HTMLElement;
    this.pillPowerEl = this.topBarEl.querySelector('#pill-power') as HTMLElement;
    this.pillO2El = this.topBarEl.querySelector('#pill-o2') as HTMLElement;
    this.pillWaterEl = this.topBarEl.querySelector('#pill-water') as HTMLElement;
    this.pillFoodEl = this.topBarEl.querySelector('#pill-food') as HTMLElement;
    this.pillHealthEl = this.topBarEl.querySelector('#pill-health') as HTMLElement;
    this.pillMoraleEl = this.topBarEl.querySelector('#pill-morale') as HTMLElement;

    const btnToggleTel = this.topBarEl.querySelector('#btn-toggle-tel') as HTMLButtonElement;
    btnToggleTel.onclick = () => {
      const isVisible = this.leftTelemetryEl.style.display !== 'none';
      this.leftTelemetryEl.style.display = isVisible ? 'none' : 'block';
      btnToggleTel.style.background = isVisible ? '#1e293b' : '#0284c7';
      if (!isVisible) {
        // Close right controls and inspector to prevent panel overlap
        this.rightControlsEl.style.display = 'none';
        this.inspectorEl.style.display = 'none';
        const btnCtrl = this.topBarEl.querySelector('#btn-toggle-ctrl') as HTMLButtonElement | null;
        if (btnCtrl) btnCtrl.style.background = '#1e293b';
      }
      this.positionInspector();
      soundSystem.playSelect();
    };

    const btnToggleCtrl = this.topBarEl.querySelector('#btn-toggle-ctrl') as HTMLButtonElement;
    btnToggleCtrl.onclick = () => {
      const isVisible = this.rightControlsEl.style.display !== 'none';
      this.rightControlsEl.style.display = isVisible ? 'none' : 'block';
      btnToggleCtrl.style.background = isVisible ? '#1e293b' : '#0284c7';
      if (!isVisible) {
        // Close left telemetry and inspector to prevent panel overlap
        this.leftTelemetryEl.style.display = 'none';
        this.inspectorEl.style.display = 'none';
        const btnTel = this.topBarEl.querySelector('#btn-toggle-tel') as HTMLButtonElement | null;
        if (btnTel) btnTel.style.background = '#1e293b';
      }
      this.positionInspector();
      this.positionMilo();
      soundSystem.playSelect();
    };

    const btnTriggerAnom = this.topBarEl.querySelector('#btn-trigger-anom') as HTMLButtonElement;
    btnTriggerAnom.onclick = () => {
      if (this.decisionManager) {
        const candidates = MissionDecisionManager.CANONICAL_ANOMALIES.filter(
          (a) => !this.decisionManager?.resolvedAnomalyIds.has(a.id)
        );
        const nextAnom = candidates.length > 0 ? candidates[0] : MissionDecisionManager.CANONICAL_ANOMALIES[0];
        const timeState = this.timeManager.getState();
        this.decisionManager.triggerAnomaly(nextAnom, timeState.totalHours, timeState.sol);
        this.showIncidentModal(nextAnom);
      }
    };

    const btnOpenSolEval = this.topBarEl.querySelector('#btn-open-sol-eval') as HTMLButtonElement;
    btnOpenSolEval.onclick = () => {
      this.showSolEvaluationModal();
    };

    const trophyBadge = this.topBarEl.querySelector('#hud-trophy-badge') as HTMLElement;
    if (trophyBadge) {
      trophyBadge.onclick = () => {
        this.showSolEvaluationModal();
      };
    }

    const btnToggleMilo = this.topBarEl.querySelector('#btn-toggle-milo') as HTMLButtonElement;
    btnToggleMilo.onclick = () => {
      this.miloExpertPanel.toggle();
      const isOpen = this.miloExpertPanel.isOpen();
      btnToggleMilo.style.background = isOpen ? '#0284c7' : '#1e293b';
      soundSystem.playSelect();
    };
  }

  private setupCrisisBanner(): void {
    if (!this.crisisBannerEl) return;
    this.crisisBannerEl.style.display = 'none';
  }

  private setupLeftTelemetry(): void {
    this.leftTelemetryEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(56,189,248,0.25); padding-bottom:6px; margin-bottom:10px;">
        <span style="font-weight:800; color:#38bdf8; font-size:12px; letter-spacing:0.5px;">📊 BASE VITALS & ECLSS</span>
        <button id="btn-close-tel" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; font-size:14px; cursor:pointer;" title="Close Vitals Panel">✕</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:5px; font-size:11px;">
        <!-- Power -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(56,189,248,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>⚡ <b>POWER:</b> <span id="tel-power" style="color:#7dd3fc; font-weight:bold;">850 kWh</span></div>
          <span id="tel-pill-power" style="font-size:9.5px; background:rgba(56,189,248,0.25); color:#7dd3fc; padding:1px 6px; border-radius:6px; font-weight:700;">⚡ Charged</span>
        </div>

        <!-- Crew Health -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(244,63,94,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>❤️ <b>HEALTH:</b> <span id="tel-health" style="color:#fecdd3; font-weight:bold;">100%</span></div>
          <span id="tel-pill-health" style="font-size:9.5px; background:rgba(239,68,68,0.25); color:#fca5a5; padding:1px 6px; border-radius:6px; font-weight:700;">❤️ Safe</span>
        </div>

        <!-- Cabin O2 -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(20,184,166,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🌬️ <b>CABIN O₂:</b> <span id="tel-o2" style="color:#99f6e4; font-weight:bold;">20.9%</span></div>
          <span id="tel-pill-o2" style="font-size:9.5px; background:rgba(20,184,166,0.25); color:#99f6e4; padding:1px 6px; border-radius:6px; font-weight:700;">🟢 Fresh</span>
        </div>

        <!-- Stored O2 -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(56,189,248,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🛢️ <b>STORED O₂:</b> <span id="tel-stored-o2" style="color:#bae6fd; font-weight:bold;">80 u</span></div>
          <span id="tel-pill-stored-o2" style="font-size:9.5px; background:rgba(56,189,248,0.25); color:#bae6fd; padding:1px 6px; border-radius:6px; font-weight:700;">🛡️ Reserve</span>
        </div>

        <!-- CO2 -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(34,197,94,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🫧 <b>CABIN CO₂:</b> <span id="tel-co2" style="color:#bbf7d0; font-weight:bold;">10.0 u</span></div>
          <span id="tel-pill-co2" style="font-size:9.5px; background:rgba(34,197,94,0.25); color:#bbf7d0; padding:1px 6px; border-radius:6px; font-weight:700;">🌿 Clean</span>
        </div>

        <!-- Temp -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🌡️ <b>CABIN TEMP:</b> <span id="tel-temp" style="color:#fef08a; font-weight:bold;">50.0°</span></div>
          <span id="tel-pill-temp" style="font-size:9.5px; background:rgba(245,158,11,0.25); color:#fef08a; padding:1px 6px; border-radius:6px; font-weight:700;">🛋️ Cozy</span>
        </div>

        <!-- Water -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(14,165,233,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>💧 <b>WATER:</b> <span id="tel-water" style="color:#7dd3fc; font-weight:bold;">60 u</span></div>
          <span id="tel-pill-water" style="font-size:9.5px; background:rgba(14,165,233,0.25); color:#7dd3fc; padding:1px 6px; border-radius:6px; font-weight:700;">💧 Pure</span>
        </div>

        <!-- Food -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(34,197,94,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🥦 <b>CROPS:</b> <span id="tel-food" style="color:#bbf7d0; font-weight:bold;">30 u</span></div>
          <span id="tel-pill-food" style="font-size:9.5px; background:rgba(34,197,94,0.25); color:#bbf7d0; padding:1px 6px; border-radius:6px; font-weight:700;">🥦 Fresh</span>
        </div>

        <!-- Radiation -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>☀️ <b>RADIATION:</b> <span id="tel-rad" style="color:#fca5a5; font-weight:bold;">5.0</span></div>
          <span id="tel-pill-rad" style="font-size:9.5px; background:rgba(34,197,94,0.25); color:#bbf7d0; padding:1px 6px; border-radius:6px; font-weight:700;">🛡️ Safe</span>
        </div>

        <!-- Shield -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(168,85,247,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🧱 <b>SHIELDING:</b> <span id="tel-shield" style="color:#e9d5ff; font-weight:bold;">70%</span></div>
          <span id="tel-pill-shield" style="font-size:9.5px; background:rgba(168,85,247,0.25); color:#e9d5ff; padding:1px 6px; border-radius:6px; font-weight:700;">🧱 Berms</span>
        </div>

        <!-- Dust -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(56,189,248,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>✨ <b>PANEL DUST:</b> <span id="tel-dust" style="color:#bae6fd; font-weight:bold;">0.0%</span></div>
          <span id="tel-pill-dust" style="font-size:9.5px; background:rgba(56,189,248,0.25); color:#bae6fd; padding:1px 6px; border-radius:6px; font-weight:700;">✨ Clean</span>
        </div>

        <!-- Shelter -->
        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(34,197,94,0.2); border-radius:10px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
          <div>🏠 <b>SHELTER:</b> <span id="tel-shelter" style="color:#a7f3d0; font-weight:bold;">SURFACE</span></div>
          <span id="tel-pill-shelter" style="font-size:9.5px; background:rgba(34,197,94,0.25); color:#a7f3d0; padding:1px 6px; border-radius:6px; font-weight:700;">🚀 Outpost</span>
        </div>
      </div>
    `;

    this.telPower = this.leftTelemetryEl.querySelector('#tel-power') as HTMLElement;
    this.telHealth = this.leftTelemetryEl.querySelector('#tel-health') as HTMLElement;
    this.telO2 = this.leftTelemetryEl.querySelector('#tel-o2') as HTMLElement;
    this.telStoredO2 = this.leftTelemetryEl.querySelector('#tel-stored-o2') as HTMLElement;
    this.telCO2 = this.leftTelemetryEl.querySelector('#tel-co2') as HTMLElement;
    this.telTemp = this.leftTelemetryEl.querySelector('#tel-temp') as HTMLElement;
    this.telWater = this.leftTelemetryEl.querySelector('#tel-water') as HTMLElement;
    this.telFood = this.leftTelemetryEl.querySelector('#tel-food') as HTMLElement;
    this.telRad = this.leftTelemetryEl.querySelector('#tel-rad') as HTMLElement;
    this.telShield = this.leftTelemetryEl.querySelector('#tel-shield') as HTMLElement;
    this.telDust = this.leftTelemetryEl.querySelector('#tel-dust') as HTMLElement;
    this.telShelter = this.leftTelemetryEl.querySelector('#tel-shelter') as HTMLElement;

    this.telPillPower = this.leftTelemetryEl.querySelector('#tel-pill-power') as HTMLElement;
    this.telPillHealth = this.leftTelemetryEl.querySelector('#tel-pill-health') as HTMLElement;
    this.telPillO2 = this.leftTelemetryEl.querySelector('#tel-pill-o2') as HTMLElement;
    this.telPillStoredO2 = this.leftTelemetryEl.querySelector('#tel-pill-stored-o2') as HTMLElement;
    this.telPillCO2 = this.leftTelemetryEl.querySelector('#tel-pill-co2') as HTMLElement;
    this.telPillTemp = this.leftTelemetryEl.querySelector('#tel-pill-temp') as HTMLElement;
    this.telPillWater = this.leftTelemetryEl.querySelector('#tel-pill-water') as HTMLElement;
    this.telPillFood = this.leftTelemetryEl.querySelector('#tel-pill-food') as HTMLElement;
    this.telPillRad = this.leftTelemetryEl.querySelector('#tel-pill-rad') as HTMLElement;
    this.telPillShield = this.leftTelemetryEl.querySelector('#tel-pill-shield') as HTMLElement;
    this.telPillDust = this.leftTelemetryEl.querySelector('#tel-pill-dust') as HTMLElement;
    this.telPillShelter = this.leftTelemetryEl.querySelector('#tel-pill-shelter') as HTMLElement;

    const btnCloseTel = this.leftTelemetryEl.querySelector('#btn-close-tel') as HTMLButtonElement;
    btnCloseTel.onclick = () => {
      this.leftTelemetryEl.style.display = 'none';
      const topBtn = this.topBarEl.querySelector('#btn-toggle-tel') as HTMLButtonElement;
      if (topBtn) topBtn.style.background = '#1e293b';
      this.positionInspector();
      soundSystem.playSelect();
    };
  }

  private setupRightControls(): void {
    this.rightControlsEl.innerHTML = `
      <!-- Right Panel Header Tabs -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(56,189,248,0.25); padding-bottom:8px; margin-bottom:10px;">
        <div style="display:flex; gap:6px;">
          <button class="right-tab-btn kid-arcade-btn" data-tab="astronauts" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">🧑‍🚀 Crew</button>
          <button class="right-tab-btn kid-arcade-btn" data-tab="rovers" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:5px 10px; border-radius:10px; font-size:11.5px; cursor:pointer;">🚜 Fleet</button>
          <button class="right-tab-btn kid-arcade-btn" data-tab="presets" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:5px 10px; border-radius:10px; font-size:11.5px; cursor:pointer;">🎯 Jump Cam</button>
        </div>
        <button id="btn-close-ctrl" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:14px;">✕</button>
      </div>

      <div id="right-tab-content"></div>
    `;

    const closeBtn = this.rightControlsEl.querySelector('#btn-close-ctrl') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.rightControlsEl.style.display = 'none';
      const topBtn = this.topBarEl.querySelector('#btn-toggle-ctrl') as HTMLButtonElement;
      if (topBtn) topBtn.style.background = '#1e293b';
      this.positionInspector();
      this.positionMilo();
      soundSystem.playSelect();
    };

    const tabButtons = this.rightControlsEl.querySelectorAll<HTMLButtonElement>('.right-tab-btn');
    tabButtons.forEach((tab) => {
      tab.onclick = () => {
        tabButtons.forEach((t) => {
          t.style.background = '#1e293b';
          t.style.color = '#94a3b8';
          t.style.border = '1px solid #334155';
        });
        tab.style.background = '#0284c7';
        tab.style.color = '#fff';
        tab.style.border = 'none';

        this.activeRightTab = tab.dataset.tab as typeof this.activeRightTab;
        soundSystem.playSelect();
        this.renderRightTabContent();
      };
    });

    this.rightContentEl = this.rightControlsEl.querySelector('#right-tab-content') as HTMLElement;
    this.renderRightTabContent();
  }

  private renderRightTabContent(): void {
    if (!this.rightContentEl) return;

    if (this.activeRightTab === 'astronauts') {
      const astros = this.astronautManager?.getAllAstronauts() ?? [];
      this.rightContentEl.innerHTML = `
        <div style="font-size:11.5px; font-weight:800; color:#94a3b8; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>ACTIVE CREW (${astros.length})</span>
          <button id="btn-crew-vault" class="kid-arcade-btn" style="background:linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color:#fff; border:1px solid #a855f7; padding:4px 10px; border-radius:10px; font-size:10.5px; cursor:pointer; font-weight:800; box-shadow:0 2px 6px rgba(124,58,237,0.4);">
            🛡️ Vault Evac
          </button>
        </div>
        <div style="display:flex; flex-direction:column; gap:7px; max-height:220px; overflow-y:auto; padding-right:2px;">
          ${astros.map((a) => `
            <div style="background:rgba(30,41,59,0.75); border:1.5px solid rgba(56,189,248,0.25); border-radius:12px; padding:8px 10px; transition:border-color 0.15s;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <b style="font-size:12px; color:#38bdf8;">🧑‍🚀 ${a.name}</b>
                <button class="btn-focus-astro kid-arcade-btn" data-id="${a.id}" style="background:#0284c7; color:#fff; border:none; padding:3px 8px; border-radius:8px; font-size:10px; cursor:pointer; font-weight:700;">🔍 Focus</button>
              </div>
              <div style="font-size:10.5px; color:#cbd5e1; margin-bottom:2px;">${a.role} • <span style="color:#10b981; font-weight:bold;">${a.status.toUpperCase()}</span></div>
              <div style="font-size:10px; color:#94a3b8; line-height:1.3;">"${a.currentTask}"</div>
            </div>
          `).join('')}
        </div>
      `;

      const btnVault = this.rightContentEl.querySelector('#btn-crew-vault') as HTMLButtonElement;
      if (btnVault) {
        btnVault.onclick = () => {
          if (this.astronautManager) {
            const firstAstro = this.astronautManager.getAllAstronauts()[0];
            if (firstAstro?.isSheltered) {
              this.astronautManager.commandExitShelter();
              btnVault.textContent = '🛡️ Vault Evac';
              btnVault.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
              this.setMiloMessage('Astronauts cleared radiation shelter and resumed surface exploration!');
            } else {
              this.astronautManager.commandShelterAll();
              btnVault.textContent = '🚪 Exit Vault';
              btnVault.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
              this.setMiloMessage('General evacuation: all astronauts sheltered safely in the storm vault!');
            }
            soundSystem.playPlace();
            this.renderRightTabContent();
          }
        };
      }

      this.rightContentEl.querySelectorAll<HTMLButtonElement>('.btn-focus-astro').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          if (id && this.astronautManager) {
            const astro = this.astronautManager.getAstronaut(id);
            if (astro) {
              this.astronautManager.selectAstronaut(id);
              this.cameraController.focusOn(astro.mesh.position, 8.0, 3.5);
              soundSystem.playSelect();
              this.showAstronautInspector(astro);
            }
          }
        };
      });
    } else if (this.activeRightTab === 'rovers') {
      const roversList = Array.from(this.roverManager.rovers.values());
      this.rightContentEl.innerHTML = `
        <div style="font-size:11.5px; font-weight:800; color:#94a3b8; margin-bottom:8px;">LUNAR FLEET (${roversList.length})</div>
        <div style="display:flex; flex-direction:column; gap:7px; max-height:160px; overflow-y:auto; margin-bottom:10px; padding-right:2px;">
          ${roversList.map((r) => `
            <div style="background:rgba(30,41,59,0.75); border:1.5px solid rgba(56,189,248,0.25); border-radius:12px; padding:8px 10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <b style="font-size:12px; color:#38bdf8;">🚜 ${r.name}</b>
                <button class="btn-focus-rover kid-arcade-btn" data-id="${r.id}" style="background:#0284c7; color:#fff; border:none; padding:3px 8px; border-radius:8px; font-size:10px; cursor:pointer; font-weight:700;">🔍 Focus</button>
              </div>
              <div style="font-size:10.5px; color:#cbd5e1; margin-bottom:2px;">🔋 Battery: ${r.batteryPct.toFixed(0)}% • <span style="color:#10b981; font-weight:bold;">${r.status.toUpperCase()}</span></div>
              <div style="font-size:10px; color:#94a3b8;">Task: ${r.currentTask} • ${r.totalDistanceTraversedM.toFixed(0)}m</div>
            </div>
          `).join('')}
        </div>
        <div style="font-size:11px; font-weight:800; color:#94a3b8; margin-bottom:6px;">FLEET COMMANDS:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <button id="btn-rover-clean" class="kid-arcade-btn" style="background:#0284c7; color:#fff; border:none; border-radius:10px; padding:7px; cursor:pointer; font-weight:800; font-size:11px;">
            🧹 Clean Panels
          </button>
          <button id="btn-rover-survey" class="kid-arcade-btn" style="background:#0f766e; color:#fff; border:none; border-radius:10px; padding:7px; cursor:pointer; font-weight:800; font-size:11px;">
            🔭 Scout Rim
          </button>
          <button id="btn-rover-return" class="kid-arcade-btn" style="background:#475569; color:#fff; border:none; border-radius:10px; padding:7px; cursor:pointer; font-size:11px; font-weight:700;">
            🏠 Return Base
          </button>
          <button id="btn-rover-follow" class="kid-arcade-btn" style="background:#1e293b; color:#7dd3fc; border:1.5px solid #0284c7; border-radius:10px; padding:7px; cursor:pointer; font-size:11px; font-weight:700;">
            🎥 3rd-Person
          </button>
        </div>
      `;

      this.rightContentEl.querySelectorAll<HTMLButtonElement>('.btn-focus-rover').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          if (id) {
            const rover = this.roverManager.getRover(id);
            if (rover) {
              this.cameraController.focusOn(rover.mesh.position, 10.0, 4.0);
              soundSystem.playSelect();
              this.showRoverInspector(rover);
            }
          }
        };
      });

      const btnClean = this.rightContentEl.querySelector('#btn-rover-clean') as HTMLButtonElement;
      btnClean.onclick = () => {
        this.roverManager.dispatchCleanSolarArrays();
        this.simEngine.cleanSolarPanels();
        soundSystem.playPlace();
        this.setMiloMessage('LRV dispatched to sweep dust from solar arrays!');
      };

      const btnSurvey = this.rightContentEl.querySelector('#btn-rover-survey') as HTMLButtonElement;
      btnSurvey.onclick = () => {
        this.roverManager.dispatch('ROV-SURVEY', new THREE.Vector3(-60, 0, 50), 'survey');
        soundSystem.playSelect();
        this.setMiloMessage('Survey rover en route to the crater rim for geological prospecting!');
      };

      const btnReturn = this.rightContentEl.querySelector('#btn-rover-return') as HTMLButtonElement;
      btnReturn.onclick = () => {
        this.roverManager.returnAllRovers();
        soundSystem.playSelect();
        this.setMiloMessage('Recalling all rovers to the central habitat docking berths.');
      };

      const btnFollow = this.rightContentEl.querySelector('#btn-rover-follow') as HTMLButtonElement;
      btnFollow.onclick = () => {
        const rover = this.roverManager.getRover('LRV-01');
        if (rover) {
          this.cameraController.setFollowTarget(rover.mesh, 12.0, 4.0);
          soundSystem.playSelect();
          this.setMiloMessage('Locked camera into rover chase mode! Orbit with mouse or click anywhere to exit.');
        }
      };
    } else if (this.activeRightTab === 'presets') {
      this.rightContentEl.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#94a3b8; margin-bottom:8px;">SECTOR CAMERA JUMP:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px;">
          <button id="cam-orbit" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">🏠 Hab Dome</button>
          <button id="cam-greenhouse" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">🌿 Greenhouse</button>
          <button id="cam-solar" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">⚡ Power Yard</button>
          <button id="cam-pad" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">🚀 Sintered Pad</button>
          <button id="cam-rim" class="kid-arcade-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700; grid-column:span 2;">🔭 Shackleton Crater Rim Vista</button>
        </div>
        <div style="background:rgba(56,189,248,0.1); border:1.5px solid rgba(56,189,248,0.3); border-radius:12px; padding:10px; font-size:10.5px; color:#bae6fd; line-height:1.45;">
          🧭 <b>Flight Controls for Explorers:</b><br/>
          • <b>WASD / Arrow Keys</b>: Fly across crater<br/>
          • <b>Shift + WASD</b>: Rocket booster speed (60 m/s)<br/>
          • <b>Space / C</b>: Ascend / Descend height<br/>
          • <b>Q / E</b>: Smooth orbit rotation<br/>
          • <b>Scroll / Drag</b>: Zoom & inspect
        </div>
      `;

      this.rightContentEl.querySelector('#cam-orbit')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('central_hab');
        soundSystem.playSelect();
      });
      this.rightContentEl.querySelector('#cam-greenhouse')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('greenhouse');
        soundSystem.playSelect();
      });
      this.rightContentEl.querySelector('#cam-solar')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('power_yard');
        soundSystem.playSelect();
      });
      this.rightContentEl.querySelector('#cam-pad')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('landing_pad');
        soundSystem.playSelect();
      });
      this.rightContentEl.querySelector('#cam-rim')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('rim_horizon');
        soundSystem.playSelect();
      });
    }
  }

  private setupMiloBubble(): void {
    this.renderMiloContent();
  }

  private renderMiloContent(): void {
    if (!this.miloBubbleEl) return;

    if (this.isMiloCollapsed) {
      this.miloBubbleEl.style.width = 'auto';
      this.miloBubbleEl.style.maxWidth = '340px';
      this.miloBubbleEl.style.padding = '6px 12px';
      this.miloBubbleEl.style.borderRadius = '9999px';
      this.miloBubbleEl.style.cursor = 'pointer';
      this.miloBubbleEl.style.display = 'flex';
      this.miloBubbleEl.style.alignItems = 'center';
      this.miloBubbleEl.style.gap = '8px';
      this.miloBubbleEl.onclick = () => {
        this.isMiloCollapsed = false;
        this.renderMiloContent();
        soundSystem.playSelect();
      };

      this.miloBubbleEl.innerHTML = `
        <span style="font-size:18px; animation: kid-milo-bounce 2.5s infinite ease-in-out; flex-shrink:0;">🤖</span>
        <span style="font-size:11px; font-weight:800; color:#38bdf8; flex-shrink:0;">M.I.L.O.</span>
        <span id="milo-speech-text" style="font-size:11px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px;">${this.cachedMiloMessage}</span>
        <button id="btn-expand-milo" class="kid-arcade-btn" style="background:#0284c7; color:#fff; border:none; padding:2px 7px; border-radius:8px; font-size:10px; font-weight:800; cursor:pointer; flex-shrink:0;" title="Expand M.I.L.O. Advice">▲</button>
        <button id="btn-close-milo" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:13px; font-weight:bold; padding:0 3px; flex-shrink:0;" title="Dismiss M.I.L.O.">✕</button>
      `;
      this.miloTextEl = this.miloBubbleEl.querySelector('#milo-speech-text') as HTMLElement;

      const expandBtn = this.miloBubbleEl.querySelector('#btn-expand-milo') as HTMLButtonElement;
      if (expandBtn) {
        expandBtn.onclick = (e) => {
          e.stopPropagation();
          this.isMiloCollapsed = false;
          this.renderMiloContent();
          soundSystem.playSelect();
        };
      }
    } else {
      this.miloBubbleEl.style.width = '320px';
      this.miloBubbleEl.style.maxWidth = 'calc(100vw - 32px)';
      this.miloBubbleEl.style.padding = '10px 14px';
      this.miloBubbleEl.style.borderRadius = '20px';
      this.miloBubbleEl.style.cursor = 'default';
      this.miloBubbleEl.style.display = 'flex';
      this.miloBubbleEl.style.alignItems = 'flex-start';
      this.miloBubbleEl.style.gap = '10px';
      this.miloBubbleEl.onclick = null;

      this.miloBubbleEl.innerHTML = `
        <div style="font-size:28px; animation: kid-milo-bounce 2.5s infinite ease-in-out; filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)); user-select:none; flex-shrink:0;">🤖</div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
            <span style="font-size:12px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">M.I.L.O. Buddy</span>
            <div style="display:flex; gap:4px; align-items:center;">
              <button id="btn-collapse-milo" class="kid-arcade-btn" style="background:rgba(255,255,255,0.1); border:none; color:#cbd5e1; cursor:pointer; font-size:11px; font-weight:bold; padding:2px 7px; border-radius:6px;" title="Collapse into tidy pill">─</button>
              <button id="btn-close-milo" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:13px; font-weight:bold; padding:0 3px;" title="Dismiss speech bubble">✕</button>
            </div>
          </div>
          <div id="milo-speech-text" style="font-size:12px; color:#f1f5f9; line-height:1.4; word-break:break-word;">
            ${this.cachedMiloMessage}
          </div>
        </div>
      `;
      this.miloTextEl = this.miloBubbleEl.querySelector('#milo-speech-text') as HTMLElement;

      const collapseBtn = this.miloBubbleEl.querySelector('#btn-collapse-milo') as HTMLButtonElement;
      if (collapseBtn) {
        collapseBtn.onclick = (e) => {
          e.stopPropagation();
          this.isMiloCollapsed = true;
          this.renderMiloContent();
          soundSystem.playSelect();
        };
      }
    }

    const btnCloseMilo = this.miloBubbleEl.querySelector('#btn-close-milo') as HTMLButtonElement;
    if (btnCloseMilo) {
      btnCloseMilo.onclick = (e) => {
        e.stopPropagation();
        this.miloBubbleEl.style.display = 'none';
        const topBtn = this.topBarEl?.querySelector('#btn-toggle-milo') as HTMLButtonElement | null;
        if (topBtn) topBtn.style.background = '#1e293b';
        soundSystem.playSelect();
      };
    }

    this.positionMilo();
  }

  public setMiloMessage(msg: string): void {
    this.cachedMiloMessage = msg;
    if (this.miloExpertPanel) {
      this.miloExpertPanel.setMessage(msg);
    }
    if (this.miloTextEl) {
      this.miloTextEl.textContent = msg;
    }
  }

  private setupCityDock(): void {
    this.cityDockEl.innerHTML = `
      <!-- Dock Header: Category Tabs & Integrated Time Scrubber & Tools -->
      <div style="display:flex; justify-content:space-between; align-items:center; height:34px; flex-shrink:0; gap:8px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; white-space:nowrap;">
        <!-- Bright, Kid-Friendly Category Tabs (Homes, Energy, Food, Spaceport, Rovers) -->
        <div style="display:inline-flex; gap:6px; flex-shrink:0;">
          <button class="cat-tab kid-arcade-btn" data-cat="living" style="background:#0284c7; color:#fff; border:none; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px; box-shadow:0 2px 6px rgba(2,132,199,0.4);">🏠 Homes</button>
          <button class="cat-tab kid-arcade-btn" data-cat="power" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px;">⚡ Energy</button>
          <button class="cat-tab kid-arcade-btn" data-cat="life_support" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px;">🌿 Food & Air</button>
          <button class="cat-tab kid-arcade-btn" data-cat="spaceport" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px;">🚀 Spaceport</button>
          <button class="cat-tab kid-arcade-btn" data-cat="rovers" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px;">🚜 Rovers</button>
        </div>

        <!-- Integrated Time Controls -->
        <div style="display:inline-flex; align-items:center; gap:5px; background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:10px; padding:2px 6px; flex-shrink:0;">
          <input type="range" id="mission-scrubber" min="0" max="708.73" step="0.1" value="6.0" style="width:90px; cursor:pointer;" aria-label="Mission Time Scrubber" />
          <button data-speed="0" class="kid-arcade-btn" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:5px; cursor:pointer; font-size:10px; font-family:monospace;">⏸️</button>
          <button data-speed="1" class="kid-arcade-btn" style="background:#0284c7; color:#fff; border:none; padding:2px 5px; border-radius:5px; cursor:pointer; font-size:10px; font-family:monospace; font-weight:bold;">1x</button>
          <button data-speed="6" class="kid-arcade-btn" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:5px; cursor:pointer; font-size:10px; font-family:monospace;">6x</button>
          <button data-speed="30" class="kid-arcade-btn" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:5px; cursor:pointer; font-size:10px; font-family:monospace;">30x</button>
          <button data-speed="360" class="kid-arcade-btn" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:5px; cursor:pointer; font-size:10px; font-family:monospace;">360x</button>
        </div>

        <!-- Tool Buttons & Unmistakable Deselect -->
        <div style="display:inline-flex; gap:5px; align-items:center; flex-shrink:0;">
          <button id="btn-rotate" class="kid-arcade-btn" style="background:#334155; color:#fff; border:1px solid #475569; padding:4px 8px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;" title="Rotate placement orientation (R key)">
            🔄 Rotate [R]
          </button>
          <!-- Unmistakable Cancel / Deselect Button -->
          <button id="btn-cancel" class="kid-arcade-btn" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color:#ffffff; border:1.5px solid #f87171; padding:4px 10px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:800; box-shadow:0 2px 8px rgba(239, 68, 68, 0.4);" title="Cancel building placement or deselect (Esc key or Right-Click)">
            ✕ Cancel / Deselect [Esc]
          </button>
          <button id="btn-bulldoze" class="kid-arcade-btn" style="background:linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color:#fff; border:1.5px solid #fb923c; padding:4px 10px; border-radius:10px; cursor:pointer; font-weight:800; font-size:11px; box-shadow:0 2px 6px rgba(234,88,12,0.4);" title="Recycle structures for 70% refund (B key)">
            🚜 Bulldoze
          </button>
          <button id="btn-sound-toggle" class="kid-arcade-btn" style="background:#334155; color:#fff; border:1px solid #475569; padding:4px 7px; border-radius:10px; cursor:pointer; font-size:11px;" title="Mute/Unmute audio synthesis">
            🔊
          </button>
          <button id="btn-toggle-dock" class="kid-arcade-btn" style="background:#0369a1; color:#fff; border:1.5px solid #38bdf8; padding:4px 9px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:800;" title="Collapse/Expand build cards tray">
            ─ Minimise
          </button>
        </div>
      </div>

      <!-- Building Cards Scroll Tray -->
      <div id="city-cards-tray" style="display:flex; gap:12px; overflow-x:auto; overflow-y:hidden; padding:4px 2px 6px 2px; height:130px; min-height:130px; flex-shrink:0; scrollbar-width:thin; box-sizing:border-box;">
        <!-- Injected dynamically by renderBuildingCards() -->
      </div>
    `;

    // Category tab listeners with individual category colors
    const categoryColors: Record<string, string> = {
      living: '#0284c7',
      power: '#f59e0b',
      life_support: '#10b981',
      spaceport: '#8b5cf6',
      rovers: '#ea580c',
    };

    const catTabs = this.cityDockEl.querySelectorAll<HTMLButtonElement>('.cat-tab');
    catTabs.forEach((tab) => {
      tab.onclick = () => {
        catTabs.forEach((t) => {
          t.style.background = '#1e293b';
          t.style.color = '#cbd5e1';
          t.style.border = '1px solid #334155';
          t.style.boxShadow = 'none';
        });

        const cat = (tab.dataset.cat || 'living') as typeof this.activeCategory;
        const color = categoryColors[cat] || '#0284c7';
        tab.style.background = color;
        tab.style.color = '#fff';
        tab.style.border = 'none';
        tab.style.boxShadow = `0 3px 10px ${color}66`;

        this.activeCategory = cat;
        soundSystem.playSelect();
        this.renderBuildingCards();
      };
    });

    // Time Scrubber & Multipliers
    this.scrubberInput = this.cityDockEl.querySelector('#mission-scrubber') as HTMLInputElement;
    this.scrubberInput.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.isUserScrubbing = true;
    });
    this.scrubberInput.addEventListener('input', (e) => {
      e.stopPropagation();
      this.isUserScrubbing = true;
      const targetHours = parseFloat(this.scrubberInput.value);
      this.timeManager.setTime(targetHours);
      const sol = Math.floor(targetHours / 24.0) + 1;
      const hour = targetHours % 24.0;
      this.simEngine.syncTime(sol, hour);
    });
    const onRelease = (e: Event) => {
      e.stopPropagation();
      if (this.isUserScrubbing) {
        this.isUserScrubbing = false;
        const targetHours = parseFloat(this.scrubberInput.value);
        this.timeManager.setTime(targetHours);
        const sol = Math.floor(targetHours / 24.0) + 1;
        const hour = targetHours % 24.0;
        this.simEngine.syncTime(sol, hour);
      }
    };
    this.scrubberInput.addEventListener('pointerup', onRelease);
    this.scrubberInput.addEventListener('change', onRelease);

    const speedButtons = this.cityDockEl.querySelectorAll<HTMLButtonElement>('button[data-speed]');
    speedButtons.forEach((btn) => {
      const speed = parseInt(btn.dataset.speed || '1', 10);
      this.speedButtons.set(speed, btn);
      btn.onclick = () => {
        this.timeManager.setMultiplier(speed);
        soundSystem.playSelect();
      };
    });

    // Tool listeners
    this.btnRotate = this.cityDockEl.querySelector('#btn-rotate') as HTMLButtonElement;
    this.btnRotate.onclick = () => {
      if (this.cityBuilder) {
        this.cityBuilder.rotatePlacement();
      }
    };

    const btnCancel = this.cityDockEl.querySelector('#btn-cancel') as HTMLButtonElement;
    btnCancel.onclick = () => {
      this.deselectAll();
    };

    this.btnBulldoze = this.cityDockEl.querySelector('#btn-bulldoze') as HTMLButtonElement;
    this.btnBulldoze.onclick = () => {
      if (this.cityBuilder) {
        const isB = this.cityBuilder.toggleBulldoze();
        this.btnBulldoze.style.background = isB
          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
        this.btnBulldoze.textContent = isB ? '🚜 Bulldoze Active!' : '🚜 Bulldoze';
        if (isB) {
          this.highlightActiveCard(null);
          this.setMiloMessage('🚜 Bulldoze mode active! Click any placed building to recycle it for 70% materials back!');
        } else {
          this.setMiloMessage('Bulldoze mode closed. Ready to build!');
        }
      }
    };

    this.btnSound = this.cityDockEl.querySelector('#btn-sound-toggle') as HTMLButtonElement;
    this.btnSound.onclick = () => {
      const muted = soundSystem.toggleMute();
      this.btnSound.textContent = muted ? '🔇' : '🔊';
      this.btnSound.style.background = muted ? '#ef4444' : '#334155';
    };

    const btnToggleDock = this.cityDockEl.querySelector('#btn-toggle-dock') as HTMLButtonElement;
    btnToggleDock.onclick = () => {
      const tray = this.cityDockEl.querySelector('#city-cards-tray') as HTMLElement;
      if (!tray) return;
      const isVisible = tray.style.display !== 'none';
      tray.style.display = isVisible ? 'none' : 'flex';
      this.cityDockEl.style.height = isVisible ? '56px' : '198px';
      this.cityDockEl.style.minHeight = isVisible ? '56px' : '198px';
      btnToggleDock.textContent = isVisible ? '▲ Open Dock' : '─ Minimise';
      btnToggleDock.style.background = isVisible ? '#059669' : '#0369a1';
      soundSystem.playSelect();
    };

    this.renderBuildingCards();
  }

  public deselectAll(): void {
    if (this.cityBuilder) {
      this.cityBuilder.cancelAction();
    }
    if (this.astronautManager) {
      this.astronautManager.selectAstronaut(null);
    }
    this.highlightActiveCard(null);
    if (this.btnBulldoze) {
      this.btnBulldoze.style.background = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
      this.btnBulldoze.textContent = '🚜 Bulldoze';
    }
    this.hideInspector();
    soundSystem.playSelect();
    this.setMiloMessage('Deselected. Click any building, astronaut, or rover on the moon to inspect!');
  }

  public positionInspector(): void {
    if (typeof window === 'undefined' || !this.inspectorEl) return;
    this.inspectorEl.style.top = '96px';
    this.inspectorEl.style.left = '14px';
    this.inspectorEl.style.right = 'auto';
    this.inspectorEl.style.width = '270px';
    this.inspectorEl.style.maxHeight = 'calc(100vh - 320px)';
    this.inspectorEl.style.overflowY = 'auto';

    // Mutual exclusivity: hide left telemetry if inspector is active so they never overlap
    if (this.inspectorEl.style.display !== 'none' && this.leftTelemetryEl && this.leftTelemetryEl.style.display !== 'none') {
      this.leftTelemetryEl.style.display = 'none';
      const topBtn = this.topBarEl?.querySelector('#btn-toggle-tel') as HTMLButtonElement | null;
      if (topBtn) topBtn.style.background = '#1e293b';
    }
  }

  public positionMilo(): void {
    if (typeof window === 'undefined' || !this.miloBubbleEl) return;
    this.miloBubbleEl.style.top = '96px';
    this.miloBubbleEl.style.bottom = 'auto';
    this.miloBubbleEl.style.left = '50%';
    this.miloBubbleEl.style.right = 'auto';
    this.miloBubbleEl.style.transform = 'translateX(-50%)';
  }

  private renderBuildingCards(): void {
    const tray = this.cityDockEl.querySelector('#city-cards-tray') as HTMLElement;
    if (!tray) return;

    tray.innerHTML = '';
    this.cardButtons.clear();

    const buildings = BUILDING_LIST.filter((b) => b.category === this.activeCategory);

    for (const b of buildings) {
      const card = document.createElement('button');
      card.dataset.id = b.id;
      card.className = 'kid-building-card kid-arcade-btn';
      card.style.cssText = `
        flex: 0 0 148px; width: 148px; height: 118px;
        background: rgba(30, 41, 59, 0.92);
        border: 2px solid rgba(148, 163, 184, 0.28);
        border-radius: 16px;
        padding: 6px 6px;
        box-sizing: border-box;
        cursor: pointer;
        display: flex; flex-direction: column; align-items: center; justify-content: space-between;
        text-align: center;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
        user-select: none;
        overflow: hidden;
      `;

      card.innerHTML = `
        <div style="font-size:24px; line-height:1; margin-bottom:2px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${b.emoji}</div>
        <div style="font-size:11px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; margin-bottom:3px; color:#ffffff;">
          ${b.name}
        </div>
        <div style="background:rgba(234,179,8,0.25); border:1px solid #eab308; color:#fef08a; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:800; margin-bottom:3px; white-space:nowrap;">
          🧱 ${b.materialsCost}
        </div>
        <div style="font-size:9.5px; color:#38bdf8; line-height:1.25; height:24px; overflow:hidden; font-weight:600;">
          ${b.kidBenefit}
        </div>
      `;

      card.onmouseenter = () => {
        if (this.cityBuilder?.activeDef?.id !== b.id) {
          card.style.transform = 'translateY(-4px) scale(1.02)';
          card.style.borderColor = '#38bdf8';
          card.style.boxShadow = '0 6px 18px rgba(56, 189, 248, 0.35)';
        }
      };

      card.onmouseleave = () => {
        if (this.cityBuilder?.activeDef?.id !== b.id) {
          card.style.transform = 'translateY(0) scale(1)';
          card.style.borderColor = 'rgba(148, 163, 184, 0.28)';
          card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.45)';
        }
      };

      // Toggle selection on card click: clicking already selected card deselects!
      card.onclick = () => {
        if (!this.cityBuilder) return;

        if (this.cityBuilder.activeDef?.id === b.id) {
          // Deselect!
          this.deselectAll();
          return;
        }

        this.cityBuilder.selectBuilding(b.id);
        this.highlightActiveCard(b.id);
        this.hideInspector();
        this.btnBulldoze.style.background = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
        this.btnBulldoze.textContent = '🚜 Bulldoze';
        soundSystem.playSelect();
        this.setMiloMessage(`Selected ${b.name}! Click on lunar ground to build! Press 'R' to rotate, or Esc to deselect.`);
      };

      this.cardButtons.set(b.id, card);
      tray.appendChild(card);
    }
  }

  private highlightActiveCard(id: string | null): void {
    for (const [cardId, btn] of this.cardButtons.entries()) {
      if (cardId === id) {
        // Obvious vivid green highlight ring/card border for kids
        btn.style.background = 'rgba(34, 197, 94, 0.25)';
        btn.style.borderColor = '#22c55e';
        btn.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.75), 0 6px 20px rgba(0, 0, 0, 0.5)';
        btn.style.transform = 'translateY(-4px) scale(1.03)';
      } else {
        btn.style.background = 'rgba(30, 41, 59, 0.88)';
        btn.style.borderColor = 'rgba(148, 163, 184, 0.28)';
        btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.45)';
        btn.style.transform = 'translateY(0) scale(1)';
      }
    }
  }

  /**
   * Shows detailed Inspector Card for an entity (building or astronaut) selected in the 3D world.
   */
  public showBuildingInspector(instance: PlacedBuildingInstance): void {
    this.selectedBuildingInstance = instance;
    const def = instance.def;

    this.inspectorEl.style.display = 'block';
    this.positionInspector();
    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(34,197,94,0.3); padding-bottom:6px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:24px;">${def.emoji}</span>
          <b style="font-size:14px; color:#22c55e;">${def.name}</b>
        </div>
        <button id="btn-close-inspector" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="font-size:11.5px; color:#cbd5e1; line-height:1.4; margin-bottom:10px;">
        ${def.description}
      </div>

      <div style="background:rgba(30,41,59,0.85); border:1.5px solid rgba(34,197,94,0.3); border-radius:12px; padding:8px 10px; font-size:11px; margin-bottom:10px; line-height:1.45;">
        <div>📍 <b>Location:</b> (${instance.x.toFixed(0)}m, ${instance.z.toFixed(0)}m)</div>
        <div>🌟 <b>Benefit:</b> <span style="color:#7dd3fc; font-weight:bold;">${def.kidBenefit}</span></div>
        <div>🧱 <b>Original Cost:</b> ${def.materialsCost} Materials</div>
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
        <button id="btn-inspect-focus" class="kid-arcade-btn" style="flex:1; background:#0284c7; color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; box-shadow:0 3px 8px rgba(2,132,199,0.4);">
          🔍 Focus Cam
        </button>
        <button id="btn-inspect-demolish" class="kid-arcade-btn" style="flex:1; background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; box-shadow:0 3px 8px rgba(220,38,38,0.4);">
          🚜 Recycle (+${Math.floor(def.materialsCost * 0.7)} 🧱)
        </button>
      </div>

      <!-- Explicit Deselect Button -->
      <button id="btn-inspect-deselect" class="kid-arcade-btn" style="width:100%; background:#334155; color:#cbd5e1; border:1px solid #475569; padding:6px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
        ✕ Cancel / Deselect [Esc]
      </button>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.deselectAll();
    };

    const deselectBtn = this.inspectorEl.querySelector('#btn-inspect-deselect') as HTMLButtonElement;
    if (deselectBtn) {
      deselectBtn.onclick = () => {
        this.deselectAll();
      };
    }

    const focusBtn = this.inspectorEl.querySelector('#btn-inspect-focus') as HTMLButtonElement;
    focusBtn.onclick = () => {
      this.cameraController.focusOn(instance.rootMesh.position, 12.0, 5.0);
      soundSystem.playSelect();
    };

    const demoBtn = this.inspectorEl.querySelector('#btn-inspect-demolish') as HTMLButtonElement;
    demoBtn.onclick = () => {
      if (this.cityBuilder) {
        const refund = Math.floor(def.materialsCost * 0.7);
        this.simEngine.state.materials = (this.simEngine.state.materials ?? 800) + refund;
        this.cityBuilder.placedBuildings.delete(instance.uid);
        this.cityBuilder.selectPlacedBuilding(null);
        instance.rootMesh.parent?.remove(instance.rootMesh);
        soundSystem.playDemolish();
        this.setMiloMessage(`Recycled ${def.name}! Refunded +${refund} 🧱 Materials to your base.`);
        this.hideInspector();
      }
    };
  }

  public showAstronautInspector(astro: AstronautEntity): void {
    this.inspectorEl.style.display = 'block';
    this.positionInspector();
    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(34,197,94,0.3); padding-bottom:6px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:24px;">🧑‍🚀</span>
          <b style="font-size:14px; color:#22c55e;">${astro.name}</b>
        </div>
        <button id="btn-close-inspector" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="background:rgba(30,41,59,0.85); border:1.5px solid rgba(34,197,94,0.3); border-radius:12px; padding:8px 10px; font-size:11px; margin-bottom:10px; line-height:1.45;">
        <div>🎖️ <b>Assignment:</b> ${astro.role}</div>
        <div>🌬️ <b>Suit O₂ Level:</b> <b style="color:#2dd4bf;">${astro.suitO2Pct}%</b></div>
        <div>❤️ <b>Heart Rate:</b> ${astro.heartRateBpm} BPM</div>
        <div>😊 <b>Morale:</b> <b style="color:#f472b6;">${astro.morale}%</b></div>
        <div>📍 <b>Status:</b> <span style="color:#10b981; font-weight:bold;">${astro.status.toUpperCase()}</span></div>
        <div style="margin-top:4px; color:#cbd5e1; font-style:italic;">"${astro.currentTask}"</div>
      </div>

      <div style="display:flex; gap:6px; margin-bottom:6px;">
        <button id="btn-inspect-focus" class="kid-arcade-btn" style="flex:1; background:#0284c7; color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; box-shadow:0 3px 8px rgba(2,132,199,0.4);">
          🔍 Focus Cam
        </button>
        <button id="btn-inspect-shelter" class="kid-arcade-btn" style="flex:1; background:linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; box-shadow:0 3px 8px rgba(124,58,237,0.4);">
          🛡️ Seek Vault
        </button>
      </div>

      <button id="btn-inspect-deselect" class="kid-arcade-btn" style="width:100%; background:#334155; color:#cbd5e1; border:1px solid #475569; padding:6px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
        ✕ Cancel / Deselect [Esc]
      </button>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.deselectAll();
      this.astronautManager?.selectAstronaut(null);
    };

    const deselectBtn = this.inspectorEl.querySelector('#btn-inspect-deselect') as HTMLButtonElement;
    if (deselectBtn) {
      deselectBtn.onclick = () => {
        this.deselectAll();
        this.astronautManager?.selectAstronaut(null);
      };
    }

    const focusBtn = this.inspectorEl.querySelector('#btn-inspect-focus') as HTMLButtonElement;
    focusBtn.onclick = () => {
      this.cameraController.focusOn(astro.mesh.position, 6.0, 2.5);
      soundSystem.playSelect();
    };

    const shelterBtn = this.inspectorEl.querySelector('#btn-inspect-shelter') as HTMLButtonElement;
    shelterBtn.onclick = () => {
      astro.isSheltered = true;
      astro.status = 'sheltering';
      astro.currentTask = 'Sheltering inside subterranean radiation bunker';
      soundSystem.playSelect();
      this.showAstronautInspector(astro);
      this.setMiloMessage(`${astro.name} reached the subterranean storm vault safely!`);
    };
  }

  public showRoverInspector(rover: RoverEntity): void {
    this.inspectorEl.style.display = 'block';
    this.positionInspector();
    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(34,197,94,0.3); padding-bottom:6px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:24px;">🚜</span>
          <b style="font-size:14px; color:#22c55e;">${rover.name}</b>
        </div>
        <button id="btn-close-inspector" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="background:rgba(30,41,59,0.85); border:1.5px solid rgba(34,197,94,0.3); border-radius:12px; padding:8px 10px; font-size:11px; margin-bottom:10px; line-height:1.45;">
        <div>🏷️ <b>Type:</b> ${rover.type.replace(/_/g, ' ').toUpperCase()}</div>
        <div>🔋 <b>Battery:</b> <b style="color:#38bdf8;">${rover.batteryPct.toFixed(0)}%</b></div>
        <div>⚡ <b>Status:</b> <span style="color:#10b981; font-weight:bold;">${rover.status.toUpperCase()}</span></div>
        <div>📋 <b>Current Task:</b> ${rover.currentTask}</div>
        <div>📍 <b>Odometer:</b> ${rover.totalDistanceTraversedM.toFixed(0)} meters</div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:6px;">
        <button id="btn-rover-insp-focus" class="kid-arcade-btn" style="background:#0284c7; color:#fff; border:none; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:800;">
          🔍 Focus Cam
        </button>
        <button id="btn-rover-insp-chase" class="kid-arcade-btn" style="background:#0f766e; color:#fff; border:none; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:800;">
          🎥 3rd-Person
        </button>
        <button id="btn-rover-insp-clean" class="kid-arcade-btn" style="background:#334155; color:#7dd3fc; border:1px solid #0284c7; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
          🧹 Clean Arrays
        </button>
        <button id="btn-rover-insp-dock" class="kid-arcade-btn" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:7px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
          🏠 Dock Berth
        </button>
      </div>

      <button id="btn-inspect-deselect" class="kid-arcade-btn" style="width:100%; background:#334155; color:#cbd5e1; border:1px solid #475569; padding:6px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
        ✕ Cancel / Deselect [Esc]
      </button>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => this.deselectAll();

    const deselectBtn = this.inspectorEl.querySelector('#btn-inspect-deselect') as HTMLButtonElement;
    if (deselectBtn) {
      deselectBtn.onclick = () => this.deselectAll();
    }

    const focusBtn = this.inspectorEl.querySelector('#btn-rover-insp-focus') as HTMLButtonElement;
    focusBtn.onclick = () => {
      this.cameraController.focusOn(rover.mesh.position, 10.0, 4.0);
      soundSystem.playSelect();
    };

    const chaseBtn = this.inspectorEl.querySelector('#btn-rover-insp-chase') as HTMLButtonElement;
    chaseBtn.onclick = () => {
      this.cameraController.setFollowTarget(rover.mesh, 12.0, 4.0);
      soundSystem.playSelect();
      this.setMiloMessage(`Camera locked to chase view behind ${rover.name}!`);
    };

    const cleanBtn = this.inspectorEl.querySelector('#btn-rover-insp-clean') as HTMLButtonElement;
    cleanBtn.onclick = () => {
      this.roverManager.dispatchCleanSolarArrays();
      soundSystem.playSelect();
      this.setMiloMessage(`${rover.name} dispatched to clear regolith dust from solar arrays!`);
    };

    const dockBtn = this.inspectorEl.querySelector('#btn-rover-insp-dock') as HTMLButtonElement;
    dockBtn.onclick = () => {
      this.roverManager.returnAllRovers();
      soundSystem.playSelect();
      this.setMiloMessage(`${rover.name} returning to docking berth.`);
    };
  }

  public showBaseModuleInspector(mod: BaseModuleInfo): void {
    this.inspectorEl.style.display = 'block';
    this.positionInspector();

    const getModuleDescription = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('dome') || n.includes('habitat')) return 'Pressurized Artemis crew living and command dome with multi-layer micrometeorite fabric.';
      if (n.includes('berm')) return '3-metre thick sintered lunar regolith berm providing protection against cosmic radiation and temperature extremes.';
      if (n.includes('cylinder') || n.includes('crew')) return 'Rigid aluminum-lithium crew habitat cylinder housing primary crew sleep quarters.';
      if (n.includes('tunnel') || n.includes('corridor')) return 'Hermetically sealed interconnecting corridor allowing suitless crew transit between modules.';
      if (n.includes('greenhouse')) return 'Bioregenerative life-support greenhouse cultivating fresh dwarf crops and recycling CO₂ into O₂.';
      if (n.includes('solar')) return 'Vertical tracking photovoltaic solar array harvesting grazing polar sunlight on the crater rim.';
      if (n.includes('battery')) return 'Cryo-insulated regenerative fuel cell and lithium-ion battery bank storing power for nocturnal cycles.';
      if (n.includes('landing') || n.includes('pad')) return 'Microwave-sintered landing pad preventing high-velocity regolith sandblasting during spacecraft touchdown.';
      if (n.includes('lander')) return 'Human Landing System (HLS) spacecraft with ascent stage for crew transport from lunar orbit.';
      if (n.includes('mast') || n.includes('antenna')) return 'High-gain X-band and Ka-band communications mast linking outpost directly to Earth\'s Deep Space Network.';
      return 'Essential Artemis Lunar Outpost infrastructure module maintaining mission operations.';
    };

    const formatName = (raw: string) => {
      return raw
        .replace(/_/g, ' ')
        .replace(/row \d+/i, 'Array')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid rgba(34,197,94,0.3); padding-bottom:6px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:24px;">🏛️</span>
          <b style="font-size:14px; color:#22c55e;">${formatName(mod.name)}</b>
        </div>
        <button id="btn-close-inspector" class="kid-arcade-btn" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="background:rgba(30,41,59,0.85); border:1.5px solid rgba(34,197,94,0.3); border-radius:12px; padding:8px 10px; font-size:11px; margin-bottom:10px; line-height:1.45;">
        <div>📂 <b>System:</b> ${mod.category.toUpperCase()}</div>
        <div>📍 <b>Grid Position:</b> (${mod.position.x.toFixed(0)}m, ${mod.position.z.toFixed(0)}m)</div>
        <div style="margin-top:4px; color:#cbd5e1; font-style:italic;">"${getModuleDescription(mod.name)}"</div>
      </div>

      <button id="btn-module-focus" class="kid-arcade-btn" style="width:100%; background:#0284c7; color:#fff; border:none; padding:8px; border-radius:10px; cursor:pointer; font-size:11.5px; font-weight:800; margin-bottom:6px; box-shadow:0 3px 8px rgba(2,132,199,0.4);">
        🔍 Focus Cam on Module
      </button>

      <button id="btn-inspect-deselect" class="kid-arcade-btn" style="width:100%; background:#334155; color:#cbd5e1; border:1px solid #475569; padding:6px; border-radius:10px; cursor:pointer; font-size:11px; font-weight:700;">
        ✕ Cancel / Deselect [Esc]
      </button>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => this.deselectAll();

    const deselectBtn = this.inspectorEl.querySelector('#btn-inspect-deselect') as HTMLButtonElement;
    if (deselectBtn) {
      deselectBtn.onclick = () => this.deselectAll();
    }

    const focusBtn = this.inspectorEl.querySelector('#btn-module-focus') as HTMLButtonElement;
    focusBtn.onclick = () => {
      this.cameraController.focusOn(mod.position, 14.0, 6.0);
      soundSystem.playSelect();
    };
  }

  public hideInspector(): void {
    this.inspectorEl.style.display = 'none';
    this.selectedBuildingInstance = null;
  }

  /**
   * Shows Kid-Friendly Mission Incident Decision Modal based on anomalies.json
   */
  public showIncidentModal(anomaly: MissionAnomaly): void {
    // Pause simulation so player has full time to consider options
    this.cachedSpeedBeforeIncident = this.timeManager.getMultiplier();
    this.timeManager.setMultiplier(0);
    this.simEngine.state.isPaused = true;

    this.incidentModalEl.style.display = 'flex';
    this.incidentModalEl.innerHTML = `
      <div style="width:90%; max-width:640px; background:linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.96) 100%); border:3px solid #f59e0b; border-radius:26px; box-shadow:0 0 45px rgba(245,158,11,0.55), 0 10px 40px rgba(0,0,0,0.8); padding:24px; color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; animation: kid-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
        
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(245,158,11,0.3); padding-bottom:10px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:32px;">${anomaly.emoji}</span>
            <div>
              <div style="font-size:12px; font-weight:800; color:#f59e0b; letter-spacing:0.5px; text-transform:uppercase;">🛰️ M.I.L.O. MISSION ADVISORY</div>
              <b style="font-size:18px; color:#ffffff;">${anomaly.name}</b>
            </div>
          </div>
          <button id="btn-close-incident" class="kid-arcade-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#94a3b8; font-size:14px; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer;">✕</button>
        </div>

        <p style="font-size:13.5px; line-height:1.5; color:#cbd5e1; margin-bottom:12px;">
          ${anomaly.description}
        </p>

        <div style="background:rgba(245,158,11,0.12); border:1.5px solid rgba(245,158,11,0.4); border-radius:14px; padding:10px 14px; font-size:12px; color:#fef08a; margin-bottom:16px;">
          <b>⚠️ Mission Hazard:</b> ${anomaly.danger}<br/>
          <b>📊 Vitals Impact:</b> ${anomaly.impact}
        </div>

        <div id="incident-error-msg" style="display:none; background:rgba(245,158,11,0.2); border:1.5px solid #f59e0b; color:#fde68a; padding:8px 12px; border-radius:12px; font-size:11.5px; margin-bottom:12px; font-weight:bold;"></div>

        <div style="font-size:12.5px; font-weight:800; color:#38bdf8; margin-bottom:10px;">
          CHOOSE YOUR STRATEGY, CAPTAIN (BOOSTS YOUR MISSION RATING):
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${anomaly.choices.map((c) => {
      const matOk = !c.materialsCost || this.simEngine.canAfford(c.materialsCost);
      const pwrOk = !c.powerCost || (this.simEngine.state.power ?? 0) >= c.powerCost;
      const affordable = matOk && pwrOk;
      return `
            <button class="btn-decision-choice kid-arcade-btn" data-id="${c.id}" style="background:${affordable ? 'rgba(30,41,59,0.92)' : 'rgba(30,41,59,0.5)'}; border:2px solid ${affordable ? 'rgba(56,189,248,0.45)' : 'rgba(239,68,68,0.45)'}; border-radius:16px; padding:12px 14px; text-align:left; cursor:${affordable ? 'pointer' : 'not-allowed'}; color:#f8fafc; box-shadow:0 3px 10px rgba(0,0,0,0.4);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <b style="font-size:13.5px; color:${affordable ? '#38bdf8' : '#94a3b8'};">${c.title}</b>
                <span style="font-size:11.5px; background:rgba(245,158,11,0.25); border:1px solid #f59e0b; color:#fef08a; padding:2px 8px; border-radius:9999px; font-weight:800;">+${c.successPoints} pts ⭐</span>
              </div>
              <div style="font-size:12px; color:#cbd5e1; margin-bottom:4px;">${c.description}</div>
              <div style="font-size:11px; color:${affordable ? '#10b981' : '#f87171'}; font-weight:800;">
                ${c.tradeoffText} ${!matOk ? `(Need ${c.materialsCost} 🧱 - Insufficient!)` : ''} ${!pwrOk ? `(Need ${c.powerCost} ⚡ - Insufficient!)` : ''}
              </div>
            </button>
            `;
    }).join('')}
        </div>
      </div>
    `;

    const closeBtn = this.incidentModalEl.querySelector('#btn-close-incident') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.incidentModalEl.style.display = 'none';
      this.simEngine.state.isPaused = false;
      this.timeManager.setMultiplier(this.cachedSpeedBeforeIncident || 1.0);
      if (this.decisionManager) {
        const timeState = this.timeManager.getState();
        this.decisionManager.dismissActiveAnomaly(timeState.totalHours);
      }
      soundSystem.playSelect();
    };

    const choiceButtons = this.incidentModalEl.querySelectorAll<HTMLButtonElement>('.btn-decision-choice');
    choiceButtons.forEach((btn) => {
      btn.onclick = () => {
        const choiceId = btn.dataset.id;
        if (choiceId && this.decisionManager) {
          const timeState = this.timeManager.getState();
          const res = this.decisionManager.resolveActiveAnomaly(choiceId, timeState.totalHours);
          if (res) {
            this.incidentModalEl.style.display = 'none';
            this.simEngine.state.isPaused = false;
            this.timeManager.setMultiplier(this.cachedSpeedBeforeIncident || 1.0);
            soundSystem.playPlace();
          } else {
            const errDiv = this.incidentModalEl.querySelector('#incident-error-msg') as HTMLElement;
            if (errDiv) {
              errDiv.textContent = '⚠️ Insufficient materials or battery power for this protocol! Select an alternative solution, Captain.';
              errDiv.style.display = 'block';
            }
          }
        }
      };
    });
  }

  /**
   * Shows Kid-Friendly Mission Sol Evaluation Screen with star ratings and feedback
   */
  public showSolEvaluationModal(): void {
    if (!this.solEvalModalEl) return;
    const s = this.simEngine.state;
    const score = this.decisionManager?.missionSuccessScore ?? 85;

    let stars = '⭐⭐⭐⭐⭐';
    let starCount = 5;
    let rankTitle = 'Master Lunar Commander 🏆';
    if (score < 50) {
      stars = '⭐⭐';
      starCount = 2;
      rankTitle = 'Apprentice Moon Cadet 🚀';
    } else if (score < 70) {
      stars = '⭐⭐⭐';
      starCount = 3;
      rankTitle = 'Lunar Base Explorer 🌟';
    } else if (score < 88) {
      stars = '⭐⭐⭐⭐';
      starCount = 4;
      rankTitle = 'Senior Artemis Officer 🏅';
    }

    const placedCount = this.cityBuilder?.placedBuildings.size ?? 0;
    const crewCount = s.crew ?? 4;
    const powerKwh = s.power.toFixed(0);
    const o2Pct = s.oxygen.toFixed(1);

    this.solEvalModalEl.style.display = 'flex';
    this.solEvalModalEl.innerHTML = `
      <div style="width:90%; max-width:640px; background:linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.96) 100%); border:3px solid #f59e0b; border-radius:26px; box-shadow:0 0 45px rgba(245,158,11,0.5), 0 10px 40px rgba(0,0,0,0.8); padding:24px; color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; animation: kid-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(245,158,11,0.3); padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:32px; animation: kid-star-twinkle 2s infinite ease-in-out;">🌟</span>
            <div>
              <div style="font-size:12px; font-weight:800; color:#f59e0b; letter-spacing:1px; text-transform:uppercase;">NASA Mission Sol Evaluation</div>
              <b style="font-size:20px; color:#ffffff;">Artemis Base Report Card</b>
            </div>
          </div>
          <button id="btn-close-sol-eval" class="kid-arcade-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#94a3b8; font-size:16px; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Close Report">✕</button>
        </div>

        <!-- Rating Stars Banner -->
        <div style="background:rgba(245,158,11,0.15); border:2px solid #f59e0b; border-radius:18px; padding:14px; text-align:center; margin-bottom:16px; box-shadow:0 4px 15px rgba(245,158,11,0.2);">
          <div style="font-size:34px; letter-spacing:4px; margin-bottom:4px;">${stars}</div>
          <div style="font-size:16px; font-weight:800; color:#fde68a;">${rankTitle}</div>
          <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">Overall Mission Rating: <b style="color:#38bdf8; font-size:14px;">${score}%</b> (${starCount}/5 Star Performance)</div>
        </div>

        <!-- 4-Pillar Achievement Grid -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
          <div style="background:rgba(30,41,59,0.8); border:1.5px solid rgba(56,189,248,0.35); border-radius:14px; padding:10px 12px;">
            <div style="font-size:11px; font-weight:700; color:#38bdf8; margin-bottom:2px;">⚡ POWER GRID</div>
            <div style="font-size:15px; font-weight:800; color:#bae6fd;">${powerKwh} kWh</div>
            <div style="font-size:10.5px; color:#94a3b8;">${s.power > 100 ? '🟢 Fully Operational' : '⚠️ Low Battery'}</div>
          </div>
          <div style="background:rgba(30,41,59,0.8); border:1.5px solid rgba(20,184,166,0.35); border-radius:14px; padding:10px 12px;">
            <div style="font-size:11px; font-weight:700; color:#2dd4bf; margin-bottom:2px;">🌬️ LIFE SUPPORT</div>
            <div style="font-size:15px; font-weight:800; color:#99f6e4;">${o2Pct}% O₂</div>
            <div style="font-size:10.5px; color:#94a3b8;">${s.oxygen >= 19.5 ? '🟢 Clean & Breathable' : '⚠️ Air Alarm'}</div>
          </div>
          <div style="background:rgba(30,41,59,0.8); border:1.5px solid rgba(244,63,94,0.35); border-radius:14px; padding:10px 12px;">
            <div style="font-size:11px; font-weight:700; color:#fb7185; margin-bottom:2px;">❤️ CREW WELLBEING</div>
            <div style="font-size:15px; font-weight:800; color:#fecdd3;">${s.health.toFixed(0)}% Health • ${s.enthusiasm.toFixed(0)}% Morale</div>
            <div style="font-size:10.5px; color:#94a3b8;">${crewCount} Active Artemis Astronauts</div>
          </div>
          <div style="background:rgba(30,41,59,0.8); border:1.5px solid rgba(234,179,8,0.35); border-radius:14px; padding:10px 12px;">
            <div style="font-size:11px; font-weight:700; color:#fbbf24; margin-bottom:2px;">🧱 BASE EXPANSION</div>
            <div style="font-size:15px; font-weight:800; color:#fef08a;">${placedCount} Placed Modules</div>
            <div style="font-size:10.5px; color:#94a3b8;">${Math.floor(s.materials ?? 800)} 🧱 Materials Banked</div>
          </div>
        </div>

        <!-- M.I.L.O. Mascot Feedback -->
        <div style="background:rgba(15,23,42,0.85); border:1.5px solid #38bdf8; border-radius:16px; padding:12px 14px; display:flex; gap:12px; align-items:center; margin-bottom:18px;">
          <div style="font-size:28px; animation: kid-milo-bounce 2s infinite ease-in-out;">🤖</div>
          <div style="font-size:12px; color:#e2e8f0; line-height:1.4;">
            <b style="color:#38bdf8;">M.I.L.O. Mission Buddy says:</b><br/>
            ${score >= 80 ? 'Outstanding command, Captain! The lunar colony is running like clockwork. Let us build more habitats and greenhouses!' : 'Great effort, Captain! Remember to keep solar panels cleaned of regolith dust and monitor cabin oxygen.'}
          </div>
        </div>

        <!-- Confirm Button -->
        <div style="display:flex; justify-content:center;">
          <button id="btn-confirm-sol-eval" class="kid-arcade-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#ffffff; border:2px solid #38bdf8; padding:10px 28px; border-radius:14px; font-size:14px; font-weight:800; box-shadow:0 4px 15px rgba(2,132,199,0.45); cursor:pointer;">
            🚀 Keep Exploring First Light Outpost!
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.solEvalModalEl.querySelector('#btn-close-sol-eval') as HTMLButtonElement;
    if (closeBtn) closeBtn.onclick = () => { this.solEvalModalEl.style.display = 'none'; };

    const confirmBtn = this.solEvalModalEl.querySelector('#btn-confirm-sol-eval') as HTMLButtonElement;
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        soundSystem.playPlace();
        this.solEvalModalEl.style.display = 'none';
      };
    }
  }

  private showDecisionOutcomeToast(record: DecisionRecord): void {
    const toast = document.createElement('div');
    toast.className = 'kid-pop-in';
    toast.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 100%);
      border: 2.5px solid #10b981;
      border-radius: 18px;
      padding: 14px 20px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.4);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      z-index: 9999;
      pointer-events: auto;
      max-width: 560px;
      text-align: center;
      animation: kid-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    toast.innerHTML = `
      <div style="font-size:12px; font-weight:800; color:#10b981; margin-bottom:4px; letter-spacing:0.5px;">
        ✔ DECISION EXECUTED — ${record.anomalyName}
      </div>
      <div style="font-size:15px; font-weight:800; margin-bottom:5px; color:#38bdf8;">
        ${record.choiceTitle}
      </div>
      <div style="font-size:12.5px; color:#cbd5e1; margin-bottom:8px; line-height:1.4;">
        ${record.resultSummary}
      </div>
      <div style="font-size:11.5px; background:rgba(16,185,129,0.25); border:1px solid #10b981; color:#a7f3d0; padding:3px 12px; border-radius:9999px; display:inline-block; font-weight:800;">
        +${record.successPoints} Mission Success Rating! (Overall Score: ${this.decisionManager?.missionSuccessScore ?? 85}%)
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 6000);
  }

  private bindCityBuilderEvents(): void {
    if (!this.cityBuilder) return;

    this.cityBuilder.addEventListener((event, data) => {
      if (event === 'placed') {
        const instance = data as PlacedBuildingInstance;
        this.highlightActiveCard(null);
        this.setMiloMessage(`Built ${instance.def.name}! +${instance.def.kidBenefit}`);
      } else if (event === 'demolished') {
        this.hideInspector();
      } else if (event === 'selected_building') {
        const instance = data as PlacedBuildingInstance | null;
        if (instance) {
          this.showBuildingInspector(instance);
        } else {
          this.hideInspector();
        }
      } else if (event === 'selected' && data === null) {
        this.highlightActiveCard(null);
        this.hideInspector();
      }
    });
  }

  public update(timeState: CelestialTimeState, ephemeris: SolarEphemeris): void {
    const s = this.simEngine.state;
    const isDaylight = ephemeris.sunElevationRad > 0;

    // 1. Update Top Bar Text
    this.solBadgeEl.textContent = `📅 SOL ${timeState.sol} | ${timeState.timeOfDayHours.toFixed(1)}h`;
    this.lightingBadgeEl.textContent = isDaylight ? '☀️ POLAR DAY' : '🌑 POLAR NIGHT';
    this.lightingBadgeEl.style.color = isDaylight ? '#fbbf24' : '#818cf8';
    this.lightingBadgeEl.style.borderColor = isDaylight ? '#fbbf24' : '#818cf8';
    this.lightingBadgeEl.style.background = isDaylight ? 'rgba(251,191,36,0.18)' : 'rgba(129,140,248,0.18)';
    this.speedValEl.textContent = `${this.timeManager.getMultiplier()}x`;

    // 2. Update Kid Resource Capsules
    const materials = Math.floor(s.materials ?? 800);
    this.resMaterialsEl.textContent = `${materials}`;
    this.pillMaterialsEl.textContent = materials > 300 ? 'Rich' : 'Conserve';

    this.resPowerEl.textContent = `${s.power.toFixed(0)} kWh`;
    this.pillPowerEl.textContent = s.power > 300 ? 'Charged' : (s.power > 50 ? 'Low' : 'Critical');

    this.resCrewEl.textContent = `${s.crew ?? 4}/${s.maxCrew ?? 8}`;

    this.resFoodEl.textContent = `${s.food.toFixed(0)}`;
    this.pillFoodEl.textContent = s.food > 20 ? 'Yum' : 'Ration';

    this.resWaterEl.textContent = `${s.water.toFixed(0)}`;
    this.pillWaterEl.textContent = s.water > 30 ? 'Pure' : 'Low';

    this.resO2El.textContent = `${s.oxygen.toFixed(1)}%`;
    this.pillO2El.textContent = s.oxygen >= 20.0 ? 'Fresh' : 'Scrubbing';

    this.resHealthTopEl.textContent = `${s.health.toFixed(0)}%`;
    this.pillHealthEl.textContent = s.health >= 80 ? 'Safe' : 'Care';

    this.resMoraleEl.textContent = `${s.enthusiasm.toFixed(0)}%`;
    this.pillMoraleEl.textContent = s.enthusiasm >= 75 ? 'Happy' : 'Gloomy';

    this.resScoreEl.textContent = `${this.decisionManager?.missionSuccessScore ?? 85}%`;

    // 3. Red Alert / Crisis Banner permanently removed per user request
    if (this.crisisBannerEl) {
      this.crisisBannerEl.style.display = 'none';
    }

    // 4. Update Left Telemetry Panel
    this.telPower.textContent = `${s.power.toFixed(0)} kWh`;
    this.telPillPower.textContent = s.power > 200 ? '⚡ Charged' : '⚠️ Low';

    this.telHealth.textContent = `${s.health.toFixed(0)}%`;
    this.telPillHealth.textContent = s.health >= 80 ? '❤️ Healthy' : '🩺 Needs Care';

    this.telO2.textContent = `${s.oxygen.toFixed(1)}%`;
    this.telPillO2.textContent = s.oxygen >= 20.0 ? '🟢 Fresh Air' : '⚠️ Scrubbing';

    this.telStoredO2.textContent = `${(s.stored_o2 ?? 80).toFixed(0)} u`;
    this.telPillStoredO2.textContent = (s.stored_o2 ?? 80) > 30 ? '🛡️ Reserve' : '⚠️ Low O₂';
    this.telCO2.textContent = `${s.co2.toFixed(1)} u`;
    this.telPillCO2.textContent = s.co2 <= 15.0 ? '🌿 Clean' : '⚠️ High CO₂';

    this.telTemp.textContent = `${s.temperature.toFixed(1)}°`;
    this.telPillTemp.textContent = s.temperature >= 18 && s.temperature <= 26 ? '🛋️ Cozy' : '❄️ Chilly';

    this.telWater.textContent = `${s.water.toFixed(0)} u`;
    this.telPillWater.textContent = s.water >= 30 ? '💧 Pure' : '⚠️ Low';

    this.telFood.textContent = `${s.food.toFixed(0)} u`;
    this.telPillFood.textContent = s.food >= 20 ? '🥦 Fresh' : '⚠️ Rations';

    this.telRad.textContent = `${s.radiation.toFixed(1)}`;
    this.telPillRad.textContent = s.radiation <= 10 ? '🛡️ Safe' : '🚨 High Rad!';

    this.telShield.textContent = `${s.shield.toFixed(0)}%`;
    this.telPillShield.textContent = s.shield >= 50 ? '🧱 Berms' : '⚠️ Low Shield';
    this.telDust.textContent = `${s.dust.toFixed(1)}%`;
    this.telPillDust.textContent = s.dust <= 5 ? '✨ Clean' : '🧹 Send Rover';

    const isSheltered = !!s.isSheltered;
    this.telShelter.textContent = isSheltered ? 'VAULT' : 'SURFACE';
    this.telPillShelter.textContent = isSheltered ? '🛡️ In Bunker' : '🚀 Exploring';

    // 5. Update Time Scrubber Value if player is not actively dragging it
    if (!this.isUserScrubbing && this.scrubberInput) {
      this.scrubberInput.value = timeState.totalHours.toFixed(1);
    }

    // Highlight active speed button
    const activeMultiplier = this.timeManager.getMultiplier();
    for (const [speed, btn] of this.speedButtons.entries()) {
      btn.style.background = activeMultiplier === speed ? '#0284c7' : '#334155';
    }

    // 6. Check for pending Anomaly Decisions
    if (this.decisionManager) {
      const anom = this.decisionManager.checkAnomalies(timeState.sol, timeState.timeOfDayHours, timeState.totalHours);
      if (anom) {
        this.showIncidentModal(anom);
      }
    }
  }
}
