import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeHumanSelf } from '../../src/domains/scientific-research/model/humanSelfUnderstanding.ts'

test('illustrative human-self composition is bounded and explicitly nonclinical', () => {
  const balancedUser = {
    heartRateVariability: 75,
    cortisolProxyLevel: 8.0,
    mitochondrialRespirationEfficiency: 92.0,
    subjectiveCognitiveClarity: 8.5
  }

  const profile = analyzeHumanSelf(balancedUser)
  assert.equal(profile.autonomicState, 'REST_AND_REGENERATE')
  // 92*0.6 + min(100, 75*0.8)*0.4 - 8*2 = 63.2.
  // This checks arithmetic, not a validated biological threshold.
  assert.equal(profile.cellularResilienceIndex, 63.2)
  assert.equal(profile.evidenceStatus, 'ILLUSTRATIVE_UNVALIDATED')
  assert.equal(profile.clinicallyReviewed, false)
  assert.match(profile.reflectiveInsight, /research-only/)

  const stressedUser = {
    heartRateVariability: 28,
    cortisolProxyLevel: 22.5,
    mitochondrialRespirationEfficiency: 55.0,
    subjectiveCognitiveClarity: 4.0
  }

  const stressProfile = analyzeHumanSelf(stressedUser)
  assert.equal(stressProfile.autonomicState, 'EXHAUSTION_CRITICAL')
  assert.ok(stressProfile.cellularResilienceIndex < profile.cellularResilienceIndex)
  assert.equal(stressProfile.clinicallyReviewed, false)
  assert.equal(analyzeHumanSelf(balancedUser).auditHash, profile.auditHash)
})

test('invalid illustrative inputs fail closed rather than reporting health states', () => {
  const valid = {
    heartRateVariability: 75,
    cortisolProxyLevel: 8,
    mitochondrialRespirationEfficiency: 92,
    subjectiveCognitiveClarity: 8.5
  }
  for (const patch of [
    { heartRateVariability: NaN },
    { cortisolProxyLevel: Infinity },
    { heartRateVariability: -1 },
    { mitochondrialRespirationEfficiency: 120 },
    { subjectiveCognitiveClarity: 11 }
  ]) {
    assert.throws(() => analyzeHumanSelf({ ...valid, ...patch }))
  }
})
