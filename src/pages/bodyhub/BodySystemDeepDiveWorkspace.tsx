import { lazy, Suspense } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'

const CardiacHemodynamicsWorkbench = lazy(() => import('./CardiacHemodynamicsWorkbench'))
const NeurovascularPerfusionWorkbench = lazy(() => import('./NeurovascularPerfusionWorkbench'))

interface BodySystemDeepDiveWorkspaceProps {
  selectedAtlasSystemId: BodySystemId
}

const DEEP_DIVE_META: Partial<Record<BodySystemId, { label: string; scale: string; description: string }>> = {
  cardiovascular: {
    label: 'Heart & Cardiovascular',
    scale: 'Function deep dive',
    description: 'Move from whole-body cardiovascular orientation into normalized pressure–volume mechanics, valve phases, loading conditions and directional hemodynamic relationships.',
  },
  nervous: {
    label: 'Brain & Neurovascular',
    scale: 'Function deep dive',
    description: 'Move from nervous-system orientation into cerebral perfusion, autoregulation, intracranial compliance and oxygen-delivery relationships without converting synthetic signals into patient measurements.',
  },
}

export function BodySystemDeepDiveWorkspace({ selectedAtlasSystemId }: BodySystemDeepDiveWorkspaceProps) {
  const meta = DEEP_DIVE_META[selectedAtlasSystemId]
  if (!meta) return null

  return (
    <section
      data-body-system-deep-dive={selectedAtlasSystemId}
      className="body-system-deep-dive relative overflow-hidden rounded-[28px] border border-white/[.08] bg-black/45 p-2.5 shadow-[0_20px_70px_rgba(0,0,0,.22)] sm:p-3"
      aria-labelledby="body-system-deep-dive-title"
    >
      <div className="mb-2.5 flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-100/55">{meta.scale}</div>
          <h3 id="body-system-deep-dive-title" className="mt-1 text-base font-black tracking-[-.02em] text-white/90">{meta.label}</h3>
          <p className="mt-1 text-[10px] font-medium leading-relaxed text-white/42">{meta.description}</p>
        </div>
        <span className="w-fit rounded-full border border-cyan-300/12 bg-cyan-300/[.035] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-cyan-100/60">
          selected-system only
        </span>
      </div>

      {selectedAtlasSystemId === 'cardiovascular' && (
        <Suspense fallback={<div className="grid min-h-52 place-items-center rounded-[24px] border border-white/[.07] bg-black/35 text-xs font-bold text-white/35">Loading cardiovascular function deep dive…</div>}>
          <CardiacHemodynamicsWorkbench selectedAtlasSystemId={selectedAtlasSystemId} />
        </Suspense>
      )}

      {selectedAtlasSystemId === 'nervous' && (
        <Suspense fallback={<div className="grid min-h-52 place-items-center rounded-[24px] border border-white/[.07] bg-black/35 text-xs font-bold text-white/35">Loading neurovascular function deep dive…</div>}>
          <NeurovascularPerfusionWorkbench selectedAtlasSystemId={selectedAtlasSystemId} />
        </Suspense>
      )}
    </section>
  )
}

export default BodySystemDeepDiveWorkspace
