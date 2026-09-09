import assert from 'node:assert/strict'
import {
  EYE_CATARACT_PATHOLOGY_BOUNDARY,
  EYE_CATARACT_PATHOLOGY_WAVE8,
  validateEyeCataractPathologyWave8,
} from '../../src/lib/anatomy/eyeCataractPathologyWave8.ts'

assert.deepEqual(validateEyeCataractPathologyWave8(), [])
assert.equal(EYE_CATARACT_PATHOLOGY_WAVE8.length, 3)

const byId = new Map(EYE_CATARACT_PATHOLOGY_WAVE8.map((step) => [step.id, step]))
assert.deepEqual(byId.get('age-related-lens-proteostasis')?.anatomicalTargets, ['lens-nucleus', 'lens-fibers'])
assert.deepEqual(byId.get('oxidative-cortical-lens-injury')?.anatomicalTargets, [
  'lens-anterior-epithelium', 'lens-cortex', 'lens-fibers',
])
assert.deepEqual(byId.get('posterior-subcapsular-cellular-disorganization')?.anatomicalTargets, [
  'lens-capsule', 'lens-fibers', 'lens-cortex',
])

for (const step of EYE_CATARACT_PATHOLOGY_WAVE8) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.clinicalInferenceAllowed, false)
  assert.equal(step.gradingAllowed, false)
  assert.equal(step.treatmentRecommendationAllowed, false)
  assert.ok(step.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
}

const unsafe = EYE_CATARACT_PATHOLOGY_WAVE8.map((step) => ({ ...step }))
Object.assign(unsafe[0]!, { clinicalInferenceAllowed: true })
assert.ok(validateEyeCataractPathologyWave8(unsafe as typeof EYE_CATARACT_PATHOLOGY_WAVE8).includes('unsafe:age-related-lens-proteostasis'))

assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /Do not infer a patient cataract subtype/)
assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /surgical indication/)
assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /treatment/)

console.log(`eye-cataract-pathology-wave8: ok (${EYE_CATARACT_PATHOLOGY_WAVE8.length} bounded educational mechanisms)`)
