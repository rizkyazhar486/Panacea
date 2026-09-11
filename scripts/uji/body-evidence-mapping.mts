import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { validateBodyEvidenceMapping, type BodyEvidenceMappingRecord } from '../../src/lib/bodyEvidenceMapping.ts'

// Exact-head acceptance guard: this suite is intentionally deterministic and content-free.
const cardiovascular = BODY_PROJECTION_TARGETS.find((target) => target.id === 'cardiovascular-core')
const pulmonary = BODY_PROJECTION_TARGETS.find((target) => target.id === 'pulmonary-core')
assert.ok(cardiovascular)
assert.ok(pulmonary)

const generic: BodyEvidenceMappingRecord = {
  id: 'cv-physiology-reference-example',
  targetId: cardiovascular.id,
  kind: 'physiology',
  localizationMode: 'generic-reference',
  sourceKind: 'peer-reviewed',
  sourceId: 'example-peer-reviewed-source',
  sourceVersion: 'fixture-revision-2026-09-08',
  citation: 'Version-pinned source citation placeholder for validator fixture',
  sourceLocator: 'fixture://peer-reviewed-source/section-1',
  evidenceSummary: 'Generic reference localization fixture with no patient-specific claim.',
  mappedAnatomyTerms: ['heart'],
  locationInferredFromFreeText: false,
  aiAssisted: true,
  academicReview: { status: 'pending' },
}

assert.equal(validateBodyEvidenceMapping(cardiovascular, generic).publishable, true)
assert.equal(validateBodyEvidenceMapping(cardiovascular, { ...generic, aiAssisted: false }).publishable, true)

const normalizedVariant = validateBodyEvidenceMapping(cardiovascular, { ...generic, mappedAnatomyTerms: ['coronary-artery'] })
assert.equal(normalizedVariant.publishable, true)

const genericFragment = validateBodyEvidenceMapping(cardiovascular, { ...generic, mappedAnatomyTerms: ['artery'] })
assert.equal(genericFragment.publishable, false)
assert.ok(genericFragment.reasons.some((reason) => reason.includes('resolve conservatively')))

const substringCollision = validateBodyEvidenceMapping(cardiovascular, { ...generic, mappedAnatomyTerms: ['heartburn'] })
assert.equal(substringCollision.publishable, false)
assert.ok(substringCollision.reasons.some((reason) => reason.includes('resolve conservatively')))

const unrelatedAnatomy = validateBodyEvidenceMapping(cardiovascular, { ...generic, mappedAnatomyTerms: ['kidney'] })
assert.equal(unrelatedAnatomy.publishable, false)
assert.ok(unrelatedAnatomy.reasons.some((reason) => reason.includes('resolve conservatively')))

const crossSystemAnatomy = validateBodyEvidenceMapping(pulmonary, {
  ...generic,
  targetId: pulmonary.id,
  mappedAnatomyTerms: ['heart'],
})
assert.equal(crossSystemAnatomy.publishable, false)
assert.ok(crossSystemAnatomy.reasons.some((reason) => reason.includes('resolve conservatively')))

const missingRuntimeDisclosure = validateBodyEvidenceMapping(cardiovascular, { ...generic, aiAssisted: undefined as unknown as boolean })
assert.equal(missingRuntimeDisclosure.publishable, false)
assert.ok(missingRuntimeDisclosure.reasons.some((reason) => reason.includes('explicit boolean')))

for (const sourceVersion of ['latest', 'main', 'HEAD', 'versioned-record']) {
  const floating = validateBodyEvidenceMapping(cardiovascular, { ...generic, sourceVersion })
  assert.equal(floating.publishable, false)
  assert.ok(floating.reasons.some((reason) => reason.includes('explicit and immutable')))
}

const placeholderLocator = validateBodyEvidenceMapping(cardiovascular, { ...generic, sourceLocator: 'repository-verified-source-record' })
assert.equal(placeholderLocator.publishable, false)
assert.ok(placeholderLocator.reasons.some((reason) => reason.includes('specific source location')))

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

const fakeReview = validateBodyEvidenceMapping(cardiovascular, {
  ...generic,
  academicReview: { status: 'recorded', reviewerName: ' ', reviewerCredentials: ' ', reviewedAt: 'today', scope: ' ' },
})
assert.equal(fakeReview.publishable, false)
assert.ok(fakeReview.reasons.some((reason) => reason.includes('reviewer identity')))
assert.ok(fakeReview.reasons.some((reason) => reason.includes('reviewer credentials')))
assert.ok(fakeReview.reasons.some((reason) => reason.includes('real ISO review date')))

const impossibleCalendarReview = validateBodyEvidenceMapping(cardiovascular, {
  ...generic,
  academicReview: {
    status: 'recorded',
    reviewerName: 'Qualified reviewer fixture',
    reviewerCredentials: 'Credential fixture',
    reviewedAt: '2026-02-31',
    scope: 'Validator fixture only.',
  },
})
assert.equal(impossibleCalendarReview.publishable, false)
assert.ok(impossibleCalendarReview.reasons.some((reason) => reason.includes('real ISO review date')))

const unsupportedKind = validateBodyEvidenceMapping(cardiovascular, { ...generic, kind: 'lesion', targetId: cardiovascular.id })
assert.equal(unsupportedKind.publishable, true)

console.log('Body evidence mapping: immutable provenance, fail-closed anatomy-term token boundaries, generic-vs-patient localization, explicit AI disclosure, and academic-review guards verified.')
