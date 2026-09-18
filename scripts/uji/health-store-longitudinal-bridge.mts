import assert from 'node:assert/strict'
import {
  clinicalVitalToLongitudinalEvents,
  currentDeviceVitalsToLongitudinalEvents,
  selfVitalToLongitudinalEvents,
  vo2MaxToLongitudinalEvent,
} from '../../src/lib/healthStoreLongitudinalBridge.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

const context = {
  consent,
  receivedAt: '2026-09-17T01:30:00.000Z',
  confidence: {
    clinicalVital: 0.98,
    selfVital: 0.85,
    vo2max: 0.80,
    deviceSnapshot: 0.92,
  },
} as const

const clinical = clinicalVitalToLongitudinalEvents('patient-42', {
  id: 'vital-1',
  takenAt: '2026-09-17T01:00:00.000Z',
  systolic: 118,
  diastolic: 74,
  heartRate: 62,
  respRate: 16,
  tempC: 36.7,
  spo2: 98,
  glucose: 96,
  note: 'real stored reading',
}, context)

assert.equal(clinical.events.length, 7)
assert.equal(clinical.skipped.length, 0)
assert.deepEqual(
  clinical.events.map((event) => event.metric),
  ['blood-pressure-systolic', 'blood-pressure-diastolic', 'heart-rate', 'respiratory-rate', 'body-temperature', 'spo2', 'glucose'],
)
assert.equal(clinical.events[0].subjectId, 'patient-42')
assert.equal(clinical.events[0].recordedAt, '2026-09-17T01:00:00.000Z')
assert.equal(clinical.events[0].confidence, 0.98)
assert.equal(clinical.events[0].provenance.sourceKind, 'clinical-system')
assert.equal(clinical.events[0].provenance.sourceId, 'panaceamed:clinical-vitals')
assert.ok(clinical.events.every((event) => event.id.includes('vital-1')))
assert.ok(clinical.events.every((event) => event.review.state === 'not-required'))

const self = selfVitalToLongitudinalEvents('self-42', {
  id: 'self-vital-1',
  at: '2026-09-16T23:00:00.000Z',
  systolic: 121,
  diastolic: 77,
  heartRate: 59,
  spo2: 99,
  tempC: 36.5,
}, context)
assert.equal(self.events.length, 5)
assert.ok(self.events.every((event) => event.provenance.sourceKind === 'manual'))
assert.ok(self.events.every((event) => event.provenance.sourceId === 'panaceamed:self-vitals'))
assert.ok(self.events.every((event) => event.tags?.includes('record:self-vital-1')))

const vo2 = vo2MaxToLongitudinalEvent('self-42', {
  id: 'vo2-1',
  at: '2026-09-15T12:00:00.000Z',
  value: 47.3,
  method: 'Tes Cooper',
}, context)
assert.equal(vo2.metric, 'vo2max')
assert.equal(vo2.unit, 'mL/kg/min')
assert.equal(vo2.provenance.method, 'Tes Cooper')
assert.equal(vo2.provenance.sourceKind, 'manual')
assert.equal(vo2.confidence, 0.80)

const device = currentDeviceVitalsToLongitudinalEvents('self-42', {
  heartRate: 57,
  restingHr: 54,
  hrvMs: 48,
  spo2Pct: 98,
  respRate: 14,
  systolic: 116,
  diastolic: 72,
  bodyTempC: 36.4,
  steps: 8241,
  activeKcal: 512,
  exerciseMin: 47,
  distanceKm: 6.3,
  sleepH: 7.4,
  vo2max: 48.1,
  weightKg: 70.2,
  source: 'Apple Watch',
  measuredAt: '2026-09-17T01:15:00.000Z',
  syncedAt: '2026-09-17T01:16:00.000Z',
}, context)
assert.equal(device.skipped.length, 0)
assert.ok(device.events.some((event) => event.metric === 'heart-rate' && event.value === 57 && event.unit === 'bpm'))
assert.ok(device.events.some((event) => event.metric === 'hrv' && event.value === 48 && event.unit === 'ms'))
assert.ok(device.events.some((event) => event.metric === 'sleep-duration' && event.value === 7.4 && event.unit === 'h'))
assert.ok(device.events.some((event) => event.metric === 'weight' && event.value === 70.2 && event.unit === 'kg'))
assert.ok(device.events.every((event) => event.recordedAt === '2026-09-17T01:15:00.000Z'))
assert.ok(device.events.every((event) => event.provenance.receivedAt === '2026-09-17T01:16:00.000Z'))
assert.ok(device.events.every((event) => event.provenance.sourceId === 'health-vitals:Apple Watch'))
assert.ok(device.events.every((event) => event.provenance.sourceKind === 'device'))

const noChronology = currentDeviceVitalsToLongitudinalEvents('self-42', {
  heartRate: 61,
  source: 'Apple Watch',
}, context)
assert.equal(noChronology.events.length, 0)
assert.deepEqual(noChronology.skipped, [{ sourceRecordId: 'current-device-vitals', reason: 'missing-measured-at' }])

const deterministic = currentDeviceVitalsToLongitudinalEvents('self-42', {
  heartRate: 57,
  source: 'Apple Watch',
  measuredAt: '2026-09-17T01:15:00.000Z',
  syncedAt: '2026-09-17T01:16:00.000Z',
}, context)
assert.equal(
  deterministic.events[0].id,
  'store:device:self-42:Apple-Watch:2026-09-17T01-15-00-000Z:heart-rate',
)

console.log('Production health-store → longitudinal bridge contract verified without synthetic measurements or timestamps.')