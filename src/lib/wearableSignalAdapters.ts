import type {
  ConsentEnvelope,
  LongitudinalDomain,
  LongitudinalEvent,
} from './panaceaLongitudinalState.ts'

export type WearableProvider =
  | 'apple-health'
  | 'garmin'
  | 'oura'
  | 'whoop'
  | 'strava'
  | 'health-connect'

export type WearableMetric =
  | 'heart-rate'
  | 'resting-heart-rate'
  | 'hrv-rmssd'
  | 'respiratory-rate'
  | 'sleep-duration'
  | 'sleep-efficiency'
  | 'steps'
  | 'active-minutes'
  | 'distance'
  | 'vo2max'
  | 'recovery-score'
  | 'readiness-score'
  | 'strain-score'
  | 'body-temperature'
  | 'body-temperature-deviation'

export interface WearableSample {
  provider: WearableProvider
  externalId: string
  subjectId: string
  metric: WearableMetric
  value: number
  unit: string
  recordedAt: string
  receivedAt: string
  confidence: number
  sourceDevice?: string
  providerVersion?: string
  tags?: readonly string[]
}

export interface WearableAdapterContext {
  consent: ConsentEnvelope
}

interface MetricSpec {
  canonicalMetric: string
  domain: LongitudinalDomain
  canonicalUnit: string
  convert: (value: number, sourceUnit: string) => number
}

const EPSILON = 1e-9

function same(value: number) {
  return value
}

function normalizeUnit(unit: string) {
  return unit.trim().toLowerCase().replace(/\s+/g, '')
}

