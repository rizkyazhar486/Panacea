import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCoachingPlan } from '../../src/lib/tacticalPerformanceCoach.ts'

test('coach generates procedures, progression and reassessment instead of numbers only', () => {
  const plan = buildCoachingPlan([
    { id: 'load', domain: 'loaded-mobility', metricId: 'retention', normalizedValue: 0.48, confidence: 0.9, trend: 'declining', source: 'field-test' },
    { id: 'sleep', domain: 'sleep-recovery', metricId: 'sleep', normalizedValue: 0.62, confidence: 0.8, trend: 'stable', source: 'wearable' },
    { id: 'cog', domain: 'cognition', metricId: 'reaction-retention', normalizedValue: 0.72, confidence: 0.85, trend: 'stable', source: 'test' },
  ], 'tactical-fitness')

  assert.ok(plan.actions.length >= 3)
  const first = plan.actions[0]
  assert.ok(first.procedure.length >= 3)
  assert.ok(first.progression.length >= 2)
  assert.ok(first.reassess.length > 0)
  assert.ok(first.stopOrModifyWhen.length > 0)
  assert.equal(first.priority, 'high-priority')
})

test('coach is fail-closed on invalid signals', () => {
  const plan = buildCoachingPlan([
    { id: 'bad', domain: 'aerobic', metricId: 'x', normalizedValue: 1.5, confidence: 1, source: 'x' },
  ])
  assert.equal(plan.actions.length, 0)
  assert.match(plan.summary, /not enough/i)
})

test('coach boundary excludes harmful operational capability', () => {
  const plan = buildCoachingPlan([
    { id: 'p', domain: 'precision', metricId: 'accuracy', normalizedValue: 0.7, confidence: 1, source: 'sport-task' },
  ])
  assert.match(plan.boundary, /weapon-use optimization/i)
  assert.match(plan.boundary, /human targeting/i)
  assert.match(plan.boundary, /covert surveillance/i)
})
