import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { eventBus } from '../src/core/EventBus';
import { MissionFailedData } from '../src/core/types';

function runTests() {
  console.log('🧪 Starting Mission Failure & Debrief Popup Verification...');

  // 1. Hypoxia Test
  {
    const sim = new SimulationEngine();
    let failedEvent: MissionFailedData | null = null;
    eventBus.on<MissionFailedData>('mission_failed', (data) => {
      failedEvent = data;
    });

    sim.state.oxygen = 0;
    sim.tick(1);

    if (!sim.isMissionFailed) {
      throw new Error('FAIL: isMissionFailed was not set to true on hypoxia');
    }
    if (sim.simulationSpeed !== 0) {
      throw new Error('FAIL: Simulation speed was not paused to 0 on mission failure');
    }
    if (!failedEvent) {
      throw new Error('FAIL: mission_failed event was not emitted on hypoxia');
    }
    const evt = failedEvent as MissionFailedData;
    if (!evt.reason.includes('hypoxia') && !evt.reason.includes('depleted')) {
      throw new Error(`FAIL: Unexpected reason: ${evt.reason}`);
    }
    if (!evt.lesson.includes('ECLSS')) {
      throw new Error(`FAIL: Unexpected lesson: ${evt.lesson}`);
    }
    console.log('✓ Test 1 Passed: Hypoxia trigger paused simulation and emitted mission_failed with ECLSS lesson.');
  }

  // 2. Flash Fire Test (Apollo 1 class)
  {
    const sim = new SimulationEngine();
    let failedEvent: MissionFailedData | null = null;
    eventBus.on<MissionFailedData>('mission_failed', (data) => {
      failedEvent = data;
    });

    sim.state.oxygen = 30.0;
    sim.state.temperature = 60.0;
    sim.tick(1);

    if (!sim.isMissionFailed || sim.simulationSpeed !== 0) {
      throw new Error('FAIL: Flash fire did not pause or set isMissionFailed');
    }
    const evt = failedEvent as unknown as MissionFailedData;
    if (!evt.reason.includes('flash fire') && !evt.reason.includes('oxygen-rich')) {
      throw new Error(`FAIL: Unexpected reason for flash fire: ${evt?.reason}`);
    }
    if (!evt.lesson.includes('Apollo 1')) {
      throw new Error(`FAIL: Unexpected lesson for flash fire: ${evt?.lesson}`);
    }
    console.log('✓ Test 2 Passed: Apollo 1 flash fire triggered instant pause, failure flag, and Apollo 1 lesson.');
  }

  // 3. Subsequent tick prevention
  {
    const sim = new SimulationEngine();
    sim.state.oxygen = 0;
    sim.tick(1);
    const solAtFail = sim.state.sol;
    const timeAtFail = sim.state.timeOfDayHours;

    sim.tick(1);
    if (sim.state.timeOfDayHours !== timeAtFail || sim.state.sol !== solAtFail) {
      throw new Error('FAIL: Simulation continued advancing after mission failure');
    }
    console.log('✓ Test 3 Passed: Simulation tick safely halted after mission failure.');
  }

  // 4. Scratch Reset Verification
  {
    const sim = new SimulationEngine();
    sim.state.oxygen = 0;
    sim.tick(1);

    if (!sim.isMissionFailed) throw new Error('FAIL: Expected sim to fail');

    sim.clearBaseForScratch();
    if (sim.isMissionFailed !== false) {
      throw new Error('FAIL: clearBaseForScratch did not reset isMissionFailed to false');
    }
    if (sim.state.materials !== 1400) {
      throw new Error(`FAIL: Expected 1400 materials after reset, got ${sim.state.materials}`);
    }
    if (sim.state.health !== 100) {
      throw new Error(`FAIL: Expected health 100 after reset, got ${sim.state.health}`);
    }
    if (sim.state.sol !== 1 || sim.state.timeOfDayHours !== 6.0) {
      throw new Error('FAIL: Expected Sol 1 at 06:00 after reset');
    }
    console.log('✓ Test 4 Passed: Reset cleanly clears failure state, restores 1,400 materials and Sol 1 at 100% health.');
  }

  console.log('🎉 ALL MISSION FAILURE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests();
