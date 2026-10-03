/**
 * Skor Centor / McIsaac (Centor 1981; modifikasi McIsaac 1998): empat kriteria klinis + penyesuaian usia
 * (< 15 tahun +1, 15-44 tahun 0, ≥ 45 tahun −1). Label risiko dan catatan dipindahkan dari halaman tanpa perubahan.
 * Tampilan pendukung keputusan, bukan indikasi antibiotik.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis).
export const CENTOR_AGE_YEARS = { min: 0, max: 120 } as const

export type CentorTone = 'normal' | 'low' | 'critical'
export type CentorResult =
  | { ok: true; data: { score: number; label: string; tone: CentorTone; note: string } }
  | { ok: false; reason: string }

export interface CentorCriteria {
  readonly fever: boolean
  readonly noCough: boolean
  readonly tenderNodes: boolean
  readonly exudate: boolean
}

export function centorMcIsaac(criteria: CentorCriteria, ageYears: number): CentorResult {
  if (!inRange(ageYears, CENTOR_AGE_YEARS.min, CENTOR_AGE_YEARS.max)) {
    return { ok: false, reason: `Age must be ${CENTOR_AGE_YEARS.min}–${CENTOR_AGE_YEARS.max} years` }
  }
  const flags = [criteria?.fever, criteria?.noCough, criteria?.tenderNodes, criteria?.exudate]
  if (flags.some((f) => typeof f !== 'boolean')) return { ok: false, reason: 'Each clinical criterion must be yes or no' }
  const ageAdj = ageYears < 15 ? 1 : ageYears >= 45 ? -1 : 0
  const score = flags.filter(Boolean).length + ageAdj
  const interp: { label: string; tone: CentorTone; note: string } = score <= 0
    ? { label: 'Very low risk (1-2.5%)', tone: 'normal', note: 'No swab/empiric antibiotics needed.' }
    : score === 1
    ? { label: 'Low risk (5-10%)', tone: 'normal', note: 'Antibiotics generally not needed.' }
    : score === 2
    ? { label: 'Moderate risk (11-17%)', tone: 'low', note: 'Consider a rapid strep test/culture before antibiotics.' }
    : score === 3
    ? { label: 'High risk (28-35%)', tone: 'low', note: 'Strep testing recommended; treat if positive.' }
    : { label: 'Very high risk (51-53%)', tone: 'critical', note: 'Consider empiric antibiotics (e.g. penicillin) or a rapid test first per local policy.' }
  return { ok: true, data: { score, ...interp } }
}
