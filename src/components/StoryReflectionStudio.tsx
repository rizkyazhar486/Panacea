import { useState } from 'react'

const PROMPTS = [
  'What changed in you after this chapter?',
  'What was difficult that other people could not easily see?',
  'Which person, place or decision changed the direction of the story?',
  'What do you understand now that your younger self did not?',
  'What do you want your future family or future self to remember accurately?',
  'Which part of this chapter are you ready to stop carrying forward?',
  'What is the next chapter trying to become?',
]
const KEY = 'pmd_story_reflection_drafts_v1'

export function StoryReflectionStudio() {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function save() {
    if (!text.trim()) return
    try {
      const previous = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown
      const entries = Array.isArray(previous) ? previous : []
      const now = new Date()
      localStorage.setItem(KEY, JSON.stringify([{ prompt: PROMPTS[index], text: text.trim(), createdAt: now.toISOString() }, ...entries].slice(0, 40)))
      setSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setText('')
    } catch { /* unavailable */ }
  }

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-gradient-to-br from-white to-rose-50/60 p-4 shadow-[0_18px_48px_rgba(15,23,42,.06)] dark:border-white/10 dark:from-[#0d1117] dark:to-[#171016] sm:p-5">
      <div className="text-[9px] font-black uppercase tracking-[.17em] text-rose-700 dark:text-rose-300">Private Story Studio</div>
      <div className="mt-2 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <div><h2 className="text-xl font-black tracking-tight text-neutral-950 dark:text-white">Your Story should preserve meaning, not only events.</h2><p className="mt-2 text-[10px] leading-relaxed text-neutral-500">These prompts create private drafts on this device. They are not psychological scoring and are not automatically turned into a health record.</p><div className="mt-3 flex flex-wrap gap-1.5">{PROMPTS.map((_, promptIndex) => <button key={promptIndex} type="button" aria-label={`Reflection prompt ${promptIndex + 1}`} onClick={() => setIndex(promptIndex)} className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-black ${index === promptIndex ? 'bg-rose-600 text-white' : 'bg-white text-neutral-500 shadow-sm ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10'}`}>{promptIndex + 1}</button>)}</div></div>
        <div className="rounded-[24px] border border-rose-100 bg-white/90 p-3 dark:border-white/10 dark:bg-white/[.04]"><div className="text-[13px] font-black leading-snug text-neutral-950 dark:text-white">{PROMPTS[index]}</div><textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} placeholder="Write without optimizing the wording. You can decide later whether any part belongs in the formal timeline below." className="mt-3 w-full resize-y rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-800 outline-none focus:border-rose-300 dark:border-white/10 dark:bg-neutral-950 dark:text-white" /><div className="mt-2 flex items-center gap-3"><button type="button" onClick={save} className="rounded-2xl bg-rose-600 px-4 py-2.5 text-[10px] font-black text-white">Save private draft</button>{savedAt && <span className="text-[9px] font-semibold text-neutral-400">Saved {savedAt}</span>}</div></div>
      </div>
    </section>
  )
}

export default StoryReflectionStudio
