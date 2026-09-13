import assert from 'node:assert/strict'
import {
  SUPERFICIAL_FASCIA_BINARY_RECEIPT_BOUNDARY,
  evaluateSuperficialFasciaBinaryReceipt,
  superficialFasciaBinaryReceiptMayPromoteSystem,
} from '../../src/lib/anatomy/fascialBinaryVerificationReceipt.ts'
import {
  SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS,
  SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
} from '../../src/lib/anatomy/fascialSourceEvidenceLadder.ts'

const absent = evaluateSuperficialFasciaBinaryReceipt()
assert.deepEqual(absent, {
  sourceBundlePinned: false,
  sourceNodesVerified: false,
  convertedArtifactDigestValid: false,
  convertedNamesPreserved: false,
  referenceFrameReceiptComplete: false,
  licenseReceiptComplete: false,
  academicReviewApproved: false,
  candidateAdmissionReady: false,
})

const futureSyntheticReceipt = {
  sourceBundleSha: SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha,
  sourceBundleBytes: SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBytes,
  sourceNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
  binaryInspectionTool: 'synthetic-test-only',
  binaryInspectionToolVersion: '0',
  binaryInspectionDate: '2026-09-13',
  convertedArtifactSha256: 'a'.repeat(64),
  convertedNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
  referenceFrameName: 'synthetic-test-frame',
  referenceFrameTransform4x4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  unit: 'm' as const,
  licenseEvidence: 'synthetic-test-only',
  licenseTextDigest: 'synthetic-test-only',
  reviewerIdentity: 'synthetic-test-reviewer',
  reviewerCredentials: 'synthetic-test-credentials',
  reviewDate: '2026-09-13',
  reviewScope: 'synthetic contract exercise only',
  disposition: 'approved' as const,
}

const completeContractExercise = evaluateSuperficialFasciaBinaryReceipt(futureSyntheticReceipt)
assert.equal(completeContractExercise.candidateAdmissionReady, true)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    sourceBundleSha: 'wrong-bundle',
  }).candidateAdmissionReady,
  false,
)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    sourceNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.slice(0, -1),
  }).sourceNodesVerified,
  false,
)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    convertedArtifactSha256: 'not-a-sha256',
  }).convertedArtifactDigestValid,
  false,
)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    convertedNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.slice(0, -1),
  }).convertedNamesPreserved,
  false,
)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    referenceFrameTransform4x4: [1, 0, 0],
  }).referenceFrameReceiptComplete,
  false,
)

assert.equal(
  evaluateSuperficialFasciaBinaryReceipt({
    ...futureSyntheticReceipt,
    disposition: 'changes-required',
  }).academicReviewApproved,
  false,
)

assert.equal(superficialFasciaBinaryReceiptMayPromoteSystem(), false)
assert.match(SUPERFICIAL_FASCIA_BINARY_RECEIPT_BOUNDARY, /Receipt schema only/i)
assert.match(SUPERFICIAL_FASCIA_BINARY_RECEIPT_BOUNDARY, /cannot bypass/i)
assert.match(SUPERFICIAL_FASCIA_BINARY_RECEIPT_BOUNDARY, /system:fascial shipped/i)

console.log('body-superficial-fascia-binary-receipt-contract: fail-closed receipt schema; no binary evidence claimed')
