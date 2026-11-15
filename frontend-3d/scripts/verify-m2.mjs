#!/usr/bin/env node
/**
 * NASA Outpost 3D - Milestone 2 Quality Gate Verification Probe
 * Validates 3D engine core, astronomical ephemeris models, lighting rig,
 * time scrubbing UI, ground-locked camera controls, and test suite execution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log(' Milestone 2 Quality Gate Verification Probe');
console.log(' Target Root:', rootDir);
console.log('======================================================\n');

let failed = false;

function check(desc, fn) {
  process.stdout.write(`• Checking: ${desc}... `);
  try {
    fn();
    console.log('[\x1b[32mPASS\x1b[0m]');
  } catch (err) {
    console.log('[\x1b[31mFAIL\x1b[0m]');
    console.error('  Error:', err.message);
    failed = true;
  }
}

// 1. Filesystem Structure Check: Required Milestone 2 Files
check('All Milestone 2 TypeScript source files present', () => {
  const req = [
    'src/core/types.ts',
    'src/core/Engine.ts',
    'src/astronomy/EphemerisCalculator.ts',
    'src/astronomy/TimeManager.ts',
    'src/environment/LunarSky.ts',
    'src/environment/LunarLighting.ts',
    'src/environment/TerrainManager.ts',
    'src/interaction/CameraController.ts',
    'src/ui/TimeScrubberUI.ts',
    'src/main.ts',
    'tests/astronomy.test.ts'
  ];
  for (const f of req) {
    const full = path.join(rootDir, f);
    if (!fs.existsSync(full)) throw new Error(`Missing ${f}`);
    const stat = fs.statSync(full);
    if (stat.size === 0) throw new Error(`Empty file: ${f}`);
  }
});

// 2. Astronomical Ephemeris Math Invariants
check('EphemerisCalculator mathematical constants and signatures', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/astronomy/EphemerisCalculator.ts'), 'utf-8');
  if (!content.includes('SYNODIC_PERIOD_HOURS = 708.73413')) throw new Error('Missing SYNODIC_PERIOD_HOURS = 708.73413');
  if (!content.includes('MOON_AXIAL_TILT_RAD = 1.5424 * (Math.PI / 180)')) throw new Error('Missing MOON_AXIAL_TILT_RAD');
  if (!content.includes('SHACKLETON_LAT_RAD = -89.9 * (Math.PI / 180)')) throw new Error('Missing SHACKLETON_LAT_RAD');
  if (!content.includes('EARTHSHINE_COLOR_HEX = 0x82b4ff')) throw new Error('Missing EARTHSHINE_COLOR_HEX = 0x82b4ff');
  if (!content.includes('getSunAzimuthRad')) throw new Error('Missing getSunAzimuthRad method');
  if (!content.includes('getSunElevationRad')) throw new Error('Missing getSunElevationRad method');
  if (!content.includes('getSunDirectionVector')) throw new Error('Missing getSunDirectionVector method');
  if (!content.includes('getEarthshineIntensity')) throw new Error('Missing getEarthshineIntensity method');
});

// 3. TimeManager Speeds and Interface Contracts
check('TimeManager speed multipliers and pause/scrub methods', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/astronomy/TimeManager.ts'), 'utf-8');
  if (!content.includes('setMultiplier')) throw new Error('Missing setMultiplier method');
  if (!content.includes('setTime')) throw new Error('Missing setTime scrub method');
  if (!content.includes('getState')) throw new Error('Missing getState method');
  if (!content.includes('togglePause')) throw new Error('Missing togglePause method');
});

// 4. Engine & WebGLRenderer Standards
check('Engine renderer standards (ACESFilmicToneMapping, PCFSoftShadowMap, SRGB)', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/core/Engine.ts'), 'utf-8');
  if (!content.includes('THREE.PCFSoftShadowMap')) throw new Error('Missing PCFSoftShadowMap configuration');
  if (!content.includes('THREE.ACESFilmicToneMapping')) throw new Error('Missing ACESFilmicToneMapping configuration');
  if (!content.includes('THREE.SRGBColorSpace')) throw new Error('Missing SRGBColorSpace configuration');
  if (!content.includes('ResizeObserver')) throw new Error('Missing ResizeObserver responsive resize handling');
});

// 5. LunarSky Vacuum & Starfield Invariants
check('LunarSky vacuum void (0x000000, null fog), 5000 stars, and 23.44° Earth tilt', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/environment/LunarSky.ts'), 'utf-8');
  if (!content.includes('0x000000')) throw new Error('Missing pure black sky 0x000000');
  if (!content.includes('scene.fog = null')) throw new Error('Missing scene.fog = null vacuum invariant');
  if (!content.includes('5000')) throw new Error('Missing 5000 starfield points');
  if (!content.includes('23.44')) throw new Error('Missing 23.44° Earth obliquity tilt');
});

// 6. LunarLighting Shadow Camera & Earthshine Fill
check('LunarLighting shadow map (4096), anti-acne biasing, and 0x82b4ff Earthshine', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/environment/LunarLighting.ts'), 'utf-8');
  if (!content.includes('4096')) throw new Error('Missing 4096 shadow map size');
  if (!content.includes('0x82b4ff')) throw new Error('Missing 0x82b4ff Earthshine fill');
  if (!content.includes('normalBias')) throw new Error('Missing normalBias anti-acne setting');
});

// 7. TerrainManager Invariants
check('TerrainManager Shackleton ground plane (400x400m, Y=0.0m, roughness 0.92)', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/environment/TerrainManager.ts'), 'utf-8');
  if (!content.includes('400')) throw new Error('Missing 400m terrain size');
  if (!content.includes('0.92')) throw new Error('Missing roughness 0.92');
  if (!content.includes('receiveShadow = true')) throw new Error('Terrain must receive shadows');
});

// 8. CameraController Ground Clamping & 5 Sector Presets
check('CameraController polar ground lock (Math.PI / 2 - 0.03) and 5 presets', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/interaction/CameraController.ts'), 'utf-8');
  if (!content.includes('Math.PI / 2 - 0.03')) throw new Error('Missing Math.PI / 2 - 0.03 polar ground lock');
  const presets = ['central_hab', 'greenhouse', 'power_yard', 'landing_pad', 'rim_horizon'];
  for (const p of presets) {
    if (!content.includes(p)) throw new Error(`Missing preset ${p}`);
  }
});

// 9. TimeScrubberUI Non-blocking HUD Mounting
check('TimeScrubberUI non-blocking pointer events and scrub controls', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/ui/TimeScrubberUI.ts'), 'utf-8');
  if (!content.includes('time-scrub-slider')) throw new Error('Missing time-scrub-slider');
  if (!content.includes('hud-overlay')) throw new Error('Missing hud-overlay mounting');
  if (!content.includes('pointer-events: auto')) throw new Error('Missing pointer-events: auto on interactive controls');
});

// 10. Execute Automated Astronomy Unit Tests
check('Automated test suite (npm test) passes with 0 failures', () => {
  try {
    const output = execSync('npm test', { cwd: rootDir, encoding: 'utf-8' });
    if (output.includes('fail 1') || output.includes('ERR_')) {
      throw new Error(`Test run reported failures:\n${output}`);
    }
  } catch (err) {
    throw new Error(`npm test execution failed: ${err.stdout || err.message}`);
  }
});

// 11. Execute TypeScript Compilation and Vite Production Build
check('TypeScript compiler & Vite production build (npm run build) exit 0', () => {
  try {
    execSync('npm run build', { cwd: rootDir, encoding: 'utf-8' });
  } catch (err) {
    throw new Error(`npm run build failed: ${err.stdout || err.message}`);
  }
});

console.log('\n======================================================');
if (failed) {
  console.log(' \x1b[31mRESULT: MILESTONE 2 VERIFICATION FAILED\x1b[0m');
  console.log('======================================================');
  process.exit(1);
} else {
  console.log(' \x1b[32mRESULT: ALL MILESTONE 2 QUALITY GATES PASSED (11/11)\x1b[0m');
  console.log('======================================================');
  process.exit(0);
}
