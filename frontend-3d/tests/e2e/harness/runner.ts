/**
 * Standalone Test Runner Orchestration & Markdown Report Generator
 * Executes 4-tier E2E tests, records pass/fail metrics, and writes summary report.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const e2eDir = path.resolve(__dirname, '..');
const frontend3dDir = path.resolve(e2eDir, '../..');

interface TierRunResult {
  tierName: string;
  files: string[];
  passed: number;
  failed: number;
  durationMs: number;
  output: string;
}

async function runCommand(cmd: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
      process.stdout.write(d);
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
      process.stderr.write(d);
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('NASA OUTPOST 3D LUNAR FRONTEND — E2E TEST RUNNER');
  console.log('================================================================\n');

  const tiers = [
    { name: 'Tier 1: Feature Coverage', dir: 'tier1-feature-coverage' },
    { name: 'Tier 2: Boundary & Corner Cases', dir: 'tier2-boundary-cases' },
    { name: 'Tier 3: Cross-Feature Combinations', dir: 'tier3-cross-feature' },
    { name: 'Tier 4: Real-World Scenarios', dir: 'tier4-real-world-scenarios' },
  ];

  const startTime = Date.now();
  const results: TierRunResult[] = [];
  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const t of tiers) {
    const tierPath = path.join(e2eDir, t.dir);
    if (!fs.existsSync(tierPath)) continue;

    const files = fs.readdirSync(tierPath).filter((f) => f.endsWith('.test.ts'));
    console.log(`\n▶ Running ${t.name} (${files.length} test suites)...`);

    const tStart = Date.now();
    const targetGlob = `tests/e2e/${t.dir}/*.test.ts`;
    const res = await runCommand('npx', ['tsx', '--test', targetGlob], frontend3dDir);
    const duration = Date.now() - tStart;

    // Parse pass/fail from tap or spec output
    const passMatches = res.stdout.match(/✔/g) || res.stdout.match(/ok \d+/g) || [];
    const failMatches = res.stdout.match(/✖/g) || res.stdout.match(/not ok \d+/g) || [];

    const passed = passMatches.length;
    const failed = failMatches.length;

    totalTests += (passed + failed);
    totalPass += passed;
    totalFail += failed;

    results.push({
      tierName: t.name,
      files,
      passed,
      failed,
      durationMs: duration,
      output: res.stdout,
    });
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n================================================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Total Test Suites: ${results.reduce((acc, r) => acc + r.files.length, 0)}`);
  console.log(`Total Assertions/Tests: ${totalTests}`);
  console.log(`Passed: ${totalPass}`);
  console.log(`Failed: ${totalFail}`);
  console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('================================================================\n');

  // Generate Markdown Report
  const reportPath = path.join(frontend3dDir, 'E2E_TEST_REPORT.md');
  const mdContent = `# E2E Test Suite Execution Report

**Project:** NASA Outpost 3D Lunar Frontend (\`frontend-3d/\`)  
**Execution Timestamp:** ${new Date().toISOString()}  
**Runner:** Native \`node:test\` via \`tsx --test\`  
**Total Assertions/Tests Passed:** ${totalPass} / ${totalTests}  
**Total Failures:** ${totalFail}  
**Total Duration:** ${(totalDuration / 1000).toFixed(2)}s  
**Status:** ${totalFail === 0 ? '✅ ALL TIERS PASSED' : '❌ FAILURES DETECTED'}

---

## Tier Breakdown

| Tier | Test Suites | Tests Passed | Tests Failed | Duration | Status |
|------|-------------|--------------|--------------|----------|--------|
${results.map((r) => `| ${r.tierName} | ${r.files.length} | ${r.passed} | ${r.failed} | ${(r.durationMs / 1000).toFixed(2)}s | ${r.failed === 0 ? '✅ PASS' : '❌ FAIL'} |`).join('\n')}

---

## Test Suites Verified

${results.map((r) => `### ${r.tierName}
${r.files.map((f) => `- \`${f}\``).join('\n')}
`).join('\n')}
`;

  fs.writeFileSync(reportPath, mdContent, 'utf-8');
  console.log(`Generated report at: ${reportPath}`);

  if (totalFail > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});
