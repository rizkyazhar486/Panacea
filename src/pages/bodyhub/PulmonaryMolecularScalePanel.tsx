import type { MultiscaleNode } from '../../lib/bodyMultiscaleBridge'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../lib/bodyPulmonaryMolecularVertical'
import MultiscaleScaleRail from './MultiscaleScaleRail'

export type PulmonaryMolecularDestination = 'cell-lab' | 'molecular-lab' | 'genomics-lab'

interface Props {
  onOpenDestination?: (destination: PulmonaryMolecularDestination, node: MultiscaleNode) => void
}

function destinationAllowed(destination: MultiscaleNode['destination']): destination is PulmonaryMolecularDestination {
  return destination === 'cell-lab' || destination === 'molecular-lab' || destination === 'genomics-lab'
}

export function PulmonaryMolecularScalePanel({ onOpenDestination }: Props) {
  const validation = validatePulmonarySftpcVertical()

  return (
    <section className="space-y-3" aria-labelledby="pulmonary-molecular-title">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand">Pulmonary molecular vertical</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Academic review pending</span>
        </div>
        <h3 id="pulmonary-molecular-title" className="mt-2 text-lg font-black text-ink dark:text-white">Lung tissue → alveolar type II cell → SFTPC → surfactant pathway → SFTPC gene</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          This is a provenance-pinned reference chain. It is not patient expression, a diagnosis, a treatment claim, or proof that a molecular record occupies a gross-anatomy coordinate.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[9.5px] font-bold">
          <span className={`rounded-full border px-2 py-1 ${validation.valid ? 'border-brand/30 bg-brand/10 text-brand' : 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'}`}>
            Evidence graph: {validation.valid ? 'valid' : 'blocked'}
          </span>
          <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">
            Publication: {validation.publicationReady ? 'ready' : 'not ready'}
          </span>
        </div>
      </div>

      <MultiscaleScaleRail
        bridge={PULMONARY_SFTPC_MOLECULAR_VERTICAL}
        initialNodeId="pulmonary-sftpc-lung-tissue"
        onOpenDestination={(node) => {
          if (destinationAllowed(node.destination)) onOpenDestination?.(node.destination, node)
        }}
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">Withheld scales · fail closed</div>
        <p className="mt-1 text-[10px] leading-relaxed text-amber-900 dark:text-amber-100">
          Missing detail is shown as missing. Panacea does not generate a subcellular structure or molecule merely to make the scale ladder look complete.
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {PULMONARY_SFTPC_WITHHELD_GAPS.map((gap) => (
            <article key={gap.scale} className="rounded-xl border border-amber-200 bg-white/70 p-3 dark:border-amber-500/20 dark:bg-black/10">
              <div className="text-[9px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{gap.scale}</div>
              <div className="mt-0.5 text-xs font-black text-ink dark:text-white">{gap.label}</div>
              <p className="mt-1 text-[9.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{gap.reason}</p>
              {gap.evidence && (
                <div className="mt-2 rounded-lg bg-amber-100/70 p-2 text-[9px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                  <strong>{gap.evidence.sourceId}</strong> · {gap.evidence.sourceVersion} · {gap.evidence.locator}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PulmonaryMolecularScalePanel
