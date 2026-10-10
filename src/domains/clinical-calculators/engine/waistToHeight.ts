/**
 * Rasio lingkar pinggang terhadap tinggi badan. Pita (<0,5 / <0,6 / ≥0,6) dipindahkan apa adanya dari
 * SelfAssessmentToolkit; ini penapisan edukasi, bukan diagnosis. Sebelumnya kolom kosong terbaca 0, sehingga tinggi
 * kosong menghasilkan "Infinity — High risk". Rentang = kewajaran input (atribut min/max kolom), bukan ambang klinis.
 */
import { inRange } from './inputs'

export const WAIST_CM = { min: 40, max: 200 } as const
export const WHTR_HEIGHT_CM = { min: 100, max: 230 } as const

export type WhtrTone = 'brand' | 'low' | 'critical'
export type WaistToHeightResult =
  | { ok: true; data: { ratio: number; label: string; tone: WhtrTone } }
  | { ok: false; reason: string }

export function waistToHeight(waistCm: number, heightCm: number): WaistToHeightResult {
  if (!inRange(waistCm, WAIST_CM.min, WAIST_CM.max)) return { ok: false, reason: `Waist must be ${WAIST_CM.min}–${WAIST_CM.max} cm` }
  if (!inRange(heightCm, WHTR_HEIGHT_CM.min, WHTR_HEIGHT_CM.max)) return { ok: false, reason: `Height must be ${WHTR_HEIGHT_CM.min}–${WHTR_HEIGHT_CM.max} cm` }
  const ratio = waistCm / heightCm
  const band = ratio < 0.5 ? { label: 'Lower risk', tone: 'brand' as const } : ratio < 0.6 ? { label: 'Increased risk', tone: 'low' as const } : { label: 'High risk', tone: 'critical' as const }
  return { ok: true, data: { ratio, ...band } }
}
