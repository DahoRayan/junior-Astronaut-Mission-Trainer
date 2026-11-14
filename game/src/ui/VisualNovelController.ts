import { CharacterId } from '../core/types';
import { soundManager } from '../core/SoundManager';
import { CharacterMood, StoryChoice, StoryLine, StoryScene } from '../narrative/StoryData';

export class VisualNovelController {
  private containerEl: HTMLElement;
  private sceneTitleEl: HTMLElement;
  private sceneLocEl: HTMLElement;
  private avatarEl: HTMLElement;
  private expressionEl: HTMLElement;
  private speakerNameEl: HTMLElement;
  private speakerRoleEl: HTMLElement;
  private textEl: HTMLElement;
  private continueIndicatorEl: HTMLElement;
  private choicesContainerEl: HTMLElement;

  private currentScene: StoryScene | null = null;
  private currentLineIndex: number = 0;
  private onCompleteCallback: (() => void) | null = null;

  // Typewriter state
  private isTyping: boolean = false;
  private typeTimer: number | null = null;
  private fullCurrentText: string = '';
  private displayedCharCount: number = 0;

  // Controls state
  private isAutoPlay: boolean = false;
  private autoPlayTimer: number | null = null;

  constructor() {
    this.containerEl = document.getElementById('vn-theater')!;
    this.sceneTitleEl = document.getElementById('vn-scene-title')!;
    this.sceneLocEl = document.getElementById('vn-scene-location')!;
    this.avatarEl = document.getElementById('vn-character-avatar')!;
    this.expressionEl = document.getElementById('vn-character-expression')!;
    this.speakerNameEl = document.getElementById('vn-speaker-name')!;
    this.speakerRoleEl = document.getElementById('vn-speaker-role')!;
    this.textEl = document.getElementById('vn-dialogue-text')!;
    this.continueIndicatorEl = document.getElementById('vn-continue-indicator')!;
    this.choicesContainerEl = document.getElementById('vn-choice-container')!;

    this.bindControls();
  }

  private bindControls(): void {
    // Click on dialogue box or press Space/Enter to advance
    const dialogueBox = this.containerEl.querySelector('.vn-dialogue-box');
    dialogueBox?.addEventListener('click', (e) => {
      // Don't trigger if clicked on a choice button or control button
      if ((e.target as HTMLElement).closest('.vn-choice-btn') || (e.target as HTMLElement).closest('.vn-ctrl-btn')) {
        return;
      }
      this.handleAdvance();
    });

    window.addEventListener('keydown', (e) => {
      if (this.containerEl.classList.contains('hidden')) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        this.handleAdvance();
      }
    });

