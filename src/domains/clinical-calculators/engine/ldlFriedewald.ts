/**
 * LDL-C terhitung (Friedewald et al., Clin Chem 1972;18:499-502): LDL = TC − HDL − TG/5 (mg/dL), non-HDL = TC − HDL, pita
 * NCEP ATP III (<100, 100-129, 130-159, 160-189, ≥190). TG ≥ 400 mg/dL: rumus tidak berlaku, LDL tidak dihitung tetapi
 * non-HDL tetap sah (perilaku halaman lama dipertahankan). Rumus dan ambang dipindahkan tanpa perubahan.
 * Yang baru: tiap nilai diperiksa rentangnya; "belum diisi" dipisahkan dari "di luar rentang"; HDL ≥ TC ditolak (non-HDL
 * ≤ 0 tidak bermakna); LDL terhitung ≤ 0 (TG/5 ≥ TC − HDL) tidak diberi pita "Optimal" melainkan ditandai tidak sahih.
 * Rentang adalah batas kewajaran masukan, BUKAN ambang klinis. Alat bantu; keputusan terapi tetap pada klinisi.
 */
import { inRange } from './inputs'

export const LDL_RANGES = {
  totalChol: { min: 50, max: 1000, name: 'total cholesterol', unit: ' mg/dL' },
  hdl: { min: 5, max: 200, name: 'HDL', unit: ' mg/dL' },
  tg: { min: 10, max: 5000, name: 'triglycerides', unit: ' mg/dL' },
} as const
type Field = keyof typeof LDL_RANGES

export const FRIEDEWALD_TG_LIMIT = 400

export type LdlTone = 'brand' | 'low' | 'critical'
export type LdlBand = Readonly<{ label: string; tone: LdlTone }>

export function ldlBand(v: number): LdlBand {
  if (v < 100) return { label: 'Optimal (<100)', tone: 'brand' }
  if (v < 130) return { label: 'Near optimal (100-129)', tone: 'brand' }
  if (v < 160) return { label: 'Borderline high (130-159)', tone: 'low' }
  if (v < 190) return { label: 'High (160-189)', tone: 'critical' }
  return { label: 'Very high (≥190)', tone: 'critical' }
}

export type LdlInput = Readonly<{ totalChol: number; hdl: number; tg: number }>
export type LdlResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  complete: boolean
  nonHdl: number | null
  tgTooHigh: boolean | null
  /** null bila TG ≥ 400, atau hasil hitung ≤ 0 (tidak sahih). */
  ldl: number | null
  ldlImplausible: boolean
  band: LdlBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function ldlFriedewald(input: LdlInput): LdlResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(LDL_RANGES) as Field[]) {
    const { min, max, name, unit } = LDL_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length === 0 && invalid.length === 0 && (ok.hdl as number) >= (ok.totalChol as number)) invalid.push('HDL must be below total cholesterol')
  if (missing.length > 0 || invalid.length > 0) {
    return { missing, invalid, complete: false, nonHdl: null, tgTooHigh: null, ldl: null, ldlImplausible: false, band: null }
  }
  const { totalChol, hdl, tg } = ok as Record<Field, number>
  const tgTooHigh = tg >= FRIEDEWALD_TG_LIMIT
  const raw = totalChol - hdl - tg / 5
  const ldlImplausible = !tgTooHigh && raw <= 0
  const ldl = tgTooHigh || ldlImplausible ? null : raw
  return { missing, invalid, complete: true, nonHdl: totalChol - hdl, tgTooHigh, ldl, ldlImplausible, band: ldl === null ? null : ldlBand(ldl) }
}
