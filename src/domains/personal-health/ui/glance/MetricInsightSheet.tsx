// One signal in depth, opened from its Home tile (SEE → ZOOM → WHY): the latest reading and where it sits in the
// person's usual range, the chart for 7/30/90 days, the window's numbers, what they mean in plain words — each
// line marked as a reading or a calculation — and every day as a table. Loaded on demand from the Home brief.
// The comparison is with the person's own record only; nothing here says healthy or unhealthy.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AdaptiveDialog } from '../../../../shared/adaptive/AdaptiveDialog'
import { glanceMetric, type AnalyzerMetricId } from '../../engine/glance/glanceMetrics.ts'
import { INSIGHT_BOUNDARY, insightLines, POSITION_LABEL, shortDate, withUnit } from '../../engine/glance/insightText.ts'
import { INSIGHT_WINDOWS, metricInsight, type DayValue, type InsightWindow, type RangePosition } from '../../engine/glance/metricInsight.ts'
import { InsightChart } from './InsightChart.tsx'
import { INK, useDarkClass } from './useDarkClass.ts'

export interface MetricInsightSheetProps {
  metricId: AnalyzerMetricId
  /** Daily history, oldest first (one value per day). */
  series: readonly DayValue[]
  /** The person's calendar day, YYYY-MM-DD. */
  today: string
  onClose: () => void
  /** Claim-boundary notice from the calling surface. */
  boundary?: ReactNode
}

const POSITION_GLYPH: Record<RangePosition, string> = { below: '↓', within: '•', above: '↑' }

export function PositionChip({ position, dark }: { position: RangePosition; dark: boolean }) {
  const ink = dark ? INK.dark : INK.light
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: `1px solid ${ink.grid}`, color: ink.secondary, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span aria-hidden="true">{POSITION_GLYPH[position]}</span>
      {POSITION_LABEL[position]}
    </span>
  )
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const dayName = (date: string) => `${WEEKDAY[new Date(`${date}T12:00:00Z`).getUTCDay()]}, ${shortDate(date)}`

export interface MetricInsightContentProps extends Omit<MetricInsightSheetProps, 'onClose'> {
  /** Called when a link inside leaves the sheet. */
  onNavigate?: () => void
  /** First window shown. */
  initialDays?: InsightWindow
  /** Theme override (tests render without a document). */
  dark?: boolean
}

