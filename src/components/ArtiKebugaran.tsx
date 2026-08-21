import { useMemo, useState } from 'react'
import type { ImportedWorkout } from '../lib/workoutImport'
import { hariRiwayatLatihan } from '../lib/analisisPro'

// ─────────────────────────────────────────────────────────────────────────────
// Penjelasan angka Kebugaran / Kelelahan / Kesegaran.
//
// CACAT YANG MELAHIRKAN BERKAS INI. Pemakai bertanya: "kenapa saya selalu tidak
// segar, lelah, dan bugar selalu di angka 34?" Angka 34 itu BENAR — pada orang
// yang berlatih tetap, kebugaran memang mendatar, sebab ia rerata bergerak 42
// hari. Disimulasikan dengan rumus aplikasi sendiri: latihan dua hari sekali
// selama 90 hari menghasilkan tepat Fit 34, dan sesudah itu ia praktis berhenti
// bergerak (38 pada hari ke-200 maupun ke-400).
//
// Tetapi kartunya hanya menampilkan TIGA ANGKA TELANJANG tanpa satu kata pun.
// Angka yang tidak bergerak selama berminggu-minggu, tanpa keterangan, tidak
// terbaca sebagai "latihan Anda stabil" melainkan sebagai "aplikasinya macet".
// Pemakai lalu berhenti mempercayainya — dan itu kerugian yang jauh lebih besar
// daripada salah hitung, sebab tidak ada yang bisa diperbaiki dengan menambal
// rumus.
//
// MENGAPA JAWABANNYA BUKAN "GANTI RUMUSNYA". Mendatarnya kebugaran bukan
// kekurangan model Banister, melainkan justru maknanya: beban kronis memang
// tidak boleh melompat. Yang kurang adalah kalimatnya, bukan matematikanya.
//
// Dilipat secara bawaan: yang sudah paham tidak perlu membacanya tiap hari.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 86_400_000

function hitung(workouts: ImportedWorkout[], sekarang: number) {
  let terakhir = -Infinity
  let pekan = 0
  let enamPekan = 0
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t) || t > sekarang) continue
    if (t > terakhir) terakhir = t
    const hari = (sekarang - t) / HARI
    if (hari <= 7) pekan++
    if (hari <= 42) enamPekan++
  }
  return {
    hariSejakTerakhir: Number.isFinite(terakhir) ? Math.floor((sekarang - terakhir) / HARI) : null,
    pekan,
    enamPekan,
    umurRiwayat: Math.round(hariRiwayatLatihan(workouts, sekarang)),
  }
}

export function ArtiKebugaran({
  workouts,
  sekarang,
  kebugaran,
  kelelahan,
  kesegaran,
  arti,
}: {
  workouts: ImportedWorkout[]
  sekarang: number
  kebugaran: number
  kelelahan: number
  kesegaran: number
  arti: string
}) {
  const [buka, setBuka] = useState(false)
  const d = useMemo(() => hitung(workouts, sekarang), [workouts, sekarang])

  return (
    <div className="mt-2">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex min-h-[40px] w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Apa arti angka ini?
        </span>
        <span aria-hidden className="text-[11px] font-black text-slate-400">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-2.5 pb-1 text-[11.5px] leading-snug text-slate-400">
          <p>
            <b className="text-slate-200">Kebugaran {Math.round(kebugaran)}</b> — rata-rata beban
            latihan Anda selama <b>42 hari</b> terakhir. Karena rentangnya sepanjang itu, ia memang
            BERGERAK SANGAT LAMBAT: satu sesi berat hanya menggesernya sekitar satu angka. Bila
            latihan Anda tetap, ia akan mendatar di satu angka dan bertahan di situ berminggu-minggu.
            Itu bukan tanda macet — itu justru artinya beban Anda stabil.
          </p>
          <p>
            <b className="text-slate-200">Kelelahan {Math.round(kelelahan)}</b> — beban{' '}
            <b>7 hari</b> terakhir. Naik cepat setelah sesi berat, dan surut dalam beberapa hari
            istirahat.
          </p>
          <p>
            <b className="text-slate-200">Kesegaran {Math.round(kesegaran)}</b> = kebugaran dikurangi
            kelelahan. Pada latihan yang rutin, angka ini WAJAR berada di sekitar nol atau sedikit
            minus — itu berarti beban dan pemulihan sepadan, bukan berarti Anda kelelahan. Ia baru
            menjadi positif besar setelah Anda benar-benar mengurangi latihan beberapa hari.
          </p>
          <p className="text-slate-300">{arti}</p>

          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Yang dipakai menghitung
            </div>
            <ul className="mt-1 space-y-0.5">
              <li>Sesi 7 hari terakhir: <b className="text-slate-200">{d.pekan}</b></li>
              <li>Sesi 42 hari terakhir: <b className="text-slate-200">{d.enamPekan}</b></li>
              <li>
                Latihan terakhir:{' '}
                <b className="text-slate-200">
                  {d.hariSejakTerakhir === null ? 'belum ada'
                    : d.hariSejakTerakhir === 0 ? 'hari ini'
                      : `${d.hariSejakTerakhir} hari lalu`}
                </b>
              </li>
              <li>Panjang riwayat: <b className="text-slate-200">{d.umurRiwayat} hari</b></li>
            </ul>
          </div>

          <p>
            <b className="text-slate-200">Yang akan menggerakkannya.</b> Kesegaran naik bila Anda
            beristirahat 3-5 hari — kelelahan surut lebih dahulu. Kebugaran hanya naik bila beban
            rata-rata Anda benar-benar bertambah dan ditahan berminggu-minggu; menambah satu sesi
            berat lalu kembali seperti semula tidak akan mengubahnya.
          </p>
        </div>
      )}
    </div>
  )
}

export default ArtiKebugaran
