import type { Vitals } from './healthVitals.ts'
import {
  validateLongitudinalEvent,
  type ConsentEnvelope,
  type LongitudinalDomain,
  type LongitudinalEvent,
  type LongitudinalProvenance,
} from './panaceaLongitudinalState.ts'
import type { FoodEntry, SelfVital, VitalSign, Vo2MaxEntry } from './types.ts'

export interface HealthStoreBridgeConfidence {
  clinicalVital: number
  selfVital: number
  vo2max: number
  deviceSnapshot: number
}

export type HealthStoreEvidenceClass =
  | 'consumer-wellness'
  | 'clinical-record'
  | 'manual-self-report'

export interface HealthStoreBridgeContext {
  consent: ConsentEnvelope
  /** Time this bridge actually received/processed the stored record. */
  receivedAt: string
  /**
   * Explicit ingestion confidence supplied by the caller. The bridge does not
   * fabricate confidence from the numeric measurement itself.
   */
  confidence: HealthStoreBridgeConfidence
  /**
   * Shared device snapshots are consumer-wellness by default. A trusted,
   * source-specific adapter may explicitly promote the ingestion boundary to
   * clinical-record after its own authorization/QC checks; source labels alone
   * never promote evidence class.
   */
  deviceSnapshotEvidenceClass?: Extract<HealthStoreEvidenceClass, 'consumer-wellness' | 'clinical-record'>
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
  // High-value Health Auto Export / Apple Health keys that previously arrived
  // on the server catalog but never entered the longitudinal kernel.
  waistCm: { metric: 'waist-circumference', domain: 'longevity', unit: 'cm' },
  walkingHr: { metric: 'walking-heart-rate', domain: 'vital', unit: 'bpm' },
  afibBurdenPct: { metric: 'atrial-fibrillation-burden', domain: 'vital', unit: '%' },
  perfusionIndexPct: { metric: 'peripheral-perfusion-index', domain: 'vital', unit: '%' },
  bloodGlucoseMgdl: { metric: 'blood-glucose', domain: 'vital', unit: 'mg/dL' },
  fev1L: { metric: 'fev1', domain: 'vital', unit: 'L' },
  fvcL: { metric: 'fvc', domain: 'vital', unit: 'L' },
  peakFlow: { metric: 'peak-expiratory-flow', domain: 'vital', unit: 'L/min' },
  breathingDisturbances: { metric: 'breathing-disturbances', domain: 'sleep', unit: 'count' },
  gangguanNapasTidur: { metric: 'sleep-breathing-disturbances', domain: 'sleep', unit: '/h' },
  basalTempC: { metric: 'basal-body-temperature', domain: 'vital', unit: '°C' },
  wristTempC: { metric: 'sleeping-wrist-temperature', domain: 'vital', unit: '°C' },
  waterL: { metric: 'dietary-water', domain: 'longevity', unit: 'L' },
  mindfulMin: { metric: 'mindful-minutes', domain: 'recovery', unit: 'min' },
  fallCount: { metric: 'falls', domain: 'other', unit: 'count' },
  moveMin: { metric: 'move-minutes', domain: 'activity', unit: 'min' },
  standMin: { metric: 'stand-minutes', domain: 'activity', unit: 'min' },
  // Core dietary macros / minerals / vitamins from Health Auto Export — clear units only.
  // Hygiene, insulin delivery, BAC, EDA, and underwater keys stay explicit gaps.
  dietKcal: { metric: 'dietary-energy', domain: 'longevity', unit: 'kcal' },
  proteinG: { metric: 'dietary-protein', domain: 'longevity', unit: 'g' },
  carbsG: { metric: 'dietary-carbohydrate', domain: 'longevity', unit: 'g' },
  fatG: { metric: 'dietary-fat', domain: 'longevity', unit: 'g' },
  satFatG: { metric: 'dietary-saturated-fat', domain: 'longevity', unit: 'g' },
  monoFatG: { metric: 'dietary-monounsaturated-fat', domain: 'longevity', unit: 'g' },
  polyFatG: { metric: 'dietary-polyunsaturated-fat', domain: 'longevity', unit: 'g' },
  fiberG: { metric: 'dietary-fiber', domain: 'longevity', unit: 'g' },
  sugarG: { metric: 'dietary-sugar', domain: 'longevity', unit: 'g' },
  cholesterolMg: { metric: 'dietary-cholesterol', domain: 'longevity', unit: 'mg' },
  sodiumMg: { metric: 'dietary-sodium', domain: 'longevity', unit: 'mg' },
  potassiumMg: { metric: 'dietary-potassium', domain: 'longevity', unit: 'mg' },
  calciumMg: { metric: 'dietary-calcium', domain: 'longevity', unit: 'mg' },
  ironMg: { metric: 'dietary-iron', domain: 'longevity', unit: 'mg' },
  magnesiumMg: { metric: 'dietary-magnesium', domain: 'longevity', unit: 'mg' },
  zincMg: { metric: 'dietary-zinc', domain: 'longevity', unit: 'mg' },
  phosphorusMg: { metric: 'dietary-phosphorus', domain: 'longevity', unit: 'mg' },
  chlorideMg: { metric: 'dietary-chloride', domain: 'longevity', unit: 'mg' },
  copperMg: { metric: 'dietary-copper', domain: 'longevity', unit: 'mg' },
  manganeseMg: { metric: 'dietary-manganese', domain: 'longevity', unit: 'mg' },
  seleniumMcg: { metric: 'dietary-selenium', domain: 'longevity', unit: 'µg' },
  iodineMcg: { metric: 'dietary-iodine', domain: 'longevity', unit: 'µg' },
  chromiumMcg: { metric: 'dietary-chromium', domain: 'longevity', unit: 'µg' },
  molybdenumMcg: { metric: 'dietary-molybdenum', domain: 'longevity', unit: 'µg' },
  vitAMcg: { metric: 'dietary-vitamin-a', domain: 'longevity', unit: 'µg' },
  vitCMg: { metric: 'dietary-vitamin-c', domain: 'longevity', unit: 'mg' },
  vitDMcg: { metric: 'dietary-vitamin-d', domain: 'longevity', unit: 'µg' },
  vitEMg: { metric: 'dietary-vitamin-e', domain: 'longevity', unit: 'mg' },
  vitKMcg: { metric: 'dietary-vitamin-k', domain: 'longevity', unit: 'µg' },
  vitB6Mg: { metric: 'dietary-vitamin-b6', domain: 'longevity', unit: 'mg' },
  vitB12Mcg: { metric: 'dietary-vitamin-b12', domain: 'longevity', unit: 'µg' },
  thiaminMg: { metric: 'dietary-thiamin', domain: 'longevity', unit: 'mg' },
  riboflavinMg: { metric: 'dietary-riboflavin', domain: 'longevity', unit: 'mg' },
  niacinMg: { metric: 'dietary-niacin', domain: 'longevity', unit: 'mg' },
  pantothenicMg: { metric: 'dietary-pantothenic-acid', domain: 'longevity', unit: 'mg' },
  biotinMcg: { metric: 'dietary-biotin', domain: 'longevity', unit: 'µg' },
  folateMcg: { metric: 'dietary-folate', domain: 'longevity', unit: 'µg' },
  caffeineMg: { metric: 'dietary-caffeine', domain: 'longevity', unit: 'mg' },
  alcoholUnits: { metric: 'alcohol-consumption', domain: 'longevity', unit: 'unit' },
  // Clear fitness / environment Health keys — hygiene, insulin, BAC, EDA stay gaps.
  cyclingDistanceKm: { metric: 'cycling-distance', domain: 'activity', unit: 'km' },
  cyclingSpeedKmh: { metric: 'cycling-speed', domain: 'fitness', unit: 'km/h' },
  cyclingPowerW: { metric: 'cycling-power', domain: 'fitness', unit: 'W' },
  cyclingCadence: { metric: 'cycling-cadence', domain: 'fitness', unit: 'rpm' },
  cyclingFtpW: { metric: 'cycling-ftp', domain: 'fitness', unit: 'W' },
  swimDistanceM: { metric: 'swim-distance', domain: 'activity', unit: 'm' },
  swimStrokes: { metric: 'swim-strokes', domain: 'activity', unit: 'count' },
  stairSpeedUpMs: { metric: 'stair-speed-ascent', domain: 'fitness', unit: 'm/s' },
  stairSpeedDownMs: { metric: 'stair-speed-descent', domain: 'fitness', unit: 'm/s' },
  snowDistanceKm: { metric: 'snow-sports-distance', domain: 'activity', unit: 'km' },
  wheelchairDistanceKm: { metric: 'wheelchair-distance', domain: 'activity', unit: 'km' },
  pushCount: { metric: 'wheelchair-pushes', domain: 'activity', unit: 'count' },
  physicalEffort: { metric: 'physical-effort', domain: 'fitness', unit: 'score' },
  uvIndex: { metric: 'uv-exposure-index', domain: 'other', unit: 'index' },
}


