import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type QuestionType = 'diagnosis' | 'therapy' | 'prognosis' | 'harm' | 'mechanism'
type SavedQuestion = { id: string; query: string; type: QuestionType; createdAt: string }

const KEY = 'pmd_medical_library_questions_v1'
const TYPE_HINTS: Record<QuestionType, { label: string; hint: string; evidence: string[] }> = {
  diagnosis: { label: 'Diagnosis', hint: 'Patient/problem + index test + reference standard or diagnostic target', evidence: ['Diagnostic accuracy study', 'Prospective validation', 'Guideline / consensus criteria'] },
  therapy: { label: 'Therapy', hint: 'Population + intervention + comparator + patient-important outcome', evidence: ['Systematic review/meta-analysis', 'Randomized controlled trial', 'Guideline integrating benefits/harms'] },
  prognosis: { label: 'Prognosis', hint: 'Population + starting state + time horizon + outcome', evidence: ['Prospective cohort', 'Validated prediction model', 'External validation study'] },
  harm: { label: 'Harm', hint: 'Exposure/intervention + comparator + adverse outcome + time', evidence: ['Randomized safety data', 'Large cohort / registry', 'Pharmacovigilance / label evidence'] },
  mechanism: { label: 'Mechanism', hint: 'Biological process + perturbation + molecular/cellular/physiological outcome', evidence: ['Mechanistic human study', 'Translational study', 'Preclinical evidence with explicit limits'] },
}

function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === 'string' && value in TYPE_HINTS
}

function loadSaved(): SavedQuestion[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is SavedQuestion => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<SavedQuestion>
      return typeof candidate.id === 'string'
        && typeof candidate.query === 'string'
        && isQuestionType(candidate.type)
        && typeof candidate.createdAt === 'string'
    }).slice(0, 12)
  } catch {
    return []
  }
}
function store(items: SavedQuestion[]) { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* unavailable */ } }

