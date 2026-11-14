import { eventBus } from '../core/EventBus';
import { VisualNovelController } from '../ui/VisualNovelController';
import { STORY_SCENES, StoryScene } from './StoryData';

export class NarrativeManager {
  private vn: VisualNovelController;
  private customScenes: Map<string, StoryScene> = new Map();

  constructor(vn: VisualNovelController) {
    this.vn = vn;
    this.bindEvents();
  }

  private bindEvents(): void {
    // Listen for story scene requests
    eventBus.on<string>('play_story_scene', (sceneId) => {
      this.playScene(sceneId);
    });

    // Prologue trigger
    eventBus.on('prologue_start', () => {
      this.playScene('S-PRO-1', () => {
        eventBus.emit('prologue_complete', null);
      });
    });
  }

  /**
   * Play any registered story scene by ID in full Visual Novel presentation
   */
  public playScene(sceneId: string, onComplete?: () => void): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      console.warn(`[NarrativeManager] Story scene "${sceneId}" not found.`);
      if (onComplete) onComplete();
      return;
    }

    this.vn.playScene(scene, () => {
      eventBus.emit('story_scene_completed', sceneId);
      if (onComplete) onComplete();
    });
  }

  /**
   * Register a new dynamic custom story scene at runtime
   */
  public registerScene(scene: StoryScene): void {
    this.customScenes.set(scene.id, scene);
  }

  public hasScene(sceneId: string): boolean {
    return !!this.getScene(sceneId);
  }

  public getScene(sceneId: string): StoryScene | null {
    const aliasMap: Record<string, string> = {
      prologue: 'S-PRO-1',
      ch1_intro: 'S-C1-1',
      ch1_fault: 'S-C1-3',
      ch2_intro: 'S-C2-1',
      ch3_intro: 'S-C3-1',
      ch4_intro: 'S-C4-1',
      ch5_intro: 'S-C5-1',
      epilogue: 'S-EPI-1',
    };
    const resolvedId = aliasMap[sceneId] || sceneId;
    return this.customScenes.get(resolvedId) || STORY_SCENES[resolvedId] || null;
  }

  public getAvailableScenes(): StoryScene[] {
    const all = { ...STORY_SCENES };
    this.customScenes.forEach((scene, id) => {
      all[id] = scene;
    });
    return Object.values(all);
  }
}
