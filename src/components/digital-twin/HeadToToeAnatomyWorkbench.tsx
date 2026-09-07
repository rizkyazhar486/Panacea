import { useMemo, useState } from 'react'
import { HEAD_TO_TOE_STRUCTURES, findHeadToToeRegionForStructure, type AnatomyStructure } from '../../lib/headToToeAnatomy'
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div className="space-y-4">
          <HraResolvedAnatomyViewer
            title={`${selected.label} · resolved source anatomy`}
            description={`${region?.label ?? 'Human body'} · ${selected.system}. Panacea requests the most specific HRA terms available for this named structure and keeps unresolved items as metadata.`}
            terms={selected.terms}
            maxResults={12}
          />
          <HraContextBridge title={`${selected.label} · source structure matches`} terms={selected.terms} maxResults={12} />
        </div>

        <aside className="space-y-3">
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Anatomical focus</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{selected.label}</h3>
            <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-neutral-400">{region?.label} · {selected.system}</div>
            <p className="mt-3 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.landmark}</p>
            <div className="mt-3">
              <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">HRA resolver terms</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.terms.map((term) => <span key={term} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[8px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{term}</span>)}
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/[.06]">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">End-to-end bridge</div>
            <p className="mt-2 text-[9px] leading-relaxed text-emerald-950/70 dark:text-emerald-100/65">Start with exact anatomy, then move to physiology, pathology, cellular evidence and sequence evidence. Source anatomy stays distinct from derived or educational models so a missing mesh is never silently replaced by a decorative organ.</p>
            {onOpenPhysiology && <button type="button" onClick={onOpenPhysiology} className="mt-3 w-full rounded-2xl bg-emerald-700 px-3 py-2.5 text-[9px] font-black text-white dark:bg-emerald-300 dark:text-emerald-950">Continue this structure into physiology →</button>}
          </section>
        </aside>
      </div>
    </section>
  )
}
