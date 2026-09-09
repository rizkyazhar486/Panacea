import assert from 'node:assert/strict'
import {
  NERVOUS_ATLAS_REQUIREMENTS,
  NERVOUS_SYSTEM_ATLAS_REFERENCE,
  evaluateNervousAtlasReferencePublication,
  validateNervousAtlasReferenceContract,
} from '../../src/lib/anatomy/nervousSystemAtlasReferenceContract.ts'

assert.equal(NERVOUS_SYSTEM_ATLAS_REFERENCE.repository, 'aycibatuhan/nervous-system-atlas')
assert.equal(NERVOUS_SYSTEM_ATLAS_REFERENCE.role, 'mandatory-reference')
assert.equal(validateNervousAtlasReferenceContract().length, 0)

const ids = new Set(NERVOUS_ATLAS_REQUIREMENTS.map((x) => x.id))
for (const required of [
  'declared-coordinate-frame',
  'registered-3d-and-slices',
  'cranial-and-peripheral-nerves',
  'tract-pathway-navigation',
  'arterial-territories',
  'spinal-cord-continuity',
  'educational-lesion-mode',
  'open-citation-provenance',
  'redistribution-license-gate',
  'academic-review-state',
  'patient-inference-blocked',
]) assert.equal(ids.has(required), true, `missing mandatory requirement: ${required}`)

const completeReferenceEvidence = {
  coordinateFrameDeclared: true,
  registrationEvidencePresent: true,
  geometryProvenancePresent: true,
  imagingProvenancePresent: true,
  pathwayProvenancePresent: true,
  citationCoveragePresent: true,
  redistributionLicenseApproved: true,
  aiDisclosurePresent: true,
  academicReviewApproved: false,
  patientSpecificInferenceBlocked: true,
}

assert.deepEqual(evaluateNervousAtlasReferencePublication(completeReferenceEvidence), {
  referencePublication: true,
  verifiedBiomedicalPublication: false,
  blocked: false,
})

assert.equal(
  evaluateNervousAtlasReferencePublication({ ...completeReferenceEvidence, academicReviewApproved: true }).verifiedBiomedicalPublication,
  true,
)

for (const key of [
  'coordinateFrameDeclared',
  'registrationEvidencePresent',
  'geometryProvenancePresent',
  'imagingProvenancePresent',
  'pathwayProvenancePresent',
  'citationCoveragePresent',
  'redistributionLicenseApproved',
  'aiDisclosurePresent',
  'patientSpecificInferenceBlocked',
] as const) {
  const result = evaluateNervousAtlasReferencePublication({ ...completeReferenceEvidence, [key]: false })
  assert.equal(result.referencePublication, false, `${key} must fail closed`)
  assert.equal(result.verifiedBiomedicalPublication, false, `${key} cannot remain verified`) 
  assert.equal(result.blocked, true, `${key} must block publication`)
}

console.log('nervous-system atlas reference contract: ok')
