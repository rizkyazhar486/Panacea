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

/** Isian formulir aturan lab dokter (teks mentah dari input). */
export interface IsianAturanLab { jenis: string; op: 'gte' | 'lte'; ambang: string; hari: string; bukti: string }

/**
 * Validasi inline satu aturan lab sebelum rencana disimpan. Mengembalikan pesan
 * per kolom; kosong = sah. Server tetap memvalidasi ulang; ini mencegah dokter
 * menekan simpan lalu hanya menerima satu galat server yang samar.
 */
export function periksaAturanLab(a: IsianAturanLab): Partial<Record<'ambang' | 'hari' | 'bukti', string>> {
  const galat: Partial<Record<'ambang' | 'hari' | 'bukti', string>> = {}
  const ambang = a.ambang.trim().replace(',', '.')
  if (!ambang || !/^-?\d+(\.\d+)?$/.test(ambang) || !Number.isFinite(Number(ambang))) galat.ambang = 'Enter a number'
  const hari = a.hari.trim()
  if (!/^\d+$/.test(hari) || Number(hari) < 1 || Number(hari) > 3650) galat.hari = '1–3650 days'
  if (!a.bukti.trim()) galat.bukti = 'Evidence reference required'
  return galat
}