function finite(value: number, field: string) {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`)
  return value
}

function convertHeartRate(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (!['bpm', 'beats/min', 'beatsperminute'].includes(normalized)) throw new Error(`unsupported heart-rate unit: ${unit}`)
  return value
}

function convertHrv(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (normalized === 'ms') return value
  if (normalized === 's' || normalized === 'sec' || normalized === 'second' || normalized === 'seconds') return value * 1000
  throw new Error(`unsupported HRV unit: ${unit}`)
}

function convertRespiratoryRate(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['breaths/min', 'breathsperminute', 'br/min', 'rpm'].includes(normalized)) return value
  throw new Error(`unsupported respiratory-rate unit: ${unit}`)
}

function convertDurationHours(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(normalized)) return value
  if (['min', 'mins', 'minute', 'minutes'].includes(normalized)) return value / 60
  if (['s', 'sec', 'secs', 'second', 'seconds'].includes(normalized)) return value / 3600
  throw new Error(`unsupported duration unit: ${unit}`)
}

function convertPercent(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['%', 'percent', 'pct'].includes(normalized)) return value
  if (['ratio', 'fraction'].includes(normalized)) return value * 100
  throw new Error(`unsupported percentage unit: ${unit}`)
}

function convertCount(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['count', 'steps', 'step'].includes(normalized)) return value
  throw new Error(`unsupported count unit: ${unit}`)
}

function convertMinutes(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['min', 'mins', 'minute', 'minutes'].includes(normalized)) return value
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(normalized)) return value * 60
  if (['s', 'sec', 'secs', 'second', 'seconds'].includes(normalized)) return value / 60
  throw new Error(`unsupported active-minute unit: ${unit}`)
}

function convertDistanceKm(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['km', 'kilometer', 'kilometers'].includes(normalized)) return value
  if (['m', 'meter', 'meters'].includes(normalized)) return value / 1000
  if (['mi', 'mile', 'miles'].includes(normalized)) return value * 1.609344
  throw new Error(`unsupported distance unit: ${unit}`)
}

function convertVo2max(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['ml/kg/min', 'ml·kg-1·min-1', 'mlkg-1min-1', 'ml/kg/minute'].includes(normalized)) return value
  throw new Error(`unsupported VO2max unit: ${unit}`)
}

function convertScore(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['score', 'points', 'point'].includes(normalized)) return value
  throw new Error(`unsupported score unit: ${unit}`)
}

function convertTemperatureC(value: number, unit: string) {
  const normalized = normalizeUnit(unit)
  if (['c', '°c', 'celsius'].includes(normalized)) return value
  if (['f', '°f', 'fahrenheit'].includes(normalized)) return (value - 32) * (5 / 9)
  throw new Error(`unsupported temperature unit: ${unit}`)
}

const METRIC_SPECS: Readonly<Record<WearableMetric, MetricSpec>> = {
  'heart-rate': { canonicalMetric: 'heart-rate', domain: 'vital', canonicalUnit: 'bpm', convert: convertHeartRate },
  'resting-heart-rate': { canonicalMetric: 'resting-heart-rate', domain: 'vital', canonicalUnit: 'bpm', convert: convertHeartRate },
  'hrv-rmssd': { canonicalMetric: 'hrv-rmssd', domain: 'recovery', canonicalUnit: 'ms', convert: convertHrv },
  'respiratory-rate': { canonicalMetric: 'respiratory-rate', domain: 'vital', canonicalUnit: 'breaths/min', convert: convertRespiratoryRate },
  'sleep-duration': { canonicalMetric: 'sleep-duration', domain: 'sleep', canonicalUnit: 'h', convert: convertDurationHours },
  'sleep-efficiency': { canonicalMetric: 'sleep-efficiency', domain: 'sleep', canonicalUnit: '%', convert: convertPercent },
  steps: { canonicalMetric: 'steps', domain: 'activity', canonicalUnit: 'count', convert: convertCount },
  'active-minutes': { canonicalMetric: 'active-minutes', domain: 'activity', canonicalUnit: 'min', convert: convertMinutes },
  distance: { canonicalMetric: 'distance', domain: 'activity', canonicalUnit: 'km', convert: convertDistanceKm },
  vo2max: { canonicalMetric: 'vo2max', domain: 'fitness', canonicalUnit: 'mL/kg/min', convert: convertVo2max },
  'recovery-score': { canonicalMetric: 'recovery-score', domain: 'recovery', canonicalUnit: 'score', convert: convertScore },
  'readiness-score': { canonicalMetric: 'readiness-score', domain: 'readiness', canonicalUnit: 'score', convert: convertScore },
  'strain-score': { canonicalMetric: 'strain-score', domain: 'fitness', canonicalUnit: 'score', convert: convertScore },
  'body-temperature': { canonicalMetric: 'body-temperature', domain: 'vital', canonicalUnit: '°C', convert: convertTemperatureC },
  'body-temperature-deviation': { canonicalMetric: 'body-temperature-deviation', domain: 'recovery', canonicalUnit: '°C', convert: convertTemperatureC },
}

const PROVIDER_METRIC_ALLOWLIST: Readonly<Record<WearableProvider, readonly WearableMetric[]>> = {
  'apple-health': ['heart-rate', 'resting-heart-rate', 'hrv-rmssd', 'respiratory-rate', 'sleep-duration', 'sleep-efficiency', 'steps', 'active-minutes', 'distance', 'vo2max', 'body-temperature'],
  garmin: ['heart-rate', 'resting-heart-rate', 'hrv-rmssd', 'respiratory-rate', 'sleep-duration', 'steps', 'active-minutes', 'distance', 'vo2max', 'body-temperature'],
  oura: ['heart-rate', 'resting-heart-rate', 'hrv-rmssd', 'respiratory-rate', 'sleep-duration', 'sleep-efficiency', 'readiness-score', 'body-temperature-deviation'],
  whoop: ['heart-rate', 'resting-heart-rate', 'hrv-rmssd', 'respiratory-rate', 'sleep-duration', 'sleep-efficiency', 'recovery-score', 'strain-score'],
  strava: ['heart-rate', 'active-minutes', 'distance'],
  'health-connect': ['heart-rate', 'resting-heart-rate', 'hrv-rmssd', 'respiratory-rate', 'sleep-duration', 'steps', 'active-minutes', 'distance', 'vo2max', 'body-temperature'],
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

export function wearableProviderSupportsMetric(provider: WearableProvider, metric: WearableMetric) {
  return PROVIDER_METRIC_ALLOWLIST[provider].includes(metric)
}

/**
 * Normalize already-authorized wearable samples into the shared longitudinal
 * event contract. This adapter does not perform OAuth, network retrieval, or
 * infer missing device data. Provider support here means Panacea has an explicit
 * mapping contract for a supplied sample, not that every device/account exposes
 * the metric in every region or API tier.
 */
export function normalizeWearableSample(
  sample: WearableSample,
  context: WearableAdapterContext,
): LongitudinalEvent<number> {
  assertNonBlank(sample.externalId, 'sample.externalId')
  assertNonBlank(sample.subjectId, 'sample.subjectId')
  assertNonBlank(sample.unit, 'sample.unit')
  finite(sample.value, 'sample.value')
  if (!Number.isFinite(sample.confidence) || sample.confidence < 0 || sample.confidence > 1) {
    throw new Error('sample.confidence must be in [0,1]')
  }

  const recordedAt = parseIso(sample.recordedAt, 'sample.recordedAt')
  const receivedAt = parseIso(sample.receivedAt, 'sample.receivedAt')
  if (recordedAt > receivedAt + 5 * 60_000) throw new Error('sample.recordedAt is implausibly after sample.receivedAt')
  if (!wearableProviderSupportsMetric(sample.provider, sample.metric)) {
    throw new Error(`${sample.provider} metric mapping not registered: ${sample.metric}`)
  }

  const spec = METRIC_SPECS[sample.metric]
  const converted = finite(spec.convert(sample.value, sample.unit), 'converted sample.value')
  if (Math.abs(converted) < EPSILON) {
    // Preserve signed zero deterministically for stable serialization.
  }

  return {
    id: `wearable:${sample.provider}:${sample.externalId}:${spec.canonicalMetric}`,
    subjectId: sample.subjectId.trim(),
    domain: spec.domain,
    metric: spec.canonicalMetric,
    value: converted,
    unit: spec.canonicalUnit,
    recordedAt: sample.recordedAt,
    confidence: sample.confidence,
    provenance: {
      sourceKind: 'wearable',
      sourceId: `${sample.provider}:${sample.sourceDevice?.trim() || 'unspecified-device'}`,
      capturedAt: sample.recordedAt,
      receivedAt: sample.receivedAt,
      method: 'provider-adapter',
      version: sample.providerVersion,
    },
    consent: {
      ...context.consent,
      purposes: [...context.consent.purposes],
    },
    review: { state: 'not-required' },
    tags: [...new Set([sample.provider, ...(sample.tags ?? [])].map((tag) => tag.trim()).filter(Boolean))],
  }
}

export function normalizeWearableBatch(
  samples: readonly WearableSample[],
  context: WearableAdapterContext,
) {
  const events: LongitudinalEvent<number>[] = []
  const seen = new Set<string>()
  for (const sample of samples) {
    const event = normalizeWearableSample(sample, context)
    if (seen.has(event.id)) continue
    seen.add(event.id)
    events.push(event)
  }
  return events.sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id))
}

export function wearableAdapterCoverage() {
  return Object.entries(PROVIDER_METRIC_ALLOWLIST).map(([provider, metrics]) => ({
    provider: provider as WearableProvider,
    metrics: [...metrics],
    metricCount: metrics.length,
  }))
}
