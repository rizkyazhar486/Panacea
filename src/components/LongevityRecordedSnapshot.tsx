import { Card, SectionTitle } from './ui'
import type { Vitals } from '../lib/healthVitals'
import {
  buildLongevityRecordedSnapshot,
  longevitySnapshotProvenance,
} from '../lib/longevityRecordedSnapshot'

export function LongevityRecordedSnapshot({ vitals }: { vitals: Vitals }) {
  const metrics = buildLongevityRecordedSnapshot(vitals)
  const provenance = longevitySnapshotProvenance(vitals)

  return (
    <Card className="!p-5">
      <SectionTitle
        icon={<span className="text-lg" aria-hidden="true">📍</span>}
        title="Recorded longevity inputs"
        subtitle="Shared measurements only — no sample values, score, target or forecast"
      />

      {metrics.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 p-4 text-xs leading-relaxed text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          No shared recorded vitals yet. This snapshot stays empty instead of using Longevity page defaults or generating sample measurements.
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{metric.label}</div>
              <div className="mt-1 text-lg font-black text-ink dark:text-white">
                {metric.value} {metric.unit}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-neutral-50 p-3 text-[10px] leading-relaxed text-neutral-500 dark:bg-white/[0.03] dark:text-neutral-400">
        <div><b>Latest shared-vitals source:</b> {provenance.source ?? 'Source unavailable'}</div>
        <div className="mt-1">
          <b>Latest shared-vitals timestamp:</b>{' '}
          {provenance.timestamp
            ? <time dateTime={provenance.timestamp}>{provenance.timestamp}</time>
            : 'Timestamp unavailable'}
        </div>
        <p className="mt-2">
          Provenance above describes the latest shared-vitals payload and is not promoted to per-metric lineage when granular lineage is unavailable. This panel is a recorded-input snapshot only; it does not validate the Longevity Score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance elsewhere on this page.
        </p>
      </div>
    </Card>
  )
}

export default LongevityRecordedSnapshot
