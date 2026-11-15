import { eventBus } from '../core/EventBus';
import { ResourceState } from '../core/types';

export class HUDController {
  constructor() {
    this.bindEvents();
    this.bindTabs();
  }

  private bindTabs(): void {
    const btnTelemetry = document.getElementById('tab-btn-telemetry');
    const btnMilo = document.getElementById('tab-btn-milo');
    const paneTelemetry = document.getElementById('tab-pane-telemetry');
    const paneMilo = document.getElementById('tab-pane-milo');
    const topTelemetryBtn = document.getElementById('btn-toggle-telemetry');

    const selectTab = (tab: 'telemetry' | 'milo') => {
      if (tab === 'telemetry') {
        btnTelemetry?.classList.add('active');
        btnMilo?.classList.remove('active');
        paneTelemetry?.classList.remove('hidden');
        paneMilo?.classList.add('hidden');
        topTelemetryBtn?.classList.add('active');
      } else {
        btnMilo?.classList.add('active');
        btnTelemetry?.classList.remove('active');
        paneMilo?.classList.remove('hidden');
        paneTelemetry?.classList.add('hidden');
        topTelemetryBtn?.classList.remove('active');
      }
    };

    btnTelemetry?.addEventListener('click', () => selectTab('telemetry'));
    btnMilo?.addEventListener('click', () => selectTab('milo'));
    topTelemetryBtn?.addEventListener('click', () => selectTab('telemetry'));
  }

  private bindEvents(): void {
    eventBus.on<ResourceState>('resources_updated', (state) => {
      this.update(state);
    });

    eventBus.on<{ azimuth: number; isDaylight: boolean; mode: string; sol: number; hour: number }>('sun_updated', (data) => {
      const cycleEl = document.getElementById('hud-cycle-badge');
      if (cycleEl) {
        const azDeg = Math.round((data.azimuth * 180) / Math.PI) % 360;
        if (data.mode === 'compressed_24h') {
          if (data.isDaylight) {
            cycleEl.textContent = `☀️ Day (${Math.floor(data.hour)}h)`;
            cycleEl.classList.remove('night-mode');
            cycleEl.title = `Mode: Compressed 24h Educational Cycle. 12h Day / 12h Night. Click to switch.`;
          } else {
            cycleEl.textContent = `🌑 Lunar Night (${Math.floor(data.hour)}h)`;
            cycleEl.classList.add('night-mode');
            cycleEl.title = `Mode: Compressed 24h Educational Cycle. Night: Solar arrays produce 0 kW. Click to switch.`;
          }
        } else if (data.mode === 'lunar_synodic') {
          if (data.isDaylight) {
            cycleEl.textContent = `☀️ Synodic Day (${Math.floor(data.hour)}:00)`;
            cycleEl.classList.remove('night-mode');
            cycleEl.title = `Mode: Standard Lunar Synodic (15 Days Day / 15 Days Night, 1 Tick = 4h). Click to switch.`;
          } else {
            cycleEl.textContent = `🌑 Synodic Night (${Math.floor(data.hour)}:00)`;
            cycleEl.classList.add('night-mode');
            cycleEl.title = `Mode: Standard Lunar Synodic (15 Days Day / 15 Days Night, 1 Tick = 4h). Click to switch.`;
          }
        } else {
          // Canonical Shackleton Polar Rim
          if (data.isDaylight) {
            cycleEl.textContent = `☀️ Polar Sun (${azDeg}°)`;
            cycleEl.classList.remove('night-mode');
            cycleEl.title = `Mode: Shackleton Polar Rim (Continuous ~86% grazing sunlight at 89.9°S, Azimuth ${azDeg}°). Click to cycle mode.`;
          } else {
            cycleEl.textContent = `🌑 48h Shadow Eclipse`;
            cycleEl.classList.add('night-mode');
            cycleEl.title = `Mode: Shackleton Polar Rim. 48-Hour mountain ridge shadow eclipse active (-180°C, Solar 0 kW). Click to cycle mode.`;
          }
        }
      }
    });
  }

