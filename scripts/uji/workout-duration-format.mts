import assert from 'node:assert/strict'
import { fmtDurasi } from '../../src/lib/workoutImport.ts'

assert.equal(fmtDurasi(0), '0 menit')
assert.equal(fmtDurasi(60), '1 menit')
assert.equal(fmtDurasi(3569), '59 menit')
assert.equal(fmtDurasi(3570), '1j 0m', '59m30s should round to the next hour without producing 60m')
assert.equal(fmtDurasi(3599), '1j 0m', '59m59s must roll over cleanly')
assert.equal(fmtDurasi(3600), '1j 0m')
assert.equal(fmtDurasi(3660), '1j 1m')
assert.equal(fmtDurasi(7199), '2j 0m')
assert.equal(fmtDurasi(-1), '—')
assert.equal(fmtDurasi(Number.NaN), '—')
assert.equal(fmtDurasi(Number.POSITIVE_INFINITY), '—')

console.log('Duration formatter rounds total minutes before splitting hours and minutes.')
