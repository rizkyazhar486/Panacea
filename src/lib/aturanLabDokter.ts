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

export const LABEL_KEADAAN: Record<MeasurementRuleEvaluation['state'], string> = {
  triggered: 'Meets your rule',
  'not-triggered': 'Within your rule',
  missing: 'No shared result',
  stale: 'Latest result too old for this rule',
  'unit-mismatch': 'Unit differs — not compared',
  'blocked-by-consent': 'Sharing not active',
}
