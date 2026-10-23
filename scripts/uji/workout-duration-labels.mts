import assert from 'node:assert/strict'
import { fmtDurasi, fmtWorkoutDurasi } from '../../src/lib/workoutImport.ts'

assert.equal(fmtDurasi(0), '0 menit', 'generic formatting still represents a known numeric zero')
assert.equal(fmtWorkoutDurasi({ durasi: 0 }), '—', 'ambiguous legacy zero is not a measured duration')
assert.equal(fmtWorkoutDurasi({ durasi: 0, durationSource: 'source_field' }), '0 menit')
assert.equal(fmtWorkoutDurasi({ durasi: 1800, durationSource: 'unknown' }), '—')
for (const value of [undefined, null, '', '0', -1, NaN, Infinity, {}, []]) assert.equal(fmtWorkoutDurasi({ durasi: value }), '—')
for (let seconds = 0; seconds <= 7200; seconds += 30) {
  assert.equal(fmtWorkoutDurasi({ durasi: seconds, durationSource: 'source_field' }), fmtDurasi(seconds))
}
const row = { mulai: '2026-10-12T00:00:00Z', selesai: '2026-10-12T00:30:00Z', durasi: 1800, durationSource: 'timestamps' }
assert.equal(fmtWorkoutDurasi(row), '30 menit')
assert.equal(fmtWorkoutDurasi({ ...row, durasi: 1801 }), '—')
console.log('workout detail labels: unknown ≠ zero; known precision and timestamp consistency preserved')
