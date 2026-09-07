import { useMemo, useState } from 'react'
import type { SequenceEvidenceReport } from '../../lib/sequenceEvidence'
import {
  DORADO_REPOSITORY,
  ONT_BASECALLING_DOCS,
  PHARMCAT_REPOSITORY,
  PHARMCAT_RUNNING_DOCS,
  parsePharmcatPhenotypeJson,
  parseStructuralVariantEvidence,
  pharmcatCommand,
  type PharmcatPhenotypeReport,
} from '../../lib/advancedGenomicsEvidence'

type Props = {
  report: SequenceEvidenceReport
  fileName?: string
}

function bytesLabel(value: number) {
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

function lengthLabel(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return 'length not supplied'
  return `${Math.abs(value).toLocaleString()} bp`
}

function compactPhenotypes(values: string[]) {
  return values.length ? values.join(' · ') : 'Phenotype not assigned'
}

export function AdvancedGenomicsWorkbench({ report, fileName = 'sample.vcf' }: Props) {
  const structural = useMemo(
    () => parseStructuralVariantEvidence(report.structuralVariants?.length ? report.structuralVariants : (report.variants || [])),
    [report.structuralVariants, report.variants],
  )
  const [pharmcat, setPharmcat] = useState<PharmcatPhenotypeReport | null>(null)
  const [pharmcatFile, setPharmcatFile] = useState('')
  const [pharmcatError, setPharmcatError] = useState('')
  const [rawFiles, setRawFiles] = useState<File[]>([])
  const [modelConfig, setModelConfig] = useState('')
  const [rawExt, setRawExt] = useState<'pod5' | 'fast5'>('pod5')
  const [copied, setCopied] = useState('')

  async function loadPharmcat(file: File | undefined) {
    if (!file) return
    setPharmcatError('')
    try {
      const text = await file.text()
      const parsed = parsePharmcatPhenotypeJson(text)
      setPharmcat(parsed)
      setPharmcatFile(file.name)
    } catch (cause) {
      setPharmcat(null)
      setPharmcatFile(file.name)
      setPharmcatError(cause instanceof Error ? cause.message : 'Unable to parse PharmCAT phenotype JSON.')
    }
  }

  const basecallCommand = useMemo(() => {
    const model = modelConfig.trim() || '<current-compatible-model>'
    return `nextflow run epi2me-labs/wf-basecalling --input '/data/raw' --dorado_ext '${rawExt}' --basecaller_cfg '${model}' -profile standard`
  }, [modelConfig, rawExt])

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  const rawTotal = rawFiles.reduce((sum, file) => sum + file.size, 0)
  const pgxCommand = pharmcatCommand(fileName)

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Structural variation / CNV</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Read structural events already present in the VCF.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Panacea recognizes symbolic SV alleles, SVTYPE, END, SVLEN, copy-number fields and breakend notation. This is evidence parsing, not structural-variant calling. A caller such as Sniffles, cuteSV or another validated upstream pipeline must create the VCF first. gVCF &lt;NON_REF&gt; reference blocks and END-only records are not treated as SV calls.</p>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[8px] font-black uppercase text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">local VCF only</span>
        </div>

        <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['SV records', structural.records.length],
            ['DEL', structural.deletions],
            ['DUP', structural.duplications],
            ['CNV', structural.copyNumberEvents],
            ['INV', structural.inversions],
            ['BND/TRA', structural.breakends],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
              <div className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{value}</div>
            </div>
          ))}
        </div>

        {structural.records.length > 0 ? (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {structural.records.slice(0, 20).map((item, index) => (
              <article key={`${item.chrom}-${item.pos}-${item.alt}-${index}`} className="w-[250px] shrink-0 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-[8px] font-black text-sky-800 dark:bg-sky-300/10 dark:text-sky-200">{item.kind}</span>
                  <span className="text-[8px] font-bold text-neutral-400">{item.filter}</span>
                </div>
                <div className="mt-2 text-[11px] font-black text-neutral-950 dark:text-white">{item.chrom}:{item.pos.toLocaleString()}{item.end ? `–${item.end.toLocaleString()}` : ''}</div>
                <div className="mt-1 break-all font-mono text-[8px] text-neutral-500 dark:text-neutral-400">ALT {item.alt}</div>
                <div className="mt-2 text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">{lengthLabel(item.svLength)}{item.copyNumber != null ? ` · CN ${item.copyNumber}` : ''}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 p-4 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">No structural-variant notation was found in the analyzed VCF evidence. Panacea will not fabricate SV/CNV calls from SNP/indel or gVCF reference-block data.</div>
        )}
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-fuchsia-700 dark:text-fuchsia-300">PharmCAT bridge</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Import validated star-allele / diplotype calls instead of inventing them in-browser.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">PharmCAT performs named-allele matching and phenotyping from appropriately prepared PGx inputs. Panacea imports its <code>*.phenotype.json</code> output and shows source calls, phenotype and activity score. Panacea does not derive a CYP2D6/HLA diplotype from a generic VCF by itself.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={PHARMCAT_RUNNING_DOCS} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">PharmCAT docs ↗</a>
            <a href={PHARMCAT_REPOSITORY} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">GitHub ↗</a>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
          <label className="flex cursor-pointer flex-col justify-center rounded-[24px] border border-dashed border-fuchsia-300 bg-fuchsia-50/60 p-5 text-center dark:border-fuchsia-300/20 dark:bg-fuchsia-300/[.045]">
            <input type="file" accept=".json" className="sr-only" onChange={(event) => void loadPharmcat(event.target.files?.[0])} />
            <div className="text-[12px] font-black text-neutral-950 dark:text-white">Import PharmCAT phenotype JSON</div>
            <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">Local parse · no upload by this component</div>
          </label>

          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[8px] font-black uppercase tracking-[.13em] text-neutral-400">Upstream command template</div>
            <div className="mt-2 break-all rounded-xl bg-white p-3 font-mono text-[8px] leading-relaxed text-neutral-600 dark:bg-black/20 dark:text-neutral-300">{pgxCommand}</div>
            <button onClick={() => void copy('pharmcat', pgxCommand)} className="mt-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[8px] font-black text-neutral-700 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200">{copied === 'pharmcat' ? 'Copied' : 'Copy command'}</button>
          </div>
        </div>

        {pharmcatError && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/[.055] dark:text-rose-100">{pharmcatError}</div>}

        {pharmcat && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2 text-[8px] font-black uppercase">
              <span className="rounded-full bg-fuchsia-100 px-3 py-1.5 text-fuchsia-800 dark:bg-fuchsia-300/10 dark:text-fuchsia-200">{pharmcat.sourceKind}</span>
              <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:text-neutral-300">{pharmcatFile}</span>
              <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:text-neutral-300">{pharmcat.calledGenes} called</span>
              <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:text-neutral-300">{pharmcat.noResultGenes} no-result</span>
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {pharmcat.genes.map((gene) => {
                const primary = gene.diplotypes[0]
                return (
                  <article key={gene.gene} className="w-[270px] shrink-0 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-black text-neutral-950 dark:text-white">{gene.gene}</div>
                      <span className="rounded-full bg-white px-2 py-1 text-[7px] font-black text-neutral-500 dark:bg-black/20 dark:text-neutral-300">{gene.callSource}</span>
                    </div>
                    <div className="mt-2 text-[10px] font-black text-fuchsia-700 dark:text-fuchsia-300">{primary?.label || 'No recommendation diplotype'}</div>
                    <div className="mt-1 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{compactPhenotypes(primary?.phenotypes || [])}</div>
                    {primary?.activityScore != null && <div className="mt-2 text-[9px] font-black text-neutral-700 dark:text-neutral-200">Activity score {primary.activityScore}</div>}
                    {(primary?.allele1 || primary?.allele2) && <div className="mt-2 text-[8px] text-neutral-500 dark:text-neutral-400">{primary?.allele1?.name || '—'} / {primary?.allele2?.name || '—'}</div>}
                    <div className="mt-3 border-t border-neutral-200 pt-2 text-[7px] uppercase tracking-wide text-neutral-400 dark:border-white/10">allele defs {gene.alleleDefinitionVersion || '—'} · phenotype {gene.phenotypeVersion || '—'}</div>
                  </article>
                )
              })}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.055] dark:text-amber-100"><b>Clinical boundary:</b> imported PharmCAT calls are upstream PGx results. Drug recommendations still depend on the exact guideline, phenotype/diplotype certainty, clinical indication, interacting medicines, organ function and clinician review.</div>
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Oxford Nanopore raw signal</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Recognize POD5/FAST5 and hand off basecalling to Dorado/EPI2ME.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Raw ionic-current signal is not basecalled inside this browser. Panacea inventories selected raw files locally and creates an explicit command for Oxford Nanopore's upstream workflow. Model compatibility must be chosen from the current ONT release for the flow cell and chemistry used.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={ONT_BASECALLING_DOCS} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">ONT workflow ↗</a>
            <a href={DORADO_REPOSITORY} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[8px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">Dorado GitHub ↗</a>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
          <label className="flex cursor-pointer flex-col justify-center rounded-[24px] border border-dashed border-emerald-300 bg-emerald-50/60 p-5 text-center dark:border-emerald-300/20 dark:bg-emerald-300/[.045]">
            <input type="file" multiple accept=".pod5,.fast5" className="sr-only" onChange={(event) => setRawFiles(Array.from(event.target.files || []))} />
            <div className="text-[12px] font-black text-neutral-950 dark:text-white">Select POD5 / FAST5 files</div>
            <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">Metadata only · raw bytes are not parsed or uploaded here</div>
          </label>

          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Raw extension</div>
                <select value={rawExt} onChange={(event) => setRawExt(event.target.value as 'pod5' | 'fast5')} className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[9px] font-black dark:border-white/10 dark:bg-[#11161b] dark:text-white"><option value="pod5">POD5</option><option value="fast5">FAST5</option></select>
              </label>
              <label>
                <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">ONT model config</div>
                <input value={modelConfig} onChange={(event) => setModelConfig(event.target.value)} placeholder="Choose current compatible model" className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[9px] font-semibold dark:border-white/10 dark:bg-[#11161b] dark:text-white" />
              </label>
            </div>
            <div className="mt-3 break-all rounded-xl bg-white p-3 font-mono text-[8px] leading-relaxed text-neutral-600 dark:bg-black/20 dark:text-neutral-300">{basecallCommand}</div>
            <button onClick={() => void copy('dorado', basecallCommand)} className="mt-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[8px] font-black text-neutral-700 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200">{copied === 'dorado' ? 'Copied' : 'Copy workflow command'}</button>
          </div>
        </div>

        {rawFiles.length > 0 && <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[9px] text-neutral-600 dark:border-white/10 dark:bg-white/[.025] dark:text-neutral-300">Selected locally: <b>{rawFiles.length}</b> raw file{rawFiles.length === 1 ? '' : 's'} · {bytesLabel(rawTotal)} total. This is an inventory only; no basecalling result exists until Dorado/EPI2ME actually runs.</div>}
      </section>
    </div>
  )
}

export default AdvancedGenomicsWorkbench
