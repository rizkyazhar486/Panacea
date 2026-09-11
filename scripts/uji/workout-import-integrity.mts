import assert from 'node:assert/strict'
import { parseWorkouts } from '../../src/lib/workoutImport.ts'

const parsed = parseWorkouts(JSON.stringify({
  data: {
    workouts: [
      {
        id: 'run-valid',
        name: 'Run',
        start: '2026-09-01 07:00:00 +0700',
        end: '2026-09-01 08:00:00 +0700',
        distance: 10,
        activeEnergyBurned: -50,
        avgHeartRate: -120,
        maxHeartRate: 0,
        stepCadence: -170,
        stepCount: [{ qty: 5000 }, { qty: -20 }, { qty: 3000 }],
        heartRateData: [
          { date: '2026-09-01 07:01:00 +0700', Avg: 150 },
          { date: 'not-a-date', Avg: 999 },
          { date: '2026-09-01 06:59:00 +0700', Avg: 140 },
        ],
        heartRateRecovery: [
          { date: '2026-09-01 08:00:58 +0700', Avg: 130 },
          { date: 'not-a-date', Avg: 100 },
        ],
      },
      {
        id: '',
        name: '   ',
        start: '2026-09-02 07:00:00 +0700',
        end: 'broken-end',
        duration: 600,
        distance: -5,
        speed: -12,
        activeEnergyBurned: 100,
        heartRateData: [{ date: '2026-09-02 07:02:00 +0700', Avg: 120 }],
        heartRateRecovery: [{ date: '2026-09-02 07:11:00 +0700', Avg: 90 }],
      },
      {
        id: 'bad-order',
        name: 'Bad order',
        start: '2026-09-03 08:00:00 +0700',
        end: '2026-09-03 07:00:00 +0700',
        walkingAndRunningDistance: 5,
        heartRateRecovery: [{ date: '2026-09-03 08:01:00 +0700', Avg: 100 }],
      },
    ],
  },
}))

assert.equal(parsed.length, 3)

const run = parsed.find((w) => w.id === 'run-valid')!
assert.deepEqual(run.hr, [{ t: 60, bpm: 150 }], 'invalid or pre-start HR samples must be dropped instead of receiving synthetic timestamps')
assert.deepEqual(run.pemulihan, [{ t: 58, bpm: 130 }])
assert.equal(run.hrr1, 20)
assert.equal(run.jarakKm, 10)
assert.equal(run.kecepatanKmh, 10)
assert.equal(run.paceSec, 360)
assert.equal(run.kcal, undefined)
assert.equal(run.avgHr, undefined)
assert.equal(run.maxHr, undefined)
assert.equal(run.kadens, undefined)
assert.equal(run.langkah, 8000, 'negative step-count samples must not reduce valid recorded steps')

const noEnd = parsed.find((w) => w.nama === 'Latihan')!
assert.ok(noEnd.id.startsWith('   -'), 'blank source IDs should fall back to a deterministic generated ID')
assert.equal(noEnd.durasi, 600)
assert.equal(noEnd.jarakKm, undefined)
assert.equal(noEnd.kecepatanKmh, undefined)
assert.equal(noEnd.pemulihan.length, 0, 'recovery must be omitted when no valid workout end timestamp exists')
assert.equal(noEnd.hrr1, undefined)
assert.equal(noEnd.kcal, 100)

const badOrder = parsed.find((w) => w.id === 'bad-order')!
assert.equal(badOrder.durasi, 0)
assert.equal(badOrder.jarakKm, 5)
assert.equal(badOrder.kecepatanKmh, undefined)
assert.equal(badOrder.paceSec, undefined)
assert.equal(badOrder.pemulihan.length, 0, 'an end timestamp before start must not anchor recovery')
assert.equal(badOrder.selesai, badOrder.mulai, 'invalid end ordering should fall back to start plus sanitized duration')

console.log('Workout importer keeps only timestamped physiological samples and rejects malformed optional metrics.')
