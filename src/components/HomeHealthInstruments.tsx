import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Vitals } from '../lib/healthVitals'
import { deretMetrik } from '../lib/riwayatVitals'
import '../styles/home-health-instruments-v40.css'

type Point = { tanggal: string; nilai: number }

const n = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined

const fmt = (value: number | undefined, digits = 0) =>
  value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: digits })

function lastDays(field: string, days = 7): Point[] {
  return deretMetrik(field, days).slice(-days)
}

function Bars({ points, compact = false }: { points: Point[]; compact?: boolean }) {
  const max = Math.max(1, ...points.map((p) => p.nilai))
  if (!points.length) return <div className="pmd-instrument-empty">No recorded history yet</div>
  return (
    <div className={`pmd-mini-bars ${compact ? 'is-compact' : ''}`} aria-label="Recorded seven-day history">
      {points.map((p) => {
        const d = new Date(`${p.tanggal}T12:00:00`)
        const day = d.toLocaleDateString(undefined, { weekday: 'narrow' })
        return (
          <div className="pmd-mini-bar-col" key={p.tanggal} title={`${p.tanggal}: ${p.nilai}`}>
            <span className="pmd-mini-bar-value">{p.nilai >= 1000 ? `${(p.nilai / 1000).toFixed(p.nilai >= 10000 ? 0 : 1)}k` : Math.round(p.nilai)}</span>
            <span className="pmd-mini-bar" style={{ height: `${Math.max(7, (p.nilai / max) * 100)}%` }} />
            <span className="pmd-mini-bar-day">{day}</span>
          </div>
        )
      })}
    </div>
  )
}

