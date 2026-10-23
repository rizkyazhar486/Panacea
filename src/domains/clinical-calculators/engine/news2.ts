/**
 * NEWS2 (Royal College of Physicians 2017), skala SpO₂ 1: tujuh parameter fisiologis dijumlah menjadi pemicu eskalasi. Tabel
 * poin per parameter, pita (≥7 risiko tinggi; ≥5 atau satu parameter bernilai 3 risiko sedang; ≥1 rendah-sedang; 0 rendah)
 * dan tindakan yang dianjurkan dipindahkan dari halaman tanpa perubahan; nilai batas tetap memakai perbandingan `<=` persis
 * seperti sebelumnya. Yang baru: tiap pengukuran diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang".
 * Dulu RR 5000 atau suhu 900 lolos gerbang `> 0` dan menghasilkan skor, dan tanpa pemeriksaan skor 0 dapat muncul dari data
 * tak sah. Rentang sengaja LONGGAR agar pembacaan kritis yang nyata tidak ditolak; mereka batas kewajaran masukan, BUKAN
 * ambang klinis. Alat bantu; selalu ikuti protokol eskalasi institusi. Skala SpO₂ 2 (gagal napas hiperkapnik) tidak diimplementasikan.
 */
import { inRange } from './inputs'

export const NEWS2_RANGES = {
  rr: { min: 1, max: 80, name: 'respiration rate', unit: ' /min' },
  spo2: { min: 30, max: 100, name: 'SpO₂', unit: ' %' },
  sbp: { min: 20, max: 300, name: 'systolic BP', unit: ' mmHg' },
  hr: { min: 10, max: 300, name: 'pulse', unit: ' bpm' },
  temp: { min: 20, max: 45, name: 'temperature', unit: ' °C' },
} as const
type Field = keyof typeof NEWS2_RANGES

export function rrPoints(v: number): number {
  if (v <= 8) return 3
  if (v <= 11) return 1
  if (v <= 20) return 0
  if (v <= 24) return 2
  return 3
}
export function spo2Points(v: number): number {
  if (v <= 91) return 3
  if (v <= 93) return 2
  if (v <= 95) return 1
  return 0
}
export function sbpPoints(v: number): number {
  if (v <= 90) return 3
  if (v <= 100) return 2
  if (v <= 110) return 1
  if (v <= 219) return 0
  return 3
}
export function hrPoints(v: number): number {
  if (v <= 40) return 3
  if (v <= 50) return 1
  if (v <= 90) return 0
  if (v <= 110) return 1
  if (v <= 130) return 2
  return 3
}
export function tempPoints(v: number): number {
  if (v <= 35.0) return 3
  if (v <= 36.0) return 1
  if (v <= 38.0) return 0
  if (v <= 39.0) return 1
  return 2
}

export type News2Tone = 'brand' | 'low' | 'critical'
export type News2Band = Readonly<{ label: string; tone: News2Tone; action: string }>

export function news2Band(total: number, anyThree: boolean): News2Band {
  if (total >= 7) return { label: 'High risk', tone: 'critical', action: 'Urgent/emergency clinical review — continuous monitoring, consider critical care referral.' }
  if (total >= 5 || anyThree) return { label: 'Medium risk', tone: 'low', action: 'Urgent review by a clinician skilled in acute illness, increased monitoring frequency.' }
  if (total >= 1) return { label: 'Low-medium risk', tone: 'brand', action: 'Ward nurse review, consider increasing monitoring frequency.' }
  return { label: 'Low risk', tone: 'brand', action: 'Routine monitoring per ward protocol.' }
}

export type News2Input = Readonly<{ rr: number; spo2: number; sbp: number; hr: number; temp: number; onOxygen: boolean; alert: boolean }>
export type News2Row = Readonly<{ name: string; pts: number }>
export type News2Result = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  rows: readonly News2Row[]
  total: number | null
  anyThree: boolean | null
  band: News2Band | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function news2(input: News2Input): News2Result {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(NEWS2_RANGES) as Field[]) {
    const { min, max, name, unit } = NEWS2_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, rows: [], total: null, anyThree: null, band: null }
  const rows: News2Row[] = [
    { name: 'Respiration rate', pts: rrPoints(ok.rr as number) },
    { name: 'SpO₂', pts: spo2Points(ok.spo2 as number) },
    { name: 'Air or oxygen', pts: input.onOxygen === true ? 2 : 0 },
    { name: 'Systolic BP', pts: sbpPoints(ok.sbp as number) },
    { name: 'Pulse', pts: hrPoints(ok.hr as number) },
    { name: 'Consciousness (AVPU)', pts: input.alert === true ? 0 : 3 },
    { name: 'Temperature', pts: tempPoints(ok.temp as number) },
  ]
  const total = rows.reduce((s, r) => s + r.pts, 0)
  const anyThree = rows.some((r) => r.pts === 3)
  return { missing, invalid, rows, total, anyThree, band: news2Band(total, anyThree) }
}
