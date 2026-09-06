import { FormEvent, useEffect, useMemo, useState } from 'react'

type Props = { mode?: 'body-cell' | 'cell-genome' }

type HpaGene = {
  Gene?: string
  'Gene synonym'?: string
  Ensembl?: string
  'Gene description'?: string
  Chromosome?: string
  Position?: string
  'Protein class'?: string
}

type EnsemblLookup = {
  id?: string
  display_name?: string
  description?: string
  seq_region_name?: string
  start?: number
  end?: number
  strand?: number
  biotype?: string
}

type EnsemblSequence = { id?: string; seq?: string; desc?: string; molecule?: string }

type CellResult = {
  symbol: string
  ensemblId: string
  description: string
  chromosome: string
  position: string
  proteinClass: string
  images: string[]
  lookup?: EnsemblLookup
  sequence?: EnsemblSequence
}

const HPA_SEARCH = 'https://www.proteinatlas.org/api/search_download.php'
const HPA_BASE = 'https://www.proteinatlas.org'
const ENSEMBL = 'https://rest.ensembl.org'

function timeoutSignal(ms = 12000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ms)
  return { controller, clear: () => window.clearTimeout(timer) }
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}) {
  const { controller, clear } = timeoutSignal()
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', ...headers } })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json() as T
  } finally { clear() }
}

async function fetchText(url: string) {
  const { controller, clear } = timeoutSignal()
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' } })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.text()
  } finally { clear() }
}

function parseImageUrls(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const urls = Array.from(doc.querySelectorAll('imageUrl'))
    .map((node) => node.textContent?.trim() || '')
    .filter((url) => /^https?:\/\//i.test(url))
  return [...new Set(urls)].slice(0, 6)
}

function sanitizeSymbol(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 32).toUpperCase()
}

async function loadGene(raw: string): Promise<CellResult> {
  const symbol = sanitizeSymbol(raw)
  if (!symbol) throw new Error('Enter a human gene symbol such as TP53, BRCA1, EGFR or HBB.')

  const hpaUrl = `${HPA_SEARCH}?search=${encodeURIComponent(symbol)}&format=json&columns=g,gs,eg,gd,chr,chrp,pc&compress=no`
  const hpaRows = await fetchJson<HpaGene[]>(hpaUrl)
  const exact = hpaRows.find((row) => (row.Gene || '').toUpperCase() === symbol) || hpaRows[0]

  let lookup: EnsemblLookup | undefined
  try {
    lookup = await fetchJson<EnsemblLookup>(`${ENSEMBL}/lookup/symbol/homo_sapiens/${encodeURIComponent(symbol)}?content-type=application/json`, { 'Content-Type': 'application/json' })
  } catch { /* HPA result can still be used */ }

  const ensemblId = exact?.Ensembl || lookup?.id || ''
  if (!ensemblId) throw new Error(`No HPA/Ensembl human gene record found for ${symbol}.`)

  let sequence: EnsemblSequence | undefined
  try {
    sequence = await fetchJson<EnsemblSequence>(`${ENSEMBL}/sequence/id/${encodeURIComponent(ensemblId)}?type=genomic;content-type=application/json`, { 'Content-Type': 'application/json' })
  } catch { /* sequence stays optional */ }

  let images: string[] = []
  try {
    images = parseImageUrls(await fetchText(`${HPA_BASE}/${encodeURIComponent(ensemblId)}.xml`))
  } catch { /* image XML can be blocked by CORS; metadata still works */ }

  return {
    symbol: exact?.Gene || lookup?.display_name || symbol,
    ensemblId,
    description: exact?.['Gene description'] || lookup?.description || 'Description not supplied by the source.',
    chromosome: exact?.Chromosome || lookup?.seq_region_name || '—',
    position: exact?.Position || (lookup?.start && lookup?.end ? `${lookup.start.toLocaleString()}–${lookup.end.toLocaleString()}` : '—'),
    proteinClass: exact?.['Protein class'] || '—',
    images,
    lookup,
    sequence,
  }
}

function sequenceRows(sequence: string) {
  const clean = sequence.toUpperCase().replace(/[^ACGTN]/g, '')
  const head = clean.slice(0, 600)
  return Array.from({ length: Math.ceil(head.length / 60) }, (_, index) => {
    const start = index * 60
    return { start: start + 1, seq: head.slice(start, start + 60) }
  })
}

