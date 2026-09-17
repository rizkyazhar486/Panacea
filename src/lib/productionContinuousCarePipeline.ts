import type { AiContextPolicy } from './aiContextPolicy.ts'
import type { ClinicalReviewLedger } from './clinicalReviewWorkflow.ts'
import { buildGovernedContextBundle } from './governedContextOrchestrator.ts'
import {
  evaluateHabitualCare,
  type HabitualCareRule,
} from './habitualCareEngine.ts'
import type { Vitals } from './healthVitals.ts'
import type { HealthStoreBridgeContext } from './healthStoreLongitudinalBridge.ts'
import type { LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import {
  syncProductionAppState,
  type ProductionAppStateSyncResult,
} from './productionAppStateLongitudinalSync.ts'
import type {
  ProductionHealthStoreScope,
  ProductionHealthStoreState,
} from './productionHealthStoreSelector.ts'
import type { PurposeConsentLedger } from './purposeConsentLedger.ts'
import {
  projectHabitualCareToWidgets,
  type InsightRouteConfig,
} from './superPageInsightProjection.ts'

export interface ProductionContinuousCareSyncRequest {
  state: LongitudinalPatientState
  appState: ProductionHealthStoreState
  subjectId: string
  scope: ProductionHealthStoreScope
  currentVitals?: Vitals
  bridgeContext: HealthStoreBridgeContext
  habitualRules: readonly HabitualCareRule[]
  routes: InsightRouteConfig
  purposeConsentLedger: PurposeConsentLedger
  clinicalReviewLedger: ClinicalReviewLedger
  aiPolicy: AiContextPolicy
  evaluatedAt: string
}

export interface ProductionContinuousCareSyncResult {
  state: LongitudinalPatientState
  production: ProductionAppStateSyncResult
  habitualCare: ReturnType<typeof evaluateHabitualCare>
  widgets: ReturnType<typeof projectHabitualCareToWidgets>
  governedContext: ReturnType<typeof buildGovernedContextBundle>
  orchestration: {
    productionStoreProjection: true
    eventDrivenCapable: true
    durableTransportImplementedHere: false
    autonomousClinicalCommitAllowed: false
  }
}

/**
 * Canonical production projection:
 *
 * existing Panacea AppState/shared vitals
 *   → subject-scoped longitudinal events
 *   → deterministic habitual-change evaluation
 *   → visual-first super-page widgets
 *   → clinician-review + purpose-consent governed AI context.
 *
 * This function deliberately does not subscribe to browser events, persist a
 * queue, sign an EMR entry, place an order, or initiate treatment. It remains
 * a pure replayable projection; an event-driven runtime may invoke it whenever
 * the existing Panacea data-update bus reports a relevant state change.
 */
export function runProductionContinuousCareSync(
  request: ProductionContinuousCareSyncRequest,
): ProductionContinuousCareSyncResult {
  if (!request.evaluatedAt || !Number.isFinite(Date.parse(request.evaluatedAt))) {
    throw new Error('evaluatedAt must be a valid ISO timestamp')
  }

  const production = syncProductionAppState({
    state: request.state,
    appState: request.appState,
    subjectId: request.subjectId,
    scope: request.scope,
    currentVitals: request.currentVitals,
    context: request.bridgeContext,
  })

  const habitualCare = evaluateHabitualCare(
    production.state,
    request.habitualRules,
    request.evaluatedAt,
  )
  const widgets = projectHabitualCareToWidgets(habitualCare, request.routes)
  const governedContext = buildGovernedContextBundle({
    state: production.state,
    purposeConsentLedger: request.purposeConsentLedger,
    clinicalReviewLedger: request.clinicalReviewLedger,
    aiPolicy: request.aiPolicy,
    at: request.evaluatedAt,
  })

  return {
    state: production.state,
    production,
    habitualCare,
    widgets,
    governedContext,
    orchestration: {
      productionStoreProjection: true,
      eventDrivenCapable: true,
      durableTransportImplementedHere: false,
      autonomousClinicalCommitAllowed: false,
    },
  }
}
