/**
 * Klirens kreatinin Cockcroft–Gault (Cockcroft & Gault, Nephron 1976;16:31-41): CrCl = (140 − usia) × BB × (0,85 bila perempuan) / (72 × SCr).
 * BB ideal memakai rumus Devine (50 / 45,5 kg + 2,3 kg per inci di atas 60 inci). Rumus dan ambang pita dipindahkan dari halaman tanpa
 * perubahan. Yang baru: tiap masukan diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang" (dulu usia 500 atau BB 5000
 * lolos gerbang `> 0` dan menghasilkan klirens yang bisa menggeser dosis obat). Rentang = batas kewajaran masukan, BUKAN ambang klinis.
 * Tinggi badan hanya wajib bila dasar berat = ideal; bila diisi, dipakai untuk peringatan obesitas (BB aktual > 125% BBI).
 */
import { inRange } from './inputs'

export const CG_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  weightKg: { min: 20, max: 400, name: 'weight', unit: ' kg' },
  heightCm: { min: 100, max: 250, name: 'height', unit: ' cm' },
  scr: { min: 0.1, max: 20, name: 'serum creatinine', unit: ' mg/dL' },
} as const

export type CgSex = 'M' | 'F'
export type CgWeightBasis = 'actual' | 'ideal'
export type CgTone = 'brand' | 'low' | 'critical'
export type CgBand = Readonly<{ label: string; tone: CgTone }>

export function cgBand(crcl: number): CgBand {
  if (crcl >= 90) return { label: 'Normal', tone: 'brand' }
  if (crcl >= 60) return { label: 'Mildly reduced', tone: 'brand' }
  if (crcl >= 30) return { label: 'Moderately reduced — many drugs need dose adjustment', tone: 'low' }
  if (crcl >= 15) return { label: 'Severely reduced — significant dose adjustment needed', tone: 'critical' }
  return { label: 'Kidney failure — many drugs contraindicated or need major adjustment', tone: 'critical' }
}

/** Devine; masukan sudah divalidasi pemanggil. */
export function devineIbwKg(heightCm: number, sex: CgSex): number {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60)
  return (sex === 'M' ? 50 : 45.5) + 2.3 * inchesOver5ft
}

export type CgInput = Readonly<{ age: number; weightKg: number; heightCm: number; scr: number; sex: CgSex; weightBasis: CgWeightBasis }>
export type CgResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  crcl: number | null
  band: CgBand | null
  ibwKg: number | null
  usedWeightKg: number | null
  obese: boolean
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function cockcroftGault(input: CgInput): CgResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<keyof typeof CG_RANGES, number>> = {}
  const heightNeeded = input.weightBasis === 'ideal'
  for (const k of Object.keys(CG_RANGES) as (keyof typeof CG_RANGES)[]) {
    const { min, max, name, unit } = CG_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { if (k !== 'heightCm' || heightNeeded) missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (input.sex !== 'M' && input.sex !== 'F') invalid.push('sex must be M or F')
  if (input.weightBasis !== 'actual' && input.weightBasis !== 'ideal') invalid.push('weight basis must be actual or ideal')
  const ibwKg = ok.heightCm !== undefined && (input.sex === 'M' || input.sex === 'F') ? devineIbwKg(ok.heightCm, input.sex) : null
  const obese = ibwKg !== null && ok.weightKg !== undefined && ok.weightKg > ibwKg * 1.25
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, crcl: null, band: null, ibwKg, usedWeightKg: null, obese }
  const usedWeightKg = input.weightBasis === 'ideal' ? (ibwKg as number) : (ok.weightKg as number)
  const crcl = ((140 - (ok.age as number)) * usedWeightKg * (input.sex === 'F' ? 0.85 : 1)) / (72 * (ok.scr as number))
  return { missing, invalid, crcl, band: cgBand(crcl), ibwKg, usedWeightKg, obese }
}
