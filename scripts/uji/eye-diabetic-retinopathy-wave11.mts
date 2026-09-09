import assert from 'node:assert/strict'
import {
  EYE_DIABETIC_RETINOPATHY_BOUNDARY,
  EYE_DIABETIC_RETINOPATHY_WAVE11,
  validateEyeDiabeticRetinopathyWave11,
} from '../../src/lib/anatomy/eyeDiabeticRetinopathyWave11.ts'

assert.deepEqual(validateEyeDiabeticRetinopathyWave11(), [])
assert.equal(EYE_DIABETIC_RETINOPATHY_WAVE11.length, 3)
for (const item of EYE_DIABETIC_RETINOPATHY_WAVE11) {
  assert.equal(item.representation, 'educational-pathology-contract')
  assert.equal(item.reviewStatus, 'academic-review-pending')
  assert.equal(item.patientSpecific, false)
  assert.equal(item.clinicalInferenceAllowed, false)
  assert.equal(item.stagingAllowed, false)
  assert.equal(item.imagingInferenceAllowed, false)
  assert.equal(item.treatmentRecommendationAllowed, false)
  assert.ok(item.evidence.every((e) => /^PMID:\d+$/.test(e.locator)))
}
const unsafe = EYE_DIABETIC_RETINOPATHY_WAVE11.map((x) => ({ ...x }))
Object.assign(unsafe[0]!, { stagingAllowed: true })
assert.ok(validateEyeDiabeticRetinopathyWave11(unsafe as typeof EYE_DIABETIC_RETINOPATHY_WAVE11).includes('unsafe:retinal-microvascular-pericyte-capillary-injury'))
assert.match(EYE_DIABETIC_RETINOPATHY_BOUNDARY, /Do not diagnose or stage NPDR\/PDR/)
assert.match(EYE_DIABETIC_RETINOPATHY_BOUNDARY, /recommend laser\/intravitreal therapy/)
console.log(`eye-diabetic-retinopathy-wave11: ok (${EYE_DIABETIC_RETINOPATHY_WAVE11.length} bounded educational mechanisms)`)
