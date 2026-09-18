import {
  ingestLongitudinalEvent,
  validateLongitudinalEvent,
  type ConsentEnvelope,
  type LongitudinalDomain,
  type LongitudinalEvent,
  type LongitudinalPatientState,
  type LongitudinalProvenance,
} from './panaceaLongitudinalState'
import type {
  AppState,
  FoodEntry,
  GpsActivity,
  SleepLog,
  TrainingLog,
  WellnessDay,
} from './types'

export type ProductionPersonalStoreState = Pick<
  AppState,
  'account' | 'sleepLogs' | 'gpsActivities' | 'trainingLogs' | 'foods' | 'wellness'
>

export interface ProductionPersonalBridgeContext {
  consent: ConsentEnvelope
  /** Waktu adapter menerima snapshot store. Harus instant nyata dari caller. */
  receivedAt: string
  confidence: {
    /** Kepercayaan ingest untuk log yang dimasukkan pengguna; bukan clinical certainty. */
    userReported: number
    /** Kepercayaan ingest untuk nilai yang dihitung workflow GPS/derived; bukan device accuracy. */
    derived: number
  }
}

export interface ProductionPersonalSyncResult {
  state: LongitudinalPatientState
  candidateEventCount: number
  insertedEventCount: number
  duplicateEventCount: number
  excludedForeignGpsActivities: number
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function assertConfidence(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be a finite value in [0, 1]`)
  }
}

function dateOnly(value: string, field: string) {
  const normalized = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${field} must be a yyyy-mm-dd date`)
  }
  const parsed = Date.parse(normalized)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== normalized) {
    throw new Error(`${field} must be a valid calendar date`)
  }
  return normalized
}

function instant(value: string, field: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || !value.includes('T')) {
    throw new Error(`${field} must be an ISO date-time instant`)
  }
  return new Date(parsed).toISOString()
}

function finite(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
}

function source(
  sourceKind: LongitudinalProvenance['sourceKind'],
  sourceId: string,
  capturedAt: string,
  receivedAt: string,
  method: string,
): LongitudinalProvenance {
  return { sourceKind, sourceId, capturedAt, receivedAt, method }
}

function event<T>(input: {
  id: string
  subjectId: string
  domain: LongitudinalDomain
  metric: string
  value: T
  unit?: string
  recordedAt: string
  confidence: number
  provenance: LongitudinalProvenance
  consent: ConsentEnvelope
  tags: readonly string[]
}): LongitudinalEvent<T> {
  const output: LongitudinalEvent<T> = {
    ...input,
    review: { state: 'not-required' },
  }
  validateLongitudinalEvent(output)
  return output
}

function dayTags(kind: string, extra: readonly string[] = []) {
  return ['production-personal-store', kind, 'temporal-precision:day', ...extra]
}

function instantTags(kind: string, extra: readonly string[] = []) {
  return ['production-personal-store', kind, 'temporal-precision:instant', ...extra]
}

function sleepEvents(
  subjectId: string,
  row: SleepLog,
  context: ProductionPersonalBridgeContext,
): LongitudinalEvent[] {
  const at = dateOnly(row.date, 'sleep.date')
  const base = {
    subjectId,
    recordedAt: at,
    confidence: context.confidence.userReported,
    consent: context.consent,
    provenance: source('manual', `panaceamed:sleep:${row.id}`, at, context.receivedAt, 'user sleep log'),
  }
  const out: LongitudinalEvent[] = []
  if (finite(row.hours)) {
    out.push(event({
      ...base,
      id: `personal:sleep:${row.id}:duration`,
      domain: 'sleep',
      metric: 'sleep-duration',
      value: row.hours,
      unit: 'h',
      tags: dayTags('sleep-log'),
    }))
  }
  out.push(event({
    ...base,
    id: `personal:sleep:${row.id}:bedtime-consistency`,
    domain: 'sleep',
    metric: 'bedtime-consistency',
    value: row.bedtimeConsistent ? 'consistent' : 'variable',
    tags: dayTags('sleep-log'),
  }))
  return out
}

