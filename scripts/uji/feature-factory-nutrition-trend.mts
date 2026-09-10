import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_TREND_DAYS,
  summarizeNutritionEnergyTrend,
} from '../../src/lib/nutritionTrend.ts'

const base = { grams: 100, carbs: 20, protein: 10, fat: 5 }
const recorded = [
  { id: 'day-a', date: '2026-09-01', name: 'Recorded A', kcal: 200, ...base },
  { id: 'day-b', date: '2026-09-03', name: 'Recorded B', kcal: 260, ...base },
  { id: 'day-c', date: '2026-09-05', name: 'Recorded C', kcal: 320, ...base },
]

assert.equal(summarizeNutritionEnergyTrend([]), null)
assert.equal(summarizeNutritionEnergyTrend(recorded.slice(0, 1)), null)
assert.equal(summarizeNutritionEnergyTrend(recorded, 1), null)

const higher = summarizeNutritionEnergyTrend(recorded)
assert.ok(higher)
assert.deepEqual(higher, {
  firstDate: '2026-09-01',
  latestDate: '2026-09-05',
  observedDays: 3,
  elapsedCalendarDays: 4,
  firstKcal: 200,
  latestKcal: 320,
  deltaKcal: 120,
  kcalPerCalendarDay: 30,
  direction: 'higher',
})

const lower = summarizeNutritionEnergyTrend([
  { ...recorded[0], id: 'lower-a', kcal: 400 },
  { ...recorded[2], id: 'lower-b', kcal: 300 },
])
assert.equal(lower?.direction, 'lower')
assert.equal(lower?.kcalPerCalendarDay, -25)

const flat = summarizeNutritionEnergyTrend([
  { ...recorded[0], id: 'flat-a', kcal: 300 },
  { ...recorded[2], id: 'flat-b', kcal: 300 },
])
assert.equal(flat?.direction, 'flat')
assert.equal(flat?.kcalPerCalendarDay, 0)

const many = Array.from({ length: MAX_NUTRITION_TREND_DAYS + 5 }, (_, index) => ({
  id: `bounded-${index}`,
  date: `2026-08-${String(index + 1).padStart(2, '0')}`,
  name: `Recorded ${index}`,
  kcal: 100 + index,
  ...base,
}))
const bounded = summarizeNutritionEnergyTrend(many, MAX_NUTRITION_TREND_DAYS + 100)
assert.ok(bounded)
assert.equal(bounded.observedDays, MAX_NUTRITION_TREND_DAYS)
assert.equal(bounded.firstDate, '2026-08-06')
assert.equal(bounded.latestDate, '2026-08-12')

const withMalformed = summarizeNutritionEnergyTrend([
  ...recorded,
  { ...recorded[0], id: 'malformed', date: 'bad-date', kcal: 9999 },
] as never)
assert.equal(withMalformed?.latestDate, '2026-09-05')

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /summarizeNutritionEnergyTrend/)
assert.match(page, /calendar-day slope/)
assert.match(page, /missing dates are not inserted as zero/)
assert.match(page, /The line and slope are not a calorie target, energy-balance estimate, adequacy judgment or recommendation\./)
assert.doesNotMatch(page, /metabolic improvement|healthy trend|unhealthy trend|calorie deficit achieved/i)

console.log('Feature Factory nutrition trend: bounded recorded-only direction and calendar-time slope are deterministic, missing-day safe and explicitly non-clinical.')
