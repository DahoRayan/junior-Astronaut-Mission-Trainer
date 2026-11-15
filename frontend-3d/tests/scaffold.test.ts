import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Milestone 1 Scaffolding and Environment Verification', () => {
  it('should import Three.js with valid revision', () => {
    assert.ok(THREE.REVISION, 'THREE.REVISION should exist');
    assert.strictEqual(typeof THREE.Scene, 'function', 'THREE.Scene should be constructor');
    assert.strictEqual(typeof THREE.PerspectiveCamera, 'function', 'THREE.PerspectiveCamera should be constructor');
    assert.strictEqual(typeof THREE.WebGLRenderer, 'function', 'THREE.WebGLRenderer should be constructor');
  });

  it('should have index.html with all required DOM mount points', () => {
    const htmlPath = path.join(rootDir, 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(content.includes('id="scene-container"'), 'Mount point #scene-container must exist');
    assert.ok(content.includes('id="hud-overlay"'), 'Mount point #hud-overlay must exist');
    assert.ok(content.includes('id="modal-root"'), 'Mount point #modal-root must exist');
    assert.ok(content.includes('pointer-events: none'), 'Overlays must have pointer-events: none');
  });

  it('should have valid vite.config.ts targeting port 3001 and publicDir public', () => {
    const configPath = path.join(rootDir, 'vite.config.ts');
    assert.ok(fs.existsSync(configPath), 'vite.config.ts must exist');
    const content = fs.readFileSync(configPath, 'utf-8');

    assert.ok(content.includes('port: 3001'), 'Must configure port 3001');
    assert.ok(content.includes("publicDir: 'public'"), 'Must configure publicDir public');
    assert.ok(content.includes("base: './'"), 'Must configure base ./');
  });

  it('should have valid tsconfig.json in strict mode', () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    assert.strictEqual(content.compilerOptions.strict, true, 'strict must be true');
    assert.strictEqual(content.compilerOptions.target, 'ES2022', 'target must be ES2022');
    assert.strictEqual(content.compilerOptions.moduleResolution, 'bundler', 'moduleResolution must be bundler');
  });
});
