import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { TutorialManager, TutorialStep } from '../src/simulation/TutorialManager';
import { PowerNetwork } from '../src/simulation/PowerNetwork';

console.log('🧪 Starting Verification Suite: Moon Day 30 Earth Days & Build Base Guidance...\n');

// -------------------------------------------------------------
// Test 1: Lunar Synodic 30 Earth Days Day/Night Cycle
// -------------------------------------------------------------
console.log('--- Test 1: Lunar Synodic 30 Earth Days (15d Sun / 15d Night) ---');
const sim = new SimulationEngine();
assert.strictEqual(sim.dayCycleMode, 'lunar_synodic', 'Simulation must default to lunar_synodic');

// Sols 1-15 must be daylight
for (let sol = 1; sol <= 15; sol++) {
  sim.state.sol = sol;
  sim.updateDaylightStatus();
  assert.strictEqual(sim.isDaylight, true, `Sol ${sol} should be daylight`);
}

// Sols 16-30 must be night
for (let sol = 16; sol <= 30; sol++) {
  sim.state.sol = sol;
  sim.updateDaylightStatus();
  assert.strictEqual(sim.isDaylight, false, `Sol ${sol} should be night`);
}

// Sol 31 (next cycle) must be daylight
sim.state.sol = 31;
sim.updateDaylightStatus();
assert.strictEqual(sim.isDaylight, true, 'Sol 31 (Sol 1 of cycle 2) must be daylight');

// Sun Azimuth wraps correctly in [0, 2*PI]
sim.state.sol = 1;
sim.state.timeOfDayHours = 0;
const az0 = sim.getSunAzimuth();
assert(az0 >= 0 && az0 <= 2 * Math.PI, `Azimuth at start must be in [0, 2pi], got ${az0}`);

sim.state.sol = 30;
sim.state.timeOfDayHours = 24;
const azEnd = sim.getSunAzimuth();
assert(azEnd >= 0 && azEnd <= 2 * Math.PI, `Azimuth at end of cycle must be in [0, 2pi], got ${azEnd}`);

console.log('✅ Test 1 Passed: 30 Earth-day cycle accurately alternates 15 days sun and 15 days night.\n');

// -------------------------------------------------------------
// Test 2: Startup State in "Build My Own Base"
// -------------------------------------------------------------
console.log('--- Test 2: Clean Scratch Base Startup State ---');
const simStartup = new SimulationEngine();
assert.strictEqual(simStartup.state.materials, 1400, 'Starting materials must be 1400');
assert.strictEqual(simStartup.grid.getPlacedBuildings().length, 1, 'Grid must start with 1 central base');
assert.strictEqual(simStartup.grid.getPlacedBuildings()[0].type, 'outpost_base', 'Startup building must be outpost_base');

const tut = new TutorialManager();
tut.reset();
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.SOLAR_ARRAY, 'Initial step must be SOLAR_ARRAY');
assert.strictEqual(tut.getHighlightedTool(), 'solar_array', 'Step 1 highlighted tool must be solar_array');
assert.deepStrictEqual(tut.getActiveMoonTarget(simStartup.grid), tut.SPOT_SOLAR, 'Initial target spot must be SPOT_SOLAR');

console.log('✅ Test 2 Passed: App starts cleanly in "Build my own base" mode with 1400 Mat.\n');

// -------------------------------------------------------------
// Test 3: Step-by-Step 6-Milestone Progression & Power Network
// -------------------------------------------------------------
console.log('--- Test 3: 6-Milestone Guided Base Building & Power Island ---');
const powerNet = new PowerNetwork();

// Step 1: Place Solar Array at (9, 4)
const placedSolar = simStartup.placeStructure('solar_array', 9, 4);
assert.strictEqual(placedSolar, true, 'Solar array must be placed successfully');
assert.strictEqual(simStartup.state.materials, 1400 - 50, 'Materials must deduct 50');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.BATTERY_BANK, 'Step must advance to BATTERY_BANK');
assert.strictEqual(tut.getHighlightedTool(), 'battery_bank');

