/**
 * Dua masukan Movement Longevity Toolkit. (1) Zona 2: HRmaks Tanaka, Monahan & Seals (J Am Coll Cardiol 2001;37:153-6) = 208 − 0,7 × usia;
 * batas zona 2 = 60–70% HRmaks (ACSM, Garber 2011) — rumus dan pembulatan dipindahkan dari halaman tanpa perubahan. Dulu teks halaman
 * menyebut "60-70% of 220−age" padahal yang dihitung Tanaka, dan usia kosong terbaca 0 (rentang 125–146 bpm tampil untuk orang yang
 * belum mengisi usia; usia bawaan 30 dari getDemo()). (2) Kekuatan genggam: dulu terbuka dengan 30 kg bawaan yang bisa tersimpan
 * sebagai pengukuran di grafik tren; kini harus diketik dan dalam rentang. Rentang = batas kewajaran masukan, BUKAN ambang klinis;
 * estimasi kebugaran, bukan diagnosis atau resep latihan.
 */
import { inRange } from './inputs'

export const ZONE2_AGE_YEARS = { min: 10, max: 100 } as const
export const GRIP_KG = { min: 1, max: 100 } as const

export type Zone2Result =
  | { ok: true; hrMax: number; lower: number; upper: number }
  | { ok: false; reason: string }

export function zone2HeartRate(age: number): Zone2Result {
  if (typeof age === 'number' && Number.isNaN(age)) return { ok: false, reason: 'age is required' }
  if (!inRange(age, ZONE2_AGE_YEARS.min, ZONE2_AGE_YEARS.max)) return { ok: false, reason: `age must be ${ZONE2_AGE_YEARS.min}–${ZONE2_AGE_YEARS.max} years` }
  const hrMax = 208 - 0.7 * age
  return { ok: true, hrMax, lower: Math.round(hrMax * 0.6), upper: Math.round(hrMax * 0.7) }
}

export type GripResult = { ok: true; kg: number } | { ok: false; reason: string }

export function validateGripKg(kg: number): GripResult {
  if (typeof kg === 'number' && Number.isNaN(kg)) return { ok: false, reason: 'grip strength is required' }
  if (!inRange(kg, GRIP_KG.min, GRIP_KG.max)) return { ok: false, reason: `grip strength must be ${GRIP_KG.min}–${GRIP_KG.max} kg` }
  return { ok: true, kg }
}
