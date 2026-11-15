import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { MissionManager } from '../src/mission/MissionManager';
import { DebriefModal } from '../src/ui/DebriefModal';
import { NarrativeManager } from '../src/narrative/NarrativeManager';
import { AnomalyManager } from '../src/simulation/AnomalyManager';
import { eventBus } from '../src/core/EventBus';

console.log('🧪 Starting Level 3 Vault ➔ Solar Storm (3s) Verification...\n');

const sim = new SimulationEngine();
const debrief = new DebriefModal();
const narrative = new NarrativeManager();
const mission = new MissionManager(debrief, sim, narrative);
const anomalyManager = new AnomalyManager(sim);

// 1. Advance to Level 3
mission.loadChapter(3);
assert.strictEqual(mission.currentChapter, 3, 'Must be on Chapter 3');

const vaultObj = mission.objectives.find((o) => o.id === 'build_vault');
const stormObj = mission.objectives.find((o) => o.id === 'shelter_cme');
assert(vaultObj, 'Must have build_vault objective in Level 3');
assert(stormObj, 'Must have shelter_cme objective in Level 3');
assert.strictEqual(vaultObj.completed, false, 'Vault objective initially pending');
assert.strictEqual(stormObj.completed, false, 'Storm objective initially pending');

let stormTriggerEmitted = false;
eventBus.on<string>('trigger_anomaly', (id) => {
  if (id === 'solar_storm') {
    stormTriggerEmitted = true;
  }
});

// 2. Build the subterranean storm vault
console.log('🏗️ Placing Subterranean Storm Vault on lunar surface...');
const placed = sim.placeStructure('subterranean_vault', 6, 4);
assert.strictEqual(placed, true, 'Vault placed successfully');
assert.strictEqual(vaultObj.completed, true, 'build_vault objective must be completed immediately');
console.log('✅ build_vault objective completed immediately.');

// 3. Verify that at 1 second, solar storm has NOT yet triggered
setTimeout(() => {
  assert.strictEqual(stormTriggerEmitted, false, 'Solar storm must NOT have fired at 1.0 second');
  console.log('✅ Confirmed: Solar storm has not triggered prematurely (t = 1.0s).');
}, 1000);

// 4. Verify that after 3 seconds, solar storm DOES trigger
setTimeout(() => {
  assert.strictEqual(stormTriggerEmitted, true, 'Solar storm must trigger after 3.0 seconds');
  console.log('✅ Confirmed: Solar storm event successfully triggered 3 seconds after building vault (t = 3.2s).');

  // Verify anomaly state in AnomalyManager
  console.log('Executing choice: Retreat into Regolith Vault...');
  const choiceRes = anomalyManager.executeChoice('solar_storm', 'regolith_vault_retreat');
  assert.strictEqual(choiceRes.success, true, 'Choice executed successfully');

  // Verify that shelter_cme objective is now completed
  assert.strictEqual(stormObj.completed, true, 'shelter_cme objective must be completed after resolving storm');
  console.log('✅ Confirmed: shelter_cme objective completed upon resolving solar storm.');

  console.log('\n🎉 ALL LEVEL 3 VAULT ➔ SOLAR STORM VERIFICATION CHECKS PASSED!\n');
  process.exit(0);
}, 3300);
