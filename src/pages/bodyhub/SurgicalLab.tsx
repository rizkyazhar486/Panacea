import { useState } from 'react'
import { URUTAN, WILAYAH, KEDALAMAN, type UrutanLapisan } from '../../lib/dissection'
import { resolveSurgicalRisks, wholeBodyRiskNodes, type SurgicalRiskCoverage } from '../../lib/surgicalGeometry'

// ─────────────────────────────────────────────────────────────────────────────
// LAPISAN BEDAH — apa yang ada tepat di bawah apa.
//
// Yang dihafal seseorang sebelum masuk kamar operasi bukan daftar organ,
// melainkan URUTAN: lapisan demi lapisan, dan di lapisan mana sebuah struktur
// berisiko dijumpai. Halaman ini adalah atlas anatomi bedah untuk pendidikan,
// bukan instruksi melakukan prosedur.
//
// Kedalaman diseksi pada model tubuh ikut bergerak mengikuti langkahnya, tetapi
// pemetaan itu hanya korespondensi kasar antar LAPISAN SISTEM. Model whole-body
// tidak merekonstruksi bidang operasi, arah instrumen, atau variasi pasien.
// ─────────────────────────────────────────────────────────────────────────────

export interface SurgicalLabProps {
  /** Menggerakkan kedalaman diseksi pada model tubuh. */
  onKedalaman?: (kedalaman: number) => void
  /** Menyorot node whole-body yang namanya cocok persis dengan indeks geometri. */
  onSorot?: (nama: string[]) => void
}

/**
 * Memetakan langkah ke kedalaman diseksi model.
 *
 * Pemetaannya kasar dan memang harus dikatakan begitu: model tubuh punya tujuh
 * lapisan sistem, sedangkan satu pendekatan bedah bisa punya banyak bidang
 * jaringan bernama. Yang disamakan adalah perjalanan luar→dalam, bukan satu
 * layer renderer untuk satu bidang operasi.
 */
export function kedalamanUntukLangkah(langkah: number, total: number): number {
  if (total <= 1) return 0
  const bagian = langkah / (total - 1)
  return Math.round(bagian * KEDALAMAN.visceral)
}

const STATUS_LABEL: Record<SurgicalRiskCoverage['status'], string> = {
  'whole-body': 'Whole-body mesh',
  'specialty-atlas': 'Specialty atlas',
  'reference-only': 'Reference only',
}

