import { materializeLongitudinalStateAt, type LongitudinalReplayClock } from './longitudinalReplay.ts'
import {
  filterStateByPurposeConsent,
  purposeConsentStatus,
  type PurposeConsentLedger,
} from './purposeConsentLedger.ts'
import {
  isConsentActive,
  type ConsentPurpose,
  type LongitudinalDomain,
  type LongitudinalEvent,
  type LongitudinalPatientState,
  type SemanticState,
} from './panaceaLongitudinalState.ts'

export type HumanObservabilityTruthClass =
  | 'observed'
  | 'derived'
  | 'model-estimate'
  | 'simulated'
  | 'reference'
  | 'unknown'

export interface HumanObservabilityObservation {
  eventId: string
  subjectId: string
  domain: LongitudinalDomain
  metric: string
  value: unknown
  unit?: string
  recordedAt: string
  confidence: number
  truthClass: HumanObservabilityTruthClass
  semanticState?: SemanticState
  provenance: LongitudinalEvent['provenance']
  review: LongitudinalEvent['review']
}

export interface HumanObservabilityExpectation {
  metric: string
  maxAgeMs: number
  required?: boolean
}

export interface HumanObservabilityGap {
  metric: string
  reason: 'missing' | 'stale'
  required: boolean
  maxAgeMs: number
  latestRecordedAt?: string
  ageMs?: number
}

export interface HumanObservabilityFrame {
  subjectId: string
  at: string
  clock: LongitudinalReplayClock
  purpose: ConsentPurpose
  sourceRevision: number
  observations: readonly HumanObservabilityObservation[]
  coverage: {
    observedDomains: readonly LongitudinalDomain[]
    observedMetrics: readonly string[]
    gaps: readonly HumanObservabilityGap[]
  }
  governance: {
    envelopeAuthorizedEventCount: number
    governedEventCount: number
    purposeConsentFilteredEvents: number
    ledgerAuthorized: boolean | null
    latestConsentDecisionId: string | null
  }
  boundary: {
    purposeConsentApplied: true
    futureKnowledgeExcluded: true
    covertCollectionAllowed: false
    crossSubjectFusionAllowed: false
    autonomousClinicalActionAllowed: false
    patientSpecificInternalAnatomyImplied: false
    missingDataMayBeFabricated: false
  }
}

