import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('\x1b[33m%s\x1b[0m', '  🚀 J-Astro: Unified Vercel Production Build');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');

function run(cmd, cwd) {
  console.log(`\n\x1b[34m[BUILD]\x1b[0m Executing: ${cmd} in ${path.relative(rootDir, cwd) || '.'}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Build 2D Game
console.log('\n📦 Step 1: Building J-Astro 2D (Tactical Mission Control)...');
run('npm run build', path.join(rootDir, 'game'));

// 2. Build 3D Game
console.log('\n📦 Step 2: Building J-Astro 3D (Lunar Outpost Three.js)...');
run('npm run build', path.join(rootDir, 'frontend-3d'));

// 3. Prepare root dist/ directory
console.log('\n📁 Step 3: Assembling unified production dist...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy root index.html to dist/
fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
console.log('  ✓ Copied root index.html -> dist/index.html');

// Copy game/dist to dist/game and copy play.html to dist/play.html
const gameDist = path.join(rootDir, 'game', 'dist');
if (fs.existsSync(gameDist)) {
  fs.cpSync(gameDist, path.join(distDir, 'game'), { recursive: true });
  console.log('  ✓ Copied game/dist/ -> dist/game/');

  const playHtml = path.join(gameDist, 'play.html');
  if (fs.existsSync(playHtml)) {
    fs.copyFileSync(playHtml, path.join(distDir, 'play.html'));
    console.log('  ✓ Copied play.html -> dist/play.html');
  }

  // Also copy game/dist/assets to dist/assets for play.html top-level access
  const gameAssets = path.join(gameDist, 'assets');
  if (fs.existsSync(gameAssets)) {
    fs.cpSync(gameAssets, path.join(distDir, 'assets'), { recursive: true });
    console.log('  ✓ Copied assets -> dist/assets/');
  }
} else {
  console.error('  ✗ Error: game/dist does not exist!');
  process.exit(1);
}

// Copy frontend-3d/dist to dist/frontend-3d
const frontend3dDist = path.join(rootDir, 'frontend-3d', 'dist');
if (fs.existsSync(frontend3dDist)) {
  fs.cpSync(frontend3dDist, path.join(distDir, 'frontend-3d'), { recursive: true });
  console.log('  ✓ Copied frontend-3d/dist/ -> dist/frontend-3d/');
} else {
  console.error('  ✗ Error: frontend-3d/dist does not exist!');
  process.exit(1);
}

console.log('\n\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', '  ✓ Unified Build Complete! Ready for Vercel deployment.');
console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('  • Home:        /              (index.html)');
console.log('  • 2D Mission:  /game/         (dist/game/index.html)');
console.log('  • 3D Outpost:  /frontend-3d/  (dist/frontend-3d/index.html)\n');
