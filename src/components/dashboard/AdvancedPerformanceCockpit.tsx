import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getVitals } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import type { ImportedWorkout } from '../../lib/workoutImport'
import { useStore } from '../../lib/store'

type Mode = 'home' | 'athlete'
type Sport = 'Run' | 'Strength' | 'Cycle' | 'Walk/Hike' | 'Other'

type Session = {
  id: string
  at: string
  sport: Sport
  minutes: number
  distanceKm?: number
  avgHr?: number
  paceSec?: number
}

type AthleteSnapshot = {
  hrv?: number
  hrvBaseline?: number
  sleepScore?: number
  recoveryHrs?: number
}

const SPORT_COLORS: Record<Sport, string> = {
  Run: '#28c7ff',
  Strength: '#7c5cff',
  Cycle: '#ff4f9a',
  'Walk/Hike': '#2ed47a',
  Other: '#ff9f43',
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function dayKey(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sportBucket(name: string): Sport {
  const n = name.toLowerCase()
  if (/run|lari|jog|marathon/.test(n)) return 'Run'
  if (/strength|weight|resistance|gym|angkat/.test(n)) return 'Strength'
  if (/cycle|bike|sepeda/.test(n)) return 'Cycle'
  if (/walk|hike|jalan|trek/.test(n)) return 'Walk/Hike'
  return 'Other'
}

function readAthlete(): AthleteSnapshot {
  try {
    const raw = localStorage.getItem('pm_athlete_profile')
    return raw ? JSON.parse(raw) as AthleteSnapshot : {}
  } catch {
    return {}
  }
}

function sessionKey(s: Session) {
  return `${dayKey(s.at)}|${s.sport}|${Math.round(s.minutes)}|${(s.distanceKm ?? 0).toFixed(1)}`
}

function collectSessions(workouts: ImportedWorkout[], gps: Array<{ id: string; at: string; sport: string; distKm: number; durSec: number; avgHr?: number }>): Session[] {
  const all: Session[] = []

  for (const w of workouts) {
    if (!w.mulai || !Number.isFinite(w.durasi) || w.durasi <= 0) continue
    const minutes = w.durasi / 60
    const distanceKm = typeof w.jarakKm === 'number' && w.jarakKm > 0 ? w.jarakKm : undefined
    const paceSec = typeof w.paceSec === 'number' && w.paceSec > 0
      ? w.paceSec
      : distanceKm ? w.durasi / distanceKm : undefined
    all.push({
      id: `import-${w.id}`,
      at: w.mulai,
      sport: sportBucket(w.nama),
      minutes,
      distanceKm,
      avgHr: w.avgHr,
      paceSec,
    })
  }

  for (const g of gps) {
    if (!g.at || !Number.isFinite(g.durSec) || g.durSec <= 0) continue
    const distanceKm = Number.isFinite(g.distKm) && g.distKm > 0 ? g.distKm : undefined
    all.push({
      id: `gps-${g.id}`,
      at: g.at,
      sport: sportBucket(g.sport),
      minutes: g.durSec / 60,
      distanceKm,
      avgHr: g.avgHr,
      paceSec: distanceKm ? g.durSec / distanceKm : undefined,
    })
  }

  // Wearable imports and GPS capture can represent the same session. A coarse
  // day/sport/duration/distance key prevents obvious double counting while
  // keeping genuinely separate workouts from the same day.
  const deduped = new Map<string, Session>()
  for (const s of all.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) {
    const key = sessionKey(s)
    const prev = deduped.get(key)
    if (!prev || (s.avgHr && !prev.avgHr)) deduped.set(key, s)
  }
  return [...deduped.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}

function fourWeekSportLoad(sessions: Session[]) {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setDate(start.getDate() - 27)
  start.setHours(0, 0, 0, 0)

  const weeks = Array.from({ length: 4 }, (_, i) => ({
    label: i === 3 ? 'This wk' : `${3 - i}w ago`,
    total: 0,
    Run: 0,
    Strength: 0,
    Cycle: 0,
    'Walk/Hike': 0,
    Other: 0,
  }))

  for (const s of sessions) {
    const t = new Date(s.at).getTime()
    if (!Number.isFinite(t) || t < start.getTime() || t > now.getTime()) continue
    const idx = clamp(Math.floor((t - start.getTime()) / (7 * 864e5)), 0, 3)
    weeks[idx][s.sport] += s.minutes
    weeks[idx].total += s.minutes
  }
  return weeks
}

function weightedHalfHr(w: ImportedWorkout) {
  if (!Array.isArray(w.hr) || w.hr.length < 4) return null
  const rows = [...w.hr].sort((a, b) => a.t - b.t)
  const end = rows[rows.length - 1]?.t ?? 0
  if (end <= 0) return null
  const midpoint = end / 2
  let firstSum = 0, firstSec = 0, secondSum = 0, secondSec = 0

  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]
    const b = rows[i + 1]
    let from = Math.max(0, a.t)
    const to = Math.max(from, Math.min(b.t, a.t + 120))
    if (to <= from || !Number.isFinite(a.bpm) || a.bpm <= 0) continue

    if (from < midpoint) {
      const sec = Math.max(0, Math.min(to, midpoint) - from)
      firstSum += a.bpm * sec
      firstSec += sec
      from += sec
    }
    if (to > midpoint && from < to) {
      const sec = to - Math.max(from, midpoint)
      secondSum += a.bpm * sec
      secondSec += sec
    }
  }

  if (firstSec < 60 || secondSec < 60) return null
  const first = firstSum / firstSec
  const second = secondSum / secondSec
  return {
    first,
    second,
    deltaPct: ((second - first) / first) * 100,
  }
}

function recentHrDrift(workouts: ImportedWorkout[]) {
  return [...workouts]
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    .map((w) => {
      const drift = weightedHalfHr(w)
      return drift ? { id: w.id, at: w.mulai, name: w.nama, ...drift } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .slice(0, 5)
    .reverse()
}

function fmtPace(sec?: number) {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDuration(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const totalMin = Math.round(sec / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function personalBestSeries(sessions: Session[]) {
  const runs = sessions
    .filter((s) => s.sport === 'Run' && (s.distanceKm ?? 0) > 0 && (s.paceSec ?? 0) > 0)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const targets = [1, 5, 10]
    .map((target) => ({
      target,
      rows: runs.filter((s) => Math.abs((s.distanceKm ?? 0) - target) / target <= 0.15),
    }))
    .filter((x) => x.rows.length >= 2)
    .sort((a, b) => b.rows.length - a.rows.length)

  if (!targets.length) return null
  const selected = targets[0]
  let best = Number.POSITIVE_INFINITY
  const points = selected.rows.map((s) => {
    best = Math.min(best, s.paceSec ?? best)
    return { at: s.at, paceSec: best }
  })
  return { target: selected.target, points }
}

function bestProjectionBase(sessions: Session[]) {
  const runs = sessions.filter((s) => s.sport === 'Run' && (s.distanceKm ?? 0) >= 3 && s.minutes > 0)
  if (!runs.length) return null
  const closeTo5k = runs.filter((s) => Math.abs((s.distanceKm ?? 0) - 5) / 5 <= 0.2)
  const pool = closeTo5k.length ? closeTo5k : runs
  return [...pool].sort((a, b) => (a.paceSec ?? Infinity) - (b.paceSec ?? Infinity))[0] ?? null
}

function raceProjection(base: Session | null) {
  if (!base?.distanceKm || !base.minutes) return []
  const t1 = base.minutes * 60
  const d1 = base.distanceKm
  return [5, 10, 21.0975, 42.195].map((distanceKm) => ({
    distanceKm,
    seconds: t1 * Math.pow(distanceKm / d1, 1.06),
  }))
}

function LineChart({ values, invert = false, suffix = '' }: { values: number[]; invert?: boolean; suffix?: string }) {
  if (values.length < 2) return <div className="grid h-[126px] place-items-center text-[10px] font-semibold text-neutral-400">Need more history</div>
  const w = 320, h = 112, pad = 10
  const min = Math.min(...values), max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const x = (i: number) => pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2)
  const y = (v: number) => {
    const p = (v - min) / span
    const q = invert ? p : 1 - p
    return pad + q * (h - pad * 2)
  }
  const d = values.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')
  const area = `${d} L ${x(values.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[126px] w-full" role="img" aria-label="Performance trend">
        <defs>
          <linearGradient id="adv-line" x1="0" x2="1"><stop offset="0%" stopColor="#22d3ee" /><stop offset="50%" stopColor="#6366f1" /><stop offset="100%" stopColor="#ec4899" /></linearGradient>
          <linearGradient id="adv-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity=".25" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient>
        </defs>
        <path d={area} fill="url(#adv-area)" />
        <path d={d} fill="none" stroke="url(#adv-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4.5 : 2.5} fill={i === values.length - 1 ? '#ec4899' : '#6366f1'} />)}
      </svg>
      {suffix && <div className="-mt-1 text-right text-[8px] font-bold text-neutral-400">{suffix}</div>}
    </div>
  )
}

function Rings({ signals }: { signals: Array<{ label: string; value: number; display: string; color: string }> }) {
  const shown = signals.slice(0, 3)
  if (!shown.length) return <div className="grid h-[150px] place-items-center rounded-2xl border border-dashed border-neutral-200 px-4 text-center text-[10px] font-semibold text-neutral-400 dark:border-white/10">Sync recovery, sleep score or HRV baseline to unlock radial rings.</div>
  const radii = [48, 36, 24]
  return (
    <div className="grid grid-cols-[156px_1fr] items-center gap-3">
      <svg viewBox="0 0 140 140" className="h-[156px] w-[156px] -rotate-90" role="img" aria-label="Recovery signal rings">
        {shown.map((s, i) => {
          const r = radii[i]
          const c = 2 * Math.PI * r
          const pct = clamp(s.value, 0, 100)
          return (
            <g key={s.label}>
              <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-neutral-100 dark:text-white/10" />
              <circle cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * pct / 100} ${c}`} />
            </g>
          )
        })}
      </svg>
      <div className="space-y-2.5">
        {shown.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between gap-2 text-[9px]"><span className="flex items-center gap-1.5 font-bold text-neutral-500 dark:text-neutral-300"><i className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span><b className="tabular-nums text-neutral-900 dark:text-white">{s.display}</b></div>
          </div>
        ))}
        <div className="text-[8px] font-semibold leading-relaxed text-neutral-400">Separate measurements, not one synthetic readiness score.</div>
      </div>
    </div>
  )
}

