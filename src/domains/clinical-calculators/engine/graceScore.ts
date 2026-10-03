/**
 * Skor GRACE mortalitas di rumah sakit (Granger et al. 2003): tabel poin usia, nadi, TD sistolik, kreatinin, kelas Killip,
 * henti jantung, deviasi ST, dan penanda jantung; pita risiko ≤108 / 109–140 / >140. Tabel dan pita dipindahkan dari halaman
 * tanpa perubahan. Yang baru: setiap pengukuran diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang";
 * dulu usia 500 diberi 100 poin dan TD 9999 diberi 0 poin (meremehkan risiko) karena gerbang lama hanya memeriksa `> 0`.
 * Skor, pita, dan kalimat mortalitas hanya ada bila keempat pengukuran sah. Alat bantu, bukan diagnosis; GRACE 2.0
 * memakai model kontinu daring.
 */
import { inRange } from './inputs'

export const GRACE_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years', integer: false },
  hr: { min: 20, max: 300, name: 'heart rate', unit: ' bpm', integer: false },
  sbp: { min: 40, max: 300, name: 'systolic BP', unit: ' mmHg', integer: false },
  creat: { min: 0.1, max: 25, name: 'creatinine', unit: ' mg/dL', integer: false },
} as const
type Field = keyof typeof GRACE_RANGES

export type GraceTone = 'brand' | 'low' | 'critical'
export type GraceBand = Readonly<{ label: string; tone: GraceTone; mortality: string }>
export type GraceInput = Readonly<{ age: number; hr: number; sbp: number; creat: number; killip: number; arrest: boolean; stDev: boolean; markers: boolean }>
export type GraceResult = Readonly<{ missing: readonly string[]; invalid: readonly string[]; score: number | null; band: GraceBand | null }>

export function agePts(v: number): number {
  if (v < 30) return 0
  if (v < 40) return 8
  if (v < 50) return 25
  if (v < 60) return 41
  if (v < 70) return 58
  if (v < 80) return 75
  if (v < 90) return 91
  return 100
}
export function hrPts(v: number): number {
  if (v < 50) return 0
  if (v < 70) return 3
  if (v < 90) return 9
  if (v < 110) return 15
  if (v < 150) return 24
  if (v < 200) return 38
  return 46
}
export function sbpPts(v: number): number {
  if (v < 80) return 58
  if (v < 100) return 53
  if (v < 120) return 43
  if (v < 140) return 34
  if (v < 160) return 24
  if (v < 200) return 10
  return 0
}
export function creatPts(v: number): number {
  if (v < 0.4) return 1
  if (v < 0.8) return 4
  if (v < 1.2) return 7
  if (v < 1.6) return 10
  if (v < 2.0) return 13
  if (v < 4.0) return 21
  return 28
}
export const KILLIP_PTS = [0, 20, 39, 59] as const // kelas I–IV
export const ARREST_PTS = 39
export const ST_DEVIATION_PTS = 28
export const MARKERS_PTS = 14

export function graceBand(score: number): GraceBand {
  if (score <= 108) return { label: 'Low risk', tone: 'brand', mortality: '<1% in-hospital mortality' }
  if (score <= 140) return { label: 'Intermediate risk', tone: 'low', mortality: '1-3% in-hospital mortality' }
  return { label: 'High risk', tone: 'critical', mortality: '>3% in-hospital mortality' }
}

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function graceScore(input: GraceInput): GraceResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(GRACE_RANGES) as Field[]) {
    const { min, max, name, unit } = GRACE_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const killipOk = Number.isInteger(input.killip) && input.killip >= 0 && input.killip <= 3
  if (!killipOk) invalid.push('Killip class must be 0–3')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, score: null, band: null }
  const score =
    agePts(ok.age as number) + hrPts(ok.hr as number) + sbpPts(ok.sbp as number) + creatPts(ok.creat as number) + KILLIP_PTS[input.killip] +
    (input.arrest === true ? ARREST_PTS : 0) + (input.stDev === true ? ST_DEVIATION_PTS : 0) + (input.markers === true ? MARKERS_PTS : 0)
  return { missing, invalid, score, band: graceBand(score) }
}
