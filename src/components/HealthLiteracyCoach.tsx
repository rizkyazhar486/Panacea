import { useMemo, useState } from 'react'

type Need = 'understand' | 'prepare' | 'medicines' | 'tests' | 'urgency'

const QUESTIONS: Record<Need, { title: string; prompts: string[] }> = {
  understand: { title: 'Understand the problem', prompts: ['What is the most likely explanation, and what else could it be?', 'What would make you change your mind?', 'What should improve, and over what time frame?', 'Which warning signs mean I should seek help sooner?'] },
  prepare: { title: 'Prepare for a visit', prompts: ['What started first, and when?', 'What makes it better or worse?', 'Which medicines, supplements, allergies and major conditions matter?', 'What is the one decision I want help making today?'] },
  medicines: { title: 'Use medicines safely', prompts: ['What is this medicine for?', 'How and when should I take it?', 'Which common side effects matter, and which are urgent?', 'What should I avoid combining it with?', 'When should its benefit be reassessed?'] },
  tests: { title: 'Understand a test', prompts: ['What question is this test trying to answer?', 'How would a positive result change the plan?', 'How would a negative result change the plan?', 'What can cause false positives or false negatives?', 'Do I need a repeat or confirmatory test?'] },
  urgency: { title: 'Decide where to seek help', prompts: ['Is there a sudden severe or rapidly worsening symptom?', 'Is breathing, consciousness, neurologic function or circulation affected?', 'Is there severe bleeding, major trauma, poisoning or a dangerous allergic reaction?', 'If no red flag is present, what is a reasonable time window for routine assessment?'] },
}

export function HealthLiteracyCoach() {
  const [need, setNeed] = useState<Need>('understand')
  const [checked, setChecked] = useState<Set<number>>(() => new Set())
  const [note, setNote] = useState('')

  const current = QUESTIONS[need]
  const completion = useMemo(() => Math.round((checked.size / Math.max(current.prompts.length, 1)) * 100), [checked, current.prompts.length])

  function choose(next: Need) { setNeed(next); setChecked(new Set()) }
  function toggle(index: number) {
    setChecked((previous) => {
      const next = new Set(previous)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }
  async function copy() {
    const text = `${current.title}\n${current.prompts.map((prompt, index) => `${checked.has(index) ? '✓' : '□'} ${prompt}`).join('\n')}${note.trim() ? `\n\nMy note: ${note.trim()}` : ''}`
    try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
  }

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0d1117] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-2xl"><div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Health Literacy Coach</div><h2 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">Turn health information into better questions and safer next steps.</h2><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Use this before reading the complaint cards below. It does not diagnose or replace emergency care; it helps you organize the question you are trying to answer.</p></div><div className="rounded-full bg-neutral-100 px-3 py-2 text-[9px] font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-300">Checklist {completion}%</div></div>

      <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {(Object.keys(QUESTIONS) as Need[]).map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${need === item ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{QUESTIONS[item].title}</button>)}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_.72fr]">
        <div className="space-y-2">{current.prompts.map((prompt, index) => <button key={prompt} type="button" onClick={() => toggle(index)} className={`flex w-full gap-3 rounded-2xl border p-3 text-left ${checked.has(index) ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.035]'}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black ${checked.has(index) ? 'bg-emerald-600 text-white' : 'border border-neutral-300 text-neutral-400 dark:border-white/20'}`}>{checked.has(index) ? '✓' : '?'}</span><span className="text-[11px] font-semibold leading-relaxed text-neutral-800 dark:text-neutral-200">{prompt}</span></button>)}</div>
        <div className="rounded-[22px] bg-neutral-950 p-3 text-white"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Visit note</div><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} placeholder="Symptoms, timeline, medicines, what you are worried about, and the decision you need…" className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[.06] p-3 text-[11px] leading-relaxed text-white outline-none placeholder:text-white/30" /><button type="button" onClick={copy} className="mt-2 w-full rounded-2xl bg-white px-3 py-2.5 text-[10px] font-black text-neutral-950">Copy questions + note</button><p className="mt-2 text-[8.5px] leading-relaxed text-white/40">Sudden severe breathing difficulty, new neurologic deficit, loss of consciousness, severe bleeding, major trauma, poisoning, or other emergencies should not wait for this tool.</p></div>
      </div>
    </section>
  )
}

export default HealthLiteracyCoach
