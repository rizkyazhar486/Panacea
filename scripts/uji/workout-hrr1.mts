import assert from 'node:assert/strict'
import { parseWorkouts } from '../../src/lib/workoutImport.ts'

const workouts = parseWorkouts(JSON.stringify({
  data: {
    workouts: [
      {
        id: 'valid-near-minute',
        name: 'Run',
        start: '2026-08-01 10:00:00 +0700',
        end: '2026-08-01 10:30:00 +0700',
        heartRateData: [
          { date: '2026-08-01 10:29:00 +0700', Avg: 165 },
          { date: '2026-08-01 10:30:00 +0700', Avg: 170 },
        ],
        heartRateRecovery: [
          { date: '2026-08-01 10:30:10 +0700', Avg: 172 },
          { date: '2026-08-01 10:30:58 +0700', Avg: 140 },
          { date: '2026-08-01 10:32:00 +0700', Avg: 110 },
        ],
      },
      {
        id: 'no-near-minute',
        name: 'Run',
        start: '2026-08-02 10:00:00 +0700',
        end: '2026-08-02 10:30:00 +0700',
        heartRateData: [{ date: '2026-08-02 10:30:00 +0700', Avg: 170 }],
        heartRateRecovery: [
          { date: '2026-08-02 10:30:10 +0700', Avg: 160 },
          { date: '2026-08-02 10:32:00 +0700', Avg: 110 },
        ],
      },
      {
        id: 'nearest-to-sixty',
        name: 'Run',
        start: '2026-08-03 10:00:00 +0700',
        end: '2026-08-03 10:30:00 +0700',
        heartRateData: [{ date: '2026-08-03 10:30:00 +0700', Avg: 170 }],
        heartRateRecovery: [
          { date: '2026-08-03 10:30:47 +0700', Avg: 150 },
          { date: '2026-08-03 10:31:04 +0700', Avg: 145 },
        ],
      },
    ],
  },
}))

const byId = new Map(workouts.map((w) => [w.id, w]))

assert.equal(byId.get('valid-near-minute')?.hrr1, 32, '10-second peak to 58-second recovery should be used')
assert.equal(byId.get('no-near-minute')?.hrr1, undefined, '10-second or 120-second samples must not masquerade as HRR1')
assert.equal(byId.get('nearest-to-sixty')?.hrr1, 25, 'when several samples are in-window, use the one closest to 60 seconds')

console.log('Workout importer computes HRR1 only from a recorded 45–75 second recovery sample.')
