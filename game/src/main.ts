/**
 * Beyond Earth: First Light — Main Entry Point
 * Implements Decoupled 3-Manager System + Event Bus Architecture
 */

import { BUILDING_DEFINITIONS, TILE_SIZE } from './core/Constants';
import { eventBus } from './core/EventBus';
import { soundManager } from './core/SoundManager';
import { BuildingType, DecisionEvaluationRequest } from './core/types';
import { MissionManager } from './mission/MissionManager';
import { NarrativeManager } from './narrative/NarrativeManager';
import { aiClient } from './network/AIClient';
import { ViewportRenderer } from './render/ViewportRenderer';
import { SimulationEngine } from './simulation/SimulationEngine';
import { CatalogPanel } from './ui/CatalogPanel';
import { DebriefModal } from './ui/DebriefModal';
import { DialogueModal } from './ui/DialogueModal';
import { HUDController } from './ui/HUDController';
import { MILOTerminal } from './ui/MILOTerminal';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
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
  const renderer = new ViewportRenderer(canvas, simulation.grid);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  renderer.start();

  // 3. Initialize UI Layer
  const hud = new HUDController();
  const catalog = new CatalogPanel();
  const milo = new MILOTerminal();
  const dialogueModal = new DialogueModal();
  const debriefModal = new DebriefModal();

  // 4. Initialize Narrative & Mission Managers
  new NarrativeManager(dialogueModal);
  new MissionManager(debriefModal);

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
        renderer.addFloatingText('Poof! 💨', tile.x * TILE_SIZE + 16, tile.y * TILE_SIZE, '#fb7185');
      }
      return;
    }

    if (renderer.selectedBuildingType) {
      const type = renderer.selectedBuildingType;
      const def = BUILDING_DEFINITIONS[type];
      const success = simulation.placeStructure(type, tile.x, tile.y);

      if (success) {
        soundManager.playBuild();

        // Floating juice text
        const impactText = def.powerGenerationKw > 0
          ? `+${def.powerGenerationKw} kW ⚡`
          : def.oxygenProductionKgH > 0
          ? `+${def.oxygenProductionKgH} kg/h 🫁`
          : `Placed ${def.name}! 🎉`;

        renderer.addFloatingText(impactText, tile.x * TILE_SIZE + 16, tile.y * TILE_SIZE, '#facc15');

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

  // 8. Sound Mute Toggle & 3D Orbit View Launcher
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

  const orbitViewBtn = document.getElementById('btn-orbit-view');
  orbitViewBtn?.addEventListener('click', () => {
    soundManager.playPop();
    window.open('http://127.0.0.1:5173', '_blank');
  });

  // 9. Time / Speed Controls
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

  // 12. Initial State Sync & Start Simulation Loop
  hud.update(simulation.state);
  simulation.start();

  // 13. Launch Authoritative Narrative Prologue
  setTimeout(() => {
    eventBus.emit('prologue_start', null);
  }, 500);

  console.log('Beyond Earth: First Light — Web Game Engine Ready!');
});
