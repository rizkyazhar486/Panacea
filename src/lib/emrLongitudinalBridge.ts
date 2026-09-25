// Server-accepted AI-EMR -> canonical longitudinal patient state.
//
// Clinical meaning is deliberately conservative:
// - an unsigned AI draft contributes ZERO clinician facts;
// - a record is accepted here only after the backend has stamped signedById +
//   signedAt, so the client cannot promote its own optimistic "signed" draft;
// - provenance preserves whether a diagnosis/plan began as AI or doctor text;
// - confidence=1 means "faithfully projected from the signed record", NOT
//   diagnostic certainty or clinical validation.
import type { EMRRecord } from './types.ts'
import { deriveEmrFieldStates } from './emrSemanticState.ts'
import type { ConsentEnvelope, LongitudinalEvent } from './panaceaLongitudinalState.ts'

export type ServerAcceptedEmrRecord = EMRRecord & {
  signedById?: string
  physicalExam: EMRRecord['physicalExam'] & { verifiedById?: string }
}

export interface EmrLongitudinalProjection {
  events: LongitudinalEvent<string>[]
  skipped: number
}

const validIso = (value?: string) => Boolean(value && Number.isFinite(Date.parse(value)))
const text = (value?: string) => String(value ?? '').trim()

export function emrRecordToLongitudinalEvents(
  record: ServerAcceptedEmrRecord,
  subjectId: string,
  consent: ConsentEnvelope,
  receivedAt: string,
): EmrLongitudinalProjection {
  const events: LongitudinalEvent<string>[] = []
  const semantic = deriveEmrFieldStates(record)
  const signedAt = text(record?.signedAt)
  const reviewerId = text(record?.signedById)
  const subject = text(subjectId)
  const receivedMs = Date.parse(receivedAt)

  // Fail closed. signedBy alone is client-controlled; signedById is injected by
  // server/src/rekamKlinis.ts only for an authenticated clinician/owner.
  if (!subject || !reviewerId || !validIso(signedAt) || !Number.isFinite(receivedMs)) {
    return { events, skipped: 1 }
  }
  if (Date.parse(signedAt) > receivedMs + 5 * 60_000) return { events, skipped: 1 }

  const base = {
    subjectId: subject,
    domain: 'clinical-note' as const,
    recordedAt: signedAt,
    confidence: 1,
    provenance: {
      sourceKind: 'clinical-system' as const,
      sourceId: `panaceamed:emr:${record.id}`,
      capturedAt: signedAt,
      receivedAt,
      method: 'server-signed-emr',
      version: record.updatedAt,
    },
    consent,
    review: {
      state: 'accepted' as const,
      reviewerId,
      reviewedAt: signedAt,
      note: record.signedBy ? `Signed by ${record.signedBy}` : undefined,
    },
  }

  const problemTitles = record.problems.map((problem) => text(problem.title)).filter(Boolean)
  const complaint = text(record.anamnesis?.keluhanUtama)
  const noteParts = [
    complaint ? `Chief complaint: ${complaint}` : '',
    problemTitles.length ? `Problems: ${problemTitles.join('; ')}` : '',
  ].filter(Boolean)
  events.push({
    ...base,
    id: `emr:${record.id}:signed-note`,
    metric: 'emr.signed-note',
    value: noteParts.join(' · ') || 'Signed clinical record',
    tags: [
      'clinician-signed', 'server-accepted', `emr:${record.id}`, 'semantic-state:clinician-signed',
      `field-origin:${semantic['subjective.history']?.origin ?? 'unknown'}`,
      `field-review:${semantic['subjective.history']?.review ?? 'unreviewed'}`,
    ],
  })

  if (record.primaryDiagnosis && text(record.primaryDiagnosis.code || record.primaryDiagnosis.title)) {
    const code = text(record.primaryDiagnosis.code)
    const title = text(record.primaryDiagnosis.title)
    events.push({
      ...base,
      id: `emr:${record.id}:primary-diagnosis`,
      metric: 'emr.primary-diagnosis',
      value: [code, title].filter(Boolean).join(' · '),
      tags: [
        'clinician-signed',
        'server-accepted',
        `emr:${record.id}`,
        'semantic-state:clinician-signed',
        `draft-source:${record.primaryDiagnosis.source === 'Dokter' ? 'clinician' : 'ai-or-unspecified'}`,
        `field-origin:${semantic['assessment.primaryDiagnosis']?.origin ?? 'unknown'}`,
        `field-review:${semantic['assessment.primaryDiagnosis']?.review ?? 'unreviewed'}`,
      ],
    })
  }

  const verifiedPlan = record.plan
    .filter((item) => item.status === 'diverifikasi' && text(item.text))
    .map((item) => text(item.text))
  if (verifiedPlan.length) {
    events.push({
      ...base,
      id: `emr:${record.id}:verified-plan`,
      metric: 'emr.verified-plan',
      value: verifiedPlan.join(' · '),
      tags: [
      'clinician-signed', 'server-accepted', `emr:${record.id}`, 'semantic-state:clinician-verified-plan',
      ...[...new Set(record.plan
        .filter((item) => item.status === 'diverifikasi' && text(item.text))
        .map((item) => `field-origin:${semantic[`plan.${item.id}`]?.origin ?? 'unknown'}`))],
      ...[...new Set(record.plan
        .filter((item) => item.status === 'diverifikasi' && text(item.text))
        .map((item) => `field-review:${semantic[`plan.${item.id}`]?.review ?? 'unreviewed'}`))],
    ],
    })
  }

  return { events, skipped: 0 }
}
