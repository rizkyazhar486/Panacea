import type { LongitudinalEvent } from './panaceaLongitudinalState.ts'

export type AiEmrDraftSectionKey =
  | 'subjective'
  | 'objective'
  | 'assessment-context'
  | 'plan-draft'
  | 'follow-up'

export type AiEmrDraftStatus = 'draft' | 'review-requested' | 'reviewed' | 'rejected'

export interface AiEmrEvidenceRef {
  eventId: string
  metric: string
  recordedAt: string
  provenanceSourceId: string
  confidence: number
  reviewState: LongitudinalEvent['review']['state']
}

export interface AiEmrDraftSection {
  key: AiEmrDraftSectionKey
  text: string
  evidence: readonly AiEmrEvidenceRef[]
  generatedByAi: true
}

export interface AiEmrDraft {
  id: string
  subjectId: string
  createdAt: string
  updatedAt: string
  status: AiEmrDraftStatus
  sourceStateRevision: number
  sections: readonly AiEmrDraftSection[]
  clinicianReview?: {
    reviewerId: string
    reviewedAt: string
    outcome: 'accepted-for-signature' | 'rejected'
    note?: string
  }
  governance: {
    aiMayCommitToMedicalRecord: false
    aiMaySign: false
    aiMayPlaceOrders: false
    aiMayCommitMedicationChanges: false
    explicitHumanSignatureRequired: true
  }
}

export interface AiEmrDraftInput {
  id: string
  subjectId: string
  createdAt: string
  sourceStateRevision: number
  sections: readonly {
    key: AiEmrDraftSectionKey
    text: string
    evidenceEvents: readonly LongitudinalEvent[]
  }[]
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function normalizeEvidence(events: readonly LongitudinalEvent[]): AiEmrEvidenceRef[] {
  const seen = new Set<string>()
  const result: AiEmrEvidenceRef[] = []
  for (const event of events) {
    if (seen.has(event.id)) continue
    seen.add(event.id)
    result.push({
      eventId: event.id,
      metric: event.metric,
      recordedAt: event.recordedAt,
      provenanceSourceId: event.provenance.sourceId,
      confidence: event.confidence,
      reviewState: event.review.state,
    })
  }
  return result.sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.eventId.localeCompare(right.eventId))
}

function governance(): AiEmrDraft['governance'] {
  return {
    aiMayCommitToMedicalRecord: false,
    aiMaySign: false,
    aiMayPlaceOrders: false,
    aiMayCommitMedicationChanges: false,
    explicitHumanSignatureRequired: true,
  }
}

/**
 * Build an AI-authored EMR draft as a review artifact only.
 * Evidence references preserve event identity, provenance, confidence and review
 * state. The returned object is never a signed medical record, order, or
 * medication change and has no autonomous commit path.
 */
export function createAiEmrDraft(input: AiEmrDraftInput): AiEmrDraft {
  assertNonBlank(input.id, 'input.id')
  assertNonBlank(input.subjectId, 'input.subjectId')
  parseIso(input.createdAt, 'input.createdAt')
  if (!Number.isInteger(input.sourceStateRevision) || input.sourceStateRevision < 0) {
    throw new Error('input.sourceStateRevision must be a non-negative integer')
  }

  const seenSections = new Set<AiEmrDraftSectionKey>()
  const sections = input.sections.map((section) => {
    if (seenSections.has(section.key)) throw new Error(`duplicate draft section: ${section.key}`)
    seenSections.add(section.key)
    assertNonBlank(section.text, `section.${section.key}.text`)
    return {
      key: section.key,
      text: section.text.trim(),
      evidence: normalizeEvidence(section.evidenceEvents),
      generatedByAi: true as const,
    }
  })

  return {
    id: input.id.trim(),
    subjectId: input.subjectId.trim(),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    status: 'draft',
    sourceStateRevision: input.sourceStateRevision,
    sections,
    governance: governance(),
  }
}

export function requestAiEmrDraftReview(draft: AiEmrDraft, requestedAt: string): AiEmrDraft {
  parseIso(requestedAt, 'requestedAt')
  if (draft.status !== 'draft') throw new Error('only a draft can request review')
  return { ...draft, status: 'review-requested', updatedAt: requestedAt }
}

export function reviewAiEmrDraft(
  draft: AiEmrDraft,
  review: {
    reviewerId: string
    reviewedAt: string
    outcome: 'accepted-for-signature' | 'rejected'
    note?: string
  },
): AiEmrDraft {
  if (draft.status !== 'review-requested') throw new Error('draft must be review-requested before clinician review')
  assertNonBlank(review.reviewerId, 'review.reviewerId')
  const reviewedAt = parseIso(review.reviewedAt, 'review.reviewedAt')
  if (reviewedAt < Date.parse(draft.updatedAt)) throw new Error('review.reviewedAt must not precede the review request')

  return {
    ...draft,
    updatedAt: review.reviewedAt,
    status: review.outcome === 'accepted-for-signature' ? 'reviewed' : 'rejected',
    clinicianReview: {
      reviewerId: review.reviewerId.trim(),
      reviewedAt: review.reviewedAt,
      outcome: review.outcome,
      note: review.note?.trim() || undefined,
    },
    governance: governance(),
  }
}

export interface HumanSignatureHandoff {
  draftId: string
  subjectId: string
  reviewerId: string
  reviewedAt: string
  sectionCount: number
  evidenceEventIds: readonly string[]
  requiresExplicitHumanSignature: true
  committed: false
  signed: false
}

/**
 * Produce a handoff that a separate authenticated human-signature system may
 * consume. This function never signs or commits the record itself.
 */
export function buildHumanSignatureHandoff(draft: AiEmrDraft): HumanSignatureHandoff {
  if (draft.status !== 'reviewed' || draft.clinicianReview?.outcome !== 'accepted-for-signature') {
    throw new Error('draft is not clinician-reviewed and accepted for signature')
  }
  return {
    draftId: draft.id,
    subjectId: draft.subjectId,
    reviewerId: draft.clinicianReview.reviewerId,
    reviewedAt: draft.clinicianReview.reviewedAt,
    sectionCount: draft.sections.length,
    evidenceEventIds: [...new Set(draft.sections.flatMap((section) => section.evidence.map((item) => item.eventId)))],
    requiresExplicitHumanSignature: true,
    committed: false,
    signed: false,
  }
}
