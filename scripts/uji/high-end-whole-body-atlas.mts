import assert from 'node:assert/strict'
import { AtlasGraph, validateAtlasNodes } from '../../src/lib/anatomy/atlasGraph.ts'
import {
  PANACEA_ANATOMY_ATLAS,
  PANACEA_ATLAS_NODES,
  missingAtlasSystems,
  resolveAtlasSourceCoverage,
  summarizeAtlasCoverage,
} from '../../src/lib/anatomy/atlasRegistry.ts'
import { AtlasSpatialIndex } from '../../src/lib/anatomy/spatialIndex.ts'
import {
  buildAtlasLoadPlan,
  chooseAtlasLod,
  projectedPixelDiameter,
} from '../../src/lib/anatomy/atlasStreaming.ts'
import type {
  AnatomyAssetDescriptor,
  AnatomyAtlasNode,
  AnatomyProvenance,
} from '../../src/lib/anatomy/atlasTypes.ts'

const validation = validateAtlasNodes(PANACEA_ATLAS_NODES)
assert.equal(validation.valid, true, validation.errors.join('\n'))
assert.deepEqual(missingAtlasSystems(), [])

const summary = summarizeAtlasCoverage()
assert.ok(summary.totalNodes >= 80, `Expected a broad whole-body graph, received ${summary.totalNodes} nodes.`)
assert.equal(summary.systemsRepresented, 16)
assert.equal(summary.regionCount, 8)
assert.ok(summary.scaleCounts.micro >= 5)
assert.equal(summary.anatomistReviewedNodes, 0, 'Draft registry must not fabricate anatomist review.')
assert.equal(summary.structuralDraftNodes, summary.totalNodes)

const heart = PANACEA_ANATOMY_ATLAS.resolve('heart')
assert.equal(heart.status, 'resolved')
if (heart.status === 'resolved') assert.equal(heart.node.id, 'cardiovascular-heart')

const bladder = PANACEA_ANATOMY_ATLAS.resolve('bladder', { system: 'urinary' })
assert.equal(bladder.status, 'resolved')
if (bladder.status === 'resolved') assert.equal(bladder.node.id, 'urinary-bladder')

const alveolarInterfaceAncestors = PANACEA_ANATOMY_ATLAS
  .ancestorsOf('resp-alveolar-capillary-interface')
  .map((node) => node.id)
assert.deepEqual(alveolarInterfaceAncestors.slice(0, 3), [
  'resp-alveolar-layer',
  'resp-gas-exchange-zone',
  'system-respiratory',
])
assert.ok(PANACEA_ANATOMY_ATLAS.descendantsOf('system-respiratory').length >= 20)

const sourceCoverage = resolveAtlasSourceCoverage('resp-right-lung', [{
  file: 'visceral.glb',
  names: ['Heart', 'Left Lung', 'Right_Lung', 'Trachea'],
}])
assert.equal(sourceCoverage.length, 1)
assert.equal(sourceCoverage[0].coverageRatio, 0.5)
assert.deepEqual(sourceCoverage[0].unresolvedHints, ['lung right'])
assert.equal(sourceCoverage[0].bindingStatus, 'candidate', 'Catalogue presence must never auto-promote verification.')
assert.ok(sourceCoverage[0].matchedNames.includes('Right_Lung'))

const draftProvenance: AnatomyProvenance = {
  sourceId: 'test-fixture',
  sourceVersion: 'fixture-v1',
  sourceLocator: 'fixture://atlas',
  evidenceKind: 'internal-structural',
  academicReview: 'pending',
  modelAssetReview: 'pending',
}

const fixtureNode = (id: string, canonicalName: string): AnatomyAtlasNode => ({
  id,
  canonicalName,
  synonyms: ['shared alias'],
  system: 'skeletal',
  regions: ['whole-body'],
  laterality: 'not-applicable',
  scale: 'regional',
  sourceBindings: [],
  provenance: [draftProvenance],
  reviewStatus: 'structural-draft',
  educationalOnly: true,
})
const ambiguousGraph = new AtlasGraph([
  fixtureNode('fixture-a', 'Fixture A'),
  fixtureNode('fixture-b', 'Fixture B'),
])
const ambiguous = ambiguousGraph.resolve('shared alias')
assert.equal(ambiguous.status, 'ambiguous')
if (ambiguous.status === 'ambiguous') assert.deepEqual(ambiguous.candidates.map((node) => node.id), ['fixture-a', 'fixture-b'])
assert.equal(ambiguousGraph.resolve('shared').status, 'unresolved', 'Atlas lookup must not fuzzy-pick partial labels.')

