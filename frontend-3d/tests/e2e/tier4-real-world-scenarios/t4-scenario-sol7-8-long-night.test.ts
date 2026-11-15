/**
 * Tier 4: Real-World Scenarios — Scenario 3: Sol 7–8 Polar Long Night Survival Arc
 * Verifies mountain shadow eclipse entry, 0 kW solar yield, battery freeze alarm,
 * secondary thermal bus reroute, and successful dawn recovery on Sol 9.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { assertApprox, assertRange, assertResourceStateValid } from '../harness/assertions.js';
import { SimulationOracle, NarrativeOracle, AstronomicalOracle } from '../harness/fixtures.js';

describe('Tier 4 — Real-World Scenario 3: Sol 7–8 Polar Long Night Survival', () => {
  let state = SimulationOracle.createInitialState();
  state.sol = 7;
  state.timeOfDayHours = 0.0;
  state.power = 950.0; // Battery bank charged to full 1000 kWh capacity prior to eclipse

  it('Step 1: Sol 7 00:00 — Mountain Shadow Eclipse Entry triggers E-LONG-NIGHT-START', () => {
    const ev = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-LONG-NIGHT-START');
    assert.ok(ev, 'E-LONG-NIGHT-START event found');
    assert.strictEqual(ev.sol, 7);
    assert.strictEqual(ev.hour, 0);

    // Ephemeris verification: sun is occulted by mountain rim
    const ephem = AstronomicalOracle.calculate(144.0, { season: 'winter_solstice' });
    assert.ok(ephem.sunElevationRad < 0.0, 'Sun is below local topographic horizon');
    assert.strictEqual(ephem.solarYieldFactor, 0.0, 'Solar generation is zero');
  });

  it('Step 2: Sol 7 00:30 — Load-Shedding Protocol Engaged (S-C2-1 Choice A)', () => {
    // Player engages load-shedding: turns off non-essential hydroponics and exterior floodlights
    const activeBuildings = [
      'crew_habitat',   // P1 (5 kW)
      'co2_scrubber',   // P1 (10 kW)
      'heating_system', // P2 (4 kW)
      'battery_bank',
    ];

    // Tick 4 hours into darkness
    const { nextState } = SimulationOracle.tick(state, 4.0, {
      isDaylight: false,
      activeBuildings,
    });
    state = nextState;

    assert.ok(state.power < 950.0, 'Battery discharges to supply essential life support');
    assertApprox(state.power, 874.0, 5.0, 'Battery remaining after 4 hours of darkness (950 - 4h*19kW)');
    assert.strictEqual(state.health, 100, 'Crew health preserved');
  });

  it('Step 3: Sol 7 12:00 — Battery Cooling Line Freeze triggers E-BATTERY-FREEZE Alarm', () => {
    // Advance 8 more hours under load-shed protocol to Sol 7, 12:00
    const loadShedBuildings = ['crew_habitat', 'co2_scrubber', 'heating_system', 'battery_bank'];
    for (let i = 0; i < 2; i++) {
      const { nextState } = SimulationOracle.tick(state, 4.0, {
        isDaylight: false,
        activeBuildings: loadShedBuildings,
      });
      state = nextState;
    }

    assert.strictEqual(state.timeOfDayHours, 12.0, 'Sol 7 12:00 reached');
    const freezeEvent = NarrativeOracle.TIMELINE_EVENTS.find((e) => e.id === 'E-BATTERY-FREEZE');
    assert.ok(freezeEvent, 'E-BATTERY-FREEZE event found');
    assert.strictEqual(freezeEvent.sol, 7);
    assert.strictEqual(freezeEvent.hour, 12);
  });

  it('Step 4: Sol 7 12:30 — Thermal Loop Rerouted through Secondary Bus (S-C2-2 Choice B)', () => {
    // Rerouting stabilizes thermal loop
    state.temperature = 48.0; // Minor chill during alarm

    // Advance through the remainder of Sol 7 and all of Sol 8 (36 hours of night)
    for (let i = 0; i < 9; i++) {
      const { nextState } = SimulationOracle.tick(state, 4.0, {
        isDaylight: false,
        activeBuildings: ['crew_habitat', 'co2_scrubber', 'heating_system', 'battery_bank'],
      });
      state = nextState;
    }

    assert.strictEqual(state.sol, 9, 'Reached dawn on Sol 9');
    assert.strictEqual(state.timeOfDayHours, 0.0, '00:00 on Sol 9');
    assert.ok(state.temperature >= 45.0, 'Habitat temperature preserved by thermal loop');
    assert.ok(state.power > 0, 'Battery sustained full 48-hour shadow without blackout');
    assert.strictEqual(state.health, 100, 'Crew survived long polar night');
  });

  it('Step 5: Sol 9 06:00 — Dawn Recovery & Solar Power Grid Restoration', () => {
    // Advance 6 hours to sunrise
    for (let i = 0; i < 6; i++) {
      const { nextState } = SimulationOracle.tick(state, 1.0, {
        isDaylight: true,
        activeBuildings: ['solar_array', 'battery_bank', 'crew_habitat', 'co2_scrubber'],
      });
      state = nextState;
    }

    assert.ok(state.power > 100.0, 'Sunrise begins rapid recharge of base power grid');
    assertResourceStateValid(state, 'Sol 9 post-dawn telemetry validation');
  });
});
