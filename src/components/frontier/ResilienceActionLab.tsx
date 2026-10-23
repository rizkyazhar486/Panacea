import { useMemo, useState } from 'react'

type Entry = { id: string; lesson: string; control: string; action: string; createdAt: string; done: boolean }
const KEY = 'pmd_resilience_actions_v1'

function load(): Entry[] { try { const parsed = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(parsed) ? parsed : [] } catch { return [] } }
function save(items: Entry[]) { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* unavailable */ } }

export function ResilienceActionLab() {
  const [lesson, setLesson] = useState('')
  const [control, setControl] = useState('')
  const [action, setAction] = useState('')
  const [entries, setEntries] = useState<Entry[]>(load)

  const completed = useMemo(() => entries.filter((item) => item.done).length, [entries])

  function add() {
    if (!control.trim() || !action.trim()) return
    const now = new Date()
    const next: Entry = { id: String(now.getTime()), lesson: lesson.trim(), control: control.trim(), action: action.trim(), createdAt: now.toISOString(), done: false }
    const updated = [next, ...entries].slice(0, 24)
    setEntries(updated); save(updated); setLesson(''); setControl(''); setAction('')
  }
  function toggle(id: string) {
    const updated = entries.map((item) => item.id === id ? { ...item, done: !item.done } : item)
    setEntries(updated); save(updated)
  }
  function remove(id: string) { const updated = entries.filter((item) => item.id !== id); setEntries(updated); save(updated) }

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0d1117] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.16em] text-orange-700 dark:text-orange-300">Motivation → behavior</div><h2 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">Do not only consume another comeback story.</h2><p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500">Take one lesson, separate what you control from what you do not, then commit to one small behavior within 24 hours. This is reflection, not mental-health assessment.</p></div><span className="rounded-full bg-orange-50 px-3 py-2 text-[9px] font-black text-orange-800 dark:bg-orange-400/10 dark:text-orange-200">Completed {completed}/{entries.length}</span></div>
      <div className="mt-4 grid gap-2 md:grid-cols-3"><textarea rows={3} value={lesson} onChange={(event) => setLesson(event.target.value)} placeholder="Lesson I want to keep…" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" /><textarea rows={3} value={control} onChange={(event) => setControl(event.target.value)} placeholder="What is actually in my control?" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" /><textarea rows={3} value={action} onChange={(event) => setAction(event.target.value)} placeholder="One action in the next 24 hours…" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] outline-none dark:border-white/10 dark:bg-white/[.04] dark:text-white" /></div>
      <button type="button" onClick={add} className="mt-2 rounded-2xl bg-orange-600 px-4 py-2.5 text-[10px] font-black text-white">Commit this action</button>
      {entries.length > 0 && <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1">{entries.slice(0, 8).map((item) => <article key={item.id} className={`w-[240px] shrink-0 snap-start rounded-[22px] border p-3 ${item.done ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.035]'}`}><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{new Date(item.createdAt).toLocaleDateString()}</div>{item.lesson && <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Lesson: {item.lesson}</p>}<p className="mt-2 text-[11px] font-semibold leading-relaxed text-neutral-800 dark:text-neutral-200">Control: {item.control}</p><p className="mt-2 text-[11px] font-black leading-relaxed text-neutral-950 dark:text-white">Next: {item.action}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => toggle(item.id)} className="rounded-full bg-neutral-950 px-3 py-1.5 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">{item.done ? 'Undo' : 'Done ✓'}</button><button type="button" onClick={() => remove(item.id)} className="px-2 text-[9px] font-black text-neutral-400">Remove</button></div></article>)}</div>}
    </section>
  )
}

export default ResilienceActionLab
