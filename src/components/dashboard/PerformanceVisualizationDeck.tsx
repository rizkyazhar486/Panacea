import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getVitals, type Vitals } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import type { ImportedWorkout } from '../../lib/workoutImport'
import { deretMetrik } from '../../lib/riwayatVitals'
import { useStore } from '../../lib/store'

type AthleteSnapshot = {
  age?: number
  g?: 'M' | 'F'
  hrMax?: number
  acuteLoad?: number
  chronicLoad?: number
  hrv?: number
  hrvBaseline?: number
  recoveryHrs?: number
  sleepScore?: number
  teAerobic?: number
  teAnaerobic?: number
}

type Mode = 'home' | 'athlete'

type TrendPoint = { label: string; value: number }
type ScatterPoint = { x: number; y: number; label: string }

const ZONE_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444']
const MIX_COLORS = ['#08b6ff', '#7c4dff', '#ff3d81', '#ff8a1f', '#2ed47a']

function clamp(n: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, n)) }

function readAthlete(): AthleteSnapshot {
  try {
    const raw = localStorage.getItem('pm_athlete_profile')
    return raw ? JSON.parse(raw) as AthleteSnapshot : {}
  } catch {
    return {}
  }
}

function effectiveHrMax(p: AthleteSnapshot): { value: number; estimated: boolean } {
  if (typeof p.hrMax === 'number' && p.hrMax > 0) return { value: p.hrMax, estimated: false }
  if (typeof p.age === 'number' && p.age > 0) {
    const value = (p.g ?? 'M') === 'F' ? 226 - p.age : 220 - p.age
    return { value, estimated: true }
  }
  return { value: 0, estimated: false }
}

function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shortDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function paceLabel(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function weeklyVolume(workouts: ImportedWorkout[]) {
  const out: { key: string; label: string; minutes: number }[] = []
  const now = new Date()
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - offset)
    out.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes: 0 })
  }
  const byKey = new Map(out.map((d) => [d.key, d]))
  for (const w of workouts) {
    const d = new Date(w.mulai)
    const slot = byKey.get(dayKey(d))
    if (slot && Number.isFinite(w.durasi) && w.durasi > 0) slot.minutes += w.durasi / 60
  }
  return out.map((d) => ({ ...d, minutes: Math.round(d.minutes) }))
}

function zoneDistribution(workouts: ImportedWorkout[], hrMax: number) {
  const seconds = [0, 0, 0, 0, 0]
  if (!hrMax) return seconds
  const cutoff = Date.now() - 14 * 864e5
  for (const w of workouts) {
    if (Date.parse(w.mulai) < cutoff || w.hr.length < 2) continue
    for (let i = 0; i < w.hr.length - 1; i++) {
      const pt = w.hr[i]
      const nxt = w.hr[i + 1]
      const dt = Math.min(Math.max(nxt.t - pt.t, 0), 120)
      const pct = pt.bpm / hrMax
      const idx = pct < 0.6 ? 0 : pct < 0.7 ? 1 : pct < 0.8 ? 2 : pct < 0.9 ? 3 : 4
      seconds[idx] += dt
    }
  }
  return seconds
}

function sessionMix(workouts: ImportedWorkout[]) {
  const cutoff = Date.now() - 28 * 864e5
  const bins = new Map<string, number>([['Run', 0], ['Strength', 0], ['Cycle', 0], ['Walk/Hike', 0], ['Other', 0]])
  for (const w of workouts) {
    if (Date.parse(w.mulai) < cutoff) continue
    const n = w.nama.toLowerCase()
    const key = /run|lari|jog/.test(n) ? 'Run'
      : /strength|weight|resistance|angkat|gym/.test(n) ? 'Strength'
        : /cycle|bike|sepeda/.test(n) ? 'Cycle'
          : /walk|hike|jalan/.test(n) ? 'Walk/Hike' : 'Other'
    bins.set(key, (bins.get(key) ?? 0) + 1)
  }
  return [...bins.entries()].map(([label, value]) => ({ label, value })).filter((x) => x.value > 0)
}

