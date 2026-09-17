import type { Vitals } from './healthVitals.ts'
import {
  validateLongitudinalEvent,
  type ConsentEnvelope,
  type LongitudinalDomain,
  type LongitudinalEvent,
  type LongitudinalProvenance,
} from './panaceaLongitudinalState.ts'
import type { SelfVital, VitalSign, Vo2MaxEntry } from './types.ts'

export interface HealthStoreBridgeConfidence {
  clinicalVital: number
  selfVital: number
  vo2max: number
  deviceSnapshot: number
}

export interface HealthStoreBridgeContext {
  consent: ConsentEnvelope
  /** Time this bridge actually received/processed the stored record. */
  receivedAt: string
  /**
   * Explicit ingestion confidence supplied by the caller. The bridge does not
   * fabricate confidence from the numeric measurement itself.
   */
  confidence: HealthStoreBridgeConfidence
}

export type BridgeSkipReason =
  | 'missing-measured-at'
  | 'missing-source'
  | 'invalid-number'

export interface BridgeSkippedRecord {
  sourceRecordId: string
  reason: BridgeSkipReason
  field?: string
}

export interface HealthStoreBridgeResult {
  events: LongitudinalEvent<number>[]
  skipped: BridgeSkippedRecord[]
}

interface NumericMetricSpec {
  metric: string
  domain: LongitudinalDomain
  unit: string
}

const CLINICAL_METRICS = [
  ['systolic', 'blood-pressure-systolic', 'vital', 'mmHg'],
  ['diastolic', 'blood-pressure-diastolic', 'vital', 'mmHg'],
  ['heartRate', 'heart-rate', 'vital', 'bpm'],
  ['respRate', 'respiratory-rate', 'vital', 'breaths/min'],
  ['tempC', 'body-temperature', 'vital', '°C'],
  ['spo2', 'spo2', 'vital', '%'],
  ['glucose', 'glucose', 'vital', 'mg/dL'],
] as const satisfies readonly (readonly [keyof VitalSign, string, LongitudinalDomain, string])[]

const SELF_VITAL_METRICS = [
  ['systolic', 'blood-pressure-systolic', 'vital', 'mmHg'],
  ['diastolic', 'blood-pressure-diastolic', 'vital', 'mmHg'],
  ['heartRate', 'heart-rate', 'vital', 'bpm'],
  ['spo2', 'spo2', 'vital', '%'],
  ['tempC', 'body-temperature', 'vital', '°C'],
] as const satisfies readonly (readonly [keyof SelfVital, string, LongitudinalDomain, string])[]

/**
 * Only fields with an explicit semantic/unit mapping enter the longitudinal
 * kernel. Vitals has an index signature for forward compatibility, but unknown
 * fields are intentionally not guessed here.
 */
