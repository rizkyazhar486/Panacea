/**
 * Balans cairan 24 jam: total masuk − total keluar. Setiap komponen harus angka hingga ≥ 0 (kolom kosong dibaca 0 mL,
 * artinya tidak ada); negatif tidak punya arti fisik dan ditolak dengan menyebut kolomnya.
 */
import { isFiniteNumber } from './inputs'

export const FLUID_COMPONENT_ML = { min: 0, max: 20000 } as const

export type FluidBalanceInput = Readonly<{
  oralIn: number; ivIn: number; otherIn: number
  urineOut: number; drainOut: number; insensibleOut: number; otherOut: number
}>
export type FluidBalanceResult =
  | { ok: true; data: { totalIn: number; totalOut: number; balance: number } }
  | { ok: false; reason: string }

const LABELS: Readonly<Record<keyof FluidBalanceInput, string>> = {
  oralIn: 'Oral/Enteral intake', ivIn: 'IV/Infusion intake', otherIn: 'Other intake',
  urineOut: 'Urine output', drainOut: 'Drain/NGT output', insensibleOut: 'Insensible loss', otherOut: 'Other output',
}

export function fluidBalance(input: FluidBalanceInput): FluidBalanceResult {
  for (const key of Object.keys(LABELS) as (keyof FluidBalanceInput)[]) {
    const v = input[key]
    if (!isFiniteNumber(v) || v < FLUID_COMPONENT_ML.min || v > FLUID_COMPONENT_ML.max) {
      return { ok: false, reason: `${LABELS[key]} must be ${FLUID_COMPONENT_ML.min}–${FLUID_COMPONENT_ML.max} mL` }
    }
  }
  const totalIn = input.oralIn + input.ivIn + input.otherIn
  const totalOut = input.urineOut + input.drainOut + input.insensibleOut + input.otherOut
  return { ok: true, data: { totalIn, totalOut, balance: totalIn - totalOut } }
}
