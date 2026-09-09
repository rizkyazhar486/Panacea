import { Card, SectionTitle } from './ui'
import type { Vitals } from '../lib/healthVitals'
import {
  buildLongevityRecordedSnapshot,
  longevitySnapshotProvenance,
} from '../lib/longevityRecordedSnapshot'

export function LongevityRecordedSnapshot({ vitals }: { vitals: Vitals }) {
  const metrics = buildLongevityRecordedSnapshot(vitals)
  const provenance = longevitySnapshotProvenance(vitals)
  const checklist = [
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
      ok: metrics.length > 0 && metrics.every((metric) => metric.unit.trim().length > 0 || metric.key === 'waistHipRatio'),
      detail: metrics.length > 0
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
  ] as const

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

      <section
        className="mt-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10"
        aria-labelledby="longevity-recorded-checklist-title"
        aria-label="Longevity recorded-input safety checklist"
      >
        <div id="longevity-recorded-checklist-title" className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
          Recorded-input safety checklist
        </div>
        <div className="mt-2 space-y-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              data-check-id={item.id}
              className="grid grid-cols-[auto_1fr] gap-2 rounded-xl bg-neutral-50 p-2.5 dark:bg-white/[0.03]"
            >
              <span className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-black ${item.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`} aria-hidden="true">
                {item.ok ? '✓' : '!'}
              </span>
              <div>
                <div className="text-[10px] font-black text-ink dark:text-white">{item.label}</div>
                <p className="mt-0.5 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Card>
  )
}

export default LongevityRecordedSnapshot