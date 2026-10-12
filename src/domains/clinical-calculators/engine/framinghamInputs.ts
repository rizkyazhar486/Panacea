/**
 * Masukan simulator "What-If" (Framingham General CVD, D'Agostino 2008). Dulu kolom kosong terbaca 0 lewat `Number(x) || 0` dan
 * halaman terbuka dengan kolesterol 200 / HDL 50 / TDS 140 / usia 45 karangan, sehingga angka risiko muncul untuk orang yang belum
 * mengisi apa pun. Kini setiap kolom wajib diketik dan diperiksa per kolom; tidak sah → alasan eksplisit tanpa nilai.
 * Usia dibatasi pada rentang turunan model terbitan (30–74), bukan di luarnya. Batas kolesterol/HDL/TDS = kewajaran masukan,
 * BUKAN ambang klinis; rumus risiko tetap di `framinghamCVD`.
 */
import { inRange } from './inputs'

export const FRAMINGHAM_RANGE = {
  age: { min: 30, max: 74, label: 'age', unit: 'years' },
  totChol: { min: 100, max: 500, label: 'total cholesterol', unit: 'mg/dL' },
  hdl: { min: 10, max: 150, label: 'HDL', unit: 'mg/dL' },
  sbp: { min: 70, max: 300, label: 'systolic BP', unit: 'mmHg' },
} as const

export type FraminghamField = keyof typeof FRAMINGHAM_RANGE
export type FraminghamValues = Record<FraminghamField, number>
export type FraminghamInputResult =
  | { ok: true; value: FraminghamValues }
  | { ok: false; problems: Partial<Record<FraminghamField, string>> }

/** NaN = kolom belum diisi (hasil `parseNumberField`). */
export function validateFraminghamInput(raw: Record<FraminghamField, number>): FraminghamInputResult {
  const problems: Partial<Record<FraminghamField, string>> = {}
  for (const f of Object.keys(FRAMINGHAM_RANGE) as FraminghamField[]) {
    const { min, max, label, unit } = FRAMINGHAM_RANGE[f]
    const x = raw[f]
    if (typeof x === 'number' && Number.isNaN(x)) problems[f] = `${label} is required`
    else if (!inRange(x, min, max)) problems[f] = `${label} must be ${min}–${max} ${unit}`
  }
  if (Object.keys(problems).length > 0) return { ok: false, problems }
  return { ok: true, value: { age: raw.age, totChol: raw.totChol, hdl: raw.hdl, sbp: raw.sbp } }
}
