import {
  SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS,
  SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
} from './fascialSourceEvidenceLadder.ts'

export interface SuperficialFasciaBinaryVerificationReceipt {
  sourceBundleSha: string
  sourceBundleBytes: number
  sourceNodeNames: readonly string[]
  binaryInspectionTool: string
  binaryInspectionToolVersion: string
  binaryInspectionDate: string
  convertedArtifactSha256: string
  convertedNodeNames: readonly string[]
  referenceFrameName: string
  referenceFrameTransform4x4: readonly number[]
  unit: 'm' | 'cm' | 'mm'
  licenseEvidence: string
  licenseTextDigest: string
  reviewerIdentity: string
  reviewerCredentials: string
  reviewDate: string
  reviewScope: string
  disposition: 'approved' | 'changes-required'
}

export interface SuperficialFasciaBinaryVerificationReport {
  sourceBundlePinned: boolean
  sourceNodesVerified: boolean
  convertedArtifactDigestValid: boolean
  convertedNamesPreserved: boolean
  referenceFrameReceiptComplete: boolean
  licenseReceiptComplete: boolean
  academicReviewApproved: boolean
  candidateAdmissionReady: boolean
}

const SHA256 = /^[a-f0-9]{64}$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function nonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function validDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

/**
 * Evaluates a future binary-inspection/conversion receipt without creating one.
 * No receipt is bundled in production because the FBX has not been inspected by
 * this repository workflow. This gate exists so a future importer cannot jump
 * from text/material hints straight to shipped anatomy.
 */
export function evaluateSuperficialFasciaBinaryReceipt(
  receipt?: SuperficialFasciaBinaryVerificationReceipt,
): SuperficialFasciaBinaryVerificationReport {
  if (!receipt) {
    return {
      sourceBundlePinned: false,
      sourceNodesVerified: false,
      convertedArtifactDigestValid: false,
      convertedNamesPreserved: false,
      referenceFrameReceiptComplete: false,
      licenseReceiptComplete: false,
      academicReviewApproved: false,
      candidateAdmissionReady: false,
    }
  }

  const sourceBundlePinned =
    receipt.sourceBundleSha === SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha &&
    receipt.sourceBundleBytes === SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBytes &&
    nonEmpty(receipt.binaryInspectionTool) &&
    nonEmpty(receipt.binaryInspectionToolVersion) &&
    validDate(receipt.binaryInspectionDate)

  const sourceNames = new Set(receipt.sourceNodeNames)
  const sourceNodesVerified =
    sourceBundlePinned &&
    SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.every((name) => sourceNames.has(name))

  const convertedArtifactDigestValid = SHA256.test(receipt.convertedArtifactSha256)
  const convertedNames = new Set(receipt.convertedNodeNames)
  const convertedNamesPreserved =
    convertedArtifactDigestValid &&
    SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.every((name) => convertedNames.has(name))

  const referenceFrameReceiptComplete =
    nonEmpty(receipt.referenceFrameName) &&
    receipt.referenceFrameTransform4x4.length === 16 &&
    receipt.referenceFrameTransform4x4.every(Number.isFinite) &&
    ['m', 'cm', 'mm'].includes(receipt.unit)

  const licenseReceiptComplete =
    nonEmpty(receipt.licenseEvidence) &&
    nonEmpty(receipt.licenseTextDigest)

  const academicReviewApproved =
    nonEmpty(receipt.reviewerIdentity) &&
    nonEmpty(receipt.reviewerCredentials) &&
    validDate(receipt.reviewDate) &&
    nonEmpty(receipt.reviewScope) &&
    receipt.disposition === 'approved'

  const candidateAdmissionReady =
    sourceBundlePinned &&
    sourceNodesVerified &&
    convertedArtifactDigestValid &&
    convertedNamesPreserved &&
    referenceFrameReceiptComplete &&
    licenseReceiptComplete &&
    academicReviewApproved

  return {
    sourceBundlePinned,
    sourceNodesVerified,
    convertedArtifactDigestValid,
    convertedNamesPreserved,
    referenceFrameReceiptComplete,
    licenseReceiptComplete,
    academicReviewApproved,
    candidateAdmissionReady,
  }
}

/**
 * Even a complete candidate receipt cannot promote the whole fascial system by
 * itself. Canonical macro closure still requires every fascial target and its
 * publication/review record.
 */
export function superficialFasciaBinaryReceiptMayPromoteSystem(): boolean {
  return false
}

export const SUPERFICIAL_FASCIA_BINARY_RECEIPT_BOUNDARY =
  'Receipt schema only: no source FBX node identity, conversion digest, same-frame transform, asset-level license review, or qualified anatomical approval is asserted by this module. A future complete receipt can make one superficial-fascia source candidate admission-ready, but it cannot bypass the canonical macro-system closure gate or mark system:fascial shipped.' as const
