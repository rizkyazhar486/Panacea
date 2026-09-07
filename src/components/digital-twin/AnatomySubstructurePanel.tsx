import { useMemo } from 'react'
import { getAnatomySubstructures, type AnatomySubstructure } from '../../lib/anatomySubstructures'

type Props = {
  parentId: string
  activeId?: string
  onSelect: (detail: AnatomySubstructure | null) => void
}

export function AnatomySubstructurePanel({ parentId, activeId, onSelect }: Props) {
  const details = getAnatomySubstructures(parentId)
  const groups = useMemo(() => {
    const map = new Map<string, AnatomySubstructure[]>()
    for (const item of details) {
      const bucket = map.get(item.group) ?? []
      bucket.push(item)
      map.set(item.group, bucket)
    }
    return [...map.entries()]
  }, [details])

  if (!details.length) return null

  return (
    <section className="rounded-[20px] border border-neutral-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[8px] font-medium uppercase tracking-[.13em] text-cyan-700 dark:text-cyan-300">Structure detail</div>
          <div className="mt-1 text-[12px] font-semibold text-neutral-950 dark:text-white">{details.length} named substructures</div>
          <p className="mt-1 max-w-3xl text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">Select a substructure to retarget the same source viewer. No additional 3D canvas is mounted.</p>
        </div>
        {activeId && (
          <button type="button" onClick={() => onSelect(null)} className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-[8px] font-medium text-neutral-500 dark:border-white/10 dark:text-neutral-300">Overview</button>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {groups.map(([group, items]) => (
          <div key={group}>
            <div className="mb-1.5 text-[7px] font-medium uppercase tracking-[.12em] text-neutral-400">{group}</div>
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`rounded-xl border p-2.5 text-left ${active ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-300/35 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}
                  >
                    <div className="text-[9px] font-semibold leading-snug text-neutral-950 dark:text-white">{item.label}</div>
                    <p className="mt-1 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.relation}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AnatomySubstructurePanel
