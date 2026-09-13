import { lazy, Suspense, useState } from 'react'
import { MultiscaleScaleRail } from './MultiscaleScaleRail'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../lib/bodyPulmonaryMolecularVertical'

const BodyToCellCinematic = lazy(() => import('../../components/digital-twin/BodyToCellCinematic'))

// Perjalanan satu tubuh dari jaringan sampai gen.
//
// Inti Body Exposure adalah orang bisa BERJALAN menembus skala: jaringan ->
// sel -> protein -> lintasan -> gen, tanpa kehilangan konteks tubuhnya. Rel
// skalanya sudah ada di repositori ini, lengkap, beserta satu vertikal
// bersumber (surfaktan paru SFTPC) yang membawa bukti dan status telaahnya
// sendiri -- dan TIDAK ADA satu berkas pun yang mengimpornya. Selesai
// dibangun, tidak bisa dibuka siapa pun.
//
// Yang ditambahkan di sini hanya jalan masuknya, ditambah satu hal yang tidak
// boleh hilang saat dipasang: skala yang SENGAJA DIKOSONGKAN. Rel itu
// menampilkan skala tanpa simpul sebagai tombol mati. Tombol mati tanpa
// keterangan terbaca sebagai "belum dikerjakan", padahal keduanya adalah
// keputusan yang tercatat alasannya. Alasan itu ditampilkan apa adanya.

export function VertikalMolekulerPanel() {
  const periksa = validatePulmonarySftpcVertical()
  const [cinematicOpen, setCinematicOpen] = useState(false)

  return (
    <div className="space-y-4">
      <MultiscaleScaleRail bridge={PULMONARY_SFTPC_MOLECULAR_VERTICAL} />

      <section className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#02060b] text-white">
        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-300">Structural scale transition</div>
            <h3 className="mt-1 text-sm font-black">Cell → nucleus → chromatin → DNA → sequencing</h3>
            <p className="mt-1 max-w-3xl text-[10.5px] leading-relaxed text-white/50">
              Open the existing Three.js cellular atlas only when you need the structural view. It is an educational reference scene, not literal continuity from this SFTPC tissue node and not patient microscopy or sequencing data.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={cinematicOpen}
            aria-controls="body-cell-dna-cinematic"
            onClick={() => setCinematicOpen((value) => !value)}
            className="min-h-11 shrink-0 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-300/15"
          >
            {cinematicOpen ? 'Close cellular 3D' : 'Open cellular 3D'}
          </button>
        </div>

        {cinematicOpen && (
          <div id="body-cell-dna-cinematic" role="region" aria-label="Cell to DNA cinematic 3D" className="border-t border-white/10 p-2 sm:p-3">
            <Suspense fallback={<div role="status" className="flex min-h-40 items-center justify-center text-xs font-bold text-white/45">Loading cellular 3D atlas…</div>}>
              <BodyToCellCinematic />
            </Suspense>
          </div>
        )}
      </section>

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
        This vertical is a reference relationship map for pulmonary surfactant protein C, not a
        localisation of a molecule inside rendered gross anatomy and not a patient-specific finding.
        Cross-scale links say that the evidence connects two scales; they do not say that a protein
        occupies a coordinate on the body model. The bridge currently validates as{' '}
        <strong className="text-neutral-700 dark:text-neutral-200">
          {periksa.valid ? 'internally consistent' : 'not yet consistent'}
        </strong>{' '}
        and{' '}
        <strong className="text-neutral-700 dark:text-neutral-200">
          {periksa.publicationReady ? 'publication-ready' : 'not publication-ready'}
        </strong>
        {periksa.publicationReady ? '' : ' — qualified academic review is still outstanding'}. Nothing
        here is a diagnosis, a treatment, or a claim about any person's lungs.
      </p>
    </div>
  )
}

export default VertikalMolekulerPanel
