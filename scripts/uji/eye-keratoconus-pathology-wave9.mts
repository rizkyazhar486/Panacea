import assert from 'node:assert/strict'
import {
  EYE_KERATOCONUS_PATHOLOGY_BOUNDARY,
  EYE_KERATOCONUS_PATHOLOGY_WAVE9,
  validateEyeKeratoconusPathologyWave9,
} from '../../src/lib/anatomy/eyeKeratoconusPathologyWave9.ts'

assert.deepEqual(validateEyeKeratoconusPathologyWave9(), [])
assert.equal(EYE_KERATOCONUS_PATHOLOGY_WAVE9.length, 3)

const byId = new Map(EYE_KERATOCONUS_PATHOLOGY_WAVE9.map((step) => [step.id, step]))
assert.deepEqual(byId.get('keratoconus-stromal-biomechanics')?.anatomicalTargets, [
  'corneal-stroma',
  'corneal-stromal-lamellae',
])
assert.deepEqual(byId.get('keratoconus-ectatic-protrusion')?.anatomicalTargets, [
  'cornea',
  'corneal-stroma',
])
assert.deepEqual(byId.get('keratoconus-bowman-disruption-context')?.anatomicalTargets, [
  'bowman-layer',
  'corneal-epithelium',
  'corneal-stroma',
])

for (const step of EYE_KERATOCONUS_PATHOLOGY_WAVE9) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.quantitativeInferenceAllowed, false)
  assert.equal(step.topographyDiagnosisAllowed, false)
  assert.equal(step.progressionPredictionAllowed, false)
  assert.equal(step.treatmentRecommendationAllowed, false)
  assert.ok(step.evidence.length > 0)
  assert.ok(step.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
}

assert.match(EYE_KERATOCONUS_PATHOLOGY_BOUNDARY, /Generic educational keratoconus pathology mapping only/)
assert.match(EYE_KERATOCONUS_PATHOLOGY_BOUNDARY, /Do not infer patient corneal curvature, thickness/)
assert.match(EYE_KERATOCONUS_PATHOLOGY_BOUNDARY, /cross-linking eligibility/)

console.log(`eye-keratoconus-pathology-wave9: ok (${EYE_KERATOCONUS_PATHOLOGY_WAVE9.length} bounded educational mechanisms)`)
