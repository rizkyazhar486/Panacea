// Health Data analyzer: every signal a device or import has sent, read against the person's own record, on one
// surface. SEE (chips with today's value and where it sits) → ZOOM (the shared metric-insight view for the chosen
// signal) → WHY (spread, weekday pattern, coverage, each with one sentence stating its numbers).
//
// Truth: only readings that arrived are drawn; a missing day stays a gap. Comparison is with the person's own
// history only; nothing here says healthy or unhealthy. The connect row only points at the existing collectors
// (Bluetooth, file/photo import, Apple Watch export) — it does not invent a connection.

import { useMemo, useState } from 'react'
import { BoxPlotChart, HeatmapChart, HistogramChart } from '../../../../shared/charts/Charts.tsx'
import { coverage, spread, weekdayPattern } from '../../engine/glance/analyzerViews.ts'
import { ANALYZER_METRICS, type AnalyzerMetricId } from '../../engine/glance/glanceMetrics.ts'
import { INSIGHT_BOUNDARY, withUnit } from '../../engine/glance/insightText.ts'
import { metricInsight, type DayValue } from '../../engine/glance/metricInsight.ts'
import { MetricInsightContent } from './MetricInsightSheet.tsx'
import { useDarkClass } from './useDarkClass.ts'
import './healthAnalyzer.css'

export interface HealthAnalyzerProps {
  /** Daily readings for one signal id, oldest first (one value per day); the page owns storage. */
  readSeries: (id: string) => readonly DayValue[]
  /** The person's calendar day, YYYY-MM-DD. */
  today: string
}

const ARROW = { below: '↓', within: '•', above: '↑' } as const

/** The existing collectors on this page, by anchor id. Opening one also opens the fold it sits in. */
const CONNECT: ReadonlyArray<{ id: string; label: string; icon: string }> = [
  { id: 'hd-bluetooth', label: 'Bluetooth', icon: 'M7 7l10 10-5 5V2l5 5L7 17' },
  { id: 'hd-import', label: 'Import · scan', icon: 'M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3' },
  { id: 'hd-sync', label: 'Auto sync', icon: 'M8 3h8l1 4H7zM8 21h8l1-4H7zM6 7h12v10H6z' },
]

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.querySelectorAll('details').forEach((d) => { d.open = true })
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HealthAnalyzer({ readSeries, today }: HealthAnalyzerProps) {
  const dark = useDarkClass()
  const seriesById = useMemo(() => Object.fromEntries(ANALYZER_METRICS.map((m) => [m.id, readSeries(m.id)])), [readSeries])
  const chips = useMemo(() => ANALYZER_METRICS.map((metric) => {
    const r = metricInsight({ metric, series: seriesById[metric.id] ?? [], today, window: 90 })
    return { metric, latest: r.ok ? r.stats?.latest ?? null : null, position: r.ok ? r.position : null }
  }), [seriesById, today])
  const withData = chips.filter((c) => c.latest)
  const [picked, setPicked] = useState<AnalyzerMetricId | null>(null)
  const selected = (picked && chips.find((c) => c.metric.id === picked)) || withData[0] || null
  const metric = selected?.metric ?? null
  const series = metric ? seriesById[metric.id] ?? [] : []
  const tone = metric ? (dark ? metric.hue.dark : metric.hue.light) : 'currentColor'

  const cov = useMemo(() => coverage(ANALYZER_METRICS, seriesById, today), [seriesById, today])
  const sp = useMemo(() => (metric ? spread(metric, series, today) : null), [metric, series, today])
  const wk = useMemo(() => (metric ? weekdayPattern(metric, series, today) : null), [metric, series, today])
  const wkValues = wk?.days.flatMap((d) => d.values) ?? []
  const wkDomain: [number, number] | null = wkValues.length ? [Math.min(...wkValues), Math.max(...wkValues)] : null

  return (
    <section className="ha" aria-label="Health data analyzer">
      <nav className="ha-connect" aria-label="Add data">
        {CONNECT.map((c) => (
          <button key={c.id} type="button" className="ha-connect-btn" onClick={() => goTo(c.id)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path d={c.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>{c.label}</span>
          </button>
        ))}
      </nav>

      <div className="ha-chips" role="group" aria-label="Signals">
        {chips.map(({ metric: m, latest, position }) => (
          <button
            key={m.id}
            type="button"
            className="ha-chip"
            aria-pressed={m.id === metric?.id}
            disabled={!latest}
            onClick={() => setPicked(m.id)}
            style={{ ['--tone' as string]: dark ? m.hue.dark : m.hue.light }}
          >
            <span className="ha-chip-name">{m.label}</span>
            <span className="ha-chip-value">
              {latest ? withUnit(latest.value, m.digits, '') : '—'}
              {latest && position && <><i aria-hidden>{ARROW[position]}</i><span className="sr-only">{`, ${position} your usual`}</span></>}
            </span>
          </button>
        ))}
      </div>

      {!metric ? (
        <p className="ha-empty">{cov.sentence}</p>
      ) : (
        <>
          <div className="ha-deep">
            <MetricInsightContent key={metric.id} metricId={metric.id} series={series} today={today} dark={dark} initialDays={30} />
          </div>
          <div className="ha-grid">
            <figure className="ha-tile">
              <figcaption>Spread · 90 days</figcaption>
              {sp && sp.values.length >= 5 && <HistogramChart values={sp.values} bins={10} tone={tone} mark={sp.latest ?? undefined} />}
              <p>{sp?.sentence}</p>
            </figure>
            <figure className="ha-tile">
              <figcaption>By weekday</figcaption>
              {wk && wkDomain && wkDomain[1] > wkDomain[0] && (
                <div className="ha-week">
                  <span aria-hidden>{wk.days.map((d) => <b key={d.name}>{d.name.slice(0, 2)}</b>)}</span>
                  <BoxPlotChart rows={wk.days.map((d) => ({ key: d.name, values: d.values, tone }))} domain={wkDomain} h={112} />
                </div>
              )}
              <p>{wk?.sentence}</p>
            </figure>
          </div>
        </>
      )}

      <figure className="ha-tile ha-tile-wide">
        <figcaption>Which signals arrived · last {cov.days || 28} days</figcaption>
        {cov.matrix.length > 0 && (
          <div className="ha-cov">
            <span aria-hidden>{ANALYZER_METRICS.map((m) => <b key={m.id}>{m.label}</b>)}</span>
            <HeatmapChart matrix={cov.matrix} domain={[0, 1]} cold="var(--ha-gap)" hot={dark ? '#6f86f2' : '#4f6bed'} h={ANALYZER_METRICS.length * 14} />
          </div>
        )}
        <p>{cov.sentence}</p>
      </figure>
      <p className="ha-boundary">{INSIGHT_BOUNDARY}</p>
    </section>
  )
}

export default HealthAnalyzer
