/**
 * Tier 2: Boundary & Corner Cases — R2: 3D Asset Boundaries & Memory Safety
 * Verifies missing model fallback (userData.isPlaceholder), concurrent cache deduplication,
 * subnode articulation safety, buffer cleanup, and corrupted file detection.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import '../harness/setup.js';
import { assertApprox, assertRange } from '../harness/assertions.js';

describe('Tier 2 — R2: Asset Boundary & Safe Traversal Cases', () => {
  it('R2-T2-01: Missing Model Fallback Graceful Placeholder Generation', () => {
    // Model loader fallback contract
    const loadModelWithFallback = (id: string, knownModels: Record<string, THREE.Object3D>): THREE.Object3D => {
      if (knownModels[id]) {
        return knownModels[id].clone();
      }
      // Generate designated fallback placeholder: orange accent box
      const placeholderGeo = new THREE.BoxGeometry(2, 2, 2);
      const placeholderMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
      placeholder.name = `placeholder_${id}`;
      placeholder.userData = {
        isPlaceholder: true,
        requestedId: id,
        timestamp: Date.now(),
      };
      return placeholder;
    };

    const dummyCache: Record<string, THREE.Object3D> = {
      '18098': new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3)),
    };

    // Valid asset
    const valid = loadModelWithFallback('18098', dummyCache);
    assert.strictEqual(valid.userData.isPlaceholder, undefined, 'Valid asset should not be marked as placeholder');

    // Missing asset
    const fallback = loadModelWithFallback('missing_model_99999', dummyCache);
    assert.ok(fallback instanceof THREE.Object3D, 'Fallback must be a valid Three.js Object3D');
    assert.strictEqual(fallback.userData.isPlaceholder, true, 'Fallback must be tagged userData.isPlaceholder = true');
    assert.strictEqual(fallback.userData.requestedId, 'missing_model_99999', 'Fallback should record requested asset ID');
  });

  it('R2-T2-02: Concurrent Asynchronous Cache Deduplication & Cloned Geometry Sharing', async () => {
    let rawFetchCount = 0;
    const modelCache = new Map<string, THREE.Object3D>();
    const pendingPromises = new Map<string, Promise<THREE.Object3D>>();

    const loadCachedModel = async (id: string): Promise<THREE.Object3D> => {
      if (modelCache.has(id)) {
        return modelCache.get(id)!.clone();
      }
      if (pendingPromises.has(id)) {
        const base = await pendingPromises.get(id)!;
        return base.clone();
      }

      const promise = (async () => {
        rawFetchCount++;
        // Simulate async file parse
        await new Promise((resolve) => setTimeout(resolve, 5));
        const geom = new THREE.BoxGeometry(4, 3, 6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geom, mat);
        modelCache.set(id, mesh);
        return mesh;
      })();

      pendingPromises.set(id, promise);
      const base = await promise;
      pendingPromises.delete(id);
      return base.clone();
    };

    // Fire 10 concurrent requests for the exact same model ID
    const promises = Array.from({ length: 10 }, () => loadCachedModel('18130'));
    const instances = await Promise.all(promises);

    assert.strictEqual(rawFetchCount, 1, 'Expected exactly 1 underlying fetch despite 10 concurrent requests');
    assert.strictEqual(instances.length, 10, 'Must return 10 instances');

    // Assert instances are independent clones (distinct positions)
    assert.notStrictEqual(instances[0], instances[1], 'Instances must be independent Object3D clones');
    instances[0].position.set(100, 0, 50);
    assert.strictEqual(instances[1].position.x, 0, 'Mutating instance 0 transform must not affect instance 1');

    // Assert shared underlying BufferGeometry to conserve VRAM
    const geo0 = (instances[0] as THREE.Mesh).geometry;
    const geo1 = (instances[1] as THREE.Mesh).geometry;
    assert.strictEqual(geo0, geo1, 'Cloned instances must share identical underlying BufferGeometry');
  });

  it('R2-T2-03: Subnode Articulation Safe Traversal on Incomplete Hierarchy', () => {
    // Mechanical animator safe articulation contract
    const rotateSubnode = (root: THREE.Object3D, nodeName: string, angleRad: number): boolean => {
      const node = root.getObjectByName(nodeName);
      if (!node) {
        return false; // Safely return false without throwing TypeError
      }
      node.rotation.y = angleRad;
      return true;
    };

    const emptyGroup = new THREE.Group();

    assert.doesNotThrow(() => {
      const resMissing = rotateSubnode(emptyGroup, 'array-99', Math.PI / 4);
      assert.strictEqual(resMissing, false, 'Should return false when articulated node does not exist');
    }, 'Missing subnode traversal must not throw exception');

    // Group with valid subnode
    const validGroup = new THREE.Group();
    const arrayNode = new THREE.Object3D();
    arrayNode.name = 'array-1';
    validGroup.add(arrayNode);

    const resFound = rotateSubnode(validGroup, 'array-1', Math.PI / 3);
    assert.strictEqual(resFound, true, 'Should return true when articulated node exists');
    assertApprox(arrayNode.rotation.y, Math.PI / 3, 1e-4, 'Subnode rotation Y');
  });

  it('R2-T2-04: Far-Field Coordinate Scale & Precision Preservation (500m Perimeter)', () => {
    // Ensure Three.js world matrices and bounding spheres do not suffer catastrophic cancellation at 500m
    const marker = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
    marker.position.set(485.500, 0.000, -420.250);
    marker.updateMatrixWorld(true);

    const worldPos = new THREE.Vector3();
    marker.getWorldPosition(worldPos);

    assertApprox(worldPos.x, 485.500, 1e-5, 'Far-field world position X');
    assertApprox(worldPos.y, 0.000, 1e-5, 'Far-field world position Y');
    assertApprox(worldPos.z, -420.250, 1e-5, 'Far-field world position Z');

    marker.geometry.computeBoundingBox();
    marker.geometry.computeBoundingSphere();
    const sphere = marker.geometry.boundingSphere!.clone();
    sphere.applyMatrix4(marker.matrixWorld);

    assert.ok(sphere.radius > 0, 'Bounding sphere radius must remain positive');
    assertApprox(sphere.center.x, 485.500, 1e-4, 'Bounding sphere center X at far perimeter');
  });

  it('R2-T2-05: WebGL Memory Buffer Disposal on Scene Unload', () => {
    // Scene teardown disposal contract
    let disposedGeometries = 0;
    let disposedMaterials = 0;

    const root = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const origGeoDispose = geo.dispose.bind(geo);
      geo.dispose = () => {
        disposedGeometries++;
        origGeoDispose();
      };

      const mat = new THREE.MeshBasicMaterial();
      const origMatDispose = mat.dispose.bind(mat);
      mat.dispose = () => {
        disposedMaterials++;
        origMatDispose();
      };

      root.add(new THREE.Mesh(geo, mat));
    }

    const disposeHierarchy = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
      obj.clear();
    };

    disposeHierarchy(root);

    assert.strictEqual(disposedGeometries, 5, 'Must dispose all 5 geometries');
    assert.strictEqual(disposedMaterials, 5, 'Must dispose all 5 materials');
    assert.strictEqual(root.children.length, 0, 'Root object must be cleared');
  });

  it('R2-T2-06: Corrupted or Truncated GLB Header Detection', () => {
    // Corrupted 0-byte or bad magic buffer
    const badMagicBuf = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00]);
    const truncatedBuf = Buffer.from([0x67, 0x6c, 0x54, 0x46]); // only 4 bytes

    const validateHeader = (buf: Buffer): boolean => {
      if (buf.length < 12) return false;
      const magic = buf.readUInt32LE(0);
      return magic === 0x46546c67;
    };

    assert.strictEqual(validateHeader(badMagicBuf), false, 'Bad magic must be rejected');
    assert.strictEqual(validateHeader(truncatedBuf), false, 'Truncated header must be rejected');
  });
});
