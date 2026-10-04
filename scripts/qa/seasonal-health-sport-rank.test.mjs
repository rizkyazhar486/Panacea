import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateEffortStar,
  calculateSeasonalRank,
  clanStarContribution,
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

test('no verified active calories means no competitive star', () => {
  const effort = calculateEffortStar(
    workout('a', '2026-09-20T08:00:00Z', 60, { speedKmh: 14, rpe: 9 }),
    [],
    { weightKg: 70, recoveryPct: 90 },
  )
  assert.equal(effort.stars, 0)
  assert.equal(effort.calories, 0)
})

test('same raw calories can produce different stars because human effort is not identical', () => {
  const session = workout('a', '2026-09-20T08:00:00Z', 45, { activeKcal: 300, rpe: 6 })
  const lighter = calculateEffortStar(session, [], { weightKg: 50, recoveryPct: 85 })
  const heavier = calculateEffortStar(session, [], { weightKg: 100, recoveryPct: 85 })
  assert.ok(lighter.stars > heavier.stars)
  assert.ok(lighter.kcalPerKg > heavier.kcalPerKg)
})

test('personal difficulty changes star size without letting one signal dominate', () => {
  const previous = [
    workout('p1', '2026-09-01T08:00:00Z', 45, { activeKcal: 220, speedKmh: 9.5, rpe: 5 }),
    workout('p2', '2026-09-05T08:00:00Z', 45, { activeKcal: 230, speedKmh: 9.6, rpe: 5 }),
    workout('p3', '2026-09-10T08:00:00Z', 45, { activeKcal: 225, speedKmh: 9.5, rpe: 5 }),
  ]
  const ordinary = calculateEffortStar(
    workout('a', '2026-09-20T08:00:00Z', 45, { activeKcal: 230, speedKmh: 9.5, rpe: 5 }),
    previous,
    { weightKg: 70, recoveryPct: 85 },
  )
  const harder = calculateEffortStar(
    workout('b', '2026-09-20T08:00:00Z', 45, { activeKcal: 360, speedKmh: 10.2, rpe: 7 }),
    previous,
    { weightKg: 70, recoveryPct: 85 },
  )
  assert.ok(harder.stars > ordinary.stars)
  assert.ok(harder.stars <= 3)
})

test('low recovery suppresses rather than rewards heroic suffering', () => {
  const session = workout('a', '2026-09-20T08:00:00Z', 60, { activeKcal: 500, speedKmh: 11, rpe: 9 })
  const fresh = calculateEffortStar(session, [], { weightKg: 70, recoveryPct: 90 })
  const depleted = calculateEffortStar(session, [], { weightKg: 70, recoveryPct: 20 })
  assert.ok(fresh.stars > depleted.stars)
})

test('single-effort star size is capped even when calorie value is extreme', () => {
  const effort = calculateEffortStar(
    workout('ultra', '2026-09-20T08:00:00Z', 600, { activeKcal: 5000, rpe: 10 }),
    [],
    { weightKg: 55, recoveryPct: 95 },
  )
  assert.equal(effort.stars, 3)
})

test('strong calorie-verified longitudinal season can reach Mythic Immortal', () => {
  const workouts = []
  const start = new Date(2026, 6, 1, 8, 0, 0)
  for (let week = 0; week < 13; week++) {
    for (let day = 0; day < 4; day++) {
      const d = new Date(start)
      d.setDate(start.getDate() + week * 7 + day)
      workouts.push(workout(`${week}-${day}`, d.toISOString(), 60, {
        activeKcal: 500,
        speedKmh: 10,
        rpe: 6,
        avgHr: 145,
      }))
    }
  }
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    recoveryPct: 90,
    sleepH: 8,
  }))
  const result = calculateSeasonalRank(
    { workouts, health: { weightKg: 70, recoveryPct: 90, sleepHours: 8, history } },
    'sport',
    new Date(2026, 8, 29, 12, 0, 0),
  )
  assert.equal(result.currentTier.id, 'mythic-immortal')
  assert.ok(result.stars >= 80)
  assert.ok(result.effortWins.every((effort) => effort.stars <= 3))
})

test('clan contribution uses AI-sized stars with a daily anti-grind cap', () => {
  // The cap uses the user's local calendar day, as do season windows.
  const localTime = (day, hour) => new Date(2026, 8, day, hour).toISOString()
  const efforts = [
    { workoutId: 'a', startedAt: localTime(20, 8), calories: 800, kcalPerKg: 10, stars: 3, size: 'legendary', victoryScore: 100, components: {}, rationale: [] },
    { workoutId: 'b', startedAt: localTime(20, 18), calories: 800, kcalPerKg: 10, stars: 3, size: 'legendary', victoryScore: 100, components: {}, rationale: [] },
    { workoutId: 'c', startedAt: localTime(21, 8), calories: 400, kcalPerKg: 5, stars: 2, size: 'heroic', victoryScore: 67, components: {}, rationale: [] },
  ]
  assert.equal(clanStarContribution(efforts, 4), 6)
})

test('hidden matchmaking rating can soft-reset separately from visible stars', () => {
  assert.equal(softResetHiddenRating(2000, 1500, 0.55), 1775)
})