// Step 2: Place Battery Bank at (9, 6)
const placedBat = simStartup.placeStructure('battery_bank', 9, 6);
assert.strictEqual(placedBat, true, 'Battery bank must be placed successfully');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.POWER_CABLE, 'Step must advance to POWER_CABLE');
assert.strictEqual(tut.getHighlightedTool(), 'power_cable');

// Step 3: Lay Power Cable at (9, 5) linking Solar (9,4) and Battery (9,6)
const placedCable = simStartup.placeStructure('power_cable', 9, 5);
assert.strictEqual(placedCable, true, 'Power cable must be laid successfully');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.CREW_HABITAT, 'Step must advance to CREW_HABITAT');
assert.strictEqual(tut.getHighlightedTool(), 'crew_habitat');

// Step 4: Place Crew Habitat at (9, 7) directly adjacent to Battery (9,6)
const placedHab = simStartup.placeStructure('crew_habitat', 9, 7);
assert.strictEqual(placedHab, true, 'Crew habitat must be placed successfully');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.LIFE_SUPPORT, 'Step must advance to LIFE_SUPPORT');
assert.strictEqual(tut.getHighlightedTool(), 'oxygen_electrolyzer');

// Step 5: Place Oxygen Electrolyzer at (8, 7) directly adjacent to Habitat (9,7)
const placedO2 = simStartup.placeStructure('oxygen_electrolyzer', 8, 7);
assert.strictEqual(placedO2, true, 'Oxygen electrolyzer must be placed successfully');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.HEATING_SYSTEM, 'Step must advance to HEATING_SYSTEM');
assert.strictEqual(tut.getHighlightedTool(), 'heating_system');

// Step 6: Place Heating System at (10, 7) directly adjacent to Habitat (9,7)
const placedHeater = simStartup.placeStructure('heating_system', 10, 7);
assert.strictEqual(placedHeater, true, 'Heating system must be placed successfully');
tut.evaluateGrid(simStartup.grid);
assert.strictEqual(tut.currentStep, TutorialStep.COMPLETE, 'Step must reach COMPLETE');
assert.strictEqual(tut.getHighlightedTool(), null, 'No tool highlighted when complete');

// Verify Power Network Connectivity: All 5 machines must be fully connected & powered!
const pResult = powerNet.calculate(simStartup.grid, true);
assert.strictEqual(pResult.unpoweredBuildings.length, 0, 'Every building must be powered via the connected grid!');
assert.strictEqual(pResult.totalGeneratedKw, 60, 'Solar generation must be 60 kW');
assert.strictEqual(pResult.batteryCapacityKwh, 100, 'Battery storage must provide 100 kWh');

const placedList = simStartup.grid.getPlacedBuildings();
for (const b of placedList) {
  assert.strictEqual(b.isPowered, true, `Building ${b.type} at (${b.x},${b.y}) must be powered!`);
}

console.log('✅ Test 3 Passed: 6 milestones completed, power network fully connected and operational!\n');

// -------------------------------------------------------------
// Test 4: Occupied Tile Beacon Re-targeting
// -------------------------------------------------------------
console.log('--- Test 4: Dynamic Beacon Re-targeting on Occupied Tiles ---');
const simOccupied = new SimulationEngine();
const tutOccupied = new TutorialManager();
tutOccupied.reset();

// Place an unexpected building at (9, 4)
simOccupied.grid.placeBuilding({
  id: 'blocker',
  type: 'water_recycler',
  x: 9,
  y: 4,
  isPowered: false,
  isEnabled: true,
});

const targetDisplaced = tutOccupied.getActiveMoonTarget(simOccupied.grid);
assert.notStrictEqual(targetDisplaced, null);
assert(targetDisplaced!.x !== 9 || targetDisplaced!.y !== 4, 'Target must shift to an adjacent vacant tile');
console.log(`Displaced target: (${targetDisplaced!.x}, ${targetDisplaced!.y}) for ${targetDisplaced!.type}`);

console.log('✅ Test 4 Passed: Beacon dynamically adjusts when primary tile is occupied.\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
