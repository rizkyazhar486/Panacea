/**
 * Kalkulator cairan & elektrolit: rumatan Holliday-Segar, resusitasi (sepsis dewasa 30 mL/kg, syok anak PALS 20 mL/kg,
 * Parkland 4 × kg × %TBSA), natrium terkoreksi Katz, perkiraan kenaikan Na per liter (Adrogue-Madias disederhanakan),
 * dan perkiraan defisit kalium. Rumus dan konstanta dipindahkan dari halaman TANPA perubahan. Yang baru: setiap masukan
 * diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu berat 5000 kg, TBSA 900% atau glukosa
 * 1e9 lolos gerbang `> 0`, dan sub-kalkulator natrium/kalium menampilkan angka (mis. "Corrected sodium −1.6") dari kolom
 * kosong. Rentang adalah batas kewajaran masukan, BUKAN rekomendasi dosis. Alat edukasi; keputusan tetap pada klinisi.
 *
 * Catatan temuan (tidak diubah di sini): teks halaman Adrogue-Madias menyebut NaCl 0,9% sebagai Na 154 mEq/L, sedangkan
 * rumusnya memakai 140 mEq/L. Konstanta dibiarkan persis seperti semula sampai ditinjau klinisi.
 */
import { inRange } from './inputs'
import { hollidaySegarDailyMl } from './pediatricDka' // satu sumber untuk Holliday-Segar

export type Entry = Readonly<{ value: number; name: string; min: number; max: number; unit: string }>
export type Checked<T> = Readonly<{ ok: true } & T> | Readonly<{ ok: false; missing: readonly string[]; invalid: readonly string[] }>

export const FLUID_RANGES = {
  weightKg: { min: 0.5, max: 300, name: 'weight', unit: ' kg' },
  tbsaPct: { min: 1, max: 100, name: 'TBSA burned', unit: ' %' },
  sodium: { min: 90, max: 200, name: 'sodium', unit: ' mEq/L' },
  glucose: { min: 20, max: 2000, name: 'glucose', unit: ' mg/dL' },
  potassium: { min: 1, max: 10, name: 'potassium', unit: ' mEq/L' },
} as const
type RangeKey = keyof typeof FLUID_RANGES

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

function validate<T extends Partial<Record<string, RangeKey>>>(fields: Record<keyof T & string, number>, kinds: T) {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Record<string, number> = {}
  for (const f of Object.keys(kinds) as (keyof T & string)[]) {
    const r = FLUID_RANGES[kinds[f] as RangeKey]
    const label = r.name
    const v = fields[f]
    if (isEmpty(v)) { missing.push(label); continue }
    if (!inRange(v, r.min, r.max)) { invalid.push(`${label} must be ${r.min}–${r.max}${r.unit}`); continue }
    ok[f] = v
  }
  return { missing, invalid, ok, good: missing.length === 0 && invalid.length === 0 }
}
const fail = (v: { missing: string[]; invalid: string[] }) => ({ ok: false as const, missing: v.missing, invalid: v.invalid })

export function maintenanceFluid(weightKg: number) {
  const v = validate({ weightKg }, { weightKg: 'weightKg' } as const)
  if (!v.good) return fail(v)
  const w = v.ok.weightKg
  const dailyMl = hollidaySegarDailyMl(w)
  const naMeq = w <= 10 ? 3 * w : w <= 20 ? 30 + 2 * (w - 10) : 50 + (w - 20)
  const kMeq = w <= 10 ? 2 * w : w <= 20 ? 20 + 1 * (w - 10) : 30 + 0.5 * (w - 20)
  return { ok: true as const, dailyMl, hourlyMl: dailyMl / 24, naMeq, kMeq }
}

export type ResusScenario = 'adult-sepsis' | 'peds-shock' | 'burns'
export const RESUS_SCENARIOS: readonly ResusScenario[] = ['adult-sepsis', 'peds-shock', 'burns']

export function resuscitation(scenario: ResusScenario, weightKg: number, tbsaPct: number) {
  if (!RESUS_SCENARIOS.includes(scenario)) return { ok: false as const, missing: [] as string[], invalid: ['scenario must be adult-sepsis, peds-shock or burns'] }
  const v = validate({ weightKg, tbsaPct: scenario === 'burns' ? tbsaPct : 1 }, { weightKg: 'weightKg', tbsaPct: 'tbsaPct' } as const)
  if (!v.good) return fail(v)
  const w = v.ok.weightKg
  if (scenario === 'adult-sepsis') return { ok: true as const, scenario, ml: 30 * w, first8hMl: null, next16hMl: null }
  if (scenario === 'peds-shock') return { ok: true as const, scenario, ml: 20 * w, first8hMl: null, next16hMl: null }
  const total = 4 * w * v.ok.tbsaPct
  return { ok: true as const, scenario, ml: total, first8hMl: total / 2, next16hMl: total / 2 }
}

export function correctedSodium(measuredNa: number, glucose: number) {
  const v = validate({ measuredNa, glucose }, { measuredNa: 'sodium', glucose: 'glucose' } as const)
  if (!v.good) return fail(v)
  return { ok: true as const, correctedNa: v.ok.measuredNa + 1.6 * ((v.ok.glucose - 100) / 100) }
}

export function naCorrectionRate(currentNa: number, weightKg: number, sex: unknown) {
  const v = validate({ currentNa, weightKg }, { currentNa: 'sodium', weightKg: 'weightKg' } as const)
  const invalid = [...v.invalid]
  if (sex !== 'M' && sex !== 'F') invalid.push('sex must be M or F')
  if (!v.good || invalid.length > 0) return fail({ missing: v.missing, invalid })
  const tbw = v.ok.weightKg * (sex === 'M' ? 0.6 : 0.5)
  const naChangePerL = (140 - v.ok.currentNa) / (tbw + 1) // Adrogue-Madias disederhanakan, infusat Na = 140
  return { ok: true as const, tbw, naChangePerL, litersFor10: naChangePerL !== 0 ? 10 / naChangePerL : 0 }
}

export function potassiumDeficit(currentK: number, weightKg: number) {
  const v = validate({ currentK, weightKg }, { currentK: 'potassium', weightKg: 'weightKg' } as const)
  if (!v.good) return fail(v)
  const low = (4.0 - v.ok.currentK) * v.ok.weightKg * 0.3
  const high = (4.0 - v.ok.currentK) * v.ok.weightKg * 0.6
  return { ok: true as const, lowMeq: Math.max(0, low), highMeq: Math.max(0, high) }
}
