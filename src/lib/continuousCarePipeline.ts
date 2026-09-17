import {
  buildContextPacket,
  ingestLongitudinalBatch,
  type ConsentEnvelope,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'
import {
  evaluateHabitualCare,
  type HabitualCareRule,
} from './habitualCareEngine.ts'
import {
  normalizeWearableBatch,
  type WearableSample,
} from './wearableSignalAdapters.ts'
import {
  projectHabitualCareToWidgets,
  type InsightRouteConfig,
} from './superPageInsightProjection.ts'

export interface ContinuousCareSyncRequest {
  state: LongitudinalPatientState
  wearableSamples: readonly WearableSample[]
  consent: ConsentEnvelope
  habitualRules: readonly HabitualCareRule[]
  routes: InsightRouteConfig
  evaluatedAt: string
}

export interface ContinuousCareSyncResult {
  state: LongitudinalPatientState
  normalizedEventCount: number
  insertedEventCount: number
  duplicateEventCount: number
  habitualCare: ReturnType<typeof evaluateHabitualCare>
  widgets: ReturnType<typeof projectHabitualCareToWidgets>
  aiChatbotContext: ReturnType<typeof buildContextPacket>
  aiEmrContext: ReturnType<typeof buildContextPacket>
  orchestration: {
    eventDriven: true
    nearRealTimeCapableWhenSourceSupportsIt: true
    durableTransportImplementedHere: false
    autonomousClinicalCommitAllowed: false
  }
}

/**
 * One deterministic integration path for already-authorized wearable samples:
 * normalize → idempotent longitudinal ingest → habitual change evaluation →
 * visual-first super-page widgets → AI Chatbot/AI-EMR context packets.
 *
 * This core function is synchronous and transport-agnostic. Near-real-time
 * behavior depends on an upstream provider delivering samples promptly; it does
 * not imply background polling, provider OAuth, durable queues, or network retry.
 */
export function runContinuousCareSync(request: ContinuousCareSyncRequest): ContinuousCareSyncResult {
  const normalized = normalizeWearableBatch(request.wearableSamples, { consent: request.consent })
  const revisionBefore = request.state.revision
  const nextState = ingestLongitudinalBatch(request.state, normalized)
  const insertedEventCount = nextState.revision - revisionBefore
  const duplicateEventCount = normalized.length - insertedEventCount

  const habitualCare = evaluateHabitualCare(
    nextState,
    request.habitualRules,
    request.evaluatedAt,
  )
  const widgets = projectHabitualCareToWidgets(habitualCare, request.routes)

  return {
    state: nextState,
    normalizedEventCount: normalized.length,
    insertedEventCount,
    duplicateEventCount,
    habitualCare,
    widgets,
    aiChatbotContext: buildContextPacket(nextState, 'ai-chatbot', request.evaluatedAt),
    aiEmrContext: buildContextPacket(nextState, 'ai-emr', request.evaluatedAt),
    orchestration: {
      eventDriven: true,
      nearRealTimeCapableWhenSourceSupportsIt: true,
      durableTransportImplementedHere: false,
      autonomousClinicalCommitAllowed: false,
    },
  }
}
