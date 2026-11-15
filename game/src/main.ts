/**
 * Beyond Earth: First Light — Main Entry Point
 * Implements Decoupled 3-Manager System + Event Bus Architecture
 */

import { BUILDING_DEFINITIONS } from './core/Constants';
import { eventBus } from './core/EventBus';
import { soundManager } from './core/SoundManager';
import { BuildingType, DecisionEvaluationRequest } from './core/types';
import { MissionManager } from './mission/MissionManager';
import { NarrativeManager } from './narrative/NarrativeManager';
import { aiClient } from './network/AIClient';
import { ViewportRenderer } from './render/ViewportRenderer';
import { SimulationEngine } from './simulation/SimulationEngine';
import { TutorialManager, TutorialStep } from './simulation/TutorialManager';
import { CatalogPanel } from './ui/CatalogPanel';
import { DebriefModal } from './ui/DebriefModal';
import { HUDController } from './ui/HUDController';
import { MILOTerminal } from './ui/MILOTerminal';
import { VisualNovelController } from './ui/VisualNovelController';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const groundCanvas = document.getElementById('ground-3d-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Failed to locate #game-canvas!');
    return;
  }

  // 1. Initialize Simulation Engine
  const simulation = new SimulationEngine();

  // 2. Initialize Viewport Renderer & Canvas
  const resizeCanvas = () => {
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;
    renderer.recenter();
  };
  const renderer = new ViewportRenderer(canvas, simulation.grid, groundCanvas);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  renderer.start();

  // 3. Initialize UI Layer
  const hud = new HUDController();
  const catalog = new CatalogPanel();
  const milo = new MILOTerminal();
  const visualNovel = new VisualNovelController();
  const debriefModal = new DebriefModal();

  // 4. Initialize Narrative & Mission Managers
  const narrative = new NarrativeManager(visualNovel);
  new MissionManager(debriefModal, simulation, narrative);

  // 4b. Guided Tutorial Manager (used when guided step is active)
  const tutorial = new TutorialManager();
  tutorial.isActive = false;
  renderer.tutorialManager = tutorial;

  // 4c. Mode Selector: "Start building my own base" vs "Start by pre-built base"
  const btnScratch = document.getElementById('btn-mode-scratch');
  const btnPrebuilt = document.getElementById('btn-mode-prebuilt');

  const setMode = (mode: 'scratch' | 'prebuilt') => {
    if (mode === 'scratch') {
      btnScratch?.classList.add('active');
      btnPrebuilt?.classList.remove('active');
      tutorial.isActive = false;
      catalog.highlightTool(null);
      hud.setPowerFocusMode(false);
      simulation.clearBaseForScratch();
      soundManager.playPoof();
      eventBus.emit('notification', {
        type: 'success',
        message: '🏗️ Build from Scratch: 1400 Materials granted. Build freely without guidance!',
      });
      milo.appendMILOMessage('🏗️ Custom Outpost Mode: You have 1400 Materials. Build your own energy and life support systems without restrictions!');
      updateSwitchboardUI();
    } else {
      btnPrebuilt?.classList.add('active');
      btnScratch?.classList.remove('active');
      tutorial.isActive = false;
      catalog.highlightTool(null);
      hud.setPowerFocusMode(false);
      simulation.loadPrebuiltBase();
      soundManager.playFanfare();
      renderer.recenter();
      // narrative.playScene('S-BASE-TOUR'); // Dialogue off temporarily as requested
      eventBus.emit('notification', {
        type: 'success',
        message: '🚀 Pre-Built Outpost Loaded! All 18 telemetry variables streaming live.',
      });
      updateSwitchboardUI();
    }
  };

  btnScratch?.addEventListener('click', () => {
    soundManager.playPop();
    setMode('scratch');
  });

  btnPrebuilt?.addEventListener('click', () => {
    soundManager.playPop();
    setMode('prebuilt');
  });

  eventBus.on('tutorial_step_changed', () => {
    catalog.highlightTool(tutorial.getHighlightedTool());
    const moonTarget = tutorial.getActiveMoonTarget();
    if (moonTarget) {
      renderer.focusTile(moonTarget.x, moonTarget.y);
    }
    if (tutorial.currentStep === TutorialStep.COMPLETE) {
      hud.setPowerFocusMode(false);
      catalog.highlightTool(null);
    } else {
      milo.appendMILOMessage(`📍 ${tutorial.getInstructionText()}`);
    }
  });

  eventBus.on('prologue_complete', () => {
    catalog.highlightTool(tutorial.getHighlightedTool());
    const moonTarget = tutorial.getActiveMoonTarget();
    if (moonTarget) {
      renderer.focusTile(moonTarget.x, moonTarget.y);
    }
  });

  // 5. Connect Catalog / Tool Selection to Renderer & Sounds
  eventBus.on<BuildingType | null>('building_selected', (type) => {
    renderer.selectedBuildingType = type;
    renderer.isDemolishMode = false;
    if (type) soundManager.playPop();
  });

  eventBus.on<boolean>('demolish_toggled', (active) => {
    renderer.isDemolishMode = active;
    renderer.selectedBuildingType = null;
    soundManager.playPop();
  });

  // 6. Handle Clicks on Canvas Viewport
  canvas.addEventListener('click', async () => {
    const tile = renderer.hoveredTile;
    if (!tile) return;

    if (renderer.isDemolishMode) {
      const removed = simulation.removeStructure(tile.x, tile.y);
      if (removed) {
        soundManager.playPoof();
      }
      return;
    }

    // Direct machine toggle on lunar map when not in building placement or demolition mode
    if (!renderer.selectedBuildingType) {
      const gridTile = simulation.grid.getTile(tile.x, tile.y);
      if (gridTile?.building && gridTile.building.type !== 'power_cable' && gridTile.building.type !== 'regolith_shield') {
        const res = simulation.toggleDevicePower(tile.x, tile.y);
        if (res) {
          soundManager.playPop();
          const def = BUILDING_DEFINITIONS[res.building.type];
          const statusText = res.isEnabled ? 'ON 🟢' : 'OFF ⚪';
          const pwrDelta = def.powerGenerationKw > 0
            ? `${res.isEnabled ? '+' : '-'}${def.powerGenerationKw} kW Solar`
            : `${res.isEnabled ? '-' : '+'}${def.powerConsumptionKw} kW Load`;
          eventBus.emit('notification', {
            type: res.isEnabled ? 'info' : 'warning',
            message: `${def.name} switched ${statusText} (${pwrDelta}).`,
          });
          updateSwitchboardUI();
        }
        return;
      }
    }

    if (renderer.selectedBuildingType) {
      const type = renderer.selectedBuildingType;

      // In this guided phase, player is strictly restricted to highlighted moon spots
      if (tutorial.isActive) {
        const allowed = tutorial.isTileAllowed(tile.x, tile.y, type);
        if (!allowed) {
          soundManager.playPop();
          eventBus.emit('notification', {
            type: 'warning',
            message: `⚠️ Guided Phase: Please place on the highlighted beacon!`,
          });
          return;
        }
      }

      const success = simulation.placeStructure(type, tile.x, tile.y);

      if (success) {
        soundManager.playBuild();

        if (type !== 'power_cable') {
          // Evaluate decision via AI Service (with deterministic fallback)
          const req: DecisionEvaluationRequest = {
            chapter: simulation.currentChapter,
            sol: simulation.state.sol,
            action_type: 'build',
            building_type: type,
            power_balance_kw: simulation.state.powerBalanceKw,
            battery_charge_kwh: simulation.state.batteryChargeKwh,
            oxygen_balance_kg_h: simulation.state.oxygenBalanceKgH,
            crew_sheltered: true,
            active_alert: simulation.state.activeAlert,
          };

          const res = await aiClient.evaluateDecision(req);
          milo.appendMILOMessage(`[EVALUATION: ${res.rating.toUpperCase()}] ${res.feedback}`);
          if (res.science_fact?.text) {
            milo.appendMILOMessage(`💡 NASA SCIENCE FACT: ${res.science_fact.text} (${res.science_fact.source})`);
          }
        }
      }
    }
  });

  // 7. Viewport Overlay Recenter Button
  const recenterBtn = document.getElementById('btn-recenter');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', () => {
      soundManager.playPop();
      renderer.recenter();
    });
  }

  // 8. Sound Mute Toggle
  const soundToggleBtn = document.getElementById('btn-sound-toggle');
  const updateSoundUI = () => {
    if (soundToggleBtn) {
      soundToggleBtn.textContent = soundManager.isMuted() ? '🔇 Muted' : '🔊 Sound';
      soundToggleBtn.classList.toggle('muted', soundManager.isMuted());
    }
  };
  updateSoundUI();
  soundToggleBtn?.addEventListener('click', () => {
    soundManager.toggleMute();
    updateSoundUI();
  });

  const storyLogBtn = document.getElementById('btn-story-log');
  storyLogBtn?.addEventListener('click', () => {
    soundManager.playPop();
    const ch = simulation.currentChapter || 1;
    const sceneId = ch === 1 ? 'prologue' : `ch${ch}_intro`;
    narrative.playScene(sceneId, undefined, true); // force=true on explicit button click
  });

  // Accurate Day Cycle Mode Toggle
  document.getElementById('hud-cycle-badge')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.toggleDayCycleMode();
  });

  // 9. Crew Operations (Lunar Outpost Equipment Specification §5.2)
  document.getElementById('btn-crew-eat')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.eat();
  });
  document.getElementById('btn-crew-drink')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.drink();
  });
  document.getElementById('btn-crew-clean')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.cleanSolarPanels();
  });
  document.getElementById('btn-crew-reshield')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.reshield();
  });
  document.getElementById('btn-crew-farm')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.farm();
  });
  document.getElementById('btn-crew-harvest')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.harvast();
  });
  document.getElementById('btn-crew-shelter')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.toggleShelter();
  });
  document.getElementById('btn-crew-resupply-o2')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.demandEarthOxygenResupply();
  });
  document.getElementById('btn-crew-resupply-water')?.addEventListener('click', () => {
    soundManager.playPop();
    simulation.demandEarthWaterResupply();
  });

  // 10. Time / Speed Controls
  const speedButtons: Record<number, HTMLElement | null> = {
    0: document.getElementById('btn-speed-0'),
    1: document.getElementById('btn-speed-1'),
    2: document.getElementById('btn-speed-2'),
  };

  const updateSpeedUI = (activeSpeed: number) => {
    Object.entries(speedButtons).forEach(([spd, btn]) => {
      if (btn) {
        if (Number(spd) === activeSpeed) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  };

  [0, 1, 2].forEach((spd) => {
    speedButtons[spd]?.addEventListener('click', () => {
      soundManager.playPop();
      simulation.setSpeed(spd);
      updateSpeedUI(spd);
    });
  });

  // 10. Notifications Toast, Confetti & Sound
  const toastEl = document.getElementById('notification-toast');
  eventBus.on<{ type: string; message: string }>('notification', (n) => {
    if (n.type === 'success') {
      soundManager.playFanfare();
      renderer.triggerConfetti();
    }
    if (!toastEl) return;
    toastEl.textContent = n.message;
    toastEl.className = `notification-toast ${n.type}`;
    toastEl.classList.remove('hidden');

    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 3500);
  });

  // 11. Ergonomic Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Avoid hotkeys when typing in M.I.L.O. chat input
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      const currentSpeed = simulation.simulationSpeed;
      const nextSpeed = currentSpeed === 0 ? 1 : 0;
      soundManager.playPop();
      simulation.setSpeed(nextSpeed);
      updateSpeedUI(nextSpeed);
    } else if (e.key === '1') {
      soundManager.playPop();
      simulation.setSpeed(1);
      updateSpeedUI(1);
    } else if (e.key === '2') {
      soundManager.playPop();
      simulation.setSpeed(2);
      updateSpeedUI(2);
    } else if (e.key === 'Escape') {
      catalog.clearSelection();
      renderer.selectedBuildingType = null;
      renderer.isDemolishMode = false;
      soundManager.playPop();
    } else if (e.key === 'm' || e.key === 'M') {
      soundManager.toggleMute();
      updateSoundUI();
    }
  });

  // 11b. Device Power Switchboard Controller (§1.1 A6)
  const switchboardEl = document.getElementById('device-switchboard');
  const activeDevicesBadge = document.getElementById('active-devices-badge');

  const iconMap: Record<string, string> = {
    solar_array: '☀️',
    battery_bank: '🔋',
    kilopower_reactor: '⚛️',
    crew_habitat: '🏠',
    emergency_o2_generator: '⚠️',
    co2_scrubber: '🫧',
    oxygen_electrolyzer: '💨',
    water_recycler: '💧',
    water_extractor: '⛏️',
    heating_system: '🔥',
    hydroponics_tray: '🌱',
    subterranean_vault: '🏰',
    earth_channel: '📡',
  };

  const updateSwitchboardUI = () => {
    if (!switchboardEl) return;
    const buildings = simulation.grid.getPlacedBuildings().filter(
      (b) => b.type !== 'power_cable' && b.type !== 'regolith_shield'
    );
    if (buildings.length === 0) {
      switchboardEl.innerHTML = '<div style="padding: 10px; font-size: 0.72rem; color: #64748b; text-align: center;">No switchable machines placed yet.</div>';
      if (activeDevicesBadge) activeDevicesBadge.textContent = '0 / 0';
      return;
    }

    const onCount = buildings.filter((b) => b.isEnabled !== false).length;
    if (activeDevicesBadge) {
      activeDevicesBadge.textContent = `${onCount} / ${buildings.length} ON`;
      activeDevicesBadge.className = `data-badge ${onCount === buildings.length ? 'live' : 'warn'}`;
    }

    switchboardEl.innerHTML = '';
    buildings.forEach((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      const isEnabled = b.isEnabled !== false;
      const row = document.createElement('div');
      row.className = `device-switch-row ${isEnabled ? '' : 'is-off'}`;

      const left = document.createElement('div');
      left.className = 'device-switch-left';
      left.title = `Focus camera on ${def.name} at (${b.x}, ${b.y})`;
      left.addEventListener('click', () => {
        renderer.focusTile(b.x, b.y);
      });

      const icon = document.createElement('span');
      icon.className = 'device-switch-icon';
      icon.textContent = iconMap[b.type] || '⚙️';

      const meta = document.createElement('div');
      meta.className = 'device-switch-meta';

      const name = document.createElement('span');
      name.className = 'device-switch-name';
      name.textContent = `${def.name} (${b.x},${b.y})`;

      const pwr = document.createElement('span');
      pwr.className = 'device-switch-pwr';
      if (def.powerGenerationKw > 0) {
        pwr.textContent = `+${def.powerGenerationKw} kW Gen`;
      } else if (def.powerConsumptionKw > 0) {
        pwr.textContent = `-${def.powerConsumptionKw} kW Load`;
      } else {
        pwr.textContent = 'Storage / Passive';
      }

      meta.appendChild(name);
      meta.appendChild(pwr);
      left.appendChild(icon);
      left.appendChild(meta);

      const toggleBtn = document.createElement('button');
      toggleBtn.className = `device-toggle-btn ${isEnabled ? 'on' : 'off'}`;
      toggleBtn.textContent = isEnabled ? 'ON' : 'OFF';
      toggleBtn.title = `Turn ${def.name} ${isEnabled ? 'OFF' : 'ON'}`;
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.playPop();
        simulation.toggleDevicePower(b.x, b.y);
        updateSwitchboardUI();
      });

      row.appendChild(left);
      row.appendChild(toggleBtn);
      switchboardEl.appendChild(row);
    });
  };

  eventBus.on('structure_placed', () => updateSwitchboardUI());
  eventBus.on('structure_demolished', () => updateSwitchboardUI());
  eventBus.on('device_toggled', () => updateSwitchboardUI());

  // 12. Initial State Sync & Start Simulation Loop
  hud.update(simulation.state);
  updateSwitchboardUI();
  simulation.start();

  // 13. Systems Tour (Dialogue off temporarily as requested)
  // setTimeout(() => {
  //   narrative.playScene('S-BASE-TOUR');
  // }, 600);

  console.log('Beyond Earth: First Light — Web Game Engine Ready!');
});
