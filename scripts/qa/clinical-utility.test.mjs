import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateClinicalUtility } from '../../src/domains/clinical/clinicalUtilityKernel.ts'

test('Clinical Utility Workspace evaluates practical guidelines accurately', () => {
  const result = evaluateClinicalUtility({
    patientId: 'TEST-001',
    telomereHealthScore: 85,
    antimicrobialSensitivityIndex: 95,
    autonomicRecoveryHRV: 80
  })

  assert.equal(result.riskTier, 'OPTIMAL')
  assert.ok(result.actionableSteps.length > 0)
  console.log('✅ Clinical Utility Verified:', result)
})
