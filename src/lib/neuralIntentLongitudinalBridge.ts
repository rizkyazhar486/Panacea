import {
  validateIntentEvent,
  type IntentEvent,
  type IntentPurpose,
  type IntentSourceKind,
} from './neuralIntent'
import {
  ingestLongitudinalEvent,
  type ConsentEnvelope,
  type ConsentPurpose,
  type LongitudinalEvent,
  type LongitudinalPatientState,
  type LongitudinalProvenance,
} from './panaceaLongitudinalState'

export type IntentBridgeSkipReason = 'rejected-intent'

export interface IntentBridgeContext {
  /**
   * Kepercayaan terhadap proses ingest/adapter, diberikan pemanggil.
   * Bukan probabilitas diagnosis, niat benar, kapasitas motorik, atau hasil terapi.
   */
  confidence: number
}

export interface IntentLongitudinalValue {
  action: IntentEvent['action']
  customLabel?: string
  effector: IntentEvent['effector']
  evidenceClass: IntentEvent['evidenceClass']
  intentStatus: IntentEvent['status']
  sourceKind: IntentEvent['source']['kind']
  decoderConfidence?: number
  signalQuality?: number
  displayConfidence?: number
}

export type IntentBridgeResult =
  | { status: 'mapped'; event: LongitudinalEvent<IntentLongitudinalValue> }
  | { status: 'skipped'; reason: IntentBridgeSkipReason }

const PURPOSE_MAP: Readonly<Partial<Record<IntentPurpose, ConsentPurpose>>> = {
  'personal-visualization': 'personal-visualization',
  'clinical-support': 'clinical-support',
  'ai-context': 'ai-context',
  'rehab-tracking': 'rehab-tracking',
}

function provenanceKind(source: IntentSourceKind): LongitudinalProvenance['sourceKind'] {
  switch (source) {
    case 'explicit-touch':
    case 'rehab-task':
      return 'manual'
    case 'voice-aac':
    case 'motion-observation':
      return 'device'
    case 'bci-decoder':
    case 'simulation':
      return 'derived'
  }
}

function consentEnvelope(event: IntentEvent): ConsentEnvelope {
  let purposes = event.consent.purposes
    .map((purpose) => PURPOSE_MAP[purpose])
    .filter((purpose): purpose is ConsentPurpose => Boolean(purpose))

  // Simulasi tidak boleh bocor ke konteks klinis/AI walaupun envelope intent
  // asal diberi purpose terlalu luas. Ia tetap boleh dipakai untuk visualisasi
  // dan tracking latihan/rehab yang jelas diberi label simulated.
  if (event.evidenceClass === 'simulated') {
    purposes = purposes.filter(
      (purpose) => purpose !== 'clinical-support' && purpose !== 'ai-context',
    )
  }

  return {
    granted: event.consent.granted,
    purposes: [...new Set(purposes)],
    grantedAt: event.consent.grantedAt,
    expiresAt: event.consent.expiresAt,
    revokedAt: event.consent.revokedAt,
  }
}

function bridgeTags(event: IntentEvent): string[] {
  const tags = new Set<string>([
    'neural-intent',
    `intent:evidence:${event.evidenceClass}`,
    `intent:source:${event.source.kind}`,
    `intent:status:${event.status}`,
    `intent:action:${event.action}`,
    `intent:effector:${event.effector}`,
    ...event.tags,
  ])

  if (event.source.decoderId) tags.add(`intent:decoder-id:${event.source.decoderId}`)
  if (event.source.decoderVersion) tags.add(`intent:decoder-version:${event.source.decoderVersion}`)
  if (event.source.scope) tags.add(`intent:scope:${event.source.scope}`)
  return [...tags]
}

/**
 * Memetakan IntentEvent ke event longitudinal canonical tanpa mengubah arti
 * evidence. Explicit/observed/decoded tetap membutuhkan clinical review untuk
 * permukaan Clinical/AI-EMR karena domain `intent` review-gated di kernel.
 *
 * Simulated intent tidak pernah memperoleh purpose clinical-support/ai-context.
 * Status rejected tidak ditulis ke state longitudinal sama sekali.
 */
export function intentToLongitudinalEvent(
  intent: IntentEvent,
  context: IntentBridgeContext,
): IntentBridgeResult {
  validateIntentEvent(intent)
  if (!Number.isFinite(context.confidence) || context.confidence < 0 || context.confidence > 1) {
    throw new Error('context.confidence must be a finite value in [0, 1]')
  }
  if (intent.status === 'rejected') return { status: 'skipped', reason: 'rejected-intent' }

  const review = intent.evidenceClass === 'simulated'
    ? { state: 'not-required' as const }
    : { state: 'pending' as const }

  const value: IntentLongitudinalValue = {
    action: intent.action,
    customLabel: intent.customLabel,
    effector: intent.effector,
    evidenceClass: intent.evidenceClass,
    intentStatus: intent.status,
    sourceKind: intent.source.kind,
    decoderConfidence: intent.decoderConfidence,
    signalQuality: intent.signalQuality,
    displayConfidence: intent.displayConfidence,
  }

  return {
    status: 'mapped',
    event: {
      id: `intent:${intent.id}`,
      subjectId: intent.subjectId,
      domain: 'intent',
      metric: `intent:${intent.action}`,
      value,
      recordedAt: intent.capturedAt,
      confidence: context.confidence,
      provenance: {
        sourceKind: provenanceKind(intent.source.kind),
        sourceId: intent.source.sourceId,
        capturedAt: intent.capturedAt,
        receivedAt: intent.receivedAt,
        method: [
          'neural-intent',
          intent.source.kind,
          intent.source.method,
          intent.source.decoderId ? `decoder:${intent.source.decoderId}` : undefined,
        ].filter(Boolean).join('|'),
        version: intent.source.decoderVersion ?? intent.source.version,
      },
      consent: consentEnvelope(intent),
      review,
      tags: bridgeTags(intent),
    },
  }
}

export function ingestIntentIntoLongitudinalState(
  state: LongitudinalPatientState,
  intent: IntentEvent,
  context: IntentBridgeContext,
) {
  const mapped = intentToLongitudinalEvent(intent, context)
  if (mapped.status === 'skipped') {
    return { state, status: 'skipped' as const, reason: mapped.reason }
  }
  const ingested = ingestLongitudinalEvent(state, mapped.event)
  return {
    state: ingested.state,
    status: ingested.status,
    event: mapped.event,
  }
}

export const neuralIntentLongitudinalBoundary = {
  duplicatePatientStateStoreAllowed: false,
  patientSpecificDiagnosisAllowed: false,
  autonomousClinicalActionAllowed: false,
  simulatedClinicalContextAllowed: false,
  clinicalReviewRequiredForNonSimulatedIntent: true,
} as const
