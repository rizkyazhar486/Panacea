import { useEffect, useMemo, useState } from 'react'
import { isReviewDue, nextReviewIso, normalizeFocusMinutes, reviewIntervalFor, type WeakConcept } from '../lib/studyPlanner'

const GOAL_KEY = 'pmd_study_goal_v1'
const WEAK_KEY = 'pmd_study_weak_concepts_v1'

function loadWeak(): WeakConcept[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(WEAK_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
function storeWeak(items: WeakConcept[]) { try { localStorage.setItem(WEAK_KEY, JSON.stringify(items)) } catch { /* unavailable */ } }

export function StudyCommandCenter() {
  const [goal, setGoal] = useState(() => { try { return localStorage.getItem(GOAL_KEY) || '' } catch { return '' } })
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [topic, setTopic] = useState('')
  const [whyMissed, setWhyMissed] = useState('')
  const [weak, setWeak] = useState<WeakConcept[]>(loadWeak)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const due = useMemo(() => weak.filter((item) => isReviewDue(item.dueAt)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [weak])
  const upcoming = useMemo(() => weak.filter((item) => !isReviewDue(item.dueAt)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [weak])

  function saveGoal(value: string) {
    setGoal(value)
    try { localStorage.setItem(GOAL_KEY, value) } catch { /* unavailable */ }
  }
  function applyMinutes(value: number) {
    const safe = normalizeFocusMinutes(value)
    setMinutes(safe)
    setSecondsLeft(safe * 60)
    setRunning(false)
  }
  function addWeak() {
    const cleanTopic = topic.trim()
    if (!cleanTopic) return
    const now = new Date()
    const next: WeakConcept = {
      id: `${now.getTime()}-${cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}`,
      topic: cleanTopic,
      whyMissed: whyMissed.trim(),
      createdAt: now.toISOString(),
      dueAt: nextReviewIso(now, 1),
      intervalDays: 1,
      repetitions: 0,
    }
    const updated = [next, ...weak]
    setWeak(updated); storeWeak(updated); setTopic(''); setWhyMissed('')
  }
  function review(item: WeakConcept) {
    const repetitions = item.repetitions + 1
    const intervalDays = reviewIntervalFor(repetitions)
    const updated = weak.map((entry) => entry.id === item.id ? { ...entry, repetitions, intervalDays, dueAt: nextReviewIso(new Date(), intervalDays) } : entry)
    setWeak(updated); storeWeak(updated)
  }
  function remove(id: string) {
    const updated = weak.filter((item) => item.id !== id)
    setWeak(updated); storeWeak(updated)
  }

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const ss = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0d1117] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Study Command Center</div><h2 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">Know what to do next, not only what content exists.</h2><p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500">One goal, one focus block, and a weak-concept queue. Review spacing is deterministic and local to this device; it is a study planner, not a prediction of exam performance.</p></div>
        <div className="rounded-full bg-violet-50 px-3 py-2 text-[9px] font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">Due now: {due.length}</div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_.65fr]">
        <div className="space-y-3">
          <label className="block rounded-[22px] bg-neutral-50 p-3 dark:bg-white/[.035]"><span className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Today’s outcome</span><input value={goal} onChange={(event) => saveGoal(event.target.value)} placeholder="Example: explain ACS mechanism + answer 20 questions" className="mt-2 min-h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-[11px] font-semibold text-neutral-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" /></label>

          <div className="rounded-[22px] bg-neutral-950 p-4 text-white">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.14em] text-violet-300">Focus block</div><div className="mt-1 font-mono text-4xl font-black tabular-nums">{mm}:{ss}</div></div><button type="button" onClick={() => setRunning((value) => !value)} className="rounded-full bg-white px-5 py-3 text-[10px] font-black text-neutral-950">{running ? 'Pause' : secondsLeft === 0 ? 'Done' : 'Start'}</button></div>
            <div className="mt-3 flex flex-wrap gap-1.5">{[25, 50, 75].map((value) => <button key={value} type="button" onClick={() => applyMinutes(value)} className={`rounded-full px-3 py-1.5 text-[9px] font-black ${minutes === value ? 'bg-violet-400 text-violet-950' : 'bg-white/10 text-white/60'}`}>{value} min</button>)}<button type="button" onClick={() => { setSecondsLeft(minutes * 60); setRunning(false) }} className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black text-white/60">Reset</button></div>
          </div>

          <div className="rounded-[22px] border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Capture a weak concept</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic: acid-base, RAAS, ECG…" className="min-h-10 rounded-xl bg-neutral-50 px-3 text-[10px] outline-none dark:bg-white/[.04] dark:text-white" /><input value={whyMissed} onChange={(event) => setWhyMissed(event.target.value)} placeholder="Why missed: recall, mechanism, wording…" className="min-h-10 rounded-xl bg-neutral-50 px-3 text-[10px] outline-none dark:bg-white/[.04] dark:text-white" /></div>
            <button type="button" onClick={addWeak} className="mt-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[10px] font-black text-white">Add to review queue</button>
          </div>
        </div>

        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Spaced review queue</div>
          <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">Intervals progress 1 → 3 → 7 → 14 days after successful review. If you still cannot reconstruct it, edit the “why missed” reason or add it again as a fresh weak concept.</p>
          <div className="mt-3 space-y-2">
            {due.length === 0 && <div className="rounded-2xl bg-white p-3 text-[10px] text-neutral-500 dark:bg-neutral-950">Nothing due right now.</div>}
            {due.map((item) => <ReviewRow key={item.id} item={item} due onReview={() => review(item)} onRemove={() => remove(item.id)} />)}
            {upcoming.slice(0, 4).map((item) => <ReviewRow key={item.id} item={item} onReview={() => review(item)} onRemove={() => remove(item.id)} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewRow({ item, due = false, onReview, onRemove }: { item: WeakConcept; due?: boolean; onReview: () => void; onRemove: () => void }) {
  return <div className={`rounded-2xl border p-3 ${due ? 'border-violet-300 bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10' : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950'}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[11px] font-black text-neutral-900 dark:text-white">{item.topic}</div>{item.whyMissed && <div className="mt-1 text-[9px] text-neutral-500">Gap: {item.whyMissed}</div>}<div className="mt-1 text-[8px] font-black uppercase tracking-wide text-neutral-400">{due ? 'Due now' : `Due ${new Date(item.dueAt).toLocaleDateString()}`} · repetition {item.repetitions}</div></div><button type="button" onClick={onRemove} className="text-[9px] font-black text-neutral-400">×</button></div><button type="button" onClick={onReview} className="mt-2 rounded-full bg-neutral-950 px-3 py-1.5 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">I can reconstruct this → schedule next</button></div>
}

export default StudyCommandCenter
