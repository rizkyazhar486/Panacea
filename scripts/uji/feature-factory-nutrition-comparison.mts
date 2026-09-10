import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareLatestNutritionJournalDays } from '../../src/lib/nutritionJournal.ts'

const entry = (id: string, date: string, kcal: number, carbs: number, protein: number, fat: number, grams = 100) => ({
  id,
  date,
  name: id,
  grams,
  kcal,
  carbs,
  protein,
  fat,
})

assert.equal(compareLatestNutritionJournalDays([]), null)
assert.equal(compareLatestNutritionJournalDays([
  entry('only', '2026-09-01', 500, 50, 25, 20),
]), null, 'A single recorded date must not be presented as a two-day comparison.')

const comparison = compareLatestNutritionJournalDays([
  entry('latest', '2026-09-05', 900, 90, 45, 30, 220),
  entry('oldest', '2026-09-01', 300, 30, 15, 10, 100),
  entry('previous-a', '2026-09-03', 500, 50, 20, 15, 150),
  entry('previous-b', '2026-09-03', 100, 10, 5, 2, 50),
])

assert.ok(comparison)
assert.equal(comparison.previous.date, '2026-09-03')
assert.equal(comparison.latest.date, '2026-09-05')
assert.equal(comparison.previous.entries, 2, 'Same-day records must aggregate before comparison.')
assert.deepEqual(comparison.delta, {
  entries: -1,
  grams: 20,
  kcal: 300,
  carbs: 30,
  protein: 20,
  fat: 13,
})
assert.notEqual(comparison.previous.date, '2026-09-01', 'Comparison must use the latest two actually recorded dates, not the oldest retained date.')

const withMalformed = compareLatestNutritionJournalDays([
  entry('previous', '2026-09-03', 600, 60, 25, 17, 200),
  entry('latest', '2026-09-05', 900, 90, 45, 30, 220),
  { ...entry('bad-date', '2026-09-04', 9999, 999, 999, 999), date: '2026-02-30' },
  { ...entry('bad-number', '2026-09-06', 9999, 999, 999, 999), kcal: Number.POSITIVE_INFINITY },
] as never)
assert.ok(withMalformed)
assert.equal(withMalformed.previous.date, '2026-09-03')
assert.equal(withMalformed.latest.date, '2026-09-05', 'Malformed newer rows must fail closed instead of becoming the latest comparison day.')

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /compareLatestNutritionJournalDays\(state\.foods\)/)
assert.match(page, /Latest vs previous recorded day/)
assert.match(page, /A second recorded date is required before a descriptive comparison is shown\./)
assert.match(page, /Recorded comparison \$\{comparison\.previous\.date\} to \$\{comparison\.latest\.date\}/)
assert.match(page, /kcal Δ/)
assert.match(page, /Carbs Δ/)
assert.match(page, /Protein Δ/)
assert.match(page, /Fat Δ/)
assert.match(page, /Difference in recorded totals only; no target, adequacy or health interpretation is inferred\./)
assert.doesNotMatch(page, /Latest vs previous recorded day[^]{0,900}(recommended intake|calorie target|deficiency|diagnosis|treatment)/i)

console.log('Feature Factory nutrition comparison: latest-two recorded-day selection, same-day aggregation, deltas, malformed-row rejection, units and non-clinical interpretation boundaries are deterministic.')
