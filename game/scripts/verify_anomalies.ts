import { AnomalyManager } from '../src/simulation/AnomalyManager';
import { SimulationEngine } from '../src/simulation/SimulationEngine';

console.log('🧪 Verifying NASA Canonical Anomalies & Decision Flow...');

const anomalies = AnomalyManager.ANOMALIES;
console.log(`✅ Loaded ${anomalies.length} canonical anomalies.`);

if (anomalies.length !== 4) {
  console.error(`❌ Expected exactly 4 anomalies, found ${anomalies.length}`);
  process.exit(1);
}

const expectedIds = [
  'oxygen_leak',
  'solar_storm',
  'lunar_dust',
  'water_electrolyzer_failure'
];

expectedIds.forEach((id) => {
  const a = anomalies.find((item) => item.id === id);
  if (!a) {
    console.error(`❌ Missing anomaly: ${id}`);
    process.exit(1);
  }
  console.log(`✅ Verified anomaly: ${a.icon} ${a.name}`);
  if (!a.question || a.question.length < 10) {
    console.error(`❌ Anomaly ${id} missing decision dilemma question!`);
    process.exit(1);
  }
  if (!a.choices || a.choices.length < 2) {
    console.error(`❌ Anomaly ${id} must have at least 2 choices!`);
    process.exit(1);
  }
});

// Test Decision Execution
const sim = new SimulationEngine();
const initialMat = sim.state.materials;

const o2Leak = anomalies.find((a) => a.id === 'oxygen_leak')!;
const evaChoice = o2Leak.choices.find((c) => c.id === 'eva_pipe_repair')!;

const result = evaChoice.execute(sim);
if (!result.success) {
  console.error(`❌ Choice execution failed: ${result.message}`);
  process.exit(1);
}

if (sim.state.materials !== initialMat - 25) {
  console.error(`❌ Expected materials to decrease by 25, got ${sim.state.materials}`);
  process.exit(1);
}

console.log(`✅ Test choice executed: "${result.message}"`);
console.log(`✅ Materials deducted accurately: ${initialMat} ➔ ${sim.state.materials}`);

// Test Every 3 Simple Days & Time Acceleration Reset to 1x
const mgr = new AnomalyManager(sim);

// 1. Day 1 & Day 2: NO anomalies
mgr.checkPeriodicIncidents(1, 12, true);
mgr.checkPeriodicIncidents(2, 12, true);
if (mgr.isModalOpen) {
  console.error('❌ Anomaly triggered on Day 1 or Day 2!');
  process.exit(1);
}
console.log('✅ Days 1 and 2: 0 anomalies.');

// 2. Set speed to 2x (accelerated)
sim.setSpeed(2);
if (sim.simulationSpeed !== 2) {
  console.error('❌ Simulation speed not set to 2x!');
  process.exit(1);
}

// 3. Day 3: Event MUST happen and return time acceleration to 1x!
mgr.checkPeriodicIncidents(3, 8, true);
if (!mgr.isModalOpen) {
  console.error('❌ Anomaly failed to trigger on Day 3!');
  process.exit(1);
}
if (sim.simulationSpeed !== 1) {
  console.error(`❌ Expected speed to reset to 1x, got ${sim.simulationSpeed}x!`);
  process.exit(1);
}
console.log('✅ Day 3: Event triggered successfully and time acceleration returned to 1x!');

// 4. Resolve Day 3 anomaly
const activeAnomaly = AnomalyManager.ANOMALIES[0];
mgr.executeChoice(activeAnomaly.choices[0]);
if (mgr.isModalOpen) {
  console.error('❌ Modal still open after choice execution!');
  process.exit(1);
}

// 5. Days 4 and 5: NO anomalies
mgr.checkPeriodicIncidents(4, 12, true);
mgr.checkPeriodicIncidents(5, 12, true);
if (mgr.isModalOpen) {
  console.error('❌ Anomaly triggered on Day 4 or Day 5!');
  process.exit(1);
}
console.log('✅ Days 4 and 5: 0 anomalies.');

// 6. Day 6: Next 3-day milestone MUST trigger and reset speed!
sim.setSpeed(2);
mgr.checkPeriodicIncidents(6, 8, true);
if (!mgr.isModalOpen) {
  console.error('❌ Anomaly failed to trigger on Day 6!');
  process.exit(1);
}
if (sim.simulationSpeed !== 1) {
  console.error(`❌ Expected speed to reset to 1x, got ${sim.simulationSpeed}x!`);
  process.exit(1);
}
console.log('✅ Day 6: Event triggered successfully and time acceleration returned to 1x!');

console.log('🎉 ALL ANOMALY CHECKS PASSED SUCCESSFULLY!');