/** Keys the device/health-profile bridge is allowed to ingest. */
export const KUNCI_METRIK_PERANGKAT_LONGITUDINAL = Object.freeze(Object.keys(DEVICE_METRICS))

/**
 * Audit which Health-catalog keys are longitudinal-ready versus still a gap.
 * Does not invent mappings — missing keys stay explicit.
 */
export function auditCakupanWearableLongitudinal(katalogKunci: readonly string[]): {
  covered: string[]
  gap: string[]
} {
  const covered: string[] = []
  const gap: string[] = []
  for (const kunci of katalogKunci) {
    if (!kunci || typeof kunci !== 'string') continue
    if (kunci in DEVICE_METRICS) covered.push(kunci)
    else gap.push(kunci)
  }
  return {
    covered: covered.sort((a, b) => a.localeCompare(b)),
    gap: gap.sort((a, b) => a.localeCompare(b)),
  }
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
    tags: ['store:clinical-vitals', 'evidence-class:clinical-record'],
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
    tags: ['store:self-vitals', 'evidence-class:manual-self-report'],
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
    tags: ['store:vo2max-log', 'evidence-class:manual-self-report', `record:${entry.id}`],
  })
}

/**
 * Current shared health snapshot → longitudinal events.
 *
 * `measuredAt` is mandatory. The bridge intentionally refuses to replace a
 * missing measurement time with Date.now(): doing so would turn an old value
 * into a fabricated current observation. The shared store also accepts manual
 * corrections (`source: "Manual"`), so sourceKind is preserved rather than
 * blindly labelling every record as device-derived.
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

  const sourceKind: LongitudinalProvenance['sourceKind'] = source.toLowerCase() === 'manual' ? 'manual' : 'device'
  const evidenceClass: HealthStoreEvidenceClass = sourceKind === 'manual'
    ? 'manual-self-report'
    : (context.deviceSnapshotEvidenceClass ?? 'consumer-wellness')
  const provenanceMethod = sourceKind === 'manual'
    ? 'shared-vitals-manual-entry'
    : `health-vitals-snapshot:${evidenceClass}`
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
        sourceKind,
        sourceId: `health-vitals:${source}`,
        capturedAt: vitals.measuredAt,
        receivedAt,
        method: provenanceMethod,
      },
      consent: context.consent,
      tags: ['store:health-vitals', `source:${source}`, `evidence-class:${evidenceClass}`],
    }))
  }

  return { events, skipped }
}

/** Compact device values for Body Exposure — consumer/device snapshot, not atlas anatomy. */
export interface DeviceBodyExposureSignal {
  id: string
  label: string
  value: string
  unit: string
  truthClass: 'patient-recorded'
  source: 'device-snapshot'
  method: 'health-vitals-snapshot'
  jenisId: string
}

