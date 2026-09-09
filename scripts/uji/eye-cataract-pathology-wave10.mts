import assert from 'node:assert/strict'
import {
  EYE_CATARACT_PATHOLOGY_BOUNDARY,
  EYE_CATARACT_PATHOLOGY_WAVE10,
  validateEyeCataractPathologyWave10,
} from '../../src/lib/anatomy/eyeCataractPathologyWave10.ts'

assert.deepEqual(validateEyeCataractPathologyWave10(), [])
assert.equal(EYE_CATARACT_PATHOLOGY_WAVE10.length, 3)

const byId = new Map(EYE_CATARACT_PATHOLOGY_WAVE10.map((step) => [step.id, step]))
assert.deepEqual(byId.get('cataract-crystallin-aggregation-context')?.anatomicalTargets, [
  'lens', 'lens-fibers',
])
assert.deepEqual(byId.get('cataract-lens-opacity-context')?.anatomicalTargets, [
  'lens', 'lens-nucleus', 'lens-cortex', 'lens-fibers',
])
assert.deepEqual(byId.get('cataract-lens-epithelium-oxidative-context')?.anatomicalTargets, [
  'lens-anterior-epithelium', 'lens-capsule', 'lens',
])

for (const step of EYE_CATARACT_PATHOLOGY_WAVE10) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.quantitativeInferenceAllowed, false)
  assert.equal(step.opacityClassificationAllowed, false)
  assert.equal(step.visualFunctionInferenceAllowed, false)
  assert.equal(step.progressionPredictionAllowed, false)
  assert.equal(step.diagnosisOrTreatmentAllowed, false)
  assert.ok(step.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
  assert.ok(step.evidence.every((item) => item.retrievedOn === '2026-09-10'))
}

assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /Generic educational cataract pathology mapping only/)
assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /Do not infer a patient opacity subtype/)
assert.match(EYE_CATARACT_PATHOLOGY_BOUNDARY, /surgical indication/)

console.log(`eye-cataract-pathology-wave10: ok (${EYE_CATARACT_PATHOLOGY_WAVE10.length} bounded educational contexts)`)
