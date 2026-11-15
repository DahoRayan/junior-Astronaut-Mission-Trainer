/**
 * NASA Astrodynamics & Domain Assertions for E2E Tests
 */

import assert from 'node:assert/strict';
import type { ResourceState } from './types.js';

/**
 * Asserts that actual is within tolerance of expected.
 */
export function assertApprox(actual: number, expected: number, tolerance = 1e-4, msg?: string): void {
  assert.ok(
    Number.isFinite(actual),
    `${msg || 'Value is not finite'}: got ${actual}`
  );
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `${msg || 'Value out of tolerance'}: expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`
  );
}

/**
 * Asserts that a value lies within an inclusive [min, max] range.
 */
export function assertRange(val: number, min: number, max: number, msg?: string): void {
  assert.ok(
    Number.isFinite(val),
    `${msg || 'Value is not finite'}: got ${val}`
  );
  assert.ok(
    val >= min && val <= max,
    `${msg || 'Value out of range'}: expected [${min}, ${max}], got ${val}`
  );
}

/**
 * Asserts that string content contains zero external CDN or remote web URLs.
 * (Allows localhost, 127.0.0.1, or schema-relative local paths).
 */
export function assertNoExternalUrls(content: string, msg?: string): void {
  const cdnRegex = /https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'`<>]+/gi;
  const matches = content.match(cdnRegex);
  assert.strictEqual(
    matches,
    null,
    `${msg || 'External URLs detected in content'}: ${JSON.stringify(matches)}`
  );
}

/**
 * Asserts that a 3D vector matches expected coordinates within tolerance.
 */
export function assertVector3Approx(
  actual: { x: number; y: number; z: number },
  expected: { x: number; y: number; z: number },
  tolerance = 1e-3,
  msg?: string
): void {
  const dx = Math.abs(actual.x - expected.x);
  const dy = Math.abs(actual.y - expected.y);
  const dz = Math.abs(actual.z - expected.z);
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  assert.ok(
    dist <= tolerance,
    `${msg || 'Vector out of tolerance'}: expected (${expected.x}, ${expected.y}, ${expected.z}) ± ${tolerance}, got (${actual.x}, ${actual.y}, ${actual.z}) (dist: ${dist})`
  );
}

/**
 * Asserts that all 18 simulation variables exist, are finite numbers, and are bounded.
 */
export function assertResourceStateValid(state: ResourceState, msg?: string): void {
  const requiredKeys: (keyof ResourceState)[] = [
    'power',
    'stored_o2',
    'oxygen',
    'co2',
    'temperature',
    'pressure',
    'water',
    'food',
    'food_growth',
    'radiation',
    'radiation_protection',
    'shield',
    'dust',
    'light_cycle',
    'saturation',
    'quenching',
    'enthusiasm',
    'health',
  ];

  for (const key of requiredKeys) {
    const val = state[key];
    assert.ok(
      typeof val === 'number' && Number.isFinite(val),
      `${msg || 'Resource state invalid'}: field '${key}' must be a finite number, got ${val}`
    );
    // Standard variables are percentages or gauges bounded between 0 and 100
    // (power can exceed 100 up to battery capacity, food can be positive count)
    if (key !== 'power' && key !== 'food') {
      assert.ok(
        val >= -0.001 && val <= 100.001,
        `${msg || 'Resource state out of bounds'}: field '${key}' = ${val} outside [0, 100]`
      );
    } else {
      assert.ok(
        val >= 0,
        `${msg || 'Resource state negative'}: field '${key}' = ${val} must be >= 0`
      );
    }
  }
}

/**
 * Asserts that a binary buffer starts with valid glTF 2.0 binary header.
 * Magic: 0x46546C67 ("glTF" in little-endian ASCII)
 * Version: 2
 */
export function assertGlbHeaderValid(buffer: Buffer, expectedTotalLength?: number, msg?: string): void {
  assert.ok(buffer.length >= 12, `${msg || 'Buffer too small for GLB header'}: length is ${buffer.length}`);
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  assert.strictEqual(
    magic,
    0x46546c67,
    `${msg || 'Invalid GLB magic header'}: expected 0x46546C67 ('glTF'), got 0x${magic.toString(16)}`
  );
  assert.strictEqual(
    version,
    2,
    `${msg || 'Invalid GLB version'}: expected 2, got ${version}`
  );
  if (expectedTotalLength !== undefined) {
    assert.strictEqual(
      length,
      expectedTotalLength,
      `${msg || 'GLB header length mismatch'}: header declares ${length}, expected total size ${expectedTotalLength}`
    );
  }
}
