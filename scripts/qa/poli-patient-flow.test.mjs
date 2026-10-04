import test from 'node:test'
import assert from 'node:assert/strict'
import { derivePoliPatientFlow } from '../../src/domains/clinical-operations/model/poliPatientFlow.ts'

const now = '2026-10-04T09:00:00.000Z'
const base = {
  patientId: 'p-1',
  name: 'Patient One',
  mrn: 'PMD-000001',
  dob: '1990-01-01',
  sex: 'L',
  riskFlagCount: 0,
  historyItemCount: 1,
  vitalTimestamps: ['2026-10-04T08:55:00.000Z'],
  supportiveSignals: [],
  record: {
    updatedAt: '2026-10-04T08:58:00.000Z',
    physicalExamClinicianVerified: true,
    recordClinicianSigned: true,
    proposedPlanCount: 0,
  },
}

test('complete recent patient state stays routine and longitudinal', () => {
  const row = derivePoliPatientFlow(base, now)
  assert.equal(row.priority, 'routine')
  assert.equal(row.freshness, 'recent')
  assert.equal(row.nextAction, 'Continue longitudinal monitoring and follow-up')
  assert.deepEqual(row.dataSources, ['Longitudinal history', 'Vitals', 'AI-EMR'])
  assert.equal(row.ageYears, 36)
})

test('critical recorded supportive result outranks routine workflow', () => {
  const row = derivePoliPatientFlow({
    ...base,
    supportiveSignals: [{ takenAt: '2026-10-04T08:59:00.000Z', category: 'Lab', flag: 'critical' }],
  }, now)
  assert.equal(row.priority, 'critical')
  assert.equal(row.hasCriticalResult, true)
  assert.equal(row.nextAction, 'Review critical result now')
})

test('missing observations fail closed to a data gap', () => {
  const row = derivePoliPatientFlow({ ...base, vitalTimestamps: [], supportiveSignals: [], record: undefined }, now)
  assert.equal(row.priority, 'data-gap')
  assert.equal(row.freshness, 'missing')
  assert.equal(row.latestAt, null)
  assert.equal(row.nextAction, 'Capture or ingest current observations')
})

test('unsigned clinician record remains review-required', () => {
  const row = derivePoliPatientFlow({
    ...base,
    record: { ...base.record, recordClinicianSigned: false },
  }, now)
  assert.equal(row.priority, 'review')
  assert.equal(row.nextAction, 'Review and sign the encounter')
})

test('invalid timestamps are surfaced as provenance gaps', () => {
  const row = derivePoliPatientFlow({ ...base, vitalTimestamps: ['not-a-time'] }, now)
  assert.equal(row.priority, 'data-gap')
  assert.equal(row.invalidTimestampCount, 1)
  assert.equal(row.nextAction, 'Reconcile timestamp and provenance gap')
})

test('invalid evaluation clock is rejected', () => {
  assert.throws(() => derivePoliPatientFlow(base, 'invalid'), /valid timestamp/)
})
