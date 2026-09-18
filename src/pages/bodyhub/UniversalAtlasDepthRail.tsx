import type { BodySemanticScale } from '../../lib/bodySemanticZoom'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  UNIVERSAL_ATLAS_DEPTHS,
  universalDepthForSemanticScale,
  universalRequirementsForSystem,
} from '../../lib/anatomy/universalAtlasStandard'

interface UniversalAtlasDepthRailProps {
  semanticScale: BodySemanticScale
  selectedSystemId: BodySystemId
  onOpenScale: (scale: BodySemanticScale) => void
}

export default function UniversalAtlasDepthRail({
  semanticScale,
  selectedSystemId,
  onOpenScale,
}: UniversalAtlasDepthRailProps) {
  const activeDepth = universalDepthForSemanticScale(semanticScale)
  const requirements = universalRequirementsForSystem(selectedSystemId)

  return (
    <section
      data-universal-atlas-depth-rail="v1"
      className="border-b border-white/[.08] bg-white/[.012] px-2 py-2.5 sm:px-3"
      aria-label="Universal atlas depth"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.18em] text-white/38">
            Universal standard · every structure
          </div>
          <div className="mt-0.5 truncate text-[10px] font-bold text-white/58">
            Body → histology → cell → organelle → chemistry → genome
          </div>
        </div>

        <details className="relative shrink-0">
          <summary
            aria-label="About universal atlas depth"
            className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full border border-white/[.10] bg-white/[.025] text-[9px] font-black text-white/48"
          >
            i
          </summary>
          <div className="absolute right-0 top-10 z-40 w-[min(360px,82vw)] rounded-2xl border border-white/[.12] bg-[#080c10]/[.98] p-3 shadow-2xl">
            <p className="m-0 text-[9px] leading-relaxed text-white/58">
              No organ is the single gold standard: nails, sebaceous glands, areola, nephron, cornea, eyelid, auricle, vessel-wall layers, reproductive anatomy, cells, ATP/NAD+/NADH/glucose and deeper verified structures must meet the same source-backed quality contract.
            </p>
          </div>
        </details>
      </div>

      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {UNIVERSAL_ATLAS_DEPTHS.map((depth, index) => {
          const active = depth.id === activeDepth
          return (
            <button
              key={depth.id}
              type="button"
              onClick={() => onOpenScale(depth.semanticScale)}
              aria-pressed={active}
              title={depth.rule}
              className={
                'group relative min-h-[54px] min-w-[92px] shrink-0 overflow-hidden rounded-[16px] border px-2.5 text-left transition ' +
                (active
                  ? 'border-cyan-300/35 bg-cyan-300/[.10] text-white'
                  : 'border-white/[.07] bg-white/[.018] text-white/46 hover:bg-white/[.04] hover:text-white/72')
              }
            >
              <span className="absolute inset-x-2 bottom-2 flex h-3 items-end gap-[2px]" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, barIndex) => (
                  <i
                    key={barIndex}
                    className={
                      'w-[2px] rounded-full ' +
                      (active ? 'bg-cyan-200/75' : 'bg-white/20')
                    }
                    style={{ height: `${4 + ((barIndex + index) % 5) * 2}px` }}
                  />
                ))}
              </span>
              <span className="block text-[8px] font-black uppercase tracking-[.13em] opacity-45">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mt-0.5 block text-[10px] font-black">{depth.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-1 flex min-w-0 items-center gap-2 text-[8px] font-bold text-white/28">
        <span className="shrink-0">{requirements.length} depth targets</span>
        <span aria-hidden>·</span>
        <span className="truncate">{requirements.map((item) => item.label).join(' · ')}</span>
      </div>
    </section>
  )
}
