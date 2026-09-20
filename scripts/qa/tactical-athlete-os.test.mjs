import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PUBLIC_TACTICAL_FRAMEWORKS,
  TACTICAL_ANALYZER_GRAPHS,
  TACTICAL_ATHLETE_OS_POLICY,
  fatigueDelta,
  fusePerformanceEvidence,
  performanceRetention,
  relativeExternalLoad,
  tacticalAthleteReadinessIndex,
} from '../../src/lib/tacticalAthleteOS.ts'

test('public tactical frameworks stay human-performance only', () => {
  assert.ok(PUBLIC_TACTICAL_FRAMEWORKS.some((x) => x.id === 'us-army-h2f'))
  assert.ok(PUBLIC_TACTICAL_FRAMEWORKS.some((x) => x.id === 'usmc-force-fitness'))
  assert.ok(PUBLIC_TACTICAL_FRAMEWORKS.some((x) => x.id === 'fbi-pft'))
  assert.equal(TACTICAL_ATHLETE_OS_POLICY.operationalMissionPlanningAllowed, false)
  assert.equal(TACTICAL_ATHLETE_OS_POLICY.weaponsOptimizationAllowed, false)
  assert.equal(TACTICAL_ATHLETE_OS_POLICY.targetingOrSurveillanceAllowed, false)
  assert.equal(TACTICAL_ATHLETE_OS_POLICY.pursuitEvasionCoachingAllowed, false)
})

test('relative load is body-mass normalized', () => {
  assert.equal(relativeExternalLoad(20, 80), 0.25)
  assert.equal(relativeExternalLoad(20, 0), null)
})

test('performance retention handles higher/lower-is-better tasks', () => {
  assert.equal(performanceRetention({
    unloadedOrFreshValue: 100,
    loadedOrFatiguedValue: 90,
    higherIsBetter: true,
  }), 0.9)

  assert.equal(performanceRetention({
    unloadedOrFreshValue: 50,
    loadedOrFatiguedValue: 55,
    higherIsBetter: false,
  }), 50 / 55)
})

test('fatigue delta is positive when performance worsens', () => {
  assert.equal(fatigueDelta({ baseline: 100, postTask: 90, higherIsBetter: true }), 0.1)
  assert.equal(fatigueDelta({ baseline: 200, postTask: 220, higherIsBetter: false }), 0.1)
})

test('readiness index is transparent and bounded by input validity', () => {
  const score = tacticalAthleteReadinessIndex({
    physicalCapacity: 0.8,
    loadedMobility: 0.7,
    recoverySleep: 0.9,
    cognitiveRetention: 0.8,
    environmentTolerance: 0.7,
    dataConfidence: 1,
  })
  assert.ok(score != null)
  assert.ok(score >= 0 && score <= 1)
  assert.equal(tacticalAthleteReadinessIndex({
    physicalCapacity: 1.2,
    loadedMobility: 0.7,
    recoverySleep: 0.9,
    cognitiveRetention: 0.8,
    environmentTolerance: 0.7,
    dataConfidence: 1,
  }), null)
})

test('evidence fusion keeps provenance and confidence weighting', () => {
  const fused = fusePerformanceEvidence([
    { id: 'watch', metricId: 'heart-rate', capturedAt: '2026-09-20T00:00:00Z', source: 'wearable-a', value: 150, unit: 'bpm', confidence: 0.8 },
    { id: 'strap', metricId: 'heart-rate', capturedAt: '2026-09-20T00:00:01Z', source: 'chest-strap', value: 148, unit: 'bpm', confidence: 1.0 },
    { id: 'bad-unit', metricId: 'heart-rate', capturedAt: '2026-09-20T00:00:02Z', source: 'bad', value: 2.5, unit: 'Hz', confidence: 1.0 },
  ], 'heart-rate', 'bpm')
  assert.ok(fused)
  assert.deepEqual(fused.sourceIds, ['watch','strap'])
  assert.ok(fused.value > 148 && fused.value < 150)
})

test('tactical analyzer graphs cover load, cognition, sleep and heat', () => {
  const ids = TACTICAL_ANALYZER_GRAPHS.map((x) => x.id)
  for (const id of ['loaded-vs-unloaded-pace','agility-load-retention','cognition-after-fatigue','sleep-readiness','heat-load-strain']) {
    assert.ok(ids.includes(id))
  }
})
