/**
 * Tiga penapis risiko di halaman Risk Calculators: Framingham General CVD 10 tahun (D'Agostino, Circulation 2008; koefisien tetap di
 * lib/riskModels yang dipakai bersama simulator), FIB-4 (Sterling 2006: usia × AST / (trombosit × √ALT)), dan OST (Koh 2001:
 * 0,2 × (BB − usia), dipotong). Rumus, pita, dan catatan dipindahkan dari halaman tanpa perubahan. Yang baru: tiap masukan diperiksa
 * rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu halaman terbuka dengan usia 30 dan BB 70 kg yang berasal dari
 * profil bawaan, sehingga OST langsung menampilkan "Lower risk" untuk orang yang belum mengisi apa pun, dan nilai tak masuk akal
 * (kolesterol 1e9, AST 1e9) lolos gerbang `> 0`. Rentang = batas kewajaran masukan, BUKAN ambang klinis; populasi validasi tiap skor
 * (mis. Framingham 30–74 tahun) tetap catatan di halaman. Alat bantu diskusi dengan dokter, bukan keputusan klinis.
 */
import { cvdBand, framinghamCVD } from '../../../lib/riskModels'
import { inRange } from './inputs'

type Spec = Readonly<{ min: number; max: number; name: string; unit: string }>
export const RISK_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  weightKg: { min: 20, max: 400, name: 'weight', unit: ' kg' },
  totChol: { min: 50, max: 1000, name: 'total cholesterol', unit: ' mg/dL' },
  hdl: { min: 5, max: 200, name: 'HDL', unit: ' mg/dL' },
  sbp: { min: 50, max: 300, name: 'systolic BP', unit: ' mmHg' },
  ast: { min: 1, max: 5000, name: 'AST', unit: ' U/L' },
  alt: { min: 1, max: 5000, name: 'ALT', unit: ' U/L' },
  platelets: { min: 5, max: 2000, name: 'platelets', unit: ' ×10⁹/L' },
} as const satisfies Record<string, Spec>
type Field = keyof typeof RISK_RANGES

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

function check(input: Partial<Record<Field, number>>, fields: readonly Field[]): { missing: string[]; invalid: string[]; ok: Partial<Record<Field, number>> } {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of fields) {
    const { min, max, name, unit } = RISK_RANGES[k]
    const v = input[k]
    if (isEmpty(v) || v === undefined) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  return { missing, invalid, ok }
}

type Tone = 'brand' | 'low' | 'critical'

// ── Framingham CVD ──────────────────────────────────────────────────────────
export type CvdInput = Readonly<{ age: number; sex: 'M' | 'F'; totChol: number; hdl: number; sbp: number; treatedBP: boolean; smoker: boolean; diabetic: boolean }>
export type CvdResult = Readonly<{ missing: readonly string[]; invalid: readonly string[]; riskPct: number | null; band: Readonly<{ label: string; tone: Tone }> | null }>

export function cvdRisk(input: CvdInput): CvdResult {
  const { missing, invalid, ok } = check(input, ['age', 'totChol', 'hdl', 'sbp'])
  if (input.sex !== 'M' && input.sex !== 'F') invalid.push('sex must be M or F')
  for (const k of ['treatedBP', 'smoker', 'diabetic'] as const) if (typeof input[k] !== 'boolean') invalid.push(`${k} must be yes or no`)
  if (ok.hdl !== undefined && ok.totChol !== undefined && ok.hdl >= ok.totChol) invalid.push('HDL must be below total cholesterol')
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, riskPct: null, band: null }
  const riskPct = framinghamCVD({ age: ok.age as number, sex: input.sex, totChol: ok.totChol as number, hdl: ok.hdl as number, sbp: ok.sbp as number, treatedBP: input.treatedBP, smoker: input.smoker, diabetic: input.diabetic })
  return { missing, invalid, riskPct, band: riskPct === null ? null : cvdBand(riskPct) }
}

// ── FIB-4 ───────────────────────────────────────────────────────────────────
export type Fib4Band = Readonly<{ label: string; tone: Tone; note: string }>
export function fib4Band(v: number, age: number): Fib4Band {
  const hi = age >= 65 ? 2.0 : 1.3
  if (v < hi) return { label: 'Low', tone: 'brand', note: 'Advanced fibrosis unlikely — high negative predictive value.' }
  if (v <= 2.67) return { label: 'Indeterminate', tone: 'low', note: 'Consider further assessment (e.g. elastography / specialist).' }
  return { label: 'High', tone: 'critical', note: 'Advanced fibrosis more likely — warrants specialist evaluation.' }
}
export type Fib4Input = Readonly<{ age: number; ast: number; alt: number; platelets: number }>
export type Fib4Result = Readonly<{ missing: readonly string[]; invalid: readonly string[]; value: number | null; band: Fib4Band | null }>

export function fib4(input: Fib4Input): Fib4Result {
  const { missing, invalid, ok } = check(input, ['age', 'ast', 'platelets', 'alt'])
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, value: null, band: null }
  const value = +(((ok.age as number) * (ok.ast as number)) / ((ok.platelets as number) * Math.sqrt(ok.alt as number))).toFixed(2)
  return { missing, invalid, value, band: fib4Band(value, ok.age as number) }
}

// ── OST ─────────────────────────────────────────────────────────────────────
export function ostBand(v: number): Readonly<{ label: string; tone: Tone }> {
  if (v > -1) return { label: 'Lower risk', tone: 'brand' }
  if (v >= -4) return { label: 'Moderate risk', tone: 'low' }
  return { label: 'Higher risk', tone: 'critical' }
}
export type OstInput = Readonly<{ age: number; weightKg: number }>
export type OstResult = Readonly<{ missing: readonly string[]; invalid: readonly string[]; value: number | null; band: Readonly<{ label: string; tone: Tone }> | null }>

export function ostIndex(input: OstInput): OstResult {
  const { missing, invalid, ok } = check(input, ['weightKg', 'age'])
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, value: null, band: null }
  const value = Math.trunc(0.2 * ((ok.weightKg as number) - (ok.age as number)))
  return { missing, invalid, value, band: ostBand(value) }
}
