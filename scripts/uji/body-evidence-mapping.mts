import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { validateBodyEvidenceMapping, type BodyEvidenceMappingRecord } from '../../src/lib/bodyEvidenceMapping.ts'

const cardiovascular = BODY_PROJECTION_TARGETS.find((target) => target.id === 'cardiovascular-core')
assert.ok(cardiovascular)

const generic: BodyEvidenceMappingRecord = {
  id: 'cv-physiology-reference-example',
  targetId: cardiovascular.id,
  kind: 'physiology',
  localizationMode: 'generic-reference',
  sourceKind: 'peer-reviewed',
  sourceId: 'example-peer-reviewed-source',
  sourceVersion: 'versioned-record',
  citation: 'Version-pinned source citation placeholder for validator fixture',
  sourceLocator: 'repository-verified-source-record',
  evidenceSummary: 'Generic reference localization fixture with no patient-specific claim.',
  mappedAnatomyTerms: ['heart'],
  locationInferredFromFreeText: false,
  aiAssisted: true,
  academicReview: { status: 'pending' },
}

assert.equal(validateBodyEvidenceMapping(cardiovascular, generic).publishable, true)

const inferred = validateBodyEvidenceMapping(cardiovascular, { ...generic, locationInferredFromFreeText: true })
assert.equal(inferred.publishable, false)
assert.ok(inferred.reasons.some((reason) => reason.includes('free text')))

const genericWithPatientId = validateBodyEvidenceMapping(cardiovascular, { ...generic, patientRecordId: 'patient-1' })
assert.equal(genericWithPatientId.publishable, false)
assert.ok(genericWithPatientId.reasons.some((reason) => reason.includes('Generic reference localization')))

const measuredWithoutApproval = validateBodyEvidenceMapping(cardiovascular, {
  ...generic,
  localizationMode: 'measured-patient',
  sourceKind: 'measured-clinical-data',
  patientRecordId: 'patient-1',
  patientMeasurementId: 'measurement-1',
  patientLocationStructured: 'structured-location-reference',
})
assert.equal(measuredWithoutApproval.publishable, false)
assert.ok(measuredWithoutApproval.reasons.some((reason) => reason.includes('not approved for patient-specific')))

const missingCitation = validateBodyEvidenceMapping(cardiovascular, { ...generic, citation: ' ' })
assert.equal(missingCitation.publishable, false)
assert.ok(missingCitation.reasons.includes('Evidence citation is missing.'))

const noAiDisclosure = validateBodyEvidenceMapping(cardiovascular, { ...generic, aiAssisted: false })
assert.equal(noAiDisclosure.publishable, false)
assert.ok(noAiDisclosure.reasons.some((reason) => reason.includes('AI-assistance disclosure')))

const fakeReview = validateBodyEvidenceMapping(cardiovascular, {
  ...generic,
  academicReview: { status: 'recorded', reviewerName: ' ', reviewerCredentials: ' ', reviewedAt: 'today', scope: ' ' },
})
assert.equal(fakeReview.publishable, false)
assert.ok(fakeReview.reasons.some((reason) => reason.includes('reviewer identity')))
assert.ok(fakeReview.reasons.some((reason) => reason.includes('reviewer credentials')))
assert.ok(fakeReview.reasons.some((reason) => reason.includes('ISO review date')))

const unsupportedKind = validateBodyEvidenceMapping(cardiovascular, { ...generic, kind: 'lesion', targetId: cardiovascular.id })
assert.equal(unsupportedKind.publishable, true)

console.log('Body evidence mapping: provenance, generic-vs-patient localization, AI disclosure, and academic-review guards verified.')
