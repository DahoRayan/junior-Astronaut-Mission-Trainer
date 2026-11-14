import { eventBus } from '../core/EventBus';
import { ResourceState } from '../core/types';

export class HUDController {
  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    eventBus.on<ResourceState>('resources_updated', (state) => {
      this.update(state);
    });
  }

  public update(state: ResourceState): void {
    // Sol & Time
    const solEl = document.getElementById('hud-sol-val');
    const timeEl = document.getElementById('hud-time-val');
    const matEl = document.getElementById('hud-materials-val');

    if (solEl) solEl.textContent = `Sol ${state.sol}`;
    if (timeEl) timeEl.textContent = `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`;
    if (matEl) matEl.textContent = `${state.materials}`;

    // Telemetry Bars
    this.updateMeter(
      'power',
      state.powerKwConsumed > 0 ? (state.powerKwGenerated / (state.powerKwConsumed || 1)) * 50 : 100,
      `${state.powerKwGenerated.toFixed(1)} kW / ${state.powerKwConsumed.toFixed(1)} kW (Bat: ${Math.round(state.batteryChargeKwh)} kWh)`
    );

    this.updateMeter(
      'oxygen',
      (state.oxygenKgRemaining / 150) * 100,
      `${state.oxygenKgRemaining.toFixed(1)} kg (${state.oxygenBalanceKgH >= 0 ? '+' : ''}${state.oxygenBalanceKgH.toFixed(1)} kg/h)`
    );

    this.updateMeter(
      'water',
      (state.waterLiters / 150) * 100,
      `${Math.round(state.waterLiters)} L`
    );

    this.updateMeter(
      'shield',
      state.radiationDoseMitigatedPct,
      `${state.radiationDoseMitigatedPct}% Mitigated`
    );

    this.updateMeter(
      'health',
      state.crewHealthAvg,
      `${Math.round(state.crewHealthAvg)}%`
    );

    this.updateMeter(
      'morale',
      state.crewMoraleAvg,
      `${Math.round(state.crewMoraleAvg)}%`
    );
  }

  private updateMeter(key: string, pct: number, label: string): void {
    const clampedPct = Math.min(100, Math.max(0, pct));
    const barEl = document.getElementById(`hud-bar-${key}`);
    const valEl = document.getElementById(`hud-val-${key}`);

    if (barEl) {
      barEl.style.width = `${clampedPct}%`;
      // Dynamic alert colors
      if (clampedPct < 25) {
        barEl.className = 'hud-bar-fill critical';
      } else if (clampedPct < 50) {
        barEl.className = 'hud-bar-fill warning';
      } else {
        barEl.className = 'hud-bar-fill normal';
      }
    }

    if (valEl) {
      valEl.textContent = label;
    }
  }
}
