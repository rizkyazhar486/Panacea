/**
 * Lembar kerja cairan/kalium/insulin DKA anak (bolus → defisit + rumatan Holliday-Segar 48 jam → laju mL/jam; pita kalium;
 * infus insulin U/kg/jam × berat). Rumus, konstanta, dan ambang kalium (3,5 / 5,5 mEq/L) dipindahkan dari halaman tanpa
 * perubahan. Yang baru: setiap masukan diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu berat
 * 5000 kg, dehidrasi 80% (atribut `max` HTML tidak ditegakkan), atau insulin 5 U/kg/jam lolos gerbang `> 0` dan menghasilkan
 * laju infus dan dosis insulin. Setiap bagian dihitung hanya dari masukan miliknya yang sah. Rentang di bawah adalah batas
 * kewajaran masukan (insulin dan dehidrasi mengikuti atribut halaman lama), BUKAN rekomendasi dosis.
 * Alat edukasi, bukan protokol tervalidasi; keputusan dosis tetap pada klinisi dan protokol institusi.
 */
import { inRange } from './inputs'

export const DKA_RANGES = {
  weightKg: { min: 2, max: 120, name: 'weight', unit: ' kg' },
  dehydrationPct: { min: 1, max: 15, name: 'dehydration estimate', unit: ' %' },
  potassiumMeq: { min: 1, max: 10, name: 'serum potassium', unit: ' mEq/L' },
  insulinRateUKgHr: { min: 0.01, max: 0.1, name: 'insulin rate', unit: ' U/kg/hr' },
} as const
type Field = keyof typeof DKA_RANGES

export const HYPOKALEMIA_BELOW = 3.5
export const HYPERKALEMIA_ABOVE = 5.5

export function hollidaySegarDailyMl(weightKg: number): number {
  if (weightKg <= 10) return 100 * weightKg
  if (weightKg <= 20) return 1000 + 50 * (weightKg - 10)
  return 1500 + 20 * (weightKg - 20)
}

export type DkaInput = Readonly<{
  weightKg: number
  dehydrationPct: number
  /** NaN = tidak diukur (diperbolehkan): pita kalium tidak ada. */
  potassiumMeq: number
  insulinRateUKgHr: number
  shock: boolean
}>
export type DkaFluids = Readonly<{
  bolusMlPerKg: number; bolusMl: number; deficitMl: number; maintenance48hMl: number
  total48hMl: number; netAfterBolusMl: number; ratePerHr: number
}>
export type KBand = Readonly<{ label: string; tone: 'critical' | 'brand' }>
export type DkaResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  fluids: DkaFluids | null
  insulinUHr: number | null
  kBand: KBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function kaliumBand(k: number): KBand {
  if (k < HYPOKALEMIA_BELOW) return { label: 'Hypokalemic — hold insulin until K rechecked / replete first', tone: 'critical' }
  if (k > HYPERKALEMIA_ABOVE) return { label: 'Hyperkalemic — hold added KCl/KPO4 until urine output confirmed & K falls', tone: 'critical' }
  return { label: 'Normokalemic — standard 20 mEq/L KCl + 20 mEq/L KPO4 split', tone: 'brand' }
}

export function pediatricDka(input: DkaInput): DkaResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(DKA_RANGES) as Field[]) {
    const { min, max, name, unit } = DKA_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { if (k !== 'potassiumMeq') missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  let fluids: DkaFluids | null = null
  if (ok.weightKg !== undefined && ok.dehydrationPct !== undefined) {
    const w = ok.weightKg
    const bolusMlPerKg = input.shock === true ? 20 : 10
    const bolusMl = bolusMlPerKg * w
    const maintenance48hMl = hollidaySegarDailyMl(w) * 2
    const deficitMl = (ok.dehydrationPct / 100) * w * 1000
    const total48hMl = deficitMl + maintenance48hMl
    const netAfterBolusMl = Math.max(0, total48hMl - bolusMl)
    fluids = { bolusMlPerKg, bolusMl, deficitMl, maintenance48hMl, total48hMl, netAfterBolusMl, ratePerHr: netAfterBolusMl / 48 }
  }
  const insulinUHr = ok.weightKg !== undefined && ok.insulinRateUKgHr !== undefined ? ok.insulinRateUKgHr * ok.weightKg : null
  const kBand = ok.potassiumMeq !== undefined ? kaliumBand(ok.potassiumMeq) : null
  return { missing, invalid, fluids, insulinUHr, kBand }
}
