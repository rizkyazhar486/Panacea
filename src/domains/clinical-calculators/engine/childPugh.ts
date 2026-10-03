/**
 * Skor Child-Pugh (Pugh et al. 1973): bilirubin, albumin, INR, asites, ensefalopati hepatik; 1–3 poin tiap kriteria,
 * total 5–15, kelas A ≤6 / B 7–9 / C ≥10. Tabel poin, kelas dan kalimat kesintasan dipindahkan dari halaman tanpa
 * perubahan. Yang baru: tiap nilai laboratorium diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang";
 * dulu bilirubin 500 mg/dL atau albumin 99 g/dL diberi poin dan kelas seolah sah karena gerbang lama hanya memeriksa `> 0`.
 * Rentang adalah batas kelayakan masukan (salah ketik/unit), bukan konstanta klinis. Asites dan ensefalopati harus
 * bilangan bulat 1–3. Skor dan kelas hanya ada bila ketiga nilai laboratorium sah. Alat bantu, bukan keputusan bedah/transplantasi.
 */
import { inRange } from './inputs'

export const CHILD_PUGH_RANGES = {
  bili: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  alb: { min: 0.5, max: 6, name: 'albumin', unit: ' g/dL' },
  inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
} as const
type Field = keyof typeof CHILD_PUGH_RANGES

export type ChildPughLevel = 1 | 2 | 3
export type ChildPughTone = 'brand' | 'low' | 'critical'
export type ChildPughClass = Readonly<{ label: string; tone: ChildPughTone; survival: string }>
export type ChildPughInput = Readonly<{ bili: number; alb: number; inr: number; ascites: number; enceph: number }>
export type ChildPughResult = Readonly<{ missing: readonly string[]; invalid: readonly string[]; points: number | null; cls: ChildPughClass | null }>

export function bilirubinPts(v: number): ChildPughLevel {
  if (v < 2) return 1
  if (v <= 3) return 2
  return 3
}
export function albuminPts(v: number): ChildPughLevel {
  if (v > 3.5) return 1
  if (v >= 2.8) return 2
  return 3
}
export function inrPts(v: number): ChildPughLevel {
  if (v < 1.7) return 1
  if (v <= 2.3) return 2
  return 3
}

export function childPughClass(score: number): ChildPughClass {
  if (score <= 6) return { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' }
  if (score <= 9) return { label: 'Class B', tone: 'low', survival: '~80% 1-year, ~60% 2-year survival' }
  return { label: 'Class C', tone: 'critical', survival: '~45% 1-year, ~35% 2-year survival' }
}

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)
const isLevel = (v: unknown): v is ChildPughLevel => v === 1 || v === 2 || v === 3

export function childPugh(input: ChildPughInput): ChildPughResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(CHILD_PUGH_RANGES) as Field[]) {
    const { min, max, name, unit } = CHILD_PUGH_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (!isLevel(input.ascites)) invalid.push('Ascites level must be 1–3')
  if (!isLevel(input.enceph)) invalid.push('Encephalopathy level must be 1–3')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, points: null, cls: null }
  const points = bilirubinPts(ok.bili as number) + albuminPts(ok.alb as number) + inrPts(ok.inr as number) + input.ascites + input.enceph
  return { missing, invalid, points, cls: childPughClass(points) }
}
