import { MultiscaleScaleRail } from './MultiscaleScaleRail'
import TissueLayerContinuumPanel from './TissueLayerContinuumPanel'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../lib/bodyPulmonaryMolecularVertical'

// Perjalanan satu tubuh dari gross anatomy sampai gen. TissueLayerContinuumPanel
// menjelaskan batas representasi di setiap kedalaman jaringan, lalu scale rail
// meneruskan satu contoh bersumber (pulmonary SFTPC) ke skala sel/protein/pathway/gene.
export function VertikalMolekulerPanel() {
  const periksa = validatePulmonarySftpcVertical()

  return (
    <div className="space-y-4">
      <TissueLayerContinuumPanel />

      <MultiscaleScaleRail bridge={PULMONARY_SFTPC_MOLECULAR_VERTICAL} />

      <section
        aria-labelledby="vertikal-ditahan"
        className="rounded-2xl border border-amber-500/25 bg-amber-500/[.06] p-3.5"
      >
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-amber-600 dark:text-amber-300">
          Withheld on purpose
        </div>
        <h3 id="vertikal-ditahan" className="mt-1 text-sm font-black text-ink dark:text-white">
          {PULMONARY_SFTPC_WITHHELD_GAPS.length} scales are deliberately empty
        </h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          A greyed-out scale above is not unfinished work. Each one below was refused for a
          recorded reason, because inventing a node would be worse than leaving the step missing.
        </p>
        <ul className="mt-2.5 space-y-2">
          {PULMONARY_SFTPC_WITHHELD_GAPS.map((gap) => (
            <li key={gap.scale} className="rounded-xl bg-white/60 p-3 dark:bg-white/[.05]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-black text-ink dark:text-white">{gap.label}</span>
                <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
                  {gap.scale}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{gap.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        The tissue continuum and pulmonary vertical are reference relationship maps, not patient findings.
        Gross 3D, histology, cellular and molecular representations stay separate unless exact source evidence
        connects them. The pulmonary bridge currently validates as{' '}
        <strong className="text-neutral-700 dark:text-neutral-200">
          {periksa.valid ? 'internally consistent' : 'not yet consistent'}
        </strong>{' '}
        and{' '}
        <strong className="text-neutral-700 dark:text-neutral-200">
          {periksa.publicationReady ? 'publication-ready' : 'not publication-ready'}
        </strong>
        {periksa.publicationReady ? '' : ' — qualified academic review is still outstanding'}. Nothing here is
        a diagnosis, treatment, injury-risk estimate, or claim about any person's tissue.
      </p>
    </div>
  )
}

export default VertikalMolekulerPanel
