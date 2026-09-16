import type { MinimizedAiContext, MinimizedAiSignal } from './aiContextPolicy.ts'

export interface ChatClinicalEvidenceRef {
  metric: string
  domain: string
  recordedAt: string
  sourceId: string
  sourceKind: string
  confidence: number
  reviewState: string
}

export interface ChatClinicalHandoff {
  id: string
  subjectId: string
  createdAt: string
  userIntent: string
  evidence: readonly ChatClinicalEvidenceRef[]
  evidenceCoverageFraction: number
  pendingOrUnreviewedClinicalSignals: number
  blockedClinicalAssertionCount: number
  conversationInstruction: string
  governance: {
    answerMayCiteEvidence: true
    answerMayPresentPendingClinicalDataAsVerified: false
    answerMayAutonomouslyDiagnose: false
    answerMayAutonomouslyPrescribe: false
    answerMayAutonomouslyCommitToEmr: false
    clinicianReviewRequiredForClinicalCommit: true
  }
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function clinicalSignal(signal: MinimizedAiSignal) {
  return ['lab', 'symptom', 'medication', 'clinical-note'].includes(signal.domain)
}

/**
 * Convert minimum-necessary AI context into a conversational handoff.
 * `EvidenceCoverage = signals carrying sourceId / included signals`.
 * This is traceability coverage only, not evidence strength or clinical certainty.
 */
export function buildChatClinicalHandoff(
  id: string,
  userIntent: string,
  context: MinimizedAiContext,
): ChatClinicalHandoff {
  assertNonBlank(id, 'id')
  assertNonBlank(userIntent, 'userIntent')

  const evidence = context.signals.map((signal) => ({
    metric: signal.metric,
    domain: signal.domain,
    recordedAt: signal.recordedAt,
    sourceId: signal.sourceId,
    sourceKind: signal.sourceKind,
    confidence: signal.confidence,
    reviewState: signal.reviewState,
  }))
  const withSource = evidence.filter((item) => item.sourceId.trim()).length
  const pendingOrUnreviewedClinicalSignals = context.signals.filter((signal) => {
    return clinicalSignal(signal) && signal.reviewState !== 'accepted'
  }).length

  return {
    id: id.trim(),
    subjectId: context.subjectId,
    createdAt: context.generatedAt,
    userIntent: userIntent.trim(),
    evidence,
    evidenceCoverageFraction: evidence.length ? withSource / evidence.length : 1,
    pendingOrUnreviewedClinicalSignals,
    blockedClinicalAssertionCount: pendingOrUnreviewedClinicalSignals,
    conversationInstruction: pendingOrUnreviewedClinicalSignals > 0
      ? 'Answer with the available minimum-necessary context, cite source/provenance metadata when relevant, and label pending or unreviewed clinical signals as unverified context. Do not convert them into a diagnosis, prescription, order, or signed medical-record fact.'
      : 'Answer with the available minimum-necessary context and cite source/provenance metadata when relevant. Clinical recommendations remain informational until reviewed by the responsible clinician.',
    governance: {
      answerMayCiteEvidence: true,
      answerMayPresentPendingClinicalDataAsVerified: false,
      answerMayAutonomouslyDiagnose: false,
      answerMayAutonomouslyPrescribe: false,
      answerMayAutonomouslyCommitToEmr: false,
      clinicianReviewRequiredForClinicalCommit: true,
    },
  }
}
