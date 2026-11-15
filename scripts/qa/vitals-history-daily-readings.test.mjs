// A day in the vitals history holds the readings that arrived that day — not the whole merged snapshot. mergeVitals
// keeps every last-known value in the current snapshot (unchanged); the history row it writes used to copy that
// snapshot, so on a day when only some signals synced the others were repeated as if measured again (one blood
// pressure reading became "the last 14 readings"; a personal range narrowed on copies). Dates are driven by mocked
// timers; storage is an in-memory map.
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'

const { ambilRiwayat, deretMetrik } = await import('../../src/lib/riwayatVitals.ts')
const { getVitals, mergeVitals } = await import('../../src/lib/healthVitals.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')

const memory = new Map()
globalThis.localStorage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: (k) => memory.delete(k) }
globalThis.BroadcastChannel = undefined

const DAY_1 = Date.parse('2026-10-05T10:00:00Z')
const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Signs account A in at `at`, then runs each sync at its own instant and waits for the deferred history write. */
async function syncs(steps) {
  for (const [at, patch] of steps) {
    mock.timers.setTime(at)
    memory.set('panaceamed.session.v1', JSON.stringify({ account: { id: 'A', patientId: 'A' }, loginAt: at }))
    bindPersonalHealthAccount({ id: 'A', patientId: 'A' })
    mergeVitals(patch)
    await new Promise((resolve) => setImmediate(resolve))
  }
}
const rows = () => ambilRiwayat().map((day) => day.nilai)

test.beforeEach(() => {
  memory.clear()
  bindPersonalHealthAccount(undefined)
  mock.timers.enable({ apis: ['Date'], now: DAY_1 })
})
test.afterEach(() => {
  mock.timers.reset()
  bindPersonalHealthAccount(undefined)
})

test('a_day_holds_only_the_signals_that_arrived_that_day', async () => {
  await syncs([[DAY_1, { steps: 8000, restingHr: 60 }], [DAY_1 + DAY, { restingHr: 62 }]])
  assert.deepEqual(rows(), [{ steps: 8000, restingHr: 60 }, { restingHr: 62 }])
  assert.equal(deretMetrik('steps').length, 1, 'one steps reading, not one per day with any sync')
})

test('twin_a_day_that_synced_both_signals_holds_both', async () => {
  await syncs([[DAY_1, { steps: 8000, restingHr: 60 }], [DAY_1 + DAY, { steps: 9100, restingHr: 62 }]])
  assert.deepEqual(rows(), [{ steps: 8000, restingHr: 60 }, { steps: 9100, restingHr: 62 }])
  assert.equal(deretMetrik('steps').length, 2)
})

test('a_second_sync_the_same_day_keeps_that_days_earlier_signals', async () => {
  await syncs([[DAY_1, { steps: 3000 }], [DAY_1 + 6 * HOUR, { restingHr: 58 }]])
  assert.deepEqual(rows(), [{ steps: 3000, restingHr: 58 }], 'one row for the day, with both readings')
})

test('a_later_value_the_same_day_replaces_the_earlier_one', async () => {
  await syncs([[DAY_1, { steps: 3000 }], [DAY_1 + 6 * HOUR, { steps: 5200 }]])
  assert.deepEqual(rows(), [{ steps: 5200 }])
})

test('the_current_snapshot_still_keeps_every_last_known_value', async () => {
  await syncs([[DAY_1, { steps: 8000, restingHr: 60 }], [DAY_1 + DAY, { restingHr: 62 }]])
  const vitals = getVitals()
  assert.equal(vitals.steps, 8000, 'the snapshot shows the last known steps; only the history stopped copying it')
  assert.equal(vitals.restingHr, 62)
})

test('a_sync_with_no_usable_number_writes_no_row', async () => {
  await syncs([[DAY_1, { steps: 8000 }], [DAY_1 + DAY, { steps: -5, restingHr: Number.NaN, source: 'Watch' }]])
  assert.deepEqual(rows(), [{ steps: 8000 }], 'a day with nothing usable stays missing, never a copy of yesterday')
})
