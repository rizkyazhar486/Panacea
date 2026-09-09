import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_FILTER_RESULTS,
  filterNutritionJournalEntries,
} from '../../src/lib/nutritionJournal.ts'

const base = {
  grams: 100,
  kcal: 200,
  carbs: 20,
  protein: 10,
  fat: 5,
}

const recorded = [
  { id: 'a', date: '2026-09-01', name: 'Nasi merah', ...base },
  { id: 'b', date: '2026-09-02', name: 'Greek Yogurt', ...base },
  { id: 'c', date: '2026-09-02', name: 'Tempe Panggang', ...base },
]

assert.deepEqual(filterNutritionJournalEntries([], 'anything'), [])
assert.deepEqual(
  filterNutritionJournalEntries(recorded, 'yogurt').map((entry) => entry.id),
  ['b'],
  'Name search should be local, case-insensitive and deterministic.',
)
assert.deepEqual(
  filterNutritionJournalEntries(recorded, 'GREEK').map((entry) => entry.id),
  ['b'],
)
assert.deepEqual(
  filterNutritionJournalEntries(recorded, '', '2026-09-02').map((entry) => entry.id),
  ['b', 'c'],
  'Exact recorded-date filter must not synthesize missing calendar dates.',
)
assert.deepEqual(
  filterNutritionJournalEntries(recorded, '2026-09-01').map((entry) => entry.id),
  ['a'],
  'The lightweight query may match the recorded ISO date as well as food name.',
)

const malformed = [
  ...recorded,
  { ...recorded[0], id: 'bad-date', date: 'not-a-date', name: 'Should disappear' },
  { ...recorded[0], id: 'nan-kcal', kcal: Number.NaN, name: 'Should disappear too' },
]
assert.deepEqual(
  filterNutritionJournalEntries(malformed as never, 'Should'),
  [],
  'Malformed rows must fail closed through the shared journal sanitizer before search.',
)

const many = Array.from({ length: MAX_NUTRITION_FILTER_RESULTS + 20 }, (_, index) => ({
  id: `bounded-${index}`,
  date: '2026-09-03',
  name: `Recorded item ${String(index).padStart(2, '0')}`,
  ...base,
}))
const bounded = filterNutritionJournalEntries(many, '', '', MAX_NUTRITION_FILTER_RESULTS + 1_000)
assert.equal(bounded.length, MAX_NUTRITION_FILTER_RESULTS, 'Search rendering must remain hard-capped.')
assert.deepEqual(bounded.map((entry) => entry.id), many.slice(0, MAX_NUTRITION_FILTER_RESULTS).map((entry) => entry.id))

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /type="search"/)
assert.match(page, /Food name or recorded date/)
assert.match(page, /All recorded dates/)
assert.match(page, /Showing up to \{MAX_NUTRITION_FILTER_RESULTS\} validated local records; search never queries a remote service\./)
assert.match(page, /No validated recorded entry matches this filter\./)
assert.doesNotMatch(page, /\bfetch\s*\(|\baxios\b/)
assert.doesNotMatch(page, /healthy result|unhealthy result|recommended food|diagnos/i)

console.log('Feature Factory nutrition search: validated local name/date filtering is deterministic, bounded, empty-safe and network-free.')
