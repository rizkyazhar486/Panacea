import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeHumanSelf } from '../../src/domains/scientific-research/model/humanSelfUnderstanding.ts'

test('Human Self-Understanding Engine accurately translates somatic inputs into biological self-awareness', () => {
  const balancedUser = {
    heartRateVariability: 75,
    cortisolProxyLevel: 8.0,
    mitochondrialRespirationEfficiency: 92.0,
    subjectiveCognitiveClarity: 8.5
  }

  const profile = analyzeHumanSelf(balancedUser)
  assert.equal(profile.autonomicState, 'REST_AND_REGENERATE')
  assert.ok(profile.cellularResilienceIndex > 70)
  assert.ok(profile.reflectiveInsight.includes('harmonic balance'))

  const stressedUser = {
    heartRateVariability: 28,
    cortisolProxyLevel: 22.5,
    mitochondrialRespirationEfficiency: 55.0,
    subjectiveCognitiveClarity: 4.0
  }

  const stressProfile = analyzeHumanSelf(stressedUser)
  assert.equal(stressProfile.autonomicState, 'EXHAUSTION_CRITICAL')
  console.log('✅ Human Self-Understanding Engine Verified:', stressProfile)
})
