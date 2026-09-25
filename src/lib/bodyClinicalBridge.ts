import type { EMRRecord, VitalSign } from './types.ts'

export type BodyClinicalReviewState = 'draft' | 'exam-verified' | 'record-signed'
export type BodyClinicalMarkerStatus = 'normal' | 'abnormal' | 'recorded' | 'unchecked'

export interface BodyClinicalSystemFinding {
  key: string
  label: string
  x: number
  y: number
  status: BodyClinicalMarkerStatus
  note?: string
  /** Dari mana status berasal: ditandai klinisi & diverifikasi server, ditandai tanpa verifikasi, atau heuristik teks. */
  origin?: AsalTemuan
}

export type AsalTemuan = 'clinician-verified' | 'marked-unverified' | 'text-heuristic'

export interface BodyClinicalMarker extends BodyClinicalSystemFinding {
  source: {
    kind: 'ai-emr'
    recordId: string
    patientId: string
    updatedAt: string
  }
  reviewState: BodyClinicalReviewState
}

export interface BodyClinicalSignal {
  id: string
  label: string
  value: string
  unit?: string
  recordedAt: string
  sourceRecordId: string
  source: 'clinical-vital'
}

export interface BodyClinicalBridgeProjection {
  patientId: string
  recordId: string
  generatedAt: string
  reviewState: BodyClinicalReviewState
  markers: readonly BodyClinicalMarker[]
  signals: readonly BodyClinicalSignal[]
  findingCounts: {
    normal: number
    abnormal: number
    unchecked: number
  }
  boundary: {
    patientSpecificSignals: true
    referenceAtlasGeometryPatientSpecific: false
    diagnosticInferenceGenerated: false
    autonomousClinicalActionAllowed: false
  }
}

// Hanya cap SERVER yang dihitung (server/src/rekamKlinis.ts): signedById untuk
// tanda tangan, physicalExam.verifiedById untuk verifikasi fisik. EMR menyetel
// signedBy/doctorVerified secara optimistis di klien sebelum server menerima;
// tanda tangan yang masih antre, ditolak, atau dari non-klinisi tetap 'draft'.
function reviewState(record: EMRRecord): BodyClinicalReviewState {
  if (record.signedById && record.signedAt) return 'record-signed'
  if (record.physicalExam?.doctorVerified && record.physicalExam.verifiedById) return 'exam-verified'
  return 'draft'
}

function finite(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function latestVital(vitals: readonly VitalSign[]) {
  const sorted = vitals
    .filter((vital) => Number.isFinite(Date.parse(vital.takenAt)))
    .slice()
    .sort((left, right) => Date.parse(left.takenAt) - Date.parse(right.takenAt) || left.id.localeCompare(right.id))
  return sorted[sorted.length - 1]
}

function vitalSignals(vital: VitalSign | undefined): BodyClinicalSignal[] {
  if (!vital) return []

  const signals: BodyClinicalSignal[] = []
  const push = (id: string, label: string, value: string, unit?: string) => {
    signals.push({
      id,
      label,
      value,
      unit,
      recordedAt: vital.takenAt,
      sourceRecordId: vital.id,
      source: 'clinical-vital',
    })
  }

  if (finite(vital.systolic) && finite(vital.diastolic)) {
    push('blood-pressure', 'Blood pressure', `${vital.systolic}/${vital.diastolic}`, 'mmHg')
  }
  if (finite(vital.heartRate)) push('heart-rate', 'Heart rate', String(vital.heartRate), 'bpm')
  if (finite(vital.spo2)) push('spo2', 'SpO₂', String(vital.spo2), '%')
  if (finite(vital.respRate)) push('respiratory-rate', 'Respiratory rate', String(vital.respRate), '/min')
  if (finite(vital.tempC)) push('temperature', 'Temperature', vital.tempC.toFixed(1), '°C')
  if (finite(vital.glucose)) push('glucose', 'Glucose', String(vital.glucose), 'mg/dL')

  return signals
}

/**
 * Shared AI-EMR → Clinical/Body Exposure projection contract.
 *
 * This projection moves already-recorded patient signals and examination markers
 * into a visual overlay model. It deliberately does NOT transform reference
 * anatomy into patient-specific geometry and does NOT derive diagnosis,
 * severity, prognosis, treatment, lesion location or procedure targets.
 */
export function projectEmrToBodyClinicalBridge(
  record: EMRRecord,
  vitals: readonly VitalSign[],
  findings: readonly BodyClinicalSystemFinding[],
  generatedAt = record.updatedAt,
): BodyClinicalBridgeProjection {
  const state = reviewState(record)
  const markers = findings.map((finding) => ({
    ...finding,
    source: {
      kind: 'ai-emr' as const,
      recordId: record.id,
      patientId: record.patientId,
      updatedAt: record.updatedAt,
    },
    reviewState: state,
  }))

  const findingCounts = markers.reduce(
    (counts, marker) => {
      counts[marker.status] += 1
      return counts
    },
    { normal: 0, abnormal: 0, recorded: 0, unchecked: 0 },
  )

  return {
    patientId: record.patientId,
    recordId: record.id,
    generatedAt,
    reviewState: state,
    markers,
    signals: vitalSignals(latestVital(vitals)),
    findingCounts,
    boundary: {
      patientSpecificSignals: true,
      referenceAtlasGeometryPatientSpecific: false,
      diagnosticInferenceGenerated: false,
      autonomousClinicalActionAllowed: false,
    },
  }
}
