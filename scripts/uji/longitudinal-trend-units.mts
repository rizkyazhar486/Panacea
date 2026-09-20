import assert from 'node:assert/strict'
import { createLongitudinalPatientState, ingestLongitudinalBatch, numericMetricTrend, buildContextPacket, type LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

function event(id: string, day: number, value: number, unit?: string): LongitudinalEvent<number> {
  const time = `2026-09-${day}T00:00:00.000Z`
  return {
    id, subjectId: 'patient', domain: 'vital', metric: 'measurement', value, unit,
    recordedAt: time, confidence: 1,
    provenance: { sourceKind: 'device', sourceId: 'fixture', capturedAt: time, receivedAt: time },
    consent: { granted: true, purposes: ['ai-context'], grantedAt: '2026-09-01T00:00:00.000Z' },
    review: { state: 'not-required' },
  }
}
function state(events: LongitudinalEvent<number>[]) {
  return ingestLongitudinalBatch(createLongitudinalPatientState('patient'), events)
}
const mixed = state([event('a', 18, 1, 'm'), event('b', 19, 100, 'cm')])
assert.equal(numericMetricTrend(mixed, 'measurement'), null, 'different units cannot create a numerical trend')
assert.equal(buildContextPacket(mixed, 'ai-chatbot', '2026-09-20T00:00:00.000Z').signals[0].trend, null)
assert.equal(Object.keys(mixed.eventsById).length, 2, 'mixed-unit source records remain available')
assert.equal(numericMetricTrend(state([event('a', 18, 1), event('b', 19, 2, 'm')]), 'measurement'), null, 'unknown and known units cannot mix')
assert.equal(numericMetricTrend(state([event('a', 18, 1, 'm'), event('b', 19, 3, 'm')]), 'measurement')?.slopePerDay, 2)
assert.equal(numericMetricTrend(state([event('a', 18, 1), event('b', 19, 3)]), 'measurement')?.slopePerDay, 2, 'unitless metrics retain existing behavior')
const windowed = state([event('a', 17, 100, 'cm'), event('b', 18, 1, 'm'), event('c', 19, 3, 'm')])
assert.equal(numericMetricTrend(windowed, 'measurement', '2026-09-18T00:00:00.000Z')?.slopePerDay, 2, 'unit consistency is checked within the requested window')
console.log('Numeric trends reject mixed units and preserve comparable/unitless/windowed history.')