function activityCalendar(workouts: ImportedWorkout[], gps: { at: string; durSec: number }[]) {
  const out: { key: string; label: string; minutes: number }[] = []
  const now = new Date()
  for (let offset = 27; offset >= 0; offset--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - offset)
    out.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), minutes: 0 })
  }
  const byKey = new Map(out.map((d) => [d.key, d]))
  if (workouts.length) {
    for (const w of workouts) {
      const slot = byKey.get(dayKey(new Date(w.mulai)))
      if (slot && w.durasi > 0) slot.minutes += w.durasi / 60
    }
  } else {
    for (const g of gps) {
      const slot = byKey.get(dayKey(new Date(g.at)))
      if (slot && g.durSec > 0) slot.minutes += g.durSec / 60
    }
  }
  return out.map((d) => ({ ...d, minutes: Math.round(d.minutes) }))
}

function paceHrScatter(workouts: ImportedWorkout[], gps: { at: string; avgHr?: number; avgSpeedKmh: number; sport: string }[]): ScatterPoint[] {
  const cutoff = Date.now() - 60 * 864e5
  const imported = workouts
    .filter((w) => Date.parse(w.mulai) >= cutoff && (w.avgHr ?? 0) > 0 && (w.paceSec ?? 0) > 0)
    .sort((a, b) => Date.parse(a.mulai) - Date.parse(b.mulai))
    .slice(-18)
    .map((w) => ({ x: w.avgHr!, y: w.paceSec!, label: `${shortDate(w.mulai)} · ${w.nama}` }))
  if (imported.length >= 2) return imported
  return gps
    .filter((g) => Date.parse(g.at) >= cutoff && (g.avgHr ?? 0) > 0 && g.avgSpeedKmh > 0)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(-18)
    .map((g) => ({ x: g.avgHr!, y: 3600 / g.avgSpeedKmh, label: `${shortDate(g.at)} · ${g.sport}` }))
}

function latestRecovery(workouts: ImportedWorkout[]) {
  return [...workouts]
    .filter((w) => w.pemulihan.length >= 2)
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))[0]
}

