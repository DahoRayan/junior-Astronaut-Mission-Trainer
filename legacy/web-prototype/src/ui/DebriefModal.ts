import { MissionDebriefResponse } from '../core/types';

export class DebriefModal {
  private modalEl: HTMLElement;
  private scoreEl: HTMLElement;
  private summaryEl: HTMLElement;
  private badgeEl: HTMLElement;
  private strengthsListEl: HTMLElement;
  private lessonsListEl: HTMLElement;
  private retryBtn: HTMLButtonElement;

  constructor() {
    this.modalEl = document.getElementById('debrief-modal')!;
    this.scoreEl = document.getElementById('debrief-score')!;
    this.summaryEl = document.getElementById('debrief-summary')!;
    this.badgeEl = document.getElementById('debrief-badge')!;
    this.strengthsListEl = document.getElementById('debrief-strengths')!;
    this.lessonsListEl = document.getElementById('debrief-lessons')!;
    this.retryBtn = document.getElementById('debrief-close-btn') as HTMLButtonElement;

    this.retryBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  public show(debrief: MissionDebriefResponse, onContinue?: () => void): void {
    this.scoreEl.textContent = `${debrief.survivability_score}/100`;
    this.summaryEl.textContent = debrief.summary;
    this.badgeEl.textContent = `🏅 ${debrief.nasa_badge_awarded}`;

    this.strengthsListEl.innerHTML = '';
    debrief.strengths.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = `✓ ${s}`;
      this.strengthsListEl.appendChild(li);
    });

    this.lessonsListEl.innerHTML = '';
    debrief.lessons.forEach((l) => {
      const li = document.createElement('li');
      li.textContent = `💡 ${l}`;
      this.lessonsListEl.appendChild(li);
    });

    this.retryBtn.onclick = () => {
      this.hide();
      if (onContinue) onContinue();
    };

    this.modalEl.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl.classList.add('hidden');
  }
}
