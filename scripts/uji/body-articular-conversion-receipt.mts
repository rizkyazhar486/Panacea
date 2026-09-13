import assert from 'node:assert/strict'
import { ARTICULAR_SOURCE_CANDIDATE } from '../../src/lib/anatomy/articularSourceCandidate.ts'
import {
  ARTICULAR_CONVERSION_RECEIPT_BOUNDARY,
  CURRENT_ARTICULAR_CONVERSION_READINESS,
  articularConversionReceiptMayPromoteSystem,
  evaluateArticularConversionReceipt,
  type ArticularConversionReceipt,
} from '../../src/lib/anatomy/articularConversionReceipt.ts'

assert.equal(CURRENT_ARTICULAR_CONVERSION_READINESS.status, 'receipt-missing')
assert.equal(CURRENT_ARTICULAR_CONVERSION_READINESS.readyForQualifiedReview, false)
assert.equal(CURRENT_ARTICULAR_CONVERSION_READINESS.mayPromoteSystem, false)
assert.equal(articularConversionReceiptMayPromoteSystem(), false)

const base: ArticularConversionReceipt = {
  upstreamRepository: ARTICULAR_SOURCE_CANDIDATE.upstreamRepository,
  upstreamCommit: ARTICULAR_SOURCE_CANDIDATE.upstreamCommit,
  upstreamPath: ARTICULAR_SOURCE_CANDIDATE.upstreamPath,
  upstreamBlobSha: ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha,
  sourceFormat: 'FBX',
  targetFormat: 'GLB',
  convertedArtifactSha256: 'a'.repeat(64),
  sourceNodeCount: 3,
  sourceObjectNames: ['future-node-a', 'future-node-b', 'future-node-c'],
  objectNamesPreserved: true,
  transformationHistory: ['future test-only FBX to GLB conversion receipt'],
  referenceFrameVerified: true,
  licenseScopeVerified: true,
}

const completeFutureReceipt = evaluateArticularConversionReceipt(base)
assert.equal(completeFutureReceipt.status, 'ready-for-qualified-review')
assert.equal(completeFutureReceipt.candidateIdentityMatches, true)
assert.equal(completeFutureReceipt.convertedDigestValid, true)
assert.equal(completeFutureReceipt.sourceInventoryPresent, true)
assert.equal(completeFutureReceipt.objectNamesPreserved, true)
assert.equal(completeFutureReceipt.transformationHistoryPresent, true)
assert.equal(completeFutureReceipt.referenceFrameVerified, true)
assert.equal(completeFutureReceipt.licenseScopeVerified, true)
assert.equal(completeFutureReceipt.readyForQualifiedReview, true)
assert.equal(completeFutureReceipt.mayPromoteSystem, false)

const wrongBlob = evaluateArticularConversionReceipt({
  ...base,
  upstreamBlobSha: 'not-the-pinned-joints100-blob',
})
assert.equal(wrongBlob.status, 'candidate-mismatch')
assert.equal(wrongBlob.readyForQualifiedReview, false)

const badDigest = evaluateArticularConversionReceipt({
  ...base,
  convertedArtifactSha256: 'not-a-sha256',
})
assert.equal(badDigest.status, 'conversion-incomplete')
assert.equal(badDigest.convertedDigestValid, false)

const zeroNodes = evaluateArticularConversionReceipt({
  ...base,
  sourceNodeCount: 0,
})
assert.equal(zeroNodes.status, 'conversion-incomplete')
assert.equal(zeroNodes.sourceInventoryPresent, false)

const duplicateNames = evaluateArticularConversionReceipt({
  ...base,
  sourceObjectNames: ['duplicate', 'duplicate'],
})
assert.equal(duplicateNames.sourceInventoryPresent, false)
assert.equal(duplicateNames.readyForQualifiedReview, false)

const missingHistory = evaluateArticularConversionReceipt({
  ...base,
  transformationHistory: [],
})
assert.equal(missingHistory.transformationHistoryPresent, false)
assert.equal(missingHistory.readyForQualifiedReview, false)

for (const key of ['objectNamesPreserved', 'referenceFrameVerified', 'licenseScopeVerified'] as const) {
  const result = evaluateArticularConversionReceipt({ ...base, [key]: false })
  assert.equal(result.status, 'conversion-incomplete', `${key} must remain fail-closed`)
  assert.equal(result.readyForQualifiedReview, false, `${key} must block qualified review readiness`)
  assert.equal(result.mayPromoteSystem, false)
}

assert.match(ARTICULAR_CONVERSION_RECEIPT_BOUNDARY, /No articular conversion receipt is currently admitted/i)
assert.match(ARTICULAR_CONVERSION_RECEIPT_BOUNDARY, /exact Joints100 source identity/i)
assert.match(ARTICULAR_CONVERSION_RECEIPT_BOUNDARY, /never by itself marks system:articular shipped/i)

console.log('body-articular-conversion-receipt: exact candidate + digest + inventory + frame/license required; current state remains blocked')
