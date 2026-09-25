import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emrRecordToLongitudinalEvents } from '../../src/lib/emrLongitudinalBridge.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'
import type { EMRRecord } from '../../src/lib/types.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization'] as const,
  grantedAt: '1970-01-01T00:00:00.000Z',
}

const signed: EMRRecord & { signedById?: string } = {
  id: 'emr-visit-1',
  patientId: 'practice-patient-44',
  createdAt: '2026-09-25T03:00:00.000Z',
  updatedAt: '2026-09-25T04:00:00.000Z',
  anamnesis: {
    keluhanUtama: 'Chest pain',
    rps: 'Central pressure for 2 hours',
    rpd: '',
    riwayatPengobatan: '',
    alergi: '',
    riwayatKeluarga: '',
    riwayatSosial: '',
  },
  physicalExam: {
    general: 'Alert',
    vitalsNote: 'BP 148/92',
    perSystem: 'Cardiovascular exam completed',
    doctorVerified: true,
    verifiedBy: 'Dr Verified',
  },
  problems: [{ id: 'p1', title: 'Chest pain', basis: 'History + exam', assessment: 'Needs ACS exclusion' }],
  primaryDiagnosis: { code: 'R07.9', title: 'Chest pain, unspecified', source: 'Dokter' },
  plan: [{ id: 'pl1', category: 'Follow-up', text: 'Urgent ECG and troponin review', source: 'Dokter', status: 'diverifikasi' }],
  references: [],
  signedBy: 'Dr Verified',
  signedById: 'doctor-server-id',
  signedAt: '2026-09-25T04:05:00.000Z',
}

const { events, skipped } = emrRecordToLongitudinalEvents(
  signed,
  'account-patient-1',
  consent,
  '2026-09-25T04:06:00.000Z',
)
assert.equal(skipped, 0)
assert.equal(events.length, 3, 'signed EMR must project note + diagnosis + verified plan')
assert.ok(events.every((e) => e.subjectId === 'account-patient-1'))
assert.ok(events.every((e) => e.domain === 'clinical-note'))
assert.ok(events.every((e) => e.review.state === 'accepted'))
assert.ok(events.every((e) => e.review.reviewerId === 'doctor-server-id'))
assert.ok(events.every((e) => e.provenance.sourceKind === 'clinical-system'))
assert.ok(events.every((e) => e.tags?.includes('clinician-signed')))
const diagnosisEvent = events.find((e) => e.metric === 'emr.primary-diagnosis')
const planEvent = events.find((e) => e.metric === 'emr.verified-plan')
const noteEvent = events.find((e) => e.metric === 'emr.signed-note')
assert.equal(diagnosisEvent?.value, 'R07.9 · Chest pain, unspecified')
assert.equal(planEvent?.value, 'Urgent ECG and troponin review')
assert.ok(diagnosisEvent?.tags?.includes('field-origin:clinician-entered'), 'canonical diagnosis lost field origin')
assert.ok(diagnosisEvent?.tags?.includes('field-review:clinician-reviewed'), 'canonical diagnosis lost review semantics')
assert.ok(planEvent?.tags?.includes('field-origin:clinician-entered'), 'canonical plan lost field origin')
assert.ok(planEvent?.tags?.includes('field-review:clinician-verified'), 'canonical verified plan lost verification semantics')
assert.ok(noteEvent?.tags?.includes('field-origin:unknown'), 'canonical note guessed an authorship not present in schema')

let state = createLongitudinalPatientState('account-patient-1', '2026-09-25T04:06:00.000Z')
for (const event of events) state = ingestLongitudinalEvent(state, event).state
assert.equal(state.revision, 3)

const unsigned = { ...signed, id: 'emr-visit-2', signedAt: undefined, signedBy: undefined, signedById: undefined }
assert.equal(emrRecordToLongitudinalEvents(unsigned, 'account-patient-1', consent, '2026-09-25T04:06:00.000Z').events.length, 0, 'unsigned AI draft must never enter canonical state as clinician fact')

const source = readFileSync('src/lib/useLongitudinalState.ts', 'utf8')
assert.match(source, /api\.clinical\(\)/, 'runtime hook does not load server-accepted EMR')
assert.match(source, /emrRecordToLongitudinalEvents\(/, 'runtime hook does not project signed EMR into canonical state')

console.log('emr-status-longitudinal: only server-signed EMR semantics enter canonical patient state')
