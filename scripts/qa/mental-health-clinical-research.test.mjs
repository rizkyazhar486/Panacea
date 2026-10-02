import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MENTAL_HEALTH_COMPOUND_MODELS,
  MENTAL_HEALTH_DAILY_BEHAVIORS,
  compoundsForMentalHealthDomain,
  simulateNormalizedExposure,
  simulateReceptorOccupancy,
  summarizeMentalHealthRoutine,
} from '../../src/lib/mentalHealthClinicalResearch.ts'

test('every compound model keeps evidence, mechanism and prescribing boundary', () => {
  for (const model of MENTAL_HEALTH_COMPOUND_MODELS) {
    assert.ok(model.evidence.length > 0, `${model.id} must retain evidence`)
    assert.ok(model.mechanism.length >= 2, `${model.id} must retain a multistep mechanism`)
    assert.match(model.guardrail, /does not select a medicine/i)
    for (const source of model.evidence) {
      assert.match(source.pmid, /^\d+$/)
      assert.match(source.url, /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//)
    }
  }
})

test('loneliness compound research stays explicitly research-only', () => {
  const loneliness = compoundsForMentalHealthDomain('loneliness')
  assert.ok(loneliness.length > 0)
  for (const model of loneliness) {
    assert.equal(model.evidenceClass, 'research-only')
    assert.match(model.clinicalContext, /no established medication/i)
    assert.match(model.guardrail, /not.*established treatment for loneliness/i)
  }
})

test('zuranolone does not silently generalize postpartum approval to general MDD', () => {
  const model = MENTAL_HEALTH_COMPOUND_MODELS.find((item) => item.id === 'zuranolone')
  assert.ok(model)
  assert.match(model.clinicalContext, /postpartum depression/i)
  assert.match(model.clinicalContext, /must not generalize/i)
  assert.match(model.guardrail, /postpartum depression/i)
})

test('normalized exposure follows first-order half-life identity', () => {
  const atOneHalfLife = simulateNormalizedExposure({ halfLifeHours: 12, elapsedHours: 12 })
  const atTwoHalfLives = simulateNormalizedExposure({ halfLifeHours: 12, elapsedHours: 24 })
  assert.ok(atOneHalfLife)
  assert.ok(atTwoHalfLives)
  assert.equal(atOneHalfLife.fractionRemaining, 0.5)
  assert.equal(atTwoHalfLives.fractionRemaining, 0.25)
  assert.equal(atOneHalfLife.formula, 'C(t)/C0 = 2^(-t/t1/2)')
})

test('simple occupancy is 50% when ligand equals Kd', () => {
  const result = simulateReceptorOccupancy({
    ligandConcentration: 4,
    dissociationConstant: 4,
  })
  assert.ok(result)
  assert.equal(result.occupancyFraction, 0.5)
  assert.equal(result.formula, 'theta = [L] / (Kd + [L])')
})

test('invalid teaching parameters fail closed', () => {
  assert.equal(simulateNormalizedExposure({ halfLifeHours: 0, elapsedHours: 1 }), null)
  assert.equal(simulateNormalizedExposure({ halfLifeHours: 1, elapsedHours: -1 }), null)
  assert.equal(simulateReceptorOccupancy({ ligandConcentration: 1, dissociationConstant: 0 }), null)
})

test('routine foundation includes compulsion tracking without universal masturbation abstinence', () => {
  const ids = MENTAL_HEALTH_DAILY_BEHAVIORS.map((item) => item.id)
  assert.ok(ids.includes('compulsion-boundary'))
  assert.equal(ids.includes('masturbation-abstinence'), false)

  const compulsion = MENTAL_HEALTH_DAILY_BEHAVIORS.find((item) => item.id === 'compulsion-boundary')
  assert.ok(compulsion)
  assert.match(compulsion.boundary, /must not encode masturbation abstinence as a universal/i)
})

test('longitudinal routine summary is an adherence descriptor, not a diagnosis', () => {
  const summary = summarizeMentalHealthRoutine([
    {
      date: '2026-09-27T07:00:00Z',
      completed: { movement: true, 'social-connection': false },
    },
    {
      date: '2026-09-28T07:00:00Z',
      completed: { movement: true, 'social-connection': true },
    },
  ])

  assert.equal(summary.observedDays, 2)
  assert.equal(summary.completedActions, 3)
  assert.equal(summary.observedActions, 4)
  assert.equal(summary.completionFraction, 0.75)
  assert.equal(summary.longestObservedStreakDays, 2)
  assert.match(summary.interpretation, /does not diagnose depression, anxiety or loneliness/i)
})