function Donut({ values, colors, center, sub }: { values: number[]; colors: string[]; center: string; sub: string }) {
  const total = values.reduce((a, b) => a + b, 0)
  const r = 43
  const c = 2 * Math.PI * r
  let cursor = 0
  return (
    <div className="relative mx-auto h-[132px] w-[132px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-neutral-100 dark:text-white/10" />
        {total > 0 && values.map((v, i) => {
          const len = c * (v / total)
          const dashOffset = -cursor
          cursor += len
          return <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={colors[i]} strokeWidth="12" strokeLinecap="butt" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={dashOffset} />
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[22px] font-black tracking-tight text-neutral-950 dark:text-white">{center}</div>
          <div className="mt-0.5 text-[9px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">{sub}</div>
        </div>
      </div>
    </div>
  )
}

function Sparkline({ points, idPrefix = 'pmd-viz' }: { points: number[]; idPrefix?: string }) {
  if (points.length < 2) return <div className="grid h-[94px] place-items-center text-[11px] font-semibold text-neutral-400">Need at least 2 days of history</div>
  const w = 320, h = 86, pad = 8
  const min = Math.min(...points), max = Math.max(...points)
  const range = Math.max(max - min, 1)
  const x = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2)
  const d = points.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')
  const area = `${d} L ${x(points.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`
  const areaId = `${idPrefix}-area`
  const lineId = `${idPrefix}-line`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[94px] w-full" role="img" aria-label="Personal biomarker trend">
      <defs>
        <linearGradient id={areaId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6d5dfc" stopOpacity=".34" />
          <stop offset="100%" stopColor="#10b7ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={lineId} x1="0" x2="1">
          <stop offset="0%" stopColor="#10b7ff" />
          <stop offset="55%" stopColor="#7957ff" />
          <stop offset="100%" stopColor="#ff3d81" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${areaId})`} />
      <path d={d} fill="none" stroke={`url(#${lineId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="4.5" fill="#ff3d81" stroke="white" strokeWidth="2" />
    </svg>
  )
}

function ScatterPlot({ points }: { points: ScatterPoint[] }) {
  if (points.length < 2) return null
  const w = 320, h = 150, px = 34, py = 14
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  const xMin = Math.floor(Math.min(...xs) - 3), xMax = Math.ceil(Math.max(...xs) + 3)
  const yMin = Math.max(0, Math.floor(Math.min(...ys) - 15)), yMax = Math.ceil(Math.max(...ys) + 15)
  const X = (n: number) => px + ((n - xMin) / Math.max(xMax - xMin, 1)) * (w - px - 10)
  const Y = (n: number) => py + ((n - yMin) / Math.max(yMax - yMin, 1)) * (h - py - 24)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-[150px] w-full" role="img" aria-label="Average heart rate compared with pace across workouts">
      {[0, 1, 2, 3].map((i) => {
        const yy = py + (i / 3) * (h - py - 24)
        return <line key={i} x1={px} x2={w - 10} y1={yy} y2={yy} stroke="currentColor" className="text-neutral-200 dark:text-white/10" strokeWidth="1" />
      })}
      {points.map((p, i) => <circle key={`${p.label}-${i}`} cx={X(p.x)} cy={Y(p.y)} r="5" fill={i === points.length - 1 ? '#ff3d81' : '#6d5dfc'} opacity={i === points.length - 1 ? 1 : .72}><title>{p.label}: {Math.round(p.x)} bpm · {paceLabel(p.y)}/km</title></circle>)}
      <text x={px} y={h - 5} fontSize="9" fill="currentColor" className="text-neutral-400">{xMin} bpm</text>
      <text x={w - 10} y={h - 5} textAnchor="end" fontSize="9" fill="currentColor" className="text-neutral-400">{xMax} bpm →</text>
      <text x="7" y="16" fontSize="9" fill="currentColor" className="text-neutral-400">faster</text>
      <text x="7" y={h - 24} fontSize="9" fill="currentColor" className="text-neutral-400">slower</text>
    </svg>
  )
}

function RecoveryCurve({ workout }: { workout: ImportedWorkout }) {
  const points = workout.pemulihan.filter((p) => p.t >= 0 && p.t <= 300).slice(0, 20)
  if (points.length < 2) return null
  const w = 320, h = 118, px = 18, py = 10
  const maxT = Math.max(...points.map((p) => p.t), 60)
  const minB = Math.min(...points.map((p) => p.bpm)) - 4
  const maxB = Math.max(...points.map((p) => p.bpm)) + 4
  const X = (t: number) => px + (t / maxT) * (w - px * 2)
  const Y = (b: number) => h - py - ((b - minB) / Math.max(maxB - minB, 1)) * (h - py * 2)
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${X(p.t)} ${Y(p.bpm)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-[118px] w-full" role="img" aria-label="Heart-rate recovery after the latest workout">
      <defs><linearGradient id="pmd-recovery-line" x1="0" x2="1"><stop offset="0%" stopColor="#ff3d81"/><stop offset="50%" stopColor="#7c4dff"/><stop offset="100%" stopColor="#08b6ff"/></linearGradient></defs>
      <line x1={px} x2={w - px} y1={h - py} y2={h - py} stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
      <path d={d} fill="none" stroke="url(#pmd-recovery-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={X(p.t)} cy={Y(p.bpm)} r={i === 0 || i === points.length - 1 ? 4 : 2.2} fill={i === points.length - 1 ? '#08b6ff' : '#ff3d81'} opacity={i === 0 || i === points.length - 1 ? 1 : .5} />)}
      <text x={px} y={h - 1} fontSize="9" fill="currentColor" className="text-neutral-400">0s</text>
      <text x={w - px} y={h - 1} textAnchor="end" fontSize="9" fill="currentColor" className="text-neutral-400">{Math.round(maxT)}s</text>
    </svg>
  )
}

function SleepBars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="mt-4 flex h-[112px] items-end gap-1.5" role="img" aria-label="Sleep hours across recent recorded nights">
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <div className="text-[7px] font-black text-neutral-400">{r.value.toFixed(1)}</div>
          <div className="w-full rounded-t-[8px] bg-gradient-to-t from-indigo-600 via-violet-500 to-fuchsia-400" style={{ height: `${Math.max(7, (r.value / max) * 82)}px`, opacity: .55 + (i / Math.max(rows.length - 1, 1)) * .45 }} />
          <div className="text-[7px] font-black text-neutral-400">{r.label}</div>
        </div>
      ))}
    </div>
  )
}

