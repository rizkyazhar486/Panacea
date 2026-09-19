import { useRef, useState } from 'react'
import {
  searchMedicalEducationBridge,
  type MedicalEducationBridgeResult,
} from '../lib/medicalEducationBridgeSearch'
import { addBridgeEvidence, type BridgeEvidenceRef } from '../lib/knowledgeBridgeHandoff'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0d1117]'

function SourceBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[.11em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{children}</span>
}

export function MedicalEducationBridgeSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<MedicalEducationBridgeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const requestId = useRef(0)

  async function run() {
    const clean = query.trim()
    if (!clean) return
    const id = ++requestId.current
    setLoading(true)
    const next = await searchMedicalEducationBridge(clean)
    if (requestId.current === id) {
      setResult(next)
      setLoading(false)
    }
  }

  function saveArticle(article: MedicalEducationBridgeResult['pubmed']['articles'][number]) {
    const ref: BridgeEvidenceRef = {
      key: `pubmed:${article.pmid}`,
      kind: 'literature',
      id: article.pmid,
      title: article.title,
      source: 'PubMed',
      url: article.url,
      year: article.year || undefined,
      query: result?.query,
    }
    addBridgeEvidence(ref)
    setSaved((previous) => new Set(previous).add(ref.key))
  }

  const hasResult = result !== null
  const anatomyItems = result?.anatomy.items ?? []
  const icdEntries = result?.icd.entries ?? []
  const pubmedArticles = result?.pubmed.articles ?? []
  const nothingFound = hasResult && !loading && anatomyItems.length === 0 && icdEntries.length === 0 && pubmedArticles.length === 0 && !result?.icd.error && !result?.pubmed.error

  return (
    <details className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[.035]">
      <summary className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 sm:p-5 ${FOCUS_RING}`}>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Medical Education & Knowledge Bridge</div>
          <h2 className="mt-1 text-[15px] font-black tracking-[-.02em] text-neutral-950 dark:text-white">Search PubMed, ICD-11 and the anatomy atlas together</h2>
        </div>
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">Open ↓</span>
      </summary>

      <div className="border-t border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">One query searches NCBI PubMed literature, the WHO ICD-11 (with ICD-10-CM fallback) diagnosis directory, and Panacea's local anatomy atlas indexed from Z-Anatomy and NIH 3D. Each source shows its own identity; a source that fails never hides the others.</p>

        <form
          onSubmit={(event) => { event.preventDefault(); void run() }}
          className="mt-3 flex flex-wrap gap-2"
        >
          <label htmlFor="medical-education-bridge-search" className="sr-only">Search a concept, diagnosis or anatomical structure</label>
          <input
            id="medical-education-bridge-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try asthma, femur, I10, pneumonia…"
            className={`min-h-12 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-[12px] font-semibold text-neutral-900 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white ${FOCUS_RING}`}
          />
          <button type="submit" disabled={loading || !query.trim()} className={`min-h-12 shrink-0 rounded-2xl bg-neutral-950 px-5 text-[10px] font-black text-white disabled:opacity-50 dark:bg-white dark:text-neutral-950 ${FOCUS_RING}`}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {nothingFound && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            No matches across PubMed, ICD-11/ICD-10-CM or the local anatomy atlas for “{result?.query}”.
          </div>
        )}

        {hasResult && (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <section aria-label="Anatomy atlas results" className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Anatomy atlas</span>
                <SourceBadge>Z-Anatomy · NIH 3D</SourceBadge>
              </div>
              {anatomyItems.length === 0 ? (
                <p className="mt-2 text-[10.5px] text-neutral-400">No structure name matches this query.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {anatomyItems.map((item) => (
                    <li key={`${item.module}:${item.name}`} className="rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950">
                      <div className="text-[11px] font-black text-neutral-900 dark:text-white">{item.name}</div>
                      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{item.moduleLabel}{item.region ? ` · ${item.region}` : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="ICD-11 results" className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Diagnosis coding</span>
                <SourceBadge>WHO ICD-11</SourceBadge>
              </div>
              {result?.icd.error && <p className="mt-2 text-[10px] leading-relaxed text-rose-600 dark:text-rose-300">ICD lookup unavailable: {result.icd.error}</p>}
              {!result?.icd.error && icdEntries.length === 0 && <p className="mt-2 text-[10.5px] text-neutral-400">No matching diagnosis code.</p>}
              <ul className="mt-2 space-y-2">
                {icdEntries.map((entry) => (
                  <li key={`${entry.sumber}:${entry.code}`} className="rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-neutral-900 dark:text-white">{entry.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ${entry.sumber === 'icd11' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200' : 'bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{entry.sumber === 'icd11' ? 'ICD-11' : 'ICD-10-CM fallback'}</span>
                    </div>
                    <div className="mt-1 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{entry.title}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="PubMed results" className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Literature</span>
                <SourceBadge>PubMed</SourceBadge>
              </div>
              {result?.pubmed.error && <p className="mt-2 text-[10px] leading-relaxed text-rose-600 dark:text-rose-300">PubMed unavailable: {result.pubmed.error}</p>}
              {!result?.pubmed.error && pubmedArticles.length === 0 && <p className="mt-2 text-[10.5px] text-neutral-400">No matching article.</p>}
              <ul className="mt-2 space-y-2">
                {pubmedArticles.map((article) => {
                  const key = `pubmed:${article.pmid}`
                  return (
                    <li key={key} className="rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950">
                      <a href={article.url} target="_blank" rel="noreferrer" className={`block text-[10.5px] font-black leading-snug text-neutral-900 hover:underline dark:text-white ${FOCUS_RING}`}>{article.title} ↗</a>
                      <div className="mt-1 text-[9px] font-semibold text-neutral-400">{article.journal}{article.year ? ` · ${article.year}` : ''}</div>
                      <button
                        type="button"
                        onClick={() => saveArticle(article)}
                        disabled={saved.has(key)}
                        className={`mt-2 rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[8.5px] font-black text-cyan-800 disabled:opacity-50 dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200 ${FOCUS_RING}`}
                      >
                        {saved.has(key) ? 'Saved to bridge ✓' : 'Save to Knowledge Bridge'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )}
      </div>
    </details>
  )
}

export default MedicalEducationBridgeSearch
