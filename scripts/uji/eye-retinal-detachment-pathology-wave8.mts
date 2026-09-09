import assert from 'node:assert/strict'
import {
  EYE_RETINAL_DETACHMENT_PATHOLOGY_BOUNDARY,
  EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8,
  validateEyeRetinalDetachmentPathologyWave8,
} from '../../src/lib/anatomy/eyeRetinalDetachmentPathologyWave8.ts'

assert.deepEqual(validateEyeRetinalDetachmentPathologyWave8(), [])
assert.equal(EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8.length, 3)
assert.deepEqual(EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8.map((step) => step.order), [1, 2, 3])

const byId = new Map(EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8.map((step) => [step.id, step]))
assert.deepEqual(byId.get('rrd-vitreoretinal-traction')?.anatomicalTargets, ['vitreous-body', 'retina'])
assert.deepEqual(byId.get('rrd-break-fluid-access')?.anatomicalTargets, ['retina', 'retinal-pigment-epithelium'])
assert.deepEqual(byId.get('rrd-rpe-clearance-limit')?.anatomicalTargets, ['retinal-pigment-epithelium', 'photoreceptor-layer'])

for (const step of EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.quantitativeInferenceAllowed, false)
  assert.equal(step.lesionLocalizationAllowed, false)
  assert.equal(step.diagnosisOrTreatmentAllowed, false)
  assert.ok(step.evidence.length > 0)
  assert.ok(step.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
}

assert.match(EYE_RETINAL_DETACHMENT_PATHOLOGY_BOUNDARY, /Do not infer a patient retinal break/)
assert.match(EYE_RETINAL_DETACHMENT_PATHOLOGY_BOUNDARY, /lesion location/)
assert.match(EYE_RETINAL_DETACHMENT_PATHOLOGY_BOUNDARY, /surgical plan/)

const unsafeFixture = EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8.map((step, index) =>
  index === 0 ? { ...step, diagnosisOrTreatmentAllowed: true as never } : step,
)
assert.ok(validateEyeRetinalDetachmentPathologyWave8(unsafeFixture).includes('unsafe:rrd-vitreoretinal-traction'))

console.log(`eye-retinal-detachment-pathology-wave8: ok (${EYE_RETINAL_DETACHMENT_PATHOLOGY_WAVE8.length} bounded mechanisms)`)
