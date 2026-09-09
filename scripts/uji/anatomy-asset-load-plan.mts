import assert from 'node:assert/strict'
import type { AnatomyStreamingPlan } from '../../src/lib/anatomyStreamingPlanner.ts'
import { planAnatomyAssetLoads, numericLodToHdLod } from '../../src/lib/anatomy/assetLoadPlan.ts'
import type { AnatomyAssetManifestEntry } from '../../src/lib/anatomy/assetManifest.ts'

const baseAsset: Omit<AnatomyAssetManifestEntry, 'assetId' | 'graphNodeId' | 'targetId' | 'file' | 'sourceNodeNames' | 'immutableRevision' | 'lod' | 'namedStructures'> = {
  format: 'glb',
  geometryCompression: 'meshopt',
  textureEncoding: 'ktx2',
  sourceLicenseVerified: true,
  textureLicenseVerified: true,
  hasExplicitLeftRightOrientation: true,
  hasExplicitAnatomicalAxes: true,
  closeZoomApproved: true,
  estimatedGpuBytes: 2_000_000,
  estimatedDrawCalls: 2,
}

const manifest: AnatomyAssetManifestEntry[] = [
  {
    ...baseAsset,
    assetId: 'heart-overview',
    graphNodeId: 'heart',
    targetId: 'heart',
    file: 'cardiovascular.glb',
    sourceNodeNames: ['Heart'],
    immutableRevision: 'sha256:heart-overview-001',
    lod: 'overview',
    namedStructures: ['Heart'],
  },
  {
    ...baseAsset,
    assetId: 'heart-organ',
    graphNodeId: 'heart',
    targetId: 'heart',
    file: 'cardiovascular.glb',
    sourceNodeNames: ['Heart'],
    immutableRevision: 'sha256:heart-organ-001',
    lod: 'organ',
    namedStructures: ['Heart'],
    estimatedGpuBytes: 6_000_000,
    estimatedDrawCalls: 5,
  },
  {
    ...baseAsset,
    assetId: 'aorta-overview',
    graphNodeId: 'aorta',
    targetId: 'aorta',
    file: 'cardiovascular.glb',
    sourceNodeNames: ['Aorta'],
    immutableRevision: 'sha256:aorta-overview-001',
    lod: 'overview',
    namedStructures: ['Aorta'],
  },
]

const streaming: AnatomyStreamingPlan = {
  entries: [
    { nodeId: 'heart', action: 'upgrade', targetLevel: 3, estimatedGpuBytes: 1, estimatedDrawCalls: 1, priorityScore: 10 },
    { nodeId: 'aorta', action: 'preload', targetLevel: 4, estimatedGpuBytes: 1, estimatedDrawCalls: 1, priorityScore: 5 },
    { nodeId: 'skin', action: 'unload', estimatedGpuBytes: 0, estimatedDrawCalls: 0, priorityScore: 0 },
    { nodeId: 'missing-node', action: 'load', targetLevel: 2, estimatedGpuBytes: 1, estimatedDrawCalls: 1, priorityScore: 1 },
  ],
  totalGpuBytes: 2,
  totalDrawCalls: 2,
  residentNodes: 3,
  overBudget: false,
}

assert.equal(numericLodToHdLod(0), 'overview')
assert.equal(numericLodToHdLod(2), 'organ')
assert.equal(numericLodToHdLod(4), 'detail')

const reference = planAnatomyAssetLoads(streaming, manifest, 'reference')
const heart = reference.entries.find((entry) => entry.nodeId === 'heart')
assert.equal(heart?.assetId, 'heart-organ')
assert.equal(heart?.action, 'replace')
assert.equal(heart?.cacheKey, 'heart-organ@sha256:heart-organ-001:lod-organ')

const aorta = reference.entries.find((entry) => entry.nodeId === 'aorta')
assert.equal(aorta?.assetId, 'aorta-overview', 'Closest eligible lower LOD must be used when detail is unavailable.')
assert.equal(aorta?.action, 'preload')

const skin = reference.entries.find((entry) => entry.nodeId === 'skin')
assert.equal(skin?.action, 'unload')
assert.deepEqual(reference.blockedNodeIds, ['missing-node'])

const verified = planAnatomyAssetLoads(streaming, manifest, 'verified')
assert.deepEqual(verified.blockedNodeIds, ['aorta', 'heart', 'missing-node'])
assert.ok(verified.entries.filter((entry) => entry.action === 'blocked').length === 3)

const reordered = planAnatomyAssetLoads({ ...streaming, entries: [...streaming.entries].reverse() }, [...manifest].reverse(), 'reference')
assert.deepEqual(reordered, reference)

console.log('Anatomy asset load plan verified: numeric→HD LOD bridge, immutable cache keys, deterministic fallback, preload/replace/unload actions, and verified-tier fail-close.')
