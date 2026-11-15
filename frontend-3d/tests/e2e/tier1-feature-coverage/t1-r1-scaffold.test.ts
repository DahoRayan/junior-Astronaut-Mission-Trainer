/**
 * Tier 1: Feature Coverage — R1: Dedicated 3D Frontend Directory & Scaffolding
 * Verifies package scripts, tsconfig, vite config, index.html, and zero legacy leakage.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../harness/setup.js';
import { assertNoExternalUrls } from '../harness/assertions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../..');

describe('Tier 1 — R1: Dedicated Frontend Scaffold & Configuration', () => {
  const pkgPath = path.join(frontendDir, 'package.json');
  const tsconfigPath = path.join(frontendDir, 'tsconfig.json');
  const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
  const indexPath = path.join(frontendDir, 'index.html');
  const srcDir = path.join(frontendDir, 'src');

  it('R1-T1-01: package.json should define required dependencies and core lifecycle scripts', () => {
    assert.ok(fs.existsSync(pkgPath), 'package.json must exist in frontend-3d');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    assert.strictEqual(pkg.name, 'frontend-3d', "Package name must be 'frontend-3d'");
    assert.strictEqual(pkg.type, 'module', "Package type must be 'module' for ESM support");

    // Required dependencies
    assert.ok(pkg.dependencies?.three, "Dependencies must include 'three'");
    assert.ok(pkg.devDependencies?.['@types/three'], "DevDependencies must include '@types/three'");
    assert.ok(pkg.devDependencies?.typescript, "DevDependencies must include 'typescript'");
    assert.ok(pkg.devDependencies?.vite, "DevDependencies must include 'vite'");
    assert.ok(pkg.devDependencies?.tsx, "DevDependencies must include 'tsx'");

    // Required lifecycle scripts
    assert.ok(pkg.scripts?.dev, "Scripts must define 'dev'");
    assert.ok(pkg.scripts?.build, "Scripts must define 'build'");
    assert.ok(pkg.scripts?.preview, "Scripts must define 'preview'");
    assert.ok(pkg.scripts?.test, "Scripts must define 'test'");
  });

  it('R1-T1-02: tsconfig.json should enforce strict typing and modern bundler resolution', () => {
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist in frontend-3d');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const opts = tsconfig.compilerOptions || {};

    assert.strictEqual(opts.strict, true, 'compilerOptions.strict must be true');
    assert.ok(
      opts.moduleResolution?.toLowerCase() === 'bundler' || opts.moduleResolution?.toLowerCase() === 'nodenext',
      `moduleResolution must be 'bundler' or 'nodenext', got '${opts.moduleResolution}'`
    );
    assert.ok(
      opts.target?.toUpperCase().includes('ES202') || opts.target?.toUpperCase() === 'ESNEXT',
      `target must be ES2022 or ESNEXT, got '${opts.target}'`
    );
  });

  it('R1-T1-03: vite.config.ts should configure publicDir, base, and development server port', () => {
    assert.ok(fs.existsSync(viteConfigPath), 'vite.config.ts must exist in frontend-3d');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');

    assert.ok(content.includes('defineConfig'), 'vite.config.ts must import and use defineConfig');
    assert.ok(content.includes('publicDir'), 'vite.config.ts must specify publicDir');
    assert.ok(content.includes('base'), 'vite.config.ts must specify base');
    assert.ok(content.includes('port: 3001') || content.includes('port'), 'vite.config.ts should configure port');
  });

  it('R1-T1-04: index.html should contain canonical DOM mount points and responsive viewport meta', () => {
    assert.ok(fs.existsSync(indexPath), 'index.html must exist in frontend-3d');
    const html = fs.readFileSync(indexPath, 'utf-8');

    // DOM Mount points
    assert.ok(html.includes('id="scene-container"'), 'index.html must contain #scene-container');
    assert.ok(html.includes('id="hud-overlay"'), 'index.html must contain #hud-overlay');
    assert.ok(html.includes('id="modal-root"'), 'index.html must contain #modal-root');

    // Viewport meta
    assert.ok(html.includes('name="viewport"'), 'index.html must declare responsive viewport meta');
    assert.ok(html.includes('src="/src/main.ts"') || html.includes('src="./src/main.ts"'), 'index.html must mount src/main.ts as module entry');
  });

  it('R1-T1-05: Source code should have zero legacy codebase leakage and zero external CDNs', () => {
    assert.ok(fs.existsSync(srcDir), 'src directory must exist in frontend-3d');

    const getAllFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath));
        } else {
          results.push(fullPath);
        }
      }
      return results;
    };

    const srcFiles = getAllFiles(srcDir);
    srcFiles.push(indexPath);

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Verify zero legacy import paths pointing to ../game/
      assert.strictEqual(
        content.includes('../game/'),
        false,
        `Forbidden legacy leakage found in ${file}: imports '../game/'`
      );
      assert.strictEqual(
        content.includes('/game/src/'),
        false,
        `Forbidden legacy leakage found in ${file}: references '/game/src/'`
      );

      // Verify zero external CDN links
      assertNoExternalUrls(content, `File ${file} contains external CDN URL`);
    }
  });

  it('R1-T1-06: src/main.ts bootstrap should exist and export clean initialization logic', () => {
    const mainTsPath = path.join(srcDir, 'main.ts');
    assert.ok(fs.existsSync(mainTsPath), 'src/main.ts must exist');
    const content = fs.readFileSync(mainTsPath, 'utf-8');

    assert.ok(content.length > 50, 'src/main.ts must not be empty');
    assert.ok(
      content.includes('THREE') || content.includes('three') || content.includes('addEventListener') || content.includes('DOMContentLoaded'),
      'src/main.ts should wire Three.js or DOM bootstrap'
    );
  });
});
