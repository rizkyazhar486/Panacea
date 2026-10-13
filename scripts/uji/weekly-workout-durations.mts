import assert from 'node:assert/strict'
import { weeklyWorkoutDurations } from '../../src/domains/personal-health/engine/weeklyWorkoutDurations.ts'
const now = Date.UTC(2026, 9, 12, 20)
const row = { id: 'synthetic', mulai: new Date(now).toISOString(), selesai: new Date(now).toISOString() }
assert.deepEqual(weeklyWorkoutDurations([], now).at(-1), { total: null, recorded: 0, missing: 0, overflow: false })
assert.deepEqual(weeklyWorkoutDurations([{ ...row, durasi: 0 }], now).at(-1), { total: null, recorded: 0, missing: 1, overflow: false })
assert.deepEqual(weeklyWorkoutDurations([{ ...row, durasi: 0, durationSource: 'source_field' }], now).at(-1), { total: 0, recorded: 1, missing: 0, overflow: false })
assert.deepEqual(weeklyWorkoutDurations([{ ...row, durasi: 1800 }, { ...row, durasi: 0, durationSource: 'unknown' }], now).at(-1), { total: 30, recorded: 1, missing: 1, overflow: false })
for (let minutes = 0; minutes <= 1000; minutes++) assert.equal(weeklyWorkoutDurations([{ ...row, durasi: minutes * 60, durationSource: 'source_field' }], now).at(-1)!.total, minutes)
assert.equal(weeklyWorkoutDurations([{ ...row, mulai: new Date(now - 7 * 864e5).toISOString(), durasi: 60 }], now).at(-2)!.total, 1, 'shared boundary counts exactly once in the earlier bin')
assert.equal(weeklyWorkoutDurations([{ ...row, mulai: new Date(now + 1).toISOString(), durasi: 60 }], now).at(-1)!.total, null)
assert.equal(weeklyWorkoutDurations(Array.from({ length: 100 }, () => ({ ...row, durasi: Number.MAX_VALUE })), now).at(-1)!.overflow, true)
for (const invalid of [NaN, Infinity, 1e100]) assert.ok(weeklyWorkoutDurations([{ ...row, durasi: 60 }], invalid).every(x => x.total === null))
console.log('weekly workouts: unknown is not zero, recorded zero, partial totals, bin boundaries and overflow PASS')
