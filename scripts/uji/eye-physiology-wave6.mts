import assert from 'node:assert/strict'
import {
  EYE_PHYSIOLOGY_WAVE6,
  EYE_PHYSIOLOGY_WAVE6_BOUNDARY,
  validateEyePhysiologyWave6,
} from '../../src/lib/anatomy/eyePhysiologyWave6.ts'

assert.deepEqual(validateEyePhysiologyWave6(), [])

const byTrack = (track: 'aqueous-flow' | 'accommodation' | 'pupillary-light-reflex') =>
  EYE_PHYSIOLOGY_WAVE6.filter((item) => item.track === track).sort((a, b) => a.order - b.order)

assert.deepEqual(byTrack('aqueous-flow').map((item) => item.anatomyAnchor), [
  'ciliary-processes',
  'posterior-chamber',
  'pupil',
  'anterior-chamber',
  'trabecular-meshwork',
  'schlemm-canal',
  'collector-channels',
  'aqueous-veins',
])

assert.deepEqual(byTrack('accommodation').map((item) => item.id), [
  'distance-ciliary-relaxed',
  'distance-zonules-tense',
  'distance-lens-flatter',
  'near-ciliary-contracts',
  'near-zonules-relax',
  'near-lens-rounder',
])
assert.deepEqual(byTrack('accommodation').map((item) => item.anatomyAnchor), [
  'ciliary-muscle', 'zonules', 'lens', 'ciliary-muscle', 'zonules', 'lens',
])

assert.deepEqual(byTrack('pupillary-light-reflex').map((item) => item.anatomyAnchor), [
  'retina',
  'optic-nerve',
  'pretectal-region',
  'edinger-westphal-nucleus',
  'oculomotor-nerve',
  'ciliary-ganglion',
  'iris-sphincter',
])

for (const item of EYE_PHYSIOLOGY_WAVE6) {
  assert.equal(item.representation, 'educational-pathway-only')
  assert.equal(item.reviewStatus, 'academic-review-pending')
  assert.equal(item.patientSpecific, false)
  assert.equal(item.quantitativeInferenceAllowed, false)
  assert.equal(item.diagnosisOrTreatmentAllowed, false)
  assert.equal(item.evidence.retrievedOn, '2026-09-09')
}

const brokenSequence = EYE_PHYSIOLOGY_WAVE6.map((item) => ({ ...item }))
const aqueousSecond = brokenSequence.find((item) => item.id === 'aqueous-posterior-chamber')
if (aqueousSecond) aqueousSecond.order = 9
assert.ok(validateEyePhysiologyWave6(brokenSequence).some((error) => error.startsWith('sequence:aqueous-flow:')))

const unsafe = EYE_PHYSIOLOGY_WAVE6.map((item) => ({ ...item }))
Object.assign(unsafe[0]!, { patientSpecific: true })
assert.ok(validateEyePhysiologyWave6(unsafe as typeof EYE_PHYSIOLOGY_WAVE6).some((error) => error === 'unsafe:aqueous-production'))

assert.match(EYE_PHYSIOLOGY_WAVE6_BOUNDARY, /Do not infer intraocular pressure/)
assert.match(EYE_PHYSIOLOGY_WAVE6_BOUNDARY, /patient-specific physiology/)

console.log(`eye-physiology-wave6: ok (${EYE_PHYSIOLOGY_WAVE6.length} ordered educational steps)`)