const DEVICE_METRICS: Readonly<Record<string, NumericMetricSpec>> = {
  weightKg: { metric: 'weight', domain: 'longevity', unit: 'kg' },
  heightCm: { metric: 'height', domain: 'longevity', unit: 'cm' },
  bodyFatPct: { metric: 'body-fat', domain: 'longevity', unit: '%' },
  leanMassKg: { metric: 'lean-mass', domain: 'longevity', unit: 'kg' },
  heartRate: { metric: 'heart-rate', domain: 'vital', unit: 'bpm' },
  restingHr: { metric: 'resting-heart-rate', domain: 'vital', unit: 'bpm' },
  hrvMs: { metric: 'hrv', domain: 'recovery', unit: 'ms' },
  vo2max: { metric: 'vo2max', domain: 'fitness', unit: 'mL/kg/min' },
  spo2Pct: { metric: 'spo2', domain: 'vital', unit: '%' },
  respRate: { metric: 'respiratory-rate', domain: 'vital', unit: 'breaths/min' },
  systolic: { metric: 'blood-pressure-systolic', domain: 'vital', unit: 'mmHg' },
  diastolic: { metric: 'blood-pressure-diastolic', domain: 'vital', unit: 'mmHg' },
  bodyTempC: { metric: 'body-temperature', domain: 'vital', unit: '°C' },
  steps: { metric: 'steps', domain: 'activity', unit: 'count' },
  activeKcal: { metric: 'active-energy', domain: 'activity', unit: 'kcal' },
  exerciseMin: { metric: 'active-minutes', domain: 'activity', unit: 'min' },
  distanceKm: { metric: 'distance', domain: 'activity', unit: 'km' },
  sleepH: { metric: 'sleep-duration', domain: 'sleep', unit: 'h' },
  sleepDeepH: { metric: 'sleep-deep-duration', domain: 'sleep', unit: 'h' },
  sleepRemH: { metric: 'sleep-rem-duration', domain: 'sleep', unit: 'h' },
  sleepCoreH: { metric: 'sleep-core-duration', domain: 'sleep', unit: 'h' },
  sleepAwakeH: { metric: 'sleep-awake-duration', domain: 'sleep', unit: 'h' },
  recoveryPct: { metric: 'recovery-score', domain: 'recovery', unit: '%' },
  strain: { metric: 'strain-score', domain: 'fitness', unit: 'score' },
  basalKcal: { metric: 'basal-energy', domain: 'longevity', unit: 'kcal' },
  flightsClimbed: { metric: 'flights-climbed', domain: 'activity', unit: 'count' },
  standHours: { metric: 'stand-hours', domain: 'activity', unit: 'h' },
  daylightMin: { metric: 'daylight-exposure', domain: 'other', unit: 'min' },
  cardioRecoveryBpm: { metric: 'cardio-recovery', domain: 'recovery', unit: 'bpm' },
  bmi: { metric: 'bmi', domain: 'longevity', unit: 'kg/m²' },
  bmrKcal: { metric: 'bmr', domain: 'longevity', unit: 'kcal/day' },
  skeletalMuscleKg: { metric: 'skeletal-muscle-mass', domain: 'longevity', unit: 'kg' },
  bodyWaterL: { metric: 'body-water', domain: 'longevity', unit: 'L' },
  bodyWaterPct: { metric: 'body-water-percent', domain: 'longevity', unit: '%' },
  walkingSpeedKmh: { metric: 'walking-speed', domain: 'fitness', unit: 'km/h' },
  walkingAsymmetryPct: { metric: 'walking-asymmetry', domain: 'fitness', unit: '%' },
  walkingDoubleSupportPct: { metric: 'walking-double-support', domain: 'fitness', unit: '%' },
  walkingStepLengthCm: { metric: 'walking-step-length', domain: 'fitness', unit: 'cm' },
  sixMinWalkM: { metric: 'six-minute-walk-distance', domain: 'fitness', unit: 'm' },
  runningPowerW: { metric: 'running-power', domain: 'fitness', unit: 'W' },
  runningSpeedKmh: { metric: 'running-speed', domain: 'fitness', unit: 'km/h' },
  runningStrideLengthM: { metric: 'running-stride-length', domain: 'fitness', unit: 'm' },
  runningGroundContactMs: { metric: 'running-ground-contact', domain: 'fitness', unit: 'ms' },
  runningVerticalOscCm: { metric: 'running-vertical-oscillation', domain: 'fitness', unit: 'cm' },
  audioExposureDb: { metric: 'environmental-audio-exposure', domain: 'other', unit: 'dB' },
  headphoneAudioDb: { metric: 'headphone-audio-exposure', domain: 'other', unit: 'dB' },
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function assertConfidence(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be in [0,1]`)
}

function validateContext(context: HealthStoreBridgeContext) {
  parseIso(context.receivedAt, 'context.receivedAt')
  assertConfidence(context.confidence.clinicalVital, 'context.confidence.clinicalVital')
  assertConfidence(context.confidence.selfVital, 'context.confidence.selfVital')
  assertConfidence(context.confidence.vo2max, 'context.confidence.vo2max')
  assertConfidence(context.confidence.deviceSnapshot, 'context.confidence.deviceSnapshot')
}

function idToken(value: string) {
  return value.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function makeNumericEvent(args: {
  id: string
  subjectId: string
  metric: string
  domain: LongitudinalDomain
  value: number
  unit: string
  recordedAt: string
  confidence: number
  provenance: LongitudinalProvenance
  consent: ConsentEnvelope
  tags: readonly string[]
}): LongitudinalEvent<number> {
  const event: LongitudinalEvent<number> = {
    id: args.id,
    subjectId: args.subjectId,
    metric: args.metric,
    domain: args.domain,
    value: args.value,
    unit: args.unit,
    recordedAt: args.recordedAt,
    confidence: args.confidence,
    provenance: { ...args.provenance },
    consent: { ...args.consent, purposes: [...args.consent.purposes] },
    review: { state: 'not-required' },
    tags: [...new Set(args.tags.filter(Boolean))],
  }
  validateLongitudinalEvent(event)
  return event
}

function numericRecordEvents<T extends object>(args: {
  record: T
  specs: readonly (readonly [keyof T, string, LongitudinalDomain, string])[]
  idPrefix: string
  subjectId: string
  sourceRecordId: string
  sourceKind: LongitudinalProvenance['sourceKind']
  sourceId: string
  recordedAt: string
  confidence: number
  context: HealthStoreBridgeContext
  method?: string
  tags: readonly string[]
}): HealthStoreBridgeResult {
  validateContext(args.context)
  assertNonBlank(args.subjectId, 'subjectId')
  assertNonBlank(args.sourceRecordId, 'sourceRecordId')
  parseIso(args.recordedAt, 'recordedAt')

  const events: LongitudinalEvent<number>[] = []
  const skipped: BridgeSkippedRecord[] = []
  for (const [field, metric, domain, unit] of args.specs) {
    const raw = args.record[field]
    if (raw == null) continue
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      skipped.push({ sourceRecordId: args.sourceRecordId, reason: 'invalid-number', field: String(field) })
      continue
    }
    events.push(makeNumericEvent({
      id: `${args.idPrefix}:${args.sourceRecordId}:${metric}`,
      subjectId: args.subjectId,
      metric,
      domain,
      value: raw,
      unit,
      recordedAt: args.recordedAt,
      confidence: args.confidence,
      provenance: {
        sourceKind: args.sourceKind,
        sourceId: args.sourceId,
        capturedAt: args.recordedAt,
        receivedAt: args.context.receivedAt,
        method: args.method,
      },
      consent: args.context.consent,
      tags: [...args.tags, `record:${args.sourceRecordId}`],
    }))
  }
  return { events, skipped }
}

/**
 * Multi-patient clinical store → longitudinal events.
 * No clinical interpretation is added; this is a lossless numeric projection.
 */
export function clinicalVitalToLongitudinalEvents(
  patientId: string,
  vital: VitalSign,
  context: HealthStoreBridgeContext,
): HealthStoreBridgeResult {
  return numericRecordEvents({
    record: vital,
    specs: CLINICAL_METRICS,
    idPrefix: `store:clinical:${idToken(patientId)}`,
    subjectId: patientId,
    sourceRecordId: vital.id,
    sourceKind: 'clinical-system',
    sourceId: 'panaceamed:clinical-vitals',
    recordedAt: vital.takenAt,
    confidence: context.confidence.clinicalVital,
    context,
    tags: ['store:clinical-vitals'],
  })
}

/** Manual personal-vitals log → longitudinal events. */
export function selfVitalToLongitudinalEvents(
  subjectId: string,
  vital: SelfVital,
  context: HealthStoreBridgeContext,
): HealthStoreBridgeResult {
  return numericRecordEvents({
    record: vital,
    specs: SELF_VITAL_METRICS,
    idPrefix: `store:self:${idToken(subjectId)}`,
    subjectId,
    sourceRecordId: vital.id,
    sourceKind: 'manual',
    sourceId: 'panaceamed:self-vitals',
    recordedAt: vital.at,
    confidence: context.confidence.selfVital,
    context,
    tags: ['store:self-vitals'],
  })
}

/** A timestamped VO₂max record; method is preserved exactly as provenance. */
export function vo2MaxToLongitudinalEvent(
  subjectId: string,
  entry: Vo2MaxEntry,
  context: HealthStoreBridgeContext,
): LongitudinalEvent<number> {
  validateContext(context)
  assertNonBlank(subjectId, 'subjectId')
  assertNonBlank(entry.id, 'entry.id')
  parseIso(entry.at, 'entry.at')
  return makeNumericEvent({
    id: `store:vo2max:${idToken(subjectId)}:${entry.id}:vo2max`,
    subjectId,
    metric: 'vo2max',
    domain: 'fitness',
    value: entry.value,
    unit: 'mL/kg/min',
    recordedAt: entry.at,
    confidence: context.confidence.vo2max,
    provenance: {
      sourceKind: 'manual',
      sourceId: 'panaceamed:vo2max-log',
      capturedAt: entry.at,
      receivedAt: context.receivedAt,
      method: entry.method,
    },
    consent: context.consent,
    tags: ['store:vo2max-log', `record:${entry.id}`],
  })
}

/**
 * Current device-derived health snapshot → longitudinal events.
 *
 * `measuredAt` is mandatory. The bridge intentionally refuses to replace a
 * missing measurement time with Date.now(): doing so would turn an old device
 * value into a fabricated current observation. `syncedAt`, when valid, is the
 * receipt time; otherwise the caller's actual bridge receipt time is used.
 */
export function currentDeviceVitalsToLongitudinalEvents(
  subjectId: string,
  vitals: Vitals,
  context: HealthStoreBridgeContext,
): HealthStoreBridgeResult {
  validateContext(context)
  assertNonBlank(subjectId, 'subjectId')

  if (!vitals.measuredAt) {
    return { events: [], skipped: [{ sourceRecordId: 'current-device-vitals', reason: 'missing-measured-at' }] }
  }
  parseIso(vitals.measuredAt, 'vitals.measuredAt')

  const source = vitals.source?.trim()
  if (!source) {
    return { events: [], skipped: [{ sourceRecordId: 'current-device-vitals', reason: 'missing-source' }] }
  }

  let receivedAt = context.receivedAt
  if (vitals.syncedAt) {
    const syncedAt = parseIso(vitals.syncedAt, 'vitals.syncedAt')
    if (syncedAt >= Date.parse(vitals.measuredAt)) receivedAt = vitals.syncedAt
  }

  const events: LongitudinalEvent<number>[] = []
  const skipped: BridgeSkippedRecord[] = []
  const sourceToken = idToken(source)
  const timeToken = idToken(vitals.measuredAt)

  for (const [field, spec] of Object.entries(DEVICE_METRICS)) {
    const raw = vitals[field]
    if (raw == null) continue
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      skipped.push({ sourceRecordId: 'current-device-vitals', reason: 'invalid-number', field })
      continue
    }
    events.push(makeNumericEvent({
      id: `store:device:${idToken(subjectId)}:${sourceToken}:${timeToken}:${spec.metric}`,
      subjectId,
      metric: spec.metric,
      domain: spec.domain,
      value: raw,
      unit: spec.unit,
      recordedAt: vitals.measuredAt,
      confidence: context.confidence.deviceSnapshot,
      provenance: {
        sourceKind: 'device',
        sourceId: `health-vitals:${source}`,
        capturedAt: vitals.measuredAt,
        receivedAt,
        method: 'health-vitals-snapshot',
      },
      consent: context.consent,
      tags: ['store:health-vitals', `source:${source}`],
    }))
  }

  return { events, skipped }
}
