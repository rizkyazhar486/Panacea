// Masukan penjelajah fisiologi: kolom kosong atau tidak valid BUKAN nol, dan tiap keluaran hanya dihitung dari masukannya sendiri.
// Dulu `Number(raw)` → 0 untuk kolom kosong, lalu lib mengisi bawaan diam-diam (HCO₃⁻ 24, PaCO₂ 40) atau menghitung dari 0.
import { physiologySnapshot, type PhysiologyInputs } from '../../lib/microphysiology'

export type ScaleKey = Exclude<keyof PhysiologyInputs, 'temperatureC'>
export const SCALE_KEYS: readonly ScaleKey[] = ['hb', 'saO2', 'paO2', 'svO2', 'pvO2', 'cardiacOutput', 'potassiumOutside', 'potassiumInside', 'bicarbonate', 'paCO2']

/** Batas kewajaran masukan edukatif (bukan ambang klinis); tidak boleh nol bila dipakai sebagai pembagi. */
const LIMITS: Record<ScaleKey, { min: number; max: number }> = {
  hb: { min: 0, max: 30 }, saO2: { min: 0, max: 100 }, paO2: { min: 0, max: 800 }, svO2: { min: 0, max: 100 }, pvO2: { min: 0, max: 800 },
  cardiacOutput: { min: 0, max: 40 }, potassiumOutside: { min: 0.1, max: 20 }, potassiumInside: { min: 0.1, max: 400 },
  bicarbonate: { min: 0.1, max: 80 }, paCO2: { min: 0.1, max: 200 },
}

export function parseScaleInput(key: ScaleKey, raw: unknown): number | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined
  const v = Number(raw)
  const { min, max } = LIMITS[key]
  return Number.isFinite(v) && v >= min && v <= max ? v : undefined
}

export interface ScaleResult { caO2: number | null; cvO2: number | null; vo2: number | null; extraction: number | null; kNernst: number | null; pH: number | null }

const FIXED_TEMPERATURE_C = 37

export function scaleResult(texts: Record<ScaleKey, string>): ScaleResult {
  const v = Object.fromEntries(SCALE_KEYS.map((k) => [k, parseScaleInput(k, texts[k])])) as Record<ScaleKey, number | undefined>
  const ok = (...ks: ScaleKey[]) => ks.every((k) => v[k] !== undefined)
  const arterial = ok('hb', 'saO2', 'paO2')
  const venous = ok('hb', 'svO2', 'pvO2')
  const filled = Object.fromEntries(SCALE_KEYS.map((k) => [k, v[k] ?? 1])) as Record<ScaleKey, number>
  const snap = physiologySnapshot({ ...filled, temperatureC: FIXED_TEMPERATURE_C })
  return {
    caO2: arterial ? snap.caO2 : null,
    cvO2: venous ? snap.cvO2 : null,
    vo2: arterial && venous && ok('cardiacOutput') ? snap.vo2 : null,
    extraction: arterial && venous ? snap.extraction : null,
    kNernst: ok('potassiumOutside', 'potassiumInside') ? snap.kNernst : null,
    pH: ok('bicarbonate', 'paCO2') ? snap.pH : null,
  }
}
