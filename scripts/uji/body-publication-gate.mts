import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, type BodyProjectionTarget } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateBodyPublication } from '../../src/lib/bodyPublicationGate.ts'
import type { BodyAssetProvenanceRecord } from '../../src/lib/bodyAssetProvenance.ts'
import type { BodyEvidenceMappingRecord } from '../../src/lib/bodyEvidenceMapping.ts'

const cardiovascular = BODY_PROJECTION_TARGETS.find((target) => target.id === 'cardiovascular-core')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(cardiovascular)
assert.ok(thermoreceptor)

const reviewedCardiovascular: BodyProjectionTarget = { ...cardiovascular, academicReview: 'recorded' }
const sourceSha = 'a'.repeat(64)
const derivedSha = 'b'.repeat(64)
const asset: BodyAssetProvenanceRecord = {
  targetId: reviewedCardiovascular.id,
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
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewerDate: '2026-09-08',
  reviewerScope: 'Fixture-only heart asset identity, anatomy mapping, transformations, and educational scope',
}

const anatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: reviewedCardiovascular, asset })
assert.equal(anatomy.publishable, true)
assert.equal(anatomy.renderAsVerifiedAnatomy, true)
assert.equal(anatomy.displayAsReferenceOnly, false)

const pendingAnatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: cardiovascular, asset: { ...asset, targetId: cardiovascular.id } })
assert.equal(pendingAnatomy.publishable, false)
assert.equal(pendingAnatomy.renderAsVerifiedAnatomy, false)
assert.ok(pendingAnatomy.reasons.some((reason) => reason.includes('Target academic review is still pending')))

const noAsset = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: reviewedCardiovascular })
assert.equal(noAsset.publishable, false)
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
assert.equal(overlay.publishable, true)
assert.equal(overlay.renderAsVerifiedAnatomy, false)
assert.equal(overlay.displayAsReferenceOnly, true)

const reviewedEvidence: BodyEvidenceMappingRecord = {
  ...evidence,
  targetId: reviewedCardiovascular.id,
  academicReview: {
    status: 'recorded',
    reviewerName: 'Qualified reviewer fixture',
    reviewerCredentials: 'Recorded professional credentials fixture',
    reviewedAt: '2026-09-08',
    scope: 'Fixture-only cardiovascular physiology evidence localization',
  },
}
const overlayOnVerifiedAsset = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'physiology', target: reviewedCardiovascular, asset, evidence: [reviewedEvidence] })
assert.equal(overlayOnVerifiedAsset.publishable, true)
assert.equal(overlayOnVerifiedAsset.displayAsReferenceOnly, false)
assert.equal(overlayOnVerifiedAsset.renderAsVerifiedAnatomy, false)

const wrongKind = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'lesion', target: cardiovascular, evidence: [evidence] })
assert.equal(wrongKind.publishable, false)
assert.ok(wrongKind.reasons.some((reason) => reason.includes('kind does not match')))

const procedure = evaluateBodyPublication({ mode: 'evidence-overlay', kind: 'procedure', target: cardiovascular })
assert.equal(procedure.publishable, false)
assert.ok(procedure.reasons.some((reason) => reason.includes('dedicated procedure evidence')))

const conceptualAnatomy = evaluateBodyPublication({ mode: 'verified-anatomy', kind: 'anatomy', target: thermoreceptor, asset: { ...asset, targetId: thermoreceptor.id, sourceId: 'hubmap_hra' } })
assert.equal(conceptualAnatomy.publishable, false)
assert.equal(conceptualAnatomy.renderAsVerifiedAnatomy, false)
assert.ok(conceptualAnatomy.reasons.some((reason) => reason.includes('Reference-only')))

console.log('Body publication gate: reviewed verified anatomy, pending-review fail-closed, reference overlays, procedure fail-closed, and conceptual geometry boundaries verified.')