function Sparkline({ points }: { points: Point[] }) {
  const polyline = useMemo(() => {
    if (points.length < 2) return ''
    const values = points.map((p) => p.nilai)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(1e-6, max - min)
    return points.map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * 100
      const y = 44 - ((p.nilai - min) / span) * 38
      return `${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' ')
  }, [points])
  if (points.length < 2) return <div className="pmd-instrument-empty is-short">Trend appears after 2 recorded days</div>
  return (
    <svg className="pmd-sparkline" viewBox="0 0 100 48" preserveAspectRatio="none" role="img" aria-label="Recorded trend line">
      <line x1="0" y1="12" x2="100" y2="12" />
      <line x1="0" y1="28" x2="100" y2="28" />
      <line x1="0" y1="44" x2="100" y2="44" />
      <polyline points={polyline} />
    </svg>
  )
}

function Gauge({ value, max = 100, label }: { value?: number; max?: number; label: string }) {
  const bounded = value == null ? 0 : Math.max(0, Math.min(max, value))
  const pct = (bounded / max) * 100
  return (
    <div className="pmd-gauge" style={{ '--pmd-gauge': `${pct}%` } as CSSProperties}>
      <div className="pmd-gauge-inner">
        <strong>{value == null ? '—' : fmt(value, value < 10 ? 1 : 0)}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function Metric({ icon, label, value, unit }: { icon: string; label: string; value?: number; unit?: string }) {
  return (
    <div className="pmd-vital-chip">
      <span className="pmd-vital-icon" aria-hidden>{icon}</span>
      <span className="pmd-vital-label">{label}</span>
      <strong>{fmt(value, value != null && value < 20 ? 1 : 0)}{value != null && unit ? <small>{unit}</small> : null}</strong>
    </div>
  )
}

export function HomeHealthInstruments({ vitals }: { vitals: Vitals }) {
  const recovery = n(vitals.recoveryPct)
  const strain = n(vitals.strain)
  const sleep = n(vitals.sleepH)
  const bodyScore = n(vitals.bodyScore)
  const steps = n(vitals.steps)
  const activeKcal = n(vitals.activeKcal)
  const hrv = n(vitals.hrvMs)
  const rhr = n(vitals.restingHr)
  const resp = n(vitals.respRate)
  const spo2 = n(vitals.spo2Pct)
  const temp = n(vitals.bodyTempC)
  const source = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source.trim() : 'Recorded health data'
  const stepWeek = lastDays('steps')
  const energyWeek = lastDays('activeKcal')
  const hrvTrend = deretMetrik('hrvMs', 30).slice(-30)
  const hasAny = [recovery, strain, sleep, bodyScore, steps, activeKcal, hrv, rhr, resp, spo2, temp].some((x) => x != null)

  return (
    <section className="pmd-health-instruments" aria-labelledby="health-instruments-title">
      <div className="pmd-instruments-head">
        <div>
          <span>LIVE HEALTH INSTRUMENTS</span>
          <h2 id="health-instruments-title">Your recorded scores & signals</h2>
        </div>
        <Link to="/health-data">Device data <b>↗</b></Link>
      </div>

      <div className="pmd-instrument-grid pmd-instrument-grid-two">
        <article className="pmd-instrument-card pmd-score-card">
          <div className="pmd-card-label">RECOVERY</div>
          <div className="pmd-score-row">
            <Gauge value={recovery} label="%" />
            <div className="pmd-score-copy">
              <strong>{recovery == null ? '—' : `${fmt(recovery)}%`}</strong>
              <span>{recovery == null ? 'Awaiting provider-derived score' : source}</span>
            </div>
          </div>
          <div className="pmd-score-rule"><span style={{ width: `${Math.max(0, Math.min(100, recovery ?? 0))}%` }} /></div>
          <div className="pmd-score-footer"><span>Provider score</span><b>{recovery == null ? 'Not recorded' : 'Recorded'}</b></div>
        </article>

        <article className="pmd-instrument-card pmd-score-card">
          <div className="pmd-card-label">BODY / LOAD</div>
          <div className="pmd-score-row">
            <Gauge value={bodyScore ?? strain} max={bodyScore != null ? 100 : Math.max(21, strain ?? 21)} label={bodyScore != null ? '/100' : 'strain'} />
            <div className="pmd-score-copy">
              <strong>{bodyScore != null ? fmt(bodyScore) : strain != null ? fmt(strain, 1) : '—'}</strong>
              <span>{bodyScore != null ? 'Recorded body score' : strain != null ? 'Recorded strain/load' : 'Awaiting wearable data'}</span>
            </div>
          </div>
          <div className="pmd-score-footer"><span>Sleep</span><b>{sleep == null ? '—' : `${fmt(sleep, 1)} h`}</b></div>
        </article>
      </div>

      <article className="pmd-instrument-card pmd-wide-card">
        <div className="pmd-card-topline">
          <div><div className="pmd-card-label">WEEKLY MOVEMENT</div><strong>{steps == null ? '—' : fmt(steps)}</strong><span> steps latest</span></div>
          <span className="pmd-source-pill">{source}</span>
        </div>
        <Bars points={stepWeek} />
      </article>

      <div className="pmd-vitals-strip" aria-label="Current recorded vital signs">
        <Metric icon="⌁" label="HRV" value={hrv} unit=" ms" />
        <Metric icon="♡" label="RHR" value={rhr} unit=" bpm" />
        <Metric icon="◫" label="Resp" value={resp} unit="/m" />
        <Metric icon="◯" label="SpO₂" value={spo2} unit="%" />
        <Metric icon="°" label="Temp" value={temp} unit="°C" />
      </div>

      <article className="pmd-instrument-card pmd-wide-card">
        <div className="pmd-card-topline">
          <div><div className="pmd-card-label">WEEKLY ACTIVE ENERGY</div><strong>{activeKcal == null ? '—' : fmt(activeKcal)}</strong><span> kcal latest</span></div>
          <span className="pmd-source-pill">7 days</span>
        </div>
        <Bars points={energyWeek} compact />
      </article>

      <article className="pmd-instrument-card pmd-wide-card pmd-trend-card">
        <div className="pmd-card-topline">
          <div><div className="pmd-card-label">HRV TREND</div><strong>{hrv == null ? '—' : fmt(hrv)}</strong><span> ms</span></div>
          <span className="pmd-source-pill">30 days</span>
        </div>
        <Sparkline points={hrvTrend} />
        <div className="pmd-trend-caption"><span>Recorded history only</span><span>{hrvTrend.length} days available</span></div>
      </article>

      {!hasAny && (
        <Link className="pmd-connect-empty" to="/health-data">
          <span>Connect or import wearable data</span>
          <b>Scores stay blank until a reviewed source records them →</b>
        </Link>
      )}
    </section>
  )
}

export default HomeHealthInstruments
