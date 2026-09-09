import assert from 'node:assert/strict'
import {
  auditAtlasMeshBindingCollisions,
  compileAtlasMeshBindingReport,
  compileAtlasNodeMeshBinding,
} from '../../src/lib/anatomy/atlasMeshBindingCompiler.ts'
import { normalizeAtlasTerm, type BodyAtlasGraph, type BodyAtlasNode } from '../../src/lib/bodyAtlasGraph.ts'
import type { AtlasManifest, AtlasNode, AtlasSystemId } from '../../src/lib/anatomy/atlasKernel.ts'

function mesh(input: {
  id: string
  sourceName: string
  baseName: string
  sourceFile: string
  layer: BodyAtlasNode['layer']
  laterality: BodyAtlasNode['laterality']
  region: string
}): BodyAtlasNode {
  return {
    ...input,
    normalizedName: normalizeAtlasTerm(input.sourceName),
    normalizedBaseName: normalizeAtlasTerm(input.baseName),
    y: 0,
    radial: 0,
    triangles: 1_000,
    lodTier: 'micro',
  }
}

const meshes: readonly BodyAtlasNode[] = [
  mesh({ id: 'mesh:carotid:left', sourceName: 'Common carotid artery.L', baseName: 'Common carotid artery', sourceFile: 'cardiovascular.glb', layer: 'cardiovascular', laterality: 'kiri', region: 'leher' }),
  mesh({ id: 'mesh:carotid:right', sourceName: 'Common carotid artery.R', baseName: 'Common carotid artery', sourceFile: 'cardiovascular.glb', layer: 'cardiovascular', laterality: 'kanan', region: 'leher' }),
  mesh({ id: 'mesh:femoral:left', sourceName: 'Femoral artery.L', baseName: 'Femoral artery', sourceFile: 'cardiovascular.glb', layer: 'cardiovascular', laterality: 'kiri', region: 'paha' }),
  mesh({ id: 'mesh:patella:left', sourceName: 'Patella.L', baseName: 'Patella', sourceFile: 'skeletal.glb', layer: 'skeletal', laterality: 'kiri', region: 'tungkai' }),
  mesh({ id: 'mesh:tibia:left', sourceName: 'Tibia.L', baseName: 'Tibia', sourceFile: 'skeletal.glb', layer: 'skeletal', laterality: 'kiri', region: 'tungkai' }),
]

const emptyLayerCounts = {
  surface: 0,
  skeletal: 0,
  muscular: 0,
  cardiovascular: 0,
  nervous: 0,
  visceral: 0,
  lymphoid: 0,
} as const

const syntheticGraph: BodyAtlasGraph = {
  nodes: meshes,
  edges: [],
  nodeById: new Map(meshes.map((node) => [node.id, node] as const)),
  stats: {
    nodeCount: meshes.length,
    edgeCount: 0,
    totalTriangles: meshes.reduce((sum, node) => sum + node.triangles, 0),
    nodesByLayer: { ...emptyLayerCounts, skeletal: 2, cardiovascular: 3 },
    trianglesByLayer: { ...emptyLayerCounts, skeletal: 2_000, cardiovascular: 3_000 },
    nodesByLod: { micro: meshes.length, low: 0, medium: 0, high: 0, ultra: 0 },
    regions: ['leher', 'paha', 'tungkai'],
  },
}

const provenance = {
  sourceId: 'binding-compiler-test',
  sourceRevision: 'fixture-r1',
  license: 'test fixture',
  sourceLocator: 'scripts/uji/atlas-mesh-binding-compiler.mts',
  reviewStatus: 'engineering-reviewed' as const,
}

