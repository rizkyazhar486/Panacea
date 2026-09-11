import assert from 'node:assert/strict'
import {
  EYE_CELL_ORGANELLE_WAVE4,
  EYE_WAVE4_REQUIRED_IDS,
  EYE_WAVE4_SCIENTIFIC_BOUNDARY,
  validateEyeCellOrganelleWave4,
} from '../../src/lib/anatomy/eyeCellOrganelleWave4.ts'

assert.deepEqual(validateEyeCellOrganelleWave4(), [])
assert.ok(EYE_CELL_ORGANELLE_WAVE4.length >= 31, 'Eye Wave 4 must be a substantive canonical cellular/organelle reference layer.')

const byId = new Map(EYE_CELL_ORGANELLE_WAVE4.map((item) => [item.id, item]))
for (const id of EYE_WAVE4_REQUIRED_IDS) assert.ok(byId.has(id), `missing required Wave 4 node: ${id}`)

assert.equal(byId.size, EYE_CELL_ORGANELLE_WAVE4.length, 'canonical Wave 4 must not contain duplicate IDs')

for (const item of EYE_CELL_ORGANELLE_WAVE4) {
  assert.equal(item.geometryStatus, 'reference-only', `${item.id} must remain reference-only`)
  assert.equal(item.reviewStatus, 'academic-review-pending', `${item.id} must remain academic-review-pending`)
  assert.equal(item.representationPolicy, 'cellular-reference-only', `${item.id} must never self-promote to synthetic cell geometry`)
  assert.equal(item.selectable, true, `${item.id} must remain addressable in the educational hierarchy`)
  assert.match(item.evidenceAnchor, /^(NCBI:NBK\d+|PMID:\d+)$/, `${item.id} must carry a bounded source identity`)
}

assert.equal(byId.get('rod-connecting-cilium')?.parentId, 'rod-photoreceptors')
assert.equal(byId.get('cone-connecting-cilium')?.parentId, 'cone-photoreceptors')
assert.equal(byId.get('rod-basal-body')?.parentId, 'rod-connecting-cilium')
assert.equal(byId.get('cone-basal-body')?.parentId, 'cone-connecting-cilium')
assert.equal(byId.get('rod-inner-segment-mitochondria')?.parentId, 'rod-inner-segment-ellipsoid')
assert.equal(byId.get('cone-inner-segment-mitochondria')?.parentId, 'cone-inner-segment-ellipsoid')
assert.equal(byId.get('rod-inner-segment-ribosomes')?.parentId, 'rod-inner-segment')
assert.equal(byId.get('cone-inner-segment-ribosomes')?.parentId, 'cone-inner-segment')
assert.equal(byId.get('rod-inner-segment-transport-vesicles')?.parentId, 'rod-inner-segment')
assert.equal(byId.get('cone-inner-segment-transport-vesicles')?.parentId, 'cone-inner-segment')
assert.equal(byId.get('rod-photoreceptor-nucleus')?.parentId, 'rod-photoreceptors')
assert.equal(byId.get('cone-photoreceptor-nucleus')?.parentId, 'cone-photoreceptors')
assert.equal(byId.get('rod-outer-segment-discs')?.parentId, 'rod-outer-segment')
assert.equal(byId.get('cone-outer-segment-discs')?.parentId, 'cone-outer-segment')
assert.equal(byId.get('rod-synaptic-vesicles')?.parentId, 'rod-spherule')
assert.equal(byId.get('cone-synaptic-vesicles')?.parentId, 'cone-pedicle')
assert.equal(byId.get('rod-synaptic-ribbon')?.parentId, 'rod-spherule')
assert.equal(byId.get('cone-synaptic-ribbon')?.parentId, 'cone-pedicle')
assert.equal(byId.get('rod-synaptic-ribbon')?.kind, 'synaptic-specialization')
assert.equal(byId.get('cone-synaptic-ribbon')?.kind, 'synaptic-specialization')
assert.equal(byId.get('rpe-melanosomes')?.parentId, 'retinal-pigment-epithelium')
assert.equal(byId.get('rpe-phagosomes')?.parentId, 'retinal-pigment-epithelium')
assert.equal(byId.get('rpe-phagosome-lysosomal-degradation-stage')?.parentId, 'rpe-phagosomes')
assert.equal(byId.get('rpe-lysosomes')?.parentId, 'retinal-pigment-epithelium')

assert.match(byId.get('rod-outer-segment-discs')?.notes ?? '', /not individually reconstructed measured discs/)
assert.match(byId.get('cone-outer-segment-discs')?.notes ?? '', /do not reuse rod disc topology/)
assert.match(byId.get('rod-synaptic-ribbon')?.notes ?? '', /do not infer ribbon count/)
assert.match(byId.get('cone-synaptic-vesicles')?.notes ?? '', /no vesicle count or release-rate inference/)
assert.match(byId.get('rpe-phagosome-lysosomal-degradation-stage')?.notes ?? '', /Do not present this as a measured phagolysosome geometry/)

for (const forbiddenClaim of [
  'dimensions',
  'organelle counts',
  'copy numbers',
  'concentrations',
  'microscopy coordinates',
  'vesicle or ribbon counts',
  'transport, degradation or release kinetics',
  'synaptic strength',
  'molecular interactions',
  'disease state',
  'patient-specific morphology',
  'synthetic cellular geometry',
  'molecular-function inference from visual motion',
]) {
  assert.ok(EYE_WAVE4_SCIENTIFIC_BOUNDARY.includes(forbiddenClaim), `scientific boundary missing: ${forbiddenClaim}`)
}

const invalidEvidence = EYE_CELL_ORGANELLE_WAVE4.map((item) => ({ ...item }))
invalidEvidence[0] = { ...invalidEvidence[0], evidenceAnchor: '' }
assert.ok(validateEyeCellOrganelleWave4(invalidEvidence).includes(`evidence:${invalidEvidence[0].id}`))

const invalidGeometry = EYE_CELL_ORGANELLE_WAVE4.map((item) => ({ ...item })) as any[]
invalidGeometry[0] = { ...invalidGeometry[0], geometryStatus: 'source-geometry-required' }
assert.ok(validateEyeCellOrganelleWave4(invalidGeometry).includes(`geometry:${invalidGeometry[0].id}`))

const duplicate = [...EYE_CELL_ORGANELLE_WAVE4, EYE_CELL_ORGANELLE_WAVE4[0]]
assert.ok(validateEyeCellOrganelleWave4(duplicate).some((error) => error.startsWith('duplicate:')))

console.log(`eye-cell-organelle-wave4: ok (${EYE_CELL_ORGANELLE_WAVE4.length} canonical cellular references; no parallel Wave 4 ontology)`)
