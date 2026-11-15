import { spawn } from 'node:child_process';
import process from 'node:process';

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('\x1b[33m%s\x1b[0m', '  🚀 J-Astro: Starting Both Mission Simulators');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('  • J-Astro 2D Mission Control:   http://localhost:3000');
console.log('  • J-Astro 3D Lunar Outpost:     http://localhost:3001');
console.log('  • J-Astro Home Page:            index.html');
console.log('───────────────────────────────────────────────────────────\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Spawn 2D Game
const proc2d = spawn(npmCmd, ['--prefix', 'game', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

// Spawn 3D Game
const proc3d = spawn(npmCmd, ['--prefix', 'frontend-3d', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\nShutting down J-Astro simulation servers...');
  proc2d.kill();
  proc3d.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
