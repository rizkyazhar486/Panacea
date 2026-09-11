import { lazy, Suspense, useState } from 'react'
import { parseSequenceEvidence, type SequenceEvidenceReport } from '../../lib/sequenceEvidence'

const VariantEvidenceWorkbench = lazy(() =>
  import('./VariantEvidenceWorkbench').then((module) => ({ default: module.VariantEvidenceWorkbench })),
)
const AdvancedGenomicsWorkbench = lazy(() =>
  import('./AdvancedGenomicsWorkbench').then((module) => ({ default: module.AdvancedGenomicsWorkbench })),
)

const MAX_ANALYSIS_BYTES = 32 * 1024 * 1024

function bytesLabel(value: number) {
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

function number(value: number | undefined, digits = 0) {
  if (value == null || !Number.isFinite(value)) return '—'
  return digits ? value.toFixed(digits) : Math.round(value).toLocaleString()
}

async function sha256(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function readSequencingPreview(file: File) {
  const isGzip = /\.gz$/i.test(file.name)
  if (!isGzip) {
    const sampled = file.size > MAX_ANALYSIS_BYTES
    const buffer = await (sampled ? file.slice(0, MAX_ANALYSIS_BYTES) : file).arrayBuffer()
    return { buffer, sampled, compressed: false }
  }

  const Decompression = (globalThis as unknown as { DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array> }).DecompressionStream
  if (!Decompression) throw new Error('This browser cannot decode gzip locally. Open Panacea in a current browser or provide an uncompressed FASTA/FASTQ/VCF file.')

  const reader = file.stream().pipeThrough(new Decompression('gzip')).getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  let sampled = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value?.byteLength) continue
    const remaining = MAX_ANALYSIS_BYTES - total
    if (remaining <= 0) {
      sampled = true
      await reader.cancel()
      break
    }
    if (value.byteLength > remaining) {
      chunks.push(value.slice(0, remaining))
      total += remaining
      sampled = true
      await reader.cancel()
      break
    }
    chunks.push(value)
    total += value.byteLength
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { buffer: merged.buffer, sampled, compressed: true }
}

function metricCards(report: SequenceEvidenceReport) {
  if (report.format === 'VCF') {
    return [
      ['Variant sites', number(report.variantSites)],
      ['ALT alleles', number(report.alternateAlleles)],
      ['SNP alleles', number(report.snpAlleles)],
      ['Indel alleles', number(report.indelAlleles)],
      ['PASS / unfiltered sites', number(report.passSites)],
      ['Ti/Tv', report.tiTv == null ? '—' : report.tiTv.toFixed(3)],
      ['Samples', number(report.sampleCount)],
      ['Assembly hint', report.assemblyHint || 'unknown'],
    ]
  }
  const cards = [
    ['Records / reads', number(report.recordCount)],
    ['Total bases', number(report.totalBases)],
    ['Mean length', `${number(report.meanLength)} bp`],
    ['N50', `${number(report.n50)} bp`],
    ['GC', `${number(report.gcPct, 2)}%`],
    ['Ambiguous', `${number(report.ambiguousPct, 2)}%`],
  ]
  if (report.format === 'FASTQ') {
    cards.push(
      ['Mean Phred Q', number(report.meanPhred, 2)],
      ['Q20 bases', `${number(report.q20Pct, 2)}%`],
      ['Q30 bases', `${number(report.q30Pct, 2)}%`],
    )
  }
  return cards
}

export function SequenceEvidenceWorkbench() {
  const [report, setReport] = useState<SequenceEvidenceReport | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [analyzedBytes, setAnalyzedBytes] = useState(0)
  const [hash, setHash] = useState('')
  const [sampled, setSampled] = useState(false)
  const [compressed, setCompressed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadFile(file: File | undefined) {
    if (!file) return
    setLoading(true)
    setError('')
    setReport(null)
    setHash('')
    setCompressed(false)
    try {
      const preview = await readSequencingPreview(file)
      const text = new TextDecoder().decode(preview.buffer)
      const parsed = parseSequenceEvidence(text)
      const digest = await sha256(preview.buffer)
      setReport(parsed)
      setFileName(file.name)
      setFileSize(file.size)
      setAnalyzedBytes(preview.buffer.byteLength)
      setSampled(preview.sampled)
      setCompressed(preview.compressed)
      setHash(digest)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to parse sequencing file.')
    } finally {
      setLoading(false)
    }
  }

  const cards = report ? metricCards(report) : []

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Local sequencing evidence</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Read real FASTA, FASTQ or VCF data in the browser.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">This workbench reads the selected file locally and computes transparent summary metrics. FASTQ from an Oxford Nanopore basecalling workflow can be inspected here, including gzip-compressed exports. Panacea is not performing basecalling itself. VCF consequence annotation is a separate, explicit-consent action.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-300">
            {['FASTA', 'FASTQ', 'VCF', 'gzip', 'local first'].map((item) => <span key={item} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{item}</span>)}
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-7 text-center transition hover:bg-emerald-50 dark:border-emerald-300/25 dark:bg-emerald-300/[.055] dark:hover:bg-emerald-300/[.08]">
          <input type="file" className="sr-only" accept=".fa,.fasta,.fna,.fq,.fastq,.vcf,.txt,.gz" onChange={(event) => void loadFile(event.target.files?.[0])} />
          <div className="text-[13px] font-black text-neutral-950 dark:text-white">{loading ? 'Reading sequence…' : 'Choose sequencing file'}</div>
          <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">FASTA / FASTQ / VCF or .gz · decoded locally · analysis is capped at 32 MB of decoded evidence and labelled when sampled</div>
        </label>
      </header>

      {error && <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/[.055] dark:text-rose-100">{error}</div>}

      {report && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-neutral-400">File provenance</div>
              <div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{fileName}</div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-neutral-400">source file {bytesLabel(fileSize)} · {report.format}{compressed ? ' · gzip decoded locally' : ''} · {sampled ? `${bytesLabel(analyzedBytes)} decoded preview analyzed` : `${bytesLabel(analyzedBytes)} analyzed`}{report.format === 'VCF' ? ` · ${report.assemblyHint || 'assembly unknown'}` : ''}</div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase ${sampled ? 'bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200'}`}>{sampled ? 'sampled' : 'complete decoded evidence'}</span>
            <div className="w-full break-all rounded-xl bg-white px-3 py-2 font-mono text-[8px] text-neutral-500 dark:bg-black/20 dark:text-neutral-400">SHA-256 of analyzed decoded bytes: {hash}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.02]">
                <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
                <div className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{value}</div>
              </article>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
            <article className="rounded-[24px] border border-neutral-200 p-4 dark:border-white/10">
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-700 dark:text-cyan-300">Evidence preview</div>
              <div className="mt-3 space-y-2">
                {report.preview.length ? report.preview.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.025]">
                    <div className="break-all text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</div>
                    <div className="mt-1 break-all font-mono text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.value}</div>
                  </div>
                )) : <div className="text-[10px] text-neutral-500">No preview rows available.</div>}
              </div>
            </article>

            <article className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-fuchsia-700 dark:text-fuchsia-300">Formula & interpretation boundary</div>
              <div className="mt-3 space-y-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {report.format === 'FASTQ' && <><p><b>Phred:</b> Q = ASCII − 33 for the quality character encoding used by this parser.</p><p><b>Q20/Q30:</b> bases with Q ≥ 20 or Q ≥ 30 ÷ quality-coded bases × 100%.</p></>}
                {report.format !== 'VCF' && <><p><b>GC%:</b> (G + C) ÷ (A + C + G + T) × 100%; ambiguous bases are reported separately.</p><p><b>N50:</b> the read/sequence length at which reads sorted longest→shortest cumulatively account for at least 50% of analyzed bases.</p></>}
                {report.format === 'VCF' && <><p><b>Ti/Tv:</b> transition SNP alleles ÷ transversion SNP alleles.</p><p>Rows are summarized as variant sites; alternate alleles are counted separately. This is not pathogenicity classification.</p></>}
                <p className="font-semibold text-neutral-950 dark:text-white">This parser summarizes file evidence. It does not infer a diagnosis, perform variant calling, assign pathogenicity, or claim that a sequence came from a particular patient unless the file itself is the user's source data.</p>
              </div>
            </article>
          </div>

          {(sampled || report.warnings.length > 0) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.055] dark:text-amber-100">
              {sampled && <div>Large-file boundary: metrics describe only the first {bytesLabel(analyzedBytes)} of decoded evidence, not the entire sequencing run.</div>}
              {report.warnings.map((warning) => <div key={warning}>{warning}</div>)}
            </div>
          )}

          {report.format === 'VCF' && report.variants && report.variants.length > 0 && (
            <>
              <Suspense fallback={<div className="rounded-[28px] border border-neutral-200 p-6 text-center text-[10px] font-semibold text-neutral-500 dark:border-white/10">Loading variant evidence tools…</div>}>
                <VariantEvidenceWorkbench variants={report.variants} assemblyHint={report.assemblyHint} referenceHeader={report.referenceHeader} />
              </Suspense>
              <Suspense fallback={<div className="rounded-[28px] border border-neutral-200 p-6 text-center text-[10px] font-semibold text-neutral-500 dark:border-white/10">Loading advanced genomics tools…</div>}>
                <AdvancedGenomicsWorkbench report={report} fileName={fileName} />
              </Suspense>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default SequenceEvidenceWorkbench
