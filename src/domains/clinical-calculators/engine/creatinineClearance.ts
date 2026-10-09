/**
 * Klirens kreatinin Cockcroft–Gault (Cockcroft & Gault 1976, Nephron 16:31–41), dipindahkan dari halaman TANPA perubahan
 * rumus: CrCl = (140 − usia) × berat × (0,85 bila perempuan) / (72 × SCr). Berat ideal memakai rumus halaman lama
 * (50/45,5 kg + 2,3 kg per inci di atas 5 kaki, Devine); pita dan ambang peringatan obesitas (>125% BBI) apa adanya.
 * Yang baru: setiap masukan diperiksa rentangnya, "belum diisi" dipisahkan dari "di luar rentang", dan tinggi badan hanya
 * wajib bila dasar berat = ideal. Rentang adalah batas kewarasan masukan (bukan ambang klinis); usia 18 dan SCr 0,1 dari
 * atribut min halaman lama. Dulu usia 500 atau SCr 0,0001 lolos gerbang `> 0` dan tercetak sebagai klirens dengan pita.
 * Alat bantu dosis; verifikasi dengan brosur obat dan apoteker.
 */
import { inRange } from './inputs'

export const CRCL_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  weightKg: { min: 20, max: 400, name: 'weight', unit: ' kg' },
  heightCm: { min: 100, max: 250, name: 'height', unit: ' cm' },
  scr: { min: 0.1, max: 20, name: 'serum creatinine', unit: ' mg/dL' },
} as const
type Field = keyof typeof CRCL_RANGES

export type CrclSex = 'M' | 'F'
export type CrclBasis = 'actual' | 'ideal'
export type CrclTone = 'brand' | 'low' | 'critical'
export type CrclBand = Readonly<{ label: string; tone: CrclTone }>

export const FEMALE_FACTOR = 0.85
/** Peringatan ketika berat aktual > 125% BBI (ambang halaman lama). */
export const OBESE_RATIO = 1.25

export function crclIdealBodyWeight(heightCm: number, sex: CrclSex): number {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60)
  return (sex === 'M' ? 50 : 45.5) + 2.3 * inchesOver5ft
}

export function crclBand(crcl: number): CrclBand {
  if (crcl >= 90) return { label: 'Normal', tone: 'brand' }
  if (crcl >= 60) return { label: 'Mildly reduced', tone: 'brand' }
  if (crcl >= 30) return { label: 'Moderately reduced — many drugs need dose adjustment', tone: 'low' }
  if (crcl >= 15) return { label: 'Severely reduced — significant dose adjustment needed', tone: 'critical' }
  return { label: 'Kidney failure — many drugs contraindicated or need major adjustment', tone: 'critical' }
}

export type CrclInput = Readonly<{ age: number; weightKg: number; heightCm: number; scr: number; sex: unknown; basis: unknown }>
export type CrclResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  crcl: number | null
  band: CrclBand | null
  /** BBI referensi bila tinggi sah; null bila tinggi kosong/di luar rentang. */
  ibwKg: number | null
  usedWeightKg: number | null
  obese: boolean
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function creatinineClearance(input: CrclInput): CrclResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  const basis = input.basis
  if (basis !== 'actual' && basis !== 'ideal') invalid.push('weight basis must be actual or ideal')
  const sex = input.sex
  if (sex !== 'M' && sex !== 'F') invalid.push('sex must be M or F')
  for (const k of Object.keys(CRCL_RANGES) as Field[]) {
    const { min, max, name, unit } = CRCL_RANGES[k]
    const v = input[k]
    // Tinggi opsional pada dasar "actual" (hanya untuk BBI referensi), tetapi bila diisi harus sah.
    if (isEmpty(v)) { if (k !== 'heightCm' || basis === 'ideal') missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const heightOk = ok.heightCm !== undefined && (sex === 'M' || sex === 'F')
  const ibwKg = heightOk ? crclIdealBodyWeight(ok.heightCm as number, sex as CrclSex) : null
  const usedWeightKg = basis === 'ideal' ? ibwKg : ok.weightKg ?? null
  const none = { missing, invalid, crcl: null, band: null, ibwKg, usedWeightKg: null, obese: false }
  if (missing.length > 0 || invalid.length > 0 || usedWeightKg === null) return none
  const crcl = ((140 - (ok.age as number)) * usedWeightKg * (sex === 'F' ? FEMALE_FACTOR : 1)) / (72 * (ok.scr as number))
  const obese = ibwKg !== null && ok.weightKg !== undefined && ok.weightKg > ibwKg * OBESE_RATIO
  return { missing, invalid, crcl, band: crclBand(crcl), ibwKg, usedWeightKg, obese }
}
