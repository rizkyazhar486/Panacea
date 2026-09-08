import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_FILTER_RESULTS,
  MAX_NUTRITION_IMPORT_BYTES,
  MAX_NUTRITION_IMPORT_ENTRIES,
  NUTRITION_JOURNAL_SCHEMA,
  NUTRITION_JOURNAL_VERSION,
  buildNutritionJournalTimeline,
  compareLatestNutritionJournalDays,
  filterNutritionJournalEntries,
  latestNutritionJournalSnapshot,
  parseNutritionJournalJson,
  sanitizeNutritionFoodEntry,
  sanitizeNutritionJournal,
  serializeNutritionJournal,
} from '../../src/lib/nutritionJournal.ts'

const valid = {
  id: 'meal-1',
  date: '2026-09-09',
  name: 'Recorded meal',
  grams: 250,
  kcal: 420,
  carbs: 55,
  protein: 24,
  fat: 12,
}

assert.deepEqual(sanitizeNutritionFoodEntry(valid), valid)
assert.equal(sanitizeNutritionFoodEntry({ ...valid, date: '2026-02-31' }), null)
assert.equal(sanitizeNutritionFoodEntry({ ...valid, grams: 0 }), null)
assert.equal(sanitizeNutritionFoodEntry({ ...valid, kcal: Number.POSITIVE_INFINITY }), null)
assert.equal(sanitizeNutritionFoodEntry({ ...valid, name: '' }), null)

const duplicate = sanitizeNutritionJournal([valid, { ...valid }, { ...valid, id: 'meal-2' }], 10)
assert.deepEqual(duplicate.entries.map((entry) => entry.id), ['meal-1', 'meal-2'])
assert.equal(duplicate.rejected, 1, 'duplicate IDs must fail closed instead of silently creating a second record')

const many = Array.from({ length: MAX_NUTRITION_IMPORT_ENTRIES + 3 }, (_, index) => ({
  ...valid,
  id: `meal-${index}`,
}))
const bounded = sanitizeNutritionJournal(many)
assert.equal(bounded.entries.length, MAX_NUTRITION_IMPORT_ENTRIES)
assert.equal(bounded.rejected, 3, 'overflow records must be rejected beyond the bounded import limit')

const serialized = serializeNutritionJournal([valid])
const parsedEnvelope = JSON.parse(serialized.json)
assert.equal(parsedEnvelope.schema, NUTRITION_JOURNAL_SCHEMA)
assert.equal(parsedEnvelope.version, NUTRITION_JOURNAL_VERSION)
assert.deepEqual(parsedEnvelope.entries, [valid])
assert.equal('exportedAt' in parsedEnvelope, false, 'export must not invent timestamps that were not part of recorded food data')

const roundTrip = parseNutritionJournalJson(serialized.json)
assert.deepEqual(roundTrip.entries, [valid])
assert.throws(() => parseNutritionJournalJson('{nope'), /not valid JSON/)
assert.throws(
  () => parseNutritionJournalJson(JSON.stringify({ schema: 'other', version: 1, entries: [] })),
  /schema\/version is not supported/,
)
assert.throws(
  () => parseNutritionJournalJson(' '.repeat(MAX_NUTRITION_IMPORT_BYTES + 1)),
  /larger than the 1 MB import limit/,
)

const recordedEntries = [
  valid,
  { ...valid, id: 'meal-2', date: '2026-09-07', name: 'Oat bowl', kcal: 300, carbs: 40, protein: 20, fat: 8 },
  { ...valid, id: 'meal-3', date: '2026-09-09', name: 'Soup', kcal: 180, carbs: 10, protein: 12, fat: 6, grams: 100 },
  { ...valid, id: 'meal-4', date: '2026-09-08', name: 'Rice plate', kcal: 350, carbs: 35, protein: 25, fat: 10 },
]
const timeline = buildNutritionJournalTimeline(recordedEntries, 7)
assert.deepEqual(timeline.map((day) => day.date), ['2026-09-07', '2026-09-08', '2026-09-09'])
assert.equal(timeline[2].entries, 2)
assert.equal(timeline[2].kcal, 600)
assert.equal(timeline[2].grams, 350)
assert.equal(timeline.some((day) => day.date === '2026-09-06'), false, 'missing dates must not be fabricated as zero-valued chart points')
assert.deepEqual(latestNutritionJournalSnapshot([valid, { ...valid, id: 'older', date: '2026-09-01' }])?.date, '2026-09-09')
assert.deepEqual(buildNutritionJournalTimeline([valid], 0), [])

const comparison = compareLatestNutritionJournalDays(recordedEntries)
assert.ok(comparison)
assert.equal(comparison.previous.date, '2026-09-08')
assert.equal(comparison.latest.date, '2026-09-09')
assert.equal(comparison.delta.kcal, 250)
assert.equal(compareLatestNutritionJournalDays([valid]), null)

assert.deepEqual(filterNutritionJournalEntries(recordedEntries, 'soup').map((entry) => entry.id), ['meal-3'])
assert.deepEqual(filterNutritionJournalEntries(recordedEntries, '', '2026-09-09').map((entry) => entry.id).sort(), ['meal-1', 'meal-3'])
assert.deepEqual(filterNutritionJournalEntries(recordedEntries, '2026-09-07').map((entry) => entry.id), ['meal-2'])
assert.equal(filterNutritionJournalEntries(many, '', '', MAX_NUTRITION_FILTER_RESULTS + 50).length, MAX_NUTRITION_FILTER_RESULTS)

const controlsSource = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(controlsSource, /No file is uploaded to Panacea/)
assert.match(controlsSource, /file\.size > MAX_NUTRITION_IMPORT_BYTES/)
assert.match(controlsSource, /existingIds\.has\(entry\.id\)/)
assert.match(controlsSource, /aria-live="polite"/)
assert.match(controlsSource, /aria-label="Nutrition data controls quick start"/)
assert.match(controlsSource, /htmlFor="nutrition-journal-search"/)
assert.match(controlsSource, /htmlFor="nutrition-journal-date"/)
assert.match(controlsSource, /No valid nutrition journal records yet/)
assert.match(controlsSource, /No missing day is inserted as zero/)
assert.match(controlsSource, /Descriptive journal totals only/)
assert.match(controlsSource, /Difference in recorded totals only/)
assert.match(controlsSource, /role="img"/)
assert.match(controlsSource, /There is no automatic upload or background sync from this tab/)
assert.match(controlsSource, /do not synthesize, correct or clinically interpret/i)
assert.doesNotMatch(controlsSource, /\bfetch\s*\(/, 'nutrition journal controls must remain local and offline-capable')
assert.doesNotMatch(controlsSource, /axios|XMLHttpRequest|WebSocket/, 'nutrition data controls must not acquire a hidden network path')

const hubSource = readFileSync(new URL('../../src/pages/PusatGizi.tsx', import.meta.url), 'utf8')
assert.match(hubSource, /NutritionDataControls/)
assert.match(hubSource, /id: 'data'/)
assert.match(hubSource, /Local journal import\/export, validation and recovery controls/)

console.log('Nutrition journal controls now cover bounded local import/export, recorded-only snapshot/timeline/trend/chart, search/filter, descriptive comparison, accessibility/onboarding and explicit privacy/scientific boundaries.')