function RiskRow({ risk }: { risk: SurgicalRiskCoverage }) {
  const cls = risk.status === 'whole-body'
    ? 'border-brand/30 bg-brand/10 text-brand'
    : risk.status === 'specialty-atlas'
      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
  return (
    <li className="rounded-lg border border-rose-200/60 bg-white/60 p-2 dark:border-rose-500/20 dark:bg-black/10">
      <div className="flex flex-wrap items-start justify-between gap-1.5">
        <span className="text-[11px] font-semibold leading-snug text-rose-700 dark:text-rose-300">{risk.label}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${cls}`}>{STATUS_LABEL[risk.status]}</span>
      </div>
      {risk.status === 'specialty-atlas' && (
        <p className="mt-1 text-[9px] leading-snug text-neutral-500">
          Exact-name reference: {[...new Set(risk.specialtyMatches.map((match) => match.moduleLabel))].join(' · ')}. Kept in its own validated reference frame; not overlaid by guessed transform.
        </p>
      )}
      {risk.status === 'reference-only' && (
        <p className="mt-1 text-[9px] leading-snug text-neutral-500">No exact geometry-name match in the current whole-body or specialty indexes.</p>
      )}
    </li>
  )
}

export function SurgicalLab({ onKedalaman, onSorot }: SurgicalLabProps) {
  const [kunci, setKunci] = useState<string | null>(null)
  const [langkah, setLangkah] = useState(0)
  const dipilih: UrutanLapisan | undefined = URUTAN.find((u) => u.kunci === kunci)
  const lapis = dipilih?.lapis[Math.min(langkah, dipilih.lapis.length - 1)]
  const risiko = resolveSurgicalRisks(lapis?.bahaya ?? [])
  const nodeWholeBody = wholeBodyRiskNodes(lapis?.bahaya ?? [])

  function pilih(u: UrutanLapisan) {
    setKunci(u.kunci)
    setLangkah(0)
    onKedalaman?.(0)
    onSorot?.([])
  }
  function keLangkah(n: number) {
    if (!dipilih) return
    setLangkah(n)
    onKedalaman?.(kedalamanUntukLangkah(n, dipilih.lapis.length))
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Educational surgical anatomy</div>
        <p className="mt-1 text-[11px] leading-snug text-amber-900/80 dark:text-amber-100/80">
          Layer sequences and structures-at-risk are orientation material. The shared 3D depth is an approximate system-layer correspondence, not a reconstruction of an operative plane, patient anatomy, instrument path, or permission to perform a procedure.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {URUTAN.map((u) => (
          <button
            key={u.kunci}
            type="button"
            onClick={() => (kunci === u.kunci ? setKunci(null) : pilih(u))}
            className={`min-h-11 rounded-full px-3 py-1.5 text-[11px] font-bold active:scale-95 ${
              kunci === u.kunci ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {u.judul.split(/[—(:]/)[0].trim()}
          </button>
        ))}
      </div>

      {dipilih && lapis && (
        <>
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="text-sm font-black text-ink dark:text-white">{dipilih.judul}</div>
            <div className="text-[11px] text-neutral-500">
              {WILAYAH.find((w) => w.kunci === dipilih.wilayah)?.label ?? dipilih.wilayah}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">
              <b>Anatomical landmark reference.</b> {dipilih.patokan}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => keLangkah(Math.max(0, langkah - 1))}
              disabled={langkah === 0}
              className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95"
            >
              ← Back
            </button>
            <div className="flex-1 text-center text-[11px] font-bold text-neutral-500">
              Layer {langkah + 1} of {dipilih.lapis.length}
            </div>
            <button
              type="button"
              onClick={() => keLangkah(Math.min(dipilih.lapis.length - 1, langkah + 1))}
              disabled={langkah === dipilih.lapis.length - 1}
              className="min-h-11 shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95"
            >
              Deeper →
            </button>
          </div>

          <ol className="space-y-1">
            {dipilih.lapis.map((l, i) => (
              <li key={`${l.nama}-${i}`}>
                <button
                  type="button"
                  onClick={() => keLangkah(i)}
                  aria-current={i === langkah ? 'step' : undefined}
                  className={`min-h-11 w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold active:scale-[0.99] ${
                    i === langkah
                      ? 'bg-brand text-white'
                      : i < langkah
                        ? 'bg-neutral-100 text-neutral-400 dark:bg-white/5'
                        : 'bg-neutral-100/60 text-neutral-600 dark:bg-white/5 dark:text-neutral-400'
                  }`}
                >
                  {i + 1}. {l.nama}
                </button>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Current anatomical layer</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">{lapis.nama}</div>
            <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{lapis.catatan}</p>
            {risiko.length > 0 && (
              <div className="mt-2 rounded-lg bg-rose-500/10 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">Structures at risk · geometry coverage</div>
                <ul className="mt-1 space-y-1">{risiko.map((risk) => <RiskRow key={risk.label} risk={risk} />)}</ul>
                {nodeWholeBody.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSorot?.(nodeWholeBody)}
                    className="mt-2 min-h-11 rounded-full border border-rose-300 px-3 py-1 text-[10px] font-bold text-rose-700 active:scale-95 dark:border-rose-500/40 dark:text-rose-300"
                  >
                    Highlight {nodeWholeBody.length} verified whole-body mesh{nodeWholeBody.length === 1 ? '' : 'es'} →
                  </button>
                )}
                <p className="mt-1 text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80">
                  Highlighting is exact-name only. Specialty/reference-only structures are never substituted with a similar whole-body mesh.
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] leading-snug text-neutral-500">Reference: {dipilih.sumber}</p>
        </>
      )}

      {!dipilih && (
        <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
          Pick an approach to study its anatomical layer sequence. This is educational orientation material, not operative instruction or a substitute for supervised surgical training.
        </p>
      )}
    </div>
  )
}

export default SurgicalLab
