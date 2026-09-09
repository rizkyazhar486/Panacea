import { layerPrecisionForStructure } from '../../lib/anatomy/layerPrecision'
import type { StrukturTubuh } from '../../lib/bodySearch'

interface LayerPrecisionInspectorProps {
  structure: StrukturTubuh
  onReveal: (structure: StrukturTubuh) => void
}

export function LayerPrecisionInspector({ structure, onReveal }: LayerPrecisionInspectorProps) {
  const precision = layerPrecisionForStructure(structure)

  return (
    <section
      className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]"
      data-testid="layer-precision-inspector"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wide text-brand">Layer precision · source truth</div>
          <div className="mt-1 text-sm font-black text-ink dark:text-white">{precision.layer.label}</div>
          <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
            Exact source-mesh identity with normalized model-space metadata. This panel does not convert model coordinates into patient distance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onReveal(structure)}
          className="rounded-full border border-brand px-2.5 py-1 text-[10px] font-bold text-brand active:scale-95"
        >
          Reveal source layer
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Source GLB</div>
          <div className="mt-1 break-all text-[11px] font-black text-ink dark:text-white">{precision.layer.sourceFile}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Depth stage</div>
          <div className="mt-1 text-[11px] font-black text-ink dark:text-white">{precision.layer.depthStage} / 6</div>
          <div className="mt-0.5 text-[9px] leading-snug text-neutral-400">Categorical layer order, not a physical depth.</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Exact meshes</div>
          <div className="mt-1 text-[11px] font-black text-ink dark:text-white">{precision.exactMeshNames.length}</div>
          <div className="mt-0.5 text-[9px] leading-snug text-neutral-400">Left/right remain exact source names when paired.</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Triangles</div>
          <div className="mt-1 text-[11px] font-black text-ink dark:text-white">{precision.totalTriangles.toLocaleString()}</div>
          <div className="mt-0.5 text-[9px] leading-snug text-neutral-400">Summed from the indexed exact mesh set.</div>
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        {precision.members.map((member) => (
          <div
            key={`${precision.layer.layer}:${member.exactMeshName}`}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 dark:border-white/10 dark:bg-white/5"
          >
            <div className="break-all text-[10px] font-black text-ink dark:text-white">{member.exactMeshName}</div>
            <div className="mt-1 grid gap-x-3 gap-y-1 text-[9px] text-neutral-500 sm:grid-cols-2 lg:grid-cols-4">
              <span>Side: <strong className="font-bold text-neutral-700 dark:text-neutral-300">{member.laterality}</strong></span>
              <span>Height Y: <strong className="font-bold text-neutral-700 dark:text-neutral-300">{member.normalizedHeight.toFixed(4)}</strong></span>
              <span>Radial: <strong className="font-bold text-neutral-700 dark:text-neutral-300">{member.normalizedRadialDistance.toFixed(4)}</strong></span>
              <span>Triangles: <strong className="font-bold text-neutral-700 dark:text-neutral-300">{member.triangles.toLocaleString()}</strong></span>
            </div>
            <div className="mt-1 text-[9px] leading-snug text-neutral-400">
              Derived navigation region: {member.derivedRegion} · method: {member.regionMethod}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-300/50 bg-amber-50 px-2.5 py-2 text-[9px] leading-snug text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/[0.06] dark:text-amber-200">
          <strong>Physical scale: not calibrated.</strong> No centimetre, millimetre, or inch value is published because the shipped index has no verified patient-scale transform.
        </div>
        <div className="rounded-lg border border-blue-300/50 bg-blue-50 px-2.5 py-2 text-[9px] leading-snug text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/[0.06] dark:text-blue-200">
          <strong>Region boundary:</strong> the displayed region is a coordinate-derived navigation hint, not a curated anatomical-region assertion.
        </div>
      </div>
    </section>
  )
}

export default LayerPrecisionInspector
