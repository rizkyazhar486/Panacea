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
import type { ConsentEnvelope, LongitudinalEvent, SemanticState } from './panaceaLongitudinalState.ts'
import type { VitalSign } from './types.ts'

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
    semanticState: 'clinician-reviewed' as const,
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
    tags: ['clinician-signed', 'server-accepted', `emr:${record.id}`, 'semantic-state:clinician-signed'],
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
      tags: ['clinician-signed', 'server-accepted', `emr:${record.id}`, 'semantic-state:clinician-verified-plan'],
    })
  }

  return { events, skipped: 0 }
}

// Vital AI-EMR -> status kanonik. Keadaan semantik diambil dari pencatat yang
// DICAP SERVER (server/src/index.ts: dicatatOleh), tidak ditebak:
// klinisi -> 'clinician-entered', pasien -> 'patient-reported', tanpa cap (data
// lama) -> 'imported'. Vital tidak memerlukan tinjauan untuk masuk, tetapi juga
// tidak pernah diberi label 'clinician-reviewed'.
export type VitalTercatat = VitalSign & { dicatatOleh?: { id: string; klinisi: boolean } }

const METRIK_VITAL: readonly [keyof VitalSign, string, string][] = [
  ['systolic', 'vital.sbp', 'mmHg'], ['diastolic', 'vital.dbp', 'mmHg'], ['heartRate', 'vital.hr', 'bpm'],
  ['respRate', 'vital.rr', '/min'], ['tempC', 'vital.temp', '°C'], ['spo2', 'vital.spo2', '%'], ['glucose', 'vital.glucose', 'mg/dL'],
]
export const LABEL_METRIK_VITAL_EMR: Record<string, string> = {
  'vital.sbp': 'Systolic BP', 'vital.dbp': 'Diastolic BP', 'vital.hr': 'Heart rate', 'vital.rr': 'Respiratory rate',
  'vital.temp': 'Temperature', 'vital.spo2': 'SpO₂', 'vital.glucose': 'Glucose',
}

export function emrVitalsToLongitudinalEvents(
  vitals: readonly VitalTercatat[], subjectId: string, consent: ConsentEnvelope, receivedAt: string,
): { events: LongitudinalEvent<number>[]; skipped: number } {
  const events: LongitudinalEvent<number>[] = []
  let skipped = 0
  const batas = Date.parse(receivedAt) + 5 * 60_000
  for (const v of vitals) {
    const t = Date.parse(v.takenAt)
    if (!Number.isFinite(t) || !Number.isFinite(batas) || t > batas) { skipped++; continue }
    const keadaan: SemanticState = v.dicatatOleh ? (v.dicatatOleh.klinisi ? 'clinician-entered' : 'patient-reported') : 'imported'
    const iso = new Date(t).toISOString()
    for (const [kunci, metric, unit] of METRIK_VITAL) {
      const nilai = v[kunci]
      if (typeof nilai !== 'number' || !Number.isFinite(nilai) || nilai <= 0) continue
      events.push({
        id: `emr-vital:${v.id}:${metric}`, subjectId, domain: 'vital', metric, value: nilai, unit, recordedAt: iso, confidence: 1,
        provenance: { sourceKind: 'clinical-system', sourceId: 'panaceamed:ai-emr', capturedAt: iso, receivedAt, method: `emr-vital:${keadaan}` },
        consent, review: { state: 'not-required' }, semanticState: keadaan, tags: ['ai-emr', `semantic-state:${keadaan}`],
      })
    }
  }
  return { events, skipped }
}
