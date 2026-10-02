import assert from 'node:assert/strict'
import {
  EYE_AMD_PATHOLOGY_BOUNDARY,
  EYE_AMD_PATHOLOGY_WAVE10,
  validateEyeAmdPathologyWave10,
} from '../../src/lib/anatomy/eyeAmdPathologyWave10.ts'

assert.deepEqual(validateEyeAmdPathologyWave10(), [])
assert.equal(EYE_AMD_PATHOLOGY_WAVE10.length, 3)

const byId = new Map(EYE_AMD_PATHOLOGY_WAVE10.map((step) => [step.id, step]))
assert.deepEqual(byId.get('amd-drusen-rpe-bruch-complex')?.anatomicalTargets, [
  'macula', 'retinal-pigment-epithelium', 'bruch-membrane',
])
assert.deepEqual(byId.get('amd-geographic-atrophy-rpe-photoreceptor-loss')?.anatomicalTargets, [
  'macula', 'fovea', 'retinal-pigment-epithelium', 'photoreceptor-layer',
])
assert.deepEqual(byId.get('amd-choroidal-neovascularization')?.anatomicalTargets, [
  'choroid', 'choriocapillaris', 'bruch-membrane', 'retinal-pigment-epithelium', 'macula',
])

for (const step of EYE_AMD_PATHOLOGY_WAVE10) {
  assert.equal(step.representation, 'educational-pathology-contract')
  assert.equal(step.reviewStatus, 'academic-review-pending')
  assert.equal(step.patientSpecific, false)
  assert.equal(step.clinicalInferenceAllowed, false)
  assert.equal(step.stagingAllowed, false)
  assert.equal(step.imagingInferenceAllowed, false)
  assert.equal(step.treatmentRecommendationAllowed, false)
  assert.ok(step.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
}

const unsafe = EYE_AMD_PATHOLOGY_WAVE10.map((step) => ({ ...step }))
Object.assign(unsafe[0]!, { imagingInferenceAllowed: true })
assert.ok(
  validateEyeAmdPathologyWave10(unsafe as typeof EYE_AMD_PATHOLOGY_WAVE10)
    .includes('unsafe:amd-drusen-rpe-bruch-complex'),
)

const invalidTarget = EYE_AMD_PATHOLOGY_WAVE10.map((step) => ({ ...step, anatomicalTargets: [...step.anatomicalTargets] }))
invalidTarget[1]!.anatomicalTargets = ['synthetic-oct-lesion']
assert.ok(
  validateEyeAmdPathologyWave10(invalidTarget as typeof EYE_AMD_PATHOLOGY_WAVE10)
    .includes('target:amd-geographic-atrophy-rpe-photoreceptor-loss'),
)

assert.match(EYE_AMD_PATHOLOGY_BOUNDARY, /Do not infer AMD presence/)
assert.match(EYE_AMD_PATHOLOGY_BOUNDARY, /anti-VEGF candidacy/)
assert.match(EYE_AMD_PATHOLOGY_BOUNDARY, /patient-specific lesion geometry/)

console.log(`eye-amd-pathology-wave10: ok (${EYE_AMD_PATHOLOGY_WAVE10.length} bounded educational mechanisms)`)