export function CellGenomeEvidenceLab({ mode = 'cell-genome' }: Props) {
  const [query, setQuery] = useState(mode === 'body-cell' ? 'ACTB' : 'TP53')
  const [result, setResult] = useState<CellResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)

  async function run(next = query) {
    setLoading(true)
    setError('')
    try {
      const loaded = await loadGene(next)
      setResult(loaded)
      setImageIndex(0)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gene source request failed.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void run(query) /* run once for the selected mode */ }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function submit(event: FormEvent) {
    event.preventDefault()
    void run()
  }

  const rows = useMemo(() => sequenceRows(result?.sequence?.seq || ''), [result?.sequence?.seq])
  const currentImage = result?.images[imageIndex]

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-[#080b0e] text-white shadow-[0_24px_70px_rgba(0,0,0,.2)] dark:border-white/10">
      <header className="border-b border-white/10 bg-[#0c1116] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-fuchsia-300">Human Protein Atlas × Ensembl</div>
            <h2 className="mt-1 text-[19px] font-black tracking-[-.03em] sm:text-[24px]">{mode === 'body-cell' ? 'Real cell evidence, not a drawn cell' : 'Cell → gene → genomic sequence'}</h2>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/55">Protein/cell metadata and microscopy links come from the Human Protein Atlas. Gene coordinates and genomic sequence come from Ensembl REST.</p>
          </div>
          <div className="flex gap-2 text-[8px] font-black uppercase tracking-[.1em] text-white/45"><span className="rounded-full border border-white/10 px-2.5 py-1.5">HPA</span><span className="rounded-full border border-white/10 px-2.5 py-1.5">Ensembl REST</span></div>
        </div>
        <form onSubmit={submit} className="mt-3 flex max-w-xl gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TP53" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-[11px] font-black uppercase text-white outline-none focus:border-fuchsia-300/50" aria-label="Human gene symbol" />
          <button disabled={loading || !query.trim()} className="rounded-2xl bg-white px-4 py-2.5 text-[10px] font-black text-neutral-950 disabled:opacity-40">{loading ? 'Loading…' : 'Load gene'}</button>
        </form>
      </header>

      {error && <div className="m-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-[10px] font-semibold text-rose-100">{error}</div>}

      {result && (
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
          <div className="min-w-0 border-b border-white/10 p-4 lg:border-b-0 lg:border-r sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Human gene</div><div className="mt-1 text-3xl font-black tracking-[-.045em]">{result.symbol}</div><div className="mt-1 font-mono text-[9px] text-fuchsia-200">{result.ensemblId}</div></div>
              <a href={`${HPA_BASE}/${result.ensemblId}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[9px] font-black text-white/70">Open HPA record ↗</a>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/62">{result.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Chromosome', result.chromosome], ['Position', result.position], ['Biotype', result.lookup?.biotype || '—'], ['Protein class', result.proteinClass]].map(([label, value]) => <div key={label} className="rounded-[18px] border border-white/[.08] bg-white/[.035] p-3"><div className="text-[8px] font-black uppercase tracking-[.12em] text-white/32">{label}</div><div className="mt-1 line-clamp-3 text-[10px] font-black text-white/82">{value}</div></div>)}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Subcellular microscopy</div><div className="mt-1 text-[13px] font-black">Human Protein Atlas assay images</div></div>{result.images.length > 0 && <div className="text-[9px] font-black text-white/35">{imageIndex + 1}/{result.images.length}</div>}</div>
              {currentImage ? (
                <div className="mt-3 overflow-hidden rounded-[22px] border border-white/10 bg-black">
                  <img src={currentImage} alt={`Human Protein Atlas microscopy for ${result.symbol}`} className="aspect-[4/3] w-full object-contain" loading="lazy" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="mt-3 grid min-h-64 place-items-center rounded-[22px] border border-dashed border-white/15 bg-white/[.025] p-6 text-center"><div><div className="text-[11px] font-black text-white/70">Microscopy link not exposed to this browser session</div><p className="mt-2 max-w-md text-[9px] leading-relaxed text-white/40">The HPA gene metadata remains live. Use “Open HPA record” for the source microscopy if cross-origin XML access is blocked.</p></div></div>
              )}
              {result.images.length > 1 && <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">{result.images.map((url, index) => <button key={url} onClick={() => setImageIndex(index)} className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border ${index === imageIndex ? 'border-fuchsia-300' : 'border-white/10'}`}><img src={url} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" /></button>)}</div>}
            </div>
          </div>

          <aside className="min-w-0 bg-[#0b0f13] p-4 sm:p-5">
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Genomic sequence</div>
            <h3 className="mt-1 text-[15px] font-black">Actual Ensembl sequence response</h3>
            <p className="mt-1 text-[9px] leading-relaxed text-white/42">The viewer shows only the first 600 bases to keep the page usable. It does not invent variants or claim sequencing was performed on the user.</p>
            {rows.length > 0 ? (
              <div className="mt-3 max-h-[510px] overflow-auto rounded-[20px] border border-white/[.08] bg-black/35 p-3 font-mono text-[9px] leading-5">
                {rows.map((row) => <div key={row.start} className="flex gap-3"><span className="w-10 shrink-0 text-right text-white/25">{row.start}</span><span className="break-all tracking-[.08em] text-emerald-200/85">{row.seq}</span></div>)}
              </div>
            ) : <div className="mt-3 rounded-[20px] border border-white/[.08] bg-white/[.025] p-4 text-[9px] text-white/45">Ensembl sequence endpoint did not return a sequence for this record.</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${encodeURIComponent(result.ensemblId)}`} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-950">Ensembl ↗</a>
              <a href={`${HPA_BASE}/${result.ensemblId}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black text-white/70">HPA ↗</a>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CellGenomeEvidenceLab
