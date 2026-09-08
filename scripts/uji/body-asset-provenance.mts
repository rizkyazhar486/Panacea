import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, type BodyProjectionTarget } from '../../src/lib/bodyProjectionContract.ts'
import { validateBodyAssetProvenance, type BodyAssetProvenanceRecord } from '../../src/lib/bodyAssetProvenance.ts'

const digestive = BODY_PROJECTION_TARGETS.find((target) => target.id === 'digestive-core')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(digestive)
assert.ok(thermoreceptor)

const reviewedDigestive: BodyProjectionTarget = { ...digestive, academicReview: 'recorded' }
const sourceSha = 'a'.repeat(64)
const derivedSha = 'b'.repeat(64)

const complete: BodyAssetProvenanceRecord = {
  targetId: reviewedDigestive.id,
  sourceId: 'z_anatomy',
  assetId: 'z-anatomy/example-object',
  sourceRevision: '1234567890abcdef1234567890abcdef12345678',
  sourceRevisionKind: 'git-commit',
  sourceAssetSha256: sourceSha,
  derivedAssetSha256: derivedSha,
  runtimeAssetPath: '/assets/body/z-anatomy/example-object.glb',
  license: 'Asset-level source license record',
  licenseScope: 'asset',
  licenseEvidence: 'Verified source-side asset/license record',
  attribution: 'Source asset attribution preserved for the derived reference mesh',
  transformationHistory: ['Deterministic build-time conversion to GLB'],
  transformations: [{
    operation: 'build-time conversion',
    tool: 'deterministic converter',
    toolVersion: 'recorded-version',
    inputSha256: sourceSha,
    outputSha256: derivedSha,
    parameters: 'No fabricated geometry; source coordinates preserved',
  }],
  geometryStatus: 'verified-native',
  evidenceStatus: 'source-checked',
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewerDate: '2026-09-08',
  reviewerScope: 'Fixture-only asset identity, anatomy mapping, transformations, and educational scope',
}

assert.equal(validateBodyAssetProvenance(reviewedDigestive, complete).validForVerifiedRender, true)

const pendingTarget = validateBodyAssetProvenance(digestive, { ...complete, targetId: digestive.id })
assert.equal(pendingTarget.validForVerifiedRender, false)
assert.ok(pendingTarget.reasons.some((reason) => reason.includes('Target academic review is still pending')))

const floating = validateBodyAssetProvenance(reviewedDigestive, { ...complete, sourceRevision: 'main' })
assert.equal(floating.validForVerifiedRender, false)
assert.ok(floating.reasons.some((reason) => reason.includes('floating')))

const shortGitRevision = validateBodyAssetProvenance(reviewedDigestive, { ...complete, sourceRevision: 'abc123' })
assert.equal(shortGitRevision.validForVerifiedRender, false)
assert.ok(shortGitRevision.reasons.some((reason) => reason.includes('40-character commit SHA')))

const remoteRuntime = validateBodyAssetProvenance(reviewedDigestive, { ...complete, runtimeAssetPath: 'https://example.test/anatomy.glb' })
assert.equal(remoteRuntime.validForVerifiedRender, false)
assert.ok(remoteRuntime.reasons.some((reason) => reason.includes('remote runtime embeds')))

const badSourceChecksum = validateBodyAssetProvenance(reviewedDigestive, { ...complete, sourceAssetSha256: 'not-a-sha256' })
assert.equal(badSourceChecksum.validForVerifiedRender, false)
assert.ok(badSourceChecksum.reasons.some((reason) => reason.includes('Source asset SHA-256')))

const missingLicenseEvidence = validateBodyAssetProvenance(reviewedDigestive, { ...complete, licenseEvidence: ' ' })
assert.equal(missingLicenseEvidence.validForVerifiedRender, false)
assert.ok(missingLicenseEvidence.reasons.includes('Asset-specific license evidence is missing.'))

const brokenLineage = validateBodyAssetProvenance(reviewedDigestive, {
  ...complete,
  transformations: [{ ...complete.transformations[0], outputSha256: 'c'.repeat(64) }],
})
assert.equal(brokenLineage.validForVerifiedRender, false)
assert.ok(brokenLineage.reasons.some((reason) => reason.includes('does not end')))

const traversingPath = validateBodyAssetProvenance(reviewedDigestive, { ...complete, runtimeAssetPath: '../outside.glb' })
assert.equal(traversingPath.validForVerifiedRender, false)
assert.ok(traversingPath.reasons.some((reason) => reason.includes('traverse')))

const conceptual = validateBodyAssetProvenance(thermoreceptor, {
  ...complete,
  targetId: thermoreceptor.id,
  sourceId: 'hubmap_hra',
})
assert.equal(conceptual.validForVerifiedRender, false)
assert.ok(conceptual.reasons.some((reason) => reason.includes('Reference-only')))

console.log('Body asset provenance: immutable revision, checksums, local runtime, license scope, lineage, academic review, and reference-only guards verified.')
