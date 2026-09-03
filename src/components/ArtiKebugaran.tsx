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
          What do these numbers mean?
        </span>
        <span aria-hidden className="text-[11px] font-black text-slate-400">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-2.5 pb-1 text-[11.5px] leading-snug text-slate-400">
          <p>
            <b className="text-slate-200">Fitness {Math.round(kebugaran)}</b> — your average training
            load over the last <b>42 days</b>. Because the window is that long, it genuinely
            MOVES VERY SLOWLY: one hard session shifts it by only about one point. If your
            training stays the same, it will flatten at one figure and sit there for weeks.
            That is not a sign of stalling — it means your load is stable.
          </p>
          <p>
            <b className="text-slate-200">Fatigue {Math.round(kelelahan)}</b> — your load over
            the last <b>7 days</b>. It rises quickly after a hard session, and fades within a few
            days of rest.
          </p>
          <p>
            <b className="text-slate-200">Freshness {Math.round(kesegaran)}</b> = fitness minus
            fatigue. During regular training, this figure NORMALLY sits around zero or slightly
            negative — that means load and recovery are matched, not that you are exhausted. It
            only turns strongly positive once you genuinely cut back training for several days.
          </p>
          <p className="text-slate-300">{arti}</p>

          <div className="rounded-xl bg-white/5 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              What goes into this calculation
            </div>
            <ul className="mt-1 space-y-0.5">
              <li>Sessions in the last 7 days: <b className="text-slate-200">{d.pekan}</b></li>
              <li>Sessions in the last 42 days: <b className="text-slate-200">{d.enamPekan}</b></li>
              <li>
                Last workout:{' '}
                <b className="text-slate-200">
                  {d.hariSejakTerakhir === null ? 'none yet'
                    : d.hariSejakTerakhir === 0 ? 'today'
                      : `${d.hariSejakTerakhir} d ago`}
                </b>
              </li>
              <li>History length: <b className="text-slate-200">{d.umurRiwayat} days</b></li>
            </ul>
          </div>

          <p>
            <b className="text-slate-200">What actually moves it.</b> Freshness rises if you
            rest for 3-5 days — fatigue fades first. Fitness only rises if your average load
            genuinely increases and is held for weeks; adding one hard session then returning
            to normal will not change it.
          </p>
        </div>
      )}
    </div>
  )
}

export default ArtiKebugaran
