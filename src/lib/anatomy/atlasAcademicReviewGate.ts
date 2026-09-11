import type { AtlasProvenance, AtlasReviewStatus } from './atlasKernel'

export type AtlasAcademicReviewDisposition = 'approved' | 'changes-required'

export interface QualifiedAtlasAcademicReviewRecord {
  reviewerName: string
  reviewerCredentials: string
  reviewDate: string
  reviewScope: string
  disposition: AtlasAcademicReviewDisposition
  limitations?: string
}

export type AtlasProvenanceWithAcademicReview = AtlasProvenance & {
  qualifiedAcademicReview?: QualifiedAtlasAcademicReviewRecord
}

export interface AtlasAcademicReviewValidation {
  reviewStatus: AtlasReviewStatus
  reviewClaimValid: boolean
  academicPublicationAllowed: boolean
  reasons: readonly string[]
}

function nonBlank(value: string | undefined) {
  return Boolean(value?.trim())
}

function isValidIsoCalendarDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

/**
 * Fail-closed academic-review evidence boundary.
 *
 * Deterministic engineering curation, source-node matching, CI success, or an
 * `engineering-reviewed` label never satisfy qualified human academic review.
 * `academic-reviewed` is accepted only when a named qualified reviewer record
 * carries credentials, a real calendar date, an explicit review scope, and a
 * disposition. Publication additionally requires disposition `approved`.
 */
export function validateAtlasAcademicReviewEvidence(
  provenance: AtlasProvenanceWithAcademicReview,
): AtlasAcademicReviewValidation {
  const reasons: string[] = []
  const review = provenance.qualifiedAcademicReview

  if (provenance.reviewStatus !== 'academic-reviewed') {
    return {
      reviewStatus: provenance.reviewStatus,
      reviewClaimValid: true,
      academicPublicationAllowed: false,
      reasons,
    }
  }

  if (!review) {
    reasons.push('academic-reviewed requires a qualified academic review record.')
  } else {
    if (!nonBlank(review.reviewerName)) reasons.push('Qualified reviewer name is required.')
    if (!nonBlank(review.reviewerCredentials)) reasons.push('Qualified reviewer credentials are required.')
    if (!isValidIsoCalendarDate(review.reviewDate)) reasons.push('Qualified review date must be a valid YYYY-MM-DD calendar date.')
    if (!nonBlank(review.reviewScope)) reasons.push('Qualified review scope is required.')
    if (review.disposition !== 'approved' && review.disposition !== 'changes-required') {
      reasons.push('Qualified review disposition must be approved or changes-required.')
    }
  }

  const reviewClaimValid = reasons.length === 0
  return {
    reviewStatus: provenance.reviewStatus,
    reviewClaimValid,
    academicPublicationAllowed: reviewClaimValid && review?.disposition === 'approved',
    reasons,
  }
}
