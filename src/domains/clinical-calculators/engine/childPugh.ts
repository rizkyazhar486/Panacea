/**
 * Skor Child-Pugh (Pugh et al. 1973): lima kriteria 1–3 poin (bilirubin, albumin, INR, asites, ensefalopati), total 5–15,
 * kelas A/B/C dan perkiraan kesintasan populasi. Ambang (termasuk campuran `<`/`<=`/`>`/`>=` pada batas) dan kelas
 * dipindahkan dari halaman tanpa perubahan. Yang baru: setiap nilai lab diperiksa rentangnya dan "belum diisi" dipisahkan dari
 * "di luar rentang" (dulu bilirubin 999 atau INR 99 lolos gerbang `> 0` dan menghasilkan kelas); asites/ensefalopati harus
 * bilangan bulat 1–3. Kelas dan total hanya ada bila ketiga nilai lab sah. Alat bantu, bukan diagnosis.
 */
import { inRange } from './inputs'

export const CP_RANGES = {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' },
  inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
} as const
type Field = keyof typeof CP_RANGES

export type CpLevel = 1 | 2 | 3
export type CpTone = 'brand' | 'low' | 'critical'
export type CpClass = Readonly<{ label: string; tone: CpTone; survival: string }>
export type CpInput = Readonly<{ bilirubin: number; albumin: number; inr: number; ascites: number; enceph: number }>
export type CpResult = Readonly<{ missing: readonly string[]; invalid: readonly string[]; pts: number | null; cls: CpClass | null }>

export function bilirubinPts(v: number): CpLevel {
  if (v < 2) return 1
  if (v <= 3) return 2
  return 3
}
export function albuminPts(v: number): CpLevel {
  if (v > 3.5) return 1
  if (v >= 2.8) return 2
  return 3
}
export function inrPts(v: number): CpLevel {
  if (v < 1.7) return 1
  if (v <= 2.3) return 2
  return 3
}
export function classify(score: number): CpClass {
  if (score <= 6) return { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' }
  if (score <= 9) return { label: 'Class B', tone: 'low', survival: '~80% 1-year, ~60% 2-year survival' }
  return { label: 'Class C', tone: 'critical', survival: '~45% 1-year, ~35% 2-year survival' }
}

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)
const isLevel = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 3

export function childPugh(input: CpInput): CpResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(CP_RANGES) as Field[]) {
    const { min, max, name, unit } = CP_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (!isLevel(input.ascites)) invalid.push('Ascites level must be 1–3')
  if (!isLevel(input.enceph)) invalid.push('Encephalopathy level must be 1–3')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, pts: null, cls: null }
  const pts = bilirubinPts(ok.bilirubin as number) + albuminPts(ok.albumin as number) + inrPts(ok.inr as number) + input.ascites + input.enceph
  return { missing, invalid, pts, cls: classify(pts) }
}
