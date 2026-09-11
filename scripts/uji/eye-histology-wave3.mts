import assert from 'node:assert/strict'
import {
  EYE_HISTOLOGY_WAVE3,
  EYE_WAVE3_REQUIRED_CELL_CLASSES,
  EYE_WAVE3_RETINAL_LAYER_ORDER,
  EYE_WAVE3_SCIENTIFIC_BOUNDARY,
  validateEyeHistologyWave3,
} from '../../src/lib/anatomy/eyeHistologyWave3.ts'

assert.deepEqual(validateEyeHistologyWave3(), [])
assert.ok(EYE_HISTOLOGY_WAVE3.length >= 30, 'Eye Wave 3 must be a substantive corneal/retinal histology hierarchy.')

const byId = new Map(EYE_HISTOLOGY_WAVE3.map((item) => [item.id, item]))
const retinalLayerOrder = EYE_HISTOLOGY_WAVE3
  .filter((item) => item.domain === 'retina' && item.kind === 'layer')
  .map((item) => item.id)
assert.deepEqual(retinalLayerOrder, [...EYE_WAVE3_RETINAL_LAYER_ORDER])

for (const id of EYE_WAVE3_REQUIRED_CELL_CLASSES) {
  assert.ok(byId.has(id), `missing required histology cell class: ${id}`)
}

for (const item of EYE_HISTOLOGY_WAVE3) {
  assert.equal(item.geometryStatus, 'reference-only', `${item.id} must remain reference-only`)
  assert.equal(item.reviewStatus, 'academic-review-pending', `${item.id} must remain academic-review-pending`)
  assert.equal(item.representationPolicy, 'histology-reference-only', `${item.id} must not become synthetic microscopy`)
  assert.equal(item.selectable, true, `${item.id} must remain addressable in the educational hierarchy`)
}

assert.equal(byId.get('corneal-superficial-epithelial-cells')?.parentId, 'corneal-epithelium')
assert.equal(byId.get('corneal-keratocytes')?.parentId, 'corneal-stroma')
assert.equal(byId.get('rod-photoreceptors')?.parentId, 'photoreceptor-layer')
assert.equal(byId.get('cone-photoreceptors')?.parentId, 'photoreceptor-layer')
assert.equal(byId.get('retinal-bipolar-cells')?.parentId, 'inner-nuclear-layer')
assert.equal(byId.get('retinal-horizontal-cells')?.parentId, 'inner-nuclear-layer')
assert.equal(byId.get('retinal-amacrine-cells')?.parentId, 'inner-nuclear-layer')
assert.equal(byId.get('retinal-ganglion-cells')?.parentId, 'ganglion-cell-layer')
assert.equal(byId.get('rod-spherule')?.parentId, 'rod-photoreceptors')
assert.equal(byId.get('cone-pedicle')?.parentId, 'cone-photoreceptors')

for (const forbiddenClaim of [
  'cell counts',
  'density',
  'layer thickness',
  'OCT segmentation',
  'microscopy coordinates',
  'pathology',
  'patient-specific morphology',
  'synthetic microscopic geometry',
]) {
  assert.ok(EYE_WAVE3_SCIENTIFIC_BOUNDARY.includes(forbiddenClaim), `scientific boundary missing: ${forbiddenClaim}`)
}

const invalid = EYE_HISTOLOGY_WAVE3.map((item) => ({ ...item }))
invalid[0] = { ...invalid[0], evidenceAnchor: '' }
assert.ok(validateEyeHistologyWave3(invalid).includes(`evidence:${invalid[0].id}`))

console.log(`eye-histology-wave3: ok (${EYE_HISTOLOGY_WAVE3.length} histology references; no synthetic microscopy)`)
