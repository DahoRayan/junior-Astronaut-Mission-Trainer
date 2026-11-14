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

    // 1. Power Telemetry: Net generation vs consumption + battery buffer
    const powerNet = state.powerBalanceKw;
    const batPct = state.batteryCapacityKwh > 0
      ? (state.batteryChargeKwh / state.batteryCapacityKwh) * 100
      : 100;
    const powerLabel = powerNet >= 0
      ? `+${powerNet.toFixed(1)} kW (Charging ⚡)`
      : `${powerNet.toFixed(1)} kW Deficit (${Math.round(state.batteryChargeKwh)} kWh ⏳)`;
    
    // Bar fill: when positive, high (70-100%); when negative, shows remaining battery %
    const powerMeterPct = powerNet >= 0
      ? Math.min(100, 50 + (batPct * 0.5))
      : Math.min(100, Math.max(5, batPct));

    this.updateMeter('power', powerMeterPct, powerLabel);

    // 2. Oxygen Telemetry: Reserve + net rate
    const o2Rate = state.oxygenBalanceKgH;
    const o2Label = o2Rate >= 0
      ? `${state.oxygenKgRemaining.toFixed(0)} kg (+${o2Rate.toFixed(1)} kg/h)`
      : `${state.oxygenKgRemaining.toFixed(0)} kg (${o2Rate.toFixed(1)} kg/h)`;
    this.updateMeter(
      'oxygen',
      (state.oxygenKgRemaining / 150) * 100,
      o2Label
    );

    // 3. Water Reserves
    this.updateMeter(
      'water',
      (state.waterLiters / 150) * 100,
      `${Math.round(state.waterLiters)} L Recycled`
    );

    // 4. Radiation Shielding
    this.updateMeter(
      'shield',
      state.radiationDoseMitigatedPct,
      `${state.radiationDoseMitigatedPct}% Shielded`
    );

    // 5. Crew Vitals
    const healthStatus = state.crewHealthAvg >= 90 ? 'Nominal' : state.crewHealthAvg >= 70 ? 'Fair' : 'Alert';
    this.updateMeter(
      'health',
      state.crewHealthAvg,
      `${Math.round(state.crewHealthAvg)}% (${healthStatus})`
    );

    // 6. Crew Morale
    const moraleStatus = state.crewMoraleAvg >= 85 ? 'Spirited' : 'Fatigued';
    this.updateMeter(
      'morale',
      state.crewMoraleAvg,
      `${Math.round(state.crewMoraleAvg)}% (${moraleStatus})`
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
