import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_TIMELINE_DAYS,
  buildNutritionJournalTimeline,
  latestNutritionJournalSnapshot,
} from '../../src/lib/nutritionJournal.ts'

const recorded = [
  { id: 'meal-old', date: '2026-09-07', name: 'Oats', grams: 100, kcal: 380, carbs: 68, protein: 13, fat: 7 },
  { id: 'meal-latest-a', date: '2026-09-09', name: 'Rice', grams: 150, kcal: 195, carbs: 42, protein: 4, fat: 1 },
  { id: 'meal-latest-b', date: '2026-09-09', name: 'Egg', grams: 50, kcal: 72, carbs: 0.4, protein: 6.3, fat: 4.8 },
]

assert.equal(latestNutritionJournalSnapshot([]), null, 'Snapshot must stay empty when no recorded intake exists.')
assert.equal(
  latestNutritionJournalSnapshot([
    ...recorded,
    { id: 'bad', date: 'not-a-date', name: 'Malformed', grams: 1, kcal: 1, carbs: 1, protein: 1, fat: 1 },
  ] as never)?.date,
  '2026-09-09',
  'Malformed rows must not displace the latest valid recorded day.',
)

assert.deepEqual(latestNutritionJournalSnapshot(recorded), {
  date: '2026-09-09',
  entries: 2,
  grams: 200,
  kcal: 267,
  carbs: 42.4,
  protein: 10.3,
  fat: 5.8,
})

const manyDays = Array.from({ length: MAX_NUTRITION_TIMELINE_DAYS + 15 }, (_, index) => ({
  id: `meal-${index}`,
  date: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`,
  name: `Recorded meal ${index}`,
  grams: 100,
  kcal: 100 + index,
  carbs: 10,
  protein: 5,
  fat: 2,
}))
assert.ok(
  buildNutritionJournalTimeline(manyDays, MAX_NUTRITION_TIMELINE_DAYS + 100).length <= MAX_NUTRITION_TIMELINE_DAYS,
  'Timeline feeding the snapshot surface must remain bounded.',
)
assert.equal(
  buildNutritionJournalTimeline(recorded, 7).some((day) => day.date === '2026-09-08'),
  false,
  'Missing dates must never be fabricated as zero-valued observations.',
)

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /Recorded-only snapshot \+ timeline/)
assert.match(page, /No valid nutrition journal records yet\. This panel stays empty instead of generating a sample day\./)
assert.match(page, /Recorded kcal/)
assert.match(page, /Recorded mass/)
assert.match(page, /No missing day is inserted as zero\./)
assert.match(page, /Descriptive journal totals only\. The line is not a calorie target, energy-balance estimate or recommendation\./)
assert.match(page, /role="img"/)
assert.doesNotMatch(page, /\bfetch\s*\(|axios|XMLHttpRequest|WebSocket/, 'Nutrition snapshot must remain local-first and network-independent.')
assert.doesNotMatch(page, /calorie target achieved|deficiency detected|clinically adequate/i)

console.log('Feature Factory nutrition snapshot: latest recorded-day aggregation and bounded recorded-only timeline are empty-safe, local-first, unit-preserving and explicitly non-clinical.')
