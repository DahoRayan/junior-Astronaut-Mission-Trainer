#!/usr/bin/env node
/**
 * NASA Outpost 3D - Milestone 1 Quality Gate Verification Probe
 * Validates file structure, DOM mount points, GLB asset completeness,
 * binary GLTF 2.0 headers, manifest integrity, and zero-CDN guarantees.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log(' Milestone 1 Quality Gate Verification Probe');
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

// 1. Filesystem Structure Check
check('Required project files present', () => {
  const req = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'src/main.ts',
    'public/models/manifest.json'
  ];
  for (const f of req) {
    if (!fs.existsSync(path.join(rootDir, f))) throw new Error(`Missing ${f}`);
  }
});

// 2. DOM Mount Points
check('HTML mount points (#scene-container, #hud-overlay, #modal-root)', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  if (!html.includes('id="scene-container"')) throw new Error('Missing #scene-container');
  if (!html.includes('id="hud-overlay"')) throw new Error('Missing #hud-overlay');
  if (!html.includes('id="modal-root"')) throw new Error('Missing #modal-root');
});

// 3. Asset Completeness & Byte Sum
const modelsDir = path.join(rootDir, 'public', 'models');
check('Asset count (exactly 54 GLBs) and total bytes (15,229,708 B)', () => {
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));
  if (files.length !== 54) throw new Error(`Found ${files.length} GLBs, expected exactly 54.`);
  
  let totalBytes = 0;
  for (const file of files) {
    totalBytes += fs.statSync(path.join(modelsDir, file)).size;
  }
  if (totalBytes !== 15229708) {
    throw new Error(`Total size is ${totalBytes} bytes, expected 15229708 bytes.`);
  }
});

// 4. Starter Scene (ID 18148)
check('Starter scene colony-overview.glb (ID 18148, 2,615,980 B)', () => {
  const p = path.join(modelsDir, 'colony-overview.glb');
  if (!fs.existsSync(p)) throw new Error('Missing colony-overview.glb');
  const size = fs.statSync(p).size;
  if (size !== 2615980) throw new Error(`colony-overview.glb size is ${size}, expected 2615980`);
});

// 5. Binary GLTF 2.0 Header Validity for all 54 files
check('All 54 GLB files have valid GLTF 2.0 binary headers', () => {
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));
  for (const file of files) {
    const fullPath = path.join(modelsDir, file);
    const size = fs.statSync(fullPath).size;
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(fullPath, 'r');
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    
    const magic = buf.toString('ascii', 0, 4);
    const version = buf.readUInt32LE(4);
    const length = buf.readUInt32LE(8);
    
    if (magic !== 'glTF') throw new Error(`${file} magic is '${magic}', expected 'glTF'`);
    if (version !== 2) throw new Error(`${file} version is ${version}, expected 2`);
    if (length !== size) throw new Error(`${file} header length ${length} != disk size ${size}`);
  }
});

// 6. Manifest Validation
check('manifest.json structure and catalog completeness', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(modelsDir, 'manifest.json'), 'utf-8'));
  if (!Array.isArray(manifest) || manifest.length !== 54) {
    throw new Error(`manifest.json must be an array of 54 items, found: ${Array.isArray(manifest) ? manifest.length : typeof manifest}`);
  }
  for (const item of manifest) {
    if (!item.id || !item.filename || !item.fileSize) throw new Error(`Invalid manifest item: ${JSON.stringify(item)}`);
    const p = path.join(modelsDir, item.filename);
    if (!fs.existsSync(p)) throw new Error(`Manifest references non-existent file: ${item.filename}`);
    const stat = fs.statSync(p);
    if (stat.size !== item.fileSize) {
      throw new Error(`File size mismatch for ${item.filename}: disk=${stat.size}, manifest=${item.fileSize}`);
    }
  }
});

// 7. Zero External Network URLs in Source
check('Zero external CDN URLs in src/ and index.html', () => {
  function scanDir(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        scanDir(full);
      } else if (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.html')) {
        const content = fs.readFileSync(full, 'utf-8');
        if (/https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(content)) {
          throw new Error(`External URL found in ${full}`);
        }
      }
    }
  }
  scanDir(path.join(rootDir, 'src'));
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  if (/https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(html)) {
    throw new Error('External URL found in index.html');
  }
});

console.log('\n------------------------------------------------------');
if (failed) {
  console.log('\x1b[31mMILESTONE 1 VERIFICATION FAILED\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mALL MILESTONE 1 QUALITY GATES PASSED (100%)\x1b[0m');
  process.exit(0);
}
