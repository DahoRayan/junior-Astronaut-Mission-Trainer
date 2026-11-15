import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { MissionManager } from '../src/mission/MissionManager';
import { DebriefModal } from '../src/ui/DebriefModal';
import { NarrativeManager } from '../src/narrative/NarrativeManager';
import { eventBus } from '../src/core/EventBus';

console.log('🧪 Starting Level Completion & Structure Clearing Verification...\n');

const sim = new SimulationEngine();
const debrief = new DebriefModal();
const narrative = new NarrativeManager();
const mission = new MissionManager(debrief, sim, narrative);

// 1. Build test outpost structures around the base
sim.placeStructure('solar_array', 6, 4);
sim.placeStructure('battery_bank', 6, 6);
sim.placeStructure('power_cable', 6, 5);
sim.placeStructure('heating_system', 13, 7);

const buildingsBefore = sim.grid.getPlacedBuildings();
assert(buildingsBefore.length > 1, 'Should have multiple buildings before completion');
assert(sim.grid.getTile(6, 5)?.hasCable, 'Cable should exist at (6, 5)');
console.log(`✅ Step 1: Placed ${buildingsBefore.length} buildings + cables on the grid.`);

// 2. Set simulation to running at 1x
sim.setSpeed(1);
assert.strictEqual(sim.simulationSpeed, 1, 'Simulation speed should be 1x');

let notifEmitted = false;
let notifMessage = '';
eventBus.on<{ type: string; message: string }>('notification', (n) => {
  if (n.message.includes('LEVEL 1 COMPLETED')) {
    notifEmitted = true;
    notifMessage = n.message;
  }
});

// 3. Complete all objectives for Level 1
mission.completeLevel();

// 4. Verify game stopped (speed = 0)
assert.strictEqual(sim.simulationSpeed, 0, 'Simulation speed must be 0 (stopped)');
console.log('✅ Step 2: Game successfully stopped (simulation speed = 0).');

// 5. Verify notification
assert.strictEqual(notifEmitted, true, 'LEVEL 1 COMPLETED notification must be emitted');
console.log(`✅ Step 3: Clear completion notification emitted: "${notifMessage}"`);

// 6. Verify all current structures removed EXCEPT the central base
const buildingsAfter = sim.grid.getPlacedBuildings();
assert.strictEqual(buildingsAfter.length, 1, `Only the central base should remain, got ${buildingsAfter.length}`);
assert.strictEqual(buildingsAfter[0].type, 'outpost_base', 'Remaining building must be outpost_base');

// Check that temporary buildings were removed
assert.strictEqual(sim.grid.getTile(6, 4)?.building, undefined, 'Solar array at (6, 4) must be removed');
assert.strictEqual(sim.grid.getTile(6, 6)?.building, undefined, 'Battery bank at (6, 6) must be removed');
assert.strictEqual(sim.grid.getTile(13, 7)?.building, undefined, 'Heater at (13, 7) must be removed');
assert.strictEqual(sim.grid.getTile(6, 5)?.hasCable, false, 'Cable at (6, 5) must be removed');

// Check that the 4 central base tiles remain completely intact
const centerTiles = [
  { x: 11, y: 7 },
  { x: 12, y: 7 },
  { x: 11, y: 8 },
  { x: 12, y: 8 },
];
for (const pt of centerTiles) {
  const tile = sim.grid.getTile(pt.x, pt.y);
  assert(tile?.building, `Central base tile at (${pt.x}, ${pt.y}) must exist`);
  assert.strictEqual(tile?.building?.type, 'outpost_base', `Tile (${pt.x}, ${pt.y}) must be outpost_base`);
}
console.log('✅ Step 4: All placed structures and cables removed, 4-tile central base fully preserved.');

console.log('\n🎉 ALL LEVEL COMPLETION & STRUCTURE CLEARING VERIFICATION CHECKS PASSED!');
process.exit(0);
