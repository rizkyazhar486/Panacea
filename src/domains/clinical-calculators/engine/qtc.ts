/**
 * QT terkoreksi (QTc) dengan empat rumus baku, dipindahkan dari halaman TANPA perubahan: Bazett (1920) QT/√RR, Fridericia
 * (1920) QT/∛RR, Framingham (Sagie 1992) QT + 154(1−RR), Hodges (1983) QT + 1,75(HR−60); RR = 60/HR detik. Pita memakai
 * Bazett: ≥500 ms risiko tinggi (kedua jenis kelamin); lalu menurut jenis kelamin, memanjang ≥450 (L)/≥470 (P), borderline
 * ≥430 (L)/≥450 (P). Yang baru: tiap masukan diperiksa rentangnya (QT 200–700 ms dan HR 30–200 bpm adalah atribut
 * min/max halaman lama yang tidak pernah ditegakkan) dan "belum diisi" dipisahkan dari "di luar rentang". Dulu QT 90000
 * atau HR 1 lolos gerbang `> 0` dan menghasilkan QTc dengan pita. Alat bantu; selalu korelasikan dengan rekaman EKG.
 */
import { inRange } from './inputs'

export const QTC_RANGES = {
  qtMs: { min: 200, max: 700, name: 'QT interval', unit: ' ms' },
  hr: { min: 30, max: 200, name: 'heart rate', unit: ' bpm' },
} as const
type Field = keyof typeof QTC_RANGES

export type QtcSex = 'M' | 'F'
export type QtcTone = 'brand' | 'low' | 'critical'
export type QtcBand = Readonly<{ label: string; tone: QtcTone }>

export function qtcBand(qtcMs: number, sex: QtcSex): QtcBand {
  if (qtcMs >= 500) return { label: 'High risk — markedly prolonged', tone: 'critical' }
  const prolongedCutoff = sex === 'M' ? 450 : 470
  const borderlineCutoff = sex === 'M' ? 430 : 450
  if (qtcMs >= prolongedCutoff) return { label: 'Prolonged', tone: 'critical' }
  if (qtcMs >= borderlineCutoff) return { label: 'Borderline', tone: 'low' }
  return { label: 'Normal', tone: 'brand' }
}

export type QtcResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  bazett: number | null
  fridericia: number | null
  framingham: number | null
  hodges: number | null
  band: QtcBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function qtc(input: Readonly<{ qtMs: number; hr: number; sex: unknown }>): QtcResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(QTC_RANGES) as Field[]) {
    const { min, max, name, unit } = QTC_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const sex = input.sex
  if (sex !== 'M' && sex !== 'F') invalid.push('sex must be M or F')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, bazett: null, fridericia: null, framingham: null, hodges: null, band: null }
  const qtMs = ok.qtMs as number
  const hr = ok.hr as number
  const rrSec = 60 / hr
  const qtSec = qtMs / 1000
  const bazett = qtSec / Math.sqrt(rrSec) * 1000
  return {
    missing,
    invalid,
    bazett,
    fridericia: qtSec / Math.cbrt(rrSec) * 1000,
    framingham: (qtSec + 0.154 * (1 - rrSec)) * 1000,
    hodges: qtMs + 1.75 * (hr - 60),
    band: qtcBand(bazett, sex as QtcSex),
  }
}
