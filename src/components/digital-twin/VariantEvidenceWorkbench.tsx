import { useEffect, useMemo, useState } from 'react'
import type { GenomeAssemblyHint, VcfVariantRecord } from '../../lib/sequenceEvidence'
import {
  annotateVariantsWithVep,
  clinvarSearchUrl,
  ensemblVariantUrl,
  externalVepAssembly,
  type VariantEvidenceResult,
  type VepTranscriptConsequence,
} from '../../lib/variantEvidence'

type Props = {
  variants: VcfVariantRecord[]
  assemblyHint?: GenomeAssemblyHint
  referenceHeader?: string
}

function impactClass(impact: string | undefined) {
  if (impact === 'HIGH') return 'bg-rose-100 text-rose-800 dark:bg-rose-300/10 dark:text-rose-200'
  if (impact === 'MODERATE') return 'bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200'
  if (impact === 'LOW') return 'bg-sky-100 text-sky-800 dark:bg-sky-300/10 dark:text-sky-200'
  return 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
}

function transcriptLabel(item: VepTranscriptConsequence) {
  return item.gene_symbol || item.gene_id || item.transcript_id || 'Transcript consequence'
}

function prettyTerm(value: string) {
  return value.replace(/_/g, ' ')
}

export function VariantEvidenceWorkbench({ variants, assemblyHint = 'unknown', referenceHeader = '' }: Props) {
  const inferred = externalVepAssembly(assemblyHint)
  const [assembly, setAssembly] = useState<'GRCh37' | 'GRCh38' | ''>(inferred || '')
  const [limit, setLimit] = useState(10)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<VariantEvidenceResult[]>([])
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    setAssembly(externalVepAssembly(assemblyHint) || '')
    setResults([])
    setSkipped(0)
    setConsent(false)
    setError('')
  }, [assemblyHint, variants])

  const selectedCount = Math.min(limit, variants.length)
  const hasUnknownAssembly = assemblyHint === 'unknown'

  async function annotate() {
    if (!assembly || !consent || !variants.length) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      const response = await annotateVariantsWithVep(variants, assembly, limit)
      setResults(response.results)
      setSkipped(response.skipped)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Variant consequence request failed.')
    } finally {
      setLoading(false)
    }
  }

  const consequenceCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const result of results) counts.set(result.mostSevereConsequence, (counts.get(result.mostSevereConsequence) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [results])

  if (!variants.length) return null

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">VCF → Ensembl VEP</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Annotate variants that actually exist in the loaded VCF.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Nothing is sent automatically. After explicit consent, Panacea sends only the selected VCF locus/ref/alt records to Ensembl VEP and displays returned consequence, transcript and colocated-variant metadata. This does not perform variant calling or ACMG classification.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-300">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">Ensembl REST</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">VEP</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">explicit consent</span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <label className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Genome assembly</div>
            <select value={assembly} onChange={(event) => setAssembly(event.target.value as 'GRCh37' | 'GRCh38' | '')} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-black text-neutral-950 outline-none dark:border-white/10 dark:bg-[#11161b] dark:text-white">
              <option value="">Choose assembly</option>
              <option value="GRCh38">GRCh38 / hg38</option>
              <option value="GRCh37">GRCh37 / hg19</option>
            </select>
            <div className="mt-1 text-[8px] text-neutral-400">VCF hint: {assemblyHint}{referenceHeader ? ` · ${referenceHeader}` : ''}</div>
          </label>

          <label className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">ALT alleles to annotate</div>
            <select value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-black text-neutral-950 outline-none dark:border-white/10 dark:bg-[#11161b] dark:text-white">
              {[5, 10, 20].map((value) => <option key={value} value={value}>First {Math.min(value, variants.length)}</option>)}
            </select>
            <div className="mt-1 text-[8px] text-neutral-400">Up to 20 variants per explicit request.</div>
          </label>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Privacy boundary</div>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
              <span>I understand that {selectedCount} selected locus/ref/alt record{selectedCount === 1 ? '' : 's'} will be sent to the Ensembl REST service.</span>
            </label>
          </div>
        </div>

        {hasUnknownAssembly && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.055] dark:text-amber-100">The VCF header did not clearly identify GRCh37/hg19 or GRCh38/hg38. Confirm the assembly before annotation; a coordinate interpreted against the wrong assembly can point to a different locus.</div>}

        <button onClick={() => void annotate()} disabled={loading || !assembly || !consent || !variants.length} className="mt-3 rounded-2xl bg-neutral-950 px-4 py-3 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-neutral-950">
          {loading ? 'Querying Ensembl VEP…' : `Send ${selectedCount} variant${selectedCount === 1 ? '' : 's'} to Ensembl VEP`}
        </button>
      </header>

      {error && <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/[.055] dark:text-rose-100">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1.5 text-[8px] font-black uppercase text-violet-800 dark:bg-violet-300/10 dark:text-violet-200">{results.length} annotated · {assembly}</span>
            {skipped > 0 && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[8px] font-black uppercase text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">{skipped} unsupported skipped</span>}
            {consequenceCounts.map(([term, count]) => <span key={term} className="rounded-full border border-neutral-200 px-3 py-1.5 text-[8px] font-bold text-neutral-500 dark:border-white/10 dark:text-neutral-300">{prettyTerm(term)} · {count}</span>)}
          </div>

          <div className="space-y-3">
            {results.map((result, index) => {
              const primary = result.transcripts[0]
              const externalId = result.colocatedIds.find((id) => /^rs\d+$/i.test(id)) || (result.sourceVariant.id !== '.' ? result.sourceVariant.id : '')
              const clinvarTerm = externalId || `${result.sourceVariant.chrom}:${result.sourceVariant.pos} ${result.sourceVariant.ref}>${result.sourceVariant.alt}`
              return (
                <article key={`${result.input}-${index}`} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">{result.locus} · {result.sourceVariant.ref} → {result.sourceVariant.alt}</div>
                      <div className="mt-1 text-[14px] font-black text-neutral-950 dark:text-white">{prettyTerm(result.mostSevereConsequence)}</div>
                      <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">{result.variantClass} · {result.genes.length ? result.genes.join(', ') : 'No gene symbol returned'}{externalId ? ` · ${externalId}` : ''}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1.5 text-[8px] font-black uppercase ${impactClass(primary?.impact)}`}>{primary?.impact || 'context'}</span>
                  </div>

                  {result.clinicalSignificance.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3 dark:border-fuchsia-300/20 dark:bg-fuchsia-300/[.045]">
                      <div className="text-[8px] font-black uppercase tracking-[.12em] text-fuchsia-700 dark:text-fuchsia-300">Colocated clinical-significance metadata returned by Ensembl</div>
                      <div className="mt-1 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">{result.clinicalSignificance.map(prettyTerm).join(' · ')}</div>
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 lg:grid-cols-2">
                    {result.transcripts.slice(0, 4).map((item, transcriptIndex) => (
                      <div key={`${item.transcript_id}-${transcriptIndex}`} className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-black/15">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[10px] font-black text-neutral-950 dark:text-white">{transcriptLabel(item)}</div>
                          <span className={`rounded-full px-2 py-1 text-[7px] font-black uppercase ${impactClass(item.impact)}`}>{item.impact || '—'}</span>
                        </div>
                        <div className="mt-1 text-[8px] font-mono text-neutral-400">{item.transcript_id || 'transcript id not returned'}{item.mane_select ? ` · MANE ${item.mane_select}` : item.canonical ? ' · canonical' : ''}</div>
                        <div className="mt-2 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{(item.consequence_terms || []).map(prettyTerm).join(', ') || 'No transcript consequence term returned.'}</div>
                        {(item.hgvsc || item.hgvsp) && <div className="mt-2 break-all font-mono text-[8px] text-cyan-700 dark:text-cyan-300">{[item.hgvsc, item.hgvsp].filter(Boolean).join(' · ')}</div>}
                        {(item.sift_prediction || item.polyphen_prediction) && <div className="mt-2 text-[8px] text-neutral-500 dark:text-neutral-400">{item.sift_prediction ? `SIFT ${item.sift_prediction}${item.sift_score != null ? ` (${item.sift_score})` : ''}` : ''}{item.sift_prediction && item.polyphen_prediction ? ' · ' : ''}{item.polyphen_prediction ? `PolyPhen ${item.polyphen_prediction}${item.polyphen_score != null ? ` (${item.polyphen_score})` : ''}` : ''}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {externalId && <a href={ensemblVariantUrl(externalId, result.assembly)} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-[8px] font-black text-neutral-700 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200">Ensembl variant ↗</a>}
                    <a href={clinvarSearchUrl(clinvarTerm)} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-[8px] font-black text-neutral-700 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200">Search ClinVar ↗</a>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[9px] leading-relaxed text-neutral-600 dark:border-white/10 dark:bg-white/[.025] dark:text-neutral-300"><b>Interpretation boundary:</b> VEP consequence terms describe predicted genomic/transcript consequences. Colocated clinical-significance metadata can be incomplete, conflicting, old, or unrelated to the exact allele/context. Panacea does not convert these results into pathogenic/benign classification, treatment selection, or a patient diagnosis.</div>
        </div>
      )}
    </section>
  )
}

export default VariantEvidenceWorkbench