function atlasNode(input: {
  id: string
  label: string
  system: AtlasSystemId
  regions: AtlasNode['regions']
  laterality: AtlasNode['laterality']
  geometryStatus?: AtlasNode['geometryStatus']
  hints: readonly string[]
  mode?: AtlasNode['source']['mode']
  files?: readonly string[]
}): AtlasNode {
  return {
    id: input.id,
    label: input.label,
    system: input.system,
    regions: input.regions,
    laterality: input.laterality,
    scale: 'suborgan',
    source: { mode: input.mode ?? 'specific-fallback', nodeHints: input.hints, files: input.files },
    provenance,
    geometryStatus: input.geometryStatus ?? 'shipped',
    educationalPriority: 0.8,
  }
}

const leftCarotid = atlasNode({
  id: 'test:left-carotid',
  label: 'Left common carotid artery',
  system: 'cardiovascular',
  regions: ['neck'],
  laterality: 'left',
  hints: ['common carotid artery', 'artery'],
  files: ['cardiovascular.glb'],
})
const leftCarotidBinding = compileAtlasNodeMeshBinding(leftCarotid, syntheticGraph)
assert.equal(leftCarotidBinding.status, 'bound')
assert.deepEqual(leftCarotidBinding.selectedMeshNodeIds, ['mesh:carotid:left'])
assert.deepEqual(leftCarotidBinding.matchedHints, ['common carotid artery'])
assert.ok(leftCarotidBinding.candidates[0].reasons.includes('explicit-file-allowlist'))
assert.ok(leftCarotidBinding.candidates[0].reasons.includes('laterality-boundary'))
assert.ok(leftCarotidBinding.candidates[0].reasons.includes('region-boundary'))

const fallbackThresholdNode = atlasNode({
  id: 'test:left-carotid-threshold-fallback',
  label: 'Left common carotid artery',
  system: 'cardiovascular',
  regions: ['neck'],
  laterality: 'left',
  hints: ['artery', 'common carotid artery'],
  files: ['cardiovascular.glb'],
})
const fallbackThresholdBinding = compileAtlasNodeMeshBinding(fallbackThresholdNode, syntheticGraph, { minScore: 1_400 })
assert.equal(
  fallbackThresholdBinding.status,
  'bound',
  'a below-threshold earlier hint must not prevent a later reviewed hint from resolving the same node',
)
assert.deepEqual(fallbackThresholdBinding.matchedHints, ['common carotid artery'])
assert.deepEqual(fallbackThresholdBinding.selectedMeshNodeIds, ['mesh:carotid:left'])

const broadArtery = atlasNode({
  id: 'test:broad-artery',
  label: 'Artery',
  system: 'cardiovascular',
  regions: ['whole-body'],
  laterality: 'not-applicable',
  hints: ['artery'],
  files: ['cardiovascular.glb'],
})
const broadBinding = compileAtlasNodeMeshBinding(broadArtery, syntheticGraph)
assert.equal(broadBinding.status, 'ambiguous', 'generic artery must fail closed across distinct structural identities')
assert.deepEqual(broadBinding.selectedMeshNodeIds, [])
assert.ok(broadBinding.candidates.some((candidate) => candidate.meshNodeId === 'mesh:carotid:left'))
assert.ok(broadBinding.candidates.some((candidate) => candidate.meshNodeId === 'mesh:femoral:left'))

const leftKneeComposite = atlasNode({
  id: 'test:left-knee-composite',
  label: 'Left knee osseous anchors',
  system: 'articular',
  regions: ['lower-limb'],
  laterality: 'left',
  geometryStatus: 'partial',
  hints: ['patella', 'tibia'],
  mode: 'composite',
  files: ['skeletal.glb'],
})
const kneeBinding = compileAtlasNodeMeshBinding(leftKneeComposite, syntheticGraph)
assert.equal(kneeBinding.status, 'bound')
assert.deepEqual(new Set(kneeBinding.selectedMeshNodeIds), new Set(['mesh:patella:left', 'mesh:tibia:left']))
assert.deepEqual(kneeBinding.unresolvedHints, [])

