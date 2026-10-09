/**
 * Fraksi ekskresi natrium (FeNa; Espinel, JAMA 1976;236:579-81): FeNa (%) = (UNa × PCr) / (PNa × UCr) × 100. Pembacaan: <1 prerenal
 * mungkin, 1–2 zona tak tentu, >2 cedera ginjal intrinsik (mis. ATN) mungkin. Rumus dan ambang dipindahkan dari halaman tanpa
 * perubahan. Pemakaian diuretik TIDAK memblokir hitungan (perilaku halaman lama: hanya peringatan; FeNa tidak andal sesudah diuretik).
 * Yang baru: tiap nilai lab diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu kolom kosong menjaga
 * penyebut 0 tetapi nilai tak masuk akal (UNa 1e9, PNa 1) lolos gerbang `> 0` dan menghasilkan diagnosis banding. Rentang adalah
 * batas kewajaran masukan, BUKAN ambang klinis. Alat bantu; interpretasi tetap bersama konteks klinis, urinalisis, dan pencitraan.
 */
import { inRange } from './inputs'

export const FENA_RANGES = {
  urineNa: { min: 0.1, max: 400, name: 'urine sodium', unit: ' mEq/L' },
  plasmaCr: { min: 0.1, max: 30, name: 'plasma creatinine', unit: ' mg/dL' },
  plasmaNa: { min: 90, max: 200, name: 'plasma sodium', unit: ' mEq/L' },
  urineCr: { min: 1, max: 1500, name: 'urine creatinine', unit: ' mg/dL' },
} as const
type Field = keyof typeof FENA_RANGES

export type FenaTone = 'brand' | 'low' | 'critical'
export type FenaBand = Readonly<{ label: string; tone: FenaTone }>

export function fenaBand(fena: number): FenaBand {
  if (fena < 1) return { label: 'Prerenal azotemia likely', tone: 'brand' }
  if (fena <= 2) return { label: 'Indeterminate zone', tone: 'low' }
  return { label: 'Intrinsic renal injury (e.g. ATN) likely', tone: 'critical' }
}

export type FenaInput = Readonly<{ urineNa: number; plasmaCr: number; plasmaNa: number; urineCr: number }>
export type FenaResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  fena: number | null
  band: FenaBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function fena(input: FenaInput): FenaResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(FENA_RANGES) as Field[]) {
    const { min, max, name, unit } = FENA_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, fena: null, band: null }
  const value = ((ok.urineNa as number) * (ok.plasmaCr as number)) / ((ok.plasmaNa as number) * (ok.urineCr as number)) * 100
  return { missing, invalid, fena: value, band: fenaBand(value) }
}
