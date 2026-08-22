// Menarik bahan panel kebugaran dari data yang SUDAH tersimpan.
//
// Aturannya satu: tidak ada angka yang dikarang. Kalau datanya tidak ada,
// nilainya undefined dan panel memilih diam — bukan diisi angka bawaan.
// Tiap nilai membawa keterangan asalnya supaya bisa dibantah.

import { getVitals } from './healthVitals'
import { getWorkouts } from './workoutStore'

export interface BahanOtomatis {
  vo2?: number
  denyutIstirahat?: number
  denyutMaksTerukur?: number
  langkahHarian?: number
  menitZona?: number[]
  /** Asal tiap angka, untuk ditampilkan apa adanya. */
  asal: string[]
}

const HARI = 28

function angka(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : undefined
}

export function bahanOtomatis(): BahanOtomatis {
  const v = getVitals()
  const sesi = getWorkouts().filter((w) => Date.now() - Date.parse(w.mulai) < HARI * 864e5)
  const asal: string[] = []

  const vo2 = angka(v.vo2max)
  if (vo2) asal.push('VO₂max: data kesehatan tersimpan')

  const denyutIstirahat = angka(v.restingHr)
  if (denyutIstirahat) asal.push('Denyut istirahat: data kesehatan tersimpan')

  const langkahHarian = angka(v.steps)
  if (langkahHarian) asal.push('Langkah: data kesehatan tersimpan')

  // Denyut maksimum diambil dari yang BENAR-BENAR pernah terekam, bukan rumus.
  const maks = sesi.map((w) => angka(w.maxHr) ?? 0).reduce((a, b) => Math.max(a, b), 0)
  const denyutMaksTerukur = maks > 0 ? maks : undefined
  if (denyutMaksTerukur) asal.push(`Denyut maks: tertinggi dari ${sesi.length} sesi ${HARI} hari terakhir`)

  // Menit per zona dihitung dari deret denyut sesungguhnya. Batas zona memakai
  // %HRmaks — dan hanya bila HRmaks itu terukur, karena zona di atas HRmaks
  // tebakan hanyalah tebakan yang dibagi lima.
  let menitZona: number[] | undefined
  if (denyutMaksTerukur) {
    const z = [0, 0, 0, 0, 0]
    let titik = 0
    for (const w of sesi) {
      for (const p of w.hr) {
        const pct = p.bpm / denyutMaksTerukur
        const i = pct < 0.6 ? 0 : pct < 0.7 ? 1 : pct < 0.8 ? 2 : pct < 0.9 ? 3 : 4
        z[i] += 1
        titik += 1
      }
    }
    // Deret impor bercatat per menit; bila tidak ada titik sama sekali, diam.
    if (titik > 0) {
      menitZona = z
      asal.push(`Zona: ${titik} menit terekam dari ${sesi.length} sesi`)
    }
  }

  return { vo2, denyutIstirahat, denyutMaksTerukur, langkahHarian, menitZona, asal }
}
