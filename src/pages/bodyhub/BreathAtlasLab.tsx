import type { ComponentProps } from 'react'
import BreathAtlasCoreLab from './BreathAtlasCoreLab'
import BreathAtlasEvidencePanel from './BreathAtlasEvidencePanel'

type Props = ComponentProps<typeof BreathAtlasCoreLab>

/**
 * Canonical Breath Atlas surface: preserve the source-aware core unchanged and
 * append the claim-level Academic Accuracy Gate in the same user-facing mode.
 *
 * Keep the mandatory reference + scientific-boundary contract directly on this
 * canonical surface as well. The core owns the teaching interaction; this
 * wrapper owns the publication/trust boundary so refactors cannot silently
 * detach provenance from the route users actually open.
 */
export function BreathAtlasLab(props: Props) {
  return (
    <div className="space-y-4">
      <BreathAtlasCoreLab {...props} />
      <BreathAtlasEvidencePanel />

      <section
        aria-label="Breath Atlas mandatory references and scientific boundary"
        className="rounded-2xl border border-cyan-300/20 bg-neutral-950 p-3 text-[10px] leading-relaxed text-neutral-300"
      >
        <div className="font-black uppercase tracking-[0.16em] text-cyan-300">Canonical source contract</div>
        <p className="mt-1.5">
          This remains an independently implemented Panacea teaching layer and does not embed or copy third-party viewer code or assets.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 font-black">
          <a
            href="https://github.com/thebuggeddev/anatomy"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-neutral-200 hover:border-cyan-300/60 hover:text-cyan-200"
          >
            thebuggeddev/anatomy ↗
          </a>
          <a
            href="https://breath-atlas.thebuggeddev.chatgpt.site/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-cyan-200 hover:bg-cyan-300/15"
          >
            Breath Atlas reference ↗
          </a>
        </div>
        <p className="mt-2 text-neutral-400">
          <b className="text-neutral-200">Scientific boundary:</b> the source body mesh is not deformed to fake breathing; there is no patient-specific ventilation map. Microscopic alveolar geometry is disclosed as unavailable at this whole-body mesh scale. These references remain interaction/capability references only until their licensing and biomedical review requirements are satisfied.
        </p>
      </section>
    </div>
  )
}

export default BreathAtlasLab
