import assert from 'node:assert/strict'
import {
  EYE_UVEITIS_ANATOMY_BOUNDARY,
  EYE_UVEITIS_ANATOMY_WAVE12,
  validateEyeUveitisAnatomyWave12,
} from '../../src/lib/anatomy/eyeUveitisAnatomyWave12.ts'

assert.deepEqual(validateEyeUveitisAnatomyWave12(), [])
assert.equal(EYE_UVEITIS_ANATOMY_WAVE12.length, 3)

const byContext = new Map(EYE_UVEITIS_ANATOMY_WAVE12.map((record) => [record.context, record]))
assert.equal(byContext.get('anterior')?.primaryInflammationSite, 'anterior-chamber')
assert.deepEqual(byContext.get('anterior')?.anatomicalTargets, ['anterior-chamber', 'iris', 'ciliary-body'])
assert.equal(byContext.get('intermediate')?.primaryInflammationSite, 'vitreous-body')
assert.deepEqual(byContext.get('intermediate')?.anatomicalTargets, ['vitreous-body', 'pars-plana'])
assert.equal(byContext.get('posterior')?.primaryInflammationSite, 'retina')
assert.deepEqual(byContext.get('posterior')?.anatomicalTargets, ['retina', 'choroid'])

for (const record of EYE_UVEITIS_ANATOMY_WAVE12) {
  assert.equal(record.representation, 'educational-pathology-contract')
  assert.equal(record.reviewStatus, 'academic-review-pending')
  assert.equal(record.patientSpecific, false)
  assert.equal(record.classificationAllowed, false)
  assert.equal(record.etiologyInferenceAllowed, false)
  assert.equal(record.activityOrGradingAllowed, false)
  assert.equal(record.imagingInferenceAllowed, false)
  assert.equal(record.prognosisAllowed, false)
  assert.equal(record.diagnosisOrTreatmentAllowed, false)
  assert.ok(record.evidence.every((item) => /^PMID:\d+$/.test(item.locator)))
}

const unsafe = EYE_UVEITIS_ANATOMY_WAVE12.map((record) => ({ ...record }))
Object.assign(unsafe[0]!, { classificationAllowed: true })
assert.ok(
  validateEyeUveitisAnatomyWave12(unsafe as typeof EYE_UVEITIS_ANATOMY_WAVE12)
    .includes('unsafe:uveitis-anterior-anatomical-context'),
)

const invalidTarget = EYE_UVEITIS_ANATOMY_WAVE12.map((record) => ({
  ...record,
  anatomicalTargets: [...record.anatomicalTargets],
}))
invalidTarget[2]!.anatomicalTargets = ['synthetic-choroidal-lesion']
assert.ok(
  validateEyeUveitisAnatomyWave12(invalidTarget as typeof EYE_UVEITIS_ANATOMY_WAVE12)
    .includes('target:uveitis-posterior-anatomical-context'),
)

const invalidPrimarySite = EYE_UVEITIS_ANATOMY_WAVE12.map((record) => ({ ...record }))
Object.assign(invalidPrimarySite[1]!, { primaryInflammationSite: 'pars-plana' })
assert.ok(
  validateEyeUveitisAnatomyWave12(invalidPrimarySite as typeof EYE_UVEITIS_ANATOMY_WAVE12)
    .includes('primary-site:uveitis-intermediate-anatomical-context'),
)

assert.match(EYE_UVEITIS_ANATOMY_BOUNDARY, /Do not infer uveitis presence/)
assert.match(EYE_UVEITIS_ANATOMY_BOUNDARY, /infectious or noninfectious cause/)
assert.match(EYE_UVEITIS_ANATOMY_BOUNDARY, /diagnosis, urgency, or treatment/)

console.log(`eye-uveitis-anatomy-wave12: ok (${EYE_UVEITIS_ANATOMY_WAVE12.length} bounded anatomical contexts)`)
