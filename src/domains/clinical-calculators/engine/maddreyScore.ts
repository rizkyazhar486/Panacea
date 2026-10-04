/**
 * Fungsi diskriminan Maddrey (Maddrey et al. 1978): DF = 4,6 × (PT pasien − PT kontrol) + bilirubin total (mg/dL); DF ≥ 32
 * berarti hepatitis alkoholik berat. Rumus dan ambang dipindahkan dari halaman tanpa perubahan. Yang baru: setiap nilai
 * diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang" (dulu PT 5000 detik lolos gerbang `> 0` dan
 * menghasilkan DF raksasa "Severe", lengkap dengan paragraf pertimbangan kortikosteroid). DF, selisih PT, dan penilaian berat
 * hanya ada bila ketiga nilai sah. PT pasien lebih pendek dari kontrol tetap diterima (selisih negatif), seperti sebelumnya.
 * Alat bantu, bukan diagnosis; keputusan kortikosteroid tetap pada klinisi.
 */
import { inRange } from './inputs'

export const MADDREY_RANGES = {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  patientPt: { min: 5, max: 150, name: 'patient PT', unit: ' s' },
  controlPt: { min: 5, max: 60, name: 'control PT', unit: ' s' },
} as const
type Field = keyof typeof MADDREY_RANGES

export const DF_COEFFICIENT = 4.6
export const SEVERE_DF_THRESHOLD = 32

export type MaddreyInput = Readonly<{ bilirubin: number; patientPt: number; controlPt: number }>
export type MaddreyResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  df: number | null
  ptDiff: number | null
  severe: boolean | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function maddreyScore(input: MaddreyInput): MaddreyResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(MADDREY_RANGES) as Field[]) {
    const { min, max, name, unit } = MADDREY_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, df: null, ptDiff: null, severe: null }
  const ptDiff = (ok.patientPt as number) - (ok.controlPt as number)
  const df = DF_COEFFICIENT * ptDiff + (ok.bilirubin as number)
  return { missing, invalid, df, ptDiff, severe: df >= SEVERE_DF_THRESHOLD }
}
