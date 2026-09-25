// Status tinjau rekam AI-EMR yang JUJUR. EMR menyetel signedBy/signedAt dan
// doctorVerified secara optimistis di klien; hanya cap server (signedById,
// physicalExam.verifiedById — server/src/rekamKlinis.ts) yang menjadikannya fakta.
import type { EMRRecord } from './types.ts'

export type StatusTinjau = 'signed' | 'signature-pending' | 'exam-verified' | 'draft'

export function statusTinjauRekam(r: Pick<EMRRecord, 'signedAt' | 'signedById'> & { physicalExam?: Pick<EMRRecord['physicalExam'], 'doctorVerified' | 'verifiedById'> }): StatusTinjau {
  if (r.signedAt && r.signedById) return 'signed'
  if (r.signedAt) return 'signature-pending'
  if (r.physicalExam?.doctorVerified && r.physicalExam.verifiedById) return 'exam-verified'
  return 'draft'
}

export const LABEL_STATUS_TINJAU: Record<StatusTinjau, string> = {
  signed: 'Clinician signed',
  'signature-pending': 'Signature pending server confirmation',
  'exam-verified': 'Exam verified',
  draft: 'Draft',
}
