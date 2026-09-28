import {
  buildLongitudinalReplayFrame,
  materializeLongitudinalStateAt,
  type LongitudinalReplayClock,
} from './longitudinalReplay.ts'
import {
  filterStateByPurposeConsent,
  type PurposeConsentLedger,
} from './purposeConsentLedger.ts'
import { isConsentActive } from './panaceaLongitudinalState.ts'
import type {
  ConsentPurpose,
  LongitudinalEvent,
  LongitudinalPatientState,
  PanaceaSurface,
  ReviewState,
  SemanticState,
} from './panaceaLongitudinalState'

export type TwinEvidenceClass =
  | 'self-reported'
  | 'sensor-recorded'
  | 'clinical-record'
  | 'derived'
  | 'imported'
  | 'model-estimate'
  | 'simulated'
  | 'reference'
  | 'unknown'

export type TwinDisplayState =
  | 'recorded'
  | 'pending-review'
  | 'reviewed'
  | 'rejected'

export interface LongitudinalTwinSignal {
  eventId: string
  metric: string
  domain: LongitudinalEvent['domain']
  value: LongitudinalEvent['value']
  unit?: string
  recordedAt: string
  confidence: number
  evidenceClass: TwinEvidenceClass
  displayState: TwinDisplayState
  reviewState: ReviewState
  semanticState?: SemanticState
  provenance: LongitudinalEvent['provenance']
}

export interface LongitudinalTwinSnapshot {
  subjectId: string
  at: string
  clock: LongitudinalReplayClock
  surface: PanaceaSurface
  sourceRevision: number
  eventCount: number
  signals: readonly LongitudinalTwinSignal[]
  governance: {
    pendingClinicalReview: number
    blockedByConsent: number
    purposeConsentFilteredEvents: number
  }
  boundary: {
    patientSpecificSignals: true
    patientSpecificInternalGeometry: false
    referenceAtlasGeometryMayBeUsedForOrientationOnly: true
    diagnosticInferenceGenerated: false
    autonomousClinicalActionAllowed: false
    simulatedState: false
    speculativeSignalsSeparated: true
    simulatedInputSignalsPresent: boolean
    purposeConsentLedgerApplied: true
  }
}

function evidenceClass(event: LongitudinalEvent): TwinEvidenceClass {
  // Semantic truth state outranks transport/source channel. A simulated or
  // model-estimated event must never become a "clinical record" merely because
  // its provenance sourceKind is clinical-system.
  switch (event.semanticState) {
    case 'derived':
    case 'rule-output':
      return 'derived'
    case 'ai-draft':
    case 'model-estimated':
    case 'hypothesis':
      return 'model-estimate'
    case 'simulated':
    case 'counterfactual':
      return 'simulated'
    case 'reference':
      return 'reference'
    case 'stale':
    case 'unknown':
    case 'unsupported':
    case 'unavailable':
      return 'unknown'
  }

  switch (event.provenance.sourceKind) {
    case 'manual':
      return 'self-reported'
    case 'wearable':
    case 'device':
      return 'sensor-recorded'
    case 'clinical-system':
      return 'clinical-record'
    case 'derived':
      return 'derived'
    case 'import':
      return 'imported'
  }
}

function displayState(review: LongitudinalEvent['review']): TwinDisplayState {
  if (review.state === 'accepted') return 'reviewed'
  if (review.state === 'rejected') return 'rejected'
  if (review.state === 'pending') return 'pending-review'
  return 'recorded'
}

function consentPurposeForSurface(surface: PanaceaSurface): ConsentPurpose {
  if (surface === 'clinical' || surface === 'ai-emr') return 'clinical-support'
  if (surface === 'ai-chatbot') return 'ai-context'
  return 'personal-visualization'
}

/**
 * Build a governed patient-specific signal snapshot for a Digital Twin surface.
 *
 * The adapter stops at signal/state representation. It does not map reference
 * atlas geometry to patient-specific internal anatomy, infer diagnoses,
 * generate forecasts, or authorize clinical actions.
 */
export function buildLongitudinalTwinSnapshot(input: {
  state: LongitudinalPatientState
  consentLedger: PurposeConsentLedger
  at: string
  surface: PanaceaSurface
  clock?: LongitudinalReplayClock
}): LongitudinalTwinSnapshot {
  const purpose = consentPurposeForSurface(input.surface)
  const clock = input.clock ?? 'known'
  const atMs = Date.parse(input.at)
  if (!Number.isFinite(atMs)) throw new Error('twin snapshot time must be a valid timestamp')

  const temporalState = materializeLongitudinalStateAt(input.state, input.at, clock)
  const governedState = filterStateByPurposeConsent(
    temporalState,
    input.consentLedger,
    purpose,
    input.at,
  )

  const envelopeAuthorizedEventCount = Object.values(temporalState.eventsById)
    .filter((event) => isConsentActive(event.consent, purpose, atMs)).length
  const governedEventCount = Object.keys(governedState.eventsById).length

  const surfaceFrame = buildLongitudinalReplayFrame(temporalState, input.at, {
    clock,
    surface: input.surface,
  })
  const frame = buildLongitudinalReplayFrame(governedState, input.at, {
    clock,
    surface: input.surface,
  })

  if (!frame.governance || !surfaceFrame.governance) {
    throw new Error('governed replay frame is required for a patient digital twin snapshot')
  }

  const signals = frame.metrics.map((snapshot) => {
    const event = snapshot.latest
    return {
      eventId: event.id,
      metric: snapshot.metric,
      domain: snapshot.domain,
      value: event.value,
      unit: event.unit,
      recordedAt: event.recordedAt,
      confidence: event.confidence,
      evidenceClass: evidenceClass(event),
      displayState: displayState(event.review),
      reviewState: event.review.state,
      semanticState: event.semanticState,
      provenance: { ...event.provenance },
    } satisfies LongitudinalTwinSignal
  })

  return {
    subjectId: frame.subjectId,
    at: frame.at,
    clock: frame.clock,
    surface: input.surface,
    sourceRevision: input.state.revision,
    eventCount: frame.eventCount,
    signals,
    governance: {
      pendingClinicalReview: frame.governance.pendingClinicalReview,
      blockedByConsent: surfaceFrame.governance.blockedByConsent,
      purposeConsentFilteredEvents: Math.max(0, envelopeAuthorizedEventCount - governedEventCount),
    },
    boundary: {
      patientSpecificSignals: true,
      patientSpecificInternalGeometry: false,
      referenceAtlasGeometryMayBeUsedForOrientationOnly: true,
      diagnosticInferenceGenerated: false,
      autonomousClinicalActionAllowed: false,
      // This adapter generates no simulation. It may pass through explicitly
      // labeled simulated/counterfactual inputs on non-clinical surfaces.
      simulatedState: false,
      speculativeSignalsSeparated: true,
      simulatedInputSignalsPresent: signals.some((signal) => signal.evidenceClass === 'simulated'),
      purposeConsentLedgerApplied: true,
    },
  }
}

export function twinSignalByMetric(
  snapshot: LongitudinalTwinSnapshot,
  metric: string,
): LongitudinalTwinSignal | undefined {
  return snapshot.signals.find((signal) => signal.metric === metric.trim())
}
