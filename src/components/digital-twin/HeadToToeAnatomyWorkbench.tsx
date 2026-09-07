import { useMemo, useState } from 'react'
import { HEAD_TO_TOE_REGIONS, HEAD_TO_TOE_STRUCTURES, findHeadToToeRegionForStructure, type AnatomyStructure } from '../../lib/headToToeAnatomy'
import { HeadToToeAnatomyNavigator } from './HeadToToeAnatomyNavigator'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

type Props = {
  onOpenPhysiology?: () => void
}

export function HeadToToeAnatomyWorkbench({ onOpenPhysiology }: Props) {
  const initial = HEAD_TO_TOE_STRUCTURES.find((item) => item.id === 'frontal-lobe') ?? HEAD_TO_TOE_STRUCTURES[0]
  const [selected, setSelected] = useState<AnatomyStructure>(initial)
  const region = useMemo(() => findHeadToToeRegionForStructure(selected.id), [selected.id])

  return (
    <section className="space-y-4">
      <HeadToToeAnatomyNavigator selectedId={selected.id} onSelect={setSelected} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(250px,.55fr)]">
        <div className="space-y-3">
          <HraResolvedAnatomyViewer
            title={`${selected.label} · resolved source anatomy`}
            description={`${region?.label ?? 'Human body'} · ${selected.system}. Panacea requests the most specific source terms available and does not replace unresolved anatomy with a decorative mesh.`}
            terms={selected.terms}
            maxResults={12}
          />

          <details className="rounded-[20px] border border-neutral-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
            <summary className="cursor-pointer list-none text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">Source matches for {selected.label}</summary>
            <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-white/10">
              <HraContextBridge title={`${selected.label} · source structure matches`} terms={selected.terms} maxResults={12} />
            </div>
          </details>
        </div>

        <aside className="space-y-3">
          <section className="rounded-[20px] border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-cyan-700 dark:text-cyan-300">Anatomical focus</div>
            <h3 className="mt-1 text-[15px] font-semibold text-neutral-950 dark:text-white">{selected.label}</h3>
            <div className="mt-1 text-[8px] font-medium uppercase tracking-wide text-neutral-400">{region?.label} · {selected.system}</div>
            <p className="mt-2.5 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.landmark}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.terms.map((term) => (
                <span key={term} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[8px] font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{term}</span>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-300/20 dark:bg-emerald-300/[.05]">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-emerald-700 dark:text-emerald-300">Coverage foundation</div>
            <div className="mt-1 text-[12px] font-semibold text-emerald-950 dark:text-emerald-100">{HEAD_TO_TOE_REGIONS.length} regions · {HEAD_TO_TOE_STRUCTURES.length} named targets</div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-emerald-950/70 dark:text-emerald-100/65">This readable index sits above the deeper HRA and BodyParts3D source atlases. Anatomy remains the primary layer before physiology, pathology, histology or treatment content.</p>
          </section>

          {onOpenPhysiology && (
            <details className="rounded-[20px] border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
              <summary className="cursor-pointer list-none text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">Later · physiology bridge</summary>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">The existing physiology workspace is preserved but deliberately secondary while anatomy is being completed and polished.</p>
              <button type="button" onClick={onOpenPhysiology} className="mt-3 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-[9px] font-semibold text-white dark:bg-white dark:text-neutral-950">Open physiology for this anatomy →</button>
            </details>
          )}
        </aside>
      </div>
    </section>
  )
}

export default HeadToToeAnatomyWorkbench
