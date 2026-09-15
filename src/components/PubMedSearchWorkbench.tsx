import { useMemo, useState } from 'react'
import { Card, SectionTitle } from './ui'
import { IconSearch } from './icons'
import { fetchRelatedArticles, type PubmedArticle } from '../lib/evidence'
import { compilePubMedQuery, type PubMedStudyDesign } from '../lib/pubmedQuery'

const DESIGNS: Array<{ id: PubMedStudyDesign; label: string }> = [
  { id: 'any', label: 'Any design' },
  { id: 'systematic-review', label: 'Review / meta-analysis' },
  { id: 'randomized-trial', label: 'Randomized trial' },
  { id: 'diagnostic', label: 'Diagnostic study' },
  { id: 'observational', label: 'Observational' },
]

const fieldClass = 'mt-1 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white'

export function PubMedSearchWorkbench({ seedQuestion }: { seedQuestion: string }) {
  const [population, setPopulation] = useState('')
  const [intervention, setIntervention] = useState('')
  const [comparison, setComparison] = useState('')
  const [outcome, setOutcome] = useState('')
  const [design, setDesign] = useState<PubMedStudyDesign>('any')
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [humansOnly, setHumansOnly] = useState(true)
  const [freeFullTextOnly, setFreeFullTextOnly] = useState(false)
  const [articles, setArticles] = useState<PubmedArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const compiled = useMemo(() => compilePubMedQuery({
    population,
    intervention,
    comparison,
    outcome,
    design,
    fromYear: fromYear ? Number(fromYear) : undefined,
    toYear: toYear ? Number(toYear) : undefined,
    humansOnly,
    freeFullTextOnly,
  }), [population, intervention, comparison, outcome, design, fromYear, toYear, humansOnly, freeFullTextOnly])

  async function search() {
    if (!compiled.query || compiled.concepts.length === 0) return
    setLoading(true)
    setSearched(true)
    setError('')
    setArticles([])
    try {
      setArticles(await fetchRelatedArticles(compiled.query))
    } catch {
      setError('PubMed could not be reached. Your query is preserved so you can retry.')
    } finally {
      setLoading(false)
    }
  }

  function useQuestion() {
    const value = seedQuestion.trim()
    if (value) setPopulation(value)
  }

  return (
    <Card className="!p-5">
      <SectionTitle
        icon={<IconSearch size={20} />}
        title="PubMed concept search"
        subtitle="Build a transparent PICO-style query, inspect the exact search, then retrieve currently indexed PubMed records."
      />

      <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] leading-relaxed text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100">
        This is concept-structured Boolean retrieval, not embedding similarity or an AI conclusion. Results come from PubMed; relevance, bias and applicability still require appraisal.
      </div>

      {seedQuestion.trim() && (
        <button type="button" onClick={useQuestion} className="mt-3 min-h-11 rounded-xl bg-neutral-100 px-3 text-xs font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
          Use the question above as a starting concept
        </button>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ConceptField label="Population / problem" value={population} onChange={setPopulation} placeholder="e.g. adults with atrial fibrillation" />
        <ConceptField label="Intervention / exposure" value={intervention} onChange={setIntervention} placeholder="Separate alternatives with ;" />
        <ConceptField label="Comparator" value={comparison} onChange={setComparison} placeholder="optional" />
        <ConceptField label="Outcome" value={outcome} onChange={setOutcome} placeholder="e.g. ischemic stroke; major bleeding" />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Study design</span>
          <select className={fieldClass} value={design} onChange={(event) => setDesign(event.target.value as PubMedStudyDesign)}>
            {DESIGNS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <YearField label="From year" value={fromYear} onChange={setFromYear} />
        <YearField label="To year" value={toYear} onChange={setToYear} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Toggle active={humansOnly} onClick={() => setHumansOnly((value) => !value)} label="Humans only" />
        <Toggle active={freeFullTextOnly} onClick={() => setFreeFullTextOnly((value) => !value)} label="Free full text only" />
      </div>

      <div className="mt-3 rounded-xl bg-neutral-950 p-3 text-white">
        <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Exact PubMed query</div>
        <code className="mt-2 block break-words text-[10px] leading-relaxed text-white/75">
          {compiled.query || 'Enter at least one concept.'}
        </code>
        {compiled.warnings.map((warning) => <p key={warning} className="mt-2 text-[10px] text-amber-200">{warning}</p>)}
        <button type="button" disabled={loading || compiled.concepts.length === 0} onClick={search} className="mt-3 min-h-11 rounded-xl bg-emerald-500 px-4 text-xs font-black text-white disabled:opacity-40">
          {loading ? 'Searching PubMed…' : 'Search PubMed'}
        </button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      {searched && !loading && !error && articles.length === 0 && (
        <p role="status" className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-white/5">No records were returned for this exact query. Broaden one concept or remove a filter.</p>
      )}
      {articles.length > 0 && (
        <div className="mt-4 space-y-2" aria-live="polite">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{articles.length} live PubMed results</div>
          {articles.map((article) => (
            <a key={article.pmid} href={article.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-neutral-200 p-3 transition hover:border-brand dark:border-white/10">
              <div className="text-sm font-bold leading-snug text-neutral-900 dark:text-white">{article.title}</div>
              <div className="mt-1 text-[11px] text-neutral-500">{article.authors}</div>
              <div className="mt-1 text-[11px] text-neutral-500">{[article.journal, article.year].filter(Boolean).join(' · ')} · PMID {article.pmid}</div>
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}

function ConceptField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{label}</span>
      <textarea className={`${fieldClass} min-h-[72px]`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function YearField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{label}</span>
      <input className={fieldClass} inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="optional" />
    </label>
  )
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-full px-4 text-xs font-bold ${active ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

export default PubMedSearchWorkbench
