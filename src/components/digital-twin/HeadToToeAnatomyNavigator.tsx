import { useEffect, useMemo, useState } from 'react'
import {
  HEAD_TO_TOE_REGIONS,
  HEAD_TO_TOE_STRUCTURES,
  findHeadToToeRegionForStructure,
  type AnatomyStructure,
} from '../../lib/expandedAnatomy'
import { countAnatomySubstructures } from '../../lib/anatomySubstructures'

type Props = {
  selectedId?: string
  onSelect: (structure: AnatomyStructure) => void
}

const SUBSTRUCTURE_COUNT = countAnatomySubstructures()

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
    <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-cyan-700 dark:text-cyan-300">Head-to-toe anatomy</div>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-950 dark:text-white">Region first, then exact named structure</h3>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">The readable index stays compact. Complex organs and joints open a second detail layer while the same source viewer remains mounted.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-medium text-neutral-500 dark:text-neutral-300">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{HEAD_TO_TOE_REGIONS.length} regions</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{HEAD_TO_TOE_STRUCTURES.length} structures</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">{SUBSTRUCTURE_COUNT} detail targets</span>
          </div>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search retina, optic chiasm, lumbar spine, mitral valve, appendix, ACL, tibial nerve…"
          className="mt-3 h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[10px] font-medium text-neutral-800 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white"
          aria-label="Search head-to-toe anatomy"
        />
      </header>

      <div className="grid lg:grid-cols-[205px_minmax(0,1fr)]">
        <aside className="border-b border-neutral-200 bg-neutral-50/60 p-2.5 dark:border-white/10 dark:bg-white/[.02] lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-1 text-[7px] font-medium uppercase tracking-[.13em] text-neutral-400"><span>Head</span><span>↓ Toe</span></div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {HEAD_TO_TOE_REGIONS.map((item, index) => {
              const active = item.id === region.id && !normalized
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setRegionId(item.id); setQuery('') }}
                  className={`min-w-[158px] rounded-xl border px-2.5 py-2 text-left lg:w-full ${active ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-300/35 dark:bg-cyan-300/10' : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[.025]'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[7px] font-semibold ${active ? 'bg-cyan-600 text-white' : 'bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{index + 1}</span>
                    <span className="text-[9px] font-semibold text-neutral-900 dark:text-white">{item.label}</span>
                  </div>
                  <div className="mt-1 pl-7 text-[7px] leading-relaxed text-neutral-400">{item.span}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="p-3">
          <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[7px] font-medium uppercase tracking-[.12em] text-neutral-400">{normalized ? 'Whole-body search' : region.span}</div>
              <div className="mt-1 text-[12px] font-semibold text-neutral-950 dark:text-white">{normalized ? `${matches.length} matches` : `${region.label} · ${region.structures.length} structures`}</div>
            </div>
            {normalized && <button type="button" onClick={() => setQuery('')} className="rounded-full border border-neutral-200 px-3 py-1.5 text-[8px] font-medium text-neutral-500 dark:border-white/10 dark:text-neutral-300">Back to {region.label}</button>}
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((structure) => {
              const selected = structure.id === selectedId
              const owner = findHeadToToeRegionForStructure(structure.id)
              return (
                <button
                  key={structure.id}
                  type="button"
                  onClick={() => choose(structure)}
                  className={`rounded-xl border p-2.5 text-left ${selected ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-300/35 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-semibold leading-snug text-neutral-950 dark:text-white">{structure.label}</span>
                    {selected && <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[6px] font-semibold text-white">FOCUS</span>}
                  </div>
                  <div className="mt-1 text-[7px] font-medium uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{structure.system}</div>
                  {normalized && owner && <div className="mt-1 text-[7px] text-neutral-400">{owner.label}</div>}
                  <p className="mt-1.5 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{structure.landmark}</p>
                </button>
              )
            })}
          </div>

          {!matches.length && <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-[9px] text-neutral-500 dark:border-white/10">No named anatomy matches this search.</div>}
        </div>
      </div>
    </section>
  )
}

export default HeadToToeAnatomyNavigator
