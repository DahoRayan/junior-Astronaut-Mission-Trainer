/**
 * Anomaly Decision Engine
 * Directly loaded from NASA Anomalies specification (C:\Users\acer i7\Downloads\anomalies.json)
 *
 * Implements 4 Canonical Incidents:
 * 1. Oxygen Leak
 * 2. Solar Storm
 * 3. Lunar Dust on Solar Panels
 * 4. Water Electrolyzer Failure
 *
 * Provides kid-friendly dilemma questions with trade-offs and decision consequences that
 * actively mutate the 18 simulation metrics with immediate HUD telemetry updates.
 */

import { eventBus } from '../core/EventBus';
import { soundManager } from '../core/SoundManager';
import type { SimulationEngine } from './SimulationEngine';

export interface AnomalyChoice {
  id: string;
  title: string;
  action: string;
  tradeoff: string;
  costMaterials?: number;
  costPowerKwh?: number;
  costOxygen?: number;
  execute: (sim: SimulationEngine) => { success: boolean; message: string };
}

export interface AnomalyEvent {
  id: string;
  name: string;
  icon: string;
  description: string;
  danger: string;
  impact: string;
  question: string;
  choices: AnomalyChoice[];
}

export class AnomalyManager {
  public static readonly GRACE_PERIOD_SOLS: number = 3;

  private sim: SimulationEngine;
  private currentAnomaly: AnomalyEvent | null = null;
  private pastDecisions: Array<{ anomalyName: string; choiceTitle: string; sol: number }> = [];
  public lastTriggeredSol: number = 0;
  public nextRandomAnomalySol: number = 3.5;
  public isModalOpen: boolean = false;