const heartNode = PANACEA_ANATOMY_ATLAS.get('cardiovascular-heart')!
const rightLungNode = PANACEA_ANATOMY_ATLAS.get('resp-right-lung')!
const spatial = new AtlasSpatialIndex([
  { ...heartNode, spatialBounds: { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } } },
  { ...rightLungNode, spatialBounds: { min: { x: 3, y: -1, z: -1 }, max: { x: 5, y: 1, z: 1 } } },
])
assert.equal(spatial.size, 2)
assert.equal(spatial.nearest({ x: 0, y: 0, z: 0 })?.node.id, 'cardiovascular-heart')
assert.equal(spatial.nearest({ x: 4, y: 0, z: 0 }, { system: 'respiratory' })?.node.id, 'resp-right-lung')
assert.deepEqual(spatial.containing({ x: 4, y: 0, z: 0 }).map((node) => node.id), ['resp-right-lung'])

const assetA: AnatomyAssetDescriptor = {
  id: 'fixture-heart-asset',
  nodeId: 'cardiovascular-heart',
  system: 'cardiovascular',
  regions: ['thorax'],
  diameterWorldUnits: 2,
  compression: 'meshopt',
  provenance: draftProvenance,
  lods: [
    { level: 0, resourceKey: 'heart-lod0', minProjectedPixels: 0, estimatedGpuBytes: 1_000_000 },
    { level: 1, resourceKey: 'heart-lod1', minProjectedPixels: 100, estimatedGpuBytes: 2_000_000 },
    { level: 2, resourceKey: 'heart-lod2', minProjectedPixels: 300, estimatedGpuBytes: 4_000_000 },
    { level: 3, resourceKey: 'heart-lod3', minProjectedPixels: 700, estimatedGpuBytes: 7_000_000 },
  ],
}
const assetB: AnatomyAssetDescriptor = {
  ...assetA,
  id: 'fixture-lung-asset',
  nodeId: 'resp-right-lung',
  system: 'respiratory',
  diameterWorldUnits: 1.5,
  lods: [
    { level: 0, resourceKey: 'lung-lod0', minProjectedPixels: 0, estimatedGpuBytes: 1_000_000 },
    { level: 1, resourceKey: 'lung-lod1', minProjectedPixels: 100, estimatedGpuBytes: 2_000_000 },
    { level: 2, resourceKey: 'lung-lod2', minProjectedPixels: 300, estimatedGpuBytes: 3_000_000 },
  ],
}

const farCamera = { distanceToTarget: 20, verticalFovRadians: Math.PI / 3, viewportHeightPx: 844 }
const nearCamera = { distanceToTarget: 2, verticalFovRadians: Math.PI / 3, viewportHeightPx: 844 }
const farPixels = projectedPixelDiameter(assetA.diameterWorldUnits, farCamera)
const nearPixels = projectedPixelDiameter(assetA.diameterWorldUnits, nearCamera)
assert.ok(nearPixels > farPixels)
assert.ok(chooseAtlasLod(assetA, nearPixels).level >= chooseAtlasLod(assetA, farPixels).level)

const plan = buildAtlasLoadPlan([assetA, assetB], nearCamera, {
  selectedNodeIds: new Set(['cardiovascular-heart']),
  visibleNodeIds: new Set(['cardiovascular-heart', 'resp-right-lung']),
  focusRegions: new Set(['thorax']),
  residentResourceKeys: new Set(['lung-lod2']),
  gpuBudgetBytes: 8_000_000,
})
assert.ok(plan.estimatedResidentBytes <= plan.budgetBytes)
assert.ok([...plan.load, ...plan.retain].some((decision) => decision.nodeId === 'cardiovascular-heart'))
assert.ok(plan.evict.includes('lung-lod2') || plan.retain.some((decision) => decision.resourceKey === 'lung-lod2'))

console.log(
  `High-end whole-body atlas: ${summary.totalNodes} semantic nodes across ${summary.systemsRepresented} systems; graph, respiratory deep-zoom, fail-closed source coverage, spatial index, LOD monotonicity, and GPU-budget scheduling verified.`,
)
