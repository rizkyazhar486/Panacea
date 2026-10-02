import type { MinimizedAiContext } from './aiContextPolicy.ts'

export interface AiContextAuditRecord {
  schemaVersion: 'panacea.ai-context-audit.v1'
  subjectId: string
  generatedAt: string
  stateRevision: number
  purpose: 'ai-context'
  includedSignals: number
  omittedSignals: {
    expiredByAge: number
    outsideDomainPolicy: number
    capacity: number
    rawClinicalNotesRedacted: number
  }
  sourceKinds: readonly string[]
  reviewStates: readonly string[]
  governance: {
    minimumNecessaryContext: true
    rawClinicalNoteRedactionObserved: boolean
    autonomousClinicalCommitAllowed: false
  }
}

/**
 * Produces a metadata-only audit receipt for an AI context packet.
 *
 * Deliberately excludes metric names, values, source IDs and raw notes so the
 * observability trail can prove how context was governed without duplicating
 * patient content into telemetry or logs.
 */
export function buildAiContextAuditRecord(context: MinimizedAiContext): AiContextAuditRecord {
  const sourceKinds = [...new Set(context.signals.map((signal) => signal.sourceKind))].sort()
  const reviewStates = [...new Set(context.signals.map((signal) => signal.reviewState))].sort()

  return {
    schemaVersion: 'panacea.ai-context-audit.v1',
    subjectId: context.subjectId,
    generatedAt: context.generatedAt,
    stateRevision: context.stateRevision,
    purpose: 'ai-context',
    includedSignals: context.signals.length,
    omittedSignals: { ...context.omitted },
    sourceKinds,
    reviewStates,
    governance: {
      minimumNecessaryContext: true,
      rawClinicalNoteRedactionObserved: context.omitted.rawClinicalNotesRedacted > 0,
      autonomousClinicalCommitAllowed: false,
    },
  }
}
