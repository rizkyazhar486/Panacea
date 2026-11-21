// Health Data analyzer: every signal a device or import has sent, read against the person's own record, on one
// surface. SEE (chips with today's value and where it sits) → ZOOM (the shared metric-insight view for the chosen
// signal) → WHY (spread, weekday pattern, coverage, each with one sentence stating its numbers).
//
// Truth: only readings that arrived are drawn; a missing day stays a gap. Comparison is with the person's own
// history only; nothing here says healthy or unhealthy. The connect row only points at the existing collectors
// (Bluetooth, file/photo import, Apple Watch export) — it does not invent a connection.

import { useMemo, useState } from 'react'
import { BoxPlotChart, HeatmapChart, HistogramChart } from '../../../../shared/charts/Charts.tsx'
import { coverage, rangeBoard, spread, typicalDay, weekdayPattern, type RangeBoard, type TypicalDay } from '../../engine/glance/analyzerViews.ts'
import type { DayHourGrid } from '../../engine/glance/deviceSeries.ts'
import { ANALYZER_METRICS, type AnalyzerMetricId } from '../../engine/glance/glanceMetrics.ts'
import { DayTerrainTile } from './DayTerrainTile.tsx'
import { INSIGHT_BOUNDARY, withUnit } from '../../engine/glance/insightText.ts'
import { metricInsight, RANGE_MIN_DAYS, type DayValue } from '../../engine/glance/metricInsight.ts'
import { MetricInsightContent } from './MetricInsightSheet.tsx'
import { useDarkClass } from './useDarkClass.ts'
import './healthAnalyzer.css'

