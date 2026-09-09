import type { Vitals } from './healthVitals'

export const MAX_LONGEVITY_SNAPSHOT_METRICS = 5

export interface LongevityRecordedMetric {
  key: 'vo2max' | 'restingHr' | 'sleepH' | 'systolic' | 'waistHipRatio'
  label: string
  unit: string
  value: number
}

const METRICS: ReadonlyArray<{
  key: LongevityRecordedMetric['key']
  label: string
  unit: string
}> = [
  { key: 'vo2max', label: 'VO₂max', unit: 'ml/kg/min' },
  { key: 'restingHr', label: 'Resting heart rate', unit: 'bpm' },
  { key: 'sleepH', label: 'Recorded sleep', unit: 'h' },
  { key: 'systolic', label: 'Systolic pressure', unit: 'mmHg' },
  { key: 'waistHipRatio', label: 'Waist-to-hip ratio', unit: '' },
]

export function buildLongevityRecordedSnapshot(vitals: Vitals): LongevityRecordedMetric[] {
  return METRICS.flatMap((metric) => {
    const value = vitals[metric.key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return []
    return [{ ...metric, value }]
  }).slice(0, MAX_LONGEVITY_SNAPSHOT_METRICS)
}

export function longevitySnapshotProvenance(vitals: Vitals): {
  source: string | null
  timestamp: string | null
} {
  const source = typeof vitals.source === 'string' && vitals.source.trim()
    ? vitals.source.trim()
    : null
  const measuredAt = typeof vitals.measuredAt === 'string' && vitals.measuredAt.trim()
    ? vitals.measuredAt.trim()
    : null
  const syncedAt = typeof vitals.syncedAt === 'string' && vitals.syncedAt.trim()
    ? vitals.syncedAt.trim()
    : null
  return { source, timestamp: measuredAt ?? syncedAt }
}
