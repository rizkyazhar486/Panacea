import { useMemo, useState } from 'react'
import { resolveBodySystemSourceWave, type BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY,
  getBodySystemPhysiologyBridge,
} from '../../lib/bodySystemPhysiologyBridge'
import {
  WHOLE_BODY_COUPLING_LOOPS,
  getWholeBodySystem,
} from '../../lib/wholeBodyPhysiologyOS'

const FIDELITY_LABEL = {
  direct: 'Direct systems link',
  compound: 'Compound systems link',
  contextual: 'Contextual link',
} as const

interface AtlasPhysiologyBridgePanelProps {
  selectedAtlasSystemId?: BodySystemId
  selectedSourceStructureName?: string | null
  onSystemChange?: (systemId: BodySystemId) => void
}

export default function AtlasPhysiologyBridgePanel({ selectedAtlasSystemId, selectedSourceStructureName, onSystemChange }: AtlasPhysiologyBridgePanelProps) {
  const [internalSystemId, setInternalSystemId] = useState<BodySystemId>('cardiovascular')
  const activeAtlasSystemId = selectedAtlasSystemId ?? internalSystemId
  const sourceSystems = useMemo(() => resolveBodySystemSourceWave(), [])
  const sourceSystem = sourceSystems.find((system) => system.id === activeAtlasSystemId) ?? sourceSystems[0]
  const bridge = getBodySystemPhysiologyBridge(sourceSystem.id)
  const selectedSourceTarget = selectedSourceStructureName
    ? sourceSystem.targets.find((target) => target.names.includes(selectedSourceStructureName))
    : undefined
  const visibleSourceTargets = selectedSourceTarget ? [selectedSourceTarget] : sourceSystem.targets
  const physiologySystems = bridge.physiologySystemIds.map((id) => getWholeBodySystem(id))
  const loops = useMemo(
    () => WHOLE_BODY_COUPLING_LOOPS.filter((loop) => loop.path.some((id) => bridge.physiologySystemIds.includes(id))),
    [bridge],
  )

  function selectSystem(systemId: BodySystemId) {
    if (selectedAtlasSystemId === undefined) setInternalSystemId(systemId)
    onSystemChange?.(systemId)
  }

  return (
    <section data-atlas-physiology-bridge="v1" data-selected-atlas-system={activeAtlasSystemId} data-selected-source-structure={selectedSourceStructureName ?? undefined} data-source-structure-match={selectedSourceStructureName ? (selectedSourceTarget ? 'exact' : 'unresolved') : 'none'} className="overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(135deg,rgba(34,211,238,.045),rgba(255,255,255,.018)_40%,rgba(168,85,247,.05))] p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-violet-200/80">Anatomy ↔ physiology bridge</div>
          <h3 className="mt-1.5 text-base font-black tracking-[-.02em] text-white sm:text-lg">Turn a source-backed body system into a systems-physiology pathway</h3>
          <p className="mt-1 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">Select one of the eleven source-atlas systems. Panacea preserves the anatomy label, then exposes the nearest whole-body physiology domains, their teaching equations and the coupling loops that connect them to the rest of the body.</p>
        </div>
        <span className="w-fit rounded-full border border-violet-300/15 bg-violet-300/[.055] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em] text-violet-100/70">11 atlas systems · explicit mapping fidelity</span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Atlas systems physiology bridge">
        {sourceSystems.map((system) => {
          const active = system.id === activeAtlasSystemId
          return (
            <button
              key={system.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectSystem(system.id)}
              className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition ${active ? 'border-violet-300/30 bg-violet-300/[.11] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}
            >
              {system.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-[20px] border border-white/[.08] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Source atlas</div>
              <div className="mt-1 text-sm font-black text-white">{sourceSystem.label}</div>
            </div>
            <span className="rounded-full border border-white/[.08] bg-white/[.03] px-2 py-1 text-[8px] font-black text-white/45">{sourceSystem.targets.length} source targets</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSourceTargets.map((target) => (
              <span key={target.id} className="rounded-full border border-white/[.07] bg-white/[.025] px-2 py-1 text-[8px] font-bold text-white/55">{target.label}</span>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-violet-300/12 bg-violet-300/[.04] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-violet-200/70">Mapping fidelity</div>
            <div className="mt-1 text-[10px] font-black text-white/75">{FIDELITY_LABEL[bridge.fidelity]}</div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-white/38">{bridge.rationale}</p>
          </div>
        </article>

        <div className="space-y-2.5">
          <div className="grid gap-2 md:grid-cols-2">
            {physiologySystems.map((system) => (
              <article key={system.id} className="rounded-[20px] border border-cyan-300/10 bg-cyan-300/[.035] p-3.5">
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Physiology domain</div>
                <h4 className="mt-1 text-sm font-black text-white">{system.shortLabel}</h4>
                <p className="mt-1 text-[9px] leading-relaxed text-white/42">{system.primaryRole}</p>
                <div className="mt-3 rounded-xl border border-white/[.07] bg-black/25 p-2.5">
                  <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">Teaching relationship</div>
                  <div className="mt-1 font-mono text-[11px] font-black text-white/80">{system.equation}</div>
                  <div className="mt-1 text-[8px] leading-relaxed text-white/30">{system.equationNote}</div>
                </div>
              </article>
            ))}
          </div>

          <article className="rounded-[20px] border border-white/[.08] bg-white/[.02] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-fuchsia-200/65">Whole-body coupling loops</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {loops.map((loop) => (
                <div key={loop.id} className="rounded-2xl border border-white/[.07] bg-black/20 p-2.5">
                  <div className="text-[9px] font-black text-white/70">{loop.label}</div>
                  <div className="mt-1 text-[8px] font-bold text-cyan-100/55">{loop.path.map((id) => getWholeBodySystem(id).shortLabel).join(' → ')}</div>
                  <p className="mt-1.5 text-[8px] leading-relaxed text-white/30">{loop.teachingPoint}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <p className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-2.5 text-[8px] leading-relaxed text-amber-50/45">{BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY}</p>
    </section>
  )
}
