import { useEffect, useMemo, useState } from 'react'
import { getVitals, type Vitals } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import type { ImportedWorkout } from '../../lib/workoutImport'
import { deretMetrik } from '../../lib/riwayatVitals'

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

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="grid h-[94px] place-items-center text-[11px] font-semibold text-neutral-400">Need at least 2 days of history</div>
  const w = 320, h = 86, pad = 8
  const min = Math.min(...points), max = Math.max(...points)
  const range = Math.max(max - min, 1)
  const x = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2)
  const d = points.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')
  const area = `${d} L ${x(points.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[94px] w-full" role="img" aria-label="Personal biomarker trend">
      <defs>
        <linearGradient id="pmd-viz-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6d5dfc" stopOpacity=".34" />
          <stop offset="100%" stopColor="#10b7ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pmd-viz-line" x1="0" x2="1">
          <stop offset="0%" stopColor="#10b7ff" />
          <stop offset="55%" stopColor="#7957ff" />
          <stop offset="100%" stopColor="#ff3d81" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pmd-viz-area)" />
      <path d={d} fill="none" stroke="url(#pmd-viz-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="4.5" fill="#ff3d81" stroke="white" strokeWidth="2" />
    </svg>
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

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <article className={`overflow-hidden rounded-[26px] border border-black/[.06] bg-white/82 p-4 shadow-[0_14px_40px_rgba(24,45,85,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0e18]/78 ${className}`}>{children}</article>
}

export function PerformanceVisualizationDeck({ mode = 'home' }: { mode?: Mode }) {
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
    return { vitals, workouts, athlete, maxHr, weekly, zones, mix, hrv, rhr }
  }, [tick])

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

  return (
    <section className={mode === 'home' ? 'home-section-shell rounded-[30px] p-4 sm:p-5' : 'mt-5'} aria-label="Performance data visualizations">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-violet-600 dark:text-violet-300">Visual intelligence</div>
          <h2 className="mt-1 text-[19px] font-black tracking-tight text-neutral-950 dark:text-white">{mode === 'athlete' ? 'Performance command center' : 'Your data at a glance'}</h2>
          <p className="mt-1 max-w-xl text-[10px] font-semibold leading-relaxed text-neutral-500 dark:text-neutral-400">Charts use your stored wearable and workout data; missing measurements stay empty rather than being invented.</p>
        </div>
        {mode === 'athlete' && <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black text-violet-700 dark:text-violet-200">14–28 day view</span>}
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
          <Sparkline points={bioPoints} />
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

      <div className="mt-3 px-1 text-[9px] font-semibold leading-relaxed text-neutral-400">Formulas: weekly volume = Σ workout duration per day; zone share = time in each HR band ÷ total HR-sampled time; ACWR = acute 7-day load ÷ chronic 28-day weekly average. Visuals summarize measurements and are not diagnostic scores.</div>
    </section>
  )
}

export default PerformanceVisualizationDeck
