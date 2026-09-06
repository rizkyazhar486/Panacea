import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRIDGE_TOPICS, bridgeSummary, resolveBridgeTopic } from '../lib/knowledgeBridgeMap'

type Depth = 'plain' | 'student' | 'clinical'
const NOTE_KEY = 'pmd_knowledge_bridge_notes_v1'

function readNotes(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NOTE_KEY) || '{}') } catch { return {} }
}

export function KnowledgeBridgeWorkbench() {
  const [query, setQuery] = useState('hypertension')
  const [selectedId, setSelectedId] = useState('hypertension')
  const [depth, setDepth] = useState<Depth>('student')
  const [notes, setNotes] = useState<Record<string, string>>(readNotes)
  const [copied, setCopied] = useState(false)

  const topic = useMemo(() => BRIDGE_TOPICS.find((item) => item.id === selectedId) ?? resolveBridgeTopic(query) ?? BRIDGE_TOPICS[0], [selectedId, query])
  const note = notes[topic.id] ?? ''

  function search() {
    const found = resolveBridgeTopic(query)
    if (found) setSelectedId(found.id)
  }
  function saveNote(value: string) {
    const next = { ...notes, [topic.id]: value }
    setNotes(next)
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(next)) } catch { /* unavailable */ }
  }
  async function copySummary() {
    try {
      await navigator.clipboard.writeText(bridgeSummary(topic))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch { setCopied(false) }
  }

  const depthHint = depth === 'plain'
    ? 'Read the sequence and ask: what changed, what can be observed, and what action needs a professional?'
    : depth === 'student'
      ? 'Use each stage as a retrieval prompt: structure → normal function → mechanism → findings → tests → management → evidence.'
      : 'Treat the bridge as a hypothesis map. Check uncertainty, differential diagnosis, patient context, contraindications and source currency before applying anything clinically.'

  return (
    <section className="mx-auto max-w-6xl rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0d1117] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Knowledge Bridge · usable mode</div>
          <h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-neutral-950 dark:text-white">Turn a medical term into a causal map you can actually study.</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">This layer does not diagnose. It connects anatomy → physiology → pathology → clinical signals → diagnostics → management → evidence so the live library has a purpose beyond returning search results.</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Educational · not patient-specific</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') search() }} placeholder="Try hypertension, asthma, anemia, sepsis…" className="min-h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 pr-24 text-[12px] font-semibold text-neutral-900 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
          <button type="button" onClick={search} className="absolute right-1.5 top-1.5 min-h-9 rounded-xl bg-neutral-950 px-4 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Build</button>
        </div>
        <div className="flex rounded-2xl bg-neutral-100 p-1 dark:bg-white/[.06]">
          {(['plain', 'student', 'clinical'] as Depth[]).map((item) => <button key={item} type="button" onClick={() => setDepth(item)} className={`rounded-xl px-3 py-2 text-[9px] font-black capitalize ${depth === item ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}>{item}</button>)}
        </div>
      </div>

      <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {BRIDGE_TOPICS.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setQuery(item.title) }} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${topic.id === item.id ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{item.title}</button>)}
      </div>

      <div className="mt-4 rounded-[24px] bg-neutral-950 p-4 text-white dark:bg-black/30">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-300">{topic.title}</div>
        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/80">{topic.oneLiner}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-white/45">{depthHint}</p>
      </div>

      <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        {topic.stages.map((item, index) => (
          <article key={item.key} className="w-[270px] shrink-0 snap-start rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="flex items-center justify-between gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-100 text-[10px] font-black text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200">{index + 1}</span><span className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.label}</span></div>
            <h3 className="mt-3 text-[13px] font-black leading-snug text-neutral-950 dark:text-white">{item.question}</h3>
            <p className="mt-2 text-[11px] leading-[1.65] text-neutral-600 dark:text-neutral-300">{item.explanation}</p>
            {item.route && <Link to={item.route} className="mt-4 inline-flex rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10">Open related Panacea tool →</Link>}
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_.72fr]">
        <label className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
          <span className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">My bridge note · saved on this device</span>
          <textarea value={note} onChange={(event) => saveNote(event.target.value)} rows={4} placeholder="Write the mechanism in your own words, one uncertainty, and one question to verify…" className="mt-2 w-full resize-y rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed text-neutral-800 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" />
        </label>
        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
          <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">Use the bridge</div>
          <ol className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300"><li>1. Reconstruct the seven stages without looking.</li><li>2. Open the live evidence layer below for claims you need to verify.</li><li>3. Compare source population and clinical context before applying a result.</li><li>4. Save the uncertainty, not only the answer.</li></ol>
          <button type="button" onClick={copySummary} className="mt-3 w-full rounded-2xl bg-cyan-600 px-3 py-2.5 text-[10px] font-black text-white">{copied ? 'Copied ✓' : 'Copy bridge summary'}</button>
        </div>
      </div>
    </section>
  )
}

export default KnowledgeBridgeWorkbench
