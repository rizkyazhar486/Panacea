import test from 'node:test'
import assert from 'node:assert/strict'
import { perfSampleProblem, enoughPerfEvidence, minimumPerfSamples } from './perf-sample-coverage.mjs'
const observed = { lcpMs: 1100, cls: 0, tbtMs: 0 }
test('F2 accepts observed zero layout shift and TBT (not missing values)', () => {
  assert.equal(perfSampleProblem(observed), null)
  assert.equal(enoughPerfEvidence([observed, observed, observed], 3), true)
})
test('F2 missing, coerced, infinite and negative LCP/CLS/TBT are unmeasurable', () => {
  for (const name of ['lcpMs', 'cls', 'tbtMs']) for (const invalid of [undefined, null, '', '0', NaN, Infinity, -1]) {
    assert.match(perfSampleProblem({ ...observed, [name]: invalid }), /unmeasured/)
  }
  assert.equal(perfSampleProblem(null), 'malformed sample')
  assert.equal(perfSampleProblem([]), 'malformed sample')
  assert.equal(perfSampleProblem({ ...observed, galat: 'navigation timeout' }), 'navigation timeout')
})
test('F2 requires a majority of actually observed samples, not a single lucky sample', () => {
  assert.equal(enoughPerfEvidence([observed, observed, {}, {}, {}], 3), false)
  assert.equal(enoughPerfEvidence([observed, observed, observed, {}, {}], 3), true)
  for (const n of [0, -1, 1.5, NaN]) assert.equal(enoughPerfEvidence([observed], n), false)
})

test('F2 strict majority rejects half of even sample counts and invalid plans', () => {
  for (const [n, count] of [[1,1],[2,2],[3,2],[4,3],[5,3],[6,4]]) {
    assert.equal(minimumPerfSamples(n), count)
    const half = Array.from({ length: n }, (_, i) => i < Math.floor(n / 2) ? observed : {})
    assert.equal(enoughPerfEvidence(half, minimumPerfSamples(n)), false)
    const majority = Array.from({ length: n }, (_, i) => i < count ? observed : {})
    assert.equal(enoughPerfEvidence(majority, minimumPerfSamples(n)), true)
  }
  for (const invalid of [0, -1, 1.5, NaN, Infinity, '5', null, undefined]) assert.throws(() => minimumPerfSamples(invalid), /positive integer/)
})