    // Control buttons
    document.getElementById('vn-btn-auto')?.addEventListener('click', () => this.toggleAutoPlay());
    document.getElementById('vn-btn-skip')?.addEventListener('click', () => this.skipToEnd());
  }

  public playScene(scene: StoryScene, onComplete?: () => void): void {
    this.currentScene = scene;
    this.currentLineIndex = 0;
    this.onCompleteCallback = onComplete || null;

    this.sceneTitleEl.textContent = scene.title;
    this.sceneLocEl.textContent = scene.location || 'Shackleton Crater Rim';

    this.containerEl.classList.remove('hidden');
    this.renderCurrentLine();
  }

  public isPlaying(): boolean {
    return !this.containerEl.classList.contains('hidden');
  }

  private handleAdvance(): void {
    if (this.isTyping) {
      // Fast complete text immediately
      this.finishTyping();
      return;
    }

    const currentLine = this.getCurrentLine();
    if (!currentLine) return;

    // If waiting for choice selection, don't advance on click
    if (currentLine.choices && currentLine.choices.length > 0) {
      return;
    }

    this.advanceNextLine();
  }

  private advanceNextLine(): void {
    this.clearTimers();
    this.currentLineIndex++;

    if (!this.currentScene || this.currentLineIndex >= this.currentScene.lines.length) {
      this.closeScene();
    } else {
      this.renderCurrentLine();
    }
  }

  private getCurrentLine(): StoryLine | null {
    if (!this.currentScene || this.currentLineIndex >= this.currentScene.lines.length) {
      return null;
    }
    return this.currentScene.lines[this.currentLineIndex];
  }

  private renderCurrentLine(): void {
    const line = this.getCurrentLine();
    if (!line) return;

    // Play optional SFX
    if (line.sfx === 'radio') soundManager.playRadioChirp();
    else if (line.sfx === 'alarm') soundManager.playAlarm();
    else if (line.sfx === 'fanfare') soundManager.playFanfare();

    // Trigger visual screen shake if dramatic
    if (line.shake) {
      this.containerEl.classList.add('vn-shake');
      setTimeout(() => this.containerEl.classList.remove('vn-shake'), 500);
    }

    // Set speaker metadata
    this.speakerNameEl.textContent = line.speakerName.toUpperCase();
    this.speakerRoleEl.textContent = line.role.toUpperCase();
    this.applySpeakerStyle(line.speakerId);

    // Set mood expression
    this.setMood(line.mood || 'confident');

    // Hide choices & indicator during typing
    this.choicesContainerEl.classList.add('hidden');
    this.choicesContainerEl.innerHTML = '';
    this.continueIndicatorEl.style.opacity = '0';

    // Start typewriter effect
    this.startTypewriter(line.text);
  }

  private startTypewriter(text: string): void {
    this.clearTimers();
    this.fullCurrentText = text;
    this.displayedCharCount = 0;
    this.textEl.textContent = '';
    this.isTyping = true;

    const charSpeedMs = 20;

    this.typeTimer = window.setInterval(() => {
      this.displayedCharCount++;
      this.textEl.textContent = this.fullCurrentText.slice(0, this.displayedCharCount);

      // Play soft teletype blip every 3 characters
      if (this.displayedCharCount % 3 === 0) {
        soundManager.playBlip();
      }

      if (this.displayedCharCount >= this.fullCurrentText.length) {
        this.finishTyping();
      }
    }, charSpeedMs);
  }

  private finishTyping(): void {
    this.clearTimers();
    this.isTyping = false;
    this.textEl.textContent = this.fullCurrentText;
    this.continueIndicatorEl.style.opacity = '1';

    const line = this.getCurrentLine();
    if (!line) return;

    // If there are branching choices, show them now
    if (line.choices && line.choices.length > 0) {
      this.renderChoices(line.choices);
    } else if (this.isAutoPlay) {
      // Schedule auto advance
      this.autoPlayTimer = window.setTimeout(() => {
        this.advanceNextLine();
      }, 2200);
    }
  }

  private renderChoices(choices: StoryChoice[]): void {
    this.choicesContainerEl.innerHTML = '';
    this.continueIndicatorEl.style.opacity = '0';

    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'vn-choice-btn';
      btn.innerHTML = `<span class="vn-choice-num">[${idx + 1}]</span> ${choice.text}`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.playPop();

        if (choice.onSelect) choice.onSelect();

        this.choicesContainerEl.classList.add('hidden');

        if (choice.nextIndex !== undefined) {
          this.currentLineIndex = choice.nextIndex - 1;
        }

        this.advanceNextLine();
      });

      this.choicesContainerEl.appendChild(btn);
    });

    this.choicesContainerEl.classList.remove('hidden');
  }

  private applySpeakerStyle(speakerId: CharacterId): void {
    const charProfiles: Record<CharacterId, { emoji: string; color: string; badgeColor: string }> = {
      elena: { emoji: '👩‍🚀', color: '#f59e0b', badgeColor: '#1d4ed8' },
      amir: { emoji: '🔧', color: '#f97316', badgeColor: '#334155' },
      nia: { emoji: '🌱', color: '#10b981', badgeColor: '#0f766e' },
      daniel: { emoji: '🩺', color: '#ec4899', badgeColor: '#0284c7' },
      milo: { emoji: '🤖', color: '#38bdf8', badgeColor: '#0369a1' },
    };

    const profile = charProfiles[speakerId] || charProfiles.milo;
    this.avatarEl.textContent = profile.emoji;
    this.avatarEl.style.borderColor = profile.color;
    this.avatarEl.style.boxShadow = `0 0 25px ${profile.color}44`;
    this.speakerNameEl.style.color = profile.color;
    this.speakerRoleEl.style.background = profile.badgeColor;
  }

  private setMood(mood: CharacterMood): void {
    this.expressionEl.textContent = mood.toUpperCase();
    this.expressionEl.className = `vn-expression-badge mood-${mood}`;
  }

  private toggleAutoPlay(): void {
    this.isAutoPlay = !this.isAutoPlay;
    soundManager.playPop();

    const btn = document.getElementById('vn-btn-auto');
    if (btn) {
      btn.classList.toggle('active', this.isAutoPlay);
      btn.textContent = this.isAutoPlay ? '⏸ Auto' : '▶ Auto';
    }

    if (this.isAutoPlay && !this.isTyping) {
      this.advanceNextLine();
    }
  }

  private skipToEnd(): void {
    soundManager.playPop();
    const line = this.getCurrentLine();
    // Stop at choices
    if (line && line.choices && line.choices.length > 0) {
      this.finishTyping();
      return;
    }
    this.closeScene();
  }

  public closeScene(): void {
    this.clearTimers();
    this.isAutoPlay = false;
    this.containerEl.classList.add('hidden');

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  private clearTimers(): void {
    if (this.typeTimer !== null) {
      clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
    if (this.autoPlayTimer !== null) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}
