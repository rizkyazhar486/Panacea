import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { FoodEntry } from '../../src/lib/types.ts'
import {
  MAX_NUTRITION_REPORT_DAYS,
  buildNutritionRecordedReport,
  formatNutritionRecordedReport,
} from '../../src/lib/nutritionRecordedReport.ts'

const entries: FoodEntry[] = Array.from({ length: 9 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0')
  return {
    id: `food-${day}`,
    date: `2026-09-${day}`,
    name: `Recorded food ${day}`,
    grams: 100,
    kcal: 100 + index,
    carbs: 10 + index,
    protein: 5 + index,
    fat: 2 + index,
  }
})

assert.equal(MAX_NUTRITION_REPORT_DAYS, 7)
const report = buildNutritionRecordedReport(entries)
assert.ok(report)
assert.equal(report.scope, 'recorded-journal-only')
assert.equal(report.periodStart, '2026-09-03')
assert.equal(report.periodEnd, '2026-09-09')
assert.equal(report.recordedDays, 7)
assert.equal(report.entryCount, 7)
assert.equal(report.totals.kcal, 735)
assert.equal(report.meanPerRecordedDay.kcal, 105)
assert.match(report.sourceNote, /Existing local Nutrition journal records only/)
assert.match(report.boundary, /not a calorie or macro target/)
assert.equal(buildNutritionRecordedReport([], 7), null)
assert.equal(buildNutritionRecordedReport(entries, 0), null)

const gapped: FoodEntry[] = [
  { id: 'a', date: '2026-09-01', name: 'A', grams: 100, kcal: 100, carbs: 10, protein: 5, fat: 2 },
  { id: 'b', date: '2026-09-10', name: 'B', grams: 100, kcal: 200, carbs: 20, protein: 10, fat: 4 },
]
const gappedReport = buildNutritionRecordedReport(gapped)
assert.ok(gappedReport)
assert.equal(gappedReport.recordedDays, 2, 'missing calendar days must not become zero-valued observations')
assert.equal(gappedReport.totals.kcal, 300)
assert.equal(gappedReport.meanPerRecordedDay.kcal, 150)

const withInvalid = [
  ...gapped,
  { id: 'bad', date: '2026-09-11', name: 'Bad', grams: 0, kcal: 9999, carbs: 9999, protein: 9999, fat: 9999 },
] as FoodEntry[]
const sanitizedReport = buildNutritionRecordedReport(withInvalid)
assert.ok(sanitizedReport)
assert.equal(sanitizedReport.entryCount, 2)
assert.equal(sanitizedReport.totals.kcal, 300)

const plainText = formatNutritionRecordedReport(gappedReport)
assert.match(plainText, /300 kcal/)
assert.match(plainText, /carbs 30 g/)
assert.match(plainText, /missing calendar dates remain missing/)
assert.match(plainText, /original food-source provenance is not inferred/)
assert.match(plainText, /not a calorie or macro target/)
assert.doesNotMatch(plainText, /you should eat|ideal intake|healthy score|unhealthy|personalized target|treatment plan/i)

const component = readFileSync(new URL('../../src/components/NutritionRecordedReportCard.tsx', import.meta.url), 'utf8')
const workbench = readFileSync(new URL('../../src/pages/NutritionDataWorkbench.tsx', import.meta.url), 'utf8')
assert.match(component, /Recorded nutrition journal report/)
assert.match(component, /No valid recorded Nutrition journal entries are available yet/)
assert.match(component, /Portable plain-text report/)
assert.match(component, /missing calendar dates stay missing/i)
assert.doesNotMatch(component, /\bfetch\s*\(|\baxios\b|setInterval\s*\(/)
assert.match(workbench, /NutritionRecordedReportCard/)
assert.match(workbench, /<NutritionRecordedReportCard entries=\{state\.foods\} \/>/)

console.log('Feature Factory nutrition report: bounded recorded-only structured report is deterministic, unit-explicit and non-clinical.')
