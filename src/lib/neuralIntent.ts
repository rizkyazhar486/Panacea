export type IntentSourceKind =
  | 'explicit-touch'
  | 'voice-aac'
  | 'motion-observation'
  | 'rehab-task'
  | 'bci-decoder'
  | 'simulation'

export type IntentEvidenceClass = 'explicit' | 'observed' | 'decoded' | 'simulated'

export type IntentAction =
  | 'communicate'
  | 'speak'
  | 'gesture'
  | 'reach'
  | 'grasp'
  | 'release'
  | 'point'
  | 'nod'
  | 'turn-head'
  | 'move-upper-limb'
  | 'move-lower-limb'
  | 'custom'

export type IntentEffector =
  | 'speech-orofacial'
  | 'head-neck'
  | 'left-upper-limb'
  | 'right-upper-limb'
  | 'bilateral-upper-limb'
  | 'left-lower-limb'
  | 'right-lower-limb'
  | 'bilateral-lower-limb'
  | 'whole-body'
  | 'other'

export type IntentPurpose =
  | 'personal-visualization'
  | 'rehab-tracking'
  | 'clinical-support'
  | 'ai-context'

export interface IntentSource {
  kind: IntentSourceKind
  sourceId: string
  version?: string
  decoderId?: string
  decoderVersion?: string
  method?: string
  scope?: 'patient-specific' | 'generic-simulation' | 'imported-research'
}

export interface IntentConsent {
  granted: boolean
  purposes: readonly IntentPurpose[]
  grantedAt: string
  expiresAt?: string
  revokedAt?: string
}

export interface IntentEvent {
  id: string
  subjectId: string
  action: IntentAction
  customLabel?: string
  effector: IntentEffector
  evidenceClass: IntentEvidenceClass
  source: IntentSource
  capturedAt: string
  receivedAt: string
  decoderConfidence?: number
  signalQuality?: number
  displayConfidence?: number
  consent: IntentConsent
  status: 'candidate' | 'confirmed' | 'rejected'
  tags: readonly string[]
}

export interface DigitalBodyIntentProjection {
  eventId: string
  action: IntentAction
  customLabel?: string
  effector: IntentEffector
  state: 'intended' | 'observed' | 'decoded-candidate' | 'simulated'
  confidence?: number
  capturedAt: string
  sourceKind: IntentSourceKind
}

const EVIDENCE_BY_SOURCE: Readonly<Record<IntentSourceKind, readonly IntentEvidenceClass[]>> = {
  'explicit-touch': ['explicit'],
  'voice-aac': ['explicit'],
  'motion-observation': ['observed'],
  'rehab-task': ['explicit', 'observed'],
  'bci-decoder': ['decoded'],
  simulation: ['simulated'],
}

const BODY_STATE_BY_EVIDENCE: Readonly<Record<IntentEvidenceClass, DigitalBodyIntentProjection['state']>> = {
  explicit: 'intended',
  observed: 'observed',
  decoded: 'decoded-candidate',
  simulated: 'simulated',
}

