import type { FoodEntry } from './types'
import { buildNutritionJournalTimeline } from './nutritionJournal'

export const MAX_NUTRITION_CALCULATOR_DAYS = 30

export interface NutritionJournalCalculatorMetric {
  total: number
  meanPerRecordedDay: number
  unit: 'kcal' | 'g'
}

export interface NutritionJournalCalculatorResult {
  requestedRecordedDays: number
  observedDays: number
  firstDate: string
  latestDate: string
  kcal: NutritionJournalCalculatorMetric
  carbs: NutritionJournalCalculatorMetric
  protein: NutritionJournalCalculatorMetric
  fat: NutritionJournalCalculatorMetric
  formula: 'total=sum(recorded-day totals); mean=total/observed recorded days'
  scope: 'recorded-journal-arithmetic-only'
}

function metric(total: number, observedDays: number, unit: 'kcal' | 'g'): NutritionJournalCalculatorMetric {
  return {
    total,
    meanPerRecordedDay: total / observedDays,
    unit,
  }
}

/**
 * Calculate transparent arithmetic over actual validated recorded dates only.
 * Missing calendar dates are not inserted and are never treated as zero.
 * Outputs are journal summaries, not dietary requirements or targets.
 */
export function calculateNutritionJournalWindow(
  entries: readonly FoodEntry[],
  requestedRecordedDays: number,
): NutritionJournalCalculatorResult | null {
  const boundedDays = Math.min(
    MAX_NUTRITION_CALCULATOR_DAYS,
    Math.max(1, Math.floor(Number.isFinite(requestedRecordedDays) ? requestedRecordedDays : 1)),
  )
  const timeline = buildNutritionJournalTimeline(entries, boundedDays)
  if (!timeline.length) return null

  const totals = timeline.reduce(
    (acc, day) => ({
      kcal: acc.kcal + day.kcal,
      carbs: acc.carbs + day.carbs,
      protein: acc.protein + day.protein,
      fat: acc.fat + day.fat,
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  )

  return {
    requestedRecordedDays: boundedDays,
    observedDays: timeline.length,
    firstDate: timeline[0].date,
    latestDate: timeline[timeline.length - 1].date,
    kcal: metric(totals.kcal, timeline.length, 'kcal'),
    carbs: metric(totals.carbs, timeline.length, 'g'),
    protein: metric(totals.protein, timeline.length, 'g'),
    fat: metric(totals.fat, timeline.length, 'g'),
    formula: 'total=sum(recorded-day totals); mean=total/observed recorded days',
    scope: 'recorded-journal-arithmetic-only',
  }
}
