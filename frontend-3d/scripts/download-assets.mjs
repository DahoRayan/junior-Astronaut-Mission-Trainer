#!/usr/bin/env node
/**
 * NASA Outpost 3D - Asset Ingestion Pipeline
 * Downloads all 54 GLB models into frontend-3d/public/models/
 * Validates glTF binary headers, verifies byte counts, and generates manifest.json
 */
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// 1. Force IPv4 first to avoid undici connect timeout hangs on Windows
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');
const MANIFEST_FILE = path.join(MODELS_DIR, 'manifest.json');

// Concurrency pool size & retry limit
const CONCURRENCY = 6;
const MAX_RETRIES = 3;

function toFilename(item) {
  if (String(item.id) === '18148') {
    return 'colony-overview.glb';
  }
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug}.glb`;
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchBufferWithRetry(url, expectedSize, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NASA-OutPost-Asset-Ingestion/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (buffer.length !== expectedSize) {
        throw new Error(`Size mismatch: received ${buffer.length} B, expected ${expectedSize} B`);
      }

      // Validate glTF 2.0 binary header
      const magic = buffer.toString('ascii', 0, 4);
      const version = buffer.readUInt32LE(4);
      const headerLen = buffer.readUInt32LE(8);
      if (magic !== 'glTF' || version !== 2 || headerLen !== buffer.length) {
        throw new Error(`Corrupted GLB binary: magic=${magic}, ver=${version}, headerLen=${headerLen}`);
      }

      return buffer;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === retries) throw err;
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 3000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function loadCatalog() {
  const candidatePaths = [
    process.argv[2],
    path.join(__dirname, 'catalog.json'),
    path.join(ROOT_DIR, 'catalog.json'),
    'C:/Users/acer i7/.gemini/antigravity/scratch/teamwork/cd7248a5-94d0-4612-8d7e-de55368f8155/.agents/teamwork/spec_miner_survey_2/catalog.json'
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      console.log(`[INGEST] Loading catalog from: ${p}`);
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  }

  console.log('[INGEST] Local catalog not found; fetching live pack manifest...');
  const res = await fetch('https://3dassets.dev/api/v1/packs/lunar-surface-colony-and-rovers', {
    headers: { 'User-Agent': 'NASA-OutPost-Asset-Ingestion/1.0' }
  });
  if (!res.ok) throw new Error(`Failed to fetch pack manifest: HTTP ${res.status}`);
  const json = await res.json();
  return json.data.assets;
}

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log(' NASA Outpost 3D: Asset Ingestion Pipeline');
  console.log('====================================================');

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  const catalog = await loadCatalog();
  console.log(`[INGEST] Catalog items: ${catalog.length}`);

  let downloadedCount = 0;
  let cachedCount = 0;
  let totalBytesProcessed = 0;

  const manifest = [];

  console.log(`[INGEST] Downloading ${catalog.length} GLB models (concurrency: ${CONCURRENCY})...`);

  await mapConcurrent(catalog, CONCURRENCY, async (item, idx) => {
    const filename = toFilename(item);
    const destPath = path.join(MODELS_DIR, filename);
    const expectedSize = item.fileSize;

    let buf;
    if (fs.existsSync(destPath)) {
      const stat = fs.statSync(destPath);
      if (stat.size === expectedSize) {
        // Validate existing file header
        const headerBuf = Buffer.alloc(12);
        const fd = fs.openSync(destPath, 'r');
        fs.readSync(fd, headerBuf, 0, 12, 0);
        fs.closeSync(fd);
        if (headerBuf.toString('ascii', 0, 4) === 'glTF') {
          buf = fs.readFileSync(destPath);
          cachedCount++;
        }
      }
    }

    if (!buf) {
      buf = await fetchBufferWithRetry(item.cdnUrl, expectedSize);
      fs.writeFileSync(destPath, buf);
      downloadedCount++;
    }

    totalBytesProcessed += buf.length;
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    const aliases = String(item.id) === '18148' 
      ? ['model_18148.glb', 'lunar-colony-overview.glb']
      : [`model_${item.id}.glb`];

    manifest.push({
      id: String(item.id),
      title: item.title,
      filename: filename,
      aliases: aliases,
      category: item.category,
      slug: item.slug,
      fileSize: item.fileSize,
      sha256: sha256,
      sizeMeters: item.sizeMeters,
      boundingBox: item.boundingBox,
      triangles: item.triangles,
      vertices: item.vertices,
      summary: item.summary,
      extensionsUsed: item.extensionsUsed
    });

    const progress = `[${String(idx + 1).padStart(2, '0')}/${catalog.length}]`;
    console.log(`  ${progress} ✓ ${filename} (${buf.length} B)`);
  });

  // Sort manifest deterministically by integer ID
  manifest.sort((a, b) => Number(a.id) - Number(b.id));

  // Write manifest.json
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[INGEST] ✓ Written manifest: ${MANIFEST_FILE}`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('----------------------------------------------------');
  console.log(`[INGEST] COMPLETE: ${manifest.length} models ready`);
  console.log(`  - Freshly Downloaded: ${downloadedCount}`);
  console.log(`  - Cached / Verified:  ${cachedCount}`);
  console.log(`  - Total Bytes:        ${totalBytesProcessed} bytes (${(totalBytesProcessed / (1024*1024)).toFixed(2)} MB)`);
  console.log(`  - Total Time:         ${durationSec}s`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('[INGEST ERROR]', err);
  process.exit(1);
});
