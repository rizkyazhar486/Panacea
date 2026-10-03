/**
 * Skor Centor/McIsaac (Centor 1981, McIsaac 1998). Empat kriteria klinis +1 masing-masing, koreksi usia McIsaac:
 * <15 th +1, 15–44 th 0, ≥45 th −1. Bucket risiko dan teks dipindahkan UTUH dari halaman (tidak diubah).
 * Usia di luar 1–120 tahun (termasuk kolom kosong yang terbaca 0, NaN, Infinity) ditolak: skor tidak dikembalikan.
 */
import { inRange } from './inputs'

export const CENTOR_AGE_YEARS = { min: 1, max: 120 } as const

export type CentorTone = 'normal' | 'low' | 'critical'
export interface CentorCriteria { fever: boolean; noCough: boolean; tenderNodes: boolean; exudate: boolean }
export interface CentorResult { total: number; ageAdjustment: -1 | 0 | 1; riskLabel: string; tone: CentorTone; note: string }
export type CentorOutcome = { ok: true; data: CentorResult } | { ok: false; reason: string }

export function centorMcIsaac(criteria: CentorCriteria, ageYears: number): CentorOutcome {
  if (!inRange(ageYears, CENTOR_AGE_YEARS.min, CENTOR_AGE_YEARS.max)) {
    return { ok: false, reason: `Age must be ${CENTOR_AGE_YEARS.min}–${CENTOR_AGE_YEARS.max} years` }
  }
  const flags = [criteria?.fever, criteria?.noCough, criteria?.tenderNodes, criteria?.exudate]
  if (flags.some((f) => typeof f !== 'boolean')) return { ok: false, reason: 'Each criterion must be yes or no' }
  const ageAdjustment = ageYears < 15 ? 1 : ageYears >= 45 ? -1 : 0
  const total = flags.filter(Boolean).length + ageAdjustment
  const [riskLabel, tone, note]: [string, CentorTone, string] = total <= 0
    ? ['Very low risk (1-2.5%)', 'normal', 'No swab/empiric antibiotics needed.']
    : total === 1
    ? ['Low risk (5-10%)', 'normal', 'Antibiotics generally not needed.']
    : total === 2
    ? ['Moderate risk (11-17%)', 'low', 'Consider a rapid strep test/culture before antibiotics.']
    : total === 3
    ? ['High risk (28-35%)', 'low', 'Strep testing recommended; treat if positive.']
    : ['Very high risk (51-53%)', 'critical', 'Consider empiric antibiotics (e.g. penicillin) or a rapid test first per local policy.']
  return { ok: true, data: { total, ageAdjustment, riskLabel, tone, note } }
}
