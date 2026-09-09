import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_BASELINE_DAYS,
  MIN_NUTRITION_BASELINE_DAYS,
  buildNutritionPersonalBaseline,
} from '../../src/lib/nutritionPersonalBaseline.ts'

const base = {
  grams: 100,
  carbs: 20,
  protein: 10,
  fat: 5,
}

const recorded = [100, 200, 300, 400, 500].map((kcal, index) => ({
  id: `recorded-${index}`,
  date: `2026-09-${String(index * 2 + 1).padStart(2, '0')}`,
  name: `Recorded ${index}`,
  kcal,
  ...base,
}))

assert.equal(MIN_NUTRITION_BASELINE_DAYS, 3)
assert.equal(MAX_NUTRITION_BASELINE_DAYS, 30)
assert.equal(buildNutritionPersonalBaseline([], 'kcal'), null)
assert.equal(buildNutritionPersonalBaseline(recorded.slice(0, 2), 'kcal'), null)
assert.equal(buildNutritionPersonalBaseline(recorded, 'kcal', 2), null)

const energy = buildNutritionPersonalBaseline(recorded, 'kcal')
assert.ok(energy)
assert.deepEqual(energy, {
  metric: 'kcal',
  observedDays: 5,
  median: 300,
  q1: 150,
  q3: 450,
  firstDate: '2026-09-01',
  latestDate: '2026-09-09',
  unit: 'kcal',
  method: 'nist-percentile-n-plus-one',
  scope: 'personal-descriptive-recorded-journal-only',
})
assert.equal(energy.observedDays, 5, 'Missing calendar dates must not be inserted as zero-valued observations.')

const protein = buildNutritionPersonalBaseline(recorded.map((entry, index) => ({
  ...entry,
  protein: index * 5,
})), 'protein')
assert.ok(protein)
assert.equal(protein.unit, 'g')
assert.equal(protein.median, 10)
assert.equal(protein.q1, 2.5)
assert.equal(protein.q3, 17.5)

const withMalformed = buildNutritionPersonalBaseline([
  ...recorded,
  { ...recorded[0], id: 'bad-date', date: 'not-a-date', kcal: 9999 },
] as never, 'kcal')
assert.equal(withMalformed?.latestDate, '2026-09-09', 'Malformed rows must fail closed through the nutrition journal sanitizer.')
assert.equal(withMalformed?.median, 300)

const bounded = Array.from({ length: MAX_NUTRITION_BASELINE_DAYS + 5 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)
  return {
    id: `bounded-${index}`,
    date,
    name: `Recorded bounded ${index}`,
    kcal: 100 + index,
    ...base,
  }
})
const boundedBaseline = buildNutritionPersonalBaseline(bounded, 'kcal', 999)
assert.ok(boundedBaseline)
assert.equal(boundedBaseline.observedDays, MAX_NUTRITION_BASELINE_DAYS)
assert.equal(boundedBaseline.firstDate, '2026-01-06')
assert.equal(boundedBaseline.latestDate, '2026-02-04')

const card = readFileSync(new URL('../../src/components/NutritionPersonalBaselineCard.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /NutritionPersonalBaselineCard entries=\{state\.foods\}/)
assert.match(card, /Your own recorded history, not a normal range/)
assert.match(card, /missing calendar dates are never inserted as zero/)
assert.match(card, /NIST p\(N\+1\) percentile convention/)
assert.match(card, /not a calorie or macro target, population normal range, adequacy threshold, diagnosis, treatment rule or dietary recommendation/)
assert.doesNotMatch(card, /recommended intake|healthy range|deficit|surplus|optimal calories/i)

console.log('Feature Factory nutrition baseline: bounded personal recorded-history quartiles are deterministic, missing-day safe and explicitly non-clinical.')
