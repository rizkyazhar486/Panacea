/**
 * MELD-Na (Kamath 2001; Kim 2008; kebijakan OPTN/UNOS 2016): MELD = 3,78·ln(bilirubin) + 11,2·ln(INR) + 9,57·ln(kreatinin) + 6,43,
 * setiap nilai lab dilantai 1,0; kreatinin dibatasi [1,0; 4,0] dan dipatok 4,0 pada dialisis; MELD-Na hanya bila MELD > 11:
 * MELD + 1,32·(137 − Na) − 0,033·MELD·(137 − Na) dengan Na dibatasi [125, 137]; skor akhir dibatasi [6, 40]. Rumus, lantai, batas,
 * dan pita prioritas dipindahkan dari halaman tanpa perubahan. Yang baru: lantai rumus dulu mengubah kolom kosong menjadi 1,0
 * sehingga halaman kosong menghasilkan MELD 6 ("Low priority, ~2% mortality"); kini setiap nilai harus terisi dan masuk rentang
 * kewajaran masukan sebelum lantai diterapkan (bilirubin 0,1–60 mg/dL, INR 0,5–10, kreatinin 0,1–20 mg/dL kecuali dialisis, Na 100–180
 * mEq/L). Rentang bukan ambang klinis. Alat bantu; alokasi transplan memakai nilai lab terverifikasi menurut kebijakan UNOS.
 */
import { inRange } from './inputs'

export const MELD_RANGES = {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  inr: { min: 0.5, max: 10, name: 'INR', unit: '' },
  creatinine: { min: 0.1, max: 20, name: 'creatinine', unit: ' mg/dL' },
  sodium: { min: 100, max: 180, name: 'sodium', unit: ' mEq/L' },
} as const
type Field = keyof typeof MELD_RANGES

export type MeldTone = 'brand' | 'low' | 'critical'
export type MeldBand = Readonly<{ label: string; tone: MeldTone; mortality: string }>

export function meldBand(score: number): MeldBand {
  if (score >= 40) return { label: 'Extremely high priority', tone: 'critical', mortality: '~71% 3-month mortality' }
  if (score >= 30) return { label: 'Very high priority', tone: 'critical', mortality: '~53% 3-month mortality' }
  if (score >= 20) return { label: 'High priority', tone: 'critical', mortality: '~20% 3-month mortality' }
  if (score >= 10) return { label: 'Moderate priority', tone: 'low', mortality: '~6% 3-month mortality' }
  return { label: 'Low priority', tone: 'brand', mortality: '~2% 3-month mortality' }
}

export type MeldInput = Readonly<{ bilirubin: number; inr: number; creatinine: number; sodium: number; dialysis: boolean }>
export type MeldResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  meld: number | null
  meldNa: number | null
  band: MeldBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function meldNa(input: MeldInput): MeldResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  const dialysis = input.dialysis === true
  for (const k of Object.keys(MELD_RANGES) as Field[]) {
    if (k === 'creatinine' && dialysis) continue // dialisis: kreatinin dipatok 4,0, tidak diminta
    const { min, max, name, unit } = MELD_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, meld: null, meldNa: null, band: null }
  const bili = Math.max(ok.bilirubin as number, 1.0)
  const inrB = Math.max(ok.inr as number, 1.0)
  const creat = dialysis ? 4.0 : Math.min(Math.max(ok.creatinine as number, 1.0), 4.0)
  const na = Math.min(Math.max(ok.sodium as number, 125), 137)
  const meldRaw = 3.78 * Math.log(bili) + 11.2 * Math.log(inrB) + 9.57 * Math.log(creat) + 6.43
  const meld = Math.min(Math.max(meldRaw, 6), 40)
  const meldNaRaw = meld > 11 ? meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na) : meld
  const score = Math.min(Math.max(meldNaRaw, 6), 40)
  return { missing, invalid, meld, meldNa: score, band: meldBand(score) }
}
