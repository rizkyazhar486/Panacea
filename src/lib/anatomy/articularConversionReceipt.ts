import { ARTICULAR_SOURCE_CANDIDATE } from './articularSourceCandidate'

export const ARTICULAR_MACRO_TARGET_IDS = [
  'articular:tmj',
  'articular:shoulder',
  'articular:elbow',
  'articular:wrist-hand',
  'articular:spine',
  'articular:pelvis',
  'articular:hip',
  'articular:knee',
  'articular:ankle-foot',
] as const

export type ArticularMacroTargetId = (typeof ARTICULAR_MACRO_TARGET_IDS)[number]

export interface ArticularConversionReceipt {
  sourceRepository: string
  sourceRevision: string
  sourcePath: string
  sourceBlobSha: string
  convertedArtifactSha256: string
  sourceNodeCount: number
  objectNamesPreserved: boolean
  referenceFrameId: string
  referenceFrameVerification: string
  unitScaleToMeters: number
  transformationHistory: readonly string[]
  reviewedTargetCoverage: readonly ArticularMacroTargetId[]
  license: string
  attribution: string
  reviewerIdentity: string
  reviewerCredentials: string
  reviewDate: string
  reviewScope: string
  disposition: 'approved' | 'changes-required'
}

export interface ArticularConversionReceiptAudit {
  sourcePinMatches: boolean
  conversionDigestRecorded: boolean
  sourceNodesRecorded: boolean
  objectNamesPreserved: boolean
  referenceFrameRecorded: boolean
  unitScaleRecorded: boolean
  transformationHistoryRecorded: boolean
  allMacroTargetsReviewed: boolean
  licenseRecorded: boolean
  attributionRecorded: boolean
  qualifiedReviewRecorded: boolean
  candidateAdmissionReady: boolean
  mayPromoteSystemRootToShipped: false
}

const SHA256 = /^[a-f0-9]{64}$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function nonEmpty(value: string) {
  return value.trim().length > 0
}

function coversAllRequiredTargets(values: readonly ArticularMacroTargetId[]) {
  const covered = new Set(values)
  return ARTICULAR_MACRO_TARGET_IDS.every((targetId) => covered.has(targetId))
}

/**
 * Structural receipt gate for a future Joints100 -> GLB conversion.
 *
 * Passing this function means only that a candidate receipt is internally
 * complete enough to enter the canonical source/admission review. It is not a
 * claim that conversion happened, that anatomy is correct, or that the
 * articular system may be marked shipped.
 */
export function auditArticularConversionReceipt(
  receipt: ArticularConversionReceipt,
): ArticularConversionReceiptAudit {
  const sourcePinMatches =
    receipt.sourceRepository === ARTICULAR_SOURCE_CANDIDATE.upstreamRepository &&
    receipt.sourceRevision === ARTICULAR_SOURCE_CANDIDATE.upstreamCommit &&
    receipt.sourcePath === ARTICULAR_SOURCE_CANDIDATE.upstreamPath &&
    receipt.sourceBlobSha === ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha

  const conversionDigestRecorded = SHA256.test(receipt.convertedArtifactSha256)
  const sourceNodesRecorded = Number.isInteger(receipt.sourceNodeCount) && receipt.sourceNodeCount > 0
  const objectNamesPreserved = receipt.objectNamesPreserved === true
  const referenceFrameRecorded = nonEmpty(receipt.referenceFrameId) && nonEmpty(receipt.referenceFrameVerification)
  const unitScaleRecorded = Number.isFinite(receipt.unitScaleToMeters) && receipt.unitScaleToMeters > 0
  const transformationHistoryRecorded =
    receipt.transformationHistory.length > 0 && receipt.transformationHistory.every(nonEmpty)
  const allMacroTargetsReviewed = coversAllRequiredTargets(receipt.reviewedTargetCoverage)
  const licenseRecorded = nonEmpty(receipt.license)
  const attributionRecorded = nonEmpty(receipt.attribution)
  const qualifiedReviewRecorded =
    nonEmpty(receipt.reviewerIdentity) &&
    nonEmpty(receipt.reviewerCredentials) &&
    ISO_DATE.test(receipt.reviewDate) &&
    !Number.isNaN(Date.parse(`${receipt.reviewDate}T00:00:00Z`)) &&
    nonEmpty(receipt.reviewScope) &&
    receipt.disposition === 'approved'

  const candidateAdmissionReady = [
    sourcePinMatches,
    conversionDigestRecorded,
    sourceNodesRecorded,
    objectNamesPreserved,
    referenceFrameRecorded,
    unitScaleRecorded,
    transformationHistoryRecorded,
    allMacroTargetsReviewed,
    licenseRecorded,
    attributionRecorded,
    qualifiedReviewRecorded,
  ].every(Boolean)

  return {
    sourcePinMatches,
    conversionDigestRecorded,
    sourceNodesRecorded,
    objectNamesPreserved,
    referenceFrameRecorded,
    unitScaleRecorded,
    transformationHistoryRecorded,
    allMacroTargetsReviewed,
    licenseRecorded,
    attributionRecorded,
    qualifiedReviewRecorded,
    candidateAdmissionReady,
    mayPromoteSystemRootToShipped: false,
  }
}

export function articularConversionReceiptMayPromoteSystem(): false {
  return false
}

export const ARTICULAR_CONVERSION_RECEIPT_BOUNDARY =
  'A complete conversion receipt is necessary evidence for candidate admission only. It never proves anatomical correctness or system completeness by itself, and it cannot promote system:articular to shipped without the canonical macro closure gate and independent qualified review.' as const
