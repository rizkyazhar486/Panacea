import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, type BodyProjectionTarget } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateBodyPublication } from '../../src/lib/bodyPublicationGate.ts'
import type { BodyAssetProvenanceRecord } from '../../src/lib/bodyAssetProvenance.ts'
import type { BodyEvidenceMappingRecord } from '../../src/lib/bodyEvidenceMapping.ts'

const cardiovascular = BODY_PROJECTION_TARGETS.find((target) => target.id === 'cardiovascular-core')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(cardiovascular)
assert.ok(thermoreceptor)

const sourceSha = 'a'.repeat(64)
const derivedSha = 'b'.repeat(64)
const asset: BodyAssetProvenanceRecord = {
  targetId: cardiovascular.id,
  sourceId: 'z_anatomy',
  assetId: 'z-anatomy/example-heart',
  sourceRevision: '1234567890abcdef1234567890abcdef12345678',
  sourceRevisionKind: 'git-commit',
  sourceAssetSha256: sourceSha,
  derivedAssetSha256: derivedSha,
  runtimeAssetPath: '/assets/body/z-anatomy/example-heart.glb',
  license: 'Asset-level source license record',
  licenseScope: 'asset',
  licenseEvidence: 'Verified source-side asset/license record',
  attribution: 'Source attribution preserved',
  transformationHistory: ['Deterministic build-time conversion'],
  transformations: [{
    operation: 'build-time conversion',
    tool: 'deterministic converter',
    toolVersion: 'recorded-version',
    inputSha256: sourceSha,
    outputSha256: derivedSha,
  }],
  geometryStatus: 'verified-native',
  evidenceStatus: 'source-checked',
  academicReview: 'pending',
}

const pendingAnatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: cardiovascular, asset })
assert.equal(pendingAnatomy.publishable, false)
assert.equal(pendingAnatomy.referenceDisplayAllowed, false)
assert.equal(pendingAnatomy.renderAsVerifiedAnatomy, false)
assert.ok(pendingAnatomy.reasons.some((reason) => reason.includes('academic review')))

const reviewedCardiovascular: BodyProjectionTarget = { ...cardiovascular, academicReview: 'recorded' }
const reviewedAsset: BodyAssetProvenanceRecord = {
  ...asset,
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Credential fixture',
  reviewerDate: '2026-09-08',
  reviewerScope: 'Validator fixture only.',
}
const anatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: reviewedCardiovascular, asset: reviewedAsset })
assert.equal(anatomy.publishable, true)
assert.equal(anatomy.referenceDisplayAllowed, false)
assert.equal(anatomy.renderAsVerifiedAnatomy, true)
assert.equal(anatomy.displayAsReferenceOnly, false)

const noAsset = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: cardiovascular })
assert.equal(noAsset.publishable, false)
assert.equal(noAsset.referenceDisplayAllowed, false)
assert.equal(noAsset.renderAsVerifiedAnatomy, false)

const evidence: BodyEvidenceMappingRecord = {
  id: 'cv-physiology-reference',
  targetId: cardiovascular.id,
  kind: 'physiology',
  localizationMode: 'generic-reference',
  sourceKind: 'peer-reviewed',
  sourceId: 'versioned-source',
  sourceVersion: '2026-record',
  citation: 'Version-pinned citation fixture',
  sourceLocator: 'test-fixture://body-publication-gate/cv-physiology-reference#heart',
  evidenceSummary: 'Generic physiology reference fixture without patient-specific inference.',
  mappedAnatomyTerms: ['heart'],
  locationInferredFromFreeText: false,
  aiAssisted: true,
  academicReview: { status: 'pending' },
}

const overlay = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'physiology', target: cardiovascular, evidence: [evidence] })
assert.equal(overlay.publishable, false)
assert.equal(overlay.referenceDisplayAllowed, true)
assert.equal(overlay.renderAsVerifiedAnatomy, false)
assert.equal(overlay.displayAsReferenceOnly, true)
assert.ok(overlay.reasons.some((reason) => reason.includes('Target academic review must be recorded')))
assert.ok(overlay.reasons.some((reason) => reason.includes('academic review must be recorded before biomedical publication')))

