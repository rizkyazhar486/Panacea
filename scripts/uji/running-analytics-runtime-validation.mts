import assert from 'node:assert/strict'
import { sebaranIntensitas } from '../../src/lib/analisisLari.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'

function workout(hr: unknown[]): ImportedWorkout {
  return {
    id: 'uji-runtime-hr',
    nama: 'Uji runtime HR',
    mulai: '2026-09-01T00:00:00.000Z',
    selesai: '2026-09-01T00:40:00.000Z',
    durasi: 2400,
    hr: hr as ImportedWorkout['hr'],
    pemulihan: [],
  }
}

const valid29 = Array.from({ length: 29 }, (_, i) => ({ t: i * 60, bpm: 120 }))

// Titik cache yang rusak tidak boleh dihitung sebagai menit data sah atau
// diam-diam jatuh ke zona keras akibat perbandingan NaN.
assert.equal(
  sebaranIntensitas([
    workout([...valid29, { t: 29 * 60, bpm: Number.NaN }]),
  ], 180),
  null,
)

const valid30 = Array.from({ length: 30 }, (_, i) => ({ t: i * 60, bpm: 120 }))
const hasil = sebaranIntensitas([
  workout([
    ...valid30,
    { t: -60, bpm: 190 },
    { t: 31 * 60, bpm: 0 },
    { t: 32 * 60, bpm: Number.POSITIVE_INFINITY },
  ]),
], 180)

assert.ok(hasil)
assert.equal(hasil.totalMenit, 30)
assert.equal(hasil.sesi, 1)
assert.deepEqual(hasil.menit, [30, 0, 0])
assert.deepEqual(hasil.persen, [100, 0, 0])

assert.equal(sebaranIntensitas([workout(valid30)], Number.POSITIVE_INFINITY), null)
assert.equal(sebaranIntensitas([workout(valid30)], Number.NaN), null)

console.log('running analytics runtime validation: ok')
