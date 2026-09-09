import assert from 'node:assert/strict'
import {
  EYE_CELLULAR_WAVE4,
  EYE_WAVE4_REQUIRED_IDS,
  EYE_WAVE4_SCIENTIFIC_BOUNDARY,
  validateEyeCellularWave4,
} from '../../src/lib/anatomy/eyeCellularWave4.ts'

assert.deepEqual(validateEyeCellularWave4(), [])
assert.ok(EYE_CELLULAR_WAVE4.length >= 20, 'Eye Wave 4 must be a substantive cellular/organelle hierarchy.')

const byId = new Map(EYE_CELLULAR_WAVE4.map((item) => [item.id, item]))
for (const id of EYE_WAVE4_REQUIRED_IDS) assert.ok(byId.has(id), `missing required Eye Wave 4 node: ${id}`)

for (const item of EYE_CELLULAR_WAVE4) {
  assert.equal(item.geometryStatus, 'reference-only', `${item.id} must remain reference-only`)
  assert.equal(item.reviewStatus, 'academic-review-pending', `${item.id} must remain review-pending`)
  assert.equal(item.representationPolicy, 'cellular-reference-only', `${item.id} must not become synthetic ultrastructure`)
  assert.equal(item.selectable, true, `${item.id} must remain addressable in the educational hierarchy`)
}

for (const prefix of ['rod', 'cone']) {
  assert.equal(byId.get(`${prefix}-inner-segment-mitochondria`)?.parentId, `${prefix}-inner-segment`)
  assert.equal(byId.get(`${prefix}-inner-segment-ribosomes`)?.parentId, `${prefix}-inner-segment`)
  assert.equal(byId.get(`${prefix}-inner-segment-golgi`)?.parentId, `${prefix}-inner-segment`)
  assert.equal(byId.get(`${prefix}-transport-vesicles`)?.parentId, `${prefix}-inner-segment`)
  assert.equal(byId.get(`${prefix}-outer-segment-discs`)?.parentId, `${prefix}-outer-segment`)
}

assert.equal(byId.get('rod-synaptic-vesicles')?.parentId, 'rod-spherule')
assert.equal(byId.get('rod-synaptic-ribbon')?.parentId, 'rod-spherule')
assert.equal(byId.get('cone-synaptic-vesicles')?.parentId, 'cone-pedicle')
assert.equal(byId.get('cone-synaptic-ribbon')?.parentId, 'cone-pedicle')
assert.equal(byId.get('rpe-apical-melanosomes')?.parentId, 'retinal-pigment-epithelium')
assert.equal(byId.get('rpe-phagosomes')?.parentId, 'retinal-pigment-epithelium')
assert.equal(byId.get('rpe-phagolysosomal-compartment')?.parentId, 'rpe-phagosomes')

for (const forbiddenClaim of [
  'organelle counts',
  'dimensions',
  'coordinates',
  'membrane kinetics',
  'molecular interactions',
  'disease state',
  'patient-specific ultrastructure',
  'synthetic electron microscopy',
]) {
  assert.ok(EYE_WAVE4_SCIENTIFIC_BOUNDARY.includes(forbiddenClaim), `scientific boundary missing: ${forbiddenClaim}`)
}

const serialized = JSON.stringify(EYE_CELLULAR_WAVE4).toLowerCase()
for (const molecularScope of ['rhodopsin', 'opsin', 'transducin', 'retinal gene', 'dna sequence', 'mutation target']) {
  assert.equal(serialized.includes(molecularScope), false, `Wave 4 leaked molecular/pathway scope: ${molecularScope}`)
}

const invalid = EYE_CELLULAR_WAVE4.map((item) => ({ ...item }))
invalid[0] = { ...invalid[0], representationPolicy: 'synthetic' as never }
assert.ok(validateEyeCellularWave4(invalid).includes(`representation:${invalid[0].id}`))

console.log(`eye-cellular-wave4: ok (${EYE_CELLULAR_WAVE4.length} cellular references; molecular scope deferred)`)