  public setPowerFocusMode(active: boolean): void {
    const hud = document.getElementById('perimeter-hud');
    if (hud) {
      hud.classList.toggle('tutorial-power-only', active);
    }
  }

  public update(state: ResourceState): void {
    // Sol & Time
    const solEl = document.getElementById('hud-sol-val');
    const timeEl = document.getElementById('hud-time-val');
    const matEl = document.getElementById('hud-materials-val');

    if (solEl) solEl.textContent = `Sol ${state.sol}`;
    if (timeEl) timeEl.textContent = `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`;
    if (matEl) matEl.textContent = `${state.materials}`;

    // --- TOP BAR CAPSULES ---
    const powerNet = state.powerBalanceKw;
    const batPct = state.batteryCapacityKwh > 0
      ? (state.power / state.batteryCapacityKwh) * 100
      : 100;
    let powerLabel = '';
    if (state.power >= state.batteryCapacityKwh && powerNet >= 0) {
      powerLabel = `${Math.round(state.power)} kWh (Full ⚡ +${powerNet.toFixed(1)} kW surplus)`;
    } else if (powerNet >= 0) {
      powerLabel = `${Math.round(state.power)} / ${state.batteryCapacityKwh} kWh (+${powerNet.toFixed(1)} kW ⚡)`;
    } else {
      powerLabel = `${Math.round(state.power)} kWh (${powerNet.toFixed(1)} kW drain ⏳)`;
    }
    const powerMeterPct = Math.min(100, Math.max(5, batPct));
    this.updateMeter('power', powerMeterPct, powerLabel);

    const o2Rate = state.oxygenBalanceKgH;
    const o2Label = o2Rate >= 0
      ? `${state.stored_o2.toFixed(1)} u (+${(o2Rate / 10).toFixed(2)}/h)`
      : `${state.stored_o2.toFixed(1)} u (${(o2Rate / 10).toFixed(2)}/h)`;
    this.updateMeter('oxygen', (state.stored_o2 / 100) * 100, o2Label);

    this.updateMeter('water', (state.water / 100) * 100, `${state.water.toFixed(1)} u (${Math.round(state.water * 10)} L)`);
    this.updateMeter('shield', state.radiation_protection, `${state.radiation_protection}% Shielded`);

    const healthStatus = state.health >= 90 ? 'Nominal' : state.health >= 70 ? 'Fair' : 'Alert';
    this.updateMeter('health', state.health, `${Math.round(state.health)}% (${healthStatus})`);

    const moraleStatus = state.enthusiasm >= 85 ? 'Spirited' : 'Fatigued';
    this.updateMeter('morale', state.enthusiasm, `${Math.round(state.enthusiasm)}% (${moraleStatus})`);

    // --- ALL VARIABLES TELEMETRY MONITOR ---
    // 1. power
    const pLvl = state.power < 20 ? 'critical' : state.power < 25 ? 'warning' : 'normal';
    const genText = state.is_daylight
      ? `☀️ Solar: ${state.powerKwGenerated.toFixed(1)} kW`
      : `🌑 Night: 0.0 kW`;
    this.updateVarCard(
      'power',
      `${Math.round(state.power)} / ${state.batteryCapacityKwh} kWh (${powerNet >= 0 ? '+' : ''}${powerNet.toFixed(1)} kW)`,
      batPct,
      `${genText} | Load: ${state.powerKwConsumed.toFixed(1)} kW`,
      pLvl
    );

    // 2. dust
    const dustLvl = state.dust > 75 ? 'critical' : state.dust > 40 ? 'warning' : 'normal';
    this.updateVarCard(
      'dust',
      `${state.dust.toFixed(1)}%`,
      state.dust,
      `Solar efficiency: ${(100 - state.dust).toFixed(1)}% (-${state.dust.toFixed(1)}% penalty)`,
      dustLvl
    );

    // 3. light_cycle
    const lightLvl = state.light_cycle < 25 ? 'critical' : state.light_cycle < 50 ? 'warning' : 'normal';
    this.updateVarCard(
      'light-cycle',
      `${Math.round(state.light_cycle)}%`,
      state.light_cycle,
      state.power >= 25 ? '+4/h (power ≥ 25 kW active)' : '-5/h (low power degradation)',
      lightLvl
    );

    // 4. stored_o2
    const o2TankLvl = state.stored_o2 <= 0 ? 'critical' : state.stored_o2 < 20 ? 'warning' : 'normal';
    this.updateVarCard(
      'stored-o2',
      `${state.stored_o2.toFixed(1)} u (${Math.round(state.stored_o2 * 10)} kg)`,
      state.stored_o2,
      `Crew drain: -3.0 u/h | Net: ${o2Rate >= 0 ? '+' : ''}${(o2Rate / 10).toFixed(2)} u/h`,
      o2TankLvl
    );

    // 5. oxygen (Nominal 19% - 22%, 20% target; produced by Oxygen Electrolyzer)
    let o2CabinLvl: 'normal' | 'warning' | 'critical' = 'normal';
    let o2Sub = '';

    if (state.oxygen > 25 && state.temperature > 55) {
      o2CabinLvl = 'critical';
      o2Sub = '🔥 FLASH FIRE DISASTER: Pure O₂ ignited by high temp!';
    } else if (state.oxygen >= 22) {
      o2CabinLvl = 'warning';
      o2Sub = `Emission PAUSED (≥22%): Resumes at 19% | Flammability warning`;
    } else if (state.oxygen <= 19) {
      o2CabinLvl = 'normal';
      o2Sub = `Emission ACTIVE (≤19%): Electrolyzer raising O₂ towards 22%`;
    } else if (state.oxygen < 16) {
      o2CabinLvl = state.oxygen < 10 ? 'critical' : 'warning';
      o2Sub = `⚠️ Hypoxia: Cabin O₂ low (${state.oxygen.toFixed(1)}% < 19%)`;
    } else {
      o2CabinLvl = 'normal';
      o2Sub = `Electrolyzer Active: Nominal safe band (19% - 22%)`;
    }

    // Scale bar so 20% sits at 50% width
    const o2BarPct = Math.min(100, Math.max(0, (state.oxygen / 40) * 100));
    this.updateVarCard(
      'oxygen',
      `${state.oxygen.toFixed(1)}%`,
      o2BarPct,
      o2Sub,
      o2CabinLvl
    );

    // 6. co2
    const co2Lvl = state.co2 >= 75 ? 'critical' : state.co2 > 50 ? 'warning' : 'normal';
    this.updateVarCard(
      'co2',
      `${state.co2.toFixed(1)} u (${(state.co2 * 2.5).toFixed(1)} kg)`,
      state.co2,
      `Crew: +1.0 u/tick | Scrubber: continuous (no auto-shutoff)`,
      co2Lvl
    );

    // 7. temperature (Maintained by Heating System)
    const tempLvl = state.temperature < 15 ? 'critical' : state.temperature < 35 ? 'warning' : 'normal';
    const tempC = Math.round((state.temperature - 50) * 1.5 + 21);
    const heaterSub = state.temperature >= 49 && state.temperature <= 51
      ? `Maintained by Heating System: 50 (21°C)`
      : state.temperature < 49
        ? `Heater ${state.temperature < 35 ? 'OFF/COLD: Loss to vacuum' : 'Warming to 50'}`
        : `Cooling towards nominal 50`;
    this.updateVarCard(
      'temperature',
      `${Math.round(state.temperature)} / 100 (${tempC}°C)`,
      state.temperature,
      heaterSub,
      tempLvl
    );

    // 8. water
    const waterLvl = state.water <= 5 ? 'critical' : state.water < 20 ? 'warning' : 'normal';
    this.updateVarCard(
      'water',
      `${state.water.toFixed(1)} u (${Math.round(state.water * 10)} L)`,
      state.water,
      `Recycler +3.0/h | Base +2.0/h | Electrolyzer -2.81/h`,
      waterLvl
    );

    // 10. food
    const foodLvl = state.food === 0 ? 'critical' : state.food < 4 ? 'warning' : 'normal';
    this.updateVarCard(
      'food',
      `${state.food} rations`,
      Math.min(100, (state.food / 40) * 100),
      `Crew meal cost: 4 rations (-4 food, +10 saturation)`,
      foodLvl
    );

    // 11. food_growth
    this.updateVarCard(
      'food-growth',
      `${Math.round(state.food_growth)}%`,
      state.food_growth,
      state.food_growth >= 10 ? 'Crops ready for harvest! (salad +1 ration)' : 'Tending crops via Farm event grants +5%',
      'normal'
    );

    // 12. radiation
    const radLvl = state.radiation > 60 ? 'critical' : state.radiation > 50 ? 'warning' : 'normal';
    this.updateVarCard(
      'radiation',
      `${Math.round(state.radiation)} / 100`,
      state.radiation,
      `Drifting toward target ${Math.max(0, 100 - (state.isSheltering ? Math.min(100, state.radiation_protection + 95) : state.radiation_protection))} | Safe: &le; 50`,
      radLvl
    );

    // 13. radiation_protection
    const radProtLvl = state.radiation_protection < 30 ? 'warning' : 'normal';
    this.updateVarCard(
      'radiation-protection',
      `${Math.round(state.radiation_protection)}%`,
      state.radiation_protection,
      state.isSheltering ? 'Storm Vault Active (+95% Shelter Boost)' : 'Reshield maintenance grants +10 protection',
      radProtLvl
    );

    // 14. shield
    const shieldLvl = state.shield < 30 ? 'warning' : 'normal';
    this.updateVarCard(
      'shield',
      `${Math.round(state.shield)}%`,
      state.shield,
      'Lunar regolith overburden | Reshield grants +15 shield',
      shieldLvl
    );

    // 15. health
    const healthLvl = state.health < 30 ? 'critical' : state.health < 70 ? 'warning' : 'normal';
    this.updateVarCard(
      'health',
      `${Math.round(state.health)}%`,
      state.health,
      state.health >= 90 ? 'Vitals nominal: all astronauts fit' : 'Alert: vitals degraded by life support deficits',
      healthLvl
    );

    // 16. enthusiasm
    const enthLvl = state.enthusiasm < 30 ? 'critical' : state.enthusiasm < 60 ? 'warning' : 'normal';
    this.updateVarCard(
      'enthusiasm',
      `${Math.round(state.enthusiasm)}%`,
      state.enthusiasm,
      'Crew morale and cohesion | Boost via meals and Earth resupply',
      enthLvl
    );

    // 17. saturation
    const satLvl = state.saturation <= 0 ? 'critical' : state.saturation < 20 ? 'warning' : 'normal';
    this.updateVarCard(
      'saturation',
      `${Math.round(state.saturation)}%`,
      state.saturation,
      'Hunger gauge: -2/h crew metabolism | Eat dinner: +10%',
      satLvl
    );

    // 18. quenching
    const quenLvl = state.quenching <= 0 ? 'critical' : state.quenching < 20 ? 'warning' : 'normal';
    this.updateVarCard(
      'quenching',
      `${Math.round(state.quenching)}%`,
      state.quenching,
      'Thirst gauge: -3/h crew metabolism | Drink water: +5%',
      quenLvl
    );
  }

  private updateVarCard(
    key: string,
    valText: string,
    pct: number,
    subText: string,
    alertLevel: 'normal' | 'warning' | 'critical'
  ): void {
    const valEl = document.getElementById(`var-val-${key}`);
    const barEl = document.getElementById(`var-bar-${key}`);
    const subEl = document.getElementById(`var-sub-${key}`);
    const cardEl = document.getElementById(`card-${key}`);

    if (valEl) valEl.textContent = valText;
    if (barEl) {
      barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      barEl.className = `var-bar-fill ${alertLevel}`;
    }
    if (subEl) subEl.textContent = subText;
    if (cardEl) {
      cardEl.className = `var-card ${alertLevel !== 'normal' ? 'card-' + alertLevel : ''}`;
    }
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
