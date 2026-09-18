import {
  validateIntentEvent,
  type IntentAction,
  type IntentConsent,
  type IntentEffector,
  type IntentEvent,
  type IntentSource,
} from './neuralIntent'

type CommonIntentInput = {
  id: string
  subjectId: string
  action: IntentAction
  customLabel?: string
  effector: IntentEffector
  sourceId: string
  version?: string
  method?: string
  capturedAt: string
  receivedAt: string
  consent: IntentConsent
  tags?: readonly string[]
}

export type ExplicitIntentInput = CommonIntentInput & {
  sourceKind: 'explicit-touch' | 'voice-aac' | 'rehab-task'
}

export type ObservedMotionInput = CommonIntentInput & {
  sourceKind: 'motion-observation' | 'rehab-task'
}

export type DecodedBciIntentInput = Omit<CommonIntentInput, 'version'> & {
  sourceVersion: string
  decoderId: string
  decoderVersion: string
  decoderConfidence: number
  signalQuality: number
}

export type SimulatedIntentInput = CommonIntentInput

const EXPLICIT_SOURCE_KINDS = new Set<ExplicitIntentInput['sourceKind']>([
  'explicit-touch',
  'voice-aac',
  'rehab-task',
])

const OBSERVED_SOURCE_KINDS = new Set<ObservedMotionInput['sourceKind']>([
  'motion-observation',
  'rehab-task',
])

function freezeIntentEvent(event: IntentEvent): IntentEvent {
  const source: IntentSource = { ...event.source }
  const purposes = [...event.consent.purposes]
  const consent: IntentConsent = { ...event.consent, purposes }
  const tags = [...event.tags]
  const snapshot: IntentEvent = { ...event, source, consent, tags }

  Object.freeze(source)
  Object.freeze(purposes)
  Object.freeze(consent)
  Object.freeze(tags)
  return Object.freeze(snapshot) as IntentEvent
}

function finalize(event: IntentEvent) {
  validateIntentEvent(event)
  return freezeIntentEvent(event)
}

function baseEvent(input: CommonIntentInput) {
  return {
    id: input.id,
    subjectId: input.subjectId,
    action: input.action,
    customLabel: input.customLabel,
    effector: input.effector,
    capturedAt: input.capturedAt,
    receivedAt: input.receivedAt,
    consent: { ...input.consent, purposes: [...input.consent.purposes] },
    tags: [...(input.tags ?? [])],
  }
}

/**
 * Explicit user-issued intent. The constructor owns both the evidence class and
 * confirmation state so a caller cannot relabel observed/decoded data as an
 * explicit command by supplying extra payload fields.
 */
export function createExplicitIntentEvent(input: ExplicitIntentInput): IntentEvent {
  if (!EXPLICIT_SOURCE_KINDS.has(input.sourceKind)) {
    throw new Error(`sourceKind ${String(input.sourceKind)} is not valid for explicit intent`)
  }

  return finalize({
    ...baseEvent(input),
    evidenceClass: 'explicit',
    source: {
      kind: input.sourceKind,
      sourceId: input.sourceId,
      version: input.version,
      method: input.method,
      scope: 'patient-specific',
    },
    status: 'confirmed',
  })
}

/**
 * Observed motion is deliberately a candidate observation, never proof of what
 * the user intended. Downstream rehab logic may compare it with a separately
 * recorded explicit/decoded intent, but this adapter never performs that merge.
 */
export function createObservedMotionEvent(input: ObservedMotionInput): IntentEvent {
  if (!OBSERVED_SOURCE_KINDS.has(input.sourceKind)) {
    throw new Error(`sourceKind ${String(input.sourceKind)} is not valid for observed motion`)
  }

  return finalize({
    ...baseEvent(input),
    evidenceClass: 'observed',
    source: {
      kind: input.sourceKind,
      sourceId: input.sourceId,
      version: input.version,
      method: input.method,
      scope: 'patient-specific',
    },
    status: 'candidate',
  })
}

/**
 * A BCI adapter accepts only already-decoded hypotheses from an explicitly
 * identified compatible decoder. It does not read neural hardware itself and
 * it never promotes decoder output to confirmed intent.
 */
export function createDecodedBciIntentEvent(input: DecodedBciIntentInput): IntentEvent {
  return finalize({
    ...baseEvent(input),
    evidenceClass: 'decoded',
    source: {
      kind: 'bci-decoder',
      sourceId: input.sourceId,
      version: input.sourceVersion,
      decoderId: input.decoderId,
      decoderVersion: input.decoderVersion,
      method: input.method,
      scope: 'patient-specific',
    },
    decoderConfidence: input.decoderConfidence,
    signalQuality: input.signalQuality,
    status: 'candidate',
  })
}

/** Demo/training data only. Clinical and AI patient-context projection is
 * blocked again by the kernel even when a caller mistakenly grants those
 * purposes in the consent envelope. */
export function createSimulatedIntentEvent(input: SimulatedIntentInput): IntentEvent {
  return finalize({
    ...baseEvent(input),
    evidenceClass: 'simulated',
    source: {
      kind: 'simulation',
      sourceId: input.sourceId,
      version: input.version,
      method: input.method,
      scope: 'generic-simulation',
    },
    status: 'candidate',
  })
}
