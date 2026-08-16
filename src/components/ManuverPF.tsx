import { useState } from 'react'
import { manuverDalam, type ManuverPF } from '../lib/manuverPF'
import { Rantai } from './Rantai'

// ─────────────────────────────────────────────────────────────────────────────
// Cara melakukan pemeriksaan fisik khusus, menempel pada catatan yang
// menyebutnya.
//
// MENGAPA MENEMPEL SENDIRI, BUKAN DITULIS ULANG DI TIAP CATATAN. Manuver yang
// sama muncul pada banyak penyakit — Tinel pada terowongan karpal maupun
// terowongan tarsal, Lasegue pada HNP maupun nyeri punggung lain. Menuliskan
// langkahnya di tiap catatan berarti belasan salinan yang pasti berselisih
// setelah beberapa kali disunting, dan pembacanya tidak punya cara tahu mana
// yang berlaku.
//
// DILIPAT SECARA BAWAAN. Yang sudah hafal caranya tidak perlu melihatnya
// setiap kali membuka catatan; yang belum, tinggal mengetuk. Bagian pemeriksaan
// fisik pada catatan penyakit sudah panjang, dan menambahkan tujuh langkah
// untuk tiap manuver tanpa dilipat akan menenggelamkan temuan yang justru
// dicari.
// ─────────────────────────────────────────────────────────────────────────────

function Kartu({ m }: { m: ManuverPF }) {
  const [buka, setBuka] = useState(false)
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-black text-ink dark:text-white">{m.nama}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            cara melakukan · {m.wilayah}
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-[11px] font-black text-brand">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-2 px-3 pb-3">
          <p className="text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300">
            <span className="font-bold text-brand-dark dark:text-brand">Menguji: </span>
            {m.untuk}
          </p>
          <Rantai langkah={m.langkah} />
          <p className="text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            <span className="font-bold">Disebut positif bila: </span>
            {m.positif}
          </p>
          {m.awas && (
            <p className="text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300">
              <span className="font-bold">⚠️ Awas: </span>
              {m.awas}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Kotak manuver untuk sekumpulan baris pemeriksaan fisik.
 *
 * Tidak dirender sama sekali bila tidak ada satu pun manuver yang dikenali —
 * judul di atas ruang kosong memberi kesan ada yang gagal dimuat.
 */
export function ManuverPFBox({ teks }: { teks: string }) {
  const daftar = manuverDalam(teks)
  if (!daftar.length) return null
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
        Cara melakukannya ({daftar.length})
      </p>
      {daftar.map((m) => <Kartu key={m.nama} m={m} />)}
    </div>
  )
}

export default ManuverPFBox
