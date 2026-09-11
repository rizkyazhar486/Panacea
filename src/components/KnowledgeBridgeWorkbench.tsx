import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BRIDGE_TOPICS, bridgeSummary, resolveBridgeTopic } from '../lib/knowledgeBridgeMap'
import {
  clearBridgeEvidence,
  loadBridgeEvidence,
  removeBridgeEvidence,
  type BridgeEvidenceRef,
} from '../lib/knowledgeBridgeHandoff'

type Depth = 'plain' | 'student' | 'clinical'
const NOTE_KEY = 'pmd_knowledge_bridge_notes_v1'
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0d1117]'

function readNotes(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
  } catch {
    return {}
  }
}

export function KnowledgeBridgeWorkbench() {
  const [params] = useSearchParams()
  const initialQuery = params.get('q')?.trim() || 'hypertension'
  const initialTopic = resolveBridgeTopic(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [selectedId, setSelectedId] = useState(initialTopic?.id ?? 'hypertension')
  const [depth, setDepth] = useState<Depth>('student')
  const [notes, setNotes] = useState<Record<string, string>>(readNotes)
  const [evidence, setEvidence] = useState<BridgeEvidenceRef[]>(loadBridgeEvidence)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState(initialTopic || initialQuery === 'hypertension' ? '' : `No curated causal map matches “${initialQuery}” yet. You can still verify this query in Medical Library.`)

  const topic = useMemo(() => BRIDGE_TOPICS.find((item) => item.id === selectedId) ?? resolveBridgeTopic(query) ?? BRIDGE_TOPICS[0], [selectedId, query])
  const note = notes[topic.id] ?? ''

  function search() {
    const clean = query.trim()
    if (!clean) {
      setStatus('Enter a disease, mechanism or clinical topic first.')
      return
    }
    const found = resolveBridgeTopic(clean)
    if (found) {
      setSelectedId(found.id)
      setStatus('')
      return
    }
    setStatus(`No curated causal map matches “${clean}” yet. Use Medical Library for the live evidence search instead.`)
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
    <section aria-labelledby="knowledge-bridge-title" className="mx-auto max-w-6xl rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0d1117] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Knowledge Bridge · causal understanding</div>
          <h2 id="knowledge-bridge-title" className="mt-1 text-2xl font-black tracking-[-.035em] text-neutral-950 dark:text-white">Connect a medical topic from structure to evidence without hiding the reasoning path.</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Knowledge Bridge is the interpretation layer. It maps anatomy → physiology → pathology → clinical signals → diagnostics → management → evidence. Medical Library remains the place to search and inspect live sources.</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Educational · not patient-specific</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Knowledge Bridge guide">
        <GuideCard label="Function" text="Build a causal map that shows how a topic moves from normal biology to clinical findings and evidence." />
        <GuideCard label="How to use" text="Choose or search a curated topic → follow the stages → verify uncertain claims in Medical Library." />
        <GuideCard label="Benefit" text="Makes the reasoning path visible, so facts are easier to study, challenge and connect to their sources." />
      </div>

      {evidence.length > 0 && (
        <div className="mt-4 rounded-[22px] border border-cyan-200 bg-cyan-50/55 p-3 dark:border-cyan-400/20 dark:bg-cyan-400/[.055]" aria-label="Selected evidence shelf">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.12em] text-cyan-800 dark:text-cyan-200">Selected evidence · {evidence.length}/8</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">These are source pointers selected from live search. Open the original source before treating a claim as verified.</p>
            </div>
            <button type="button" onClick={() => setEvidence(clearBridgeEvidence())} className={`rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[9px] font-black text-cyan-800 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200 ${FOCUS_RING}`}>Clear shelf</button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {evidence.map((item) => (
              <article key={item.key} className="rounded-[18px] border border-cyan-100 bg-white p-3 dark:border-cyan-400/10 dark:bg-neutral-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[8px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{item.source}{item.year ? ` · ${item.year}` : ''}</div>
                    <a href={item.url} target="_blank" rel="noreferrer" className={`mt-1 block text-[10.5px] font-black leading-snug text-neutral-900 hover:underline dark:text-white ${FOCUS_RING}`}>{item.title} ↗</a>
                    <div className="mt-1 text-[8.5px] font-semibold text-neutral-400">{item.id}</div>
                    {item.query && <div className="mt-1 text-[8.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">Found via search: “{item.query}”</div>}
                  </div>
                  <button type="button" onClick={() => setEvidence(removeBridgeEvidence(item.key))} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-[12px] font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-300 ${FOCUS_RING}`} aria-label={`Remove ${item.title}`}>×</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <label htmlFor="knowledge-bridge-search" className="sr-only">Search a disease, mechanism, or clinical topic</label>
          <input id="knowledge-bridge-search" value={query} onChange={(event) => { setQuery(event.target.value); if (status) setStatus('') }} onKeyDown={(event) => { if (event.key === 'Enter') search() }} placeholder="Try hypertension, asthma, anemia, sepsis…" className={`min-h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 pr-24 text-[12px] font-semibold text-neutral-900 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white ${FOCUS_RING}`} />
          <button type="button" onClick={search} className={`absolute right-1.5 top-1.5 min-h-9 rounded-xl bg-neutral-950 px-4 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950 ${FOCUS_RING}`}>Build map</button>
        </div>
        <div className="flex rounded-2xl bg-neutral-100 p-1 dark:bg-white/[.06]" role="radiogroup" aria-label="Explanation depth">
          {(['plain', 'student', 'clinical'] as Depth[]).map((item) => <button key={item} type="button" role="radio" aria-checked={depth === item} onClick={() => setDepth(item)} className={`rounded-xl px-3 py-2 text-[9px] font-black capitalize ${FOCUS_RING} ${depth === item ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white' : 'text-neutral-500'}`}>{item}</button>)}
        </div>
      </div>

      {status && <div role="status" aria-live="polite" className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9.5px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"><span>{status}</span>{query.trim() && <Link to={`/med-study?bagian=evidence&cari=${encodeURIComponent(query.trim())}`} className={`shrink-0 rounded-full bg-amber-900 px-3 py-1.5 text-[9px] font-black text-white dark:bg-amber-100 dark:text-amber-950 ${FOCUS_RING}`}>Search evidence →</Link>}</div>}

      <nav aria-label="Curated medical topics" className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {BRIDGE_TOPICS.map((item) => <button key={item.id} type="button" aria-pressed={topic.id === item.id} onClick={() => { setSelectedId(item.id); setQuery(item.title); setStatus('') }} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${FOCUS_RING} ${topic.id === item.id ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{item.title}</button>)}
      </nav>

      <div className="mt-4 rounded-[24px] bg-neutral-950 p-4 text-white dark:bg-black/30" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl"><div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-300">{topic.title}</div><p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/80">{topic.oneLiner}</p><p className="mt-2 text-[10px] leading-relaxed text-white/45">{depthHint}</p></div>
          <Link to={`/med-study?bagian=evidence&cari=${encodeURIComponent(query.trim() || topic.title)}`} className={`shrink-0 rounded-full bg-white/10 px-3 py-2 text-[9px] font-black text-white/80 ring-1 ring-white/10 ${FOCUS_RING}`}>Verify in Medical Library →</Link>
        </div>
      </div>

      <div role="list" aria-label={`${topic.title} causal stages`} className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        {topic.stages.map((item, index) => (
          <article role="listitem" key={item.key} className="w-[270px] shrink-0 snap-start rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="flex items-center justify-between gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-100 text-[10px] font-black text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200">{index + 1}</span><span className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.label}</span></div>
            <h3 className="mt-3 text-[13px] font-black leading-snug text-neutral-950 dark:text-white">{item.question}</h3>
            <p className="mt-2 text-[11px] leading-[1.65] text-neutral-600 dark:text-neutral-300">{item.explanation}</p>
            {item.route && <Link to={item.route} className={`mt-4 inline-flex rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10 ${FOCUS_RING}`}>Open related Panacea tool →</Link>}
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_.72fr]">
        <label className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
          <span className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">My bridge note · saved on this device</span>
          <textarea value={note} onChange={(event) => saveNote(event.target.value)} rows={4} placeholder="Write the mechanism in your own words, one uncertainty, and one question to verify…" className={`mt-2 w-full resize-y rounded-2xl border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed text-neutral-800 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white ${FOCUS_RING}`} />
        </label>
        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
          <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">Use the bridge</div>
          <ol className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300"><li>1. Reconstruct the seven stages without looking.</li><li>2. Open Medical Library for claims you need to verify.</li><li>3. Compare source population and clinical context before applying a result.</li><li>4. Save the uncertainty, not only the answer.</li></ol>
          <button type="button" onClick={copySummary} aria-live="polite" className={`mt-3 w-full rounded-2xl bg-cyan-600 px-3 py-2.5 text-[10px] font-black text-white ${FOCUS_RING}`}>{copied ? 'Copied ✓' : 'Copy bridge summary'}</button>
        </div>
      </div>

      <div className="mt-3 rounded-[22px] border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-400/20 dark:bg-amber-400/[.06]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.13em] text-amber-800 dark:text-amber-200">Study verification checklist · not clinical clearance</div>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-amber-950/75 dark:text-amber-100/75">Use these gates before carrying a bridge claim into notes, teaching, or discussion. They document what still needs verification; they do not certify a patient-specific decision.</p>
          </div>
          <Link to={`/med-study?bagian=evidence&cari=${encodeURIComponent(query.trim() || topic.title)}`} className={`shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-[9px] font-black text-amber-900 dark:border-amber-400/20 dark:bg-white/10 dark:text-amber-100 ${FOCUS_RING}`}>Open sources →</Link>
        </div>
        <ol aria-label="Study verification checklist" className="mt-3 grid gap-2 text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-200 sm:grid-cols-2">
          <li data-check-id="source" className="rounded-2xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/15 dark:bg-black/15"><b>1 · Source.</b> Open the original source and preserve its identifier, date and provenance before treating a claim as verified.</li>
          <li data-check-id="population" className="rounded-2xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/15 dark:bg-black/15"><b>2 · Context.</b> Compare population, setting, definitions and units with the question you are studying.</li>
          <li data-check-id="uncertainty" className="rounded-2xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/15 dark:bg-black/15"><b>3 · Uncertainty.</b> Record uncertainty and plausible alternatives instead of forcing one causal explanation.</li>
          <li data-check-id="management" className="rounded-2xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/15 dark:bg-black/15"><b>4 · Management claims.</b> If management is involved, check contraindications, harms and source currency before reuse.</li>
          <li data-check-id="clinical-boundary" className="rounded-2xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/15 dark:bg-black/15 sm:col-span-2"><b>5 · Boundary.</b> A completed study checklist never authorizes a patient-specific diagnosis or treatment decision.</li>
        </ol>
      </div>
    </section>
  )
}

function GuideCard({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]"><div className="text-[8px] font-black uppercase tracking-[.12em] text-cyan-700 dark:text-cyan-300">{label}</div><p className="mt-1 text-[9.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p></div>
}

export default KnowledgeBridgeWorkbench