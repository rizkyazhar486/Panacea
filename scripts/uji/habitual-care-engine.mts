import assert from 'node:assert/strict'
import { evaluateHabitualCare } from '../../src/lib/habitualCareEngine.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-08-01T00:00:00.000Z',
}

function numericEvent(
  id: string,
  metric: string,
  domain: LongitudinalEvent['domain'],
  value: number,
  recordedAt: string,
  review: LongitudinalEvent['review'] = { state: 'not-required' },
): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'habitual-demo',
    domain,
    metric,
    value,
    recordedAt,
    confidence: 0.9,
    provenance: {
      sourceKind: domain === 'lab' ? 'clinical-system' : 'wearable',
      sourceId: domain === 'lab' ? 'lab-demo' : 'wearable-demo',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 30_000).toISOString(),
    },
    consent,
    review,
  }
}

let state = createLongitudinalPatientState('habitual-demo', '2026-08-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  numericEvent('sleep-b1', 'sleep-duration', 'sleep', 7.9, '2026-09-01T00:00:00.000Z'),
  numericEvent('sleep-b2', 'sleep-duration', 'sleep', 8.1, '2026-09-03T00:00:00.000Z'),
  numericEvent('sleep-b3', 'sleep-duration', 'sleep', 8.0, '2026-09-05T00:00:00.000Z'),
  numericEvent('sleep-r1', 'sleep-duration', 'sleep', 6.6, '2026-09-12T00:00:00.000Z'),
  numericEvent('sleep-r2', 'sleep-duration', 'sleep', 6.4, '2026-09-14T00:00:00.000Z'),
  numericEvent('sleep-r3', 'sleep-duration', 'sleep', 6.5, '2026-09-16T00:00:00.000Z'),
  numericEvent('lab-b1', 'demo-lab-marker', 'lab', 100, '2026-09-01T00:00:00.000Z', { state: 'accepted', reviewerId: 'clin-1', reviewedAt: '2026-09-01T02:00:00.000Z' }),
  numericEvent('lab-b2', 'demo-lab-marker', 'lab', 102, '2026-09-04T00:00:00.000Z', { state: 'accepted', reviewerId: 'clin-1', reviewedAt: '2026-09-04T02:00:00.000Z' }),
  numericEvent('lab-r1', 'demo-lab-marker', 'lab', 125, '2026-09-13T00:00:00.000Z', { state: 'accepted', reviewerId: 'clin-1', reviewedAt: '2026-09-13T02:00:00.000Z' }),
  numericEvent('lab-r2', 'demo-lab-marker', 'lab', 128, '2026-09-16T00:00:00.000Z', { state: 'accepted', reviewerId: 'clin-1', reviewedAt: '2026-09-16T02:00:00.000Z' }),
])

const result = evaluateHabitualCare(state, [
  {
    metric: 'sleep-duration',
    recentWindowDays: 7,
    baselineLookbackDays: 21,
    relativeChangeThreshold: 0.1,
    minRecentSamples: 3,
    minBaselineSamples: 3,
  },
  {
    metric: 'demo-lab-marker',
    recentWindowDays: 7,
    baselineLookbackDays: 21,
    relativeChangeThreshold: 0.15,
    minRecentSamples: 2,
    minBaselineSamples: 2,
  },
], '2026-09-17T00:00:00.000Z')

assert.equal(result.signals.length, 2)
assert.equal(result.governance.autonomousClinicalActionAllowed, false)
assert.equal(result.governance.thresholdsArePresentationRulesNotClinicalCutoffs, true)

const sleep = result.signals.find((signal) => signal.metric === 'sleep-duration')
assert.ok(sleep)
assert.equal(sleep.direction, 'falling')
assert.equal(sleep.baselineMedian, 8)
assert.equal(sleep.recentMedian, 6.5)
assert.equal(sleep.clinicianReviewRequired, false)
assert.equal(result.actions.find((action) => action.metric === 'sleep-duration')?.surface, 'your-body')

const lab = result.signals.find((signal) => signal.metric === 'demo-lab-marker')
assert.ok(lab)
assert.equal(lab.direction, 'rising')
assert.equal(lab.clinicianReviewRequired, true)
assert.equal(lab.autonomousClinicalActionAllowed, false)
assert.equal(result.actions.find((action) => action.metric === 'demo-lab-marker')?.surface, 'clinical')
assert.equal(result.actions.find((action) => action.metric === 'demo-lab-marker')?.requiresHumanReview, true)

assert.throws(() => evaluateHabitualCare(state, [{
  metric: 'sleep-duration',
  recentWindowDays: 7,
  baselineLookbackDays: 7,
  relativeChangeThreshold: 0.1,
  minRecentSamples: 2,
  minBaselineSamples: 2,
}], '2026-09-17T00:00:00.000Z'), /baselineLookbackDays/)

console.log('Habitual care engine verified: caller-defined presentation thresholds, median baseline/recent change detection, provenance-aware signals, and clinician-only clinical handoff.')
