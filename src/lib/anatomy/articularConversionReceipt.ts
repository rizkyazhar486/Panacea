import { ARTICULAR_SOURCE_CANDIDATE } from './articularSourceCandidate'

export type ArticularConversionReceiptStatus =
  | 'receipt-missing'
  | 'candidate-mismatch'
  | 'conversion-incomplete'
  | 'ready-for-qualified-review'

export interface ArticularConversionReceipt {
  upstreamRepository: string
  upstreamCommit: string
  upstreamPath: string
  upstreamBlobSha: string
  sourceFormat: 'FBX'
  targetFormat: 'GLB'
  convertedArtifactSha256: string
  sourceNodeCount: number
  sourceObjectNames: readonly string[]
  objectNamesPreserved: boolean
  transformationHistory: readonly string[]
  referenceFrameVerified: boolean
  licenseScopeVerified: boolean
}

export interface ArticularConversionReceiptEvaluation {
  status: ArticularConversionReceiptStatus
  candidateIdentityMatches: boolean
  convertedDigestValid: boolean
  sourceInventoryPresent: boolean
  objectNamesPreserved: boolean
  transformationHistoryPresent: boolean
  referenceFrameVerified: boolean
  licenseScopeVerified: boolean
  readyForQualifiedReview: boolean
  mayPromoteSystem: false
}

const SHA256_HEX = /^[a-f0-9]{64}$/i

function candidateIdentityMatches(receipt: ArticularConversionReceipt): boolean {
  return receipt.upstreamRepository === ARTICULAR_SOURCE_CANDIDATE.upstreamRepository
    && receipt.upstreamCommit === ARTICULAR_SOURCE_CANDIDATE.upstreamCommit
    && receipt.upstreamPath === ARTICULAR_SOURCE_CANDIDATE.upstreamPath
    && receipt.upstreamBlobSha === ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha
    && receipt.sourceFormat === ARTICULAR_SOURCE_CANDIDATE.sourceFormat
    && receipt.targetFormat === ARTICULAR_SOURCE_CANDIDATE.targetFormat
}

function sourceInventoryPresent(receipt: ArticularConversionReceipt): boolean {
  if (!Number.isInteger(receipt.sourceNodeCount) || receipt.sourceNodeCount <= 0) return false
  if (receipt.sourceObjectNames.length === 0) return false
  if (receipt.sourceObjectNames.some((name) => name.trim().length === 0)) return false
  return new Set(receipt.sourceObjectNames).size === receipt.sourceObjectNames.length
}

/**
 * Validate the receipt that a future Joints100 FBX -> GLB conversion must
 * produce before the artifact can even reach qualified anatomical review.
 *
 * This function validates provenance and conversion bookkeeping only. It does
 * not assert that conversion has happened today, does not validate anatomical
 * completeness, and cannot promote `system:articular` by itself.
 */
export function evaluateArticularConversionReceipt(
  receipt?: ArticularConversionReceipt,
): ArticularConversionReceiptEvaluation {
  if (!receipt) {
    return {
      status: 'receipt-missing',
      candidateIdentityMatches: false,
      convertedDigestValid: false,
      sourceInventoryPresent: false,
      objectNamesPreserved: false,
      transformationHistoryPresent: false,
      referenceFrameVerified: false,
      licenseScopeVerified: false,
      readyForQualifiedReview: false,
      mayPromoteSystem: false,
    }
  }

  const identityMatches = candidateIdentityMatches(receipt)
  const digestValid = SHA256_HEX.test(receipt.convertedArtifactSha256)
  const inventoryPresent = sourceInventoryPresent(receipt)
  const namesPreserved = receipt.objectNamesPreserved
  const historyPresent = receipt.transformationHistory.length > 0
    && receipt.transformationHistory.every((step) => step.trim().length > 0)
  const frameVerified = receipt.referenceFrameVerified
  const licenseVerified = receipt.licenseScopeVerified

  const readyForQualifiedReview = identityMatches
    && digestValid
    && inventoryPresent
    && namesPreserved
    && historyPresent
    && frameVerified
    && licenseVerified

  const status: ArticularConversionReceiptStatus = !identityMatches
    ? 'candidate-mismatch'
    : readyForQualifiedReview
      ? 'ready-for-qualified-review'
      : 'conversion-incomplete'

  return {
    status,
    candidateIdentityMatches: identityMatches,
    convertedDigestValid: digestValid,
    sourceInventoryPresent: inventoryPresent,
    objectNamesPreserved: namesPreserved,
    transformationHistoryPresent: historyPresent,
    referenceFrameVerified: frameVerified,
    licenseScopeVerified: licenseVerified,
    readyForQualifiedReview,
    mayPromoteSystem: false,
  }
}

/** Current repository truth: no reviewed conversion receipt has been admitted. */
export const CURRENT_ARTICULAR_CONVERSION_RECEIPT: ArticularConversionReceipt | undefined = undefined

export const CURRENT_ARTICULAR_CONVERSION_READINESS = evaluateArticularConversionReceipt(
  CURRENT_ARTICULAR_CONVERSION_RECEIPT,
)

export function articularConversionReceiptMayPromoteSystem(): false {
  return false
}

export const ARTICULAR_CONVERSION_RECEIPT_BOUNDARY =
  'No articular conversion receipt is currently admitted. A future receipt must pin the exact Joints100 source identity, converted SHA-256 digest, preserved non-empty source-node inventory, transformation history, canonical reference-frame verification, and exact license-scope review before qualified anatomical review can begin. Receipt readiness never by itself marks system:articular shipped.' as const