export function MedicalLibraryWorkbench({ onRun }: { onRun: (query: string) => void }) {
  const [type, setType] = useState<QuestionType>('therapy')
  const [population, setPopulation] = useState('')
  const [intervention, setIntervention] = useState('')
  const [comparator, setComparator] = useState('')
  const [outcome, setOutcome] = useState('')
  const [saved, setSaved] = useState<SavedQuestion[]>(loadSaved)
  const [checks, setChecks] = useState<Set<number>>(() => new Set())

  const query = useMemo(() => [population, intervention, comparator, outcome].map((value) => value.trim()).filter(Boolean).join(' '), [population, intervention, comparator, outcome])
  const qualityChecks = ['Population matches the question', 'Outcome is patient-important or clearly mechanistic', 'Comparator is appropriate', 'Effect size is read with uncertainty, not only p-values', 'Source date and conflicts/funding are checked', 'External validity / applicability is stated']

  function run(nextQuery = query) { if (nextQuery.trim()) onRun(nextQuery.trim()) }
  function saveQuestion() {
    if (!query) return
    const next: SavedQuestion = { id: `${Date.now()}`, query, type, createdAt: new Date().toISOString() }
    const updated = [next, ...saved.filter((item) => item.query !== query)].slice(0, 12)
    setSaved(updated); store(updated)
  }
  function remove(id: string) { const updated = saved.filter((item) => item.id !== id); setSaved(updated); store(updated) }
  function toggleCheck(index: number) { setChecks((previous) => { const next = new Set(previous); next.has(index) ? next.delete(index) : next.add(index); return next }) }

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0d1117] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">Medical Library · evidence workspace</div>
          <h2 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">Start with a question, find the source, then judge whether it applies.</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Build a structured clinical or scientific question here. The live library below searches evidence; Knowledge Bridge helps connect a selected topic to mechanism and clinical meaning.</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-2 text-[9px] font-black text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">Saved questions {saved.length}</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <GuideCard label="Function" text="Turn a clinical or biomedical problem into a searchable evidence question." />
        <GuideCard label="How to use" text="Choose question type → fill the fields → search live evidence → appraise the source." />
        <GuideCard label="Benefit" text="Keeps the question, source and applicability connected instead of relying on memory alone." />
      </div>

      <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">{(Object.keys(TYPE_HINTS) as QuestionType[]).map((item) => <button key={item} type="button" onClick={() => { setType(item); setChecks(new Set()) }} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${type === item ? 'border-sky-600 bg-sky-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{TYPE_HINTS[item].label}</button>)}</div>
      <p className="mt-2 text-[9px] font-semibold leading-relaxed text-neutral-400">{TYPE_HINTS[type].hint}</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2"><Field label="Population / problem" value={population} setValue={setPopulation} placeholder="e.g. adults with newly diagnosed hypertension" /><Field label={type === 'diagnosis' ? 'Index test' : type === 'mechanism' ? 'Process / perturbation' : 'Intervention / exposure'} value={intervention} setValue={setIntervention} placeholder="e.g. ambulatory BP monitoring" /><Field label={type === 'diagnosis' ? 'Reference standard' : 'Comparator'} value={comparator} setValue={setComparator} placeholder="e.g. office BP / placebo / usual care" /><Field label="Outcome / target" value={outcome} setValue={setOutcome} placeholder="e.g. cardiovascular events, sensitivity, pathway activation" /></div>

      <div className="mt-3 rounded-[22px] bg-neutral-950 p-3 text-white">
        <div className="text-[8px] font-black uppercase tracking-wide text-sky-300">Generated query</div>
        <div className="mt-1 min-h-6 break-words font-mono text-[10px] leading-relaxed text-white/70">{query || 'Fill at least the population/problem and the comparison you care about.'}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!query} onClick={() => run()} className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-950 disabled:opacity-40">Search live evidence ↓</button>
          <button type="button" disabled={!query} onClick={saveQuestion} className="rounded-full bg-white/10 px-3 py-2 text-[9px] font-black text-white/70 disabled:opacity-40">Save question</button>
          {query && <Link to={`/knowledge-bridge?q=${encodeURIComponent(query)}`} className="rounded-full bg-sky-500/20 px-3 py-2 text-[9px] font-black text-sky-100 ring-1 ring-sky-300/25">Open in Knowledge Bridge →</Link>}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Evidence types to look for</div><div className="mt-2 flex flex-wrap gap-1.5">{TYPE_HINTS[type].evidence.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-300">{item}</span>)}</div><p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Study design does not automatically determine truth. Risk of bias, precision, directness and applicability still matter.</p></div>
        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]"><div className="flex items-center justify-between"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Appraisal before conclusion</div><span className="text-[9px] font-black text-sky-700 dark:text-sky-300">{checks.size}/{qualityChecks.length}</span></div><div className="mt-2 space-y-1.5">{qualityChecks.map((item, index) => <button key={item} type="button" onClick={() => toggleCheck(index)} className="flex w-full items-start gap-2 text-left"><span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[7px] font-black ${checks.has(index) ? 'bg-sky-600 text-white' : 'border border-neutral-300 text-neutral-400 dark:border-white/20'}`}>{checks.has(index) ? '✓' : ''}</span><span className="text-[9.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item}</span></button>)}</div></div>
      </div>

      {saved.length > 0 && <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1">{saved.map((item) => <article key={item.id} className="w-[250px] shrink-0 snap-start rounded-[20px] border border-neutral-200 p-3 dark:border-white/10"><div className="text-[8px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{TYPE_HINTS[item.type].label} · {new Date(item.createdAt).toLocaleDateString()}</div><p className="mt-2 line-clamp-4 text-[10px] font-semibold leading-relaxed text-neutral-700 dark:text-neutral-200">{item.query}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => run(item.query)} className="rounded-full bg-neutral-950 px-3 py-1.5 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Search</button><Link to={`/knowledge-bridge?q=${encodeURIComponent(item.query)}`} className="rounded-full bg-sky-50 px-3 py-1.5 text-[9px] font-black text-sky-700 dark:bg-sky-400/10 dark:text-sky-200">Bridge</Link><button type="button" onClick={() => remove(item.id)} className="text-[9px] font-black text-neutral-400">Remove</button></div></article>)}</div>}
    </section>
  )
}

function GuideCard({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]"><div className="text-[8px] font-black uppercase tracking-[.12em] text-sky-700 dark:text-sky-300">{label}</div><p className="mt-1 text-[9.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p></div>
}

function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (value: string) => void; placeholder: string }) {
  return <label className="rounded-[18px] bg-neutral-50 p-3 dark:bg-white/[.035]"><span className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{label}</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className="mt-1 min-h-9 w-full bg-transparent text-[10px] font-semibold text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400 dark:text-white" /></label>
}

export default MedicalLibraryWorkbench
