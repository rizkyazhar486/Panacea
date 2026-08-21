import { useState } from 'react'
import { catatanStasiun } from '../lib/osceStationNoteAliases'
import { Rantai } from './Rantai'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan sebuah kasus rekap, dilipat.
//
// CACAT YANG MELAHIRKAN BERKAS INI. Halaman Stasiun OSCE UKMPPD memuat seluruh
// 1.416 kasus dari sepuluh tahun rekap — inilah tempat orang benar-benar
// mencari sebuah kasus menjelang ujian. Tetapi halaman itu TIDAK PERNAH
// menautkan satu pun kasusnya ke catatan. Catatan stasiun hanya dapat dibuka
// lewat Case Bank, yang isinya daftar KURASI dan tidak memuat nama-nama rekap
// seperti 'Carpal Tunnel Synrome' atau 'DMT2'.
//
// Akibatnya ratusan catatan yang sudah ditulis lengkap tidak dapat dijangkau
// dari tempat orang mencarinya, dan skrip pemeriksa melaporkannya sebagai
// "belum ada catatannya" — angka yang membuat pekerjaan tampak belum selesai
// padahal yang kurang hanyalah JALANNYA.
//
// DILIPAT SECARA BAWAAN. Halaman ini menampilkan sampai 120 kasus sekaligus;
// membuka semuanya akan mengubahnya menjadi dinding teks sepanjang puluhan
// layar dan menghapus kegunaannya sebagai daftar.
//
// TIDAK DIRENDER SAMA SEKALI bila catatannya belum ada. Tombol yang membuka
// ruang kosong lebih buruk daripada tidak ada tombol: ia menjanjikan sesuatu
// yang tidak ada.
// ─────────────────────────────────────────────────────────────────────────────

export function CatatanStasiunKartu({ nama }: { nama: string }) {
  const [buka, setBuka] = useState(false)
  const n = catatanStasiun(nama)
  if (!n) return null

  const bagian: [string, string[] | undefined][] = [
    ['Anamnesis', n.anamnesis],
    ['Pemeriksaan fisik', n.pemeriksaanFisik],
    ['Penunjang', n.penunjang],
    ['Diagnosis banding', n.diagnosisBanding],
    ['Tatalaksana', n.tatalaksana],
  ]

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex min-h-[40px] items-center gap-1.5 text-[11px] font-black text-brand"
      >
        <span>📋 Catatan stasiun</span>
        <span aria-hidden>{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="mt-1 space-y-2 rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
          {n.definisi && (
            <p className="text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">{n.definisi}</p>
          )}
          {n.rantai && n.rantai.length > 0 && <Rantai langkah={n.rantai} />}
          {bagian.map(([judul, isi]) =>
            isi && isi.length ? (
              <div key={judul}>
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{judul}</div>
                <ul className="mt-0.5 space-y-0.5">
                  {isi.map((b, i) => (
                    <li key={i} className="text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
                      • {b}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {n.tips && (
            <p className="text-[11.5px] leading-snug text-brand-dark dark:text-brand">💡 {n.tips}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CatatanStasiunKartu
