import { MultiscaleScaleRail } from './MultiscaleScaleRail'
import { auditEmptyScales } from '../../lib/bodyMultiscaleBridge'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../lib/bodyPulmonaryMolecularVertical'

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
  // Kalimat "tiap skala kosong ada alasannya" hanya boleh tampil bila benar.
  const audit = auditEmptyScales(PULMONARY_SFTPC_MOLECULAR_VERTICAL, PULMONARY_SFTPC_WITHHELD_GAPS)
  const tanpaPenjelasan = audit.unexplained.join(', ')

  return (
    <div className="space-y-4">
      <MultiscaleScaleRail bridge={PULMONARY_SFTPC_MOLECULAR_VERTICAL} />

      <section
        aria-labelledby="vertikal-ditahan"
        className="rounded-2xl border border-amber-500/25 bg-amber-500/[.06] p-3.5"
      >
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-amber-600 dark:text-amber-300">
          Empty on purpose
        </div>
        <h3 id="vertikal-ditahan" className="mt-1 text-sm font-black text-ink dark:text-white">
          {PULMONARY_SFTPC_WITHHELD_GAPS.length} scales have no node
        </h3>
        {audit.ok ? (
          <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            A greyed-out scale above is never silently missing. Each one below is empty because the
            source policy refuses the available evidence, or because admissible, pinned evidence is
            not recorded yet. Neither case is filled with an invented node.
          </p>
        ) : (
          <p role="alert" className="mt-1 text-[11.5px] font-semibold leading-relaxed text-red-600 dark:text-red-300">
            {tanpaPenjelasan
              ? `No recorded reason for: ${tanpaPenjelasan}. This page does not claim every empty scale is explained.`
              : 'The list of empty scales is inconsistent with the nodes above. This page does not claim every empty scale is explained.'}
          </p>
        )}
        <ul className="mt-2.5 space-y-2">
          {PULMONARY_SFTPC_WITHHELD_GAPS.map((gap) => (
            <li key={gap.scale} className="rounded-xl bg-white/60 p-3 dark:bg-white/[.05]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-black text-ink dark:text-white">{gap.label}</span>
                <span className="flex flex-wrap items-center gap-1">
                  <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
                    {gap.scale}
                  </span>
                  <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-white/15 dark:text-neutral-400">
                    {gap.kind === 'not-yet-modeled' ? 'Not yet modeled' : 'Withheld by policy'}
                  </span>
                </span>
              </div>
              <details className="mt-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-[11px] font-bold text-brand">
                  Why is this empty?
                </summary>
                <p className="pb-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{gap.reason}</p>
              </details>
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
