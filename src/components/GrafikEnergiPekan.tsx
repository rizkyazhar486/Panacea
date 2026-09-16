// Dua grafik kecil untuk rencana yang selama ini hanya berupa angka.
//
// Aturan yang dipegang di sini: warna tidak pernah menjadi satu-satunya
// pembawa arti. Tiap potongan batang punya baris keterangannya sendiri
// dengan nama, gram dan kilokalori, sehingga grafiknya tetap terbaca
// tanpa membedakan warna sama sekali.

import { bagiEnergi, kalimatSelisih, puncakMenit, type BebanHari } from '../lib/energiMakro'
import type { HasilTdee } from '../lib/tdee'

// Urutan tetap, tidak pernah diputar: protein, karbohidrat, lemak.
const WARNA: Record<string, { batang: string; titik: string }> = {
  protein: { batang: 'bg-indigo-600', titik: 'bg-indigo-600' },
  karbo: { batang: 'bg-amber-500', titik: 'bg-amber-500' },
  lemak: { batang: 'bg-teal-600', titik: 'bg-teal-600' },
}

export function BatangEnergi({ gizi }: { gizi: HasilTdee }) {
  const b = bagiEnergi(gizi)
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-lg" role="img"
        aria-label={b.segmen.map((s) => `${s.label} ${s.gram} g, ${Math.round(s.kkal)} kcal`).join('; ')}>
        {b.segmen.map((s) => (
          <div
            key={s.kunci}
            className={`${WARNA[s.kunci].batang} flex items-center justify-center`}
            style={{ width: `${(s.pecahan * 100).toFixed(2)}%` }}
          >
            {s.pecahan > 0.14 && (
              <span className="px-1 text-[10px] font-black tabular-nums text-white">
                {Math.round(s.pecahan * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>

      <ul className="mt-2.5 space-y-1">
        {b.segmen.map((s) => (
          <li key={s.kunci} className="flex items-baseline gap-2 text-[11.5px]">
            <span className={`${WARNA[s.kunci].titik} mt-[3px] h-2 w-2 shrink-0 rounded-full`} aria-hidden="true" />
            <span className="font-bold text-ink dark:text-white">{s.label}</span>
            <span className="ml-auto tabular-nums text-neutral-600 dark:text-neutral-300">
              {s.gram.toLocaleString()} g · {Math.round(s.kkal).toLocaleString()} kcal
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        Protein is a range, not one number: {gizi.proteinLo.toLocaleString()}–{gizi.proteinHi.toLocaleString()} g
        ({Math.round(b.pitaProteinKkal.lo).toLocaleString()}–{Math.round(b.pitaProteinKkal.hi).toLocaleString()} kcal).
        The bar plots its midpoint.
      </p>
      <p className={`mt-1 text-[11.5px] leading-relaxed ${b.berjumlah ? 'text-neutral-500 dark:text-neutral-400' : 'font-bold text-amber-700 dark:text-amber-400'}`}>
        {kalimatSelisih(b)}
      </p>
    </div>
  )
}

export function BatangMenitPekan({ hari }: { hari: readonly BebanHari[] }) {
  const puncak = puncakMenit(hari)
  const jumlah = hari.reduce((n, h) => n + h.menit, 0)
  return (
    <div>
      <div className="flex items-end gap-1.5" role="img"
        aria-label={hari.map((h) => `${h.hari}: ${h.menit > 0 ? `${h.menit} minutes, ${h.judul}` : 'rest'}`).join('; ')}>
        {hari.map((h) => (
          <div key={h.indeks} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-black tabular-nums text-neutral-500 dark:text-neutral-400">
              {h.menit > 0 ? h.menit : ''}
            </span>
            <div className="flex h-24 w-full items-end">
              {h.menit > 0 ? (
                <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(6, (h.menit / puncak) * 100)}%` }} />
              ) : (
                /* Hari istirahat digambar sebagai garis, bukan batang nol yang
                   tidak terlihat — istirahat adalah bagian rencananya. */
                <div className="w-full rounded-t border-t-2 border-dashed border-neutral-300 dark:border-white/20" />
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {h.hari.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        About {jumlah.toLocaleString()} minutes across {hari.filter((h) => h.menit > 0).length} training days.
        Estimated from sets and rest intervals — not a duration prescribed for you.
      </p>
    </div>
  )
}
