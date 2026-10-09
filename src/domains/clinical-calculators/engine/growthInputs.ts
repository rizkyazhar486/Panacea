/**
 * Validasi masukan untuk tiga kalkulator pertumbuhan: WHO 0-60 bulan, WHO neonatus 0-30 hari, CDC 2-20 tahun.
 * Hanya penolakan masukan; tabel rujukan, interpolasi, klasifikasi z-score/persentil dan peringatan di halaman tidak diubah.
 * Rentang usia adalah batas yang sudah ditulis pada kolom halaman itu sendiri tetapi tidak ditegakkan; batas berat dan tinggi
 * adalah kewarasan masukan (bukan ambang klinis). Kolom kosong ditolak, bukan dibaca 0: halaman lama menampilkan BMI "Infinity"
 * untuk tinggi 0, "NaN SD" untuk berat lahir 0, dan z-score ekstrem untuk berat kosong.
 */
import { inRange, parseNumberField } from './inputs'

export const WHO_AGE_MONTHS = { min: 0, max: 60 } as const
export const WHO_WEIGHT_KG = { min: 0.5, max: 60 } as const
export const WHO_LENGTH_CM = { min: 30, max: 150 } as const
export const NEONATE_AGE_DAYS = { min: 0, max: 30 } as const
export const NEONATE_WEIGHT_G = { min: 200, max: 8000 } as const
export const CDC_AGE_YEARS = { min: 2, max: 20 } as const
export const CDC_WEIGHT_KG = { min: 5, max: 300 } as const
export const CDC_HEIGHT_CM = { min: 50, max: 250 } as const

export type GrowthInputsResult<T> = { ok: true; data: T } | { ok: false; reason: string }

type Range = { readonly min: number; readonly max: number }
function firstProblem(checks: ReadonlyArray<readonly [string, number, Range, string]>): string | null {
  for (const [name, value, range, unit] of checks) {
    if (!inRange(value, range.min, range.max)) return `${name} must be ${range.min}–${range.max} ${unit}`
  }
  return null
}

export function validateWhoGrowthInputs(ageMonths: number, weightKg: number, lengthCm: number): GrowthInputsResult<{ ageMonths: number; weightKg: number; lengthCm: number }> {
  const problem = firstProblem([['Age', ageMonths, WHO_AGE_MONTHS, 'months'], ['Weight', weightKg, WHO_WEIGHT_KG, 'kg'], ['Length/height', lengthCm, WHO_LENGTH_CM, 'cm']])
  return problem ? { ok: false, reason: problem } : { ok: true, data: { ageMonths, weightKg, lengthCm } }
}

export function validateNeonateInputs(birthWeightG: number, days: number, currentWeightG: number): GrowthInputsResult<{ birthWeightG: number; days: number; currentWeightG: number }> {
  const problem = firstProblem([['Birth weight', birthWeightG, NEONATE_WEIGHT_G, 'g'], ['Age', days, NEONATE_AGE_DAYS, 'days'], ['Current weight', currentWeightG, NEONATE_WEIGHT_G, 'g']])
  return problem ? { ok: false, reason: problem } : { ok: true, data: { birthWeightG, days, currentWeightG } }
}

export function validateCdcInputs(ageYears: number, weightKg: number, heightCm: number): GrowthInputsResult<{ ageYears: number; weightKg: number; heightCm: number }> {
  const problem = firstProblem([['Age', ageYears, CDC_AGE_YEARS, 'years'], ['Weight', weightKg, CDC_WEIGHT_KG, 'kg'], ['Height', heightCm, CDC_HEIGHT_CM, 'cm']])
  return problem ? { ok: false, reason: problem } : { ok: true, data: { ageYears, weightKg, heightCm } }
}

/**
 * Satu kunjungan pelacak pertumbuhan dari teks kolom. Usia kosong BUKAN 0 bulan (bayi baru lahir adalah pengukuran sah, bukan
 * "belum diisi"): dulu halaman membaca usia kosong sebagai 0 dan mencatat kunjungan lahir tanpa ada yang mengetik usia.
 */
export function parseWhoVisit(ageText: string, weightText: string, heightText: string): GrowthInputsResult<{ ageMo: number; weightKg: number; heightCm: number }> {
  const r = validateWhoGrowthInputs(parseNumberField(ageText), parseNumberField(weightText), parseNumberField(heightText))
  return r.ok ? { ok: true, data: { ageMo: r.data.ageMonths, weightKg: r.data.weightKg, heightCm: r.data.lengthCm } } : r
}
