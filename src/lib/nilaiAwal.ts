import { getVitals } from './healthVitals'
import { getDemo, getHealthCache } from './profile'

// ─────────────────────────────────────────────────────────────────────────────
// Nilai awal kalkulator.
//
// Auto-isi menyalurkan data perangkat ke tiga penyimpanan bersama, tetapi
// halaman kalkulator tetap membuka dengan angka bawaan yang ditulis di kode —
// berat 70 kg, VO₂max 41, denyut istirahat 60. Angka-angka itu milik orang
// lain. Kalau jam tangan Anda sudah tahu berat Anda 63,4 kg, kolomnya harus
// terbuka dengan 63,4.
//
// `awal()` dipakai sebagai nilai awal useState: dievaluasi sekali saat halaman
// dibuka, jadi setelah itu ketikan pengguna tidak pernah ditimpa.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Angka dari perangkat untuk `kunci`, atau `cadangan` bila belum ada.
 *
 * Urutannya: vitals (paling segar) → cache profil kesehatan → demografi.
 * Nilai nol, negatif dan non-angka diabaikan — metrik kosong yang terbaca "0"
 * akan membuat kalkulator membuka dengan berat 0 kg.
 */
export function awal(kunci: string, cadangan: number): number {
  const sumber: Record<string, unknown>[] = [
    getVitals() as unknown as Record<string, unknown>,
    getHealthCache(),
    getDemo() as unknown as Record<string, unknown>,
  ]
  for (const s of sumber) {
    const v = s?.[kunci]
    const n = typeof v === 'string' ? Number(v) : v
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n
  }
  return cadangan
}

/** Versi yang membulatkan — untuk kolom yang tidak menerima desimal (umur, denyut). */
export function awalBulat(kunci: string, cadangan: number): number {
  return Math.round(awal(kunci, cadangan))
}
