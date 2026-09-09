import assert from 'node:assert/strict'
import { WHOLE_BODY_ATLAS_GRAPH } from '../../src/lib/wholeBodyAtlasCore.ts'
import { bindAnatomyNodesToSourceSnapshot } from '../../src/lib/anatomy/sourceBinding.ts'
import {
  anatomyAssetCacheKey,
  isImmutableAnatomyRevision,
  validateAnatomyAssetManifest,
  type AnatomyAssetManifestEntry,
} from '../../src/lib/anatomy/assetManifest.ts'

const bindings = bindAnatomyNodesToSourceSnapshot(WHOLE_BODY_ATLAS_GRAPH.nodes, [
  { file: 'cardiovascular.glb', names: ['Heart', 'Aorta'] },
])

const heart: AnatomyAssetManifestEntry = {
  assetId: 'heart-overview-v1',
  graphNodeId: 'heart',
  targetId: 'heart',
  file: 'cardiovascular.glb',
  sourceNodeNames: ['Heart'],
  immutableRevision: 'sha256:heart-fixture-0001',
  format: 'glb',
  geometryCompression: 'meshopt',
  textureEncoding: 'ktx2',
  lod: 'overview',
  namedStructures: ['Heart'],
  sourceLicenseVerified: true,
  textureLicenseVerified: true,
  hasExplicitLeftRightOrientation: true,
  hasExplicitAnatomicalAxes: true,
  closeZoomApproved: false,
  estimatedGpuBytes: 2_000_000,
  estimatedDrawCalls: 3,
}

const aorta: AnatomyAssetManifestEntry = {
  ...heart,
  assetId: 'aorta-organ-v1',
  graphNodeId: 'aorta',
  targetId: 'aorta',
  sourceNodeNames: ['Aorta'],
  immutableRevision: 'sha256:aorta-fixture-0001',
  lod: 'organ',
  namedStructures: ['Aorta'],
  estimatedGpuBytes: 4_000_000,
  estimatedDrawCalls: 4,
}

const valid = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, bindings, [heart, aorta])
assert.equal(valid.valid, true, valid.errors.join('\n'))
assert.deepEqual(valid.referenceEligibleAssetIds, ['aorta-organ-v1', 'heart-overview-v1'])
assert.deepEqual(valid.verifiedEligibleAssetIds, [], 'Unreviewed fixture assets must never become verified render assets.')
assert.equal(anatomyAssetCacheKey(heart), 'heart-overview-v1@sha256:heart-fixture-0001:lod-overview')

for (const floating of ['latest', 'main', 'master', 'HEAD', 'current', 'production']) {
  assert.equal(isImmutableAnatomyRevision(floating), false)
}
assert.equal(isImmutableAnatomyRevision('sha256:abcdef1234567890'), true)

const floatingRevision = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, bindings, [
  { ...heart, immutableRevision: 'latest' },
])
assert.equal(floatingRevision.valid, false)
assert.ok(floatingRevision.errors.some((error) => error.includes('immutable')))

const wrongGraphIdentity = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, bindings, [
  { ...heart, targetId: 'aorta' },
])
assert.equal(wrongGraphIdentity.valid, false)
assert.ok(wrongGraphIdentity.errors.some((error) => error.includes('targetId must equal graphNodeId')))

const wrongSourceNode = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, bindings, [
  { ...heart, sourceNodeNames: ['Heartburn'] },
])
assert.equal(wrongSourceNode.valid, false)
assert.ok(wrongSourceNode.errors.some((error) => error.includes('not exactly bound')))

const duplicateLod = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, bindings, [
  heart,
  { ...heart, assetId: 'heart-overview-v2', immutableRevision: 'sha256:heart-fixture-0002' },
])
assert.equal(duplicateLod.valid, false)
assert.ok(duplicateLod.errors.some((error) => error.includes('more than one manifest asset')))

const ambiguousBindings = bindAnatomyNodesToSourceSnapshot([
  { id: 'a', label: 'A', aliases: ['shared'], sourceNodeAliases: [] },
  { id: 'b', label: 'B', aliases: ['shared'], sourceNodeAliases: [] },
], [{ file: 'fixture.glb', names: ['shared'] }])
const ambiguityResult = validateAnatomyAssetManifest(WHOLE_BODY_ATLAS_GRAPH, ambiguousBindings, [])
assert.equal(ambiguityResult.valid, false)
assert.ok(ambiguityResult.errors.some((error) => error.includes('Ambiguous source binding')))

console.log('Anatomy asset manifest verified: immutable revisions, exact mesh binding, graph identity, unique node/LOD slots, and fail-closed verified-render eligibility.')
