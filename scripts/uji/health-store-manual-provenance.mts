import assert from 'node:assert/strict'
import { currentDeviceVitalsToLongitudinalEvents } from '../../src/lib/healthStoreLongitudinalBridge.ts'

const result = currentDeviceVitalsToLongitudinalEvents('self-manual', {
  heartRate: 64,
  source: 'Manual',
  measuredAt: '2026-09-17T01:20:00.000Z',
  syncedAt: '2026-09-17T01:20:01.000Z',
}, {
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  receivedAt: '2026-09-17T01:21:00.000Z',
  confidence: {
    clinicalVital: 0.98,
    selfVital: 0.85,
    vo2max: 0.80,
    deviceSnapshot: 0.92,
  },
})

assert.equal(result.events.length, 1)
assert.equal(result.events[0].metric, 'heart-rate')
assert.equal(result.events[0].value, 64)
assert.equal(result.events[0].provenance.sourceKind, 'manual')
assert.equal(result.events[0].provenance.sourceId, 'health-vitals:Manual')
assert.equal(result.events[0].provenance.method, 'shared-vitals-manual-entry')

console.log('Manual values stored through shared healthVitals retain manual provenance in longitudinal state.')