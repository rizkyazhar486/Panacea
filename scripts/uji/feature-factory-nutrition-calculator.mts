import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_CALCULATOR_DAYS,
  calculateNutritionJournalWindow,
} from '../../src/lib/nutritionJournalCalculator.ts'

const base = {
  grams: 100,
  carbs: 20,
  protein: 10,
  fat: 5,
}

const recorded = [
  { id: 'a', date: '2026-09-01', name: 'A', kcal: 100, ...base },
  { id: 'b', date: '2026-09-03', name: 'B', kcal: 200, ...base },
  { id: 'c', date: '2026-09-07', name: 'C', kcal: 300, ...base },
]

assert.equal(MAX_NUTRITION_CALCULATOR_DAYS, 30)
assert.equal(calculateNutritionJournalWindow([], 7), null)

const result = calculateNutritionJournalWindow(recorded, 7)
assert.ok(result)
assert.equal(result.requestedRecordedDays, 7)
assert.equal(result.observedDays, 3, 'Only actual recorded dates count toward the divisor.')
assert.equal(result.firstDate, '2026-09-01')
assert.equal(result.latestDate, '2026-09-07')
assert.deepEqual(result.kcal, { total: 600, meanPerRecordedDay: 200, unit: 'kcal' })
assert.deepEqual(result.carbs, { total: 60, meanPerRecordedDay: 20, unit: 'g' })
assert.deepEqual(result.protein, { total: 30, meanPerRecordedDay: 10, unit: 'g' })
assert.deepEqual(result.fat, { total: 15, meanPerRecordedDay: 5, unit: 'g' })
assert.equal(result.formula, 'total=sum(recorded-day totals); mean=total/observed recorded days')
assert.equal(result.scope, 'recorded-journal-arithmetic-only')

const latestTwo = calculateNutritionJournalWindow(recorded, 2)
assert.ok(latestTwo)
assert.equal(latestTwo.observedDays, 2)
assert.equal(latestTwo.firstDate, '2026-09-03')
assert.equal(latestTwo.latestDate, '2026-09-07')
assert.equal(latestTwo.kcal.total, 500)
assert.equal(latestTwo.kcal.meanPerRecordedDay, 250)

const malformed = calculateNutritionJournalWindow([
  ...recorded,
  { ...recorded[0], id: 'bad', date: 'bad-date', kcal: 9999 },
] as never, 7)
assert.equal(malformed?.observedDays, 3, 'Malformed rows must fail closed through the journal sanitizer.')
assert.equal(malformed?.kcal.total, 600)

const bounded = Array.from({ length: MAX_NUTRITION_CALCULATOR_DAYS + 5 }, (_, index) => ({
  id: `bounded-${index}`,
  date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
  name: `Recorded ${index}`,
  kcal: index + 1,
  ...base,
}))
const boundedResult = calculateNutritionJournalWindow(bounded, 999)
assert.ok(boundedResult)
assert.equal(boundedResult.requestedRecordedDays, MAX_NUTRITION_CALCULATOR_DAYS)
assert.equal(boundedResult.observedDays, MAX_NUTRITION_CALCULATOR_DAYS)
assert.equal(boundedResult.firstDate, '2026-01-06')
assert.equal(boundedResult.latestDate, '2026-02-04')

const card = readFileSync(new URL('../../src/components/NutritionJournalCalculatorCard.tsx', import.meta.url), 'utf8')
const workbench = readFileSync(new URL('../../src/pages/NutritionDataWorkbench.tsx', import.meta.url), 'utf8')
const hub = readFileSync(new URL('../../src/pages/PusatGizi.tsx', import.meta.url), 'utf8')
assert.match(card, /total = sum of validated recorded-day totals; mean = total ÷ observed recorded days/)
assert.match(card, /Missing calendar dates are excluded, not treated as zero/)
assert.match(card, /not calorie or macro requirements, intake targets, adequacy judgments, diagnoses, treatment rules, or dietary recommendations/)
assert.match(card, /No valid recorded nutrition date is available\. Nothing is calculated from sample or assumed data\./)
assert.match(workbench, /NutritionJournalCalculatorCard entries=\{state\.foods\}/)
assert.match(hub, /lazy\(\(\) => import\('\.\/NutritionDataWorkbench'\)/)
assert.match(hub, /komponen: NutritionDataWorkbench/)
assert.doesNotMatch(card, /recommended calories|calorie deficit|macro target|optimal intake|healthy range/i)

console.log('Feature Factory nutrition calculator: bounded recorded-day arithmetic is deterministic, missing-date safe, lazy-contained, and explicitly non-clinical.')
