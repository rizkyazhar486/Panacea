import assert from 'node:assert/strict'
import { WHOLE_BODY_ATLAS_GRAPH } from '../../src/lib/wholeBodyAtlasCore.ts'
import { buildHighEndAtlasRenderTransaction } from '../../src/lib/anatomy/highEndAtlasEngine.ts'
import type { AnatomyAssetManifestEntry } from '../../src/lib/anatomy/assetManifest.ts'

const referenceAsset = (
  assetId: string,
  graphNodeId: string,
  file: string,
  sourceName: string,
  lod: 'overview' | 'organ' | 'detail',
): AnatomyAssetManifestEntry => ({
  assetId,
  graphNodeId,
  targetId: graphNodeId,
  file,
  sourceNodeNames: [sourceName],
  immutableRevision: `sha256:${assetId}-fixture-001`,
  format: 'glb',
  geometryCompression: 'meshopt',
  textureEncoding: 'ktx2',
  lod,
  namedStructures: [sourceName],
  sourceLicenseVerified: true,
  textureLicenseVerified: true,
  hasExplicitLeftRightOrientation: true,
  hasExplicitAnatomicalAxes: true,
  closeZoomApproved: true,
  estimatedGpuBytes: lod === 'detail' ? 12_000_000 : lod === 'organ' ? 6_000_000 : 2_000_000,
  estimatedDrawCalls: lod === 'detail' ? 8 : lod === 'organ' ? 4 : 2,
})

const manifest = [
  referenceAsset('heart-organ-v1', 'heart', 'cardiovascular.glb', 'Heart', 'organ'),
  referenceAsset('aorta-organ-v1', 'aorta', 'cardiovascular.glb', 'Aorta', 'organ'),
  referenceAsset('trachea-organ-v1', 'trachea', 'visceral.glb', 'Trachea', 'organ'),
]

const baseRequest = {
  graph: WHOLE_BODY_ATLAS_GRAPH,
  sourceBundles: [
    { file: 'cardiovascular.glb', names: ['Heart', 'Aorta'] },
    { file: 'visceral.glb', names: ['Trachea'] },
  ],
  manifest,
  candidates: [
    { nodeId: 'heart', projectedRadiusPx: 220, clinicalWeight: 3, visible: true, selected: true, interacting: false, predictedNext: false },
    { nodeId: 'aorta', projectedRadiusPx: 150, clinicalWeight: 2, visible: true, selected: false, interacting: true, predictedNext: false },
    { nodeId: 'trachea', projectedRadiusPx: 80, clinicalWeight: 2, visible: true, selected: false, interacting: false, predictedNext: true },
  ],
  budget: { gpuBytes: 30_000_000, maxDrawCalls: 24, maxResidentNodes: 4 },
  publicationTier: 'reference' as const,
}

const transaction = buildHighEndAtlasRenderTransaction(baseRequest)
assert.equal(transaction.ready, true, transaction.blockers.join('\n'))
assert.deepEqual(transaction.blockers, [])
assert.deepEqual(transaction.criticalBlockedNodeIds, [])
assert.ok(transaction.bindings.bindings.some((binding) => binding.nodeId === 'heart' && binding.sourceName === 'Heart'))
assert.ok(transaction.assetLoadPlan.entries.some((entry) => entry.nodeId === 'heart' && entry.assetId === 'heart-organ-v1'))
assert.equal(transaction.streamingPlan.overBudget, false)

const verifiedWithoutReview = buildHighEndAtlasRenderTransaction({
  ...baseRequest,
  publicationTier: 'verified',
})
assert.equal(verifiedWithoutReview.ready, false)
assert.ok(verifiedWithoutReview.blockers.includes('asset-load:critical-node-blocked'))
assert.deepEqual(verifiedWithoutReview.criticalBlockedNodeIds, ['aorta', 'heart'])

const missingSelectedAsset = buildHighEndAtlasRenderTransaction({
  ...baseRequest,
  manifest: manifest.filter((asset) => asset.graphNodeId !== 'heart'),
})
assert.equal(missingSelectedAsset.ready, false)
assert.deepEqual(missingSelectedAsset.criticalBlockedNodeIds, ['heart'])

const floatingSelectedAsset = buildHighEndAtlasRenderTransaction({
  ...baseRequest,
  manifest: manifest.map((asset) => asset.graphNodeId === 'heart' ? { ...asset, immutableRevision: 'latest' } : asset),
})
assert.equal(floatingSelectedAsset.ready, false)
assert.ok(floatingSelectedAsset.blockers.includes('asset-manifest:invalid'))

const ambiguousGraph = {
  ...WHOLE_BODY_ATLAS_GRAPH,
  nodes: WHOLE_BODY_ATLAS_GRAPH.nodes.map((node) => node.id === 'aorta'
    ? { ...node, sourceNodeAliases: [...node.sourceNodeAliases, 'Heart'] }
    : node),
}
const ambiguous = buildHighEndAtlasRenderTransaction({ ...baseRequest, graph: ambiguousGraph })
assert.equal(ambiguous.ready, false)
assert.ok(ambiguous.blockers.includes('source-binding:ambiguous'))

const unknownCandidate = buildHighEndAtlasRenderTransaction({
  ...baseRequest,
  candidates: [...baseRequest.candidates, {
    nodeId: 'nonexistent-structure', projectedRadiusPx: 10, clinicalWeight: 1, visible: true,
    selected: false, interacting: false, predictedNext: false,
  }],
})
assert.equal(unknownCandidate.ready, false)
assert.ok(unknownCandidate.blockers.includes('candidate:unknown-graph-node:nonexistent-structure'))

const deterministic = buildHighEndAtlasRenderTransaction({
  ...baseRequest,
  sourceBundles: [...baseRequest.sourceBundles].reverse(),
  manifest: [...manifest].reverse(),
  candidates: [...baseRequest.candidates].reverse(),
})
assert.deepEqual(deterministic, transaction)

console.log(`High-end atlas render transaction verified: ${transaction.bindings.bindings.length} exact mesh bindings, ${transaction.streamingPlan.residentNodes} budgeted resident nodes, immutable asset selection, and fail-closed verified-tier behavior.`)
