import assert from 'node:assert/strict'
import { createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'
import { syncProductionPersonalStores } from '../../src/lib/productionPersonalLongitudinalSync.ts'

const appState = {
  account: {
    email: 'owner@example.test',
    name: 'Owner',
    role: 'pasien' as const,
    isSubscriber: false,
    patientId: 'self-owner',
    loggedAt: '2026-09-18T00:00:00.000Z',
  },
  sleepLogs: [{
    id: 'sleep-1',
    date: '2026-09-17',
    hours: 7.5,
    bedtimeConsistent: true,
  }],
  gpsActivities: [
    {
      id: 'gps-own',
      email: 'owner@example.test',
      name: 'Morning run',
      sport: 'Lari',
      sportType: 'run',
      emoji: 'run',
      distKm: 5,
      durSec: 1800,
      avgSpeedKmh: 10,
      kcal: 350,
      at: '2026-09-17T23:00:00.000Z',
      avgHr: 150,
      maxHr: 175,
    },
    {
      id: 'gps-foreign',
      email: 'other@example.test',
      name: 'Other person',
      sport: 'Lari',
      sportType: 'run',
      emoji: 'run',
      distKm: 10,
      durSec: 3600,
      avgSpeedKmh: 10,
      kcal: 600,
      at: '2026-09-17T22:00:00.000Z',
    },
  ],
  trainingLogs: [{
    id: 'training-1',
    date: '2026-09-17',
    rpe: 7,
    type: 'Tempo run',
  }],
  foods: [{
    id: 'food-1',
    date: '2026-09-17',
    name: 'Example meal',
    grams: 300,
    kcal: 600,
    carbs: 75,
    protein: 35,
    fat: 18,
  }],
  wellness: {
    '2026-09-17': {
      date: '2026-09-17',
      sleepHr: 7,
      waterMl: 2200,
      exerciseKcal: 350,
      exerciseMin: 30,
      metHours: 5.5,
      tenaga: 4,
    },
  },
}

const context = {
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'ai-context'] as const,
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  receivedAt: '2026-09-18T01:00:00.000Z',
  confidence: {
    userReported: 0.85,
    derived: 0.9,
  },
}

const initial = createLongitudinalPatientState('self-owner', '2026-09-01T00:00:00.000Z')
const first = syncProductionPersonalStores({
  state: initial,
  appState,
  subjectId: 'self-owner',
  context,
})

assert.equal(first.excludedForeignGpsActivities, 1)
assert.equal(first.insertedEventCount, first.candidateEventCount)
assert.equal(first.duplicateEventCount, 0)
assert.ok(first.candidateEventCount > 10)

const events = Object.values(first.state.eventsById)
assert.ok(events.every((item) => item.subjectId === 'self-owner'))
assert.ok(events.every((item) => !item.id.includes('gps-foreign')))

const sleep = first.state.eventsById['personal:sleep:sleep-1:duration']
assert.ok(sleep)
assert.equal(sleep.recordedAt, '2026-09-17')
assert.equal(sleep.provenance.capturedAt, '2026-09-17')
assert.ok(sleep.tags?.includes('temporal-precision:day'))
assert.equal(sleep.confidence, 0.85)

const gps = first.state.eventsById['personal:gps:gps-own:distance']
assert.ok(gps)
assert.equal(gps.recordedAt, '2026-09-17T23:00:00.000Z')
assert.ok(gps.tags?.includes('temporal-precision:instant'))
assert.equal(gps.provenance.sourceKind, 'derived')
assert.equal(gps.confidence, 0.9)

const perceived = first.state.eventsById['personal:wellness:2026-09-17:perceived-energy']
assert.ok(perceived)
assert.equal(perceived.domain, 'other')
assert.ok(perceived.tags?.includes('subjective-not-physiologic'))
assert.equal(perceived.provenance.sourceKind, 'manual')

const repeat = syncProductionPersonalStores({
  state: first.state,
  appState,
  subjectId: 'self-owner',
  context,
})
assert.equal(repeat.insertedEventCount, 0)
assert.equal(repeat.duplicateEventCount, first.candidateEventCount)
assert.equal(repeat.state.revision, first.state.revision)

assert.throws(
  () => syncProductionPersonalStores({
    state: createLongitudinalPatientState('patient-b', '2026-09-01T00:00:00.000Z'),
    appState,
    subjectId: 'patient-b',
    context,
  }),
  /account\.patientId to match subjectId/,
)

const malformedDateState = {
  ...appState,
  sleepLogs: [{ ...appState.sleepLogs[0], date: '2026-09-17T12:00:00.000Z' }],
}
assert.throws(
  () => syncProductionPersonalStores({
    state: initial,
    appState: malformedDateState,
    subjectId: 'self-owner',
    context,
  }),
  /yyyy-mm-dd date/,
)

console.log('production personal longitudinal sync: ok')
