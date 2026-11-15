import assert from 'node:assert';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { BUILDING_DEFINITIONS } from '../src/core/Constants';

console.log('🧪 Starting 4-Tile Central Outpost Base Verification...\n');

// 1. Check startup state
const sim = new SimulationEngine();
const def = BUILDING_DEFINITIONS.outpost_base;

assert(def, 'BUILDING_DEFINITIONS.outpost_base must exist');
assert.strictEqual(def.powerGenerationKw, 0, 'Must have 0 power generation');
assert.strictEqual(def.powerConsumptionKw, 0, 'Must have 0 power consumption');
assert.strictEqual(def.batteryCapacityKwh, 0, 'Must have 0 battery capacity');
assert.strictEqual(def.oxygenProductionKgH, 0, 'Must have 0 oxygen production');
assert.strictEqual(def.waterConsumptionL, 0, 'Must have 0 water consumption');
assert.strictEqual(def.waterProductionL, 0, 'Must have 0 water production');
assert.strictEqual(def.shieldingBonusPct, 0, 'Must have 0 shielding bonus');
console.log('✅ Check 1 Passed: outpost_base definition has exactly 0 functions / 0 resource draw.');

// 2. Check 4-tile footprint in the middle
const targetTiles = [
  { x: 11, y: 7 },
  { x: 12, y: 7 },
  { x: 11, y: 8 },
  { x: 12, y: 8 },
];

for (const pt of targetTiles) {
  const tile = sim.grid.getTile(pt.x, pt.y);
  assert(tile, `Tile (${pt.x}, ${pt.y}) must exist`);
  assert(tile.building, `Tile (${pt.x}, ${pt.y}) must have building`);
  assert.strictEqual(tile.building.type, 'outpost_base', `Tile (${pt.x}, ${pt.y}) must be outpost_base`);
}
console.log('✅ Check 2 Passed: Central base occupies all 4 middle tiles (11, 7), (12, 7), (11, 8), (12, 8).');

// 3. Deduplication in getPlacedBuildings
const placed = sim.grid.getPlacedBuildings();
assert.strictEqual(placed.length, 1, 'getPlacedBuildings must return exactly 1 unique building on clean scratch base');
assert.strictEqual(placed[0].type, 'outpost_base');
console.log('✅ Check 3 Passed: Placed buildings list deduplicates 4 tiles into single base entity.');

// 4. Cannot build on top of the 4 tiles
const buildAttempt = sim.placeStructure('solar_array', 11, 7);
assert.strictEqual(buildAttempt, false, 'Placing solar array on base tile (11, 7) must fail');
const buildAttempt2 = sim.placeStructure('battery_bank', 12, 8);
assert.strictEqual(buildAttempt2, false, 'Placing battery bank on base tile (12, 8) must fail');
console.log('✅ Check 4 Passed: Construction over central base tiles is prevented.');

// 5. Demolition is prevented
const demoAttempt = sim.removeStructure(11, 7);
assert.strictEqual(demoAttempt, false, 'Demolishing central base must be blocked');
assert(sim.grid.getTile(11, 7)?.building, 'Base must still be on tile (11, 7)');
console.log('✅ Check 5 Passed: Demolishing central base is strictly blocked.');

// 6. Persistence across level reset
sim.clearBaseForScratch();
for (const pt of targetTiles) {
  const tile = sim.grid.getTile(pt.x, pt.y);
  assert.strictEqual(tile?.building?.type, 'outpost_base', `Base must remain at (${pt.x}, ${pt.y}) after level reset`);
}
console.log('✅ Check 6 Passed: Central base automatically present on every level start/reset.');

console.log('\n🎉 ALL 4-TILE CENTRAL BASE VERIFICATION CHECKS PASSED!');