function assertNonBlank(value: string | undefined, field: string): asserts value is string {
  if (!value?.trim()) throw new Error(`${field} must not be blank`)
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertUnitInterval(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be a finite value in [0, 1]`)
  }
}

function validateConsent(consent: IntentConsent) {
  const grantedAt = parseIso(consent.grantedAt, 'consent.grantedAt')
  if (consent.expiresAt && parseIso(consent.expiresAt, 'consent.expiresAt') <= grantedAt) {
    throw new Error('consent.expiresAt must be after consent.grantedAt')
  }
  if (consent.revokedAt && parseIso(consent.revokedAt, 'consent.revokedAt') < grantedAt) {
    throw new Error('consent.revokedAt must not be before consent.grantedAt')
  }
}

/**
 * Validate only transport/provenance semantics. Passing this function does not
 * establish that an intent is clinically correct, diagnostically meaningful,
 * or suitable for treatment decisions.
 */
export function validateIntentEvent(event: IntentEvent) {
  assertNonBlank(event.id, 'event.id')
  assertNonBlank(event.subjectId, 'event.subjectId')
  assertNonBlank(event.source.sourceId, 'event.source.sourceId')

  const capturedAt = parseIso(event.capturedAt, 'event.capturedAt')
  const receivedAt = parseIso(event.receivedAt, 'event.receivedAt')
  if (capturedAt > receivedAt) throw new Error('event.capturedAt must not be after event.receivedAt')

  validateConsent(event.consent)

  if (!EVIDENCE_BY_SOURCE[event.source.kind].includes(event.evidenceClass)) {
    throw new Error(`source ${event.source.kind} is incompatible with evidence ${event.evidenceClass}`)
  }

  if (event.action === 'custom') assertNonBlank(event.customLabel, 'event.customLabel')

  if (event.decoderConfidence !== undefined) assertUnitInterval(event.decoderConfidence, 'event.decoderConfidence')
  if (event.signalQuality !== undefined) assertUnitInterval(event.signalQuality, 'event.signalQuality')
  if (event.displayConfidence !== undefined) assertUnitInterval(event.displayConfidence, 'event.displayConfidence')

  if (event.source.kind === 'bci-decoder') {
    assertNonBlank(event.source.version, 'event.source.version')
    assertNonBlank(event.source.decoderId, 'event.source.decoderId')
    assertNonBlank(event.source.decoderVersion, 'event.source.decoderVersion')
    if (event.decoderConfidence === undefined) throw new Error('event.decoderConfidence is required for bci-decoder')
    if (event.signalQuality === undefined) throw new Error('event.signalQuality is required for bci-decoder')
  }

  return true
}

export function isIntentConsentActive(
  consent: IntentConsent,
  purpose: IntentPurpose,
  atMs = Date.now(),
) {
  if (!Number.isFinite(atMs)) throw new Error('atMs must be finite')
  if (!consent.granted || !consent.purposes.includes(purpose)) return false

  const grantedAt = parseIso(consent.grantedAt, 'consent.grantedAt')
  if (atMs < grantedAt) return false
  if (consent.revokedAt && atMs >= parseIso(consent.revokedAt, 'consent.revokedAt')) return false
  if (consent.expiresAt && atMs >= parseIso(consent.expiresAt, 'consent.expiresAt')) return false
  return true
}

export function canProjectIntent(
  event: IntentEvent,
  purpose: IntentPurpose,
  atMs = Date.now(),
) {
  validateIntentEvent(event)
  if (event.status === 'rejected') return false
  if (!isIntentConsentActive(event.consent, purpose, atMs)) return false
  if (event.evidenceClass === 'simulated' && (purpose === 'clinical-support' || purpose === 'ai-context')) {
    return false
  }
  return true
}

/**
 * Display-quality indicator only.
 *
 * C_display = clamp(C_source × Q_signal × exp(-Δt/τ), 0, 1)
 *
 * It is not a diagnostic probability and must not be used as a treatment or
 * disability threshold. Inputs are validated before multiplication so invalid
 * values are never made to look valid by clamping.
 */
export function computeIntentDisplayConfidence(input: {
  sourceConfidence: number
  signalQuality: number
  capturedAtMs: number
  evaluatedAtMs: number
  freshnessTauMs: number
}) {
  assertUnitInterval(input.sourceConfidence, 'sourceConfidence')
  assertUnitInterval(input.signalQuality, 'signalQuality')
  if (!Number.isFinite(input.capturedAtMs)) throw new Error('capturedAtMs must be finite')
  if (!Number.isFinite(input.evaluatedAtMs)) throw new Error('evaluatedAtMs must be finite')
  if (input.evaluatedAtMs < input.capturedAtMs) {
    throw new Error('evaluatedAtMs must not be before capturedAtMs')
  }
  if (!Number.isFinite(input.freshnessTauMs) || input.freshnessTauMs <= 0) {
    throw new Error('freshnessTauMs must be a finite value greater than zero')
  }

  const freshness = Math.exp(-(input.evaluatedAtMs - input.capturedAtMs) / input.freshnessTauMs)
  const confidence = input.sourceConfidence * input.signalQuality * freshness
  return Math.min(1, Math.max(0, confidence))
}

export function projectIntentToDigitalBody(
  event: IntentEvent,
  purpose: IntentPurpose = 'personal-visualization',
  atMs = Date.now(),
): DigitalBodyIntentProjection | null {
  if (!canProjectIntent(event, purpose, atMs)) return null
  return {
    eventId: event.id,
    action: event.action,
    customLabel: event.customLabel,
    effector: event.effector,
    state: BODY_STATE_BY_EVIDENCE[event.evidenceClass],
    confidence: event.displayConfidence,
    capturedAt: event.capturedAt,
    sourceKind: event.source.kind,
  }
}
