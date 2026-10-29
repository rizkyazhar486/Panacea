import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateOmegaConvergence } from '../../src/domains/argon/panaceaOmegaEngine.ts'

test('Omega Engine evaluates absolute convergence successfully', () => {
  const result = evaluateOmegaConvergence({
    recursionTier: 600,
    quantumCoherence: 0.99,
    biologicalEntropyControl: 98.0,
    omegaSyncActive: true
  })

  assert.ok(result.omegaHarmonicScore > 500)
  assert.equal(result.omegaTierStatus, 'OMEGA_CONVERGENCE_ACHIEVED')
  console.log('✅ Omega Convergence Verified:', result)
})