const thresholdMiss = compileAtlasNodeMeshBinding(leftKneeComposite, syntheticGraph, { minScore: 2_000 })
assert.equal(
  thresholdMiss.status,
  'unresolved',
  'candidates below minScore are unresolved, not ambiguous when no structural competition exists',
)
assert.deepEqual(thresholdMiss.selectedMeshNodeIds, [])
assert.deepEqual(new Set(thresholdMiss.unresolvedHints), new Set(['patella', 'tibia']))

const cappedComposite = compileAtlasNodeMeshBinding(leftKneeComposite, syntheticGraph, { maxSelectedMeshes: 1 })
assert.equal(cappedComposite.status, 'partial', 'selection capacity must not silently promote a truncated composite to bound')
assert.equal(cappedComposite.selectedMeshNodeIds.length, 1)
assert.ok(cappedComposite.unresolvedHints.includes('tibia'))
assert.ok(cappedComposite.reasons.some((reason) => reason.includes('maxSelectedMeshes=1')))

const referenceOnly = atlasNode({
  id: 'test:reference-only-carotid',
  label: 'Reference-only carotid metadata',
  system: 'cardiovascular',
  regions: ['neck'],
  laterality: 'left',
  geometryStatus: 'reference-only',
  hints: ['common carotid artery'],
  files: ['cardiovascular.glb'],
})
const referenceBinding = compileAtlasNodeMeshBinding(referenceOnly, syntheticGraph)
assert.equal(referenceBinding.status, 'metadata-only')
assert.deepEqual(referenceBinding.selectedMeshNodeIds, [])
assert.deepEqual(referenceBinding.candidates, [], 'reference-only nodes must not opportunistically bind similarly named meshes')

const noWrongSide = atlasNode({
  id: 'test:right-carotid',
  label: 'Right common carotid artery',
  system: 'cardiovascular',
  regions: ['neck'],
  laterality: 'right',
  hints: ['common carotid artery'],
  files: ['cardiovascular.glb'],
})
const rightBinding = compileAtlasNodeMeshBinding(noWrongSide, syntheticGraph)
assert.equal(rightBinding.status, 'bound')
assert.deepEqual(rightBinding.selectedMeshNodeIds, ['mesh:carotid:right'])

const manifest: AtlasManifest = {
  id: 'binding-test-manifest',
  revision: 'fixture-r1',
  nodes: [leftCarotid, broadArtery, leftKneeComposite, referenceOnly, noWrongSide],
}
const report = compileAtlasMeshBindingReport(manifest, syntheticGraph)
assert.equal(report.totalNodeCount, 5)
assert.equal(report.geometryEligibleNodeCount, 4)
assert.equal(report.boundNodeCount, 3)
assert.equal(report.ambiguousNodeCount, 1)
assert.equal(report.metadataOnlyNodeCount, 1)
assert.equal(report.unresolvedNodeCount, 0)
assert.equal(report.bindingRate, 3 / 4)
assert.equal(report.ambiguityRate, 1 / 4)
assert.ok(report.warnings.some((warning) => warning.includes('not anatomical or diagnostic probabilities')))

const duplicateOwnerManifest: AtlasManifest = {
  id: 'collision-fixture',
  revision: 'fixture-r1',
  nodes: [leftCarotid, { ...leftCarotid, id: 'test:left-carotid-duplicate' }],
}
const collisionReport = compileAtlasMeshBindingReport(duplicateOwnerManifest, syntheticGraph)
const collisions = auditAtlasMeshBindingCollisions(collisionReport)
assert.equal(collisions.length, 1)
assert.equal(collisions[0].meshNodeId, 'mesh:carotid:left')
assert.deepEqual(collisions[0].atlasNodeIds, ['test:left-carotid', 'test:left-carotid-duplicate'])

console.log('Atlas mesh binding compiler: specificity fallback, exhaustive reviewed hints, laterality/region/file boundaries, composite binding, threshold semantics, selection-cap partial state, ambiguity fail-closed behavior, metadata-only gate, and collision audit verified.')