const overlayOnPendingAsset = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'physiology', target: cardiovascular, asset, evidence: [evidence] })
assert.equal(overlayOnPendingAsset.publishable, false)
assert.equal(overlayOnPendingAsset.referenceDisplayAllowed, true)
assert.equal(overlayOnPendingAsset.displayAsReferenceOnly, true)
assert.equal(overlayOnPendingAsset.renderAsVerifiedAnatomy, false)

const pendingEvidenceOnVerifiedGeometry = evaluateBodyPublication({
  mode: 'evidence-overlay',
  kind: 'physiology',
  target: reviewedCardiovascular,
  asset: reviewedAsset,
  evidence: [evidence],
})
assert.equal(pendingEvidenceOnVerifiedGeometry.publishable, false)
assert.equal(pendingEvidenceOnVerifiedGeometry.referenceDisplayAllowed, true)
assert.equal(pendingEvidenceOnVerifiedGeometry.displayAsReferenceOnly, true)
assert.equal(pendingEvidenceOnVerifiedGeometry.renderAsVerifiedAnatomy, false)

const reviewedEvidence: BodyEvidenceMappingRecord = {
  ...evidence,
  academicReview: {
    status: 'recorded',
    reviewerName: 'Qualified reviewer fixture',
    reviewerCredentials: 'Credential fixture',
    reviewedAt: '2026-09-08',
    scope: 'Validator fixture only.',
  },
}
const reviewedOverlay = evaluateBodyPublication({
  mode: 'evidence-overlay',
  kind: 'physiology',
  target: reviewedCardiovascular,
  asset: reviewedAsset,
  evidence: [reviewedEvidence],
})
assert.equal(reviewedOverlay.publishable, true)
assert.equal(reviewedOverlay.referenceDisplayAllowed, true)
assert.equal(reviewedOverlay.displayAsReferenceOnly, false)
assert.equal(reviewedOverlay.renderAsVerifiedAnatomy, false)

const malformedReviewedEvidence: BodyEvidenceMappingRecord = {
  ...reviewedEvidence,
  academicReview: { status: 'recorded', reviewerName: '', reviewerCredentials: '', reviewedAt: '2026-02-31', scope: '' },
}
const malformedOverlay = evaluateBodyPublication({
  mode: 'evidence-overlay',
  kind: 'physiology',
  target: reviewedCardiovascular,
  asset: reviewedAsset,
  evidence: [malformedReviewedEvidence],
})
assert.equal(malformedOverlay.publishable, false)
assert.equal(malformedOverlay.referenceDisplayAllowed, false)
assert.equal(malformedOverlay.displayAsReferenceOnly, false)

const wrongKind = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'lesion', target: cardiovascular, evidence: [evidence] })
assert.equal(wrongKind.publishable, false)
assert.equal(wrongKind.referenceDisplayAllowed, false)
assert.ok(wrongKind.reasons.some((reason) => reason.includes('kind does not match')))

const procedure = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'procedure', target: cardiovascular })
assert.equal(procedure.publishable, false)
assert.equal(procedure.referenceDisplayAllowed, false)
assert.ok(procedure.reasons.some((reason) => reason.includes('dedicated procedure evidence')))

const conceptualAnatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: thermoreceptor, asset: { ...reviewedAsset, targetId: thermoreceptor.id, sourceId: 'hubmap_hra' } })
assert.equal(conceptualAnatomy.publishable, false)
assert.equal(conceptualAnatomy.referenceDisplayAllowed, false)
assert.equal(conceptualAnatomy.renderAsVerifiedAnatomy, false)
assert.ok(conceptualAnatomy.reasons.some((reason) => reason.includes('Reference-only')))

console.log('Body publication gate: strict reviewed publication, safe reference-only overlays, malformed-review fail-closed, and verified-geometry laundering prevention verified.')
