import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { eventBus } from '../src/core/EventBus';

console.log('🧪 Starting Daily Materials Grant (+100 Mats/Day) Verification...\n');

const sim = new SimulationEngine();
const initialMats = sim.state.materials;
assert.strictEqual(initialMats, 1400, 'Starting materials should be 1400');
assert.strictEqual(sim.state.sol, 1, 'Starting sol should be 1');

let solChangedFired = false;
let notificationFired = false;
let lastNotifMessage = '';

eventBus.on<number>('sol_changed', (sol) => {
  solChangedFired = true;
});

eventBus.on<{ type: string; message: string }>('notification', (notif) => {
  if (notif.message.includes('+100 Materials')) {
    notificationFired = true;
    lastNotifMessage = notif.message;
  }
});

// Advance to 23:00 hours on Sol 1
sim.state.timeOfDayHours = 23.0;

// Next 1h tick crosses midnight into Sol 2
sim.tick(1);

assert.strictEqual(sim.state.sol, 2, 'Sol should now be 2');
assert.strictEqual(sim.state.materials, initialMats + 100, `Materials should be ${initialMats + 100}, got ${sim.state.materials}`);
assert.strictEqual(solChangedFired, true, 'sol_changed event must have fired');
assert.strictEqual(notificationFired, true, 'notification event with +100 materials must have fired');
console.log('✅ Check 1 Passed: Crossing into Sol 2 granted +100 materials (1400 -> 1500).');
console.log(`   Notification: "${lastNotifMessage}"`);

// Advance another 24 hours to cross into Sol 3
solChangedFired = false;
notificationFired = false;
sim.state.timeOfDayHours = 23.0;
sim.tick(1);

assert.strictEqual(sim.state.sol, 3, 'Sol should now be 3');
assert.strictEqual(sim.state.materials, initialMats + 200, `Materials should be ${initialMats + 200}, got ${sim.state.materials}`);
console.log('✅ Check 2 Passed: Crossing into Sol 3 granted another +100 materials (1500 -> 1600).');

console.log('\n🎉 ALL DAILY MATERIALS (+100 MATS/DAY) VERIFICATION CHECKS PASSED!');
