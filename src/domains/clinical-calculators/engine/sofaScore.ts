/**
 * Skor SOFA (Vincent et al. 1996): enam subskor organ 0–4, total 0–24, dan pita mortalitas populasi. Ambang subskor dan pita
 * dipindahkan dari halaman tanpa perubahan. Yang baru: setiap nilai diperiksa rentangnya; kolom kosong ("belum diisi") dan
 * nilai di luar rentang dipisahkan; subskor organ yang nilainya belum sah TIDAK dihitung (null), karena dulu nilai kosong terbaca
 * 0 dan rincian menampilkan poin palsu (mis. trombosit kosong = 4 poin), dan GCS 40 mendapat 0 poin lalu tersimpan sebagai titik
 * tren. Total dan pita hanya ada bila kelimanya sah. Kardiovaskular dan status ventilasi adalah jawaban yang selalu ada.
 * Alat bantu, bukan diagnosis; estimasi mortalitas tingkat populasi.
 */
import { inRange } from './inputs'

export const SOFA_RANGES = {
  pf: { min: 20, max: 800, name: 'PaO₂/FiO₂', unit: '', integer: false },
  plt: { min: 1, max: 2000, name: 'platelets', unit: ' ×10³/µL', integer: false },
  bili: { min: 0.1, max: 60, name: 'bilirubin', unit: ' mg/dL', integer: false },
  creat: { min: 0.1, max: 25, name: 'creatinine', unit: ' mg/dL', integer: false },
  gcs: { min: 3, max: 15, name: 'Glasgow Coma Scale', unit: '', integer: true },
} as const
type Field = keyof typeof SOFA_RANGES

export type CvLevel = 0 | 1 | 2 | 3 | 4
export type SofaTone = 'brand' | 'low' | 'critical'
export type SofaBand = Readonly<{ label: string; tone: SofaTone; mortality: string }>
export type SofaInput = Readonly<{ pf: number; plt: number; bili: number; creat: number; gcs: number; supported: boolean; cv: number }>
export type SofaResult = Readonly<{
  points: Readonly<{ resp: number | null; coag: number | null; liver: number | null; renal: number | null; cns: number | null; cv: number | null }>
  /** Nama kolom yang belum diisi (kosong/NaN). */
  missing: readonly string[]
  /** Pesan untuk nilai yang diisi tetapi di luar rentang (atau cv tak dikenal). */
  invalid: readonly string[]
  total: number | null
  band: SofaBand | null
}>

export function respPts(pf: number, supported: boolean): number {
  if (pf < 100 && supported) return 4
  if (pf < 200 && supported) return 3
  if (pf < 300) return 2
  if (pf < 400) return 1
  return 0
}
export function coagPts(plt: number): number {
  if (plt < 20) return 4
  if (plt < 50) return 3
  if (plt < 100) return 2
  if (plt < 150) return 1
  return 0
}
export function liverPts(bili: number): number {
  if (bili >= 12.0) return 4
  if (bili >= 6.0) return 3
  if (bili >= 2.0) return 2
  if (bili >= 1.2) return 1
  return 0
}
export function renalPts(creat: number): number {
  if (creat >= 5.0) return 4
  if (creat >= 3.5) return 3
  if (creat >= 2.0) return 2
  if (creat >= 1.2) return 1
  return 0
}
export function cnsPts(gcs: number): number {
  if (gcs < 6) return 4
  if (gcs < 10) return 3
  if (gcs < 13) return 2
  if (gcs < 15) return 1
  return 0
}
export function mortalityBand(score: number): SofaBand {
  if (score <= 1) return { label: 'Minimal dysfunction', tone: 'brand', mortality: '<10%' }
  if (score <= 5) return { label: 'Mild-moderate dysfunction', tone: 'low', mortality: '~10-20%' }
  if (score <= 9) return { label: 'Moderate-severe dysfunction', tone: 'critical', mortality: '~20-40%' }
  if (score <= 12) return { label: 'Severe dysfunction', tone: 'critical', mortality: '~50-60%' }
  return { label: 'Extreme dysfunction', tone: 'critical', mortality: '>80%' }
}

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function sofaScore(input: SofaInput): SofaResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(SOFA_RANGES) as Field[]) {
    const { min, max, name, unit, integer } = SOFA_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max) || (integer && !Number.isInteger(v))) { invalid.push(`${name} must be ${integer ? 'a whole number ' : ''}${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const cvOk = Number.isInteger(input.cv) && input.cv >= 0 && input.cv <= 4
  if (!cvOk) invalid.push('Cardiovascular level must be 0–4')
  const supported = input.supported === true
  const points = {
    resp: ok.pf !== undefined ? respPts(ok.pf, supported) : null,
    coag: ok.plt !== undefined ? coagPts(ok.plt) : null,
    liver: ok.bili !== undefined ? liverPts(ok.bili) : null,
    renal: ok.creat !== undefined ? renalPts(ok.creat) : null,
    cns: ok.gcs !== undefined ? cnsPts(ok.gcs) : null,
    cv: cvOk ? input.cv : null,
  }
  const parts = Object.values(points)
  const complete = parts.every((p) => p !== null)
  const total = complete ? (parts as number[]).reduce((s, p) => s + p, 0) : null
  return { points, missing, invalid, total, band: total !== null ? mortalityBand(total) : null }
}
