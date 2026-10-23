// Masukan indeks gesekan layanan: kolom kosong atau tidak valid BUKAN nol.
// Dulu `Number(raw)` mengubah kolom kosong menjadi 0 sehingga indeks turun diam-diam ("low") atau anggaran 0 dibulatkan jadi 1.
import type { CareFrictionInput } from '../../lib/healthGapNavigator'

export type FrictionKey = 'waitingHours' | 'travelMinutes' | 'outOfPocketCost' | 'monthlyDisposableBudget' | 'numberOfSteps' | 'missedWorkHours'
export const FRICTION_KEYS: readonly FrictionKey[] = ['waitingHours', 'travelMinutes', 'outOfPocketCost', 'monthlyDisposableBudget', 'numberOfSteps', 'missedWorkHours']
/** Batas kewajaran masukan (bukan ambang klinis). Anggaran dan langkah minimal 1. */
export const FRICTION_LIMITS: Record<FrictionKey, { min: number; max: number }> = {
  waitingHours: { min: 0, max: 8760 }, travelMinutes: { min: 0, max: 1440 }, outOfPocketCost: { min: 0, max: 1e12 },
  monthlyDisposableBudget: { min: 1, max: 1e12 }, numberOfSteps: { min: 1, max: 100 }, missedWorkHours: { min: 0, max: 744 },
}

export function parseFrictionField(key: FrictionKey, raw: unknown): number | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined
  const v = Number(raw)
  const { min, max } = FRICTION_LIMITS[key]
  return Number.isFinite(v) && v >= min && v <= max ? v : undefined
}

/** `null` sampai keenam kolom terisi dengan nilai yang valid. */
export function parseFriction(texts: Record<FrictionKey, string>, digitalBarrier: CareFrictionInput['digitalBarrier']): CareFrictionInput | null {
  const out: Partial<CareFrictionInput> = { digitalBarrier }
  for (const k of FRICTION_KEYS) {
    const v = parseFrictionField(k, texts[k])
    if (v === undefined) return null
    out[k] = v
  }
  return out as CareFrictionInput
}