function gpsEvents(
  subjectId: string,
  row: GpsActivity,
  context: ProductionPersonalBridgeContext,
): LongitudinalEvent[] {
  const at = instant(row.at, 'gpsActivity.at')
  const base = {
    subjectId,
    recordedAt: at,
    confidence: context.confidence.derived,
    consent: context.consent,
    provenance: source('derived', `panaceamed:gps:${row.id}`, at, context.receivedAt, 'GPS activity workflow'),
  }
  const specs: Array<[string, LongitudinalDomain, string, number | undefined, string]> = [
    ['distance', 'activity', 'activity-distance', row.distKm, 'km'],
    ['duration', 'activity', 'activity-duration', finite(row.durSec) ? row.durSec / 60 : undefined, 'min'],
    ['speed', 'fitness', 'average-speed', row.avgSpeedKmh, 'km/h'],
    ['energy', 'activity', 'activity-energy', row.kcal, 'kcal'],
    ['avg-hr', 'fitness', 'activity-average-heart-rate', row.avgHr, 'bpm'],
    ['max-hr', 'fitness', 'activity-maximum-heart-rate', row.maxHr, 'bpm'],
  ]
  return specs
    .filter(([, , , value]) => finite(value))
    .map(([suffix, domain, metric, value, unit]) => event({
      ...base,
      id: `personal:gps:${row.id}:${suffix}`,
      domain,
      metric,
      value: value as number,
      unit,
      tags: instantTags('gps-activity', [`sport:${clean(row.sportType)}`]),
    }))
}

function trainingEvents(
  subjectId: string,
  row: TrainingLog,
  context: ProductionPersonalBridgeContext,
): LongitudinalEvent[] {
  if (!finite(row.rpe)) return []
  const at = dateOnly(row.date, 'training.date')
  return [event({
    id: `personal:training:${row.id}:rpe`,
    subjectId,
    domain: 'fitness',
    metric: 'training-rpe',
    value: row.rpe,
    unit: '/10',
    recordedAt: at,
    confidence: context.confidence.userReported,
    provenance: source('manual', `panaceamed:training:${row.id}`, at, context.receivedAt, 'user training log'),
    consent: context.consent,
    tags: dayTags('training-log', [`type:${clean(row.type)}`]),
  })]
}

function foodEvents(
  subjectId: string,
  row: FoodEntry,
  context: ProductionPersonalBridgeContext,
): LongitudinalEvent[] {
  const at = dateOnly(row.date, 'food.date')
  const base = {
    subjectId,
    recordedAt: at,
    confidence: context.confidence.userReported,
    consent: context.consent,
    provenance: source('manual', `panaceamed:food:${row.id}`, at, context.receivedAt, 'user food diary'),
  }
  const specs: Array<[string, string, number, string]> = [
    ['energy', 'food-energy', row.kcal, 'kcal'],
    ['carbohydrate', 'carbohydrate', row.carbs, 'g'],
    ['protein', 'protein', row.protein, 'g'],
    ['fat', 'fat', row.fat, 'g'],
  ]
  return specs.filter(([, , value]) => finite(value)).map(([suffix, metric, value, unit]) => event({
    ...base,
    id: `personal:food:${row.id}:${suffix}`,
    domain: 'nutrition',
    metric,
    value,
    unit,
    tags: dayTags('food-diary', [`food:${clean(row.name)}`]),
  }))
}

