import assert from 'node:assert/strict'
import {
  EYE_STRUCTURAL_WAVE2,
  EYE_WAVE2_REQUIRED_IDS,
  EYE_WAVE2_SCIENTIFIC_BOUNDARY,
  validateEyeStructuralWave2,
} from '../../src/lib/anatomy/eyeStructuralWave2.ts'

assert.deepEqual(validateEyeStructuralWave2(), [])
assert.ok(EYE_STRUCTURAL_WAVE2.length >= 35, 'Eye Wave 2 must cover the structural layer stack, not a token subset.')

const byId = new Map(EYE_STRUCTURAL_WAVE2.map((item) => [item.id, item]))
for (const id of EYE_WAVE2_REQUIRED_IDS) assert.ok(byId.has(id), `missing required Eye Wave 2 structure: ${id}`)

const cornealOrder = [
  'corneal-epithelium',
  'bowman-layer',
  'corneal-stroma',
  'descemet-membrane',
  'corneal-endothelium',
]
assert.deepEqual(
  EYE_STRUCTURAL_WAVE2.filter((item) => item.domain === 'cornea').map((item) => item.id),
  cornealOrder,
  'Cornea must retain the traditional five-layer structural sequence in Wave 2.',
)

for (const item of EYE_STRUCTURAL_WAVE2) {
  assert.equal(item.geometryStatus, 'reference-only', `${item.id} must remain reference-only until exact geometry is proven`)
  assert.equal(item.reviewStatus, 'academic-review-pending', `${item.id} must remain review-pending`)
  assert.equal(item.representationPolicy, 'reference-overlay-only', `${item.id} must not silently become synthetic geometry`)
  assert.equal(item.selectable, true, `${item.id} must be addressable in the educational hierarchy`)
}

assert.equal(byId.get('ciliary-processes')?.parentId, 'pars-plicata')
assert.equal(byId.get('pigmented-ciliary-epithelium')?.parentId, 'ciliary-processes')
assert.equal(byId.get('nonpigmented-ciliary-epithelium')?.parentId, 'ciliary-processes')
assert.equal(byId.get('schlemm-canal')?.parentId, 'trabecular-meshwork')
assert.equal(byId.get('collector-channels')?.parentId, 'schlemm-canal')
assert.match(byId.get('trabecular-meshwork')?.evidenceAnchor ?? '', /^MESH:/)
assert.match(byId.get('schlemm-canal')?.evidenceAnchor ?? '', /^MESH:/)

for (const id of [
  'uveal-trabecular-meshwork',
  'corneoscleral-trabecular-meshwork',
  'juxtacanalicular-tissue',
]) {
  assert.equal(byId.get(id)?.parentId, 'trabecular-meshwork', `${id} must remain nested under trabecular meshwork`)
}

assert.match(EYE_WAVE2_SCIENTIFIC_BOUNDARY, /Do not fabricate layer thickness/)
assert.match(EYE_WAVE2_SCIENTIFIC_BOUNDARY, /3D coordinates/)
assert.match(EYE_WAVE2_SCIENTIFIC_BOUNDARY, /gonioscopic angles/)
assert.match(EYE_WAVE2_SCIENTIFIC_BOUNDARY, /patient morphology/)
assert.match(EYE_WAVE2_SCIENTIFIC_BOUNDARY, /surgical safe zones/)

const invalid = EYE_STRUCTURAL_WAVE2.map((item) => ({ ...item }))
invalid[0] = { ...invalid[0], geometryStatus: 'source-geometry-required' as never }
assert.ok(validateEyeStructuralWave2(invalid).includes(`geometry:${invalid[0].id}`))

console.log(`eye-structural-wave2: ok (${EYE_STRUCTURAL_WAVE2.length} structural reference nodes; no synthetic geometry)`)
