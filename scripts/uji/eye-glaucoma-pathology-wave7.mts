import assert from 'node:assert/strict'
import {
  EYE_GLAUCOMA_PATHOLOGY_BOUNDARY,
  EYE_GLAUCOMA_PATHOLOGY_WAVE7,
  validateEyeGlaucomaPathologyWave7,
} from '../../src/lib/anatomy/eyeGlaucomaPathologyWave7.ts'

assert.deepEqual(validateEyeGlaucomaPathologyWave7(), [])
assert.equal(EYE_GLAUCOMA_PATHOLOGY_WAVE7.length, 3)

const byId = new Map(EYE_GLAUCOMA_PATHOLOGY_WAVE7.map((step) => [step.id, step]))
assert.deepEqual(byId.get('poag-outflow-resistance')?.anatomicalTargets, [
  'trabecular-meshwork', 'juxtacanalicular-tissue', 'schlemm-canal',
])
assert.deepEqual(byId.get('angle-closure-pupillary-block')?.anatomicalTargets, [
  'posterior-chamber', 'pupil', 'iris', 'anterior-chamber', 'trabecular-meshwork',
])
assert.equal(byId.get('poag-optic-nerve-head-stress')?.order, 2)

for (const step of EYE_GLAUCOMA_PATHOLOGY_WAVE7) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.clinicalInferenceAllowed, false)
  assert.ok(step.evidence.every((item) => item.locator.startsWith('PMID:')))
}

assert.match(EYE_GLAUCOMA_PATHOLOGY_BOUNDARY, /Generic educational pathology mapping only/)
assert.match(EYE_GLAUCOMA_PATHOLOGY_BOUNDARY, /never be promoted to patient-specific clinical inference/)

console.log(`eye-glaucoma-pathology-wave7: ok (${EYE_GLAUCOMA_PATHOLOGY_WAVE7.length} bounded educational mechanisms)`)
