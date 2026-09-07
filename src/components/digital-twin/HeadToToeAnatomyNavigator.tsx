import { useEffect, useMemo, useState } from 'react'
import {
  HEAD_TO_TOE_REGIONS,
  HEAD_TO_TOE_STRUCTURES,
  findHeadToToeRegionForStructure,
  type AnatomyStructure,
} from '../../lib/headToToeAnatomy'

type Props = {
  selectedId?: string
  onSelect: (structure: AnatomyStructure) => void
}

export function HeadToToeAnatomyNavigator({ selectedId, onSelect }: Props) {
  const initialRegion = findHeadToToeRegionForStructure(selectedId || '') ?? HEAD_TO_TOE_REGIONS[0]
  const [regionId, setRegionId] = useState(initialRegion.id)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!selectedId) return
    const region = findHeadToToeRegionForStructure(selectedId)
    if (region) setRegionId(region.id)
  }, [selectedId])

  const region = useMemo(() => HEAD_TO_TOE_REGIONS.find((item) => item.id === regionId) ?? HEAD_TO_TOE_REGIONS[0], [regionId])
  const normalized = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!normalized) return region.structures
    return HEAD_TO_TOE_STRUCTURES.filter((item) => [item.label, item.system, item.landmark, ...item.terms].join(' ').toLowerCase().includes(normalized))
  }, [normalized, region])

  function choose(structure: AnatomyStructure) {
    const owner = findHeadToToeRegionForStructure(structure.id)
    if (owner) setRegionId(owner.id)
    onSelect(structure)
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 bg-[radial-gradient(circle_at_8%_12%,rgba(56,189,248,.10),transparent_32%),radial-gradient(circle_at_88%_0%,rgba(16,185,129,.09),transparent_30%)] p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Head-to-toe precision map</div>
            <h3 className="mt-1 text-lg font-black tracking-tight text-neutral-950 dark:text-white">Choose a body region, then a named structure.</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The navigator runs in anatomical order from scalp to toes. Every item carries source-resolution terms for the HRA resolver; if no dedicated mesh exists, Panacea keeps the item as explicit anatomy metadata rather than drawing a substitute shape.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{HEAD_TO_TOE_REGIONS.length} ordered regions</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{HEAD_TO_TOE_STRUCTURES.length} named structures</span>
          </div>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any structure: retina, mitral valve, appendix, ACL, tibial nerve, plantar fascia…"
          className="mt-4 min-h-11 w-full rounded-2xl border border-neutral-200 bg-white/80 px-4 text-[11px] font-semibold text-neutral-800 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
          aria-label="Search head-to-toe anatomy"
        />
      </header>

      <div className="grid lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[.02] lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[.15em] text-neutral-400"><span>Head</span><span>↓ Toe</span></div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible">
            {HEAD_TO_TOE_REGIONS.map((item, index) => {
              const active = item.id === region.id && !normalized
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setRegionId(item.id); setQuery('') }}
                  className={`min-w-[175px] rounded-2xl border p-3 text-left transition lg:w-full ${active ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-300/35 dark:bg-cyan-300/10' : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}
                >
                  <div className="flex items-center gap-2"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[8px] font-black ${active ? 'bg-cyan-600 text-white' : 'bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{index + 1}</span><span className="text-[10px] font-black text-neutral-900 dark:text-white">{item.label}</span></div>
                  <div className="mt-1 pl-7 text-[8px] leading-relaxed text-neutral-400">{item.span}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">{normalized ? 'Whole-body search results' : region.span}</div>
              <div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{normalized ? `${matches.length} matching structures` : `${region.label} · ${region.structures.length} structures`}</div>
            </div>
            {normalized && <button type="button" onClick={() => setQuery('')} className="rounded-full border border-neutral-200 px-3 py-1.5 text-[8px] font-black text-neutral-500 dark:border-white/10 dark:text-neutral-300">Back to {region.label}</button>}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((structure) => {
              const selected = structure.id === selectedId
              const owner = findHeadToToeRegionForStructure(structure.id)
              return (
                <button
                  key={structure.id}
                  type="button"
                  onClick={() => choose(structure)}
                  className={`rounded-2xl border p-3 text-left transition ${selected ? 'border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-300/35 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[.025]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black leading-snug text-neutral-950 dark:text-white">{structure.label}</span>
                    {selected && <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-1 text-[7px] font-black text-white">FOCUS</span>}
                  </div>
                  <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{structure.system}</div>
                  {normalized && owner && <div className="mt-1 text-[8px] font-semibold text-neutral-400">{owner.label}</div>}
                  <p className="mt-2 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{structure.landmark}</p>
                </button>
              )
            })}
          </div>
          {!matches.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-5 text-center text-[10px] text-neutral-500 dark:border-white/10">No named structure matches this search. Try a regional term, vessel, nerve, bone, joint or organ name.</div>}
        </div>
      </div>
    </section>
  )
}
