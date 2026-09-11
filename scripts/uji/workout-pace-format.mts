import assert from 'node:assert/strict'
import { fmtPace } from '../../src/lib/workoutImport.ts'

assert.equal(fmtPace(330), '5:30')
assert.equal(fmtPace(329.6), '5:30')
assert.equal(fmtPace(359.4), '5:59')
assert.equal(fmtPace(359.5), '6:00')
assert.equal(fmtPace(359.6), '6:00', 'rounding must carry into the next minute instead of producing 5:60')
assert.equal(fmtPace(59.6), '1:00')
assert.equal(fmtPace(60), '1:00')
assert.equal(fmtPace(0), '0:00')
assert.equal(fmtPace(-1), '—')
assert.equal(fmtPace(Number.NaN), '—')
assert.equal(fmtPace(Number.POSITIVE_INFINITY), '—')

console.log('Pace formatter rounds total seconds before splitting minutes and seconds.')
