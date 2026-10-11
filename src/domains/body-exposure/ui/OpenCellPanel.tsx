import { useEffect, useMemo, useState } from 'react'
import { LOCALISATION_LABEL, parseOpenCellIndex, searchProteins, type OpenCellProtein, type PublishedOpenCell } from '../engine/openCellIndex'

// Skala sel: di mana sebuah protein berada di dalam sel (OpenCell, HEK293T). Dimuat malas saat dibuka; hanya menampilkan data terukur beserta batasnya.
const fmt = (v: number | null, unit: string) => (v === null ? 'not measured' : `${v >= 100 ? Math.round(v).toLocaleString('en') : v.toPrecision(3)} ${unit}`)

function Chips({ title, items }: { title: string; items: readonly string[] }) {
  if (!items.length) return null
  return (
    <p className="text-[13px]"><span className="font-bold">{title}: </span>
      {items.map((x, i) => <span key={x} data-testid="opencell-loc">{i ? ' · ' : ''}{LOCALISATION_LABEL[x as keyof typeof LOCALISATION_LABEL] ?? x}</span>)}
    </p>
  )
}

export function OpenCellPanel({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<PublishedOpenCell | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<OpenCellProtein | null>(null)

  useEffect(() => {
    if (!open || index || error) return
    let live = true
    fetch(`${baseUrl}opencell_index.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { const p = parseOpenCellIndex(j); if (!live) return; if (p.ok) setIndex(p.index); else setError(`The cell-scale data failed validation (${p.error}).`) })
      .catch((e) => { if (live) setError(`The cell-scale data could not be loaded (${e.message}).`) })
    return () => { live = false }
  }, [open, index, error, baseUrl])

  const hits = useMemo(() => (index ? searchProteins(index.proteins, query, 8) : []), [index, query])

  return (
    <details className="rounded-2xl border border-neutral-200 p-3 text-sm dark:border-white/10" data-testid="opencell-panel" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer font-bold">Cell scale: where a protein sits inside a cell</summary>
      <p className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-300">Measured in cultured HEK293T cells, not in the tissue or body shown above.</p>
      {error && <p className="mt-2 text-[13px] text-amber-800 dark:text-amber-200" role="alert">{error}</p>}
      {open && !index && !error && <p className="mt-2 text-[13px]">Loading cell-scale data…</p>}
      {index && (
        <div className="mt-2 space-y-2">
          <label className="block text-[13px] font-bold" htmlFor="opencell-q">Find a protein</label>
          <input id="opencell-q" value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null) }} placeholder={`Gene or protein name, e.g. ACTB (${index.proteins.length.toLocaleString('en')} proteins)`}
            className="min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 text-[14px] dark:border-white/15 dark:bg-white/5" />
          {query.trim() && hits.length === 0 && <p className="text-[13px]" data-testid="opencell-empty">No protein matches “{query.trim()}” in the {index.proteins.length.toLocaleString('en')} that were tagged.</p>}
          {!picked && hits.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {hits.map((p) => (
                <li key={p.ensg}><button className="min-h-[40px] rounded-full border border-neutral-300 px-3 text-[13px] font-bold dark:border-white/20" onClick={() => setPicked(p)}>{p.gene}</button></li>
              ))}
            </ul>
          )}
          {picked && (
            <div className="space-y-1" data-testid="opencell-result">
              <p className="text-base font-black">{picked.gene} <span className="text-[12px] font-semibold text-neutral-500">{picked.ensg}{picked.uniprot ? ` · UniProt ${picked.uniprot}` : ''}</span></p>
              {picked.name && <p className="text-[13px]">{picked.name}</p>}
              <Chips title="Most prominent location" items={picked.grade3} />
              <Chips title="Also present" items={picked.grade2} />
              <Chips title="Weak" items={picked.grade1} />
              <p className="text-[13px]">RNA {fmt(picked.rnaTpm, 'TPM')} · protein {fmt(picked.proteinNm, 'nM')} · {fmt(picked.copyNumber, 'copies per cell')}</p>
              <button className="text-[13px] font-bold underline" onClick={() => setPicked(null)}>Back to results</button>
            </div>
          )}
          <p className="text-[11px] leading-snug text-neutral-500">{index.limitations} Data: {index.licence}. {index.citation}</p>
        </div>
      )}
    </details>
  )
}
