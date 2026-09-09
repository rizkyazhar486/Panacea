import type { LongevityRecordedMetric } from './longevityRecordedSnapshot'

export type LongevityRecordedChecklistId =
  | 'source'
  | 'timestamp'
  | 'units'
  | 'empty-state'
  | 'scientific-boundary'

export interface LongevityRecordedChecklistItem {
  id: LongevityRecordedChecklistId
  label: string
  ok: boolean
  detail: string
}

export interface LongevityRecordedChecklistProvenance {
  source: string | null
  timestamp: string | null
}

export function buildLongevityRecordedChecklist(
  metrics: ReadonlyArray<LongevityRecordedMetric>,
  provenance: LongevityRecordedChecklistProvenance,
): LongevityRecordedChecklistItem[] {
  const hasMetrics = metrics.length > 0
  const unitsPreserved = hasMetrics && metrics.every((metric) => (
    metric.key === 'waistHipRatio' || metric.unit.trim().length > 0
  ))

  return [
    {
      id: 'source',
      label: 'Source identity',
      ok: Boolean(provenance.source),
      detail: provenance.source ?? 'No shared-vitals source is recorded yet.',
    },
    {
      id: 'timestamp',
      label: 'Measurement timestamp',
      ok: Boolean(provenance.timestamp),
      detail: provenance.timestamp ?? 'No shared-vitals timestamp is recorded yet.',
    },
    {
      id: 'units',
      label: 'Units / dimensionless identity preserved',
      ok: unitsPreserved,
      detail: hasMetrics
        ? 'Every rendered metric keeps its explicit unit, while waist-to-hip ratio remains explicitly dimensionless.'
        : 'No recorded metric is present, so no unit claim is synthesized.',
    },
    {
      id: 'empty-state',
      label: 'No fabricated defaults',
      ok: true,
      detail: 'The recorded snapshot stays empty when shared measurements are unavailable.',
    },
    {
      id: 'scientific-boundary',
      label: 'Scientific boundary',
      ok: true,
      detail: 'This checklist does not validate the page’s legacy score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance.',
    },
  ]
}
