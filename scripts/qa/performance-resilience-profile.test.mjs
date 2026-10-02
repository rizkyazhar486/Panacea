import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PSYCHOMETRIC_POLICY,
  SAFE_TACTICAL_PERFORMANCE_MAPPINGS,
  buildObservedPerformanceResilienceProfile,
  taskRetention,
} from '../../src/lib/performanceResilienceProfile.ts'

test('task retention handles higher and lower is better measures', () => {
  const accuracy = taskRetention({
    id: 'accuracy',
    taskClass: 'precision',
    metricId: 'accuracy',
    baselineValue: 100,
    pressuredValue: 92,
    higherIsBetter: true,
    source: 'test',
    capturedAt: '2026-09-20T00:00:00Z',
    confidence: 1,
    contextTags: ['fatigue'],
  })
  const reaction = taskRetention({
    id: 'reaction',
    taskClass: 'reaction',
    metricId: 'reaction-time',
    baselineValue: 200,
    pressuredValue: 220,
    higherIsBetter: false,
    source: 'test',
    capturedAt: '2026-09-20T00:00:00Z',
    confidence: 1,
    contextTags: ['fatigue'],
  })
  assert.equal(accuracy?.retention, 0.92)
  assert.equal(reaction?.retention, 200 / 220)
})

test('cross-domain objective resilience requires at least three task classes', () => {
  const one = buildObservedPerformanceResilienceProfile([{
    id: 'r1', taskClass: 'reaction', metricId: 'rt',
    baselineValue: 200, pressuredValue: 210, higherIsBetter: false,
    source: 'a', capturedAt: '2026-09-20T00:00:00Z',
    confidence: 0.9, contextTags: ['fatigue'],
  }])
  assert.equal(one.observedResilienceIndex, null)

  const enough = buildObservedPerformanceResilienceProfile([
    { id: 'r1', taskClass: 'reaction', metricId: 'rt', baselineValue: 200, pressuredValue: 210, higherIsBetter: false, source: 'a', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['fatigue'] },
    { id: 'p1', taskClass: 'precision', metricId: 'accuracy', baselineValue: 100, pressuredValue: 95, higherIsBetter: true, source: 'b', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['fatigue'] },
    { id: 'l1', taskClass: 'locomotion', metricId: 'course-time', baselineValue: 60, pressuredValue: 66, higherIsBetter: false, source: 'c', capturedAt: '2026-09-20T00:00:00Z', confidence: 0.9, contextTags: ['load'] },
  ])
  assert.ok(enough.observedResilienceIndex != null)
  assert.equal(enough.label, 'objective-performance-retention')
  assert.match(enough.interpretationBoundary, /not mental toughness/i)
})

test('psychometric and objective performance remain separate', () => {
  assert.equal(PSYCHOMETRIC_POLICY.selfReportKeptSeparateFromObjectivePerformance, true)
  assert.equal(PSYCHOMETRIC_POLICY.noWearableInferenceOfMentalState, true)
  assert.equal(PSYCHOMETRIC_POLICY.noUnvalidatedCompositeMentalToughnessScore, true)
})

test('high-risk requests map only to benign performance equivalents', () => {
  const requested = SAFE_TACTICAL_PERFORMANCE_MAPPINGS.map((x) => x.requestedCapability)
  for (const id of [
    'weapon-optimization','human-targeting','covert-surveillance',
    'pursuit-evasion','operational-mission-planning','mental-toughness-score',
  ]) assert.ok(requested.includes(id))
})
