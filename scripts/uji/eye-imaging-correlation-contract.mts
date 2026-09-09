import assert from 'node:assert/strict'
import {
  evaluateEyeImagingCorrelation,
  type EyeImagingReference,
} from '../../src/lib/anatomy/eyeImagingCorrelationContract.ts'

const reviewedReference: EyeImagingReference = {
  id: 'eye-oct-reference-test',
  modality: 'oct',
  coordinateSpace: 'atlas-reference',
  registrationStatus: 'validated-registration',
  provenance: {
    sourceId: 'test-source',
    sourceRevision: 'rev-2026-09-09',
    sourceLocator: 'test://eye/oct/reference',
    license: 'test-license',
    reviewStatus: 'academic-reviewed',
  },
  patientSpecific: false,
  synthetic: false,
  atlasNodeIds: ['organ:eye', 'retina'],
}

const eligible = evaluateEyeImagingCorrelation([reviewedReference], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(eligible.status, 'eligible-reference-correlation')
assert.deepEqual(eligible.blockers, [])
assert.equal(eligible.mayPerformPatientLocalization, false)
assert.equal(eligible.mayGenerateSyntheticAnatomy, false)
assert.equal(eligible.mayPromoteAcademicReview, false)

const unregistered = evaluateEyeImagingCorrelation([
  { ...reviewedReference, registrationStatus: 'reference-aligned' },
], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(unregistered.status, 'blocked')
assert.ok(unregistered.blockers.some((item) => item.code === 'registration-not-validated'))

const patientSpecific = evaluateEyeImagingCorrelation([
  { ...reviewedReference, patientSpecific: true },
], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(patientSpecific.status, 'blocked')
assert.ok(patientSpecific.blockers.some((item) => item.code === 'patient-specific-reference'))

const patientLocalization = evaluateEyeImagingCorrelation([reviewedReference], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'patient-localization',
})
assert.equal(patientLocalization.status, 'blocked')
assert.ok(patientLocalization.blockers.some((item) => item.code === 'patient-localization-disabled'))

const synthetic = evaluateEyeImagingCorrelation([
  { ...reviewedReference, synthetic: true },
], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(synthetic.status, 'blocked')
assert.ok(synthetic.blockers.some((item) => item.code === 'synthetic-reference'))

const pendingReview = evaluateEyeImagingCorrelation([
  {
    ...reviewedReference,
    provenance: { ...reviewedReference.provenance, reviewStatus: 'academic-review-pending' },
  },
], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(pendingReview.status, 'blocked')
assert.ok(pendingReview.blockers.some((item) => item.code === 'academic-review-incomplete'))

const unpinned = evaluateEyeImagingCorrelation([
  {
    ...reviewedReference,
    provenance: { ...reviewedReference.provenance, sourceRevision: 'latest' },
  },
], {
  imagingReferenceId: reviewedReference.id,
  targetAtlasNodeId: 'retina',
  requestedMode: 'educational-reference',
})
assert.equal(unpinned.status, 'blocked')
assert.ok(unpinned.blockers.some((item) => item.code === 'invalid-provenance'))

console.log('eye-imaging-correlation-contract: ok (registration, provenance, review, synthetic and patient-localization guards)')
