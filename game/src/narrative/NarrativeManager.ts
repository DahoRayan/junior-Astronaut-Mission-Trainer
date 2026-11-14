import { eventBus } from '../core/EventBus';
import { DialogueEntry } from '../core/types';
import { DialogueModal } from '../ui/DialogueModal';

export class NarrativeManager {
  private dialogueModal: DialogueModal;

  constructor(dialogueModal: DialogueModal) {
    this.dialogueModal = dialogueModal;
    this.bindEvents();
  }

  private bindEvents(): void {
    eventBus.on<DialogueEntry>('show_dialogue', (entry) => {
      this.dialogueModal.show(entry);
    });

    eventBus.on('prologue_start', () => {
      this.playPrologue();
    });
  }

  public playPrologue(): void {
    const sequence: DialogueEntry[] = [
      {
        speakerId: 'elena',
        speakerName: 'Capt. Elena Ruiz (Commander)',
        text: 'Touchdown confirmed on Shackleton Crater Rim! Artemis base site secure. Crew, check your spacesuits and prep for First Light.',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O. (AI Logistics Operator)',
        text: 'Greetings, Junior Commander! I am M.I.L.O., your Mission Intelligence & Logistics Operator. My telemetry circuits are ready to assist you.',
      },
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad (Systems Engineer)',
        text: 'Commander! The high ridge has perfect sunlight right now. Let\'s place our Solar Array and lay power cables to the Oxygen Electrolyzer!',
      },
    ];

    let index = 0;
    const showNext = () => {
      if (index < sequence.length) {
        const item = sequence[index++];
        this.dialogueModal.show(item, showNext);
      } else {
        eventBus.emit('prologue_complete', null);
      }
    };

    showNext();
  }
}