function ActivityHeatmap({ rows }: { rows: { key: string; label: string; minutes: number }[] }) {
  const max = Math.max(...rows.map((r) => r.minutes), 1)
  const total = rows.reduce((a, b) => a + b.minutes, 0)
  const activeDays = rows.filter((r) => r.minutes > 0).length
  return (
    <>
      <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label="Twenty-eight day activity heatmap">
        {rows.map((r) => {
          const level = r.minutes <= 0 ? 0 : clamp(r.minutes / max, .18, 1)
          return <div key={r.key} title={`${r.label}: ${r.minutes} min`} className="aspect-square rounded-[7px] border border-black/[.04] dark:border-white/[.05]" style={{ background: level ? `rgba(109,93,252,${0.18 + level * 0.76})` : 'rgba(148,163,184,.10)' }} />
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-neutral-400"><span>{activeDays} active days</span><span>{total} min / 28d</span><span>more →</span></div>
    </>
  )
}

function Meter({ label, value, suffix, note }: { label: string; value: number; suffix?: string; note?: string }) {
  const pct = clamp(value)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[.1em] text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="text-[12px] font-black tabular-nums text-neutral-900 dark:text-white">{Math.round(value)}{suffix}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
      </div>
      {note && <div className="mt-1 text-[9px] font-semibold text-neutral-400">{note}</div>}
    </div>
  )
}

function CardShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`overflow-hidden rounded-[26px] border border-black/[.06] bg-white/82 p-4 shadow-[0_14px_40px_rgba(24,45,85,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0e18]/78 ${className}`}>{children}</article>
}

