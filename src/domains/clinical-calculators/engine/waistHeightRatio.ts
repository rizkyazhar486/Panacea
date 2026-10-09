/**
 * Rasio lingkar pinggang terhadap tinggi badan (WHtR). Rumus (pinggang ÷ tinggi) dan pita 0,5 / 0,6 dipindahkan dari halaman
 * Self-Assessment tanpa perubahan. Yang baru: tiap masukan diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar
 * rentang". Dulu tinggi kosong terbaca 0 → rasio Infinity → "High risk", pinggang kosong terbaca 0 → "0.00 Lower risk", dan
 * tinggi awal diambil dari profil bawaan (170 cm) sehingga halaman baru langsung menampilkan hasil untuk orang yang tak ada.
 * Rentang = batas kewajaran masukan (sama dengan atribut min/max kolom), BUKAN ambang klinis. Pita adalah pedoman edukasi
 * populasi umum, bukan diagnosis; ambang belum ditinjau klinisi.
 */
import { inRange } from './inputs'

export const WHTR_RANGES = {
  waist: { min: 40, max: 200, name: 'waist circumference', unit: ' cm' },
  height: { min: 100, max: 230, name: 'height', unit: ' cm' },
} as const
type Field = keyof typeof WHTR_RANGES

/** Pita: <0,5 lebih rendah; 0,5–<0,6 meningkat; ≥0,6 tinggi. */
export const WHTR_BANDS = { increased: 0.5, high: 0.6 } as const

export type WhtrTone = 'brand' | 'low' | 'critical'
export type WhtrInput = Readonly<Record<Field, number>>
export type WhtrResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  ratio: number | null
  band: Readonly<{ label: string; tone: WhtrTone }> | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function waistHeightRatio(input: WhtrInput): WhtrResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(WHTR_RANGES) as Field[]) {
    const { min, max, name, unit } = WHTR_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, ratio: null, band: null }
  const ratio = ok.waist! / ok.height!
  const band = ratio < WHTR_BANDS.increased ? { label: 'Lower risk', tone: 'brand' as const }
    : ratio < WHTR_BANDS.high ? { label: 'Increased risk', tone: 'low' as const }
    : { label: 'High risk', tone: 'critical' as const }
  return { missing, invalid, ratio, band }
}
