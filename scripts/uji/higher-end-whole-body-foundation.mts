import assert from 'node:assert/strict'
import { validateAtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  HIGHER_END_WHOLE_BODY_NODES,
  HIGHER_END_WHOLE_BODY_REGIONS,
  HIGHER_END_WHOLE_BODY_SCALES,
  HIGHER_END_WHOLE_BODY_SYSTEMS,
} from '../../src/lib/anatomy/higherEndWholeBodyAtlas.ts'

const expectedSystems = new Set([
  'surface', 'skeletal', 'articular', 'muscular', 'cardiovascular', 'lymphatic', 'nervous',
  'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive', 'sensory', 'fascial',
])
const expectedRegions = new Set([
  'whole-body', 'head', 'neck', 'thorax', 'abdomen', 'pelvis', 'back',
  'upper-limb', 'hand', 'lower-limb', 'foot',
])
const expectedScales = new Set(['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure'])

assert.equal(HIGHER_END_WHOLE_BODY_NODES.length, 70, 'Foundation must remain a substantial 14-system reference graph.')
assert.deepEqual(new Set(HIGHER_END_WHOLE_BODY_SYSTEMS), expectedSystems)
assert.deepEqual(new Set(HIGHER_END_WHOLE_BODY_REGIONS), expectedRegions)
assert.deepEqual(new Set(HIGHER_END_WHOLE_BODY_SCALES), expectedScales)
assert.ok(COMPLETE_WHOLE_BODY_ATLAS.revision.includes('higher-end-foundation'))

const ids = new Set<string>()
for (const node of HIGHER_END_WHOLE_BODY_NODES) {
  assert.ok(!ids.has(node.id), `Duplicate higher-end id: ${node.id}`)
  ids.add(node.id)
  assert.equal(node.geometryStatus, 'reference-only', `${node.id} must remain fail-closed.`)
  assert.equal(node.provenance.reviewStatus, 'academic-review-required', `${node.id} requires qualified review.`)
  assert.equal(node.surgicalLandmark, false, `${node.id} must not be published as an operative landmark.`)
  assert.ok(node.provenance.sourceRevision.length > 0)
  assert.ok(!['latest', 'main', 'master', 'head', 'current'].includes(node.provenance.sourceRevision.toLowerCase()))
  assert.ok(node.source.nodeHints.length > 0)
  assert.ok(node.parentId)
}

const canonicalIds = new Set(COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) => node.id))
for (const node of HIGHER_END_WHOLE_BODY_NODES) {
  assert.ok(canonicalIds.has(node.id), `${node.id} must be reachable from the canonical manifest.`)
  assert.ok(node.parentId && canonicalIds.has(node.parentId), `${node.id} parent must exist in canonical atlas.`)
}

assert.deepEqual(validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS), [])

const glomerulus = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((node) => node.id === 'he:glomerulus')
const nephron = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((node) => node.id === 'he:nephron')
assert.equal(glomerulus?.parentId, 'he:nephron')
assert.ok(nephron?.children?.includes('he:glomerulus'))

const photoreceptor = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((node) => node.id === 'he:retinal-photoreceptor-unit')
const retina = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((node) => node.id === 'he:retina')
const eye = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((node) => node.id === 'he:ocular-globe')
assert.equal(photoreceptor?.parentId, 'he:retina')
assert.equal(retina?.parentId, 'he:ocular-globe')
assert.ok(retina?.children?.includes('he:retinal-photoreceptor-unit'))
assert.ok(eye?.children?.includes('he:retina'))

for (const system of expectedSystems) {
  assert.ok(HIGHER_END_WHOLE_BODY_NODES.some((node) => node.system === system), `${system} must be represented.`)
}

console.log(JSON.stringify({
  higherEndNodes: HIGHER_END_WHOLE_BODY_NODES.length,
  canonicalNodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.length,
  systems: HIGHER_END_WHOLE_BODY_SYSTEMS.length,
  regions: HIGHER_END_WHOLE_BODY_REGIONS.length,
  scales: HIGHER_END_WHOLE_BODY_SCALES.length,
}, null, 2))
