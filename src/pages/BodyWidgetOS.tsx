import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { useStore } from '../lib/store'

const PerformanceVisualizationDeck = lazy(() => import('../components/dashboard/PerformanceVisualizationDeck').then((m) => ({ default: m.PerformanceVisualizationDeck })))

function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[26px] border border-white/[.09] bg-white/[.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-2xl ${className}`}>{children}</section>
}

function Metric({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return <div className="min-w-0"><div className="truncate text-[9px] font-black uppercase tracking-[.12em] text-white/38">{label}</div><div className="mt-1 truncate text-xl font-black tabular-nums">{value}<span className="ml-1 text-[9px] text-white/35">{unit}</span></div></div>
}

export function BodyWidgetOS() {
  const { state } = useStore()
  const [tick, setTick] = useState(0)
  const [vital, setVital] = useState<'HRV' | 'RHR' | 'Resp' | 'SpO2' | 'Temp'>('HRV')
  const [mind, setMind] = useState(() => typeof window === 'undefined' ? 5 : Number(window.localStorage.getItem('pm_body_mind') ?? 5))

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const data = useMemo(() => {
    const vitals = getVitals()
    const workouts = getWorkouts()
    const sleep = [...(state.sleepLogs ?? [])].filter((x) => typeof x.hours === 'number' && x.hours > 0).sort((a, b) => b.date.localeCompare(a.date))[0]
    return { vitals, workouts, sleep }
  }, [state.sleepLogs, tick])

  const selectedVital = {
    HRV: [data.vitals.hrvMs, 'ms'],
    RHR: [data.vitals.restingHr, 'bpm'],
    Resp: [data.vitals.respRate, '/min'],
    SpO2: [data.vitals.spo2Pct, '%'],
    Temp: [data.vitals.bodyTempC, '°C'],
  }[vital] as [number | undefined, string]

  const todaySignals = [data.vitals.steps, data.vitals.activeKcal, data.vitals.restingHr, data.vitals.sleepH].filter((x) => typeof x === 'number' && x > 0).length

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-4 pb-10">
      <PanaceaZoneNav />
      <main className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-28 top-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />

        <header className="relative mb-5 flex items-end justify-between gap-3 px-1">
          <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/75">Super page 01</div><h1 className="mt-1 text-2xl font-black tracking-[-.035em]">Your Body</h1></div>
          <div className="rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-3 py-1.5 text-[10px] font-black text-emerald-200">{todaySignals} live signals</div>
        </header>

        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Glass>
            <div className="flex items-center justify-between"><b>Today</b><Link to="/harian" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 grid grid-cols-2 gap-4"><Metric label="Steps" value={typeof data.vitals.steps === 'number' ? Math.round(data.vitals.steps).toLocaleString() : '—'} /><Metric label="Energy" value={typeof data.vitals.activeKcal === 'number' ? Math.round(data.vitals.activeKcal) : '—'} unit="kcal" /><Metric label="RHR" value={typeof data.vitals.restingHr === 'number' ? Math.round(data.vitals.restingHr) : '—'} unit="bpm" /><Metric label="Sleep" value={data.sleep?.hours?.toFixed(1) ?? (typeof data.vitals.sleepH === 'number' ? data.vitals.sleepH.toFixed(1) : '—')} unit="h" /></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Move</b><Link to="/fitness-hub?view=training" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 flex items-end gap-3"><div className="text-4xl font-black tabular-nums">{typeof data.vitals.steps === 'number' ? Math.round(data.vitals.steps).toLocaleString() : '—'}</div><span className="pb-1 text-[10px] font-black text-white/35">steps</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${typeof data.vitals.steps === 'number' ? Math.min(100, data.vitals.steps / 100) : 0}%` }} /></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Training</b><Link to="/fitness-hub?view=training" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 text-4xl font-black tabular-nums">{data.workouts.length}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-white/35">recorded sessions</div>
            <div className="mt-4 flex gap-2"><Link to="/latihan?t=sesi" className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-black">Start</Link><Link to="/latihan?t=rencana" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Plan</Link></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Sleep + Recovery</b><Link to="/fitness-hub?view=recovery" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 flex items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-full border-[8px] border-violet-300/70 text-xl font-black">{typeof data.vitals.recoveryPct === 'number' ? `${Math.round(data.vitals.recoveryPct)}%` : '—'}</div><Metric label="Sleep" value={data.sleep?.hours?.toFixed(1) ?? (typeof data.vitals.sleepH === 'number' ? data.vitals.sleepH.toFixed(1) : '—')} unit="h" /></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Body</b><Link to="/fitness-hub?view=body" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 grid grid-cols-2 gap-4"><Metric label="Weight" value={typeof data.vitals.weightKg === 'number' ? data.vitals.weightKg.toFixed(1) : '—'} unit="kg" /><Metric label="Body fat" value={typeof data.vitals.bodyFatPct === 'number' ? data.vitals.bodyFatPct.toFixed(1) : '—'} unit="%" /><Metric label="Muscle" value={typeof data.vitals.skeletalMuscleKg === 'number' ? data.vitals.skeletalMuscleKg.toFixed(1) : '—'} unit="kg" /><Metric label="Body score" value={typeof data.vitals.bodyScore === 'number' ? Math.round(data.vitals.bodyScore) : '—'} /></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Fitness</b><Link to="/fitness-hub?view=training" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 text-4xl font-black tabular-nums">{typeof data.vitals.vo2max === 'number' ? data.vitals.vo2max.toFixed(1) : '—'}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-white/35">VO₂max mL/kg/min</div>
            <div className="mt-4 flex gap-2"><Metric label="Exercise" value={typeof data.vitals.exerciseMin === 'number' ? Math.round(data.vitals.exerciseMin) : '—'} unit="min" /><Metric label="Distance" value={typeof data.vitals.distanceKm === 'number' ? data.vitals.distanceKm.toFixed(1) : '—'} unit="km" /></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Mind</b><Link to="/jiwa" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 flex items-center gap-4"><div className="text-4xl font-black tabular-nums">{mind}</div><input aria-label="Mind check-in" type="range" min="1" max="10" value={mind} onChange={(e) => { const n = Number(e.target.value); setMind(n); window.localStorage.setItem('pm_body_mind', String(n)) }} className="min-w-0 flex-1" /></div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[.14em] text-white/35">self check-in · 1–10</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Longevity</b><Link to="/longevity" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 grid grid-cols-2 gap-4"><Metric label="Body age" value={typeof data.vitals.bodyAge === 'number' ? Math.round(data.vitals.bodyAge) : '—'} unit="y" /><Metric label="VO₂max" value={typeof data.vitals.vo2max === 'number' ? data.vitals.vo2max.toFixed(1) : '—'} /></div>
            <div className="mt-4 text-[9px] font-bold text-white/30">Recorded metrics only · no synthetic age score</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Nutrition</b><Link to="/fitness-hub?view=nutrition" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 text-4xl font-black tabular-nums">{(state.foods ?? []).length}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-white/35">food records</div>
            <div className="mt-4 flex gap-2"><Metric label="BMR" value={typeof data.vitals.bmrKcal === 'number' ? Math.round(data.vitals.bmrKcal) : '—'} unit="kcal" /><Metric label="Water" value={typeof data.vitals.bodyWaterPct === 'number' ? data.vitals.bodyWaterPct.toFixed(1) : '—'} unit="%" /></div>
          </Glass>

          <Glass className="sm:col-span-2">
            <div className="flex items-center justify-between"><b>Health Data</b><Link to="/fitness-hub?view=health-data" className="text-cyan-200">↗</Link></div>
            <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">{(['HRV', 'RHR', 'Resp', 'SpO2', 'Temp'] as const).map((x) => <button key={x} type="button" onClick={() => setVital(x)} className={`min-w-[64px] rounded-[16px] border px-3 py-3 text-[9px] font-black ${vital === x ? 'border-cyan-200/45 bg-cyan-200 text-black' : 'border-white/10 bg-black/20'}`}>{x}</button>)}</div>
            <div className="mt-5 text-4xl font-black tabular-nums">{typeof selectedVital[0] === 'number' ? selectedVital[0].toFixed(vital === 'SpO2' || vital === 'Temp' ? 1 : 0) : '—'}<span className="ml-2 text-xs text-white/35">{selectedVital[1]}</span></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>VitaPulse</b><Link to="/vitapulse" className="text-cyan-200">↗</Link></div>
            <div className="mt-5 grid h-24 place-items-center rounded-[20px] border border-cyan-300/10 bg-[radial-gradient(circle,rgba(34,211,238,.18),transparent_58%)] text-4xl">⌁</div>
            <div className="mt-3 text-center text-[10px] font-black text-white/40">{data.vitals.source ? `Source · ${data.vitals.source}` : 'Connect health data'}</div>
          </Glass>
        </div>

        <section className="relative mt-5">
          <Suspense fallback={<div className="grid min-h-[220px] place-items-center rounded-[26px] border border-white/10 bg-white/[.03] text-xs font-black text-white/45">Loading visual data…</div>}><PerformanceVisualizationDeck mode="home" /></Suspense>
        </section>
      </main>
    </div>
  )
}

export default BodyWidgetOS
