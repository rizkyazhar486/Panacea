import { useEffect, useState } from 'react'
import type { ImportedWorkout } from '../lib/workoutImport'
import { getAutoSyncStatus, type AutoSyncStatus } from '../lib/autoIsi'

interface Props {
  workout: ImportedWorkout
  nextTitle: string
  nextWhen: string
  nextColor: string
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function pace(sec: number): string {
  const total = Math.round(sec)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function lastSync(status: AutoSyncStatus): string {
  if (status.state === 'syncing') return 'Syncing now'
  if (status.state === 'offline') return 'Offline · local data'
  const raw = status.lastSuccess ?? status.lastAttempt
  if (!raw) return 'Local data ready'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Data synchronized'
  return `Synced ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function TrainingSessionCockpit({ workout, nextTitle, nextWhen, nextColor }: Props) {
  const [sync, setSync] = useState<AutoSyncStatus>(() => getAutoSyncStatus())

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<AutoSyncStatus>).detail
      setSync(detail ?? getAutoSyncStatus())
    }
    window.addEventListener('panacea:auto-sync', update)
    return () => window.removeEventListener('panacea:auto-sync', update)
  }, [])

  const duration = positive(workout.durasi) ? Math.round(workout.durasi / 60) : null
  const distance = positive(workout.jarakKm) ? workout.jarakKm : null
  const sessionPace = positive(workout.paceSec) ? pace(workout.paceSec) : null
  const cadence = positive(workout.kadens) ? Math.round(workout.kadens) : null
  const rpe = positive(workout.rpe) && workout.rpe <= 10 ? workout.rpe : null
  const avgHr = positive(workout.avgHr) ? Math.round(workout.avgHr) : null
  const maxHr = positive(workout.maxHr) ? Math.round(workout.maxHr) : null
  const minuteProof = Array.isArray(workout.pemulihan)
    && workout.pemulihan.some((point) => positive(point?.bpm) && Number.isFinite(point?.t) && point.t >= 45 && point.t <= 75)
  const hrr1 = positive(workout.hrr1) && minuteProof ? Math.round(workout.hrr1) : null
  const hasRecovery = hrr1 !== null
    || (Array.isArray(workout.pemulihan) && workout.pemulihan.some((point) => positive(point?.bpm)))

  const lanes = [
    {
      label: 'Recorded',
      value: duration !== null ? `${duration} min` : avgHr !== null ? `${avgHr} bpm` : 'No signal',
      detail: avgHr !== null ? `Avg HR ${avgHr}${maxHr !== null ? ` · max ${maxHr}` : ''}` : 'Duration / HR capture',
      active: duration !== null || avgHr !== null || maxHr !== null,
      dot: 'bg-sky-300',
      box: 'border-sky-300/20 from-sky-400/20 to-cyan-400/[0.03]',
    },
    {
      label: 'Movement',
      value: sessionPace !== null ? `${sessionPace}/km` : distance !== null ? `${distance.toFixed(1)} km` : cadence !== null ? `${cadence} spm` : 'No signal',
      detail: distance !== null && sessionPace !== null
        ? `${distance.toFixed(1)} km${cadence !== null ? ` · ${cadence} spm` : ''}`
        : cadence !== null ? `${cadence} spm cadence` : 'Distance / pace / cadence',
      active: sessionPace !== null || distance !== null || cadence !== null,
      dot: 'bg-emerald-300',
      box: 'border-emerald-300/20 from-emerald-400/20 to-green-400/[0.03]',
    },
    {
      label: 'Perceived',
      value: rpe !== null ? `RPE ${rpe}/10` : 'Not rated',
      detail: rpe !== null ? 'Self-reported session effort' : 'Optional subjective signal',
      active: rpe !== null,
      dot: 'bg-amber-300',
      box: 'border-amber-300/20 from-amber-400/20 to-orange-400/[0.03]',
    },
    {
      label: 'Recovery',
      value: hrr1 !== null ? `−${hrr1} bpm` : hasRecovery ? 'Trace captured' : 'No signal',
      detail: hrr1 !== null ? '≈1-min recorded HR drop' : 'Post-exercise HR capture',
      active: hasRecovery,
      dot: 'bg-indigo-300',
      box: 'border-indigo-300/20 from-indigo-400/20 to-violet-400/[0.03]',
    },
  ]

  const coverage = lanes.filter((lane) => lane.active).length
  const start = new Date(workout.mulai)
  const name = typeof workout.nama === 'string' && workout.nama.trim() ? workout.nama.trim() : 'Training session'
  const date = Number.isNaN(start.getTime()) ? '' : start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = Number.isNaN(start.getTime()) ? '' : start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const syncDot = sync.state === 'syncing'
    ? 'bg-cyan-300 animate-pulse'
    : sync.state === 'offline' ? 'bg-amber-300' : sync.state === 'partial' ? 'bg-amber-300' : 'bg-emerald-300'

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-5" aria-label="Synchronized training session cockpit">
      <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-10 h-60 w-60 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-12 h-36 w-36 -translate-x-1/2 rounded-full bg-indigo-400/[0.08] blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.26em] text-slate-500">Session cockpit</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${syncDot}`} />
                {lastSync(sync)}
              </span>
            </div>
            <h3 className="mt-2 truncate text-xl font-black tracking-tight text-white sm:text-2xl">{name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-500">
              {date && <span>{date}</span>}
              {time && <span>· {time}</span>}
              {typeof workout.diDalamRuangan === 'boolean' && (
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-slate-400">{workout.diDalamRuangan ? 'Indoor' : 'Outdoor'}</span>
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-right">
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">Next decision</div>
            <div className="mt-0.5 max-w-[145px] truncate text-sm font-black" style={{ color: nextColor }}>{nextTitle}</div>
            <div className="mt-0.5 text-[9px] font-bold text-slate-500">{nextWhen}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {lanes.map((lane) => (
            <div key={lane.label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 ${lane.box} ${lane.active ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${lane.active ? lane.dot : 'bg-slate-700'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">{lane.label}</span>
              </div>
              <div className="mt-2 truncate text-[15px] font-black tabular-nums text-white">{lane.value}</div>
              <div className="mt-1 min-h-[22px] text-[9px] leading-snug text-slate-500">{lane.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">Signal path</div>
              <div className="mt-0.5 text-[11px] font-bold text-slate-300">Recorded → movement → perceived → recovery</div>
            </div>
            <div className="text-right">
              <div className="text-base font-black tabular-nums text-white">{coverage}<span className="text-[10px] text-slate-500">/4</span></div>
              <div className="text-[8px] font-bold uppercase tracking-wide text-slate-600">coverage · not score</div>
            </div>
          </div>
          <div className="mt-3 flex items-start">
            {lanes.map((lane, index) => (
              <div key={lane.label} className="contents">
                <div className="min-w-0 flex-1 text-center">
                  <div className={`mx-auto h-3 w-3 rounded-full ring-4 ${lane.active ? `${lane.dot} ring-white/5` : 'bg-slate-700 ring-white/[0.02]'}`} />
                  <div className={`mt-2 truncate text-[8px] font-black uppercase tracking-wide ${lane.active ? 'text-slate-400' : 'text-slate-700'}`}>{lane.label}</div>
                </div>
                {index < lanes.length - 1 && <div className="mt-1.5 h-px w-5 shrink-0 bg-gradient-to-r from-white/20 to-white/5 sm:w-10" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-slate-600">
            The cockpit only visualizes fields that were actually recorded or entered. Missing lanes stay visibly missing; coverage is not a fitness, readiness, recovery, or injury-risk score.
          </p>
        </div>
      </div>
    </section>
  )
}

export default TrainingSessionCockpit
