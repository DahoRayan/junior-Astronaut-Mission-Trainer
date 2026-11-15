/**
 * Production HUD Controller & City Builder Interface
 * NASA Outpost 3D Lunar Frontend
 *
 * Kid-friendly, visually rich UI overlay providing:
 * - Top glowing resource ribbon (Materials 🧱, Power ⚡, Crew 🧑‍🚀, Food 🥕, Water 💧, O2 🫧, Morale 😊, Mission Success 🏆)
 * - Centered, non-overlapping bottom City Builder dock with categorized building cards, rotate, and bulldoze tools
 * - Full deselection support (toggle card click, ESC key, right-click, Inspector close button)
 * - Interactive 3D Entity Inspector card giving meaning, real-time stats, and camera focus for every structure
 * - Live Astronaut operations roster with camera focus, vault evacuation, and tasks
 * - Integrated Mission Decision & Anomaly incident system based on anomalies.json
 * - M.I.L.O. Robot Assistant speech bubble with non-overlapping placement and minimize toggle
 * - Integrated astronomical time scrubber with speed multipliers
 */

import type { TimeManager } from '../astronomy/TimeManager';
import type { CameraController } from '../interaction/CameraController';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { RoverManager } from '../rovers/RoverManager';
import type { AstronautManager, AstronautEntity } from '../actors/AstronautManager';
import { MissionDecisionManager, type MissionAnomaly, type DecisionRecord } from '../simulation/MissionDecisionManager';
import type { BaseLoader } from '../base/BaseLoader';
import type { CityBuilder, PlacedBuildingInstance } from '../city/CityBuilder';
import { BUILDING_LIST } from '../city/BuildingCatalog';
import { soundSystem } from '../audio/SoundSystem';
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
  private crisisBannerEl!: HTMLElement;
  private cityDockEl!: HTMLElement;
  private miloBubbleEl!: HTMLElement;
  private miloTextEl!: HTMLElement;

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
  private resMoraleEl!: HTMLElement;
  private resScoreEl!: HTMLElement;

  // Crisis banner elements
  private crisisActiveContentEl!: HTMLElement;
  private crisisFailedContentEl!: HTMLElement;
  private crisisCountdownEl!: HTMLElement;

  // Left Telemetry Panel
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

  // Bottom Scrubber
  private scrubberInput!: HTMLInputElement;
  private speedButtons: Map<number, HTMLButtonElement> = new Map();
  private isUserScrubbing: boolean = false;

  // Right Panel Tabs
  private activeRightTab: 'astronauts' | 'rovers' | 'presets' = 'astronauts';
  private rightContentEl!: HTMLElement;

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

    // 1. Top Bar: Header ribbon
    this.topBarEl = document.createElement('div');
    this.topBarEl.id = 'hud-top-bar';
    this.topBarEl.style.cssText = `
      position: absolute; top: 8px; left: 12px; right: 12px;
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(10, 18, 32, 0.94);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 10px;
      padding: 6px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.75);
      user-select: none;
      pointer-events: auto;
      z-index: 30;
      flex-wrap: wrap;
      gap: 8px;
    `;

    // 2. Crisis Alert Banner
    this.crisisBannerEl = document.createElement('div');
    this.crisisBannerEl.id = 'hud-crisis-banner';
    this.crisisBannerEl.style.cssText = `
      position: absolute; top: 62px; left: 50%; transform: translateX(-50%);
      width: 90%; max-width: 680px;
      background: rgba(220, 38, 38, 0.95);
      border: 2px solid #f87171;
      border-radius: 8px;
      padding: 8px 16px;
      font-family: monospace;
      color: #ffffff;
      display: none;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.7);
      z-index: 50;
      pointer-events: auto;
    `;

    // 3. Left Panel: ECLSS Telemetry Monitors (compact, collapsible)
    this.leftTelemetryEl = document.createElement('div');
    this.leftTelemetryEl.id = 'hud-telemetry-panel';
    this.leftTelemetryEl.style.cssText = `
      position: absolute; top: 60px; left: 12px; width: 235px;
      background: rgba(10, 18, 32, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: monospace;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
      max-height: calc(100vh - 240px);
      overflow-y: auto;
      pointer-events: auto;
      z-index: 20;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    `;

    // 4. Right Panel: Astronauts, Rovers & Sector Presets
    this.rightControlsEl = document.createElement('div');
    this.rightControlsEl.id = 'hud-controls-panel';
    this.rightControlsEl.style.cssText = `
      position: absolute; top: 60px; right: 12px; width: 285px;
      background: rgba(10, 18, 32, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
      max-height: calc(100vh - 240px);
      overflow-y: auto;
      pointer-events: auto;
      z-index: 20;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    `;

    // 5. Inspector Panel: Appears when a building or entity is selected
    this.inspectorEl = document.createElement('div');
    this.inspectorEl.id = 'hud-inspector-card';
    this.inspectorEl.style.cssText = `
      position: absolute; top: 60px; right: 12px; width: 295px;
      background: rgba(15, 23, 42, 0.96);
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f1f5f9;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.75), 0 0 15px rgba(56, 189, 248, 0.4);
      display: none;
      pointer-events: auto;
      z-index: 25;
    `;

    // 6. M.I.L.O. Assistant Speech Bubble (Placed neatly in bottom-left without overlapping right panel)
    this.miloBubbleEl = document.createElement('div');
    this.miloBubbleEl.id = 'hud-milo-bubble';
    this.miloBubbleEl.style.cssText = `
      position: absolute; bottom: 135px; left: 14px; width: 330px;
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 10px 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      display: flex; gap: 10px; align-items: flex-start;
      pointer-events: auto;
      backdrop-filter: blur(10px);
      z-index: 22;
    `;

    // 7. City Builder Centered Bottom Dock (Leaves left & right clear)
    this.cityDockEl = document.createElement('div');
    this.cityDockEl.id = 'hud-city-builder-dock';
    this.cityDockEl.style.cssText = `
      position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
      width: min(860px, 94vw);
      background: rgba(10, 18, 32, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 12px;
      padding: 8px 12px;
      backdrop-filter: blur(12px);
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.85);
      pointer-events: auto;
      z-index: 20;
    `;

    // 8. Incident Decision Modal Overlay (mounted into body/container)
    this.incidentModalEl = document.createElement('div');
    this.incidentModalEl.id = 'hud-incident-modal';
    this.incidentModalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: none; justify-content: center; align-items: center;
      z-index: 1000;
      pointer-events: auto;
    `;

    this.container.appendChild(this.topBarEl);
    this.container.appendChild(this.crisisBannerEl);
    this.container.appendChild(this.leftTelemetryEl);
    this.container.appendChild(this.rightControlsEl);
    this.container.appendChild(this.inspectorEl);
    this.container.appendChild(this.miloBubbleEl);
    this.container.appendChild(this.cityDockEl);
    this.container.appendChild(this.incidentModalEl);

    this.setupTopBar();
    this.setupCrisisBanner();
    this.setupLeftTelemetry();
    this.setupRightControls();
    this.setupMiloBubble();
    this.setupCityDock();

    if (this.cityBuilder) {
      this.bindCityBuilderEvents();
    }
  }

  private setupTopBar(): void {
    this.topBarEl.innerHTML = `
      <!-- Left: Logo & Sol Time -->
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:14px; font-weight:bold; color:#38bdf8; letter-spacing:0.5px;">◈ MOON CITY</span>
        <span id="hud-sol-badge" style="background:rgba(56,189,248,0.2); color:#7dd3fc; padding:2px 7px; border-radius:5px; font-size:11.5px; font-weight:bold; font-family:monospace;">
          SOL 1 | 06.0h
        </span>
        <span id="hud-lighting-badge" style="color:#fbbf24; font-size:11.5px; font-weight:bold;">
          ☀️ POLAR DAY
        </span>
      </div>

      <!-- Center: Kid Resource Ribbon -->
      <div style="display:flex; align-items:center; gap:7px; font-size:12px; font-weight:bold; flex-wrap:wrap;">
        <div style="background:rgba(234,179,8,0.18); border:1px solid #eab308; padding:2px 8px; border-radius:12px; color:#fef08a;" title="Materials for building structures">
          🧱 <span id="res-materials">800</span>
        </div>
        <div style="background:rgba(56,189,248,0.18); border:1px solid #38bdf8; padding:2px 8px; border-radius:12px; color:#bae6fd;" title="Power stored in batteries">
          ⚡ <span id="res-power">850 kWh</span>
        </div>
        <div style="background:rgba(168,85,247,0.18); border:1px solid #a855f7; padding:2px 8px; border-radius:12px; color:#e9d5ff;" title="Astronaut crew capacity">
          🧑‍🚀 <span id="res-crew">4/8</span>
        </div>
        <div style="background:rgba(34,197,94,0.18); border:1px solid #22c55e; padding:2px 8px; border-radius:12px; color:#bbf7d0;" title="Hydroponic food rations">
          🥕 <span id="res-food">30</span>
        </div>
        <div style="background:rgba(14,165,233,0.18); border:1px solid #0ea5e9; padding:2px 8px; border-radius:12px; color:#7dd3fc;" title="Clean drinking water">
          💧 <span id="res-water">60</span>
        </div>
        <div style="background:rgba(20,184,166,0.18); border:1px solid #14b8a6; padding:2px 8px; border-radius:12px; color:#99f6e4;" title="Cabin atmospheric oxygen">
          🫧 <span id="res-o2">20.9%</span>
        </div>
        <div style="background:rgba(244,63,94,0.18); border:1px solid #f43f5e; padding:2px 8px; border-radius:12px; color:#fecdd3;" title="Astronaut morale and happiness">
          😊 <span id="res-morale">95%</span>
        </div>
        <div style="background:rgba(245,158,11,0.22); border:1px solid #f59e0b; padding:2px 8px; border-radius:12px; color:#fde68a;" title="Mission Success Rating">
          🏆 <span id="res-score">85%</span>
        </div>
      </div>

      <!-- Right: Speed & Panel Toggles -->
      <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-family:monospace;">
        <span>SPD: <b id="hud-speed-val" style="color:#38bdf8;">1x</b></span>
        <button id="btn-toggle-tel" style="background:#1e293b; color:#7dd3fc; border:1px solid #0284c7; padding:3px 7px; border-radius:5px; cursor:pointer; font-size:11px;" title="Toggle ECLSS Telemetry">📊 Vitals</button>
        <button id="btn-toggle-ctrl" style="background:#0284c7; color:#fff; border:1px solid #38bdf8; padding:3px 7px; border-radius:5px; cursor:pointer; font-size:11px;" title="Toggle Crew & Fleet Panel">🧑‍🚀 Base Ops</button>
        <button id="btn-trigger-anom" style="background:#7c3aed; color:#fff; border:none; padding:3px 7px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;" title="Test / Trigger Mission Anomaly Incident">⚠️ Decisions</button>
        <button id="btn-toggle-milo" style="background:#1e293b; color:#7dd3fc; border:1px solid #0284c7; padding:3px 7px; border-radius:5px; cursor:pointer; font-size:11px;" title="Toggle M.I.L.O. Assistant Bubble">🤖 M.I.L.O.</button>
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
    this.resMoraleEl = this.topBarEl.querySelector('#res-morale') as HTMLElement;
    this.resScoreEl = this.topBarEl.querySelector('#res-score') as HTMLElement;

    const btnToggleTel = this.topBarEl.querySelector('#btn-toggle-tel') as HTMLButtonElement;
    btnToggleTel.onclick = () => {
      const isVisible = this.leftTelemetryEl.style.display !== 'none';
      this.leftTelemetryEl.style.display = isVisible ? 'none' : 'block';
      btnToggleTel.style.background = isVisible ? '#1e293b' : '#0284c7';
    };

    const btnToggleCtrl = this.topBarEl.querySelector('#btn-toggle-ctrl') as HTMLButtonElement;
    btnToggleCtrl.onclick = () => {
      const isVisible = this.rightControlsEl.style.display !== 'none';
      this.rightControlsEl.style.display = isVisible ? 'none' : 'block';
      btnToggleCtrl.style.background = isVisible ? '#1e293b' : '#0284c7';
    };

    const btnTriggerAnom = this.topBarEl.querySelector('#btn-trigger-anom') as HTMLButtonElement;
    btnTriggerAnom.onclick = () => {
      if (this.decisionManager) {
        // Find next unresolved anomaly or first one
        const candidates = MissionDecisionManager.CANONICAL_ANOMALIES.filter(
          (a) => !this.decisionManager?.resolvedAnomalyIds.has(a.id)
        );
        const nextAnom = candidates.length > 0 ? candidates[0] : MissionDecisionManager.CANONICAL_ANOMALIES[0];
        this.decisionManager.triggerAnomaly(nextAnom);
        this.showIncidentModal(nextAnom);
      }
    };

    const btnToggleMilo = this.topBarEl.querySelector('#btn-toggle-milo') as HTMLButtonElement;
    btnToggleMilo.onclick = () => {
      const isVisible = this.miloBubbleEl.style.display !== 'none';
      this.miloBubbleEl.style.display = isVisible ? 'none' : 'flex';
      btnToggleMilo.style.background = isVisible ? '#1e293b' : '#0284c7';
    };
  }

  private setupCrisisBanner(): void {
    this.crisisBannerEl.innerHTML = `
      <div id="crisis-active-content" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b>⚠️ CRITICAL EMERGENCY: PRIMARY O2 CRYO-VALVE FRACTURE</b><br/>
          <span style="font-size:12px;">Stored reserves venting. Countdown to asphyxiation:</span>
        </div>
        <div id="crisis-countdown-val" style="font-size:22px; font-weight:bold; color:#fef08a;">
          48.0h
        </div>
      </div>
      <div id="crisis-failed-content" style="display:none; text-align:center; font-weight:bold; font-size:15px; color:#fef08a;">
        ⚠️ MISSION ALERT — Outpost life support depleted. Emergency survival protocol engaged.
      </div>
    `;
    this.crisisActiveContentEl = this.crisisBannerEl.querySelector('#crisis-active-content') as HTMLElement;
    this.crisisFailedContentEl = this.crisisBannerEl.querySelector('#crisis-failed-content') as HTMLElement;
    this.crisisCountdownEl = this.crisisBannerEl.querySelector('#crisis-countdown-val') as HTMLElement;
  }

  private setupLeftTelemetry(): void {
    this.leftTelemetryEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:8px;">
        <span style="font-weight:bold; color:#38bdf8; font-size:11.5px;">📊 18-VAR ECLSS VITALS</span>
        <button id="btn-close-tel" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:12px;">✕</button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; font-size:10.5px;">
        <div>POWER: <b id="tel-power">850 kWh</b></div>
        <div>HEALTH: <b id="tel-health">100%</b></div>
        <div>CABIN O2: <b id="tel-o2">20.9%</b></div>
        <div>STORED O2: <b id="tel-stored-o2">80 u</b></div>
        <div>CABIN CO2: <b id="tel-co2">10.0 u</b></div>
        <div>TEMP: <b id="tel-temp">50.0°</b></div>
        <div>WATER: <b id="tel-water">60 u</b></div>
        <div>FOOD: <b id="tel-food">30 u</b></div>
        <div>RADIATION: <b id="tel-rad">5.0</b></div>
        <div>SHIELD: <b id="tel-shield">70%</b></div>
        <div>DUST: <b id="tel-dust">0.0%</b></div>
        <div>SHELTER: <b id="tel-shelter">SURFACE</b></div>
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

    const btnCloseTel = this.leftTelemetryEl.querySelector('#btn-close-tel') as HTMLButtonElement;
    btnCloseTel.onclick = () => {
      this.leftTelemetryEl.style.display = 'none';
      const topBtn = this.topBarEl.querySelector('#btn-toggle-tel') as HTMLButtonElement;
      if (topBtn) topBtn.style.background = '#1e293b';
    };
  }

  private setupRightControls(): void {
    this.rightControlsEl.innerHTML = `
      <!-- Right Panel Header Tabs -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; gap:4px;">
          <button class="right-tab-btn" data-tab="astronauts" style="background:#0284c7; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">🧑‍🚀 Crew</button>
          <button class="right-tab-btn" data-tab="rovers" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer;">🚜 Fleet</button>
          <button class="right-tab-btn" data-tab="presets" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer;">🎯 Jump</button>
        </div>
        <button id="btn-close-ctrl" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:12px;">✕</button>
      </div>

      <div id="right-tab-content"></div>
    `;

    const closeBtn = this.rightControlsEl.querySelector('#btn-close-ctrl') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.rightControlsEl.style.display = 'none';
      const topBtn = this.topBarEl.querySelector('#btn-toggle-ctrl') as HTMLButtonElement;
      if (topBtn) topBtn.style.background = '#1e293b';
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
        <div style="font-size:11px; color:#94a3b8; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>ACTIVE ARTEMIS CREW (${astros.length})</span>
          <button id="btn-crew-vault" style="background:#7c3aed; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;">
            🛡️ Vault Evac
          </button>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto;">
          ${astros.map((a) => `
            <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <b style="font-size:11.5px; color:#38bdf8;">${a.name}</b>
                <button class="btn-focus-astro" data-id="${a.id}" style="background:#0284c7; color:#fff; border:none; padding:2px 6px; border-radius:4px; font-size:9.5px; cursor:pointer;">🔍 Focus</button>
              </div>
              <div style="font-size:10px; color:#cbd5e1; margin-bottom:2px;">${a.role} • <span style="color:#10b981;">${a.status.toUpperCase()}</span></div>
              <div style="font-size:9.5px; color:#94a3b8; line-height:1.2;">${a.currentTask}</div>
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
              btnVault.style.background = '#7c3aed';
              this.setMiloMessage('Astronauts cleared radiation shelter and resumed surface exploration!');
            } else {
              this.astronautManager.commandShelterAll();
              btnVault.textContent = '🚪 Exit Vault';
              btnVault.style.background = '#059669';
              this.setMiloMessage('General evacuation: all astronauts sheltered safely in the storm vault!');
            }
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
      this.rightContentEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button id="btn-rover-clean" style="width:100%; background:#0284c7; color:#fff; border:none; border-radius:5px; padding:6px; cursor:pointer; font-weight:bold; font-size:11px;">
            🧹 Clean Solar Arrays (-25% Dust)
          </button>
          <button id="btn-rover-survey" style="width:100%; background:#0f766e; color:#fff; border:none; border-radius:5px; padding:6px; cursor:pointer; font-weight:bold; font-size:11px;">
            🔭 Survey Scout (Rim Prospecting)
          </button>
          <button id="btn-rover-return" style="width:100%; background:#475569; color:#fff; border:none; border-radius:5px; padding:6px; cursor:pointer; font-size:11px;">
            🏠 Return Rovers to Base
          </button>
          <button id="btn-rover-follow" style="width:100%; background:#1e293b; color:#7dd3fc; border:1px solid #0284c7; border-radius:5px; padding:6px; cursor:pointer; font-size:11px;">
            🎥 Third-Person Chase Cam (LRV-01)
          </button>
        </div>
      `;

      const btnClean = this.rightContentEl.querySelector('#btn-rover-clean') as HTMLButtonElement;
      btnClean.onclick = () => {
        this.roverManager.dispatchCleanSolarArrays();
        this.simEngine.cleanSolarPanels();
        soundSystem.playPlace();
        this.setMiloMessage('LRV dispatched to clean dust from solar arrays!');
      };

      const btnSurvey = this.rightContentEl.querySelector('#btn-rover-survey') as HTMLButtonElement;
      btnSurvey.onclick = () => {
        this.roverManager.dispatch('ROV-SURVEY', new THREE.Vector3(-60, 0, 50), 'survey');
        this.setMiloMessage('Survey rover en route to the crater rim for geological prospecting!');
      };

      const btnReturn = this.rightContentEl.querySelector('#btn-rover-return') as HTMLButtonElement;
      btnReturn.onclick = () => {
        this.roverManager.returnAllRovers();
        this.setMiloMessage('Recalling all rovers to the central habitat docking berths.');
      };

      const btnFollow = this.rightContentEl.querySelector('#btn-rover-follow') as HTMLButtonElement;
      btnFollow.onclick = () => {
        const rover = this.roverManager.getRover('LRV-01');
        if (rover) {
          this.cameraController.setFollowTarget(rover.mesh, 12.0, 4.0);
          this.setMiloMessage('Locked camera into rover chase mode! Orbit with mouse or click anywhere to exit.');
        }
      };
    } else if (this.activeRightTab === 'presets') {
      this.rightContentEl.innerHTML = `
        <div style="font-size:10.5px; color:#94a3b8; margin-bottom:6px;">SECTOR CAMERA JUMP:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px;">
          <button id="cam-orbit" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px; border-radius:4px; cursor:pointer; font-size:10.5px;">🏠 Hab Complex</button>
          <button id="cam-greenhouse" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px; border-radius:4px; cursor:pointer; font-size:10.5px;">🌿 Greenhouse</button>
          <button id="cam-solar" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px; border-radius:4px; cursor:pointer; font-size:10.5px;">⚡ Power Yard</button>
          <button id="cam-pad" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px; border-radius:4px; cursor:pointer; font-size:10.5px;">🚀 Sintered Pad</button>
          <button id="cam-rim" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px; border-radius:4px; cursor:pointer; font-size:10.5px; grid-column:span 2;">🔭 Shackleton Crater Rim Vista</button>
        </div>
        <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:8px; font-size:10px; color:#bae6fd; line-height:1.4;">
          🧭 <b>Navigation Freedom:</b><br/>
          • <b>WASD / Arrow Keys</b>: Fly camera across crater<br/>
          • <b>Shift + WASD</b>: High-speed booster flight<br/>
          • <b>Q / E</b>: Smooth orbit rotation<br/>
          • <b>Scroll / Drag</b>: Zoom & inspect
        </div>
      `;

      this.rightContentEl.querySelector('#cam-orbit')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('central_hab');
      });
      this.rightContentEl.querySelector('#cam-greenhouse')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('greenhouse');
      });
      this.rightContentEl.querySelector('#cam-solar')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('power_yard');
      });
      this.rightContentEl.querySelector('#cam-pad')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('landing_pad');
      });
      this.rightContentEl.querySelector('#cam-rim')?.addEventListener('click', () => {
        this.cameraController.moveToPreset('rim_horizon');
      });
    }
  }

  private setupMiloBubble(): void {
    this.miloBubbleEl.innerHTML = `
      <div style="font-size:26px; line-height:1; user-select:none;">🤖</div>
      <div style="flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
          <span style="font-size:11px; font-weight:bold; color:#38bdf8; text-transform:uppercase;">M.I.L.O. Buddy</span>
          <button id="btn-close-milo" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:11px; font-weight:bold; padding:0 3px;" title="Dismiss speech bubble">✕</button>
        </div>
        <div id="milo-speech-text" style="font-size:11.5px; color:#f1f5f9; line-height:1.35;">
          Welcome to Shackleton Crater, Captain! Select structures from the dock below to expand our moon base!
        </div>
      </div>
    `;
    this.miloTextEl = this.miloBubbleEl.querySelector('#milo-speech-text') as HTMLElement;
    const btnCloseMilo = this.miloBubbleEl.querySelector('#btn-close-milo') as HTMLButtonElement;
    btnCloseMilo.onclick = () => {
      this.miloBubbleEl.style.display = 'none';
      const topBtn = this.topBarEl.querySelector('#btn-toggle-milo') as HTMLButtonElement;
      if (topBtn) topBtn.style.background = '#1e293b';
    };
  }

  public setMiloMessage(msg: string): void {
    if (this.miloTextEl) {
      this.miloTextEl.textContent = msg;
      if (this.miloBubbleEl.style.display === 'none') {
        this.miloBubbleEl.style.display = 'flex';
      }
    }
  }

  private setupCityDock(): void {
    this.cityDockEl.innerHTML = `
      <!-- Dock Header: Category Tabs & Integrated Time Scrubber & Tools -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
        <!-- Category Tabs -->
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button class="cat-tab" data-cat="living" style="background:#0284c7; color:#fff; border:none; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">🏠 Habitats</button>
          <button class="cat-tab" data-cat="power" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">⚡ Power</button>
          <button class="cat-tab" data-cat="life_support" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">🌿 Life Support</button>
          <button class="cat-tab" data-cat="spaceport" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">🚀 Spaceport</button>
          <button class="cat-tab" data-cat="rovers" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">🚜 Crew & Rovers</button>
        </div>

        <!-- Integrated Time Controls -->
        <div style="display:flex; align-items:center; gap:4px; background:rgba(15,23,42,0.8); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:2px 6px;">
          <input type="range" id="mission-scrubber" min="0" max="708.73" step="0.1" value="6.0" style="width:100px; cursor:pointer;" aria-label="Mission Time Scrubber" />
          <button data-speed="0" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; font-size:9.5px; font-family:monospace;">⏸</button>
          <button data-speed="1" style="background:#0284c7; color:#fff; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; font-size:9.5px; font-family:monospace;">1x</button>
          <button data-speed="6" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; font-size:9.5px; font-family:monospace;">6x</button>
          <button data-speed="30" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; font-size:9.5px; font-family:monospace;">30x</button>
          <button data-speed="360" style="background:#334155; color:#fff; border:none; padding:2px 5px; border-radius:3px; cursor:pointer; font-size:9.5px; font-family:monospace;">360x</button>
        </div>

        <!-- Tool Buttons -->
        <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
          <button id="btn-rotate" style="background:#334155; color:#fff; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px;" title="Rotate placement orientation (R key)">
            🔄 Rotate [R]
          </button>
          <button id="btn-cancel" style="background:#475569; color:#fff; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px;" title="Cancel / Deselect (Escape or Right-Click)">
            ❌ Deselect [Esc]
          </button>
          <button id="btn-bulldoze" style="background:#ea580c; color:#fff; border:none; padding:4px 9px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;" title="Recycle structures for 70% refund (B key)">
            🚜 Bulldoze
          </button>
          <button id="btn-sound-toggle" style="background:#334155; color:#fff; border:none; padding:4px 7px; border-radius:6px; cursor:pointer; font-size:11px;">
            🔊
          </button>
          <button id="btn-toggle-dock" style="background:#0369a1; color:#fff; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;" title="Collapse/Expand build cards tray">
            ─ Minimise
          </button>
        </div>
      </div>

      <!-- Building Cards Scroll Tray -->
      <div id="city-cards-tray" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:3px; scrollbar-width:thin;">
        <!-- Injected dynamically by renderBuildingCards() -->
      </div>
    `;

    // Category tab listeners
    const catTabs = this.cityDockEl.querySelectorAll<HTMLButtonElement>('.cat-tab');
    catTabs.forEach((tab) => {
      tab.onclick = () => {
        catTabs.forEach((t) => {
          t.style.background = '#1e293b';
          t.style.color = '#cbd5e1';
          t.style.border = '1px solid #334155';
        });
        tab.style.background = '#0284c7';
        tab.style.color = '#fff';
        tab.style.border = 'none';

        this.activeCategory = tab.dataset.cat as typeof this.activeCategory;
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
        this.btnBulldoze.style.background = isB ? '#dc2626' : '#ea580c';
        this.btnBulldoze.textContent = isB ? '🚜 Bulldozing Active!' : '🚜 Bulldoze';
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
      btnToggleDock.textContent = isVisible ? '▲ Open Dock' : '─ Minimise';
      btnToggleDock.style.background = isVisible ? '#047857' : '#0369a1';
    };

    this.renderBuildingCards();
  }

  public deselectAll(): void {
    if (this.cityBuilder) {
      this.cityBuilder.cancelAction();
    }
    this.highlightActiveCard(null);
    this.hideInspector();
    this.setMiloMessage('Deselected. Select a building below when ready!');
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
      card.style.cssText = `
        flex: 0 0 auto; width: 140px;
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 8px;
        padding: 7px;
        cursor: pointer;
        display: flex; flex-direction: column; align-items: center;
        text-align: center;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        transition: transform 0.15s, border-color 0.15s, background 0.15s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      `;

      card.innerHTML = `
        <div style="font-size:22px; margin-bottom:2px;">${b.emoji}</div>
        <div style="font-size:11px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; margin-bottom:3px;">
          ${b.name}
        </div>
        <div style="background:rgba(234,179,8,0.25); color:#fef08a; padding:1px 7px; border-radius:10px; font-size:10px; font-weight:bold; margin-bottom:3px;">
          🧱 ${b.materialsCost}
        </div>
        <div style="font-size:9px; color:#38bdf8; line-height:1.2; height:22px; overflow:hidden;">
          ${b.kidBenefit}
        </div>
      `;

      card.onmouseenter = () => {
        card.style.transform = 'translateY(-2px)';
        card.style.borderColor = '#38bdf8';
      };

      card.onmouseleave = () => {
        if (this.cityBuilder?.activeDef?.id !== b.id) {
          card.style.transform = 'translateY(0)';
          card.style.borderColor = 'rgba(148, 163, 184, 0.25)';
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
        this.btnBulldoze.style.background = '#ea580c';
        this.btnBulldoze.textContent = '🚜 Bulldoze';
        this.setMiloMessage(`Selected ${b.name}! Click on lunar ground to build! Press 'R' to rotate, or Esc to deselect.`);
      };

      this.cardButtons.set(b.id, card);
      tray.appendChild(card);
    }
  }

  private highlightActiveCard(id: string | null): void {
    for (const [cardId, btn] of this.cardButtons.entries()) {
      if (cardId === id) {
        btn.style.background = 'rgba(2, 132, 199, 0.65)';
        btn.style.borderColor = '#38bdf8';
        btn.style.boxShadow = '0 0 12px rgba(56, 189, 248, 0.5)';
      } else {
        btn.style.background = 'rgba(30, 41, 59, 0.85)';
        btn.style.borderColor = 'rgba(148, 163, 184, 0.25)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.4)';
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
    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:20px;">${def.emoji}</span>
          <b style="font-size:13px; color:#38bdf8;">${def.name}</b>
        </div>
        <button id="btn-close-inspector" style="background:transparent; border:none; color:#94a3b8; font-size:14px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="font-size:11px; color:#cbd5e1; line-height:1.35; margin-bottom:8px;">
        ${def.description}
      </div>

      <div style="background:rgba(30,41,59,0.8); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px 8px; font-size:10.5px; margin-bottom:8px; line-height:1.4;">
        <div>📍 <b>Location:</b> (${instance.x.toFixed(0)}m, ${instance.z.toFixed(0)}m)</div>
        <div>🌟 <b>Benefit:</b> <span style="color:#7dd3fc;">${def.kidBenefit}</span></div>
        <div>🧱 <b>Original Cost:</b> ${def.materialsCost} Materials</div>
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button id="btn-inspect-focus" style="flex:1; background:#0284c7; color:#fff; border:none; padding:6px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">
          🔍 Focus Cam
        </button>
        <button id="btn-inspect-demolish" style="flex:1; background:#dc2626; color:#fff; border:none; padding:6px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">
          🚜 Recycle (+${Math.floor(def.materialsCost * 0.7)} 🧱)
        </button>
      </div>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.deselectAll();
    };

    const focusBtn = this.inspectorEl.querySelector('#btn-inspect-focus') as HTMLButtonElement;
    focusBtn.onclick = () => {
      this.cameraController.focusOn(instance.rootMesh.position, 12.0, 5.0);
      soundSystem.playSelect();
    };

    const demoBtn = this.inspectorEl.querySelector('#btn-inspect-demolish') as HTMLButtonElement;
    demoBtn.onclick = () => {
      if (this.cityBuilder) {
        // Demolish this specific building
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
    this.inspectorEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:20px;">🧑‍🚀</span>
          <b style="font-size:13px; color:#38bdf8;">${astro.name}</b>
        </div>
        <button id="btn-close-inspector" style="background:transparent; border:none; color:#94a3b8; font-size:14px; cursor:pointer;" title="Deselect [Esc]">✕</button>
      </div>

      <div style="background:rgba(30,41,59,0.8); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px 8px; font-size:10.5px; margin-bottom:8px; line-height:1.4;">
        <div>🎖️ <b>Assignment:</b> ${astro.role}</div>
        <div>🫧 <b>Suit O₂ Level:</b> ${astro.suitO2Pct}%</div>
        <div>❤️ <b>Heart Rate:</b> ${astro.heartRateBpm} BPM</div>
        <div>😊 <b>Morale:</b> ${astro.morale}%</div>
        <div>📍 <b>Status:</b> <span style="color:#10b981;">${astro.status.toUpperCase()}</span></div>
        <div style="margin-top:3px; color:#cbd5e1; font-style:italic;">"${astro.currentTask}"</div>
      </div>

      <div style="display:flex; gap:6px;">
        <button id="btn-inspect-focus" style="flex:1; background:#0284c7; color:#fff; border:none; padding:6px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">
          🔍 Focus Cam
        </button>
        <button id="btn-inspect-shelter" style="flex:1; background:#7c3aed; color:#fff; border:none; padding:6px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">
          🛡️ Seek Vault
        </button>
      </div>
    `;

    const closeBtn = this.inspectorEl.querySelector('#btn-close-inspector') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.deselectAll();
      this.astronautManager?.selectAstronaut(null);
    };

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

  public hideInspector(): void {
    this.inspectorEl.style.display = 'none';
    this.selectedBuildingInstance = null;
  }

  /**
   * Shows Mission Incident Decision Modal based on anomalies.json
   */
  public showIncidentModal(anomaly: MissionAnomaly): void {
    this.incidentModalEl.style.display = 'flex';
    this.incidentModalEl.innerHTML = `
      <div style="width:90%; max-width:620px; background:rgba(10,16,28,0.98); border:2px solid #f59e0b; border-radius:12px; box-shadow:0 0 35px rgba(245,158,11,0.4); padding:20px; color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:26px;">${anomaly.emoji}</span>
            <div>
              <div style="font-size:11px; font-weight:bold; color:#f59e0b; text-transform:uppercase;">🚨 Mission Anomaly Event</div>
              <b style="font-size:17px; color:#ffffff;">${anomaly.name}</b>
            </div>
          </div>
          <button id="btn-close-incident" style="background:transparent; border:none; color:#94a3b8; font-size:14px; cursor:pointer;">✕</button>
        </div>

        <p style="font-size:13.5px; line-height:1.45; color:#cbd5e1; margin-bottom:10px;">
          ${anomaly.description}
        </p>

        <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:6px; padding:8px 10px; font-size:12px; color:#fca5a5; margin-bottom:14px;">
          <b>Danger:</b> ${anomaly.danger}<br/>
          <b>Telemetry Impact:</b> ${anomaly.impact}
        </div>

        <div style="font-size:12px; font-weight:bold; color:#38bdf8; margin-bottom:8px;">
          SELECT COMMAND PROTOCOL (DECISION IMPACTS MISSION SUCCESS):
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${anomaly.choices.map((c) => `
            <button class="btn-decision-choice" data-id="${c.id}" style="background:rgba(30,41,59,0.9); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:10px 12px; text-align:left; cursor:pointer; color:#f8fafc; transition:all 0.15s;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <b style="font-size:13px; color:#38bdf8;">${c.title}</b>
                <span style="font-size:11px; background:rgba(245,158,11,0.2); color:#fef08a; padding:1px 6px; border-radius:4px;">+${c.successPoints} pts</span>
              </div>
              <div style="font-size:11.5px; color:#cbd5e1; margin-bottom:3px;">${c.description}</div>
              <div style="font-size:10.5px; color:#10b981; font-weight:bold;">${c.tradeoffText}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const closeBtn = this.incidentModalEl.querySelector('#btn-close-incident') as HTMLButtonElement;
    closeBtn.onclick = () => {
      this.incidentModalEl.style.display = 'none';
    };

    const choiceButtons = this.incidentModalEl.querySelectorAll<HTMLButtonElement>('.btn-decision-choice');
    choiceButtons.forEach((btn) => {
      btn.onclick = () => {
        const choiceId = btn.dataset.id;
        if (choiceId && this.decisionManager) {
          this.decisionManager.resolveActiveAnomaly(choiceId);
          this.incidentModalEl.style.display = 'none';
        }
      };
    });
  }

  private showDecisionOutcomeToast(record: DecisionRecord): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 75px; left: 50%; transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #10b981;
      border-radius: 10px;
      padding: 12px 18px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      z-index: 9999;
      pointer-events: auto;
      max-width: 550px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    `;

    toast.innerHTML = `
      <div style="font-size:11px; font-weight:bold; color:#10b981; margin-bottom:3px;">
        ✔ DECISION EXECUTED — ${record.anomalyName}
      </div>
      <div style="font-size:14px; font-weight:bold; margin-bottom:4px; color:#38bdf8;">
        ${record.choiceTitle}
      </div>
      <div style="font-size:12px; color:#cbd5e1; margin-bottom:6px;">
        ${record.resultSummary}
      </div>
      <div style="font-size:11px; background:rgba(16,185,129,0.2); color:#a7f3d0; padding:2px 8px; border-radius:10px; display:inline-block;">
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
    this.solBadgeEl.textContent = `SOL ${timeState.sol} | ${timeState.timeOfDayHours.toFixed(1)}h`;
    this.lightingBadgeEl.textContent = isDaylight ? '☀️ POLAR DAY' : '🌑 POLAR NIGHT';
    this.lightingBadgeEl.style.color = isDaylight ? '#fbbf24' : '#818cf8';
    this.speedValEl.textContent = `${this.timeManager.getMultiplier()}x`;

    // 2. Update Kid Resource Capsules
    const materials = Math.floor(s.materials ?? 800);
    this.resMaterialsEl.textContent = `${materials}`;
    this.resPowerEl.textContent = `${s.power.toFixed(0)} kWh`;
    this.resCrewEl.textContent = `${s.crew ?? 4}/${s.maxCrew ?? 8}`;
    this.resFoodEl.textContent = `${s.food.toFixed(0)}`;
    this.resWaterEl.textContent = `${s.water.toFixed(0)}`;
    this.resO2El.textContent = `${s.oxygen.toFixed(1)}%`;
    this.resMoraleEl.textContent = `${s.enthusiasm.toFixed(0)}%`;
    this.resScoreEl.textContent = `${this.decisionManager?.missionSuccessScore ?? 85}%`;

    // 3. Update Crisis Banner
    if (s.o2CrisisTimerHours !== undefined && s.o2CrisisTimerHours > 0) {
      this.crisisBannerEl.style.display = 'block';
      this.crisisActiveContentEl.style.display = 'flex';
      this.crisisFailedContentEl.style.display = 'none';
      this.crisisCountdownEl.textContent = `${s.o2CrisisTimerHours.toFixed(1)}h`;
    } else if (s.health <= 0) {
      this.crisisBannerEl.style.display = 'block';
      this.crisisActiveContentEl.style.display = 'none';
      this.crisisFailedContentEl.style.display = 'block';
    } else {
      this.crisisBannerEl.style.display = 'none';
    }

    // 4. Update Left Telemetry Panel
    this.telPower.textContent = `${s.power.toFixed(0)} kWh`;
    this.telHealth.textContent = `${s.health.toFixed(0)}%`;
    this.telO2.textContent = `${s.oxygen.toFixed(1)}%`;
    this.telStoredO2.textContent = `${(s.stored_o2 ?? 80).toFixed(0)} u`;
    this.telCO2.textContent = `${s.co2.toFixed(1)} u`;
    this.telTemp.textContent = `${s.temperature.toFixed(1)}°`;
    this.telWater.textContent = `${s.water.toFixed(0)} u`;
    this.telFood.textContent = `${s.food.toFixed(0)} u`;
    this.telRad.textContent = `${s.radiation.toFixed(1)}`;
    this.telShield.textContent = `${s.shield.toFixed(0)}%`;
    this.telDust.textContent = `${s.dust.toFixed(1)}%`;
    this.telShelter.textContent = s.isSheltered ? 'VAULT' : 'SURFACE';

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
      const anom = this.decisionManager.checkAnomalies(timeState.sol, timeState.timeOfDayHours);
      if (anom) {
        this.showIncidentModal(anom);
      }
    }
  }
}
