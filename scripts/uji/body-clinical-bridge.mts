import assert from 'node:assert/strict'
import { projectEmrToBodyClinicalBridge } from '../../src/lib/bodyClinicalBridge.ts'
import type { EMRRecord, VitalSign } from '../../src/lib/types.ts'

const record: EMRRecord = {
  id: 'emr-1',
  patientId: 'patient-1',
  createdAt: '2026-09-18T09:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
  anamnesis: {
    keluhanUtama: 'Chest discomfort',
    rps: '',
    rpd: '',
    rpk: '',
    riwayatKehamilan: '',
    riwayatPengobatan: '',
    riwayatAlergi: '',
    riwayatTumbuhKembang: '',
    riwayatNutrisi: '',
    riwayatImunisasi: '',
    riwayatSosialEkonomi: '',
  },
  physicalExam: {
    general: '',
    vitalsNote: '',
    perSystem: '',
    doctorVerified: true,
    verifiedBy: 'doctor-1',
  },
  problems: [],
  plan: [],
  references: [],
  signedBy: 'doctor-1',
  signedAt: '2026-09-18T10:00:00.000Z',
}

const vitals: VitalSign[] = [
  {
    id: 'v-1',
    takenAt: '2026-09-18T09:10:00.000Z',
    systolic: 121,
    diastolic: 78,
    heartRate: 68,
    respRate: 16,
    tempC: 36.7,
    spo2: 98,
  },
  {
    id: 'v-2',
    takenAt: '2026-09-18T09:30:00.000Z',
    systolic: 118,
    diastolic: 74,
    heartRate: 64,
    respRate: 15,
    tempC: 36.6,
    spo2: 99,
    glucose: 94,
  },
]

const projection = projectEmrToBodyClinicalBridge(
  record,
  vitals,
  [
    { key: 'heart', label: 'Heart', x: 60, y: 34, status: 'abnormal', note: 'Existing recorded finding.' },
    { key: 'lungs', label: 'Lungs', x: 38, y: 32, status: 'normal' },
    { key: 'skin', label: 'Skin', x: 28, y: 58, status: 'unchecked' },
  ],
  '2026-09-18T10:01:00.000Z',
)

assert.equal(projection.patientId, 'patient-1')
assert.equal(projection.recordId, 'emr-1')
assert.equal(projection.reviewState, 'record-signed')
assert.deepEqual(projection.findingCounts, { normal: 1, abnormal: 1, unchecked: 1 })
assert.equal(projection.markers[0].source.kind, 'ai-emr')
assert.equal(projection.markers[0].source.recordId, 'emr-1')
assert.equal(projection.markers[0].reviewState, 'record-signed')
assert.equal(projection.signals.length, 6)
assert.equal(projection.signals[0].id, 'blood-pressure')
assert.equal(projection.signals[0].value, '118/74')
assert.equal(projection.signals[1].value, '64')
assert.ok(projection.signals.every((signal) => signal.sourceRecordId === 'v-2'))
assert.equal(projection.boundary.patientSpecificSignals, true)
assert.equal(projection.boundary.referenceAtlasGeometryPatientSpecific, false)
assert.equal(projection.boundary.diagnosticInferenceGenerated, false)
assert.equal(projection.boundary.autonomousClinicalActionAllowed, false)

const draftProjection = projectEmrToBodyClinicalBridge(
  {
    ...record,
    signedBy: undefined,
    signedAt: undefined,
    physicalExam: { ...record.physicalExam, doctorVerified: false, verifiedBy: undefined },
  },
  [],
  [],
)
assert.equal(draftProjection.reviewState, 'draft')
assert.equal(draftProjection.signals.length, 0)

console.log('AI-EMR → Clinical/Body Exposure visual bridge contract verified.')
