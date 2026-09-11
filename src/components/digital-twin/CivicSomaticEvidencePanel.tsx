import { useEffect, useMemo, useState } from 'react'
import type { VariantEvidenceResult } from '../../lib/variantEvidence'
import {
  CIVIC_EVIDENCE_DOCS,
  CIVIC_GRAPHIQL,
  civicQueryCandidate,
  fetchCivicEvidenceForVariant,
  type CivicVariantEvidence,
} from '../../lib/civicEvidence'

type Props = {
  results: VariantEvidenceResult[]
}

function levelClass(level: string) {
  if (level.startsWith('A')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200'
  if (level.startsWith('B')) return 'bg-sky-100 text-sky-800 dark:bg-sky-300/10 dark:text-sky-200'
  if (level.startsWith('C')) return 'bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200'
  return 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-300'
}

function civicHref(link: string) {
  if (/^https?:\/\//i.test(link)) return link
  if (link.startsWith('/')) return `https://civicdb.org${link}`
  return `https://civicdb.org/${link}`
}

export function CivicSomaticEvidencePanel({ results }: Props) {
  const candidates = useMemo(() => results
    .map((result, index) => ({ index, result, ...civicQueryCandidate(result) }))
    .filter((item) => item.gene && item.variant), [results])
  const [selectedIndex, setSelectedIndex] = useState(candidates[0]?.index ?? -1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CivicVariantEvidence | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedIndex(candidates[0]?.index ?? -1)
    setData(null)
    setError('')
  }, [candidates])

  const selected = results[selectedIndex]

  async function run() {
    if (!selected) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      setData(await fetchCivicEvidenceForVariant(selected))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'CIViC lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!candidates.length) {
    return (
      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-rose-700 dark:text-rose-300">Cancer evidence · CIViC</div>
        <div className="mt-2 rounded-2xl border border-dashed border-neutral-200 p-4 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10 dark:text-neutral-400">No VEP result could be converted to a reliable protein-level search such as BRAF V600E or EGFR L858R. Panacea will not guess a somatic cancer interpretation from coordinates alone.</div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-rose-700 dark:text-rose-300">Somatic cancer evidence · CIViC GraphQL</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Query curated cancer evidence without turning it into an automatic treatment decision.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">CIViC stores curated molecular-profile evidence across predictive, diagnostic, prognostic, predisposing, oncogenic and functional contexts. Panacea retrieves it only when a VEP transcript yields a recognizable protein substitution.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={CIVIC_GRAPHIQL} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">CIViC GraphiQL ↗</a>
            <a href={CIVIC_EVIDENCE_DOCS} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">Evidence model ↗</a>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">VEP-derived query candidate</div>
            <select value={selectedIndex} onChange={(event) => { setSelectedIndex(Number(event.target.value)); setData(null); setError('') }} className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[10px] font-black text-neutral-950 dark:border-white/10 dark:bg-[#11161b] dark:text-white">
              {candidates.map((item) => <option key={`${item.index}-${item.gene}-${item.variant}`} value={item.index}>{item.gene} {item.variant} · {item.result.locus}</option>)}
            </select>
          </label>
          <button onClick={() => void run()} disabled={loading || !selected} className="rounded-xl bg-neutral-950 px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-35 dark:bg-white dark:text-neutral-950">{loading ? 'Querying CIViC…' : 'Load CIViC evidence'}</button>
        </div>
      </header>

      {error && <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/[.055] dark:text-rose-100">{error}</div>}

      {data && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 text-[8px] font-black uppercase">
            <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-800 dark:bg-rose-300/10 dark:text-rose-200">{data.gene} {data.queryVariant}</span>
            <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:text-neutral-300">{data.variants.length} CIViC variant match{data.variants.length === 1 ? '' : 'es'}</span>
          </div>

          {data.variants.length ? data.variants.map((variant) => (
            <article key={`${variant.id}-${variant.name}`} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-black text-neutral-950 dark:text-white">{data.gene} {variant.name}</div>
                  <div className="mt-1 text-[8px] font-mono text-neutral-400">CIViC variant {variant.id}{variant.alleleRegistryId ? ` · ${variant.alleleRegistryId}` : ''}</div>
                </div>
                {variant.link && <a href={civicHref(variant.link)} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">Open CIViC ↗</a>}
              </div>

              <div className="mt-3 space-y-2">
                {variant.evidence.slice(0, 12).map((item) => (
                  <div key={`${variant.id}-${item.id}`} className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-black/15">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[7px] font-black uppercase ${levelClass(item.evidenceLevel)}`}>Level {item.evidenceLevel}</span>
                      <span className="rounded-full border border-neutral-200 px-2 py-1 text-[7px] font-black uppercase text-neutral-500 dark:border-white/10 dark:text-neutral-300">{item.evidenceType}</span>
                      <span className="rounded-full border border-neutral-200 px-2 py-1 text-[7px] font-black uppercase text-neutral-500 dark:border-white/10 dark:text-neutral-300">{item.status}</span>
                      <span className="text-[8px] font-semibold text-neutral-400">{item.evidenceDirection}</span>
                    </div>
                    <div className="mt-2 text-[10px] font-black text-neutral-950 dark:text-white">{item.disease}{item.therapies.length ? ` · ${item.therapies.join(' + ')}` : ''}</div>
                    {item.description && <p className="mt-1 line-clamp-4 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item.description}</p>}
                    {(item.sourceTitle || item.citationId) && <div className="mt-2 text-[8px] text-neutral-400">{item.sourceTitle || item.sourceType}{item.citationId ? ` · citation ${item.citationId}` : ''}</div>}
                  </div>
                ))}
                {!variant.evidence.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-3 text-[9px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">The CIViC variant matched, but no evidence items were returned by this query.</div>}
              </div>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">No CIViC variant matched this gene/protein query. This does not mean the variant is clinically irrelevant.</div>}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.055] dark:text-amber-100"><b>Interpretation boundary:</b> CIViC evidence levels describe the supporting study type and curation context. Panacea does not translate an evidence item into a patient-specific cancer diagnosis, stage, therapy selection, dose, or expected response.</div>
        </div>
      )}
    </section>
  )
}

export default CivicSomaticEvidencePanel
