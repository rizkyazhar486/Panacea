import { useEffect, useMemo, useState } from 'react'
import { getWorkouts } from '../../lib/workoutStore'
import { buildWorkout4DReplay, formatWorkoutClock, frameAt, type Workout4DProvenance } from '../../lib/workout4d'

const PROVENANCE_STYLE: Record<Workout4DProvenance, string> = {
  measured: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200',
  derived: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200',
  educational: 'bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200',
}

function activityDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function WorkoutSignalReplay() {
  const workouts = useMemo(() => getWorkouts(), [])
  const [selectedId, setSelectedId] = useState(workouts[0]?.id ?? '')
  const workout = workouts.find((item) => item.id === selectedId) ?? workouts[0]
  const replay = useMemo(() => workout ? buildWorkout4DReplay(workout) : null, [workout])
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setTime(0)
    setPlaying(false)
  }, [selectedId])

  useEffect(() => {
    if (!playing || !replay) return
    const timer = window.setInterval(() => {
      setTime((current) => {
        const next = current + Math.max(1, replay.duration / 220)
        if (next >= replay.duration) {
          setPlaying(false)
          return replay.duration
        }
        return next
      })
    }, 90)
    return () => window.clearInterval(timer)
  }, [playing, replay])

  const frame = replay ? frameAt(replay, time) : null

  if (!workout || !replay || !frame) {
    return (
      <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Workout replay</div>
        <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">No workout to replay yet.</h3>
        <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Import a workout first. Panacea will replay recorded timing and heart-rate data when available, while keeping derived and educational signals explicitly labelled.</p>
      </section>
    )
  }

  const metrics = [
    { label: frame.heartRate.label, value: `${Math.round(frame.heartRate.value)} bpm`, provenance: frame.heartRate.provenance, detail: frame.heartRate.detail },
    { label: frame.respiration.label, value: `${Math.round(frame.respiration.value)} /min`, provenance: frame.respiration.provenance, detail: frame.respiration.detail },
    { label: frame.intensity.label, value: frame.intensity.value, provenance: frame.intensity.provenance, detail: frame.intensity.detail },
    { label: frame.cardiacDemand.label, value: `${Math.round(frame.cardiacDemand.value)} / 100`, provenance: frame.cardiacDemand.provenance, detail: frame.cardiacDemand.detail },
    { label: frame.oxygenDemand.label, value: `${Math.round(frame.oxygenDemand.value)} / 100`, provenance: frame.oxygenDemand.provenance, detail: frame.oxygenDemand.detail },
    { label: 'Fuel context', value: `${Math.round(frame.carbohydrateShare.value)}% carb · ${Math.round(frame.fatShare.value)}% fat`, provenance: frame.carbohydrateShare.provenance, detail: frame.carbohydrateShare.detail },
  ]

  const maxHrPoint = workout.hr.reduce((max, point) => Math.max(max, point.bpm), 0)
  const traceMax = Math.max(maxHrPoint, workout.maxHr ?? 0, 1)

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Measured workout · data replay</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">{workout.nama}</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">This timeline changes data cards, not anatomy. The HRA GLB shown above stays fixed. Recorded signals are marked measured; model-derived and teaching signals stay separate.</p>
          </div>
          {workouts.length > 1 && (
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-10 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-[10px] font-bold text-neutral-800 dark:border-white/10 dark:bg-white/[.04] dark:text-white">
              {workouts.slice(0, 30).map((item) => <option key={item.id} value={item.id}>{item.nama} · {activityDate(item.mulai)}</option>)}
            </select>
          )}
        </div>
      </header>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="border-b border-neutral-200 p-4 dark:border-white/10 xl:border-b-0 xl:border-r sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-neutral-400">Session clock</div>
              <div className="mt-1 text-3xl font-black tabular-nums text-neutral-950 dark:text-white">{formatWorkoutClock(time)}</div>
              <div className="mt-1 text-[9px] text-neutral-400">of {formatWorkoutClock(replay.duration)} · {Math.round(frame.progress * 100)}%</div>
            </div>
            <button onClick={() => setPlaying((value) => !value)} className="rounded-full bg-neutral-950 px-4 py-2.5 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">{playing ? 'Pause' : time >= replay.duration ? 'Replay' : 'Play'}</button>
          </div>

          <input
            aria-label="Workout replay time"
            className="mt-4 w-full accent-emerald-500"
            type="range"
            min="0"
            max={replay.duration}
            step={Math.max(1, Math.round(replay.duration / 300))}
            value={time}
            onChange={(event) => { setTime(Number(event.target.value)); setPlaying(false) }}
          />

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">{frame.title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{frame.story}</p>
          </div>

          {workout.hr.length > 1 ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-400">Recorded heart-rate trace</div>
                <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{workout.hr.length} samples</div>
              </div>
              <svg viewBox="0 0 600 140" className="mt-2 h-[140px] w-full" role="img" aria-label="Recorded heart-rate timeline">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-emerald-500"
                  points={workout.hr.map((point, index) => {
                    const x = workout.hr.length <= 1 ? 0 : (index / (workout.hr.length - 1)) * 600
                    const y = 125 - (point.bpm / traceMax) * 105
                    return `${x.toFixed(1)},${Math.max(10, Math.min(125, y)).toFixed(1)}`
                  }).join(' ')}
                />
              </svg>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-3 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">No time-series HR trace was imported. Heart-rate points in the replay may therefore be derived from the session summary and are labelled accordingly.</div>
          )}
        </div>

        <aside className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase text-neutral-400">Duration</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{formatWorkoutClock(replay.duration)}</div></div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase text-neutral-400">Distance</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{workout.jarakKm != null ? `${workout.jarakKm.toFixed(2)} km` : '—'}</div></div>
          </div>

          {metrics.map((item) => (
            <article key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex items-start justify-between gap-2"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.label}</div><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${PROVENANCE_STYLE[item.provenance]}`}>{item.provenance}</span></div>
              <div className="mt-2 text-base font-black text-neutral-950 dark:text-white">{item.value}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</p>
            </article>
          ))}
        </aside>
      </div>
    </section>
  )
}
