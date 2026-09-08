import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { validateBodyAssetProvenance, type BodyAssetProvenanceRecord } from '../../src/lib/bodyAssetProvenance.ts'

const digestive = BODY_PROJECTION_TARGETS.find((target) => target.id === 'digestive-core')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(digestive)
assert.ok(thermoreceptor)

const sourceSha = 'a'.repeat(64)
const intermediateSha = 'c'.repeat(64)
const derivedSha = 'b'.repeat(64)

const complete: BodyAssetProvenanceRecord = {
  targetId: digestive.id,
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
  transformationHistory: ['Deterministic source normalization', 'Deterministic build-time conversion to GLB'],
  transformations: [
    {
      operation: 'source normalization',
      tool: 'deterministic normalizer',
      toolVersion: 'recorded-version',
      inputSha256: sourceSha,
      outputSha256: intermediateSha,
      parameters: 'No fabricated geometry; source topology preserved',
    },
    {
      operation: 'build-time conversion',
      tool: 'deterministic converter',
      toolVersion: 'recorded-version',
      inputSha256: intermediateSha,
      outputSha256: derivedSha,
      parameters: 'No fabricated geometry; source coordinates preserved',
    },
  ],
  geometryStatus: 'verified-native',
  evidenceStatus: 'source-checked',
  academicReview: 'pending',
}

assert.equal(validateBodyAssetProvenance(digestive, complete).validForVerifiedRender, true)

const floating = validateBodyAssetProvenance(digestive, { ...complete, sourceRevision: 'main' })
assert.equal(floating.validForVerifiedRender, false)
assert.ok(floating.reasons.some((reason) => reason.includes('floating')))

const shortGitRevision = validateBodyAssetProvenance(digestive, { ...complete, sourceRevision: 'abc123' })
assert.equal(shortGitRevision.validForVerifiedRender, false)
assert.ok(shortGitRevision.reasons.some((reason) => reason.includes('40-character commit SHA')))

const remoteRuntime = validateBodyAssetProvenance(digestive, { ...complete, runtimeAssetPath: 'https://example.test/anatomy.glb' })
assert.equal(remoteRuntime.validForVerifiedRender, false)
assert.ok(remoteRuntime.reasons.some((reason) => reason.includes('remote runtime embeds')))

const badSourceChecksum = validateBodyAssetProvenance(digestive, { ...complete, sourceAssetSha256: 'not-a-sha256' })
assert.equal(badSourceChecksum.validForVerifiedRender, false)
assert.ok(badSourceChecksum.reasons.some((reason) => reason.includes('Source asset SHA-256')))

const missingLicenseEvidence = validateBodyAssetProvenance(digestive, { ...complete, licenseEvidence: ' ' })
assert.equal(missingLicenseEvidence.validForVerifiedRender, false)
assert.ok(missingLicenseEvidence.reasons.includes('Asset-specific license evidence is missing.'))

const brokenEnd = validateBodyAssetProvenance(digestive, {
  ...complete,
  transformations: [complete.transformations[0], { ...complete.transformations[1], outputSha256: 'd'.repeat(64) }],
})
assert.equal(brokenEnd.validForVerifiedRender, false)
assert.ok(brokenEnd.reasons.some((reason) => reason.includes('does not end')))

const discontinuousLineage = validateBodyAssetProvenance(digestive, {
  ...complete,
  transformations: [complete.transformations[0], { ...complete.transformations[1], inputSha256: 'e'.repeat(64) }],
})
assert.equal(discontinuousLineage.validForVerifiedRender, false)
assert.ok(discontinuousLineage.reasons.some((reason) => reason.includes('discontinuous between steps 1 and 2')))

const traversingPath = validateBodyAssetProvenance(digestive, { ...complete, runtimeAssetPath: '../outside.glb' })
assert.equal(traversingPath.validForVerifiedRender, false)
assert.ok(traversingPath.reasons.some((reason) => reason.includes('traverse')))

const conceptual = validateBodyAssetProvenance(thermoreceptor, {
  ...complete,
  targetId: thermoreceptor.id,
  sourceId: 'hubmap_hra',
})
assert.equal(conceptual.validForVerifiedRender, false)
assert.ok(conceptual.reasons.some((reason) => reason.includes('Reference-only')))

console.log('Body asset provenance: immutable revision, checksums, local runtime, asset license scope, continuous lineage, and reference-only guards verified.')