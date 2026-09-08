import assert from 'node:assert/strict'
import { summarise, type ImportedWorkout } from '../../src/lib/workoutImport.ts'

const base = {
  nama: 'Run',
  mulai: '2026-08-01T00:00:00.000Z',
  selesai: '2026-08-01T01:00:00.000Z',
  hr: [],
  pemulihan: [],
} satisfies Partial<ImportedWorkout>

const workouts: ImportedWorkout[] = [
  {
    ...base,
    id: 'run-10k',
    durasi: 3600,
    jarakKm: 10,
    kcal: 500,
    hr: [
      { t: 60, bpm: 180 },
      { t: 0, bpm: 120 },
    ],
  } as ImportedWorkout,
  {
    ...base,
    id: 'strength',
    nama: 'Strength',
    durasi: 3600,
    kcal: 300,
  } as ImportedWorkout,
  {
    ...base,
    id: 'malformed-old-cache',
    durasi: Number.NaN,
    jarakKm: -5,
    kcal: Number.POSITIVE_INFINITY,
    hr: null as unknown as ImportedWorkout['hr'],
  } as ImportedWorkout,
  {
    ...base,
    id: 'run-5k',
    durasi: 1800,
    jarakKm: 5,
    kcal: 250,
  } as ImportedWorkout,
]

const summary = summarise(workouts, 200)
assert.equal(summary.sesi, 4)
assert.equal(summary.totalMenit, 150, 'invalid duration must not poison total training minutes')
assert.equal(summary.totalKm, 15, 'negative distance must not reduce valid distance')
assert.equal(summary.totalKcal, 1050, 'non-finite calories must not poison the weekly sum')
assert.equal(summary.rerataPaceSec, 360, 'non-distance workout duration must not contaminate aggregate pace')
assert.equal(summary.pctMudah, 50, 'valid HR points should be sorted and retained for zone summary')

const invalidHrMax = summarise(workouts, Number.POSITIVE_INFINITY)
assert.equal(invalidHrMax.pctMudah, undefined, 'non-finite HRmax must not create a fake zone distribution')

console.log('Weekly workout summary ignores malformed metrics and excludes non-distance duration from aggregate pace.')