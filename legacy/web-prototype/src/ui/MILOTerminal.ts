import { eventBus } from '../core/EventBus';
import { GameSnapshot, SpaceWeatherResponse } from '../core/types';
import { aiClient } from '../network/AIClient';

export class MILOTerminal {
  private chatHistoryEl: HTMLElement | null = null;
  private chatInputEl: HTMLInputElement | null = null;
  private chatSubmitBtn: HTMLButtonElement | null = null;
  private lastSnapshot: GameSnapshot | null = null;

  constructor() {
    this.chatHistoryEl = document.getElementById('milo-chat-history');
    this.chatInputEl = document.getElementById('milo-chat-input') as HTMLInputElement;
    this.chatSubmitBtn = document.getElementById('milo-chat-submit') as HTMLButtonElement;

    this.bindEvents();
    this.fetchWeather();
  }

  private bindEvents(): void {
    eventBus.on<GameSnapshot>('simulation_tick', (snap) => {
      this.lastSnapshot = snap;
    });

    if (this.chatSubmitBtn && this.chatInputEl) {
      this.chatSubmitBtn.addEventListener('click', () => this.sendMessage());
      this.chatInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    // Quick question buttons
    document.querySelectorAll('.milo-quick-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const text = (e.target as HTMLElement).textContent || '';
        if (this.chatInputEl) {
          this.chatInputEl.value = text;
          this.sendMessage();
        }
      });
    });

    // Alert triggered notification
    eventBus.on<string>('alert_triggered', (alertKey) => {
      this.appendMILOMessage(`⚠️ ALERT DETECTED: ${alertKey.toUpperCase()}. Systems Engineer Amir recommends checking our cable continuity and power reserves!`);
    });
  }

  public async fetchWeather(): Promise<void> {
    const weather = await aiClient.getSpaceWeather();
    this.renderWeather(weather);
  }

  private renderWeather(w: SpaceWeatherResponse): void {
    const radarHeadline = document.getElementById('radar-headline');
    const radarRisk = document.getElementById('radar-risk-level');
    const badge = document.getElementById('radar-data-badge');

    if (radarHeadline) radarHeadline.textContent = w.headline;
    if (radarRisk) {
      radarRisk.textContent = `RISK: ${w.risk_level.toUpperCase()}`;
      radarRisk.className = `radar-risk ${w.risk_level}`;
    }
    if (badge) {
      badge.textContent = w.data_source === 'live' ? '● LIVE NASA DONKI' : '◐ CURATED NASA DATA';
      badge.className = `data-badge ${w.data_source}`;
    }
  }

  private async sendMessage(): Promise<void> {
    if (!this.chatInputEl || !this.chatInputEl.value.trim()) return;

    const query = this.chatInputEl.value.trim();
    this.chatInputEl.value = '';

    this.appendUserMessage(query);

    const snapshot: GameSnapshot = this.lastSnapshot || {
      chapter: 1,
      sol: 1,
      power_kw_generated: 40,
      power_kw_consumed: 25,
      battery_charge_kwh: 80,
      battery_capacity_kwh: 100,
      oxygen_kg_remaining: 95,
      crew_health_avg: 100,
      crew_morale_avg: 90,
      active_alert: null,
    };

    const typingEl = this.appendMILOMessage('M.I.L.O. is calculating...');

    try {
      const res = await aiClient.askMILO(snapshot, query);
      typingEl.textContent = res.reply;
    } catch {
      typingEl.textContent = "M.I.L.O.: Transmission delayed. All primary lunar circuits are stable!";
    }
  }

  private appendUserMessage(text: string): void {
    if (!this.chatHistoryEl) return;
    const msg = document.createElement('div');
    msg.className = 'chat-bubble user';
    msg.textContent = text;
    this.chatHistoryEl.appendChild(msg);
    this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
  }

  public appendMILOMessage(text: string): HTMLElement {
    if (!this.chatHistoryEl) return document.createElement('div');
    const msg = document.createElement('div');
    msg.className = 'chat-bubble milo';
    msg.textContent = text;
    this.chatHistoryEl.appendChild(msg);
    this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
    return msg;
  }
}