function truthClassForEvent(event: LongitudinalEvent): HumanObservabilityTruthClass {
  switch (event.semanticState) {
    case 'derived':
    case 'rule-output':
      return 'derived'
    case 'ai-draft':
      return 'model-estimate'
    case 'simulated':
      return 'simulated'
    case 'reference':
      return 'reference'
    case 'unavailable':
      return 'unknown'
    case 'measured':
    case 'imported':
    case 'clinician-entered':
    case 'patient-reported':
    case 'clinician-reviewed':
      return 'observed'
    case undefined:
      return event.provenance.sourceKind === 'derived' ? 'derived' : 'observed'
  }
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function normalizeExpectations(expectations: readonly HumanObservabilityExpectation[]) {
  const byMetric = new Map<string, HumanObservabilityExpectation>()
  for (const expectation of expectations) {
    const metric = expectation.metric.trim()
    if (!metric) throw new Error('expectation.metric must not be blank')
    if (!Number.isFinite(expectation.maxAgeMs) || expectation.maxAgeMs <= 0) {
      throw new Error('expectation.maxAgeMs must be finite and positive')
    }
    if (byMetric.has(metric)) throw new Error(`duplicate observability expectation: ${metric}`)
    byMetric.set(metric, { ...expectation, metric, required: expectation.required ?? true })
  }
  return [...byMetric.values()]
}

/**
 * Materialize a purpose-authorized, time-aware observation frame.
 *
 * This function deliberately stops at governed observation/state representation.
 * It does not infer diagnosis, treatment, patient-specific internal anatomy or
 * permission to actuate a medical device.
 */
export function buildHumanObservabilityFrame(input: {
  state: LongitudinalPatientState
  consentLedger: PurposeConsentLedger
  purpose: ConsentPurpose
  at: string
  clock?: LongitudinalReplayClock
  expectations?: readonly HumanObservabilityExpectation[]
}): HumanObservabilityFrame {
  const atMs = parseIso(input.at, 'at')
  const clock = input.clock ?? 'known'
  const temporalState = materializeLongitudinalStateAt(input.state, input.at, clock)
  const governedState = filterStateByPurposeConsent(
    temporalState,
    input.consentLedger,
    input.purpose,
    input.at,
  )

  const temporalEvents = Object.values(temporalState.eventsById)
  const envelopeAuthorizedEventCount = temporalEvents
    .filter((event) => isConsentActive(event.consent, input.purpose, atMs))
    .length

  const observations = Object.values(governedState.eventsById)
    .sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id))
    .map((event) => ({
      eventId: event.id,
      subjectId: event.subjectId,
      domain: event.domain,
      metric: event.metric,
      value: event.value,
      unit: event.unit,
      recordedAt: event.recordedAt,
      confidence: event.confidence,
      truthClass: truthClassForEvent(event),
      semanticState: event.semanticState,
      provenance: { ...event.provenance },
      review: { ...event.review },
    } satisfies HumanObservabilityObservation))

  const observed = observations.filter((observation) => observation.truthClass === 'observed')
  const latestObservedByMetric = new Map<string, HumanObservabilityObservation>()
  for (const observation of observed) latestObservedByMetric.set(observation.metric, observation)

  const gaps = normalizeExpectations(input.expectations ?? [])
    .map<HumanObservabilityGap | null>((expectation) => {
      const latest = latestObservedByMetric.get(expectation.metric)
      if (!latest) {
        return {
          metric: expectation.metric,
          reason: 'missing',
          required: expectation.required ?? true,
          maxAgeMs: expectation.maxAgeMs,
        }
      }

      const ageMs = Math.max(0, atMs - Date.parse(latest.recordedAt))
      if (ageMs <= expectation.maxAgeMs) return null
      return {
        metric: expectation.metric,
        reason: 'stale',
        required: expectation.required ?? true,
        maxAgeMs: expectation.maxAgeMs,
        latestRecordedAt: latest.recordedAt,
        ageMs,
      }
    })
    .filter((gap): gap is HumanObservabilityGap => gap !== null)
    .sort((left, right) => left.metric.localeCompare(right.metric))

  const consent = purposeConsentStatus(
    input.consentLedger,
    input.state.subjectId,
    input.purpose,
    input.at,
  )

  const observedDomains = [...new Set(observed.map((observation) => observation.domain))].sort()
  const observedMetrics = [...new Set(observed.map((observation) => observation.metric))].sort()

  return {
    subjectId: input.state.subjectId,
    at: input.at,
    clock,
    purpose: input.purpose,
    sourceRevision: input.state.revision,
    observations,
    coverage: {
      observedDomains,
      observedMetrics,
      gaps,
    },
    governance: {
      envelopeAuthorizedEventCount,
      governedEventCount: observations.length,
      purposeConsentFilteredEvents: Math.max(0, envelopeAuthorizedEventCount - observations.length),
      ledgerAuthorized: consent.ledgerAuthorized,
      latestConsentDecisionId: consent.latestDecision?.id ?? null,
    },
    boundary: {
      purposeConsentApplied: true,
      futureKnowledgeExcluded: true,
      covertCollectionAllowed: false,
      crossSubjectFusionAllowed: false,
      autonomousClinicalActionAllowed: false,
      patientSpecificInternalAnatomyImplied: false,
      missingDataMayBeFabricated: false,
    },
  }
}

export function observationsByTruthClass(
  frame: HumanObservabilityFrame,
  truthClass: HumanObservabilityTruthClass,
) {
  return frame.observations.filter((observation) => observation.truthClass === truthClass)
}

export function observabilityGapForMetric(
  frame: HumanObservabilityFrame,
  metric: string,
) {
  return frame.coverage.gaps.find((gap) => gap.metric === metric.trim())
}
