export const SENSORY_DOMAINS = ['vision','hearing','vestibular','olfaction','gustation','somatosensation'] as const
export type SensoryDomain = typeof SENSORY_DOMAINS[number]
export type SensoryEvidenceStatus = 'unverified' | 'verified-source'

export interface SensoryHumanReview {
  reviewer: string
  reviewedAt: string
  scope: string
}

export interface SensoryClaimPublicationState {
  evidenceStatus: SensoryEvidenceStatus
  humanReview: SensoryHumanReview | null
}

export const sensoryClaimBoundary =
  'Educational organ/system content only. A sensory claim remains unpublished until its source is verified and a real qualified human review with reviewer, date, and scope is recorded. This contract does not establish anatomical accuracy, clinical validity, diagnostic performance, or patient-specific anatomy, diagnosis, lesion localization, imaging interpretation, or treatment.'

export function canPublishSensoryClaim(state: SensoryClaimPublicationState): boolean {
  if (state.evidenceStatus !== 'verified-source' || state.humanReview === null) return false
  const { reviewer, reviewedAt, scope } = state.humanReview
  return reviewer.trim().length > 0 && reviewedAt.trim().length > 0 && scope.trim().length > 0
}
