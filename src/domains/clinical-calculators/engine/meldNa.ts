/**
 * MELD-Na (Kamath 2001; Kim NEJM 2008;359:1018-26; OPTN/UNOS 2016). Rumus dan batas lantai/langit-langit dipindahkan
 * dari halaman tanpa perubahan. Yang baru: tiap hasil lab diperiksa rentangnya dan "belum diisi" (NaN) dipisahkan dari
 * "di luar rentang". Lantai 1,0 membuat kolom kosong terbaca MELD 6 ("prioritas rendah") dan nilai absurd (bilirubin 5000)
 * terjepit ke skor 40, jadi tidak ada skor yang boleh keluar dari data yang tidak sah. Rentang = batas kewajaran masukan,
 * BUKAN ambang klinis. Alat bantu; alokasi transplan memakai nilai lab terverifikasi menurut kebijakan UNOS.
 */
import { inRange } from './inputs'

export const MELD_RANGES = {
  bilirubin: { min: 0.1, max: 80, name: 'total bilirubin', unit: ' mg/dL' },
  inr: { min: 0.5, max: 20, name: 'INR', unit: '' },
  creatinine: { min: 0.1, max: 30, name: 'creatinine', unit: ' mg/dL' },
  sodium: { min: 90, max: 180, name: 'sodium', unit: ' mEq/L' },
} as const
type Field = keyof typeof MELD_RANGES

export type MeldInput = Readonly<{ bilirubin: number; inr: number; creatinine: number; sodium: number; dialysis: boolean }>
export type MeldResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  meld: number | null
  meldNa: number | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

export function meldNa(input: MeldInput): MeldResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(MELD_RANGES) as Field[]) {
    const { min, max, name, unit } = MELD_RANGES[k]
    // Kreatinin tidak dibutuhkan saat dialisis: rumus memaksanya 4,0.
    if (k === 'creatinine' && input.dialysis === true) continue
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, meld: null, meldNa: null }
  const bili = Math.max(ok.bilirubin as number, 1.0)
  const inrB = Math.max(ok.inr as number, 1.0)
  const creat = input.dialysis === true ? 4.0 : clamp(ok.creatinine as number, 1.0, 4.0)
  const na = clamp(ok.sodium as number, 125, 137)
  const meld = clamp(3.78 * Math.log(bili) + 11.2 * Math.log(inrB) + 9.57 * Math.log(creat) + 6.43, 6, 40)
  const raw = meld > 11 ? meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na) : meld
  return { missing, invalid, meld, meldNa: clamp(raw, 6, 40) }
}
