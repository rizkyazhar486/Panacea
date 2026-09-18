import assert from 'node:assert/strict'
import {
  buildExplainableHealthAttribute,
  buildExplainableHealthAttributes,
} from '../../src/lib/explainableHealthAttributes.ts'
import type { LongitudinalTwinSnapshot } from '../../src/lib/longitudinalDigitalTwin.ts'

const provenance = {
  sourceKind: 'wearable' as const,
  sourceId: 'device-001',
  capturedAt: '2026-09-19T00:00:00.000Z',
  receivedAt: '2026-09-19T00:01:00.000Z',
  method: 'fixture',
  version: '1',
}

const snapshot: LongitudinalTwinSnapshot = {
  subjectId: 'subject-attributes-001',
  at: '2026-09-19T01:00:00.000Z',
  clock: 'known',
  surface: 'your-body',
  sourceRevision: 9,
  eventCount: 9,
  governance: {
    pendingClinicalReview: 0,
    blockedByConsent: 0,
  },
  boundary: {
    patientSpecificSignals: true,
    patientSpecificInternalGeometry: false,
    referenceAtlasGeometryMayBeUsedForOrientationOnly: true,
    diagnosticInferenceGenerated: false,
    autonomousClinicalActionAllowed: false,
    simulatedState: false,
  },
  signals: [
    {
      eventId: 'vo2',
      metric: 'vo2max',
      domain: 'fitness',
      value: 45,
      unit: 'mL/kg/min',
      recordedAt: '2026-09-18T08:00:00.000Z',
      confidence: 0.9,
      evidenceClass: 'sensor-recorded',
      displayState: 'recorded',
      reviewState: 'not-required',
      provenance,
    },
    {
      eventId: 'rhr',
      metric: 'resting-heart-rate',
      domain: 'vital',
      value: 58,
      unit: 'bpm',
      recordedAt: '2026-09-19T00:00:00.000Z',
      confidence: 0.92,
      evidenceClass: 'sensor-recorded',
      displayState: 'recorded',
      reviewState: 'not-required',
      provenance,
    },
    {
      eventId: 'sleep',
      metric: 'sleep-duration',
      domain: 'sleep',
      value: 7.4,
      unit: 'h',
      recordedAt: '2026-09-19T00:00:00.000Z',
      confidence: 0.85,
      evidenceClass: 'self-reported',
      displayState: 'recorded',
      reviewState: 'not-required',
      provenance: { ...provenance, sourceKind: 'manual', sourceId: 'manual-sleep' },
    },
    {
      eventId: 'muscle',
      metric: 'skeletal-muscle-mass',
      domain: 'longevity',
      value: 31,
      unit: 'kg',
      recordedAt: '2026-09-17T00:00:00.000Z',
      confidence: 0.88,
      evidenceClass: 'sensor-recorded',
      displayState: 'recorded',
      reviewState: 'not-required',
      provenance,
    },
    {
      eventId: 'weight',
      metric: 'weight',
      domain: 'longevity',
      value: 78,
      unit: 'kg',
      recordedAt: '2026-09-17T00:00:00.000Z',
      confidence: 0.88,
      evidenceClass: 'sensor-recorded',
      displayState: 'recorded',
      reviewState: 'not-required',
      provenance,
    },
  ],
}

const cardio = buildExplainableHealthAttribute(snapshot, 'cardio-fitness')
assert.equal(cardio.subjectId, snapshot.subjectId)
assert.equal(cardio.evidenceState, 'primary-observed')
assert.equal(cardio.coverage.primaryAvailable, 1)
assert.equal(cardio.coverage.primaryTotal, 2)
assert.equal(cardio.coverage.available, 2)
assert.equal(cardio.coverage.total, 4)
assert.equal(cardio.coverage.ratio, 0.5)
assert.equal(cardio.evidence.find((item) => item.metric === 'vo2max')?.signal?.value, 45)

const strength = buildExplainableHealthAttribute(snapshot, 'strength')
assert.equal(strength.evidenceState, 'supporting-only', 'muscle mass must not be treated as direct strength')
assert.equal(strength.coverage.primaryAvailable, 0)
assert.equal(strength.evidence.find((item) => item.metric === 'grip-strength')?.available, false)
assert.equal(strength.evidence.find((item) => item.metric === 'skeletal-muscle-mass')?.available, true)

const mobility = buildExplainableHealthAttribute(snapshot, 'mobility')
assert.equal(mobility.evidenceState, 'insufficient-evidence')
assert.equal(mobility.coverage.available, 0)
assert.equal(mobility.coverage.ratio, 0)

const sleep = buildExplainableHealthAttribute(snapshot, 'sleep')
assert.equal(sleep.evidenceState, 'primary-observed')
assert.equal(sleep.evidence.find((item) => item.metric === 'sleep-duration')?.signal?.evidenceClass, 'self-reported')

for (const attribute of buildExplainableHealthAttributes(snapshot)) {
  assert.equal(attribute.boundary.descriptiveOnly, true)
  assert.equal(attribute.boundary.diagnosticScore, false)
  assert.equal(attribute.boundary.validatedCompositeScore, false)
  assert.equal(attribute.boundary.coverageIsHealthQuality, false)
  assert.equal(Object.prototype.hasOwnProperty.call(attribute, 'score'), false, 'attributes must not fabricate a game-like health score')
}

console.log('Explainable Health Attributes verified: evidence-first attributes, primary/supporting distinction, truthful missingness, provenance retention and no arbitrary composite score.')
