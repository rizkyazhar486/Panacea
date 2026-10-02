import assert from 'node:assert/strict'
import { MUSCULOSKELETAL_EC_COUPLING } from '../../src/lib/bodyExposure/musculoskeletalExcitationContraction.ts'

assert.equal(MUSCULOSKELETAL_EC_COUPLING.system, 'musculoskeletal')
assert.equal(MUSCULOSKELETAL_EC_COUPLING.educationalOnly, true)
assert.equal(MUSCULOSKELETAL_EC_COUPLING.patientSpecific, false)
assert.equal(MUSCULOSKELETAL_EC_COUPLING.humanReview.status, 'pending')
assert.deepEqual(
  MUSCULOSKELETAL_EC_COUPLING.steps.map((step) => step.id),
  ['membrane-depolarization', 'sr-calcium-release', 'troponin-binding', 'thin-filament-activation', 'calcium-reuptake'],
)
for (const step of MUSCULOSKELETAL_EC_COUPLING.steps) {
  assert.ok(step.anatomyAnchors.length > 0)
  assert.ok(step.evidencePmids.length > 0)
}
assert.ok(MUSCULOSKELETAL_EC_COUPLING.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url)))
assert.ok(MUSCULOSKELETAL_EC_COUPLING.boundaries.some((item) => item.includes('No patient-specific')))
assert.ok(MUSCULOSKELETAL_EC_COUPLING.boundaries.some((item) => item.includes('not clinical validation')))

console.log('body musculoskeletal excitation-contraction coupling contract: ok')