/** The sheet's body, without the dialog around it: everything the person reads, renderable on its own. */
export function MetricInsightContent({ metricId, series, today, boundary, onNavigate, initialDays = 7, dark: darkOverride }: MetricInsightContentProps) {
  const metric = glanceMetric(metricId)
  const darkClass = useDarkClass()
  const dark = darkOverride ?? darkClass
  const ink = dark ? INK.dark : INK.light
  const [days, setDays] = useState<InsightWindow>(initialDays)
  const insight = useMemo(() => (metric ? metricInsight({ metric, series, today, window: days }) : null), [metric, series, today, days])
  const longest = useMemo(() => (metric ? metricInsight({ metric, series, today, window: 90 }) : null), [metric, series, today])
  const heroRef = useRef<HTMLDivElement>(null)
  const readingTitle = useId()
  useEffect(() => { heroRef.current?.focus() }, [])

  if (!metric || !insight || !insight.ok || !longest || !longest.ok) {
    return <p role="alert" style={{ margin: 0 }}>This signal cannot be shown: its date or name was not recognised.</p>
  }

  const hue = dark ? metric.hue.dark : metric.hue.light
  const latest = longest.stats?.latest ?? null
  const lines = insightLines(insight)
  const stats = insight.stats
  // A figure with its unit set smaller beside it, so "13,347 steps" does not break across two lines.
  const cell = (label: string, value: number | null, unit: string, note?: string) => (
    <div style={{ minWidth: 0, padding: '10px 12px', borderRadius: 14, border: `1px solid ${ink.grid}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: ink.muted }}>{label}</div>
      <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 4, color: ink.ink }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>{value === null ? '—' : withUnit(value, label === 'Days recorded' ? 0 : metric.digits, '')}</span>
        {value !== null && unit && <span style={{ fontSize: 11, fontWeight: 700, color: ink.secondary }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 11, color: ink.muted }}>{note}</div>}
    </div>
  )

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: ink.ink }}>
        <div ref={heroRef} tabIndex={-1} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, outline: 'none' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: hue, alignSelf: 'center' }} />
              <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{latest ? withUnit(latest.value, metric.digits, '') : '—'}</span>
              {latest && metric.unit && <span style={{ fontSize: 14, fontWeight: 700, color: ink.secondary }}>{metric.unit}</span>}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: ink.muted }}>
              {/* No source is named: the daily history keeps numbers only, and the vitals' single `source` names the
                  last sync of the whole snapshot, not the device behind this signal. */}
              {latest ? `Latest reading ${dayName(latest.date)}` : `No ${metric.label} readings in the last 90 days`}
            </div>
          </div>
          {longest.position && <PositionChip position={longest.position} dark={dark} />}
        </div>

        {!latest ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '14px 16px 4px', borderRadius: 16, border: `1px dashed ${ink.grid}`, fontSize: 14, lineHeight: 1.5, color: ink.secondary }}>
            <span>Nothing to chart yet — a missing day is shown as missing, never as zero.</span>
            {/* On its own line at full touch height, not a small link inside the sentence. */}
            <Link to="/health-data" onClick={onNavigate} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', color: ink.ink, fontWeight: 700 }}>
              Connect or import device data →
            </Link>
          </div>
        ) : (
          <>
            <div role="group" aria-label="Days shown" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, padding: 4, borderRadius: 14, background: dark ? 'rgba(255,255,255,.05)' : '#f1f5f9' }}>
              {INSIGHT_WINDOWS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={days === option}
                  onClick={() => setDays(option)}
                  style={{ minHeight: 44, borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800,
                    background: days === option ? (dark ? '#262626' : '#ffffff') : 'transparent',
                    color: days === option ? ink.ink : ink.muted,
                    boxShadow: days === option ? '0 1px 3px rgba(0,0,0,.12)' : 'none' }}
                >
                  {option} days
                </button>
              ))}
            </div>

            <InsightChart key={days} insight={insight} dark={dark} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
              {cell('Average', stats ? stats.mean : null, metric.unit)}
              {cell('Lowest', stats ? stats.low.value : null, metric.unit, stats ? shortDate(stats.low.date) : undefined)}
              {cell('Highest', stats ? stats.high.value : null, metric.unit, stats ? shortDate(stats.high.date) : undefined)}
              {cell('Days recorded', stats?.recorded ?? 0, `of ${days}`)}
            </div>

            <section aria-labelledby={readingTitle} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 id={readingTitle} style={{ margin: 0, fontSize: 13, fontWeight: 800, color: ink.ink }}>What the numbers say</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map((line) => (
                  <li key={line.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: ink.secondary }}>
                    <span style={{ flex: 'none', marginTop: 2, padding: '1px 7px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase',
                      color: ink.muted, border: `1px solid ${ink.grid}` }}>
                      {line.truth === 'measured' ? 'Reading' : 'Calculated'}
                    </span>
                    <span style={{ minWidth: 0 }}>{line.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <details style={{ borderRadius: 14, border: `1px solid ${ink.grid}`, padding: '0 12px' }}>
              <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                Every day as a table ({days} days)
              </summary>
              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ position: 'sticky', top: 0, textAlign: 'left', padding: '6px 4px', background: ink.surface, color: ink.muted, fontWeight: 700 }}>Day</th>
                      <th scope="col" style={{ position: 'sticky', top: 0, textAlign: 'right', padding: '6px 4px', background: ink.surface, color: ink.muted, fontWeight: 700 }}>{metric.label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...insight.points].reverse().map((point) => (
                      <tr key={point.date} style={{ borderTop: `1px solid ${ink.grid}` }}>
                        <td style={{ padding: '6px 4px', color: ink.secondary }}>{dayName(point.date)}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: point.value === null ? ink.muted : ink.ink }}>
                          {point.value === null ? 'No reading' : withUnit(point.value, metric.digits, metric.unit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: ink.muted }}>{metric.about} {INSIGHT_BOUNDARY}</p>
        {boundary}
        <Link to={metric.deepLink} onClick={onNavigate} style={{ alignSelf: 'flex-start', minHeight: 44, display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 800, color: ink.ink }}>
          Open the {metric.label} page →
        </Link>
      </div>
  )
}

export function MetricInsightSheet({ onClose, ...content }: MetricInsightSheetProps) {
  const metric = glanceMetric(content.metricId)
  return (
    <AdaptiveDialog
      isOpen
      onClose={onClose}
      title={metric?.label ?? 'Not available'}
      subtitle={metric ? 'Your recorded history' : undefined}
      ariaLabel={metric ? `${metric.label}: your recorded history` : 'Signal not available'}
      maxWidth="xl"
    >
      <MetricInsightContent {...content} onNavigate={onClose} />
    </AdaptiveDialog>
  )
}

export default MetricInsightSheet
