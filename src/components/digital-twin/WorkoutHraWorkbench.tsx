import { useMemo, useState } from 'react'
import { getWorkouts } from '../../lib/workoutStore'
import type { ImportedWorkout } from '../../lib/workoutImport'
import { HraContextBridge } from './HraContextBridge'

function workoutTerms(workout: ImportedWorkout) {
  const name = workout.nama.toLowerCase()
  if (/run|jog|walk|hike|treadmill|lari|jalan/.test(name)) {
    return ['heart', 'lung', 'blood vasculature', 'femur', 'tibia', 'patella', 'knee', 'hip joint', 'skeletal muscle']
  }
  if (/cycle|cycling|bike|bicycle|sepeda/.test(name)) {
    return ['heart', 'lung', 'blood vasculature', 'femur', 'patella', 'knee', 'hip joint', 'skeletal muscle']
  }
  if (/swim|swimming|renang/.test(name)) {
    return ['heart', 'lung', 'shoulder joint', 'scapula', 'humerus', 'skeletal muscle']
  }
  if (/strength|weight|resistance|gym|angkat|barbell|dumbbell/.test(name)) {
    return ['skeletal muscle', 'shoulder joint', 'humerus', 'elbow joint', 'femur', 'knee', 'vertebral column']
  }
  if (/row|rowing/.test(name)) {
    return ['heart', 'lung', 'shoulder joint', 'scapula', 'vertebral column', 'hip joint', 'knee', 'skeletal muscle']
  }
  return ['heart', 'lung', 'blood vasculature', 'skeletal muscle']
}

function durationLabel(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours} h ${rest} min`
}

export function WorkoutHraWorkbench() {
  const workouts = useMemo(() => getWorkouts(), [])
  const [selectedId, setSelectedId] = useState(workouts[0]?.id ?? '')
  const selected = workouts.find((item) => item.id === selectedId) ?? workouts[0]
  const terms = useMemo(() => selected ? workoutTerms(selected) : [], [selected])

  if (!selected) {
    return (
      <section className="rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Workout → HRA anatomy</div>
        <div className="mt-1 text-[15px] font-black text-neutral-950 dark:text-white">Import a real workout to build anatomy context.</div>
        <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Panacea will use the recorded workout name and measured session metadata to choose HRA source queries. It does not invent a muscle activation map when no workout exists.</p>
      </section>
    )
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Measured workout → source anatomy</div>
          <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{selected.nama}</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The workout chooses an HRA anatomical context; HR, distance and duration below come from the imported session only. The HRA match is educational anatomy, not a claim that these structures were individually measured.</p>
        </div>
        {workouts.length > 1 && (
          <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="h-10 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-[10px] font-bold text-neutral-800 dark:border-white/10 dark:bg-white/[.04] dark:text-white">
            {workouts.slice(0, 25).map((item) => <option key={item.id} value={item.id}>{item.nama} · {new Date(item.mulai).toLocaleDateString()}</option>)}
          </select>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <div className="min-w-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
          <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Duration</div>
          <div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{durationLabel(selected.durasi)}</div>
        </div>
        {selected.jarakKm != null && <div className="min-w-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Distance</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{selected.jarakKm.toFixed(2)} km</div></div>}
        {selected.avgHr != null && <div className="min-w-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Average HR</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{selected.avgHr} bpm</div></div>}
        {selected.maxHr != null && <div className="min-w-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Peak HR</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{selected.maxHr} bpm</div></div>}
        {selected.hrr1 != null && <div className="min-w-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">1-min recovery</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{selected.hrr1} bpm</div></div>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {terms.map((term) => <span key={term} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{term}</span>)}
      </div>

      <div className="mt-4">
        <HraContextBridge title={`${selected.nama} · anatomical context`} terms={terms} maxResults={12} />
      </div>
    </section>
  )
}
