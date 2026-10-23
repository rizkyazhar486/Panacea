import assert from 'node:assert/strict'
import { parseWorkouts } from '../../src/lib/workoutImport.ts'
import { getWorkouts, mergeWorkouts } from '../../src/lib/workoutStore.ts'
import { workoutDurationSeconds as duration } from '../../src/shared/kernel/workoutDurationEvidence.ts'

const start = '2026-09-01T00:00:00.000Z'
const end = '2026-09-01T00:10:00.000Z'
const parse = (fields: Record<string, unknown>) => parseWorkouts(JSON.stringify({ workouts: [{ id: 'test', start, ...fields }] }))[0]
const explicitZero = parse({ duration: 0, end, distance: 1 })
assert.equal(explicitZero.durasi, 0, 'explicit recorded zero must not be overwritten by positive elapsed time')
assert.equal(explicitZero.durationSource, 'source_field')
assert.equal(duration(explicitZero), 0)
assert.equal(explicitZero.kecepatanKmh, undefined, 'zero must not manufacture a calculated speed')
assert.equal(duration(parse({ duration: { qty: 0 }, end })), 0)
assert.equal(duration(parse({ end: start })), 0, 'real same-time start/end is known zero')
assert.equal(parse({ end: start }).durationSource, 'timestamps')
assert.equal(duration(parse({ end })), 600)
for (const invalid of [-1, 'invalid', null, { qty: -1 }]) {
  const derived = parse({ duration: invalid, end })
  assert.equal(derived.durationSource, 'timestamps')
  assert.equal(duration(derived), 600, 'invalid duration may use real ordered timestamps')
}
for (const fields of [{}, { duration: -1 }, { duration: '0' }, { end: 'bad' }, { end: '2026-08-01' }]) {
  const unknown = parse(fields)
  assert.equal(unknown.durasi, 0)
  assert.equal(unknown.durationSource, 'unknown')
  assert.equal(duration(unknown), null, 'missing/invalid source evidence must remain unknown')
}
for (const value of [null, undefined, 0, [], {}, { durasi: NaN }, { durasi: Infinity }, { durasi: -1 }, { durasi: '0' }, { durasi: 0 }, { durasi: 10, durationSource: 'unknown' }, { durasi: 10, durationSource: 'forged' }]) assert.equal(duration(value), null)
assert.equal(duration({ durasi: 10 }), 10, 'positive legacy duration remains backwards compatible')
for (const fields of [{ selesai: undefined }, { selesai: 'bad' }, { selesai: '2026-08-01' }, { selesai: end }]) {
  assert.equal(duration({ durasi: 0, durationSource: 'timestamps', mulai: start, ...fields }), null, 'timestamp label alone must not authenticate zero')
}

// Actual importer regression: finite seconds can still overflow the Date projection.
for (const overflow of [Number.MAX_VALUE, Number.MAX_SAFE_INTEGER]) {
  const unknown = parse({ duration: overflow })
  assert.equal(unknown.durasi, 0)
  assert.equal(unknown.durationSource, 'unknown')
  assert.equal(duration(unknown), null, 'unrepresentable source duration must not become observed zero')
  assert.equal(unknown.selesai, unknown.mulai)
  const derived = parse({ duration: overflow, end })
  assert.equal(derived.durationSource, 'timestamps')
  assert.equal(duration(derived), 600, 'only a genuinely valid end may replace unrepresentable duration')
}
const timeClip = 8.64e15
const nearLimitStart = new Date(timeClip - 1000).toISOString()
const lastRepresentable = parse({ start: nearLimitStart, duration: 1 })
assert.equal(lastRepresentable.durationSource, 'source_field')
assert.equal(duration(lastRepresentable), 1)
assert.equal(lastRepresentable.selesai, new Date(timeClip).toISOString())
for (const seconds of [1.001, 2]) {
  const outsideLimit = parse({ start: nearLimitStart, duration: seconds })
  assert.equal(outsideLimit.durationSource, 'unknown')
  assert.equal(duration(outsideLimit), null, 'finite projected timestamp outside TimeClip must remain unknown')
}
const minimumDate = new Date(-timeClip).toISOString()
const fullDateRange = parse({ start: minimumDate, duration: timeClip * 2 / 1000 })
assert.equal(fullDateRange.durationSource, 'source_field')
assert.equal(duration(fullDateRange), timeClip * 2 / 1000, 'full representable date span is allowed without arbitrary duration cap')
assert.equal(fullDateRange.selesai, new Date(timeClip).toISOString())
assert.equal(duration(parse({ start: new Date(timeClip).toISOString(), duration: 0 })), 0)

// Deterministic property coverage: each provenance lane preserves its own semantics.
for (let seconds = 0; seconds <= 3600; seconds += 37) {
  const finish = new Date(Date.parse(start) + seconds * 1000).toISOString()
  const imported = parse({ end: finish })
  assert.equal(duration(imported), seconds)
  assert.equal(duration({ ...imported, durasi: seconds + 1 }), null)
  assert.equal(duration(parse({ duration: seconds, end })), seconds)
  assert.equal(duration({ durasi: seconds }), seconds > 0 ? seconds : null)
  assert.equal(duration({ durasi: seconds, durationSource: 'unknown' }), null)
}
const fractional = parse({ end: '2026-09-01T00:00:00.600Z' })
assert.equal(fractional.durasi, 1)
assert.equal(duration(fractional), 1, 'timestamp validation retains existing nearest-second normalization')

const memory = new Map<string, string>()
let writes = 0
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { writes++; memory.set(key, value) },
  removeItem: (key: string) => { memory.delete(key) },
} })
Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: undefined })
const base = { nama: 'Run', mulai: start, selesai: end, hr: [], pemulihan: [] }
const raw = JSON.stringify([
  { ...base, id: 'legacy-zero', durasi: 0 },
  { ...base, id: 'legacy-positive', durasi: 600 },
  { ...base, id: 'unknown-positive', durasi: 600, durationSource: 'unknown' },
  { ...base, id: 'forged-zero', durasi: 0, durationSource: 'timestamps', selesai: 'bad' },
  { ...base, id: 'forged-positive', durasi: 600, durationSource: 'timestamps', selesai: start },
  { ...explicitZero, id: 'recorded-zero' },
  { ...parse({ end: start }), id: 'timestamp-zero' },
  { ...fractional, id: 'fractional' },
  { ...parse({ duration: Number.MAX_VALUE }), id: 'overflow-unknown' },
])
memory.set('pmd_workouts_v1', raw)
const expected = [null, 600, null, null, null, 0, 0, 1, null]
assert.deepEqual(getWorkouts().map(duration), expected)
assert.equal(writes, 0, 'normalizing reads must not rewrite caches')
assert.equal(memory.get('pmd_workouts_v1'), raw)
assert.equal(mergeWorkouts(getWorkouts()), 0, 're-saving existing sessions adds no new IDs')
const persisted = JSON.parse(memory.get('pmd_workouts_v1')!)
assert.equal(persisted.find((w: { id: string }) => w.id === 'legacy-zero').durationSource, 'unknown')
// Replace serialized bytes to force a fresh parse rather than satisfying the in-memory cache.
memory.set('pmd_workouts_v1', JSON.stringify(persisted, null, 2))
assert.deepEqual(getWorkouts().map(duration), expected, 'explicit/unknown duration must survive persistence and reload')
assert.equal(writes, 1, 'reload must remain read-only')
console.log('Workout duration provenance: explicit zero, legacy missingness, timestamp consistency, properties and reload verified.')
