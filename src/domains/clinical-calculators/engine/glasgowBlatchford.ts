/**
 * Glasgow-Blatchford Score (Blatchford et al., Lancet 2000;356:1318-23), skor pra-endoskopi perdarahan saluran cerna atas.
 * Poin per ambang dipindahkan dari halaman tanpa perubahan (BUN dalam mg/dL; studi asli memakai urea mmol/L ≈ mg/dL ÷ 2,8).
 * Yang baru: tiap pengukuran diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu BUN 5000 atau
 * Hb 0,1 lolos gerbang `> 0` dan memberi skor tinggi; yang lebih berbahaya, skor 0 (ambang sebagian panduan untuk rawat jalan)
 * tidak boleh muncul dari data yang tidak sah. Rentang di bawah adalah batas kewajaran masukan, BUKAN ambang klinis.
 * Alat bantu; keputusan rawat inap/endoskopi tetap pada klinisi.
 */
import { inRange } from './inputs'

export const GBS_RANGES = {
  bun: { min: 1, max: 300, name: 'blood urea', unit: ' mg/dL' },
  hgb: { min: 2, max: 25, name: 'haemoglobin', unit: ' g/dL' },
  sbp: { min: 30, max: 300, name: 'systolic BP', unit: ' mmHg' },
} as const
type Field = keyof typeof GBS_RANGES

export const GBS_FLAG_POINTS = { hr: 1, melena: 1, syncope: 2, hepatic: 2, cardiac: 2 } as const
export type GbsFlag = keyof typeof GBS_FLAG_POINTS
export type GbsSex = 'M' | 'F'

export function bunPoints(v: number): number {
  if (v < 18.2) return 0
  if (v < 22.4) return 2
  if (v < 28) return 3
  if (v < 70) return 4
  return 6
}
export function hgbPoints(v: number, sex: GbsSex): number {
  if (sex === 'M') {
    if (v >= 13) return 0
    if (v >= 12) return 1
    if (v >= 10) return 3
    return 6
  }
  if (v >= 12) return 0
  if (v >= 10) return 1
  return 6
}
export function sbpPoints(v: number): number {
  if (v >= 110) return 0
  if (v >= 100) return 1
  if (v >= 90) return 2
  return 3
}

export type GbsInput = Readonly<{ bun: number; hgb: number; sbp: number; sex: unknown; flags: Readonly<Partial<Record<GbsFlag, boolean>>> }>
export type GbsResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  score: number | null
  /** Skor 0 hanya bila SEMUA pengukuran sah; null jika data belum lengkap. */
  veryLowRisk: boolean | null
  band: 'very-low' | 'low-moderate' | 'high' | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function glasgowBlatchford(input: GbsInput): GbsResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(GBS_RANGES) as Field[]) {
    const { min, max, name, unit } = GBS_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const sex = input.sex
  if (sex !== 'M' && sex !== 'F') invalid.push('sex must be M or F')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, score: null, veryLowRisk: null, band: null }
  const flagScore = (Object.keys(GBS_FLAG_POINTS) as GbsFlag[]).reduce((s, k) => s + (input.flags[k] === true ? GBS_FLAG_POINTS[k] : 0), 0)
  const score = bunPoints(ok.bun as number) + hgbPoints(ok.hgb as number, sex as GbsSex) + sbpPoints(ok.sbp as number) + flagScore
  return { missing, invalid, score, veryLowRisk: score === 0, band: score === 0 ? 'very-low' : score <= 5 ? 'low-moderate' : 'high' }
}
