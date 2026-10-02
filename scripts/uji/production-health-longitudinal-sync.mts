import assert from 'node:assert/strict'
import { createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'
import { syncProductionHealthStores } from '../../src/lib/productionHealthLongitudinalSync.ts'

const context = {
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  receivedAt: '2026-09-17T01:30:00.000Z',
  confidence: {
    clinicalVital: 0.98,
    selfVital: 0.85,
    vo2max: 0.80,
    deviceSnapshot: 0.92,
  },
} as const

const request = {
  state: createLongitudinalPatientState('subject-1', '2026-09-01T00:00:00.000Z'),
  subjectId: 'subject-1',
  clinicalVitals: [{
    id: 'clinical-1',
    takenAt: '2026-09-16T20:00:00.000Z',
    systolic: 120,
    diastolic: 76,
    heartRate: 63,
    respRate: 16,
    tempC: 36.6,
    spo2: 98,
  }],
  selfVitals: [{
    id: 'self-1',
    at: '2026-09-16T21:00:00.000Z',
    systolic: 118,
    diastolic: 74,
    heartRate: 60,
    spo2: 99,
    tempC: 36.5,
  }],
  vo2maxLog: [{
    id: 'vo2-1',
    at: '2026-09-15T12:00:00.000Z',
    value: 47.8,
    method: 'Tes Cooper',
  }],
  currentVitals: {
    heartRate: 58,
    hrvMs: 51,
    source: 'Apple Watch',
    measuredAt: '2026-09-17T01:15:00.000Z',
    syncedAt: '2026-09-17T01:16:00.000Z',
  },
  context,
} as const

const first = syncProductionHealthStores(request)
assert.equal(first.candidateEventCount, 14)
assert.equal(first.insertedEventCount, 14)
assert.equal(first.duplicateEventCount, 0)
assert.equal(first.skipped.length, 0)
assert.equal(first.state.revision, 14)
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:clinical-vitals'))
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:self-vitals'))
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:vo2max-log'))
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'health-vitals:Apple Watch'))

const second = syncProductionHealthStores({ ...request, state: first.state })
assert.equal(second.candidateEventCount, 14)
assert.equal(second.insertedEventCount, 0)
assert.equal(second.duplicateEventCount, 14)
assert.equal(second.state.revision, 14)

const wrongSubject = createLongitudinalPatientState('another-subject', '2026-09-01T00:00:00.000Z')
assert.throws(
  () => syncProductionHealthStores({ ...request, state: wrongSubject }),
  /request.subjectId does not match state.subjectId/,
)

console.log('Production health stores sync idempotently into one longitudinal patient state without mixing subjects.')