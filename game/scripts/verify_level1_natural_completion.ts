import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { MissionManager } from '../src/mission/MissionManager';
import { DebriefModal } from '../src/ui/DebriefModal';
import { NarrativeManager } from '../src/narrative/NarrativeManager';
import { VisualNovelController } from '../src/ui/VisualNovelController';
import { eventBus } from '../src/core/EventBus';

console.log('🧪 Starting Natural Level 1 Completion Verification...');

// 1. Setup headless test environment
const sim = new SimulationEngine();
const narrative = new NarrativeManager();
const debriefModal = new DebriefModal();
const mission = new MissionManager(debriefModal, sim, narrative);

let modalShown = false;
let completedChapterNumber: number | undefined = undefined;

debriefModal.show = (_debrief: any, _onContinue?: () => void, chapter?: number) => {
  modalShown = true;
  completedChapterNumber = chapter;
};

// 2. Start at Chapter 1
mission.loadChapter(1);
assert.strictEqual(mission.currentChapter, 1, 'Current chapter must be 1');
assert.strictEqual(mission.objectives.length, 6, 'Level 1 must have 6 base establishment objectives');

// 3. Sequentially place all 6 base components
console.log('Placing Step 1: Solar Array...');
sim.placeStructure('solar_array', 6, 2);

console.log('Placing Step 2: Battery Bank...');
sim.placeStructure('battery_bank', 6, 3);

console.log('Placing Step 3: Power Cable...');
sim.placeStructure('power_cable', 6, 4);

console.log('Placing Step 4: Crew Habitat...');
sim.placeStructure('crew_habitat', 6, 5);

console.log('Placing Step 5: Oxygen Electrolyzer...');
sim.placeStructure('oxygen_electrolyzer', 6, 6);

console.log('Placing Step 6: Heating System...');
sim.placeStructure('heating_system', 6, 7);

// 4. Verify that all 6 objectives are completed
const allDone = mission.objectives.every((o) => o.completed);
assert.strictEqual(allDone, true, 'All 6 Level 1 objectives must be marked complete');
console.log('✅ All 6 objectives successfully verified as completed.');

// 5. Verify that level completion stopped the game
assert.strictEqual(sim.simulationSpeed, 0, 'Simulation clock must be stopped (speed = 0)');
console.log('✅ Simulation clock stopped immediately upon Level 1 completion.');

// 6. Verify that level completion debrief was invoked
assert.strictEqual(mission.isCompletingLevel, true, 'isCompletingLevel must be true');

// Wait for debrief modal trigger
setTimeout(() => {
  assert.strictEqual(modalShown, true, 'Debrief modal must be shown');
  assert.strictEqual(completedChapterNumber, 1, 'Completed chapter number must be 1');
  console.log('✅ Debrief modal triggered with Level 1 completion certificate!');
  console.log('\n🎉 NATURAL LEVEL 1 COMPLETION TEST PASSED PERFECTLY!\n');
  process.exit(0);
}, 800);