  public static readonly ANOMALIES: AnomalyEvent[] = [
    {
      id: 'oxygen_leak',
      name: 'Oxygen Leak',
      icon: '🫧',
      description: "A leak develops in the habitat's oxygen distribution system, causing vital gas reserves to decrease into space.",
      danger: 'Continuous oxygen loss reduces oxygen available to astronauts and risks life-support failure.',
      impact: 'Oxygen production dropped • Reserve levels bleeding at -2.5 kg/h.',
      question: 'A pipe seal ruptured near the habitat docking port! Oxygen is venting into the vacuum. What is your command, Captain?',
      choices: [
        {
          id: 'eva_pipe_repair',
          title: '🧑‍🚀 EVA Spacewalk Repair',
          action: 'Dispatch an astronaut with emergency sealant and replacement valve.',
          tradeoff: 'Costs 25 Materials • Fully stops leak and restores 100% oxygen production.',
          costMaterials: 25,
          execute: (sim) => {
            if (sim.state.materials < 25) {
              return { success: false, message: 'Not enough materials for EVA repair (Need 25 Mat)!' };
            }
            sim.state.materials -= 25;
            sim.state.stored_o2 = Math.min(100, sim.state.stored_o2 + 20);
            sim.state.oxygen = 21.0;
            sim.state.enthusiasm = Math.min(100, sim.state.enthusiasm + 15);
            sim.state.activeAlert = null;
            return {
              success: true,
              message: 'Captain dispatched EVA repair crew: Pipe re-sealed! Oxygen pressure nominal.'
            };
          }
        },
        {
          id: 'isolate_valves',
          title: '🔒 Isolate Damaged Sector',
          action: 'Close isolation bulkheads to cut off the leaking sector from main habitat.',
          tradeoff: 'Free (0 Materials) • Saves remaining gas, but lowers cabin pressure (-25) and air quality (-8 Health).',
          execute: (sim) => {
            sim.state.oxygen = 16.5;
            sim.state.pressure = Math.max(30, sim.state.pressure - 25);
            sim.state.health = Math.max(0, sim.state.health - 10);
            sim.state.enthusiasm = Math.max(0, sim.state.enthusiasm - 15);
            return {
              success: true,
              message: 'Captain isolated sector: Leaking pipe quarantined. Pressure dropped to 75%.'
            };
          }
        },
        {
          id: 'boost_reserves',
          title: '💨 Emergency Tank Injection',
          action: 'Open secondary oxygen reserve tanks to over-pressurize the habitat while leak settles.',
          tradeoff: 'Consumes 20 Stored O2 & 20 kWh • Restores 100% breathable air without spending materials.',
          costOxygen: 20,
          execute: (sim) => {
            if (sim.state.stored_o2 < 20) {
              return { success: false, message: 'Not enough stored O2 in reserve tanks (Need 20 units)!' };
            }
            sim.state.stored_o2 -= 20;
            sim.state.oxygen = 22.0;
            sim.state.pressure = 100;
            sim.state.power = Math.max(0, sim.state.power - 20);
            return {
              success: true,
              message: 'Captain injected emergency O2 reserves: Cabin pressure and breathable air restored.'
            };
          }
        }
      ]
    },
    {
      id: 'solar_storm',
      name: 'Solar Storm',
      icon: '☀️',
      description: 'An intense solar particle event approaches the Moon, increasing radiation levels and threatening astronauts.',
      danger: 'Astronauts face elevated radiation exposure; surface operations risk equipment ionization.',
      impact: 'Solar radiation index surging to critical • Surface activities dangerous.',
      question: 'NASA Space Weather radar detected an imminent Coronal Mass Ejection (CME)! Radiation is spiking. How do you protect the outpost?',
      choices: [
        {
          id: 'regolith_vault_retreat',
          title: '🛡️ Retreat into Regolith Vault',
          action: 'Order all astronauts into the reinforced subterranean underground bunker.',
          tradeoff: '95% Radiation Protection • Consumes 30 kWh power and 10 water units.',
          execute: (sim) => {
            sim.state.isSheltering = true;
            sim.state.radiation = Math.max(10, sim.state.radiation - 45);
            sim.state.radiation_protection = 95;
            sim.state.power = Math.max(0, sim.state.power - 30);
            sim.state.water = Math.max(0, sim.state.water - 10);
            return {
              success: true,
              message: 'Crew secured inside the regolith bunker! Radiation exposure neutralized.'
            };
          }
        },
        {
          id: 'overcharge_shielding',
          title: '⚡ Overcharge Active Shielding',
          action: 'Channel maximum battery energy into electromagnetic deflector coils.',
          tradeoff: 'Costs 50 kWh Power • Boosts shield (+35) and purges radiation without bunkering.',
          costPowerKwh: 50,
          execute: (sim) => {
            if (sim.state.power < 50) {
              return { success: false, message: 'Not enough stored battery power (Need 50 kWh)!' };
            }
            sim.state.power -= 50;
            sim.state.shield = Math.min(100, sim.state.shield + 35);
            sim.state.radiation = Math.max(15, sim.state.radiation - 40);
            sim.state.enthusiasm = Math.min(100, sim.state.enthusiasm + 10);
            return {
              success: true,
              message: 'Electromagnetic deflector energized! Solar storm particles deflected away.'
            };
          }
        },
        {
          id: 'conserve_and_monitor',
          title: '⚠️ Minimal Surface Operations',
          action: 'Halt all non-essential surface work and monitor personal dosimeters.',
          tradeoff: 'Free (0 Power) • Crew absorbs radiation: Health -20%, Morale -25%, Crops -20%.',
          execute: (sim) => {
            sim.state.radiation = Math.min(100, sim.state.radiation + 20);
            sim.state.health = Math.max(0, sim.state.health - 20);
            sim.state.enthusiasm = Math.max(0, sim.state.enthusiasm - 25);
            sim.state.food_growth = Math.max(0, sim.state.food_growth - 20);
            return {
              success: true,
              message: 'Crew weathered solar storm outside bunker: Radiation dose absorbed.'
            };
          }
        }
      ]
    },
    {
      id: 'lunar_dust',
      name: 'Lunar Dust on Solar Panels',
      icon: '🧹',
      description: 'A layer of fine, electrostatically charged lunar regolith dust coats the solar arrays, reducing light intake.',
      danger: 'Solar power production drops significantly; battery banks charge too slowly before nightfall.',
      impact: 'Solar efficiency reduced by 35% • Dust coverage +45%.',
      question: 'High-velocity regolith dust has settled over the solar farm! Energy collection is degraded. How do you clear it?',
      choices: [
        {
          id: 'rover_brush_clean',
          title: '🧹 Deploy Dust Sweeper Rover',
          action: 'Dispatch maintenance rover equipped with soft microfiber rollers to sweep the panels clean.',
          tradeoff: 'Costs 20 Materials • Eliminates 100% dust coverage and restores solar efficiency.',
          costMaterials: 20,
          execute: (sim) => {
            if (sim.state.materials < 20) {
              return { success: false, message: 'Not enough materials to deploy rover sweeper kit (Need 20 Mat)!' };
            }
            sim.state.materials -= 20;
            sim.state.dust = 0;
            sim.state.enthusiasm = Math.min(100, sim.state.enthusiasm + 10);
            return {
              success: true,
              message: 'Maintenance rover swept all solar panels! Solar efficiency restored to 100%.'
            };
          }
        },
        {
          id: 'electrostatic_pulse',
          title: '⚡ Electrostatic Pulse Repulsion',
          action: 'Send an AC electric voltage waveform across the panel indium-tin-oxide coating to shake off dust.',
          tradeoff: 'Costs 30 kWh Power • No materials cost • Reduces dust to 5% (95% output).',
          costPowerKwh: 30,
          execute: (sim) => {
            if (sim.state.power < 30) {
              return { success: false, message: 'Not enough battery power to pulse electrostatic coils (Need 30 kWh)!' };
            }
            sim.state.power -= 30;
            sim.state.dust = 5;
            return {
              success: true,
              message: 'Electrostatic wave pulsed across arrays: Charged dust repelled into the vacuum!'
            };
          }
        },
        {
          id: 'tilt_panels_gravity',
          title: '📐 Angle Panels to Maximum Tilt',
          action: 'Mechanically tilt solar arrays to 80 degrees to allow lunar gravity and vibration to shed loose grains.',
          tradeoff: 'Free (0 Materials) • Dust partially sheds to 25% • 10 kWh motor draw.',
          execute: (sim) => {
            sim.state.dust = 25;
            sim.state.power = Math.max(0, sim.state.power - 10);
            return {
              success: true,
              message: 'Arrays tilted mechanically: Loose dust slid off, 25% stubborn dust remains.'
            };
          }
        }
      ]
    },
    {
      id: 'water_electrolyzer_failure',
      name: 'Water Electrolyzer Failure',
      icon: '💧',
      description: 'The water electrolyzer stops working correctly and can no longer split water into oxygen and hydrogen.',
      danger: 'Outpost loses primary oxygen production from recycled water, depleting reserve tanks.',
      impact: 'Electrolyzer offline • Oxygen generation halted • Water loop backing up.',
      question: 'The water electrolyzer catalytic membrane has fouled! Continuous oxygen generation stopped. What is your protocol?',
      choices: [
        {
          id: 'swap_membrane',
          title: '🛠️ Install Spare Catalyst Membrane',
          action: 'Replace the fouled polymer electrolyte membrane with a fresh spare module from inventory.',
          tradeoff: 'Costs 30 Materials • Completely repairs electrolyzer, restores +25 O2 and cools cabin.',
          costMaterials: 30,
          execute: (sim) => {
            if (sim.state.materials < 30) {
              return { success: false, message: 'Not enough materials to replace catalyst membrane (Need 30 Mat)!' };
            }
            sim.state.materials -= 30;
            sim.state.stored_o2 = Math.min(100, sim.state.stored_o2 + 25);
            sim.state.oxygen = 21.0;
            sim.state.temperature = 50.0;
            sim.state.enthusiasm = Math.min(100, sim.state.enthusiasm + 15);
            return {
              success: true,
              message: 'New catalyst membrane installed! Electrolyzer running at 100% nominal capacity.'
            };
          }
        },
        {
          id: 'conserve_water_rations',
          title: '🌱 Suspend Hydroponics Water Feed',
          action: 'Temporarily pause water feed to crop trays to preserve water while relying on stored oxygen tanks.',
          tradeoff: 'Free (0 Materials) • Crops lose 30% progress & Stored O2 -15 • Water conserved (+20).',
          costOxygen: 15,
          execute: (sim) => {
            sim.state.stored_o2 = Math.max(5, sim.state.stored_o2 - 15);
            sim.state.water = Math.min(100, sim.state.water + 20);
            sim.state.food_growth = Math.max(0, sim.state.food_growth - 30);
            sim.state.saturation = Math.max(0, sim.state.saturation - 15);
            return {
              success: true,
              message: 'Water diverted to life support: Crops paused, emergency reserves sustaining crew.'
            };
          }
        },
        {
          id: 'thermal_flush_bypass',
          title: '🔥 Thermal Descaling Flush',
          action: 'Inject high-temperature superheated steam to dissolve catalyst deposits without replacing hardware.',
          tradeoff: 'Costs 25 kWh Power • Partial O2 recovery (+10) • Cabin heat spikes (+15 Temp).',
          costPowerKwh: 25,
          execute: (sim) => {
            if (sim.state.power < 25) {
              return { success: false, message: 'Not enough battery power for thermal steam flush (Need 25 kWh)!' };
            }
            sim.state.power -= 25;
            sim.state.stored_o2 = Math.min(100, sim.state.stored_o2 + 10);
            sim.state.temperature = Math.min(75, sim.state.temperature + 15);
            sim.state.quenching = Math.max(0, sim.state.quenching - 15);
            return {
              success: true,
              message: 'Thermal descaling successful! Catalytic reaction resumed at 75% capacity.'
            };
          }
        }
      ]
    }
  ];

