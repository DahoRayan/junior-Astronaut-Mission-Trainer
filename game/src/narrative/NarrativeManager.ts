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
      this.playScene('prologue', () => {
        eventBus.emit('prologue_complete', null);
      });
    });

    // Chapter load triggers
    eventBus.on<number>('chapter_loaded', (ch) => {
      const sceneId = `ch${ch}_intro`;
      if (this.hasScene(sceneId)) {
        this.playScene(sceneId);
      }
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
    return this.customScenes.get(sceneId) || STORY_SCENES[sceneId] || null;
  }

  public getAvailableScenes(): StoryScene[] {
    const all = { ...STORY_SCENES };
    this.customScenes.forEach((scene, id) => {
      all[id] = scene;
    });
    return Object.values(all);
  }
}
