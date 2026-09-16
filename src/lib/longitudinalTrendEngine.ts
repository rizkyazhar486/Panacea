import type { LongitudinalSignal } from './longitudinalPatientState'

export type TrendDirection = 'rising' | 'falling' | 'flat'

export type LongitudinalTrend = {
  key: string
  subjectId: string
  metric: string
  unit?: string
  domain: LongitudinalSignal['domain']
  points: Array<{ at: string; value: number }>
  sampleCount: number
  sourceCount: number
  latestAt: string
  earliestAt: string
  latestValue: number
  earliestValue: number
  absoluteChange: number
  relativeChangePct: number | null
  slopePerDay: number
  direction: TrendDirection
  mean: number
  standardDeviation: number
  coefficientOfVariationPct: number | null
  mixedProvenance: boolean
}

const DAY_MS = 86_400_000
const EPSILON = 1e-9

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function standardDeviation(values: number[], average: number) {
  if (values.length < 2) return 0
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function linearSlopePerDay(points: Array<{ at: string; value: number }>) {
  if (points.length < 2) return 0
  const origin = timestamp(points[0].at)
  const xs = points.map((point) => (timestamp(point.at) - origin) / DAY_MS)
  const ys = points.map((point) => point.value)
  const xMean = mean(xs)
  const yMean = mean(ys)
  let numerator = 0
  let denominator = 0
  for (let index = 0; index < points.length; index += 1) {
    numerator += (xs[index] - xMean) * (ys[index] - yMean)
    denominator += (xs[index] - xMean) ** 2
  }
  return denominator > EPSILON ? numerator / denominator : 0
}

function directionFromSlope(slope: number): TrendDirection {
  if (Math.abs(slope) <= EPSILON) return 'flat'
  return slope > 0 ? 'rising' : 'falling'
}

export function calculateLongitudinalTrends(
  signals: LongitudinalSignal[],
  options: { windowDays?: number; minSamples?: number } = {},
): LongitudinalTrend[] {
  const windowDays = options.windowDays ?? 30
  const minSamples = Math.max(2, options.minSamples ?? 2)
  const newest = Math.max(0, ...signals.map((signal) => timestamp(signal.measuredAt)))
  const cutoff = newest ? newest - windowDays * DAY_MS : 0
  const groups = new Map<string, LongitudinalSignal[]>()

  signals.forEach((signal) => {
    if (typeof signal.value !== 'number' || !Number.isFinite(signal.value)) return
    if (timestamp(signal.measuredAt) < cutoff) return
    const key = `${signal.subjectId}|${signal.domain}|${signal.metric}|${signal.unit ?? ''}`
    const group = groups.get(key) ?? []
    group.push(signal)
    groups.set(key, group)
  })

  const trends: LongitudinalTrend[] = []
  groups.forEach((group, key) => {
    const ordered = [...group].sort((a, b) => timestamp(a.measuredAt) - timestamp(b.measuredAt))
    if (ordered.length < minSamples) return
    const points = ordered.map((signal) => ({ at: signal.measuredAt, value: signal.value as number }))
    const values = points.map((point) => point.value)
    const earliestValue = points[0].value
    const latestValue = points[points.length - 1].value
    const absoluteChange = latestValue - earliestValue
    const relativeChangePct = Math.abs(earliestValue) > EPSILON ? (absoluteChange / Math.abs(earliestValue)) * 100 : null
    const average = mean(values)
    const sd = standardDeviation(values, average)
    const slopePerDay = linearSlopePerDay(points)
    const sourceCount = new Set(ordered.map((signal) => signal.source)).size
    const provenanceKinds = new Set(ordered.map((signal) => signal.provenance.kind))

    trends.push({
      key,
      subjectId: ordered[0].subjectId,
      metric: ordered[0].metric,
      unit: ordered[0].unit,
      domain: ordered[0].domain,
      points,
      sampleCount: points.length,
      sourceCount,
      latestAt: points[points.length - 1].at,
      earliestAt: points[0].at,
      latestValue,
      earliestValue,
      absoluteChange,
      relativeChangePct,
      slopePerDay,
      direction: directionFromSlope(slopePerDay),
      mean: average,
      standardDeviation: sd,
      coefficientOfVariationPct: Math.abs(average) > EPSILON ? (sd / Math.abs(average)) * 100 : null,
      mixedProvenance: sourceCount > 1 || provenanceKinds.size > 1,
    })
  })

  return trends.sort((a, b) => timestamp(b.latestAt) - timestamp(a.latestAt))
}

export const longitudinalTrendFormula = {
  slope: 'm = Σ((tᵢ−t̄)(xᵢ−x̄)) / Σ((tᵢ−t̄)²)',
  relativeChange: 'Δ% = (x_latest − x_earliest) / |x_earliest| × 100',
  coefficientOfVariation: 'CV% = σ / |x̄| × 100',
  boundary: 'Descriptive trend math only. No metric-specific clinical threshold, diagnosis, prognosis, treatment recommendation or validated risk score.',
} as const