  constructor(sim: SimulationEngine) {
    this.sim = sim;
    this.bindDOM();
    this.bindEvents();
    // Schedule first random incident after the 3-day grace period
    this.scheduleNextAnomaly(AnomalyManager.GRACE_PERIOD_SOLS);
  }

  private bindEvents(): void {
    eventBus.on<string | undefined>('trigger_anomaly', (anomalyId) => {
      if (anomalyId) {
        this.triggerAnomaly(anomalyId);
      } else {
        this.triggerRandomAnomaly();
      }
    });
  }

  public scheduleNextAnomaly(currentSol: number): void {
    // Random sol interval between 1.5 and 3.5 days after the reference sol
    const randomInterval = 1.5 + Math.random() * 2.0; // 1.5 to 3.5 days
    this.nextRandomAnomalySol = Math.max(AnomalyManager.GRACE_PERIOD_SOLS + 0.1, currentSol + randomInterval);
  }

  private bindDOM(): void {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('anomaly-modal');
    if (!modal) return;

    // Trigger button in top bar or HUD
    const triggerBtn = document.getElementById('btn-trigger-anomaly');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.triggerRandomAnomaly();
      });
    }
  }

  public triggerRandomAnomaly(): void {
    const list = AnomalyManager.ANOMALIES;
    const index = Math.floor(Math.random() * list.length);
    this.triggerAnomaly(list[index].id);
  }

  public triggerAnomaly(anomalyId: string): void {
    const anomaly = AnomalyManager.ANOMALIES.find((a) => a.id === anomalyId);
    if (!anomaly) return;

    this.currentAnomaly = anomaly;
    this.lastTriggeredSol = this.sim.state.sol;

    // Return time acceleration to 1x when an anomaly strikes
    if (this.sim.simulationSpeed !== 1) {
      this.sim.setSpeed(1);
    }

    // Apply immediate physical crisis degradation to metrics
    this.applyAnomalyCrisisImpact(anomaly.id);

    // Fill Modal Data if DOM is present (browser runtime)
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('anomaly-modal');
      const nameEl = document.getElementById('anomaly-name');
      const iconEl = document.getElementById('anomaly-icon');
      const descEl = document.getElementById('anomaly-description');
      const impactEl = document.getElementById('anomaly-impact-text');
      const questionEl = document.getElementById('anomaly-question');
      const choicesEl = document.getElementById('anomaly-choices');

      if (modal && nameEl && iconEl && descEl && impactEl && questionEl && choicesEl) {
        nameEl.textContent = anomaly.name;
        iconEl.textContent = anomaly.icon;
        descEl.textContent = anomaly.description;
        impactEl.textContent = `${anomaly.impact} ${anomaly.danger}`;
        questionEl.textContent = anomaly.question;

        choicesEl.innerHTML = '';
        anomaly.choices.forEach((choice) => {
          const card = document.createElement('div');
          card.className = 'anomaly-choice-card';

          card.innerHTML = `
            <div class="choice-top">
              <span class="choice-title">${choice.title}</span>
              <span class="choice-tradeoff">${choice.tradeoff}</span>
            </div>
            <div class="choice-action">${choice.action}</div>
          `;

          card.addEventListener('click', () => {
            this.executeChoice(choice);
          });

          choicesEl.appendChild(card);
        });

        modal.classList.remove('hidden');
      }
    }

    this.isModalOpen = true;

    // Play warning alarm sound
    soundManager.playAlarm();

    // Notify ticker
    eventBus.emit('notification', {
      type: 'warning',
      message: `🚨 ANOMALY: ${anomaly.name}! Commander action required.`
    });
  }

  /**
   * Applies realistic immediate metric drops when an anomaly occurs,
   * immediately reflecting on all 18 HUD cards.
   */
  public applyAnomalyCrisisImpact(anomalyId: string): void {
    switch (anomalyId) {
      case 'oxygen_leak':
        this.sim.state.stored_o2 = Math.max(5, this.sim.state.stored_o2 - 15);
        this.sim.state.oxygen = Math.max(13.0, this.sim.state.oxygen - 6.0);
        this.sim.state.enthusiasm = Math.max(10, this.sim.state.enthusiasm - 10);
        this.sim.triggerAlert('oxygen_cabin_low');
        break;

      case 'solar_storm':
        this.sim.state.radiation = Math.min(90, this.sim.state.radiation + 45);
        this.sim.state.shield = Math.max(10, this.sim.state.shield - 15);
        this.sim.state.enthusiasm = Math.max(10, this.sim.state.enthusiasm - 15);
        this.sim.triggerAlert('radiation_high');
        break;

      case 'lunar_dust':
        this.sim.state.dust = Math.min(95, this.sim.state.dust + 45);
        this.sim.triggerAlert('dust_high');
        break;

      case 'water_electrolyzer_failure':
        this.sim.state.water = Math.max(5, this.sim.state.water - 15);
        this.sim.state.stored_o2 = Math.max(5, this.sim.state.stored_o2 - 12);
        this.sim.state.temperature = Math.min(75, this.sim.state.temperature + 12);
        this.sim.triggerAlert('stored_o2_low');
        break;
    }

    this.sim.recalculate();
    this.syncAliases();
    eventBus.emit('resources_updated', this.sim.state);
  }

  public executeChoice(choiceOrAnomalyId: AnomalyChoice | string, choiceId?: string): { success: boolean; message: string } {
    let choice: AnomalyChoice | undefined;
    if (typeof choiceOrAnomalyId === 'string' && choiceId) {
      const anomaly = AnomalyManager.ANOMALIES.find(a => a.id === choiceOrAnomalyId);
      choice = anomaly?.choices.find(c => c.id === choiceId);
      if (!this.currentAnomaly && anomaly) {
        this.currentAnomaly = anomaly;
      }
    } else if (typeof choiceOrAnomalyId === 'object') {
      choice = choiceOrAnomalyId;
    }

    if (!choice || !this.currentAnomaly) {
      return { success: false, message: 'No active anomaly or choice found.' };
    }

    const result = choice.execute(this.sim);
    if (!result.success) {
      soundManager.playAlarm();
      eventBus.emit('notification', {
        type: 'warning',
        message: `⚠️ Action Blocked: ${result.message}`
      });
      if (typeof alert !== 'undefined') alert(result.message);
      return result;
    }

    soundManager.playBuild();

    // 1. Recalculate power network and machines with newly adjusted metrics
    this.sim.recalculate();

    // 2. Synchronize legacy aliases
    this.syncAliases();

    // 3. Immediately emit resources_updated so ALL 18 HUD cards animate with new values
    eventBus.emit('resources_updated', this.sim.state);

    // Record decision
    this.pastDecisions.push({
      anomalyName: this.currentAnomaly.name,
      choiceTitle: choice.title,
      sol: this.sim.state.sol
    });

    // Close modal if in browser
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('anomaly-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }
    this.isModalOpen = false;

    // Stream success to bottom log ticker
    eventBus.emit('notification', {
      type: 'success',
      message: result.message
    });

    const resolvedId = this.currentAnomaly.id;
    this.currentAnomaly = null;
    eventBus.emit('anomaly_resolved', resolvedId);

    // Schedule next random incident 1.5 to 3.5 days in the future
    this.scheduleNextAnomaly(this.sim.state.sol);

    return result;
  }

  private syncAliases(): void {
    this.sim.state.batteryChargeKwh = this.sim.state.power;
    this.sim.state.oxygenKgRemaining = this.sim.state.stored_o2;
    this.sim.state.waterLiters = this.sim.state.water;
    this.sim.state.foodGrowth = this.sim.state.food_growth;
    this.sim.state.radiationProtection = this.sim.state.radiation_protection;
    this.sim.state.crewHealthAvg = this.sim.state.health;
    this.sim.state.crewMoraleAvg = this.sim.state.enthusiasm;
  }

  public checkPeriodicIncidents(sol: number, hour: number, _isDaylight: boolean): void {
    // Every 3 simple days (Sol 3, Sol 6, Sol 9, Sol 12, Sol 15...), trigger a random anomaly
    if (sol >= 3 && sol % 3 === 0 && this.lastTriggeredSol !== sol && hour >= 6) {
      if (!this.isModalOpen && this.currentAnomaly === null) {
        this.triggerRandomAnomaly();
      }
    }
  }

  public getPastDecisions(): Array<{ anomalyName: string; choiceTitle: string; sol: number }> {
    return this.pastDecisions;
  }

  public reset(): void {
    this.lastTriggeredSol = 0;
    this.nextRandomAnomalySol = 3.5;
    this.isModalOpen = false;
    this.currentAnomaly = null;
    this.pastDecisions = [];
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('anomaly-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }
  }
}
