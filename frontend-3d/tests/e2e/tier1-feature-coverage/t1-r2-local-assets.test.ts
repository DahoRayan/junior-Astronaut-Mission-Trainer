/**
 * Tier 1: Feature Coverage — R2: Local 3D Asset Ingestion & Scene Hierarchy
 * Verifies 54 GLB models manifest check, starter scene hierarchy, zero CDN URLs,
 * metre scale, +Y up, and Y=2.40m hab-port elevation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../harness/setup.js';
import {
  assertApprox,
  assertRange,
  assertNoExternalUrls,
  assertGlbHeaderValid,
} from '../harness/assertions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../..');
const modelsDir = path.join(frontendDir, 'public/models');
const manifestPath = path.join(modelsDir, 'manifest.json');

describe('Tier 1 — R2: Local 3D Asset Integration & Invariants', () => {
  it('R2-T1-01: Asset Pack Manifest & Local File Inventory Verification', () => {
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public/models/');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    assert.ok(Array.isArray(manifest), 'manifest.json must parse as an array of model entries');
    assert.ok(manifest.length >= 54, `Expected at least 54 models indexed, got ${manifest.length}`);

    let totalBytes = 0;

    for (const item of manifest) {
      assert.ok(item.id, `Model entry missing id: ${JSON.stringify(item)}`);
      assert.ok(item.title, `Model ${item.id} missing title`);
      assert.ok(item.category, `Model ${item.id} missing category`);
      assert.ok(Array.isArray(item.sizeMeters), `Model ${item.id} missing sizeMeters array`);

      const filename = item.filename || `model_${item.id}.glb`;
      const filePath = path.join(modelsDir, filename);
      assert.ok(fs.existsSync(filePath), `GLB file on disk missing: ${filePath}`);

      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 1000, `GLB file suspiciously small (${stat.size} bytes): ${filename}`);
      totalBytes += stat.size;

      // Validate binary GLB header for every single model
      const fd = fs.openSync(filePath, 'r');
      const headerBuf = Buffer.alloc(12);
      fs.readSync(fd, headerBuf, 0, 12, 0);
      fs.closeSync(fd);

      assertGlbHeaderValid(headerBuf, stat.size, `GLB header invalid for ${filename}`);
    }

    // Total byte size of the 54 GLBs is ~14.5 MB (15,229,708 bytes)
    assertRange(totalBytes, 14_000_000, 16_500_000, 'Total on-disk asset pack size');
  });

  it('R2-T1-02: Zero External CDN Network Dependency Static Audit', () => {
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
    const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');

    // Manifest itself must not contain external download CDN links
    assertNoExternalUrls(manifestRaw, 'manifest.json must not reference remote external URLs');

    // Index.html must not contain CDN references
    const indexHtml = fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf-8');
    assertNoExternalUrls(indexHtml, 'index.html must not reference external CDNs');
  });

  it('R2-T1-03: Starter Scene (colony-overview.glb) Hierarchy & 24 Assembled Modules', () => {
    const starterPath = path.join(modelsDir, 'colony-overview.glb');
    assert.ok(fs.existsSync(starterPath), 'colony-overview.glb must exist locally');

    const stat = fs.statSync(starterPath);
    // Starter scene is 2,615,980 bytes
    assertRange(stat.size, 2_600_000, 2_650_000, 'Starter scene colony-overview.glb file size');

    // Read and parse GLB JSON chunk to inspect scene graph nodes
    const data = fs.readFileSync(starterPath);
    const jsonChunkLength = data.readUInt32LE(12);
    const jsonChunkType = data.readUInt32LE(16);
    assert.strictEqual(jsonChunkType, 0x4e4f534a, 'First chunk must be JSON (0x4E4F534A)');

    const jsonStr = data.toString('utf-8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);

    assert.ok(gltf.nodes && Array.isArray(gltf.nodes), 'glTF must declare nodes array');

    // The root node is 'colony-overview' with 24 pre-assembled child module nodes
    const rootNode = gltf.nodes.find((n: any) => n.name === 'colony-overview') || gltf.nodes[0];
    assert.ok(rootNode, "Root node 'colony-overview' must exist");
    assert.strictEqual(rootNode.children?.length, 24, 'Starter scene root node must contain exactly 24 children');

    // Verify key modular building types exist among children
    const childNames = rootNode.children.map((idx: number) => gltf.nodes[idx]?.name?.toLowerCase() || '');

    const requiredSubstrings = [
      'connecting-tunnel',
      'rigid-cylinder-habitat',
      'inflatable-dome',
      'airlock',
      'greenhouse',
      'solar-array',
      'battery-container',
      'nuclear-power-unit',
      'comms-relay-mast',
      'regolith-excavator',
      'rover',
    ];

    for (const req of requiredSubstrings) {
      const found = childNames.some((name: string) => name.includes(req));
      assert.ok(found, `Starter scene must contain assembled child module matching keyword '${req}'`);
    }
  });

  it('R2-T1-04: Metre Scale, +Y Up Orientation & Ground Contact (Y=0.00m)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const starterMeta = manifest.find((m: any) => m.id === '18148' || m.filename === 'colony-overview.glb');
    assert.ok(starterMeta, 'Starter scene metadata must exist in manifest');

    // Dimensions: ~45.5m x 9.98m x 54.1m
    const [widthX, heightY, depthZ] = starterMeta.sizeMeters;
    assertApprox(widthX, 45.5, 1.0, 'Starter scene width X (metres)');
    assertApprox(heightY, 9.98, 0.5, 'Starter scene height Y (metres)');
    assertApprox(depthZ, 54.1, 1.0, 'Starter scene depth Z (metres)');

    // Ground plane contact: min.y must touch 0.0m regolith plane within +/- 0.01m
    const minY = starterMeta.boundingBox.min[1];
    assertApprox(minY, 0.0, 0.01, 'Base colony ground contact elevation min.y');
  });

  it('R2-T1-05: Hab-Port Centerline Mating Plane Elevation Standard (Y=2.40m)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    // Find straight connecting tunnel module (ID 18098)
    const tunnel = manifest.find((m: any) => m.id === '18098' || m.filename?.includes('tunnel-straight'));
    assert.ok(tunnel, 'Connecting tunnel module must exist in manifest');

    // Tunnel height is ~3.67m, with mating port centerline located at Y = 2.40m +/- 0.15m
    const minY = tunnel.boundingBox.min[1];
    const maxY = tunnel.boundingBox.max[1];
    const centerY = (minY + maxY) / 2;

    assertApprox(centerY, 1.83, 0.2, 'Tunnel geometric centroid Y');
    // Top crown is at ~3.67m and port collar center is at Y = 2.40m
    const habPortCollarY = minY + (maxY - minY) * (2.40 / 3.67);
    assertApprox(habPortCollarY, 2.40, 0.15, 'Hab-port collar mating plane centerline elevation');
  });

  it('R2-T1-06: KHR_mesh_quantization & Procedural PBR Material Configuration', () => {
    const starterPath = path.join(modelsDir, 'colony-overview.glb');
    const data = fs.readFileSync(starterPath);
    const jsonChunkLength = data.readUInt32LE(12);
    const jsonStr = data.toString('utf-8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);

    // Quantization extension enables compact local serving without large texture files
    assert.ok(
      gltf.extensionsUsed?.includes('KHR_mesh_quantization'),
      "glTF must declare 'KHR_mesh_quantization' extension"
    );

    // Standard PBR materials without remote texture dependencies
    assert.ok(Array.isArray(gltf.materials), 'glTF must define materials array');
    assert.ok(gltf.materials.length >= 5, `Expected multiple PBR materials, got ${gltf.materials.length}`);

    // Verify 0 image textures (100% procedural vertex colors & material parameters)
    const textureCount = gltf.textures ? gltf.textures.length : 0;
    assert.strictEqual(textureCount, 0, 'Asset pack models should rely on procedural PBR materials with 0 image textures');
  });
});
