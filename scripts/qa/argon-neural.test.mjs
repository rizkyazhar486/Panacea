import assert from 'node:assert/strict'
import test from 'node:test'
import { computeArgonNeuralSync } from '../../src/domains/argon/argonNeuralCore.ts'

test('Argon Neural Core accurately evaluates telemetry harmony', () => {
  const result = computeArgonNeuralSync({
    nodeId: 'TEST-01',
    timestamp: Date.now(),
    perfusionFlux: 0.9,
    cellularEntropy: 0.1,
    autonomicResonance: 1.5,
    kineticLoad: 50.0
  })

  assert.equal(result.status, 'STABLE_HARMONY')
  assert.ok(result.confidenceScore > 80)
  console.log('✅ Argon Neural Core Test Passed:', result)
})
