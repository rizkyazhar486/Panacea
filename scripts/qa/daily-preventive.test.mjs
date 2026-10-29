import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateDailyHealth } from '../../src/domains/clinical/model/dailyPreventiveEngine.ts'

test('Daily Preventive Engine delivers actionable, evidence-grounded lifestyle guidance', () => {
  const sampleUserDay = {
    userId: 'USER-DAILY-01',
    timestamp: Date.now(),
    restingHeartRate: 68,
    systolicBP: 124,
    diastolicBP: 80,
    sleepDurationHours: 6.5,
    dailyStepCount: 8500,
    subjectiveFatigueScore: 3
  }

  const guidance = evaluateDailyHealth(sampleUserDay)
  assert.equal(guidance.riskLevel, 'OPTIMAL')
  assert.ok(guidance.hydrationTargetMl >= 2000)
  assert.ok(guidance.actionableAdvice.length > 0)
  assert.ok(guidance.provenanceReferences.length > 0)
  console.log('✅ Daily Preventive & Lifestyle Guidance Verified:', guidance)
})
