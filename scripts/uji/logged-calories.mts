import assert from 'node:assert/strict'
import { loggedSubtotal, loggedCaloriesToday, localCalorieDay } from '../../src/domains/personal-health/engine/loggedCalories.ts'

assert.deepEqual(loggedSubtotal([]), { total: null, recorded: 0, missing: 0, overflow: false })
assert.deepEqual(loggedSubtotal([0]), { total: 0, recorded: 1, missing: 0, overflow: false })
assert.deepEqual(loggedSubtotal([100, undefined, 0]), { total: 100, recorded: 2, missing: 1, overflow: false })
for (const invalid of [undefined, null, '', '0', '25', true, [], {}, -1, NaN, Infinity, -Infinity]) {
  assert.deepEqual(loggedSubtotal([invalid]), { total: null, recorded: 0, missing: 1, overflow: false })
}
assert.deepEqual(loggedSubtotal([Number.MAX_VALUE, Number.MAX_VALUE]), { total: null, recorded: 2, missing: 0, overflow: true })
for (let i = 0; i <= 1000; i++) {
  assert.deepEqual(loggedSubtotal([i, 0, null]), { total: i, recorded: 2, missing: 1, overflow: false })
}
for (const invalid of [NaN, Infinity, -Infinity, 1e100]) assert.equal(localCalorieDay(invalid), null)
const previous = process.env.TZ
try {
  const now = Date.UTC(2026, 9, 12, 20)
  process.env.TZ = 'Asia/Jakarta'
  const today = loggedCaloriesToday([{ date: '2026-10-13', kcal: 0 }, { date: '2026-10-12', kcal: 100 }], [{ mulai: new Date(now).toISOString() }], now)
  assert.equal(today.day, '2026-10-13')
  assert.equal(today.food.total, 0)
  assert.equal(today.training.total, null)
  assert.equal(today.training.missing, 1)
  process.env.TZ = 'America/Los_Angeles'
  assert.equal(loggedCaloriesToday([{ date: '2026-10-12', kcal: 25 }], [], now).food.total, 25)
} finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous }
console.log('logged calories: explicit zero, missing/partial/nonfinite/overflow and local-day boundaries PASS')
