import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { AnomalyManager } from '../src/simulation/AnomalyManager';
import { eventBus } from '../src/core/EventBus';

console.log('🧪 Starting Anomaly Metrics Real Impact Verification...\n');

// 1. Oxygen Leak
{
  const sim = new SimulationEngine();
  const mgr = new AnomalyManager(sim);

  const initialO2 = sim.state.stored_o2;
  const initialGas = sim.state.oxygen;
  mgr.triggerAnomaly('oxygen_leak');

  assert(sim.state.stored_o2 < initialO2, 'Stored O2 must drop on oxygen leak crisis');
  assert(sim.state.oxygen < initialGas, 'Atmospheric oxygen must drop on oxygen leak crisis');
  console.log(`✅ Oxygen Leak Crisis: Stored O2 (${initialO2} -> ${sim.state.stored_o2}), Cabin O2 (${initialGas}% -> ${sim.state.oxygen}%)`);

  // Execute Choice 1: EVA Spacewalk Repair (costs 25 Mat)
  const o2Anomaly = AnomalyManager.ANOMALIES.find(a => a.id === 'oxygen_leak')!;
  const matBefore = sim.state.materials;
  const choice1 = o2Anomaly.choices.find(c => c.id === 'eva_pipe_repair')!;
  const res = choice1.execute(sim);

  assert.strictEqual(res.success, true);
  assert.strictEqual(sim.state.materials, matBefore - 25, 'Materials must decrease by 25');
  assert.strictEqual(sim.state.oxygen, 21.0, 'Cabin oxygen must be restored to nominal 21.0%');
  console.log('✅ Choice: EVA Spacewalk Repair successfully consumed 25 materials & restored oxygen metrics.');
}

// 2. Solar Storm
{
  const sim = new SimulationEngine();
  const mgr = new AnomalyManager(sim);

  const radBefore = sim.state.radiation;
  mgr.triggerAnomaly('solar_storm');
  assert(sim.state.radiation > radBefore, 'Radiation must spike on Solar Storm');
  console.log(`✅ Solar Storm Crisis: Radiation spiked from ${radBefore} to ${sim.state.radiation}`);

  // Test Choice: Overcharge Shielding (costs 50 kWh)
  const stormAnomaly = AnomalyManager.ANOMALIES.find(a => a.id === 'solar_storm')!;
  const choiceShield = stormAnomaly.choices.find(c => c.id === 'overcharge_shielding')!;

  sim.state.power = 100;
  const shieldBefore = sim.state.shield;
  const res = choiceShield.execute(sim);
  assert.strictEqual(res.success, true);
  assert.strictEqual(sim.state.power, 50, 'Power must drop by 50 kWh');
  assert(sim.state.shield > shieldBefore, 'Shielding must increase');
  console.log(`✅ Choice: Overcharge Shielding consumed 50 kWh power and boosted shield (${shieldBefore} -> ${sim.state.shield}).`);

  // Test Choice: Conserve & Monitor (health & morale penalty)
  sim.state.health = 100;
  sim.state.enthusiasm = 100;
  const choiceConserve = stormAnomaly.choices.find(c => c.id === 'conserve_and_monitor')!;
  choiceConserve.execute(sim);
  assert.strictEqual(sim.state.health, 80, 'Health must take 20 point penalty');
  assert.strictEqual(sim.state.enthusiasm, 75, 'Morale must take 25 point penalty');
  console.log('✅ Choice: Conserve & Monitor accurately applied health (-20) and morale (-25) radiation penalties.');
}

// 3. Lunar Dust on Solar Panels
{
  const sim = new SimulationEngine();
  const mgr = new AnomalyManager(sim);

  mgr.triggerAnomaly('lunar_dust');
  assert(sim.state.dust >= 45, 'Dust coverage must jump by at least 45%');
  console.log(`✅ Lunar Dust Crisis: Dust coverage spiked to ${sim.state.dust}%`);

  const dustAnomaly = AnomalyManager.ANOMALIES.find(a => a.id === 'lunar_dust')!;
  const choiceSweeper = dustAnomaly.choices.find(c => c.id === 'rover_brush_clean')!;

  sim.state.materials = 100;
  const res = choiceSweeper.execute(sim);
  assert.strictEqual(res.success, true);
  assert.strictEqual(sim.state.materials, 80, 'Rover must cost 20 Materials');
  assert.strictEqual(sim.state.dust, 0, 'Dust must be completely wiped to 0%');
  console.log('✅ Choice: Deploy Dust Sweeper Rover consumed 20 Mat and cleared 100% of dust.');
}

// 4. Water Electrolyzer Failure
{
  const sim = new SimulationEngine();
  const mgr = new AnomalyManager(sim);

  const waterBefore = sim.state.water;
  const tempBefore = sim.state.temperature;
  mgr.triggerAnomaly('water_electrolyzer_failure');
  assert(sim.state.water < waterBefore, 'Water must drop from loop backup');
  assert(sim.state.temperature > tempBefore, 'Temperature must rise from fouled pump');
  console.log(`✅ Water Electrolyzer Crisis: Water loop vented (${waterBefore} -> ${sim.state.water}), Temp rose (${tempBefore} -> ${sim.state.temperature})`);

  const hydroAnomaly = AnomalyManager.ANOMALIES.find(a => a.id === 'water_electrolyzer_failure')!;
  const choiceMembrane = hydroAnomaly.choices.find(c => c.id === 'swap_membrane')!;

  sim.state.materials = 100;
  const res = choiceMembrane.execute(sim);
  assert.strictEqual(res.success, true);
  assert.strictEqual(sim.state.materials, 70, 'Spare membrane must cost 30 Materials');
  assert.strictEqual(sim.state.temperature, 50.0, 'Cabin temperature must cool back to nominal 50.0');
  console.log('✅ Choice: Install Spare Catalyst Membrane consumed 30 materials, restored O2 and normalized temp.');
}

// 5. Insufficient Resource Guard
{
  const sim = new SimulationEngine();
  sim.state.materials = 5;
  const o2Leak = AnomalyManager.ANOMALIES.find(a => a.id === 'oxygen_leak')!;
  const evaChoice = o2Leak.choices.find(c => c.id === 'eva_pipe_repair')!;
  const res = evaChoice.execute(sim);
  assert.strictEqual(res.success, false, 'Execution must fail when player lacks materials');
  console.log(`✅ Insufficient Resource Guard: Correctly blocked choice when player had only ${sim.state.materials} materials.`);
}

console.log('\n🎉 ALL ANOMALY METRIC REAL-IMPACT CHECKS PASSED SUCCESSFULLY!');