function CardShell({ children }: { children: ReactNode }) {
  return <article className="overflow-hidden rounded-[26px] border border-black/[.06] bg-white/90 p-4 shadow-[0_14px_44px_rgba(30,45,90,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0e18]/85">{children}</article>
}

export function AdvancedPerformanceCockpit({ mode = 'athlete' }: { mode?: Mode }) {
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
    const workouts = getWorkouts()
    const gps = state.gpsActivities ?? []
    const sessions = collectSessions(workouts, gps)
    const athlete = readAthlete()
    const vitals = getVitals()
    const weeks = fourWeekSportLoad(sessions)
    const drift = recentHrDrift(workouts)
    const pb = personalBestSeries(sessions)
    const projectionBase = bestProjectionBase(sessions)
    const projection = raceProjection(projectionBase)
    return { workouts, sessions, athlete, vitals, weeks, drift, pb, projectionBase, projection }
  }, [state.gpsActivities, tick])

  const maxWeek = Math.max(...data.weeks.map((w) => w.total), 1)
  const activeSports = (Object.keys(SPORT_COLORS) as Sport[]).filter((sport) => data.weeks.some((w) => w[sport] > 0))
  const total28 = Math.round(data.weeks.reduce((a, b) => a + b.total, 0))

  const signals = useMemo(() => {
    const rows: Array<{ label: string; value: number; display: string; color: string }> = []
    if (typeof data.vitals.recoveryPct === 'number' && data.vitals.recoveryPct > 0) rows.push({ label: 'Recovery', value: data.vitals.recoveryPct, display: `${Math.round(data.vitals.recoveryPct)}%`, color: '#22d3ee' })
    if ((data.athlete.sleepScore ?? 0) > 0) rows.push({ label: 'Sleep', value: data.athlete.sleepScore ?? 0, display: `${Math.round(data.athlete.sleepScore ?? 0)}/100`, color: '#8b5cf6' })
    if ((data.athlete.hrv ?? 0) > 0 && (data.athlete.hrvBaseline ?? 0) > 0) {
      const ratio = ((data.athlete.hrv ?? 0) / Math.max(data.athlete.hrvBaseline ?? 1, 1)) * 100
      rows.push({ label: 'HRV/base', value: Math.min(ratio, 100), display: `${Math.round(ratio)}%`, color: '#ec4899' })
    }
    return rows
  }, [data.athlete, data.vitals.recoveryPct])

  const pbValues = data.pb?.points.map((x) => x.paceSec) ?? []
  const latestPb = pbValues.length ? pbValues[pbValues.length - 1] : 0
  const driftMax = Math.max(...data.drift.map((x) => Math.abs(x.deltaPct)), 1)
  const projectionMax = Math.max(...data.projection.map((x) => x.seconds), 1)
  const hasAny = total28 > 0 || data.drift.length > 0 || data.pb || signals.length > 0 || data.projection.length > 0

  return (
    <section className={mode === 'home' ? 'home-section-shell rounded-[30px] p-4 sm:p-5' : 'mt-4'} aria-label="Advanced performance cockpit">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-fuchsia-600 dark:text-fuchsia-300">Performance cockpit II</div>
          <h2 className="mt-1 text-[19px] font-black tracking-tight text-neutral-950 dark:text-white">Patterns, not just numbers</h2>
          <p className="mt-1 max-w-xl text-[10px] font-semibold leading-relaxed text-neutral-500 dark:text-neutral-400">Longitudinal views use only recorded sessions and wearable fields. Unsupported physiology is left blank rather than estimated.</p>
        </div>
        <span className="shrink-0 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-[9px] font-black text-fuchsia-700 dark:text-fuchsia-200">28–90 DAYS</span>
      </div>

      {!hasAny ? (
        <div className="grid min-h-[160px] place-items-center rounded-[24px] border border-dashed border-neutral-200 bg-white/55 px-6 text-center text-[11px] font-semibold leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/[.03]">Record or import workouts and recovery data to unlock the advanced cockpit. No demo values are shown.</div>
      ) : (
        <div className={mode === 'home' ? 'no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2' : 'grid gap-3 sm:grid-cols-2'}>
          <div className={mode === 'home' ? 'w-[318px] shrink-0 snap-start' : ''}>
            <CardShell>
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">4-week training mix</div><div className="mt-1 text-[24px] font-black text-neutral-950 dark:text-white">{total28}<span className="ml-1 text-[10px] font-bold text-neutral-400">min / 28d</span></div></div>
                <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[8px] font-black text-cyan-700 dark:text-cyan-200">STACKED</span>
              </div>
              <div className="mt-4 flex h-[142px] items-end gap-3">
                {data.weeks.map((week) => (
                  <div key={week.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <div className="text-[8px] font-black tabular-nums text-neutral-400">{Math.round(week.total) || ''}</div>
                    <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-[12px] bg-neutral-100 dark:bg-white/10" style={{ height: `${week.total ? Math.max(10, (week.total / maxWeek) * 105) : 5}px` }}>
                      {(Object.keys(SPORT_COLORS) as Sport[]).map((sport) => week.total > 0 && week[sport] > 0 ? <div key={sport} style={{ height: `${(week[sport] / week.total) * 100}%`, background: SPORT_COLORS[sport] }} /> : null)}
                    </div>
                    <div className="text-[8px] font-black text-neutral-400">{week.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">{activeSports.map((sport) => <span key={sport} className="flex items-center gap-1 text-[8px] font-bold text-neutral-500 dark:text-neutral-300"><i className="h-2 w-2 rounded-full" style={{ background: SPORT_COLORS[sport] }} />{sport}</span>)}</div>
            </CardShell>
          </div>

          <div className={mode === 'home' ? 'w-[318px] shrink-0 snap-start' : ''}>
            <CardShell>
              <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Recovery rings</div>
              <div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">Three signals, kept separate</div>
              <div className="mt-2"><Rings signals={signals} /></div>
            </CardShell>
          </div>

          <div className={mode === 'home' ? 'w-[318px] shrink-0 snap-start' : ''}>
            <CardShell>
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Personal-best progression</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{data.pb ? `Runs near ${data.pb.target} km` : 'Needs repeated similar-distance runs'}</div></div>
                {latestPb > 0 && <div className="text-right"><b className="text-[20px] font-black text-neutral-950 dark:text-white">{fmtPace(latestPb)}</b><div className="text-[8px] font-bold text-neutral-400">/km PB pace</div></div>}
              </div>
              {data.pb ? <><LineChart values={pbValues} invert suffix="cumulative best pace — faster is higher" /><div className="flex justify-between text-[8px] font-bold text-neutral-400"><span>{data.pb.points.length} comparable sessions</span><span>{new Date(data.pb.points[data.pb.points.length - 1].at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></div></> : <div className="grid h-[142px] place-items-center rounded-2xl border border-dashed border-neutral-200 px-4 text-center text-[10px] font-semibold text-neutral-400 dark:border-white/10">Record at least two runs within ±15% of 1 km, 5 km or 10 km to compare like with like.</div>}
            </CardShell>
          </div>

          <div className={mode === 'home' ? 'w-[318px] shrink-0 snap-start' : ''}>
            <CardShell>
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Within-session HR drift</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">First half vs second half</div></div><span className="text-[8px] font-black text-neutral-400">LAST {data.drift.length || 0}</span></div>
              {data.drift.length ? (
                <div className="mt-4 space-y-3">
                  {data.drift.map((row) => {
                    const width = Math.max(4, Math.abs(row.deltaPct) / driftMax * 100)
                    return <div key={row.id}>
                      <div className="flex items-center justify-between gap-2 text-[9px]"><span className="truncate font-bold text-neutral-500 dark:text-neutral-300">{new Date(row.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {row.name}</span><b className={row.deltaPct > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}>{row.deltaPct >= 0 ? '+' : ''}{row.deltaPct.toFixed(1)}%</b></div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" style={{ width: `${width}%` }} /></div>
                      <div className="mt-1 text-[8px] font-semibold text-neutral-400">{Math.round(row.first)} → {Math.round(row.second)} bpm</div>
                    </div>
                  })}
                </div>
              ) : <div className="grid h-[142px] place-items-center rounded-2xl border border-dashed border-neutral-200 px-4 text-center text-[10px] font-semibold text-neutral-400 dark:border-white/10">Need a workout with at least four timestamped HR samples.</div>}
              <div className="mt-3 text-[8px] font-semibold leading-relaxed text-neutral-400">HR drift ≠ aerobic decoupling. True decoupling also needs simultaneous pace or power time-series, which Panacea does not currently store here.</div>
            </CardShell>
          </div>

          {mode === 'athlete' && (
            <div className="sm:col-span-2">
              <CardShell>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Race projection curve</div><div className="mt-1 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">Riegel model from one recorded run</div></div>
                  {data.projectionBase && <div className="text-right text-[8px] font-bold text-neutral-400">base {data.projectionBase.distanceKm?.toFixed(1)} km · {fmtDuration(data.projectionBase.minutes * 60)}</div>}
                </div>
                {data.projection.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px] sm:items-center">
                    <div className="space-y-2.5">{data.projection.map((row) => <div key={row.distanceKm}><div className="flex items-center justify-between text-[9px]"><span className="font-black text-neutral-500 dark:text-neutral-300">{row.distanceKm === 21.0975 ? 'Half marathon' : row.distanceKm === 42.195 ? 'Marathon' : `${row.distanceKm}K`}</span><b className="tabular-nums text-neutral-900 dark:text-white">{fmtDuration(row.seconds)}</b></div><div className="mt-1 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" style={{ width: `${Math.max(8, row.seconds / projectionMax * 100)}%` }} /></div></div>)}</div>
                    <div className="rounded-2xl bg-neutral-50 p-3 text-[9px] font-semibold leading-relaxed text-neutral-500 dark:bg-white/[.05] dark:text-neutral-300">Prediction formula:<br/><b>T₂ = T₁ × (D₂ / D₁)<sup>1.06</sup></b><br/><br/>A projection is not a measured race result and becomes less certain as target distance differs from the source run.</div>
                  </div>
                ) : <div className="mt-3 grid h-[120px] place-items-center rounded-2xl border border-dashed border-neutral-200 px-4 text-center text-[10px] font-semibold text-neutral-400 dark:border-white/10">Record a run of at least 3 km with distance and duration to unlock the projection curve.</div>}
              </CardShell>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 px-1 text-[8px] font-semibold leading-relaxed text-neutral-400">Formulas: 28-day sport volume = Σ recorded workout minutes; HR drift = (time-weighted HR second half − first half) ÷ first half × 100%; PB progression compares sessions within ±15% of the same nominal distance; race projection uses the Riegel endurance model. These charts summarize training data and are not medical diagnoses.</div>
    </section>
  )
}

export default AdvancedPerformanceCockpit
