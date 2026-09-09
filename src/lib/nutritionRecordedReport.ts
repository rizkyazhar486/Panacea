import type { FoodEntry } from './types'
import { buildNutritionJournalTimeline } from './nutritionJournal'

export const MAX_NUTRITION_REPORT_DAYS = 7 as const

export interface NutritionRecordedReportValues {
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export interface NutritionRecordedReport {
  scope: 'recorded-journal-only'
  periodStart: string
  periodEnd: string
  recordedDays: number
  entryCount: number
  totals: NutritionRecordedReportValues
  meanPerRecordedDay: NutritionRecordedReportValues
  sourceNote: string
  boundary: string
}

const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * Build a bounded descriptive report from existing Nutrition journal records.
 * Missing calendar dates are never inserted and the report intentionally does
 * not derive requirements, adequacy, diagnoses, treatment or recommendations.
 */
export function buildNutritionRecordedReport(
  entries: readonly FoodEntry[],
  maxDays = MAX_NUTRITION_REPORT_DAYS,
): NutritionRecordedReport | null {
  const boundedDays = Math.min(MAX_NUTRITION_REPORT_DAYS, Math.max(0, Math.floor(maxDays)))
  if (!boundedDays) return null

  const timeline = buildNutritionJournalTimeline(entries, boundedDays)
  if (!timeline.length) return null

  const totals = timeline.reduce<NutritionRecordedReportValues>(
    (sum, day) => ({
      kcal: sum.kcal + day.kcal,
      carbs: sum.carbs + day.carbs,
      protein: sum.protein + day.protein,
      fat: sum.fat + day.fat,
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  )

  const recordedDays = timeline.length
  const entryCount = timeline.reduce((sum, day) => sum + day.entries, 0)

  return {
    scope: 'recorded-journal-only',
    periodStart: timeline[0].date,
    periodEnd: timeline[timeline.length - 1].date,
    recordedDays,
    entryCount,
    totals: {
      kcal: round1(totals.kcal),
      carbs: round1(totals.carbs),
      protein: round1(totals.protein),
      fat: round1(totals.fat),
    },
    meanPerRecordedDay: {
      kcal: round1(totals.kcal / recordedDays),
      carbs: round1(totals.carbs / recordedDays),
      protein: round1(totals.protein / recordedDays),
      fat: round1(totals.fat / recordedDays),
    },
    sourceNote: 'Existing local Nutrition journal records only; original food-source provenance is not inferred by this report.',
    boundary: 'Descriptive recorded data only — not a calorie or macro target, adequacy judgment, diagnosis, treatment rule or dietary recommendation.',
  }
}

export function formatNutritionRecordedReport(report: NutritionRecordedReport): string {
  return [
    'Nutrition recorded journal report',
    `Scope: ${report.scope}`,
    `Period: ${report.periodStart} to ${report.periodEnd}`,
    `Recorded days: ${report.recordedDays} (missing calendar dates remain missing)`,
    `Entries: ${report.entryCount}`,
    `Totals: ${report.totals.kcal} kcal; carbs ${report.totals.carbs} g; protein ${report.totals.protein} g; fat ${report.totals.fat} g`,
    `Mean per recorded day: ${report.meanPerRecordedDay.kcal} kcal; carbs ${report.meanPerRecordedDay.carbs} g; protein ${report.meanPerRecordedDay.protein} g; fat ${report.meanPerRecordedDay.fat} g`,
    `Source: ${report.sourceNote}`,
    `Boundary: ${report.boundary}`,
  ].join('\n')
}
