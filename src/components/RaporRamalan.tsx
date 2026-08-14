import { useEffect, useState } from 'react'
import { bacaRapor, type Ramalan, type RaporRamalan as Rapor } from '../lib/ramalan'
import { AMBANG, jalankanRamalan, raporKesegaran, ramalanBesok, riwayatRamalan, type Konteks } from '../lib/ramalanKesegaran'
import type { ImportedWorkout } from '../lib/workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Rapor ramalan.
//
// Menampilkan apa yang diramalkan aplikasi ini dan apakah ramalannya benar —
// termasuk saat salah, dan termasuk saat datanya belum cukup untuk menilai
// apa pun.
//
// TIGA KEPUTUSAN YANG MEMBUATNYA JUJUR:
//
//   * KESALAHAN TERBESAR SELALU DITAMPILKAN. Rerata kesalahan menyembunyikan
//     kegagalan tunggal yang besar, dan justru kegagalan itulah yang paling
//     perlu diketahui sebelum seseorang mengubah latihannya berdasarkan angka.
//   * ARAH KECENDERUNGAN DITAMPILKAN, bukan hanya besarnya. Model yang selalu
//     meleset ke arah yang sama dapat diperbaiki; yang melesetnya acak tidak.
//   * DI BAWAH TUJUH RAMALAN, ANGKA KETEPATAN TIDAK DITAFSIRKAN SAMA SEKALI.
//     Menampilkan "100% tepat" dari dua ramalan adalah kebohongan yang
//     disusun dari angka yang benar.
// ─────────────────────────────────────────────────────────────────────────────

function Baris({ r }: { r: Ramalan }) {
  const galat = (r.sebenarnya as number) - r.ramalan
  const tepat = Math.abs(galat) < r.ambang
  return (
    <li className="flex items-baseline justify-between gap-2 border-t border-neutral-200 py-2 text-[12px] first:border-0 dark:border-white/10">
      <span className="shrink-0 tabular-nums text-neutral-500">{r.untuk.slice(5)}</span>
      <span className="flex-1 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
        diramal <span className="font-black text-ink dark:text-white">{r.ramalan}</span>
        {' · '}nyata <span className="font-black text-ink dark:text-white">{r.sebenarnya}</span>
      </span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black leading-none text-white ${
          tepat ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      >
        {galat > 0 ? '+' : ''}{Math.round(galat * 10) / 10}
      </span>
    </li>
  )
}

export function RaporRamalanKesegaran({ riwayat, k }: { riwayat: ImportedWorkout[]; k: Konteks }) {
  const [rapor, setRapor] = useState<Rapor | null>(null)
  const [besok, setBesok] = useState<Ramalan | null>(null)
  const [daftar, setDaftar] = useState<Ramalan[]>([])

  useEffect(() => {
    // Dijalankan sebagai efek, bukan saat render: menulis ke penyimpanan di
    // dalam render akan terjadi dua kali pada mode ketat React, dan aturan
    // "tidak dapat ditimpa" membuat panggilan kedua ditolak diam-diam — yang
    // benar, namun lebih baik tidak pernah terjadi.
    jalankanRamalan(riwayat, k)
    setRapor(raporKesegaran())
    setBesok(ramalanBesok())
    setDaftar(riwayatRamalan(8))
  }, [riwayat, k])

  return (
    <div className="kaca rounded-3xl p-4">
      <div className="flex items-center gap-1.5">
        <h3 className="text-[13px] font-black text-ink dark:text-white">Rapor ramalan</h3>
        <span className="rounded bg-violet-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
          Dapat salah
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        Aplikasi ini mencatat ramalannya sebelum kejadian, lalu memeriksanya sesudahnya. Ramalan yang sudah
        tercatat tidak dapat diubah.
      </p>

      {besok && (
        <div className="mt-3 rounded-2xl border-l-4 border-violet-400 bg-violet-50/60 p-3 dark:bg-violet-500/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Ramalan untuk besok
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-violet-900 dark:text-violet-200">
            Kesegaran besok diperkirakan <span className="font-black tabular-nums">{besok.ramalan}</span>, dengan
            asumsi tidak ada latihan. Akan diperiksa dengan sendirinya lusa.
          </p>
        </div>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">{bacaRapor(rapor)}</p>

      {daftar.length > 0 && (
        <>
          <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Delapan terakhir · meleset di bawah {AMBANG} dianggap tepat
          </div>
          <ul className="mt-1">
            {daftar.map((r) => (
              <Baris key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
        Ramalan ini memakai model yang sepenuhnya pasti, sehingga melesetnya berarti asumsi bebannya yang keliru,
        bukan modelnya. Sebaliknya, ramalan yang hampir selalu tepat bukan tanda model ini mengenal tubuh Anda —
        justru menegaskan bahwa angka kesegaran hanya mencerminkan jadwal latihan.
      </p>
    </div>
  )
}

export default RaporRamalanKesegaran
