import { useMemo } from 'react'
import { calculateLongitudinalTrends, type LongitudinalTrend } from '../lib/longitudinalTrendEngine'
import type { LongitudinalSignal } from '../lib/longitudinalPatientState'

function Sparkline({ trend }: { trend: LongitudinalTrend }) {
  const values = trend.points.slice(-12).map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1e-9, max - min)
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
    const y = 30 - ((value - min) / span) * 26
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" role="img" aria-label={`${trend.metric} trend`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" className="text-cyan-200/80" />
    </svg>
  )
}

function changeLabel(trend: LongitudinalTrend) {
  if (trend.relativeChangePct === null) return `${trend.absoluteChange >= 0 ? '+' : ''}${trend.absoluteChange.toFixed(1)}`
  const value = trend.relativeChangePct
  return `${value >= 0 ? '+' : ''}${value.toFixed(Math.abs(value) >= 10 ? 0 : 1)}%`
}

export function LongitudinalTrendRail({ signals, limit = 6 }: { signals: LongitudinalSignal[]; limit?: number }) {
  const trends = useMemo(() => calculateLongitudinalTrends(signals, { windowDays: 30, minSamples: 2 }).slice(0, limit), [limit, signals])
  if (!trends.length) return null

  return (
    <div className="relative mt-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-[8px] font-black uppercase tracking-[.12em] text-white/28">
        <span>30d observed trends</span>
        <span>descriptive only</span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {trends.map((trend) => (
          <div key={trend.key} className="w-[146px] shrink-0 rounded-[15px] border border-white/[.06] bg-black/20 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[8px] font-black uppercase tracking-[.1em] text-white/30">{trend.domain}</div>
                <strong className="mt-0.5 block truncate text-[10px]">{trend.metric}</strong>
              </div>
              <span className={`shrink-0 text-[10px] font-black tabular-nums ${trend.direction === 'flat' ? 'text-white/42' : 'text-cyan-100/80'}`}>{changeLabel(trend)}</span>
            </div>
            <div className="mt-2 text-cyan-100/70"><Sparkline trend={trend} /></div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="truncate text-[9px] font-black tabular-nums text-white/64">{Number.isInteger(trend.latestValue) ? trend.latestValue : trend.latestValue.toFixed(1)} {trend.unit ?? ''}</span>
              <span className="shrink-0 text-[7px] font-black uppercase tracking-[.08em] text-white/24">n={trend.sampleCount}{trend.mixedProvenance ? ' · mixed' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LongitudinalTrendRail
