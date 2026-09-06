import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  searchMedicalSources,
  type MedicalSourceBundle,
} from '../lib/medicalSources'

type SourceKey = 'all' | 'literature' | 'ontology' | 'trials' | 'drugLabels'

type Props = {
  initialQuery?: string
  autoRun?: boolean
  compact?: boolean
  title?: string
  subtitle?: string
}

const FILTERS: { key: SourceKey; label: string }[] = [
  { key: 'all', label: 'All sources' },
  { key: 'literature', label: 'Literature' },
  { key: 'ontology', label: 'Anatomy / ontology' },
  { key: 'trials', label: 'Clinical trials' },
  { key: 'drugLabels', label: 'FDA labels' },
]

function clamp(text: string | undefined, max = 520) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean
}

function SourceBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[.11em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{children}</span>
}

export function MedicalEvidenceExplorer({
  initialQuery = '',
  autoRun = false,
  compact = false,
  title = 'Live medical evidence',
  subtitle = 'Search trusted public biomedical sources instead of reading static placeholder cards.',
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState<SourceKey>('all')
  const [bundle, setBundle] = useState<MedicalSourceBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run(nextQuery = query) {
    const clean = nextQuery.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    try {
      const result = await searchMedicalSources(clean)
      setBundle(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoRun && initialQuery.trim()) void run(initialQuery)
    // The initial query intentionally runs only when the mounted context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialQuery])

  const counts = useMemo(() => ({
    all: bundle ? bundle.literature.length + bundle.ontology.length + bundle.trials.length + bundle.drugLabels.length : 0,
    literature: bundle?.literature.length ?? 0,
    ontology: bundle?.ontology.length ?? 0,
    trials: bundle?.trials.length ?? 0,
    drugLabels: bundle?.drugLabels.length ?? 0,
  }), [bundle])

  function submit(event: FormEvent) {
    event.preventDefault()
    void run()
  }

  return (
    <section className={`rounded-[28px] border border-neutral-200 bg-white shadow-[0_16px_45px_rgba(25,35,45,.07)] dark:border-white/10 dark:bg-[#0e1114] ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Evidence APIs</div>
          <h2 className={`${compact ? 'mt-1 text-[15px]' : 'mt-1 text-[19px]'} font-black tracking-[-.025em] text-neutral-950 dark:text-white`}>{title}</h2>
          {!compact && <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge>Europe PMC</SourceBadge>
          <SourceBadge>EMBL-EBI OLS</SourceBadge>
          <SourceBadge>ClinicalTrials.gov</SourceBadge>
          <SourceBadge>openFDA</SourceBadge>
        </div>
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. hypertrophic cardiomyopathy, metformin, ACL reconstruction"
          className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[12px] font-semibold text-neutral-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/[.04] dark:text-white"
          aria-label="Search biomedical evidence"
        />
        <button type="submit" disabled={loading || !query.trim()} className="shrink-0 rounded-2xl bg-neutral-950 px-4 py-2.5 text-[11px] font-black text-white transition active:scale-95 disabled:opacity-40 dark:bg-white dark:text-neutral-950">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}

      {bundle && (
        <>
          <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {FILTERS.map((item) => (
              <button key={item.key} type="button" onClick={() => setActive(item.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black transition ${active === item.key ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
                {item.label} {counts[item.key]}
              </button>
            ))}
          </div>

          <div className={`${compact ? 'mt-3 max-h-[360px]' : 'mt-4 max-h-[620px]'} space-y-2 overflow-y-auto pr-0.5`}>
            {(active === 'all' || active === 'ontology') && bundle.ontology.map((item) => (
              <a key={`ontology-${item.id}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-white/[.035] dark:hover:border-emerald-400/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.12em] text-violet-700 dark:text-violet-300">{item.ontology} · ontology</div><div className="mt-1 text-[12px] font-black text-neutral-950 dark:text-white">{item.label}</div></div>
                  <span className="text-neutral-400">↗</span>
                </div>
                {item.description && <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{clamp(item.description, compact ? 220 : 420)}</p>}
                <div className="mt-2 text-[9px] font-bold text-neutral-400">{item.id}</div>
              </a>
            ))}

            {(active === 'all' || active === 'literature') && bundle.literature.map((item) => (
              <a key={`lit-${item.source}-${item.id}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 transition hover:border-sky-300 hover:bg-sky-50/40 dark:border-white/10 dark:bg-white/[.035] dark:hover:border-sky-400/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.12em] text-sky-700 dark:text-sky-300">Europe PMC · {item.source}</div><div className="mt-1 text-[12px] font-black leading-snug text-neutral-950 dark:text-white">{item.title}</div></div>
                  <span className="text-neutral-400">↗</span>
                </div>
                <div className="mt-1 text-[9px] font-semibold text-neutral-500">{item.authors}{item.year ? ` · ${item.year}` : ''}{item.journal ? ` · ${item.journal}` : ''}</div>
                {item.abstract && <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{clamp(item.abstract, compact ? 250 : 520)}</p>}
                {typeof item.citedBy === 'number' && <div className="mt-2 text-[9px] font-bold text-neutral-400">Cited by {item.citedBy} records in Europe PMC</div>}
              </a>
            ))}

            {(active === 'all' || active === 'trials') && bundle.trials.map((item) => (
              <a key={`trial-${item.id}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 transition hover:border-amber-300 hover:bg-amber-50/40 dark:border-white/10 dark:bg-white/[.035] dark:hover:border-amber-400/30">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.12em] text-amber-700 dark:text-amber-300">ClinicalTrials.gov · {item.status}</div><div className="mt-1 text-[12px] font-black leading-snug text-neutral-950 dark:text-white">{item.title}</div></div><span className="text-neutral-400">↗</span></div>
                <div className="mt-2 text-[9px] font-semibold text-neutral-500">{item.id}{item.phase ? ` · ${item.phase}` : ''}</div>
                {item.conditions.length > 0 && <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300"><b>Conditions:</b> {item.conditions.slice(0, 4).join(', ')}</p>}
                {item.interventions.length > 0 && <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300"><b>Interventions:</b> {item.interventions.slice(0, 4).join(', ')}</p>}
              </a>
            ))}

            {(active === 'all' || active === 'drugLabels') && bundle.drugLabels.map((item) => (
              <a key={`fda-${item.id}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 transition hover:border-rose-300 hover:bg-rose-50/40 dark:border-white/10 dark:bg-white/[.035] dark:hover:border-rose-400/30">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.12em] text-rose-700 dark:text-rose-300">openFDA · structured product label</div><div className="mt-1 text-[12px] font-black text-neutral-950 dark:text-white">{item.brand}</div><div className="mt-0.5 text-[9px] font-semibold text-neutral-500">{item.generic}</div></div><span className="text-neutral-400">↗</span></div>
                {item.indication && <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300"><b>Indication:</b> {clamp(item.indication, compact ? 220 : 420)}</p>}
                {item.warning && <p className="mt-2 text-[10px] leading-relaxed text-rose-700 dark:text-rose-200"><b>Warning:</b> {clamp(item.warning, compact ? 220 : 420)}</p>}
              </a>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-[9px] font-semibold text-neutral-400 dark:border-white/10">
            <span>Live query: “{bundle.query}” · fetched {new Date(bundle.fetchedAt).toLocaleTimeString()}</span>
            <span>Source failures do not hide successful sources.</span>
          </div>

          {Object.values(bundle.errors).some(Boolean) && (
            <details className="mt-2 rounded-2xl bg-neutral-50 p-3 text-[9px] text-neutral-500 dark:bg-white/[.035] dark:text-neutral-400">
              <summary className="cursor-pointer font-black">Source diagnostics</summary>
              <div className="mt-2 space-y-1">{Object.entries(bundle.errors).filter(([, value]) => Boolean(value)).map(([key, value]) => <div key={key}><b>{key}:</b> {value}</div>)}</div>
            </details>
          )}
        </>
      )}
    </section>
  )
}

export default MedicalEvidenceExplorer
