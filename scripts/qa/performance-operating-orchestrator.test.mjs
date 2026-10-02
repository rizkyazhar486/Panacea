import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PERFORMANCE_OPERATING_POLICY,
  buildPerformanceOperatingDecision,
} from '../../src/lib/performanceOperatingOrchestrator.ts'

const criticalSafety = [{
  id: 'hazard',
  domain: 'heat-weather',
  severity: 'critical',
  source: 'authoritative-heat-adapter',
  capturedAt: '2026-09-20T00:00:00Z',
  confidence: 0.99,
  affectedScope: 'venue',
  rationale: 'Qualified upstream source classified a critical heat hazard.',
  authoritativeClassification: true,
}]

const safeInfo = [{
  id: 'clear',
  domain: 'general',
  severity: 'info',
  source: 'event-safety',
  capturedAt: '2026-09-20T00:00:00Z',
  confidence: 0.95,
  affectedScope: 'venue',
  rationale: 'No active hazard is classified by current authoritative sources.',
  authoritativeClassification: true,
}]

const coaching = [{
  id: 'aerobic',
  domain: 'aerobic',
  metricId: 'durability',
  normalizedValue: 0.5,
  confidence: 0.9,
  trend: 'declining',
  source: 'field-test',
}]

const resilience = [
  { id: 'r', taskClass: 'reaction', metricId: 'rt', baselineValue: 200, pressuredValue: 210, higherIsBetter: false, source: 'test', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['fatigue'] },
  { id: 'p', taskClass: 'precision', metricId: 'accuracy', baselineValue: 100, pressuredValue: 95, higherIsBetter: true, source: 'test', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['fatigue'] },
  { id: 'l', taskClass: 'locomotion', metricId: 'time', baselineValue: 60, pressuredValue: 66, higherIsBetter: false, source: 'test', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['load'] },
]

test('critical population safety blocks coaching regardless of performance data', () => {
  const decision = buildPerformanceOperatingDecision({
    sportId: 'tactical-fitness',
    safetySignals: criticalSafety,
    coachingSignals: coaching,
    resilienceTrials: resilience,
  })
  assert.equal(decision.mode, 'safety-blocked')
  assert.equal(decision.coaching.actions.length, 0)
  assert.equal(decision.safety.optimizePerformanceAllowed, false)
  assert.ok(decision.resilience.observedResilienceIndex != null)
  assert.equal(decision.populationSafetyOverride, true)
})

test('safe state enables actionable coaching', () => {
  const decision = buildPerformanceOperatingDecision({
    sportId: 'running-road',
    safetySignals: safeInfo,
    coachingSignals: coaching,
    resilienceTrials: resilience,
  })
  assert.equal(decision.mode, 'performance-enabled')
  assert.ok(decision.coaching.actions.length > 0)
  assert.ok(decision.nextActions.length > 1)
})

test('missing safety context fails closed before coaching', () => {
  const decision = buildPerformanceOperatingDecision({
    sportId: 'f1',
    safetySignals: [],
    coachingSignals: coaching,
    resilienceTrials: resilience,
  })
  assert.equal(decision.mode, 'safety-modified')
  assert.equal(decision.coaching.actions.length, 0)
  assert.equal(decision.safety.optimizePerformanceAllowed, false)
})

test('policy prevents resilience or graphs from becoming action authority', () => {
  assert.equal(PERFORMANCE_OPERATING_POLICY.populationSafetyAlwaysFirst, true)
  assert.equal(PERFORMANCE_OPERATING_POLICY.resilienceNeverOverridesSafety, true)
  assert.equal(PERFORMANCE_OPERATING_POLICY.scientificGraphsDoNotAuthorizeAction, true)
})
