import { CharacterId, DialogueEntry } from '../core/types';

export class DialogueModal {
  private modalEl: HTMLElement;
  private portraitEl: HTMLElement;
  private speakerNameEl: HTMLElement;
  private dialogueTextEl: HTMLElement;
  private optionsContainerEl: HTMLElement;

  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    this.modalEl = document.getElementById('dialogue-modal')!;
    this.portraitEl = document.getElementById('dialogue-portrait')!;
    this.speakerNameEl = document.getElementById('dialogue-speaker-name')!;
    this.dialogueTextEl = document.getElementById('dialogue-text')!;
    this.optionsContainerEl = document.getElementById('dialogue-options')!;
  }

  public show(entry: DialogueEntry, onComplete?: () => void): void {
    this.onCompleteCallback = onComplete || null;

    this.speakerNameEl.textContent = entry.speakerName;
    this.dialogueTextEl.textContent = entry.text;
    this.optionsContainerEl.innerHTML = '';

    // Style portrait badge
    this.setPortrait(entry.speakerId);

    if (entry.options && entry.options.length > 0) {
      entry.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-option-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          this.hide();
          if (this.onCompleteCallback) this.onCompleteCallback();
        });
        this.optionsContainerEl.appendChild(btn);
      });
    } else {
      const continueBtn = document.createElement('button');
      continueBtn.className = 'dialogue-option-btn primary';
      continueBtn.textContent = 'Continue ➜';
      continueBtn.addEventListener('click', () => {
        this.hide();
        if (this.onCompleteCallback) this.onCompleteCallback();
      });
      this.optionsContainerEl.appendChild(continueBtn);
    }

    this.modalEl.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl.classList.add('hidden');
  }

  private setPortrait(speakerId: CharacterId): void {
    const portraits: Record<CharacterId, { emoji: string; color: string; title: string }> = {
      elena: { emoji: '👩‍🚀', color: '#3b82f6', title: 'Capt. Elena Ruiz (Commander)' },
      amir: { emoji: '🔧', color: '#f59e0b', title: 'Amir Haddad (Systems Engineer)' },
      nia: { emoji: '🌱', color: '#10b981', title: 'Dr. Nia Okafor (Science Officer)' },
      daniel: { emoji: '🩺', color: '#ec4899', title: 'Dr. Daniel Park (Medical Officer)' },
      milo: { emoji: '🤖', color: '#06b6d4', title: 'M.I.L.O. (AI Logistics Operator)' },
    };

    const char = portraits[speakerId] || portraits.milo;
    this.portraitEl.textContent = char.emoji;
    this.portraitEl.style.borderColor = char.color;
  }
}