const OVERLAY_PERANGKAT: readonly { kunci: string; label: string }[] = [
  { kunci: 'restingHr', label: 'Resting HR' },
  { kunci: 'hrvMs', label: 'HRV' },
  { kunci: 'sleepH', label: 'Sleep' },
  { kunci: 'vo2max', label: 'VO₂max' },
  { kunci: 'spo2Pct', label: 'SpO₂' },
  { kunci: 'steps', label: 'Steps' },
  { kunci: 'systolic', label: 'SBP' },
  { kunci: 'weightKg', label: 'Weight' },
]

/**
 * Newest positive device/health-profile numbers for overlay display.
 * Unknown keys and non-positive values are skipped — never invented.
 */
export function deviceSnapshotToBodyExposureSignals(
  vitals: Record<string, unknown>,
  opts: { max?: number } = {},
): DeviceBodyExposureSignal[] {
  const max = opts.max ?? 5
  if (!(max > 0) || !Number.isFinite(max)) return []
  const keluar: DeviceBodyExposureSignal[] = []
  for (const { kunci, label } of OVERLAY_PERANGKAT) {
    const spec = DEVICE_METRICS[kunci]
    if (!spec) continue
    const raw = vitals[kunci]
    if (typeof raw !== 'number' || !Number.isFinite(raw) || !(raw > 0)) continue
    keluar.push({
      id: `device-overlay:${kunci}`,
      label,
      value: String(raw),
      unit: spec.unit,
      truthClass: 'patient-recorded',
      source: 'device-snapshot',
      method: 'health-vitals-snapshot',
      jenisId: kunci,
    })
    if (keluar.length >= Math.floor(max)) break
  }
  return keluar
}

