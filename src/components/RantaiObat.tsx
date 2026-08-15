import { useState } from 'react'
import { obatDalam, type MekanismeObat } from '../lib/mekanismeObat'

// ─────────────────────────────────────────────────────────────────────────────
// Mekanisme obat sebagai RANTAI, bukan paragraf.
//
// MENGAPA BENTUKNYA BEGINI. Penjelasan yang sama dapat ditulis sebagai satu
// paragraf atau sebagai rantai langkah, dan keduanya TIDAK sama nilainya bagi
// orang yang sedang menghafal. Paragraf harus dibaca ulang dari awal setiap
// kali satu mata rantai terlupa; rantai dapat diulang dalam hati, diucapkan
// keras-keras, dan diperiksa sendiri satu per satu — dan itu penting bagi yang
// lebih mudah mengingat lewat suara daripada lewat tulisan.
//
// URUTAN TAMPILANNYA MENGIKUTI URUTAN KEBUTUHAN:
//   1. MENGATASI APA — kalimat pertama, karena inilah yang menentukan obat ini
//      dipakai atau tidak, dan inilah yang paling sering ditanya penguji.
//   2. RANTAI — dari molekul sampai efek yang terlihat.
//   3. INGAT — satu kalimat pengunci.
//   4. AWAS — satu bahaya yang paling mahal bila terlupa.
//   5. Paragraf lengkap hanya bila dibuka sendiri.
//
// Paragraf tidak dihapus, hanya dilipat: yang menghafal butuh rantai, yang
// ingin mengerti butuh kalimatnya, dan keduanya orang yang sama pada waktu
// yang berbeda.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Satu ruas rantai. Baris kosong pada data berarti PEMISAH — awal rantai baru
 * di dalam obat yang sama (misalnya jalur yang diinginkan dan jalur efek
 * samping pada NSAID), bukan langkah kosong.
 */
function Ruas({ teks, akhir }: { teks: string; akhir: boolean }) {
  const tebal = teks === teks.toUpperCase() && /[A-Z]/.test(teks)
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`rounded-lg px-1.5 py-0.5 text-[11px] leading-snug ${
          tebal
            ? 'bg-brand/15 font-black text-brand-dark dark:text-brand'
            : 'bg-neutral-100 font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200'
        }`}
      >
        {teks}
      </span>
      {!akhir && <span aria-hidden className="text-[11px] font-black text-neutral-400">→</span>}
    </span>
  )
}

function Rantai({ langkah }: { langkah: string[] }) {
  // Dipecah pada baris kosong: satu obat dapat punya lebih dari satu rantai.
  const bagian: string[][] = [[]]
  for (const l of langkah) {
    if (l === '') bagian.push([])
    else bagian[bagian.length - 1].push(l)
  }
  return (
    <div className="space-y-1.5">
      {bagian.filter((b) => b.length).map((b, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {b.map((teks, j) => <Ruas key={j} teks={teks} akhir={j === b.length - 1} />)}
        </div>
      ))}
    </div>
  )
}

function KartuObat({ o }: { o: MekanismeObat }) {
  const [buka, setBuka] = useState(false)
  return (
    <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[12px] font-black text-ink dark:text-white">{o.nama}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{o.golongan}</span>
      </div>

      {/* Mengatasi apa — didahulukan, karena inilah pertanyaan pengujinya. */}
      <p className="mt-1 text-[12px] font-semibold leading-relaxed text-brand-dark dark:text-brand">
        Mengatasi: <span className="font-medium text-neutral-700 dark:text-neutral-200">{o.mengatasi}</span>
      </p>

      {o.rantai && <div className="mt-2"><Rantai langkah={o.rantai} /></div>}

      {o.ingat && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          💡 {o.ingat}
        </p>
      )}
      {o.awas && (
        <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] leading-relaxed text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          ⚠️ {o.awas}
        </p>
      )}

      <button
        onClick={() => setBuka((v) => !v)}
        className="mt-1.5 flex h-10 items-center text-[11px] font-bold text-brand"
      >
        {buka ? 'Tutup penjelasan ▲' : 'Penjelasan lengkap ▼'}
      </button>
      {buka && (
        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{o.mekanisme}</p>
      )}
    </div>
  )
}

/**
 * Daftar obat yang disebut di dalam satu teks tatalaksana.
 *
 * Dilipat secara bawaan: yang membuka halaman ini umumnya sedang mencari dosis,
 * dan menampilkan sepuluh kartu mekanisme di atas dosisnya justru mengubur yang
 * dicari. Ia terbuka ketika memang ingin dipelajari.
 */
export function RantaiObat({ terapi }: { terapi: string }) {
  const [buka, setBuka] = useState(false)
  const obat = obatDalam(terapi)
  if (!obat.length) return null
  return (
    <div className="mt-2">
      <button
        onClick={() => setBuka((v) => !v)}
        className="flex h-10 items-center gap-1 text-[11px] font-black uppercase tracking-wide text-brand"
      >
        {buka ? '▲' : '▼'} Mengapa obat ini bekerja · {obat.length} obat
      </button>
      {buka && (
        <div className="mt-1 space-y-2">
          {obat.map((o) => <KartuObat key={o.nama} o={o} />)}
        </div>
      )}
    </div>
  )
}

export default RantaiObat