function wellnessEvents(
  subjectId: string,
  row: WellnessDay,
  context: ProductionPersonalBridgeContext,
): LongitudinalEvent[] {
  const at = dateOnly(row.date, 'wellness.date')
  const manualBase = {
    subjectId,
    recordedAt: at,
    confidence: context.confidence.userReported,
    consent: context.consent,
  }
  const manualSource = source('manual', `panaceamed:wellness:${row.date}`, at, context.receivedAt, 'user wellness log')
  const derivedSource = source('derived', `panaceamed:wellness:${row.date}`, at, context.receivedAt, 'stored wellness derivation')
  const out: LongitudinalEvent[] = []

  const addManual = (
    suffix: string,
    domain: LongitudinalDomain,
    metric: string,
    value: number | undefined,
    unit: string,
  ) => {
    if (!finite(value)) return
    out.push(event({
      ...manualBase,
      id: `personal:wellness:${row.date}:${suffix}`,
      domain,
      metric,
      value: value as number,
      unit,
      provenance: manualSource,
      tags: dayTags('wellness-log', ['self-reported']),
    }))
  }

  addManual('sleep', 'sleep', 'wellness-sleep-duration', row.sleepHr, 'h')
  addManual('water', 'nutrition', 'water-intake', row.waterMl, 'mL')
  addManual('exercise-min', 'activity', 'exercise-duration', row.exerciseMin, 'min')
  addManual('exercise-kcal', 'activity', 'exercise-energy', row.exerciseKcal, 'kcal')

  if (finite(row.metHours)) {
    out.push(event({
      ...manualBase,
      id: `personal:wellness:${row.date}:met-hours`,
      domain: 'fitness',
      metric: 'met-hours',
      value: row.metHours as number,
      unit: 'MET·h',
      confidence: context.confidence.derived,
      provenance: derivedSource,
      tags: dayTags('wellness-log', ['derived']),
    }))
  }

  if (finite(row.tenaga)) {
    out.push(event({
      ...manualBase,
      id: `personal:wellness:${row.date}:perceived-energy`,
      domain: 'other',
      metric: 'perceived-energy',
      value: row.tenaga as number,
      unit: '/5',
      provenance: manualSource,
      tags: dayTags('wellness-log', ['self-reported', 'subjective-not-physiologic']),
    }))
  }

  return out
}

/**
 * Sinkronisasi pure untuk store personal account-global.
 *
 * Karena array sleep/training/food/wellness tidak membawa patientId, fungsi ini
 * hanya boleh berjalan saat account.patientId persis sama dengan subjectId.
 * GPS additionally difilter dengan email akun. Tidak ada localStorage/network.
 */
export function syncProductionPersonalStores(input: {
  state: LongitudinalPatientState
  appState: ProductionPersonalStoreState
  subjectId: string
  context: ProductionPersonalBridgeContext
}): ProductionPersonalSyncResult {
  const subjectId = input.subjectId.trim()
  if (!subjectId) throw new Error('subjectId must not be blank')
  if (input.state.subjectId !== subjectId) throw new Error('subjectId does not match state.subjectId')
  if (!input.appState.account || input.appState.account.patientId !== subjectId) {
    throw new Error('personal store sync requires account.patientId to match subjectId')
  }

  const receivedAt = instant(input.context.receivedAt, 'context.receivedAt')
  assertConfidence(input.context.confidence.userReported, 'context.confidence.userReported')
  assertConfidence(input.context.confidence.derived, 'context.confidence.derived')
  const context = { ...input.context, receivedAt }

  const ownerEmail = input.appState.account.email.trim().toLocaleLowerCase('en-US')
  const ownGps = input.appState.gpsActivities.filter(
    (row) => row.email.trim().toLocaleLowerCase('en-US') === ownerEmail,
  )
  const excludedForeignGpsActivities = input.appState.gpsActivities.length - ownGps.length

  const events: LongitudinalEvent[] = [
    ...input.appState.sleepLogs.flatMap((row) => sleepEvents(subjectId, row, context)),
    ...ownGps.flatMap((row) => gpsEvents(subjectId, row, context)),
    ...input.appState.trainingLogs.flatMap((row) => trainingEvents(subjectId, row, context)),
    ...input.appState.foods.flatMap((row) => foodEvents(subjectId, row, context)),
    ...Object.values(input.appState.wellness).flatMap((row) => wellnessEvents(subjectId, row, context)),
  ]

  let state = input.state
  let insertedEventCount = 0
  let duplicateEventCount = 0
  for (const candidate of events) {
    const result = ingestLongitudinalEvent(state, candidate)
    state = result.state
    if (result.status === 'inserted') insertedEventCount += 1
    else duplicateEventCount += 1
  }

  return {
    state,
    candidateEventCount: events.length,
    insertedEventCount,
    duplicateEventCount,
    excludedForeignGpsActivities,
  }
}
