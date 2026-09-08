import assert from 'node:assert/strict'
import { buildPersonalBaseline } from '../../src/lib/healthProfileBaseline.ts'

const history = [
  { date: '2026-09-01', restingHr: 60, hrvMs: 50 },
  { date: '2026-09-02', restingHr: 58, hrvMs: 54 },
  { date: '2026-09-03', restingHr: 62, hrvMs: 48 },
  { date: '2026-09-04', restingHr: 59, hrvMs: 52 },
]

const baseline = buildPersonalBaseline(history, 'restingHr')
assert.ok(baseline)
assert.equal(baseline.scope, 'personal-descriptive-history-only')
assert.equal(baseline.method, 'nist-percentile-n-plus-one')
assert.equal(baseline.count, 4)
assert.equal(baseline.median, 59.5)
assert.equal(baseline.q1, 58.25)
assert.equal(baseline.q3, 61.5)
assert.equal(baseline.firstDate, '2026-09-01')
assert.equal(baseline.lastDate, '2026-09-04')

assert.equal(buildPersonalBaseline(history.slice(0, 2), 'restingHr'), null, 'fewer than three valid observations must not produce a baseline')
assert.equal(buildPersonalBaseline([{ date: 'bad-date', restingHr: 60 }, ...history.slice(0, 2)], 'restingHr'), null, 'malformed dates must not count toward the baseline')
assert.equal(buildPersonalBaseline([
  { date: '2026-09-01', restingHr: 0 },
  { date: '2026-09-02', restingHr: Number.NaN },
  { date: '2026-09-03', restingHr: 58 },
], 'restingHr'), null, 'non-positive and non-finite values must fail closed')

const many = Array.from({ length: 40 }, (_, i) => ({ date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`, sleepH: i + 1 }))
assert.equal(buildPersonalBaseline(many, 'sleepH')?.count, 30, 'baseline work must stay bounded to the latest 30 records')

console.log('Feature Factory health-profile baseline: descriptive-only, source-history bounded, NIST percentile method pinned, and invalid inputs fail closed.')
