import { MissionDebriefResponse, MissionFailedData } from '../core/types';

export class DebriefModal {
  private modalEl: HTMLElement | null;
  private cardEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private summaryEl: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private strengthsListEl: HTMLElement | null = null;
  private lessonsListEl: HTMLElement | null = null;
  private retryBtn: HTMLButtonElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.modalEl = document.getElementById('debrief-modal');
      if (this.modalEl) {
        this.cardEl = this.modalEl.querySelector('.debrief-card');
        this.titleEl = this.modalEl.querySelector('.debrief-title');
        this.summaryEl = document.getElementById('debrief-summary');
        this.badgeEl = document.getElementById('debrief-badge');
        this.strengthsListEl = document.getElementById('debrief-strengths');
        this.lessonsListEl = document.getElementById('debrief-lessons');
        this.retryBtn = document.getElementById('debrief-close-btn') as HTMLButtonElement;

        this.retryBtn?.addEventListener('click', () => {
          this.hide();
        });
      }
    } else {
      this.modalEl = null;
    }
  }

  public show(debrief: MissionDebriefResponse, onContinue?: () => void, chapter?: number): void {
    if (!this.modalEl) return;
    this.cardEl?.classList.remove('failure');
    if (this.titleEl) {
      this.titleEl.textContent = chapter
        ? `LEVEL ${chapter} COMPLETED • MISSION DEBRIEF`
        : 'NASA ARTEMIS MISSION DEBRIEF';
    }
    if (this.retryBtn) {
      this.retryBtn.textContent = chapter && chapter < 6
        ? `Start Level ${chapter + 1} ➜`
        : 'Proceed to Next Sol ➜';
    }

    if (this.summaryEl) this.summaryEl.textContent = debrief.summary;
    if (this.badgeEl) this.badgeEl.textContent = `🏅 ${debrief.nasa_badge_awarded}`;

    if (this.strengthsListEl) {
      this.strengthsListEl.innerHTML = '';
      debrief.strengths.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = `✓ ${s}`;
        this.strengthsListEl!.appendChild(li);
      });
    }

    if (this.lessonsListEl) {
      this.lessonsListEl.innerHTML = '';
      debrief.lessons.forEach((l) => {
        const li = document.createElement('li');
        li.textContent = `💡 ${l}`;
        this.lessonsListEl!.appendChild(li);
      });
    }

    if (this.retryBtn) {
      this.retryBtn.onclick = () => {
        this.hide();
        if (onContinue) onContinue();
      };
    }

    this.modalEl.classList.remove('hidden');
    this.modalEl.style.display = 'flex';
  }

  public showFailure(data: MissionFailedData, onRestart?: () => void): void {
    if (!this.modalEl) return;
    this.cardEl?.classList.add('failure');
    if (this.titleEl) this.titleEl.textContent = 'MISSION FAILED • OUTPOST EVACUATED';
    if (this.retryBtn) this.retryBtn.textContent = '🔄 Re-plan & Restart Mission';

    if (this.summaryEl) {
      this.summaryEl.textContent = `CRITICAL FAILURE (Sol ${data.sol}): ${data.reason}`;
    }
    if (this.badgeEl) this.badgeEl.textContent = '🚨 Evacuation Protocol Activated';

    if (this.strengthsListEl) {
      this.strengthsListEl.innerHTML = '';
      const strengths = [
        `Maintained habitat operations through Sol ${data.sols_completed}`,
        'Preserved telemetry records for NASA flight controller evaluation',
        'Crew successfully evacuated to orbit via emergency ascent vehicle',
      ];
      strengths.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = `✓ ${s}`;
        this.strengthsListEl!.appendChild(li);
      });
    }

    if (this.lessonsListEl) {
      this.lessonsListEl.innerHTML = '';
      const lessons = [
        data.lesson,
        'NASA Systems Engineering: Redundancy across power generation, batteries, and life support prevents single-point cascade failures.',
      ];
      lessons.forEach((l) => {
        const li = document.createElement('li');
        li.textContent = `💡 ${l}`;
        this.lessonsListEl!.appendChild(li);
      });
    }

    if (this.retryBtn) {
      this.retryBtn.onclick = () => {
        this.hide();
        this.cardEl?.classList.remove('failure');
        if (onRestart) onRestart();
      };
    }

    this.modalEl.classList.remove('hidden');
    this.modalEl.style.display = 'flex';
  }

  public hide(): void {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
      this.modalEl.style.display = 'none';
    }
  }
}
