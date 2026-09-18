import {
  buildLongitudinalReplayFrame,
  type LongitudinalReplayClock,
} from './longitudinalReplay'
import {
  filterStateByPurposeConsent,
  type PurposeConsentLedger,
} from './purposeConsentLedger'
import type {
  ConsentPurpose,
  LongitudinalEvent,
  LongitudinalPatientState,
  PanaceaSurface,
  ReviewState,
} from './panaceaLongitudinalState'

export type TwinEvidenceClass =
  | 'self-reported'
  | 'sensor-recorded'
  | 'clinical-record'
  | 'derived'
  | 'imported'

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
    purposeConsentLedgerApplied: true
  }
}

function evidenceClass(event: LongitudinalEvent): TwinEvidenceClass {
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
 * Build a governed, patient-specific signal snapshot for a Digital Twin surface.
 *
 * This adapter deliberately stops at signal/state representation. It does not
 * map generic atlas geometry to patient-specific internal anatomy, infer a
 * diagnosis, create a forecast, or authorize clinical action.
 *
 * Both governance layers are mandatory:
 * 1) capture-time ConsentEnvelope + clinician review through surface replay;
 * 2) purpose-specific grant/revoke history through PurposeConsentLedger.
 *
 * Callers therefore cannot construct a patient twin from raw longitudinal
 * events without supplying the canonical purpose-consent ledger.
 */
export function buildLongitudinalTwinSnapshot(input: {
  state: LongitudinalPatientState
  consentLedger: PurposeConsentLedger
  at: string
  surface: PanaceaSurface
  clock?: LongitudinalReplayClock
}): LongitudinalTwinSnapshot {
  const purpose = consentPurposeForSurface(input.surface)
  const governedState = filterStateByPurposeConsent(
    input.state,
    input.consentLedger,
    purpose,
    input.at,
  )
  const sourceEventCount = Object.keys(input.state.eventsById).length
  const governedEventCount = Object.keys(governedState.eventsById).length

  const frame = buildLongitudinalReplayFrame(governedState, input.at, {
    clock: input.clock ?? 'known',
    surface: input.surface,
  })

  if (!frame.governance) {
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
      provenance: { ...event.provenance },
    } satisfies LongitudinalTwinSignal
  })

  return {
    subjectId: frame.subjectId,
    at: frame.at,
    clock: frame.clock,
    surface: input.surface,
    sourceRevision: frame.sourceRevision,
    eventCount: frame.eventCount,
    signals,
    governance: {
      pendingClinicalReview: frame.governance.pendingClinicalReview,
      blockedByConsent: frame.governance.blockedByConsent,
      purposeConsentFilteredEvents: sourceEventCount - governedEventCount,
    },
    boundary: {
      patientSpecificSignals: true,
      patientSpecificInternalGeometry: false,
      referenceAtlasGeometryMayBeUsedForOrientationOnly: true,
      diagnosticInferenceGenerated: false,
      autonomousClinicalActionAllowed: false,
      simulatedState: false,
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
