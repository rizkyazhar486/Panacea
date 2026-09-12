import assert from 'node:assert/strict'
import { advanceDigestiveFlowTime, digestiveFlowVisualState, digestiveVisualPeriodSeconds } from '../../src/lib/digestiveFlowVisual.ts'

for (const phase of ['upper', 'small-bowel', 'colon'] as const) {
  const period = digestiveVisualPeriodSeconds(phase)
  assert.ok(period > 0)
  const start = digestiveFlowVisualState(0, phase)
  const wrap = digestiveFlowVisualState(period, phase)
  assert.equal(start.progress, wrap.progress)
  assert.ok(start.particleOpacity >= 0 && start.particleOpacity <= 1)
  assert.ok(start.organEmphasis >= 0 && start.organEmphasis <= 1)
}

assert.equal(advanceDigestiveFlowTime(2, 0.25, true), 2.25)
assert.equal(advanceDigestiveFlowTime(2, 0.25, false), 2)
assert.equal(advanceDigestiveFlowTime(Number.NaN, 0.25, true), 0.25)
assert.equal(advanceDigestiveFlowTime(2, Number.NaN, true), 2)
assert.equal(advanceDigestiveFlowTime(-2, -1, true), 0)

assert.equal(digestiveFlowVisualState(Number.NaN, 'upper').progress, 0)
assert.equal(digestiveFlowVisualState(-10, 'colon').progress, 0)
console.log('digestive flow visual state: ok')
