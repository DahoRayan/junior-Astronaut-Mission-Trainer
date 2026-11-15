/**
 * Automated City Builder & Building Catalog Test Suite
 * NASA Outpost 3D Lunar Frontend
 *
 * Validates:
 * - Building catalog entries, models, costs, and benefits
 * - SimulationEngine materials accounting, spending, and refunds
 * - Dynamic capacity scaling (crew, energy storage, life support)
 * - Sound synthesizer state machine
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUILDING_CATALOG, BUILDING_LIST } from '../src/city/BuildingCatalog.js';
import { SimulationEngine } from '../src/simulation/SimulationEngine.js';
import { SoundSystem } from '../src/audio/SoundSystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const modelsDir = path.join(frontendDir, 'public/models');

describe('NASA Outpost 3D — City Builder & Building Logic Test Suite', () => {
  let sim: SimulationEngine;
  let sound: SoundSystem;

  beforeEach(() => {
    sim = new SimulationEngine();
    sound = new SoundSystem();
  });

  describe('Suite 1: Building Catalog Inventory & Local Model Assets', () => {
    it('CB-01: Catalog defines at least 15 distinct kid-friendly lunar structures', () => {
      assert.ok(BUILDING_LIST.length >= 15, `Expected >= 15 building types, got ${BUILDING_LIST.length}`);
    });

    it('CB-02: Every building maps to an existing local GLB model on disk', () => {
      for (const b of BUILDING_LIST) {
        assert.ok(b.id, 'Building must have id');
        assert.ok(b.name, 'Building must have friendly name');
        assert.ok(b.modelFile, `Building ${b.id} missing modelFile`);
        assert.ok(b.materialsCost > 0, `Building ${b.id} must have positive cost`);
        assert.ok(b.kidBenefit, `Building ${b.id} must have kidBenefit string`);
        assert.ok(b.emoji, `Building ${b.id} must have emoji`);

        const modelPath = path.join(modelsDir, b.modelFile);
        assert.ok(fs.existsSync(modelPath), `Model file must exist on disk: ${modelPath}`);
        const stat = fs.statSync(modelPath);
        assert.ok(stat.size > 1000, `Model file suspiciously small: ${b.modelFile}`);
      }
    });

    it('CB-03: Buildings span all 5 core city builder categories', () => {
      const categories = new Set(BUILDING_LIST.map((b) => b.category));
      assert.ok(categories.has('living'), 'Must have living category');
      assert.ok(categories.has('power'), 'Must have power category');
      assert.ok(categories.has('life_support'), 'Must have life_support category');
      assert.ok(categories.has('spaceport'), 'Must have spaceport category');
      assert.ok(categories.has('rovers'), 'Must have rovers category');
    });
  });

  describe('Suite 2: SimulationEngine Materials Accounting & Building Logistics', () => {
    it('CB-04: Outpost starts with healthy initial materials balance', () => {
      assert.ok(sim.state.materials !== undefined, 'State must track materials');
      assert.strictEqual(sim.state.materials, 800, 'Initial materials should be 800');
    });

    it('CB-05: Can afford checks and spendMaterials transactions work accurately', () => {
      assert.strictEqual(sim.canAfford(500), true);
      assert.strictEqual(sim.canAfford(900), false);

      const spent = sim.spendMaterials(300);
      assert.strictEqual(spent, true);
      assert.strictEqual(sim.state.materials, 500);

      const overspent = sim.spendMaterials(600);
      assert.strictEqual(overspent, false);
      assert.strictEqual(sim.state.materials, 500);
    });

    it('CB-06: Demolish materials refund restores balance', () => {
      sim.state.materials = 100;
      sim.refundMaterials(84); // 70% of 120
      assert.strictEqual(sim.state.materials, 184);
    });

    it('CB-07: Passive prospecting generates materials over time', () => {
      sim.state.materials = 200;
      sim.tick(4.0); // 1 nominal tick (rate = 1.0)
      assert.ok((sim.state.materials ?? 0) > 200, 'Materials should increase from prospecting');
    });
  });

  describe('Suite 3: Kid-Friendly Procedural Audio Synthesizer', () => {
    it('CB-08: Audio synthesizer handles mute toggling', () => {
      assert.strictEqual(sound.isMuted, false);
      const muted = sound.toggleMute();
      assert.strictEqual(muted, true);
      assert.strictEqual(sound.isMuted, true);
      const unmuted = sound.toggleMute();
      assert.strictEqual(unmuted, false);
    });

    it('CB-09: Sound trigger methods execute safely without throwing in headless environments', () => {
      assert.doesNotThrow(() => {
        sound.playPlace();
        sound.playDemolish();
        sound.playSelect();
        sound.playRotate();
        sound.playError();
        sound.playMilestone();
      });
    });
  });

  describe('Suite 4: Connecting Tunnels, Airlocks & Dynamic Production Scaling', () => {
    it('CB-10: Catalog defines connecting corridors (straight, turn, tee) and EVA airlock', () => {
      const straight = BUILDING_CATALOG['straight_tunnel'];
      const turn = BUILDING_CATALOG['turn_tunnel'];
      const tee = BUILDING_CATALOG['tee_tunnel'];
      const airlock = BUILDING_CATALOG['airlock'];

      assert.ok(straight, 'Straight corridor must exist in catalog');
      assert.ok(turn, 'Quarter-turn corridor must exist in catalog');
      assert.ok(tee, 'T-junction corridor must exist in catalog');
      assert.ok(airlock, 'Airlock vestibule must exist in catalog');

      assert.ok(fs.existsSync(path.join(modelsDir, straight.modelFile)), 'Straight tunnel GLB must exist');
      assert.ok(fs.existsSync(path.join(modelsDir, turn.modelFile)), 'Quarter-turn GLB must exist');
      assert.ok(fs.existsSync(path.join(modelsDir, tee.modelFile)), 'T-junction GLB must exist');
      assert.ok(fs.existsSync(path.join(modelsDir, airlock.modelFile)), 'Airlock GLB must exist');
    });

    it('CB-11: Placed buildings scale power, life support, and materials production in SimulationEngine', () => {
      // 1. Initial power baseline without buildings
      const initialFood = sim.state.food;
      const initialWater = sim.state.water;

      // 2. Set building production rates (e.g. 2 greenhouses, 1 water skid, 1 nuclear reactor, 1 battery bank)
      sim.setBuildingProduction({
        extraSolarKw: 80,
        extraContinuousKw: 50,
        extraBatteryKwh: 300,
        foodPerTick: 5.0,
        waterPerTick: 4.0,
        materialsPerTick: 12.0,
      });

      assert.strictEqual(sim.state.maxBattery, 1300, 'Max battery capacity scaled from 1000 to 1300 kWh');

      // 3. Advance tick by 4.0 hours (rate = 1.0)
      sim.tick(4.0);

      // Food should increase from greenhouses
      assert.ok(sim.state.food > initialFood, `Food should increase from greenhouses: was ${initialFood}, now ${sim.state.food}`);
      // Water extraction should offset usage
      assert.ok(sim.state.water >= initialWater, `Water extraction should replenish water: was ${initialWater}, now ${sim.state.water}`);
      // Materials income should include mining bonuses
      assert.ok((sim.state.materials ?? 0) > 800 + 10, 'Materials should include +12 mining bonus');
    });

    it('CB-12: Demolishing buildings resets production bonuses back to nominal baseline', () => {
      sim.setBuildingProduction({
        extraSolarKw: 0,
        extraContinuousKw: 0,
        extraBatteryKwh: 0,
        foodPerTick: 0,
        waterPerTick: 0,
        materialsPerTick: 0,
      });

      assert.strictEqual(sim.state.maxBattery, 1000, 'Max battery capacity restored to 1000 kWh nominal');
      assert.strictEqual(sim.buildingProduction.extraContinuousKw, 0);
    });
  });
});
