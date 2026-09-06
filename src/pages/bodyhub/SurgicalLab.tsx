import { useState } from 'react'
import { URUTAN, WILAYAH, KEDALAMAN, type UrutanLapisan } from '../../lib/dissection'

// ─────────────────────────────────────────────────────────────────────────────
// LAPISAN BEDAH — apa yang ada tepat di bawah apa.
//
// Yang dihafal seseorang sebelum masuk kamar operasi bukan daftar organ,
// melainkan URUTAN: lapisan demi lapisan, dan di lapisan mana persisnya sebuah
// struktur bisa cedera. Karena itu halaman ini bukan galeri gambar melainkan
// penelusuran — satu lapisan pada satu waktu, dengan bahayanya disebut di
// tempat ia benar-benar berada.
//
// Kedalaman diseksi pada model tubuh ikut bergerak mengikuti langkahnya, jadi
// daftar lapisan ini dan tubuh tiga dimensi di atasnya menceritakan hal yang
// sama pada saat yang sama.
// ─────────────────────────────────────────────────────────────────────────────

export interface SurgicalLabProps {
  /** Menggerakkan kedalaman diseksi pada model tubuh. */
  onKedalaman?: (kedalaman: number) => void
  /** Menyorot struktur bernama pada model, bila namanya ada di sana. */
  onSorot?: (nama: string[]) => void
}

/**
 * Memetakan langkah ke kedalaman diseksi model.
 *
 * Pemetaannya kasar dan memang harus dikatakan begitu: model tubuh punya tujuh
 * lapisan sistem, sedangkan satu pendekatan bedah bisa punya sembilan lapisan
 * bernama di dalam dinding perut saja. Yang disamakan adalah PERJALANANNYA,
 * dari permukaan ke dalam — bukan satu lapisan model untuk satu lapisan bedah.
 */
export function kedalamanUntukLangkah(langkah: number, total: number): number {
  if (total <= 1) return 0
  const bagian = langkah / (total - 1)
  return Math.round(bagian * KEDALAMAN.visceral)
}

export function SurgicalLab({ onKedalaman, onSorot }: SurgicalLabProps) {
  const [kunci, setKunci] = useState<string | null>(null)
  const [langkah, setLangkah] = useState(0)
  const dipilih: UrutanLapisan | undefined = URUTAN.find((u) => u.kunci === kunci)
  const lapis = dipilih?.lapis[Math.min(langkah, dipilih.lapis.length - 1)]

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
      <p className="text-[11px] leading-snug text-neutral-500">
        Layer-by-layer approaches, in the order a scalpel meets them, with the structure that can be injured
        named at the layer where it actually lies. Stepping through moves the dissection depth on the model above.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {URUTAN.map((u) => (
          <button
            key={u.kunci}
            onClick={() => (kunci === u.kunci ? setKunci(null) : pilih(u))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
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
            <div className="text-sm font-black text-ink dark:text-ink">{dipilih.judul}</div>
            <div className="text-[11px] text-neutral-500">
              {WILAYAH.find((w) => w.kunci === dipilih.wilayah)?.label ?? dipilih.wilayah}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">
              <b>Landmark.</b> {dipilih.patokan}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => keLangkah(Math.max(0, langkah - 1))}
              disabled={langkah === 0}
              className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95"
            >
              ← Back
            </button>
            <div className="flex-1 text-center text-[11px] font-bold text-neutral-500">
              Layer {langkah + 1} of {dipilih.lapis.length}
            </div>
            <button
              onClick={() => keLangkah(Math.min(dipilih.lapis.length - 1, langkah + 1))}
              disabled={langkah === dipilih.lapis.length - 1}
              className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark disabled:opacity-40 active:scale-95"
            >
              Deeper →
            </button>
          </div>

          {/* Seluruh urutan tetap terlihat: yang diajarkan adalah letak lapisan
              ini DI ANTARA tetangganya, bukan lapisan itu sendirian. */}
          <ol className="space-y-1">
            {dipilih.lapis.map((l, i) => (
              <li key={l.nama}>
                <button
                  onClick={() => keLangkah(i)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold active:scale-[0.99] ${
                    i === langkah
                      ? 'bg-brand text-white'
                      : i < langkah
                        ? 'bg-neutral-100 text-neutral-400 line-through dark:bg-white/5'
                        : 'bg-neutral-100/60 text-neutral-600 dark:bg-white/5 dark:text-neutral-400'
                  }`}
                >
                  {i + 1}. {l.nama}
                </button>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Now at</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-ink">{lapis.nama}</div>
            <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{lapis.catatan}</p>
            {lapis.bahaya && lapis.bahaya.length > 0 && (
              <div className="mt-2 rounded-lg bg-rose-500/10 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  At risk in this layer
                </div>
                <ul className="mt-0.5 space-y-0.5">
                  {lapis.bahaya.map((b) => (
                    <li key={b} className="text-[11px] font-semibold leading-snug text-rose-700 dark:text-rose-300">● {b}</li>
                  ))}
                </ul>
                <button
                  onClick={() => onSorot?.(lapis.bahaya ?? [])}
                  className="mt-1.5 rounded-full border border-rose-300 px-2.5 py-1 text-[10px] font-bold text-rose-700 active:scale-95 dark:border-rose-500/40 dark:text-rose-300"
                >
                  Try to find these on the model
                </button>
                <p className="mt-1 text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80">
                  Only structures the whole-body model actually carries will light up — nerve branches this fine
                  are often not separate meshes in it, and nothing is invented to fill the gap.
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] leading-snug text-neutral-500">Source: {dipilih.sumber}</p>
        </>
      )}

      {!dipilih && (
        <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
          Pick an approach. These are teaching sequences from standard surgical anatomy texts — they are not
          operative instructions, and no page here makes anyone competent to perform a procedure.
        </p>
      )}
    </div>
  )
}

export default SurgicalLab
