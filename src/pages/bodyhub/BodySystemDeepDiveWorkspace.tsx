import { lazy, Suspense } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
const CardiacHemodynamicsWorkbench = lazy(() => import('./CardiacHemodynamicsWorkbench'))

const META: Partial<Record<BodySystemId,{label:string;description:string}>> = { cardiovascular: { label:'Heart & Cardiovascular', description:'Selected-system function deep dive: valve phases, loading conditions and normalized pressure–volume mechanics.' } }
export function BodySystemDeepDiveWorkspace({ selectedAtlasSystemId }: { selectedAtlasSystemId: BodySystemId }) {
  const meta=META[selectedAtlasSystemId]; if(!meta) return null
  return <section data-body-system-deep-dive={selectedAtlasSystemId} className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-black/45 p-2.5 sm:p-3" aria-labelledby="body-system-deep-dive-title"><div className="mb-2.5 flex items-end justify-between gap-3 px-1"><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-100/55">Organ-specific function</div><h3 id="body-system-deep-dive-title" className="mt-1 text-base font-black text-white/90">{meta.label}</h3><p className="mt-1 text-[10px] text-white/42">{meta.description}</p></div><span className="rounded-full border border-emerald-300/12 px-2.5 py-1 text-[8px] font-black uppercase text-emerald-100/60">selected-system only</span></div>{selectedAtlasSystemId==='cardiovascular'&&<Suspense fallback={<div className="grid min-h-52 place-items-center rounded-[24px] border border-white/[.07] bg-black/35 text-xs text-white/35">Loading cardiovascular function…</div>}><CardiacHemodynamicsWorkbench selectedAtlasSystemId={selectedAtlasSystemId}/></Suspense>}</section>
}
export default BodySystemDeepDiveWorkspace
