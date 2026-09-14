import assert from 'node:assert/strict'
import {
  ARTICULAR_CONVERSION_RECEIPT_BOUNDARY,
  ARTICULAR_MACRO_TARGET_IDS,
  articularConversionReceiptMayPromoteSystem,
  auditArticularConversionReceipt,
  type ArticularConversionReceipt,
} from '../../src/lib/anatomy/articularConversionReceipt.ts'
import { ARTICULAR_SOURCE_CANDIDATE } from '../../src/lib/anatomy/articularSourceCandidate.ts'

const baseReceipt: ArticularConversionReceipt = {
  sourceRepository: ARTICULAR_SOURCE_CANDIDATE.upstreamRepository,
  sourceRevision: ARTICULAR_SOURCE_CANDIDATE.upstreamCommit,
  sourcePath: ARTICULAR_SOURCE_CANDIDATE.upstreamPath,
  sourceBlobSha: ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha,
  convertedArtifactSha256: 'a'.repeat(64),
  sourceNodeCount: 1,
  objectNamesPreserved: true,
  referenceFrameId: 'test-frame-only',
  referenceFrameVerification: 'synthetic test receipt; not evidence of a real conversion',
  unitScaleToMeters: 1,
  transformationHistory: ['synthetic-test-step'],
  reviewedTargetCoverage: ARTICULAR_MACRO_TARGET_IDS,
  license: 'synthetic-test-license-record',
  attribution: 'synthetic-test-attribution-record',
  reviewerIdentity: 'Synthetic Reviewer',
  reviewerCredentials: 'test-only',
  reviewDate: '2026-09-14',
  reviewScope: 'contract behavior only; not anatomical review',
  disposition: 'approved',
}

const complete = auditArticularConversionReceipt(baseReceipt)
assert.equal(complete.sourcePinMatches, true)
assert.equal(complete.conversionDigestRecorded, true)
assert.equal(complete.sourceNodesRecorded, true)
assert.equal(complete.objectNamesPreserved, true)
assert.equal(complete.referenceFrameRecorded, true)
assert.equal(complete.unitScaleRecorded, true)
assert.equal(complete.transformationHistoryRecorded, true)
assert.equal(complete.allMacroTargetsReviewed, true)
assert.equal(complete.licenseRecorded, true)
assert.equal(complete.attributionRecorded, true)
assert.equal(complete.qualifiedReviewRecorded, true)
assert.equal(complete.candidateAdmissionReady, true)
assert.equal(complete.mayPromoteSystemRootToShipped, false)
assert.equal(articularConversionReceiptMayPromoteSystem(), false)

const wrongSource = auditArticularConversionReceipt({ ...baseReceipt, sourceBlobSha: 'not-the-pinned-source' })
assert.equal(wrongSource.sourcePinMatches, false)
assert.equal(wrongSource.candidateAdmissionReady, false)

const missingDigest = auditArticularConversionReceipt({ ...baseReceipt, convertedArtifactSha256: '' })
assert.equal(missingDigest.conversionDigestRecorded, false)
assert.equal(missingDigest.candidateAdmissionReady, false)

const missingNodes = auditArticularConversionReceipt({ ...baseReceipt, sourceNodeCount: 0 })
assert.equal(missingNodes.sourceNodesRecorded, false)
assert.equal(missingNodes.candidateAdmissionReady, false)

const missingTarget = auditArticularConversionReceipt({
  ...baseReceipt,
  reviewedTargetCoverage: ARTICULAR_MACRO_TARGET_IDS.slice(0, -1),
})
assert.equal(missingTarget.allMacroTargetsReviewed, false)
assert.equal(missingTarget.candidateAdmissionReady, false)

const rejectedReview = auditArticularConversionReceipt({ ...baseReceipt, disposition: 'changes-required' })
assert.equal(rejectedReview.qualifiedReviewRecorded, false)
assert.equal(rejectedReview.candidateAdmissionReady, false)

assert.match(ARTICULAR_CONVERSION_RECEIPT_BOUNDARY, /candidate admission only/i)
assert.match(ARTICULAR_CONVERSION_RECEIPT_BOUNDARY, /cannot promote system:articular/i)

console.log('body-articular-conversion-receipt: complete synthetic receipt can enter admission review but never promotes system:articular')
