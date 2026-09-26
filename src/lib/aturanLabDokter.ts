// Evaluasi aturan tinjauan lab yang ditulis dokter, di peramban dokter, atas
// status longitudinal kanonik pasien yang berbagi (statusPasienUntukDokter).
// Kernel yang sama menghitungnya; di sini hanya subjek disamakan, karena status
// bersama memakai subjek netral 'shared-patient' (tanpa id pasien di klien).
import { buildClinicianContinuousCareDigest, type ContinuousCarePlan, type MeasurementRuleEvaluation } from './continuousCareOperatingSystem.ts'
import type { LongitudinalPatientState } from './panaceaLongitudinalState.ts'

export function evaluasiAturanLab(plan: ContinuousCarePlan, state: LongitudinalPatientState, kini: string): readonly MeasurementRuleEvaluation[] {
  if (!plan.measurementReviewRules.length) return []
  return buildClinicianContinuousCareDigest({ ...plan, subjectId: state.subjectId }, null, state, kini).measurementRules
}

// Sama persis dengan batas/pesan server (server/src/carePlan.ts) supaya dokter
// melihat kesalahan sebelum submit, bukan menebak dari pesan galat generik
// setelah pulang-pergi ke server.
export const MAKS_HARI_ATURAN_LAB = 730

export function validasiBarisAturanLab(a: { ambang: string; hari: string; bukti: string }): string | null {
  if (!a.bukti.trim()) return 'evidence reference is required (max 300 characters)'
  const ambang = Number(a.ambang.replace(',', '.'))
  if (a.ambang.trim() === '' || !Number.isFinite(ambang)) return 'lab rule threshold must be a number'
  const hari = Number(a.hari)
  if (!Number.isInteger(hari) || hari < 1 || hari > MAKS_HARI_ATURAN_LAB) return `lab rule age must be 1–${MAKS_HARI_ATURAN_LAB} days`
  return null
}

export const LABEL_KEADAAN: Record<MeasurementRuleEvaluation['state'], string> = {
  triggered: 'Meets your rule',
  'not-triggered': 'Within your rule',
  missing: 'No shared result',
  stale: 'Latest result too old for this rule',
  'unit-mismatch': 'Unit differs — not compared',
  'blocked-by-consent': 'Sharing not active',
}