export interface HealthAnalyzerProps {
  /** Daily readings for one signal id, oldest first (one value per day); the page owns storage. */
  readSeries: (id: string) => readonly DayValue[]
  /** The person's calendar day, YYYY-MM-DD. */
  today: string
  /**
   * Each signal's typical day from the file just imported (24 entries, hour 0 first, null = no reading). Daily
   * history keeps one value per day, so the hours exist only for that import; `source` names the file.
   */
  typicalDays?: {
    readonly source: string
    readonly hours: Readonly<Record<string, readonly (number | null)[]>>
    /** The same file's recorded days hour by hour, for the 3D day landscape. */
    readonly grids?: Readonly<Record<string, DayHourGrid>>
  } | null
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

/** The typical day as a dial: spokes grow once on arrival, the highest hour drawn strongest. */
function DayTile({ day, tone, label, source }: { day: TypicalDay; tone: string; label: string; source: string }) {
  const c = day.size / 2
  const peak = day.spokes.reduce((b, s) => (s.value > b.value ? s : b), day.spokes[0])
  // The hour labels sit just outside the outer ring; pad the view box so they are never cut at the edge.
  const pad = 12
  return (
    <figure className="ha-tile ha-tile-wide ha-day">
      <figcaption>Typical day · {source}</figcaption>
      <div className="ha-day-body">
        <svg viewBox={`${-pad} ${-pad} ${day.size + pad * 2} ${day.size + pad * 2}`} role="img" aria-label={`${label} by hour of day. ${day.sentence}`}>
          <circle cx={c} cy={c} r={day.outer} className="ha-day-ring" />
          <circle cx={c} cy={c} r={day.inner} className="ha-day-ring" />
          {day.empty.map((h) => {
            const a = (h / 24) * 2 * Math.PI - Math.PI / 2
            return <circle key={h} cx={c + day.inner * Math.cos(a)} cy={c + day.inner * Math.sin(a)} r={2} className="ha-day-gap" />
          })}
          {day.spokes.map((s) => (
            <line key={s.hour} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={tone} className={s === peak ? 'is-peak' : undefined} style={{ animationDelay: `${s.hour * 20}ms` }} />
          ))}
          {day.labels.map((l) => <text key={l.hour} x={l.x} y={l.y + 3.5} textAnchor="middle">{String(l.hour).padStart(2, '0')}</text>)}
        </svg>
        <div className="ha-day-text">
          <p>{day.sentence}</p>
          <span className="ha-day-key"><i aria-hidden /> no reading that hour — not a zero</span>
        </div>
      </div>
    </figure>
  )
}

/** Every signal against its own usual range at once: a radar whose shaded ring is "usual", and one bar per signal. */
function RangeBoardTile({ board, dark }: { board: RangeBoard; dark: boolean }) {
  const hue = (id: string) => {
    const m = ANALYZER_METRICS.find((x) => x.id === id)
    return m ? (dark ? m.hue.dark : m.hue.light) : 'currentColor'
  }
  const n = board.rows.length
  const R = 70, c = 90
  const pt = (i: number, f: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return [c + R * f * Math.cos(a), c + R * f * Math.sin(a)] as const
  }
  const ring = (f: number) => board.rows.map((_, i) => pt(i, f).join(',')).join(' ')
  return (
    <figure className="ha-tile ha-tile-wide ha-board">
      <figcaption>All signals · against your usual</figcaption>
      <div className="ha-board-body">
        {n >= 3 && (
          <svg viewBox="0 0 180 180" role="img" aria-label={`Radar of ${n} signals. ${board.sentence}`}>
            <polygon points={ring(1)} className="ha-board-grid" />
            <polygon points={ring(2 / 3)} className="ha-board-usual" />
            <polygon points={ring(1 / 3)} className="ha-board-grid" />
            {board.rows.map((r, i) => { const [x, y] = pt(i, 1); return <line key={r.id} x1={c} y1={c} x2={x} y2={y} className="ha-board-grid" /> })}
            <polygon points={board.rows.map((r, i) => pt(i, r.at).join(',')).join(' ')} className="ha-board-shape" />
            {board.rows.map((r, i) => { const [x, y] = pt(i, r.at); return <circle key={r.id} cx={x} cy={y} r={3.5} fill={hue(r.id)} /> })}
          </svg>
        )}
        <ul className="ha-board-bars">
          {board.rows.map((r) => (
            <li key={r.id} data-position={r.position}>
              <span className="ha-board-name">{r.label}</span>
              <span className="ha-board-track" aria-hidden>
                <i className="ha-board-band" />
                <b style={{ left: `${r.at * 100}%`, background: hue(r.id) }} />
              </span>
              <span className="ha-board-value">{r.value}<span className="sr-only">{`, ${r.position} your usual`}</span></span>
            </li>
          ))}
          {board.building.map((b) => (
            <li key={b.id} data-position="building">
              <span className="ha-board-name">{b.label}</span>
              <span className="ha-board-track ha-board-filling" aria-hidden><i style={{ width: `${Math.min(100, (b.days / RANGE_MIN_DAYS) * 100)}%` }} /></span>
              <span className="ha-board-value">{b.days}/{RANGE_MIN_DAYS} days</span>
            </li>
          ))}
        </ul>
      </div>
      <p>{board.sentence}</p>
    </figure>
  )
}

export function HealthAnalyzer({ readSeries, today, typicalDays }: HealthAnalyzerProps) {
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

  const board = useMemo(() => rangeBoard(ANALYZER_METRICS, seriesById, today), [seriesById, today])
  const cov = useMemo(() => coverage(ANALYZER_METRICS, seriesById, today), [seriesById, today])
  const sp = useMemo(() => (metric ? spread(metric, series, today) : null), [metric, series, today])
  const wk = useMemo(() => (metric ? weekdayPattern(metric, series, today) : null), [metric, series, today])
  const day = useMemo(() => {
    const hours = metric && typicalDays?.hours[metric.id]
    return metric && hours ? typicalDay(metric, hours) : null
  }, [metric, typicalDays])
  const wkValues = wk?.days.flatMap((d) => d.values) ?? []
  const wkDomain: [number, number] | null = wkValues.length ? [Math.min(...wkValues), Math.max(...wkValues)] : null

  const connect = (
    <nav className="ha-connect" aria-label="Add data">
      {CONNECT.map((c) => (
        <button key={c.id} type="button" className="ha-connect-btn" onClick={() => goTo(c.id)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path d={c.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{c.label}</span>
        </button>
      ))}
    </nav>
  )

  // Nothing has arrived yet: nine blank chips and an empty coverage grid would only repeat "no data" twice.
  // Show the ways in and one sentence instead.
  if (withData.length === 0) {
    return (
      <section className="ha" aria-label="Health data analyzer">
        {connect}
        <p className="ha-empty">{cov.sentence}</p>
      </section>
    )
  }

  return (
    <section className="ha" aria-label="Health data analyzer">
      {connect}

      {board.rows.length + board.building.length > 1 && <RangeBoardTile board={board} dark={dark} />}

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
            {metric && typicalDays?.grids?.[metric.id] && (
              <DayTerrainTile metric={metric} grid={typicalDays.grids[metric.id]!} tone={tone} source={typicalDays.source} />
            )}
            {day && typicalDays && <DayTile day={day} tone={tone} label={metric.label} source={typicalDays.source} />}
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