const MAKANAN_METRIK = [
  ['kcal', 'nutrition.dietary-energy', 'kcal'],
  ['protein', 'nutrition.dietary-protein', 'g'],
  ['carbs', 'nutrition.dietary-carbohydrate', 'g'],
  ['fat', 'nutrition.dietary-fat', 'g'],
] as const

export interface FoodLogBridgeContext {
  consent: ConsentEnvelope
  receivedAt: string
  /** Caller-supplied confidence. The bridge does not invent it from the grams. */
  confidence: number
}

/**
 * Daily Nutrition food-log totals → longitudinal events.
 * Distinct metric ids from device diet keys so a watch export and a typed meal
 * are not mixed into one series. Invalid rows are skipped, never zero-filled.
 */
export function foodLogToLongitudinalEvents(
  subjectId: string,
  foods: readonly FoodEntry[],
  context: FoodLogBridgeContext,
): HealthStoreBridgeResult {
  parseIso(context.receivedAt, 'context.receivedAt')
  assertConfidence(context.confidence, 'context.confidence')
  assertNonBlank(subjectId, 'subjectId')
  const receivedMs = Date.parse(context.receivedAt)
  const hariTerima = context.receivedAt.slice(0, 10)
  const buckets = new Map<string, { kcal: number; protein: number; carbs: number; fat: number }>()
  const skipped: BridgeSkippedRecord[] = []

  for (const food of foods) {
    const id = food?.id?.trim() ?? ''
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(food?.date ?? '')) {
      skipped.push({ sourceRecordId: id || 'food', reason: 'missing-measured-at' })
      continue
    }
    const aheadDays = (Date.parse(`${food.date}T00:00:00.000Z`) - Date.parse(`${hariTerima}T00:00:00.000Z`)) / 864e5
    if (aheadDays > 1) {
      skipped.push({ sourceRecordId: id, reason: 'missing-measured-at', field: 'date' })
      continue
    }
    const bucket = buckets.get(food.date) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    let any = false
    for (const key of ['kcal', 'protein', 'carbs', 'fat'] as const) {
      const raw = food[key]
      if (typeof raw !== 'number' || !Number.isFinite(raw) || !(raw > 0)) {
        if (raw != null) skipped.push({ sourceRecordId: id, reason: 'invalid-number', field: key })
        continue
      }
      bucket[key] += raw
      any = true
    }
    if (any) buckets.set(food.date, bucket)
  }

  const events: LongitudinalEvent<number>[] = []
  for (const [date, bucket] of buckets) {
    let recordedAt = `${date}T12:00:00.000Z`
    if (Date.parse(recordedAt) > receivedMs + 5 * 60_000) recordedAt = context.receivedAt
    for (const [key, metric, unit] of MAKANAN_METRIK) {
      const value = bucket[key]
      if (!(value > 0)) continue
      events.push(makeNumericEvent({
        id: `nutrition:food:${idToken(subjectId)}:${date}:${metric}`,
        subjectId,
        metric,
        domain: 'nutrition',
        value,
        unit,
        recordedAt,
        confidence: context.confidence,
        provenance: {
          sourceKind: 'manual',
          sourceId: 'panaceamed:nutrition-food-log',
          capturedAt: recordedAt,
          receivedAt: context.receivedAt,
          method: 'nutrition-food-log',
        },
        consent: context.consent,
        tags: ['nutrition-food-log', 'evidence-class:manual-self-report', `day:${date}`],
      }))
    }
  }
  return { events, skipped }
}
