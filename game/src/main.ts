/**
 * Beyond Earth: First Light — Main Entry Point
 * Implements Decoupled 3-Manager System + Event Bus Architecture
 */

import { BUILDING_DEFINITIONS } from './core/Constants';
import { eventBus } from './core/EventBus';
import { soundManager } from './core/SoundManager';
import { BuildingType, DecisionEvaluationRequest, MissionFailedData } from './core/types';
import { MissionManager } from './mission/MissionManager';
import { NarrativeManager } from './narrative/NarrativeManager';
import { aiClient } from './network/AIClient';
import { ViewportRenderer } from './render/ViewportRenderer';
import { SimulationEngine } from './simulation/SimulationEngine';
import { AnomalyManager } from './simulation/AnomalyManager';
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
  const missionManager = new MissionManager(debriefModal, simulation, narrative);

  // 4b. Initialize Anomaly Decision Engine (§anomalies.json)
  const anomalyManager = new AnomalyManager(simulation);
  eventBus.on<{ sol: number; hour: number; isDaylight: boolean }>('sun_updated', (data) => {
    anomalyManager.checkPeriodicIncidents(data.sol, data.hour, data.isDaylight);
  });

  // 4b. Guided Tutorial Manager (used when guided step is active)
  const tutorial = new TutorialManager();
  tutorial.isActive = true;
  renderer.tutorialManager = tutorial;

  // 4c. Interactive Guided Mission Step UI & Objectives List
  const guideBanner = document.getElementById('guide-banner');
  const guideTag = document.getElementById('guide-step-tag');
  const guideText = document.getElementById('guide-banner-text');
  const btnGuideToggle = document.getElementById('btn-guide-toggle');
  const objectivesContainer = document.getElementById('mission-objectives-list');

  const renderGuideObjectivesList = () => {
    if (!objectivesContainer) return;
    if (simulation.currentChapter > 1 || !tutorial.isActive) {
      missionManager.renderObjectives();
      return;
    }
    const milestones = tutorial.getAllMilestones(simulation.grid);
    objectivesContainer.innerHTML = '';
    milestones.forEach((m) => {
      const li = document.createElement('li');
      li.className = `objective-item ${m.completed ? 'completed' : m.current ? 'active' : 'pending'}`;
      li.title = m.instruction;
      li.innerHTML = `
        <span class="obj-check">${m.completed ? '✓' : m.current ? '▶' : '○'}</span>
        <span class="obj-text">${m.title}</span>
      `;
      li.addEventListener('click', () => {
        if (m.target && !m.completed) {
          renderer.focusTile(m.target.x, m.target.y);
          if (m.tool) {
            tutorial.currentStep = m.step;
            eventBus.emit('tutorial_step_changed', m.step);
            catalog.selectTool(m.tool);
          }
        }
      });
      objectivesContainer.appendChild(li);
    });
  };

  let lastPannedStep: TutorialStep | null = null;

  const updateGuideUI = () => {
    if (simulation.currentChapter > 1) {
      if (guideBanner) {
        guideBanner.style.display = 'flex';
        guideBanner.classList.remove('completed');
      }
      if (btnGuideToggle) {
        btnGuideToggle.textContent = '🎯 Chapter Goals';
        btnGuideToggle.classList.add('active');
        btnGuideToggle.classList.remove('off');
      }
      catalog.highlightTool(null);
      if (simulation.currentChapter === 2) {
        if (guideTag) guideTag.textContent = 'LEVEL 2 • THE MOUNTAIN SHADOW (48H DARKNESS)';
        if (guideText) guideText.textContent = 'Expand battery storage to 200+ kWh and construct heating to endure the eclipse.';
      } else if (simulation.currentChapter === 3) {
        if (guideTag) guideTag.textContent = 'LEVEL 3 • DONKI SOLAR STORM & CME IMPACT';
        if (guideText) guideText.textContent = 'Build Lunar Soil Radiation Shield (+40%) & Storm Vault bunker to protect the crew.';
      } else if (simulation.currentChapter === 4) {
        if (guideTag) guideTag.textContent = 'LEVEL 4 • LUNAR ICE CRATER & HYDROPONICS';
        if (guideText) guideText.textContent = 'Deploy Ice Core Extractor in crater shadow and cultivate hydroponic crops.';
      } else if (simulation.currentChapter === 5) {
        if (guideTag) guideTag.textContent = 'LEVEL 5 • COMPOUND MOONQUAKE RESCUE';
        if (guideText) guideText.textContent = 'Clear dust from solar arrays, restore airlock power cables, and rescue Capt. Leo Ruiz.';
      } else if (simulation.currentChapter === 6) {
        if (guideTag) guideTag.textContent = 'LEVEL 6 • FIRST LIGHT DIPLOMA & EXPEDITION MARS';
        if (guideText) guideText.textContent = 'Artemis Mission Diploma awarded! Creative sandbox unlocked.';
      }
      renderGuideObjectivesList();
      return;
    }

    if (!tutorial.isActive) {
      if (guideBanner) {
        guideBanner.classList.remove('completed');
        guideBanner.style.display = 'flex';
      }
      if (guideTag) guideTag.textContent = 'GUIDED HIGHLIGHTS PAUSED';
      if (guideText) guideText.textContent = 'Guidance is paused. Click [💡 Guide: OFF] to resume step-by-step highlights.';
      if (btnGuideToggle) {
        btnGuideToggle.textContent = '💡 Guide: OFF';
        btnGuideToggle.classList.add('off');
        btnGuideToggle.classList.remove('active');
      }
      catalog.highlightTool(null);
      renderGuideObjectivesList();
      return;
    }

    if (btnGuideToggle) {
      btnGuideToggle.textContent = '💡 Guide: ON';
      btnGuideToggle.classList.remove('off');
      btnGuideToggle.classList.add('active');
    }

    if (guideBanner) {
      guideBanner.style.display = 'flex';
      if (tutorial.currentStep === TutorialStep.COMPLETE) {
        guideBanner.classList.add('completed');
      } else {
        guideBanner.classList.remove('completed');
      }
    }

    if (guideTag) guideTag.textContent = tutorial.getStepTag();
    if (guideText) guideText.textContent = tutorial.getInstructionText();

    catalog.highlightTool(tutorial.getHighlightedTool());

    const moonTarget = tutorial.getActiveMoonTarget(simulation.grid);
    if (moonTarget && tutorial.currentStep !== TutorialStep.COMPLETE && lastPannedStep !== tutorial.currentStep) {
      lastPannedStep = tutorial.currentStep;
      renderer.focusTile(moonTarget.x, moonTarget.y);
    }

    renderGuideObjectivesList();
  };

  btnGuideToggle?.addEventListener('click', () => {
    soundManager.playPop();
    tutorial.isActive = !tutorial.isActive;
    updateGuideUI();
    eventBus.emit('notification', {
      type: 'info',
      message: tutorial.isActive ? '💡 Guided Highlights Resumed.' : '💡 Guided Highlights Paused.',
    });
  });

  guideBanner?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#btn-guide-toggle')) return;
    if (!tutorial.isActive) {
      tutorial.isActive = true;
      updateGuideUI();
      return;
    }
    const moonTarget = tutorial.getActiveMoonTarget(simulation.grid);
    if (moonTarget && tutorial.currentStep !== TutorialStep.COMPLETE) {
      soundManager.playPop();
      renderer.focusTile(moonTarget.x, moonTarget.y);
      catalog.selectTool(moonTarget.type);
    }
  });

  // 4d. Mode Selector: "Build my own base" vs "Pre-built reference base"
  const btnScratch = document.getElementById('btn-mode-scratch');
  const btnPrebuilt = document.getElementById('btn-mode-prebuilt');

  const setMode = (mode: 'scratch' | 'prebuilt') => {
    if (mode === 'scratch') {
      btnScratch?.classList.add('active');
      btnPrebuilt?.classList.remove('active');
      tutorial.isActive = true;
      hud.setPowerFocusMode(false);
      simulation.clearBaseForScratch();
      tutorial.reset();
      missionManager.loadChapter(1);
      lastPannedStep = null;
      tutorial.evaluateGrid(simulation.grid);
      updateGuideUI();
      catalog.selectTool(tutorial.getHighlightedTool());
      soundManager.playPoof();
      renderer.recenter();
      eventBus.emit('notification', {
        type: 'success',
        message: '🏗️ Build My Own Base: 1400 Materials granted. Follow the guided highlights!',
      });
      milo.appendMILOMessage('🏗️ Build My Own Base: 1400 Materials granted. The Moon Day lasts 30 Earth days (15d Sun / 15d Night). Follow the glowing highlights to construct a resilient outpost!');
      const initialTip = tutorial.getMiloTip();
      if (initialTip) milo.appendMILOMessage(initialTip);
      updateSwitchboardUI();
    } else {
      btnPrebuilt?.classList.add('active');
      btnScratch?.classList.remove('active');
      tutorial.isActive = false;
      catalog.highlightTool(null);
      hud.setPowerFocusMode(false);
      simulation.loadPrebuiltBase();
      if (guideBanner) guideBanner.style.display = 'none';
      soundManager.playFanfare();
      renderer.recenter();
      eventBus.emit('notification', {
        type: 'success',
        message: '🚀 Pre-Built Reference Outpost Loaded! All 18 telemetry variables streaming live.',
      });
      milo.appendMILOMessage('🚀 Pre-Built Reference Outpost Loaded: All 12 machines & full power distribution grid active.');
      renderGuideObjectivesList();
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

  // 4d. Mission Failure Debrief & Evacuation Protocol
  eventBus.on<MissionFailedData>('mission_failed', (data) => {
    soundManager.playAlarm();
    anomalyManager.reset();
    debriefModal.showFailure(data, () => {
      setMode('scratch');
      simulation.setSpeed(1);
      eventBus.emit('notification', {
        type: 'info',
        message: '🔄 Mission Restarted: Base cleared, 1,400 materials loaded. Good luck, Commander!',
      });
      milo.appendMILOMessage('🔄 Mission Restarted: Base cleared, 1,400 materials loaded. Monitor your life support systems carefully to keep your crew healthy!');
    });
  });

  // 4e. Daily Sol Transition Audio Cue
  eventBus.on<number>('sol_changed', (_sol) => {
    soundManager.playRadioChirp();
  });

  eventBus.on('tutorial_step_changed', () => {
    updateGuideUI();
    const tip = tutorial.getMiloTip();
    if (tip && tutorial.isActive) {
      milo.appendMILOMessage(tip);
    }
  });

  eventBus.on('prologue_complete', () => {
    updateGuideUI();
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
      if (tutorial.isActive) {
        const moonTarget = tutorial.getActiveMoonTarget(simulation.grid);
        if (moonTarget && tile.x === moonTarget.x && tile.y === moonTarget.y) {
          // Direct click on the holographic beacon: auto-select the required module!
          catalog.selectTool(moonTarget.type);
          soundManager.playPop();
          eventBus.emit('notification', {
            type: 'info',
            message: `🎯 Target beacon activated! Selected ${BUILDING_DEFINITIONS[moonTarget.type].name}. Click again to construct!`,
          });
          return;
        }
      }

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

  eventBus.on<number>('speed_changed', (spd) => {
    updateSpeedUI(spd);
  });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      simulation.setSpeed(simulation.simulationSpeed === 0 ? 1 : 0);
    } else if (e.key === '1') {
      simulation.setSpeed(1);
    } else if (e.key === '2') {
      simulation.setSpeed(2);
    }
  });

  // 10. Notifications Streamed into Lower Mission Log & Sound (No disruptive screen popups)
  const tickerMsgEl = document.getElementById('ticker-message');
  const tickerContainer = document.querySelector('.status-ticker');
  let tickerResetTimeout: number | null = null;

  eventBus.on<{ type: string; message: string }>('notification', (n) => {
    if (n.type === 'success') {
      soundManager.playFanfare();
      renderer.triggerConfetti();
    } else if (n.type === 'warning') {
      soundManager.playPop();
    }

    if (tickerMsgEl) {
      tickerMsgEl.textContent = n.message;
      tickerContainer?.classList.remove('flash-info', 'flash-success', 'flash-warning');
      void (tickerContainer as HTMLElement)?.offsetWidth; // Trigger reflow for clean re-animation
      tickerContainer?.classList.add(`flash-${n.type || 'info'}`);

      if (tickerResetTimeout) clearTimeout(tickerResetTimeout);
      tickerResetTimeout = window.setTimeout(() => {
        tickerContainer?.classList.remove('flash-info', 'flash-success', 'flash-warning');
      }, 5000);
    }
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
      (b) => b.type !== 'power_cable' && b.type !== 'regolith_shield' && b.type !== 'outpost_base'
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

  eventBus.on('structure_placed', () => {
    if (tutorial.isActive) {
      tutorial.evaluateGrid(simulation.grid);
      if (tutorial.currentStep !== TutorialStep.COMPLETE) {
        catalog.selectTool(tutorial.getHighlightedTool());
      } else {
        catalog.clearSelection();
        eventBus.emit('tutorial_complete');
      }
      updateGuideUI();
    } else {
      renderGuideObjectivesList();
    }
    updateSwitchboardUI();
  });
  eventBus.on('cable_placed', () => {
    if (tutorial.isActive) {
      tutorial.evaluateGrid(simulation.grid);
      if (tutorial.currentStep !== TutorialStep.COMPLETE) {
        catalog.selectTool(tutorial.getHighlightedTool());
      } else {
        catalog.clearSelection();
        eventBus.emit('tutorial_complete');
      }
      updateGuideUI();
    } else {
      renderGuideObjectivesList();
    }
    updateSwitchboardUI();
  });
  eventBus.on('structure_demolished', () => {
    if (tutorial.isActive) {
      tutorial.evaluateGrid(simulation.grid);
      updateGuideUI();
    } else {
      renderGuideObjectivesList();
    }
    updateSwitchboardUI();
  });
  eventBus.on('cable_removed', () => {
    if (tutorial.isActive) {
      tutorial.evaluateGrid(simulation.grid);
      updateGuideUI();
    } else {
      renderGuideObjectivesList();
    }
    updateSwitchboardUI();
  });
  eventBus.on<number>('chapter_loaded', (ch) => {
    if (ch > 1) {
      tutorial.isActive = false;
    }
    updateGuideUI();
  });
  eventBus.on('device_toggled', () => updateSwitchboardUI());

  // 12. Initial State Sync & Start in "Build My Own Base" Mode
  setMode('scratch');
  simulation.updateDaylightStatus();
  hud.update(simulation.state);
  updateSwitchboardUI();
  simulation.start();

  // 13. Systems Tour (Dialogue off temporarily as requested)
  // setTimeout(() => {
  //   narrative.playScene('S-BASE-TOUR');
  // }, 600);

  console.log('Beyond Earth: First Light — Web Game Engine Ready!');
});
