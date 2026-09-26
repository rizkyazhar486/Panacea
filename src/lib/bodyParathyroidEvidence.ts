export type ParathyroidEvidenceRole = 'physiology-reference'
export type ParathyroidReviewState = 'draft' | 'source-checked' | 'human-reviewed'

export interface ParathyroidEvidenceRecord {
  sourceId: string
  sourceType: 'peer-reviewed-review'
  sourceLocator: string
  accessedOrReviewedAt: string
  claimScope: string
  evidenceRole: ParathyroidEvidenceRole
  reviewState: ParathyroidReviewState
}

export const PARATHYROID_EVIDENCE: readonly ParathyroidEvidenceRecord[] = [
  {
    sourceId: 'pubmed-29597231',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:29597231; DOI:10.1159/000486060',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: 'Extracellular calcium sensing by parathyroid CaSR participates in feedback regulation of PTH secretion and calcium homeostasis.',
    evidenceRole: 'physiology-reference',
    reviewState: 'source-checked',
  },
] as const

export const PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS = [
  {
    id: 'parathyroid-calcium-pth-feedback',
    sourceIds: ['pubmed-29597231'] as const,
    teachingClaim: 'Extracellular calcium sensing through the calcium-sensing receptor participates in feedback regulation of parathyroid hormone secretion.',
    boundary: 'Generic educational physiology only; no person-level hormone concentration, calcium value, feedback magnitude, measured endocrine function, or patient-specific inference is represented.',
  },
] as const

export function validateParathyroidEvidence() {
  const evidenceIds = new Set(PARATHYROID_EVIDENCE.map((item) => item.sourceId))
  return {
    unresolvedEvidence: PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS.filter((relationship) =>
      relationship.sourceIds.length === 0 || relationship.sourceIds.some((sourceId) => !evidenceIds.has(sourceId)),
    ),
    invalidClaimScopes: PARATHYROID_EVIDENCE.filter((item) => item.claimScope.trim().length < 40),
    falseHumanReview: PARATHYROID_EVIDENCE.filter((item) => item.reviewState === 'human-reviewed'),
    boundaryMissing: PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS.filter((relationship) => relationship.boundary.trim().length < 40),
  }
}
