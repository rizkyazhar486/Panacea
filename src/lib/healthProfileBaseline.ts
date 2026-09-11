export type HealthBaselineMetric = 'vo2max' | 'restingHr' | 'hrvMs' | 'recoveryPct' | 'sleepH'

export interface HealthBaselineSnapshot {
  date: string
  vo2max?: number
  restingHr?: number
  hrvMs?: number
  recoveryPct?: number
  sleepH?: number
}

export interface HealthPersonalBaseline {
  metric: HealthBaselineMetric
  count: number
  median: number
  q1: number
  q3: number
  firstDate: string
  lastDate: string
  method: 'nist-percentile-n-plus-one'
  scope: 'personal-descriptive-history-only'
}

const MAX_RECORDS = 30

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) throw new Error('percentile_requires_data')
  const position = p * (sorted.length + 1)
  if (position <= 1) return sorted[0]
  if (position >= sorted.length) return sorted[sorted.length - 1]
  const lowerIndex = Math.floor(position) - 1
  const fraction = position - Math.floor(position)
  return sorted[lowerIndex] + fraction * (sorted[lowerIndex + 1] - sorted[lowerIndex])
}

export function buildPersonalBaseline(
  history: HealthBaselineSnapshot[],
  metric: HealthBaselineMetric,
): HealthPersonalBaseline | null {
  const dated = history
    .filter((record) => /^\d{4}-\d{2}-\d{2}$/.test(record.date))
    .slice(-MAX_RECORDS)
    .map((record) => ({ date: record.date, value: record[metric] }))
    .filter((record): record is { date: string; value: number } =>
      typeof record.value === 'number' && Number.isFinite(record.value) && record.value > 0,
    )

  if (dated.length < 3) return null
  const values = dated.map((record) => record.value).sort((a, b) => a - b)
  return {
    metric,
    count: values.length,
    median: percentile(values, 0.5),
    q1: percentile(values, 0.25),
    q3: percentile(values, 0.75),
    firstDate: dated[0].date,
    lastDate: dated[dated.length - 1].date,
    method: 'nist-percentile-n-plus-one',
    scope: 'personal-descriptive-history-only',
  }
}
