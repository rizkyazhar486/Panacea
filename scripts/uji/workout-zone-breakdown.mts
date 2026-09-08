import assert from 'node:assert/strict'
import { zoneBreakdown, type HrPoint } from '../../src/lib/workoutImport.ts'

const raw = [
  { t: 120, bpm: 180 },
  { t: 0, bpm: 120 },
  null,
  { t: 60, bpm: 140 },
  { t: -5, bpm: 150 },
  { t: 180, bpm: Number.POSITIVE_INFINITY },
] as unknown as HrPoint[]

const zones = zoneBreakdown(raw, 200)
const byZone = new Map(zones.map((z) => [z.zona, z]))

assert.equal(raw[0]?.t, 120, 'zoneBreakdown must not sort/mutate the caller array in place')
assert.equal(raw[1]?.t, 0, 'input order must remain unchanged')
assert.equal(byZone.get(2)?.menit, 1)
assert.equal(byZone.get(2)?.pctWaktu, 33)
assert.equal(byZone.get(3)?.menit, 1)
assert.equal(byZone.get(3)?.pctWaktu, 33)
assert.equal(byZone.get(5)?.menit, 1)
assert.equal(byZone.get(5)?.pctWaktu, 33)
assert.equal(byZone.get(1)?.menit, 0)
assert.equal(byZone.get(4)?.menit, 0)

const single = zoneBreakdown([{ t: 0, bpm: 130 }], 200)
assert.equal(single.find((z) => z.zona === 2)?.menit, 1, 'a single valid sample keeps the existing 60-second representation')
assert.equal(single.find((z) => z.zona === 2)?.pctWaktu, 100)

assert.deepEqual(zoneBreakdown(raw, Number.POSITIVE_INFINITY), [], 'non-finite HRmax must not produce zones')
assert.deepEqual(zoneBreakdown(raw, Number.NaN), [], 'NaN HRmax must not produce zones')
assert.deepEqual(zoneBreakdown(null as unknown as HrPoint[], 200), [], 'runtime null input must be rejected safely')
assert.deepEqual(zoneBreakdown([
  { t: -1, bpm: 120 },
  { t: 0, bpm: Number.NaN },
] as HrPoint[], 200), [], 'all-invalid samples must produce no zone distribution')
assert.deepEqual(zoneBreakdown([
  { t: 0, bpm: 120 },
  { t: 0, bpm: 130 },
], 200), [], 'zero-duration duplicate-only samples must not fabricate zone time')

console.log('Heart-rate zone breakdown sanitizes runtime input without changing zone thresholds or mutating callers.')