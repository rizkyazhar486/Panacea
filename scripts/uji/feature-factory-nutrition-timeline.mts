import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_NUTRITION_TIMELINE_DAYS,
  buildNutritionJournalTimeline,
} from '../../src/lib/nutritionJournal.ts'

const base = {
  grams: 100,
  carbs: 20,
  protein: 10,
  fat: 5,
}

const recorded = [
  { id: 'a-1', date: '2026-09-01', name: 'Recorded A1', kcal: 200, ...base },
  { id: 'a-2', date: '2026-09-01', name: 'Recorded A2', kcal: 100, grams: 50, carbs: 10, protein: 5, fat: 2 },
  { id: 'c-1', date: '2026-09-03', name: 'Recorded C', kcal: 350, ...base },
]

assert.deepEqual(buildNutritionJournalTimeline([], 7), [])
assert.deepEqual(buildNutritionJournalTimeline(recorded, 0), [])

const timeline = buildNutritionJournalTimeline(recorded, 7)
assert.equal(timeline.length, 2, 'Only actually recorded dates should appear in the timeline.')
assert.deepEqual(timeline.map((day) => day.date), ['2026-09-01', '2026-09-03'], 'Timeline must remain chronological.')
assert.deepEqual(timeline[0], {
  date: '2026-09-01',
  entries: 2,
  grams: 150,
  kcal: 300,
  carbs: 30,
  protein: 15,
  fat: 7,
})
assert.equal(timeline.some((day) => day.date === '2026-09-02'), false, 'Missing calendar dates must stay missing rather than being inserted as zero.')

const malformed = buildNutritionJournalTimeline([
  ...recorded,
  { ...recorded[0], id: 'bad-date', date: '2026-02-30', kcal: 9999 },
  { ...recorded[0], id: 'bad-number', date: '2026-09-04', kcal: Number.POSITIVE_INFINITY },
] as never, 7)
assert.deepEqual(malformed.map((day) => day.date), ['2026-09-01', '2026-09-03'], 'Malformed rows must fail closed through the shared journal sanitizer.')

const many = Array.from({ length: MAX_NUTRITION_TIMELINE_DAYS + 5 }, (_, index) => ({
  id: `bounded-${index}`,
  date: new Date(Date.UTC(2026, 7, 1 + index)).toISOString().slice(0, 10),
  name: `Recorded ${index}`,
  kcal: 100 + index,
  ...base,
}))
const bounded = buildNutritionJournalTimeline(many, MAX_NUTRITION_TIMELINE_DAYS + 100)
assert.equal(bounded.length, MAX_NUTRITION_TIMELINE_DAYS, 'Timeline must retain at most the configured 30 recorded days.')
assert.equal(bounded[0]?.date, '2026-08-06')
assert.equal(bounded.at(-1)?.date, '2026-09-04')

const latestOne = buildNutritionJournalTimeline(recorded, 1)
assert.deepEqual(latestOne.map((day) => day.date), ['2026-09-03'], 'A smaller requested window must keep the latest recorded date.')

const page = readFileSync(new URL('../../src/pages/NutritionDataControls.tsx', import.meta.url), 'utf8')
assert.match(page, /buildNutritionJournalTimeline\(state\.foods, 7\)/)
assert.match(page, /Recorded-only snapshot \+ timeline/)
assert.match(page, /Latest recorded dates/)
assert.match(page, /missing day is inserted as zero/i)
assert.match(page, /kcal/)
assert.match(page, /C \{Math\.round\(day\.carbs\)\} g/)
assert.match(page, /P \{Math\.round\(day\.protein\)\} g/)
assert.match(page, /F \{Math\.round\(day\.fat\)\} g/)
assert.doesNotMatch(page, /timeline[^\n]{0,80}(target|recommended|adequacy|deficien)/i)

console.log('Feature Factory nutrition timeline: bounded recorded-day aggregation, chronology, units, malformed-row rejection and missing-day semantics are deterministic.')
