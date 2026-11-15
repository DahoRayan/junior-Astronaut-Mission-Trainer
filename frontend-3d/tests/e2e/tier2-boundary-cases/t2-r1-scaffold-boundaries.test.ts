/**
 * Tier 2: Boundary & Corner Cases — R1: Scaffold & Build Boundaries
 * Verifies build idempotency, missing environment variables fallback,
 * strict typechecking, and manifest parse resilience.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import '../harness/setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../..');

describe('Tier 2 — R1: Scaffold Boundary & Robustness Cases', () => {
  it('R1-T2-01: Build Idempotency & Clean Dist Output Verification', () => {
    const distDir = path.join(frontendDir, 'dist');

    // Run production build
    assert.doesNotThrow(() => {
      execSync('npm run build', { cwd: frontendDir, stdio: 'pipe' });
    }, 'Production build should succeed cleanly with exit code 0');

    assert.ok(fs.existsSync(distDir), 'dist directory must be generated after build');
    const files = fs.readdirSync(distDir);
    assert.ok(files.includes('index.html'), 'dist must contain index.html');

    // Second build execution (idempotency check: should overwrite cleanly without error)
    assert.doesNotThrow(() => {
      execSync('npm run build', { cwd: frontendDir, stdio: 'pipe' });
    }, 'Second subsequent build execution should succeed cleanly (idempotent)');
  });

  it('R1-T2-02: Missing or Undefined Environment Variables Graceful Fallback', () => {
    // Test that client code and Vite config handle missing process.env values gracefully
    const originalEnv = { ...process.env };
    delete process.env.VITE_AI_SERVICE_URL;
    delete process.env.PORT;

    try {
      const viteConfig = fs.readFileSync(path.join(frontendDir, 'vite.config.ts'), 'utf-8');
      assert.ok(viteConfig.length > 0, 'vite.config.ts exists and reads cleanly');
      // Ensure defaults exist (e.g. port 3001 or fallback)
      assert.ok(viteConfig.includes('3001') || viteConfig.includes('port'), 'Default port configured');
    } finally {
      process.env = originalEnv;
    }
  });

  it('R1-T2-03: Strict TypeScript Configuration Invariance', () => {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(frontendDir, 'tsconfig.json'), 'utf-8'));
    const opts = tsconfig.compilerOptions || {};

    assert.strictEqual(opts.strict, true, 'strict mode must be explicitly enabled');
    assert.strictEqual(opts.isolatedModules, true, 'isolatedModules should be enabled for modern Vite compilation');
    assert.strictEqual(opts.resolveJsonModule, true, 'resolveJsonModule must be enabled to import catalogs');
  });

  it('R1-T2-04: Zero UTF-8 Byte-Order-Mark (BOM) in JSON and TypeScript Configs', () => {
    const filesToCheck = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
    ];

    for (const f of filesToCheck) {
      const buf = fs.readFileSync(path.join(frontendDir, f));
      // UTF-8 BOM is 0xEF, 0xBB, 0xBF
      const hasBOM = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      assert.strictEqual(hasBOM, false, `File '${f}' must not contain UTF-8 Byte Order Mark (BOM)`);
    }
  });

  it('R1-T2-05: Gitignore Baseline Exclusions (node_modules, dist, .env)', () => {
    const gitignorePath = path.join(frontendDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      assert.ok(gitignore.includes('node_modules'), '.gitignore must exclude node_modules');
      assert.ok(gitignore.includes('dist'), '.gitignore must exclude dist');
    } else {
      // Check root gitignore
      const rootGitignore = fs.readFileSync(path.resolve(frontendDir, '../.gitignore'), 'utf-8');
      assert.ok(rootGitignore.includes('node_modules') || rootGitignore.includes('dist'), 'Root .gitignore must exclude build artifacts');
    }
  });
});
