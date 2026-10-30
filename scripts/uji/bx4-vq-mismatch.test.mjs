import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateVQmismatch } from '../../src/domains/body-exposure/engine/vqMismatchEngine.ts'

test('BX-4 Golden Case: Normal physiological input computes valid A-a gradient', () => {
  const res = evaluateVQmismatch(95, 40, 0.21)
  assert.equal(res.status, 'normal')
  assert.equal(res.truthClass, 'derived')
  assert.ok(!isNaN(res.aAGradient))
})

test('BX-4 Negative Case: Out of range PaO2 input is explicitly rejected', () => {
  const res = evaluateVQmismatch(999, 40, 0.21) // PaO2 999 di luar batas fisiologis
  assert.equal(res.status, 'rejected')
  assert.ok(isNaN(res.aAGradient))
})
