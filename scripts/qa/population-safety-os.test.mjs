import test from 'node:test'
import assert from 'node:assert/strict'
import {
  POPULATION_SAFETY_POLICY,
  POPULATION_SAFETY_PRIORITY,
  evaluatePopulationSafety,
} from '../../src/lib/populationSafetyOS.ts'

const base = {
  source: 'authoritative-adapter',
  capturedAt: '2026-09-20T00:00:00Z',
  confidence: 0.95,
  affectedScope: 'team',
  authoritativeClassification: true,
}

test('population safety is explicitly above performance optimization', () => {
  assert.equal(POPULATION_SAFETY_POLICY.populationSafetyBeforePerformance, true)
  assert.equal(POPULATION_SAFETY_PRIORITY[0].rank, 1)
  assert.match(POPULATION_SAFETY_PRIORITY[0].concern, /life safety/i)
  assert.match(POPULATION_SAFETY_PRIORITY.at(-1)?.concern ?? '', /performance/i)
})

test('critical authoritative hazard stops optimization and escalates', () => {
  const decision = evaluatePopulationSafety([{
    ...base,
    id: 'critical',
    domain: 'medical-emergency',
    severity: 'critical',
    rationale: 'Upstream qualified safety adapter classified an emergency.',
  }])
  assert.equal(decision.action, 'stop-and-escalate')
  assert.equal(decision.optimizePerformanceAllowed, false)
  assert.ok(decision.requiredNextSteps.some((x) => /emergency/i.test(x)))
})

test('high hazard suspends activity', () => {
  const decision = evaluatePopulationSafety([{
    ...base,
    id: 'high',
    domain: 'heat-weather',
    severity: 'high',
    rationale: 'Authoritative heat-risk classification is high.',
  }])
  assert.equal(decision.action, 'suspend-activity')
  assert.equal(decision.optimizePerformanceAllowed, false)
})

test('unknown high-consequence state blocks optimization', () => {
  const decision = evaluatePopulationSafety([{
    ...base,
    id: 'unknown-comms',
    domain: 'communications',
    severity: 'unknown',
    rationale: 'Remote-event emergency communications state is unknown.',
    authoritativeClassification: false,
  }])
  assert.equal(decision.action, 'modify-activity')
  assert.equal(decision.optimizePerformanceAllowed, false)
})

test('absence of valid safety data fails closed', () => {
  const decision = evaluatePopulationSafety([])
  assert.equal(decision.action, 'monitor')
  assert.equal(decision.optimizePerformanceAllowed, false)
  assert.match(decision.boundary, /absence of evidence/i)
})

test('informational context permits optimization while retaining monitoring', () => {
  const decision = evaluatePopulationSafety([{
    ...base,
    id: 'info',
    domain: 'general',
    severity: 'info',
    rationale: 'No active hazard is classified by the current authoritative sources.',
  }])
  assert.equal(decision.action, 'continue')
  assert.equal(decision.optimizePerformanceAllowed, true)
})
