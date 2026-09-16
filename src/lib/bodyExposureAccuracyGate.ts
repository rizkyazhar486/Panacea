import { WHOLE_BODY_REGIONS, type GeometryProvenance } from './wholeBodyAtlasBlueprint.ts'

export interface QualifiedAnatomyReview {
  reviewerId: string
  credentials: string
  reviewedAt: string
  scope: string
  totalStructures: number
  reviewedStructures: number
  acceptedStructures: number
  unresolvedMajorFindings: number
  sourceReferenceIds: readonly string[]
}

export interface AnatomyAccuracyGateResult {
  threshold: 0.92
  accuracyFraction: number | null
  reviewCoverageFraction: number
  fullyReviewed: boolean
  hasQualifiedReviewerMetadata: boolean
  hasSourceReferences: boolean
  unresolvedMajorFindings: number
  pass: boolean
  reasons: readonly string[]
}

function parseIso(value: string) {
  return Number.isFinite(Date.parse(value))
}

function nonBlank(value: string) {
  return Boolean(value.trim())
}

/**
 * Geometry provenance is an inventory, not an accuracy score.
 * RepresentationScore = (native + 0.5 × adjacent) / total is exposed only as
 * implementation maturity: adjacent geometry receives partial credit because a
 * nearby/teaching representation exists, not because it is anatomically accurate.
 */
export function auditWholeBodyGeometryProvenance() {
  const structures = WHOLE_BODY_REGIONS.flatMap((region) =>
    region.structures.map((structure) => ({ ...structure, region: region.key })),
  )
  const count = (provenance: GeometryProvenance) => structures.filter((structure) => structure.provenance === provenance).length
  const native = count('native-geometry')
  const adjacent = count('adjacent-geometry')
  const notRepresented = count('not-represented')
  const total = structures.length

  const byRegion = WHOLE_BODY_REGIONS.map((region) => {
    const regionNative = region.structures.filter((structure) => structure.provenance === 'native-geometry').length
    const regionAdjacent = region.structures.filter((structure) => structure.provenance === 'adjacent-geometry').length
    const regionNotRepresented = region.structures.filter((structure) => structure.provenance === 'not-represented').length
    const regionTotal = region.structures.length
    return {
      region: region.key,
      total: regionTotal,
      native: regionNative,
      adjacent: regionAdjacent,
      notRepresented: regionNotRepresented,
      representationScore: regionTotal ? (regionNative + 0.5 * regionAdjacent) / regionTotal : 0,
    }
  })

  return {
    total,
    native,
    adjacent,
    notRepresented,
    representationScore: total ? (native + 0.5 * adjacent) / total : 0,
    adjacentStructureIds: structures.filter((structure) => structure.provenance === 'adjacent-geometry').map((structure) => structure.id),
    missingStructureIds: structures.filter((structure) => structure.provenance === 'not-represented').map((structure) => structure.id),
    byRegion,
    boundary: {
      representationScoreIsNotAnatomicalAccuracy: true as const,
      representationScoreIsNotHumanReview: true as const,
    },
  }
}

/**
 * Anatomical accuracy may only be claimed from an explicit qualified review.
 * AccuracyFraction = accepted reviewed structures / reviewed structures.
 * The requested gold-standard gate is >= 0.92, but this implementation also
 * requires 100% declared scope review, source references and zero unresolved
 * major findings; geometry/provenance alone can never pass this gate.
 */
export function evaluateAnatomyAccuracyGate(review: QualifiedAnatomyReview): AnatomyAccuracyGateResult {
  const reasons: string[] = []
  const countsValid = Number.isInteger(review.totalStructures) && review.totalStructures > 0
    && Number.isInteger(review.reviewedStructures) && review.reviewedStructures >= 0
    && Number.isInteger(review.acceptedStructures) && review.acceptedStructures >= 0
    && review.reviewedStructures <= review.totalStructures
    && review.acceptedStructures <= review.reviewedStructures
    && Number.isInteger(review.unresolvedMajorFindings) && review.unresolvedMajorFindings >= 0
  if (!countsValid) throw new Error('review structure/finding counts are invalid')

  const hasQualifiedReviewerMetadata = nonBlank(review.reviewerId)
    && nonBlank(review.credentials)
    && nonBlank(review.scope)
    && parseIso(review.reviewedAt)
  const hasSourceReferences = review.sourceReferenceIds.some(nonBlank)
  const reviewCoverageFraction = review.reviewedStructures / review.totalStructures
  const fullyReviewed = review.reviewedStructures === review.totalStructures
  const accuracyFraction = review.reviewedStructures > 0
    ? review.acceptedStructures / review.reviewedStructures
    : null

  if (!hasQualifiedReviewerMetadata) reasons.push('qualified reviewer identity, credentials, date and scope are required')
  if (!hasSourceReferences) reasons.push('at least one explicit source reference is required')
  if (!fullyReviewed) reasons.push('declared review scope is not fully reviewed')
  if (accuracyFraction === null || accuracyFraction < 0.92) reasons.push('accepted reviewed structures are below the 0.92 gate')
  if (review.unresolvedMajorFindings > 0) reasons.push('unresolved major anatomical findings remain')

  return {
    threshold: 0.92,
    accuracyFraction,
    reviewCoverageFraction,
    fullyReviewed,
    hasQualifiedReviewerMetadata,
    hasSourceReferences,
    unresolvedMajorFindings: review.unresolvedMajorFindings,
    pass: reasons.length === 0,
    reasons,
  }
}
