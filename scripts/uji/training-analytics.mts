import assert from 'node:assert/strict'
import { buildTrainingAnalytics } from '../../src/lib/trainingAnalytics.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'

function workout(overrides: Partial<ImportedWorkout> & Pick<ImportedWorkout, 'id' | 'mulai'>): ImportedWorkout {
  return {
    nama: 'Run',
    selesai: overrides.mulai,
    durasi: 0,
    hr: [],
    pemulihan: [],
    ...overrides,
  }
}

const data: ImportedWorkout[] = [
  workout({
    id: 'run-old-window',
    mulai: '2026-08-20T05:00:00.000Z',
    durasi: 1800,
    jarakKm: 5,
    paceSec: 360,
    kcal: 200,
  }),
  workout({
    id: 'run-10k',
    mulai: '2026-09-02T05:00:00.000Z',
    durasi: 3600,
    jarakKm: 10,
    paceSec: 360,
    kcal: 500,
    rpe: 5,
    hr: [{ t: 0, bpm: 120 }, { t: 60, bpm: 140 }],
    pemulihan: [{ t: 60, bpm: 100 }],
    hrr1: 40,
  }),
  workout({
    id: 'strength',
    nama: 'Strength',
    mulai: '2026-09-03T05:00:00.000Z',
    durasi: 3600,
    kcal: 300,
    rpe: 6,
  }),
  workout({
    id: 'run-5k',
    mulai: '2026-09-06T05:00:00.000Z',
    durasi: 1800,
    jarakKm: 5,
    paceSec: 360,
    kcal: 250,
    hr: [{ t: 0, bpm: 125 }],
    hrr1: 99,
    pemulihan: [{ t: 120, bpm: 80 }],
  }),
  workout({
    id: 'run-fast',
    nama: '  Run  ',
    mulai: '2026-09-08T05:00:00.000Z',
    durasi: 1500,
    jarakKm: 5,
    paceSec: 300,
    kcal: 100,
    rpe: 7,
    hrr1: 35,
    pemulihan: [{ t: 58, bpm: 105 }],
  }),
  workout({
    id: 'outside-window',
    mulai: '2026-08-01T05:00:00.000Z',
    durasi: 9999,
    jarakKm: 99,
    paceSec: 101,
    kcal: 9999,
  }),
  workout({
    id: 'invalid-date',
    mulai: 'broken-date',
    durasi: Number.NaN,
    jarakKm: Number.POSITIVE_INFINITY,
    kcal: -50,
  }),
]

const result = buildTrainingAnalytics(data, new Date('2026-09-08T12:00:00.000Z'))

assert.equal(result.minggu.sesi, 4)
assert.equal(result.minggu.menit, 175)
assert.equal(result.minggu.km, 20)
assert.equal(result.minggu.kcal, 1150)
assert.equal(result.minggu.paceSec, 345, 'strength duration must not contaminate distance-session pace')
assert.equal(result.minggu.sesiDurasi, 4)
assert.equal(result.minggu.sesiJarak, 3)
assert.equal(result.minggu.sesiHr, 2)
assert.equal(result.minggu.sesiRpe, 3)
assert.equal(result.minggu.sesiRecovery, 3)

assert.equal(result.total28.sesi, 5)
assert.equal(result.total28.menit, 205)
assert.equal(result.total28.km, 25)
assert.equal(result.total28.sesiJarak, 4)
assert.equal(result.blok28.length, 4)
assert.equal(result.blok28.reduce((sum, b) => sum + b.km, 0), 25)
assert.equal(result.blok28.reduce((sum, b) => sum + b.sesi, 0), 5)

assert.equal(result.paceAktivitas?.nama, 'Run')
assert.deepEqual(result.paceAktivitas?.titik.map((p) => p.id), ['run-old-window', 'run-10k', 'run-5k', 'run-fast'])
assert.deepEqual(result.paceAktivitas?.titik.map((p) => p.paceSec), [360, 360, 360, 300])

assert.equal(result.hrrAktivitas?.nama, 'Run')
assert.deepEqual(result.hrrAktivitas?.titik.map((p) => p.id), ['run-10k', 'run-fast'])
assert.deepEqual(result.hrrAktivitas?.titik.map((p) => p.hrr1), [40, 35])
assert.ok(!result.hrrAktivitas?.titik.some((p) => p.id === 'run-5k'), 'cached HRR1 without a 45–75s recovery sample must be excluded')

const invalidAnchor = buildTrainingAnalytics(data, new Date('invalid'))
assert.equal(invalidAnchor.minggu.sesi, 0)
assert.deepEqual(invalidAnchor.blok28, [])
assert.equal(invalidAnchor.paceAktivitas, null)
assert.equal(invalidAnchor.hrrAktivitas, null)

console.log('Training analytics derives 7/28-day charts and HRR1 trends only from valid recorded fields and exact activity names.')