export function PerformanceVisualizationDeck({ mode = 'home' }: { mode?: Mode }) {
  const { state } = useStore()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const update = () => setTick((x) => x + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  const data = useMemo(() => {
    const vitals: Vitals = getVitals()
    const workouts = getWorkouts()
    const athlete = readAthlete()
    const maxHr = effectiveHrMax(athlete)
    const weekly = weeklyVolume(workouts)
    const zones = zoneDistribution(workouts, maxHr.value)
    const mix = sessionMix(workouts)
    const hrv = deretMetrik('hrvMs', 14)
    const rhr = deretMetrik('restingHr', 14)
    const activity28 = activityCalendar(workouts, state.gpsActivities ?? [])
    const scatter = paceHrScatter(workouts, state.gpsActivities ?? [])
    const recovery = latestRecovery(workouts)
    return { vitals, workouts, athlete, maxHr, weekly, zones, mix, hrv, rhr, activity28, scatter, recovery }
  }, [tick, state.gpsActivities])

  const weeklyMax = Math.max(...data.weekly.map((d) => d.minutes), 1)
  const weeklyTotal = data.weekly.reduce((a, b) => a + b.minutes, 0)
  const zoneTotal = data.zones.reduce((a, b) => a + b, 0)
  const zonePct = zoneTotal ? data.zones.map((z) => Math.round((z / zoneTotal) * 100)) : []
  const biomarker = data.hrv.length >= 2 ? { label: 'HRV', unit: 'ms', rows: data.hrv } : { label: 'Resting HR', unit: 'bpm', rows: data.rhr }
  const bioPoints = biomarker.rows.map((x) => x.nilai)
  const bioCurrent = bioPoints.length ? bioPoints[bioPoints.length - 1] : 0

  const acwr = (data.athlete.acuteLoad ?? 0) > 0 && (data.athlete.chronicLoad ?? 0) > 0
    ? (data.athlete.acuteLoad ?? 0) / Math.max(data.athlete.chronicLoad ?? 1, 1)
    : 0
  const hrvVsBase = (data.athlete.hrv ?? 0) > 0 && (data.athlete.hrvBaseline ?? 0) > 0
    ? ((data.athlete.hrv ?? 0) / Math.max(data.athlete.hrvBaseline ?? 1, 1)) * 100
    : 0
  const recoveryDirect = typeof data.vitals.recoveryPct === 'number' ? data.vitals.recoveryPct : 0

  const sleepRows = useMemo(() => {
    const logs = [...(state.sleepLogs ?? [])]
      .filter((x) => typeof x.hours === 'number' && x.hours > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((x) => ({ label: new Date(`${x.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: x.hours }))
    if (logs.length >= 2) return logs
    return deretMetrik('sleepH', 10).map((x) => ({ label: new Date(`${x.tanggal}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: x.nilai }))
  }, [state.sleepLogs, tick])

  const vo2Rows = useMemo<TrendPoint[]>(() => {
    const direct = [...(state.vo2maxLog ?? [])]
      .filter((x) => typeof x.value === 'number' && x.value > 0)
      .sort((a, b) => a.at.localeCompare(b.at))
      .slice(-12)
      .map((x) => ({ label: shortDate(x.at), value: x.value }))
    if (direct.length >= 2) return direct
    return deretMetrik('vo2max', 90).slice(-12).map((x) => ({ label: shortDate(x.tanggal), value: x.nilai }))
  }, [state.vo2maxLog, tick])

  const advancedAvailable = data.activity28.some((d) => d.minutes > 0) || sleepRows.length >= 2 || vo2Rows.length >= 2 || data.scatter.length >= 2 || !!data.recovery
  const sleepAvg = sleepRows.length ? sleepRows.reduce((a, b) => a + b.value, 0) / sleepRows.length : 0
  const vo2Values = vo2Rows.map((x) => x.value)
  const vo2Delta = vo2Values.length >= 2 ? vo2Values[vo2Values.length - 1] - vo2Values[0] : 0

  return (
    <section className={mode === 'home' ? 'home-section-shell rounded-[30px] p-4 sm:p-5' : 'mt-5'} aria-label="Performance data visualizations">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-violet-600 dark:text-violet-300">Visual intelligence</div>
          <h2 className="mt-1 text-[19px] font-black tracking-tight text-neutral-950 dark:text-white">{mode === 'athlete' ? 'Performance command center' : 'Your data at a glance'}</h2>
          <p className="mt-1 max-w-xl text-[10px] font-semibold leading-relaxed text-neutral-500 dark:text-neutral-400">Charts use your stored wearable and workout data; missing measurements stay empty rather than being invented.</p>
        </div>
        {mode === 'athlete' && <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black text-violet-700 dark:text-violet-200">14–60 day view</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CardShell>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">7-day volume</div>
              <div className="mt-1 text-[26px] font-black tracking-tight text-neutral-950 dark:text-white">{weeklyTotal}<span className="ml-1 text-[11px] font-bold text-neutral-400">min</span></div>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[9px] font-black text-cyan-700 dark:text-cyan-200">REAL SESSIONS</span>
          </div>
          <div className="mt-4 flex h-[118px] items-end gap-2" role="img" aria-label="Workout minutes for each of the last seven days">
            {data.weekly.map((d) => {
              const h = d.minutes > 0 ? Math.max(10, (d.minutes / weeklyMax) * 88) : 4
              return (
                <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="text-[8px] font-black tabular-nums text-neutral-400">{d.minutes || ''}</div>
                  <div className="w-full rounded-t-[10px] bg-gradient-to-t from-cyan-500 via-blue-500 to-violet-500 shadow-[0_0_18px_rgba(82,92,255,.18)]" style={{ height: `${h}px`, opacity: d.minutes ? 1 : .18 }} />
                  <div className="text-[9px] font-black text-neutral-400">{d.label}</div>
                </div>
              )
            })}
          </div>
        </CardShell>

        <CardShell>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">{zoneTotal ? 'Intensity distribution' : 'Session mix'}</div>
              <div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{zoneTotal ? 'Time in HR zones · last 14 days' : 'Workout types · last 28 days'}</div>
            </div>
            {zoneTotal > 0 && <div className="text-right text-[9px] font-bold text-neutral-400">HRmax {data.maxHr.value}{data.maxHr.estimated ? ' est.' : ''}</div>}
          </div>
          <div className="mt-2 grid grid-cols-[138px_1fr] items-center gap-2">
            {zoneTotal ? (
              <>
                <Donut values={data.zones} colors={ZONE_COLORS} center={`${Math.round(zoneTotal / 60)}m`} sub="zone time" />
                <div className="space-y-2">
                  {['Z1 Recovery', 'Z2 Base', 'Z3 Tempo', 'Z4 Threshold', 'Z5 Max'].map((label, i) => (
                    <div key={label} className="flex items-center justify-between gap-2 text-[9px]">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-500 dark:text-neutral-300"><i className="h-2 w-2 rounded-full" style={{ background: ZONE_COLORS[i] }} />{label}</span>
                      <b className="tabular-nums text-neutral-800 dark:text-white">{zonePct[i]}%</b>
                    </div>
                  ))}
                </div>
              </>
            ) : data.mix.length ? (
              <>
                <Donut values={data.mix.map((x) => x.value)} colors={MIX_COLORS} center={String(data.mix.reduce((a, b) => a + b.value, 0))} sub="sessions" />
                <div className="space-y-2">
                  {data.mix.map((x, i) => (
                    <div key={x.label} className="flex items-center justify-between gap-2 text-[9px]">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-500 dark:text-neutral-300"><i className="h-2 w-2 rounded-full" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />{x.label}</span>
                      <b className="tabular-nums text-neutral-800 dark:text-white">{x.value}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-2 grid h-[132px] place-items-center rounded-2xl border border-dashed border-neutral-200 text-center text-[11px] font-semibold text-neutral-400 dark:border-white/10">
                Import or record workouts to unlock the donut view.
              </div>
            )}
          </div>
        </CardShell>

        <CardShell>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Personal trend</div>
              <div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{biomarker.label} · up to 14 days</div>
            </div>
            {bioCurrent > 0 && <div className="text-right"><b className="text-[21px] font-black text-neutral-950 dark:text-white">{Math.round(bioCurrent)}</b><span className="ml-1 text-[9px] font-bold text-neutral-400">{biomarker.unit}</span></div>}
          </div>
          <Sparkline points={bioPoints} idPrefix="pmd-biomarker" />
          {bioPoints.length >= 2 && (
            <div className="flex justify-between text-[9px] font-bold text-neutral-400"><span>low {Math.round(Math.min(...bioPoints))}</span><span>{bioPoints.length} recorded days</span><span>high {Math.round(Math.max(...bioPoints))}</span></div>
          )}
        </CardShell>

        <CardShell>
          <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Recovery & load signals</div>
          <div className="mt-3 space-y-3.5">
            {recoveryDirect > 0 && <Meter label="Wearable recovery" value={recoveryDirect} suffix="%" note="Direct value from synced device data" />}
            {(data.athlete.sleepScore ?? 0) > 0 && <Meter label="Sleep score" value={data.athlete.sleepScore ?? 0} suffix="/100" note="Direct score entered/synced in Athlete" />}
            {hrvVsBase > 0 && <Meter label="HRV vs baseline" value={hrvVsBase} suffix="%" note={`${Math.round(data.athlete.hrv ?? 0)} ms vs ${Math.round(data.athlete.hrvBaseline ?? 0)} ms baseline`} />}
            {acwr > 0 && (
              <div>
                <div className="flex items-baseline justify-between"><span className="text-[10px] font-black uppercase tracking-[.1em] text-neutral-500 dark:text-neutral-400">Acute : chronic load</span><b className="text-[14px] font-black tabular-nums text-neutral-900 dark:text-white">{acwr.toFixed(2)}</b></div>
                <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                  <div className="absolute inset-y-0 bg-emerald-400/35" style={{ left: '40%', width: '25%' }} />
                  <div className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(236,72,153,.5)]" style={{ left: `${clamp((acwr / 2) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[8px] font-bold text-neutral-400"><span>0</span><span>0.8</span><span>sweet 0.8–1.3</span><span>2.0+</span></div>
              </div>
            )}
            {!recoveryDirect && !(data.athlete.sleepScore ?? 0) && !hrvVsBase && !acwr && (
              <div className="grid h-[118px] place-items-center rounded-2xl border border-dashed border-neutral-200 px-5 text-center text-[11px] font-semibold leading-relaxed text-neutral-400 dark:border-white/10">Add recovery, sleep, HRV baseline or training-load data to turn this panel into visual gauges.</div>
            )}
          </div>
        </CardShell>
      </div>

      {advancedAvailable && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-fuchsia-600 dark:text-fuchsia-300">Pattern layer</div>
              <div className="mt-0.5 text-[13px] font-black text-neutral-900 dark:text-white">See the shape, not just the number</div>
            </div>
            <span className="text-[9px] font-bold text-neutral-400">only when real history exists</span>
          </div>

          <div className={mode === 'home' ? 'no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2' : 'grid gap-3 sm:grid-cols-2'}>
            {data.activity28.some((d) => d.minutes > 0) && (
              <CardShell className={mode === 'home' ? 'w-[310px] shrink-0 snap-start' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Consistency</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">28-day activity heatmap</div></div>
                  <span className="text-[18px]">▦</span>
                </div>
                <ActivityHeatmap rows={data.activity28} />
              </CardShell>
            )}

            {sleepRows.length >= 2 && (
              <CardShell className={mode === 'home' ? 'w-[310px] shrink-0 snap-start' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Sleep rhythm</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">Recent sleep duration</div></div>
                  <div className="text-right"><b className="text-[20px] font-black text-indigo-600 dark:text-indigo-300">{sleepAvg.toFixed(1)}</b><span className="ml-1 text-[9px] font-bold text-neutral-400">h avg</span></div>
                </div>
                <SleepBars rows={sleepRows} />
              </CardShell>
            )}

            {vo2Rows.length >= 2 && (
              <CardShell className={mode === 'home' ? 'w-[310px] shrink-0 snap-start' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Aerobic capacity</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">VO₂max trajectory</div></div>
                  <div className="text-right"><b className="text-[20px] font-black text-cyan-600 dark:text-cyan-300">{vo2Values[vo2Values.length - 1].toFixed(1)}</b><div className={`text-[9px] font-black ${vo2Delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{vo2Delta >= 0 ? '+' : ''}{vo2Delta.toFixed(1)} across shown data</div></div>
                </div>
                <Sparkline points={vo2Values} idPrefix="pmd-vo2" />
                <div className="flex justify-between text-[8px] font-bold text-neutral-400"><span>{vo2Rows[0].label}</span><span>{vo2Rows.length} measurements</span><span>{vo2Rows[vo2Rows.length - 1].label}</span></div>
              </CardShell>
            )}

            {mode === 'athlete' && data.scatter.length >= 2 && (
              <CardShell>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Running efficiency</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">Pace × average heart rate</div></div>
                  <span className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-[8px] font-black text-fuchsia-600 dark:text-fuchsia-300">last {data.scatter.length}</span>
                </div>
                <ScatterPlot points={data.scatter} />
                <div className="mt-1 text-[9px] font-semibold leading-relaxed text-neutral-400">Each dot is one workout. A similar pace at a lower average HR can be visually compared, but this chart does not prove a physiological cause.</div>
              </CardShell>
            )}

            {mode === 'athlete' && data.recovery && (
              <CardShell>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Post-exercise recovery</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">Heart-rate recovery curve</div></div>
                  {typeof data.recovery.hrr1 === 'number' && <div className="text-right"><b className="text-[20px] font-black text-emerald-600 dark:text-emerald-300">−{data.recovery.hrr1}</b><span className="ml-1 text-[9px] font-bold text-neutral-400">bpm / 1 min</span></div>}
                </div>
                <RecoveryCurve workout={data.recovery} />
                <div className="flex justify-between text-[8px] font-bold text-neutral-400"><span>{shortDate(data.recovery.mulai)}</span><span>{data.recovery.nama}</span><span>{data.recovery.pemulihan.length} recovery samples</span></div>
              </CardShell>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 px-1 text-[9px] font-semibold leading-relaxed text-neutral-400">Formulas: weekly volume = Σ workout duration per day; zone share = time in each HR band ÷ total HR-sampled time; ACWR = acute 7-day load ÷ chronic 28-day weekly average; activity heat = Σ workout minutes/day; pace = 3600 ÷ speed (km/h) when direct pace is unavailable. Visuals summarize measurements and are not diagnostic scores.</div>
    </section>
  )
}

export default PerformanceVisualizationDeck
