import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateSeasonalRank,
  daysUntilSeasonReset,
  getSeasonWindow,
  softResetHiddenRating,
} from '../../src/lib/seasonalHealthSportRank.ts'

function workout(id, startedAt, durationMinutes = 45, extra = {}) {
  return { id, startedAt, durationMinutes, ...extra }
}

test('season windows hard-reset every three calendar months', () => {
  const now = new Date(2026, 8, 29, 12, 0, 0)
  const season = getSeasonWindow(now)
  assert.equal(season.id, '2026-S3')
  assert.equal(season.index, 3)
  assert.equal(season.start.getMonth(), 6)
  assert.equal(season.resetAt.getMonth(), 9)
  assert.equal(daysUntilSeasonReset(now), 2)
})

test('insufficient evidence fails closed at zero visible RP', () => {
  const result = calculateSeasonalRank({ workouts: [] }, 'health', new Date(2026, 8, 29, 12, 0, 0))
  assert.equal(result.points, 0)
  assert.equal(result.currentTier.id, 'master')
  assert.equal(result.evidenceLabel, 'insufficient')
})

test('safe longitudinal participation can reach top season rank without rewarding unlimited volume', () => {
  const workouts = []
  const start = new Date(2026, 6, 1, 8, 0, 0)
  for (let week = 0; week < 13; week++) {
    for (let day = 0; day < 4; day++) {
      const d = new Date(start)
      d.setDate(start.getDate() + week * 7 + day)
      workouts.push(workout(`${week}-${day}`, d.toISOString(), 45, { speedKmh: 10 }))
    }
  }
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    recoveryPct: 100,
    sleepH: 8,
  }))
  const result = calculateSeasonalRank(
    { workouts, health: { recoveryPct: 100, sleepHours: 8, history } },
    'health',
    new Date(2026, 8, 29, 12, 0, 0),
  )
  assert.equal(result.currentTier.id, 'mythic-immortal')
  assert.ok(result.points >= 2900)
  assert.ok(result.points <= 3250)
})

test('extreme weekly workout volume cannot exceed the activity component cap', () => {
  const now = new Date(2026, 6, 7, 12, 0, 0)
  const normal = calculateSeasonalRank(
    { workouts: [workout('a', '2026-07-02T08:00:00Z', 150), workout('b', '2026-07-03T08:00:00Z', 30), workout('c', '2026-07-04T08:00:00Z', 30)] },
    'health',
    now,
  )
  const extreme = calculateSeasonalRank(
    { workouts: [workout('a', '2026-07-02T08:00:00Z', 1500), workout('b', '2026-07-03T08:00:00Z', 300), workout('c', '2026-07-04T08:00:00Z', 300)] },
    'health',
    now,
  )
  assert.equal(normal.components.activity, 100)
  assert.equal(extreme.components.activity, 100)
})

test('hidden matchmaking rating can soft-reset separately from visible rank', () => {
  assert.equal(softResetHiddenRating(2000, 1500, 0.55), 1775)
})
