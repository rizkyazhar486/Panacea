import type { EMRRecord } from './types.ts'

export type EmrFieldOrigin =
  | 'ai-generated'
  | 'clinician-entered'
  | 'patient-reported'
  | 'derived'
  | 'unknown'

export type EmrFieldReview =
  | 'unreviewed'
  | 'clinician-reviewed'
  | 'clinician-verified'
  | 'clinician-rejected'

export interface EmrFieldSemanticState {
  field: string
  origin: EmrFieldOrigin
  review: EmrFieldReview
  reviewerId?: string
  reviewedAt?: string
  reason: string
}

export type ServerAcceptedEmrForSemantics = EMRRecord & {
  signedById?: string
  physicalExam: EMRRecord['physicalExam'] & { verifiedById?: string }
}

const validIso = (value?: string) => Boolean(value && Number.isFinite(Date.parse(value)))
const text = (value?: string) => String(value ?? '').trim()

function originFromSource(source?: 'AI' | 'Dokter'): EmrFieldOrigin {
  return source === 'AI' ? 'ai-generated' : source === 'Dokter' ? 'clinician-entered' : 'unknown'
}

/**
 * Derive field-level semantics without inventing provenance.
 *
 * A visible signedBy name is insufficient. "clinician-reviewed" is only emitted
 * when the server-stamped signedById + valid signedAt are present. This keeps an
 * optimistic/client-forged signature from becoming clinical truth.
 *
 * Origin and review are orthogonal: an AI-origin diagnosis can become
 * clinician-reviewed while still remaining explicitly AI-origin.
 */
export function deriveEmrFieldStates(record: ServerAcceptedEmrForSemantics): Record<string, EmrFieldSemanticState> {
  const serverSigned = Boolean(text(record.signedById) && validIso(record.signedAt))
  const reviewerId = serverSigned ? text(record.signedById) : undefined
  const reviewedAt = serverSigned ? record.signedAt : undefined

  const state = (
    field: string,
    origin: EmrFieldOrigin,
    review: EmrFieldReview,
    reason: string,
    reviewer = reviewerId,
  ): EmrFieldSemanticState => ({
    field,
    origin,
    review: serverSigned ? review : 'unreviewed',
    ...(serverSigned && reviewer ? { reviewerId: reviewer } : {}),
    ...(serverSigned && reviewedAt ? { reviewedAt } : {}),
    reason: serverSigned ? reason : 'No server-stamped clinician signature for this encounter.',
  })

  const out: Record<string, EmrFieldSemanticState> = {}

  // Current schema does not preserve who originally authored each history field,
  // so origin MUST remain unknown rather than guessing patient-vs-AI.
  out['subjective.history'] = state(
    'subjective.history',
    'unknown',
    'clinician-reviewed',
    'Encounter was signed by an authenticated clinician; original history authorship is not encoded.',
  )

  const physicalVerified = Boolean(
    serverSigned &&
    record.physicalExam?.doctorVerified &&
    text(record.physicalExam?.verifiedById),
  )
  out['objective.physicalExam'] = state(
    'objective.physicalExam',
    'unknown',
    physicalVerified ? 'clinician-verified' : 'clinician-reviewed',
    physicalVerified
      ? 'Physical examination carries a server-associated clinician verification identity.'
      : 'Encounter signature reviews the field, but field-specific physical-exam verification is absent.',
    physicalVerified ? text(record.physicalExam?.verifiedById) : reviewerId,
  )

  out['assessment.problems'] = state(
    'assessment.problems',
    'unknown',
    'clinician-reviewed',
    'Problem-list origin is not encoded per item; signed encounter establishes review, not original authorship.',
  )

  if (record.primaryDiagnosis) {
    out['assessment.primaryDiagnosis'] = state(
      'assessment.primaryDiagnosis',
      originFromSource(record.primaryDiagnosis.source),
      'clinician-reviewed',
      record.primaryDiagnosis.source === 'AI'
        ? 'AI-origin diagnosis remained explicitly AI-origin and was reviewed when the encounter was signed.'
        : 'Diagnosis is marked clinician-entered and the encounter was signed.',
    )
  }

  for (const item of record.plan ?? []) {
    const review: EmrFieldReview = item.status === 'ditolak'
      ? 'clinician-rejected'
      : item.status === 'diverifikasi'
        ? 'clinician-verified'
        : 'clinician-reviewed'
    out[`plan.${item.id}`] = state(
      `plan.${item.id}`,
      originFromSource(item.source),
      review,
      item.status === 'ditolak'
        ? 'Plan item was explicitly rejected in the signed encounter.'
        : item.status === 'diverifikasi'
          ? 'Plan item was explicitly verified in the signed encounter.'
          : 'Plan item is present in a signed encounter but has not been field-verified.',
    )
  }

  if (text(record.labEkgInterpretation)) {
    out['objective.labEkgInterpretation'] = state(
      'objective.labEkgInterpretation',
      'unknown',
      'clinician-reviewed',
      'Interpretation origin is not encoded; signed encounter establishes clinician review only.',
    )
  }

  if (text(record.prognosis)) {
    out['assessment.prognosis'] = state(
      'assessment.prognosis',
      'unknown',
      'clinician-reviewed',
      'Prognosis origin is not encoded; signed encounter establishes clinician review only.',
    )
  }

  return out
}
