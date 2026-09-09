import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_IMPORT_BYTES,
  MAX_NUTRITION_IMPORT_ENTRIES,
  NUTRITION_JOURNAL_SCHEMA,
  NUTRITION_JOURNAL_VERSION,
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

const controlsSource = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(controlsSource, /No file is uploaded to Panacea/)
assert.match(controlsSource, /file\.size > MAX_NUTRITION_IMPORT_BYTES/)
assert.match(controlsSource, /existingIds\.has\(entry\.id\)/)
assert.match(controlsSource, /aria-live="polite"/)
assert.match(controlsSource, /do not synthesize, correct or clinically interpret/i)
assert.doesNotMatch(controlsSource, /\bfetch\s*\(/, 'nutrition journal controls must remain local and offline-capable')
assert.doesNotMatch(controlsSource, /axios|XMLHttpRequest|WebSocket/, 'nutrition data controls must not acquire a hidden network path')

const hubSource = readFileSync(new URL('../../src/pages/PusatGizi.tsx', import.meta.url), 'utf8')
assert.match(hubSource, /NutritionDataControls/)
assert.match(hubSource, /id: 'data'/)
assert.match(hubSource, /Local journal import\/export, validation and recovery controls/)

console.log('Nutrition journal import/export is bounded, schema-versioned, local-only, fail-closed, deduplicated and free of fabricated nutritional interpretation.')
