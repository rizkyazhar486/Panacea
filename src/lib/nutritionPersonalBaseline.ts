import type { FoodEntry } from './types'
import { buildNutritionJournalTimeline } from './nutritionJournal'

export const MAX_NUTRITION_BASELINE_DAYS = 30
export const MIN_NUTRITION_BASELINE_DAYS = 3

export type NutritionBaselineMetric = 'kcal' | 'carbs' | 'protein' | 'fat'

export interface NutritionPersonalBaseline {
  metric: NutritionBaselineMetric
  observedDays: number
  median: number
  q1: number
  q3: number
  firstDate: string
  latestDate: string
  unit: 'kcal' | 'g'
  method: 'nist-percentile-n-plus-one'
  scope: 'personal-descriptive-recorded-journal-only'
}

function percentile(sorted: readonly number[], p: number): number {
  if (!sorted.length) throw new Error('nutrition_baseline_percentile_requires_data')
  const position = p * (sorted.length + 1)
  if (position <= 1) return sorted[0]
  if (position >= sorted.length) return sorted[sorted.length - 1]
  const lowerIndex = Math.floor(position) - 1
  const fraction = position - Math.floor(position)
  return sorted[lowerIndex] + fraction * (sorted[lowerIndex + 1] - sorted[lowerIndex])
}

/**
 * Summarize the user's own validated recorded nutrition history.
 *
 * This is deliberately descriptive only. It is not a population reference
 * interval, dietary requirement, adequacy threshold, diagnosis, treatment
 * target or recommendation. Missing calendar dates are never inserted as zero.
 */
export function buildNutritionPersonalBaseline(
  entries: readonly FoodEntry[],
  metric: NutritionBaselineMetric,
  maxDays = MAX_NUTRITION_BASELINE_DAYS,
): NutritionPersonalBaseline | null {
  const boundedDays = Math.min(
    MAX_NUTRITION_BASELINE_DAYS,
    Math.max(0, Math.floor(maxDays)),
  )
  if (boundedDays < MIN_NUTRITION_BASELINE_DAYS) return null

  const timeline = buildNutritionJournalTimeline(entries, boundedDays)
  if (timeline.length < MIN_NUTRITION_BASELINE_DAYS) return null

  const values = timeline
    .map((day) => day[metric])
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)
  if (values.length < MIN_NUTRITION_BASELINE_DAYS) return null

  return {
    metric,
    observedDays: values.length,
    median: percentile(values, 0.5),
    q1: percentile(values, 0.25),
    q3: percentile(values, 0.75),
    firstDate: timeline[0].date,
    latestDate: timeline[timeline.length - 1].date,
    unit: metric === 'kcal' ? 'kcal' : 'g',
    method: 'nist-percentile-n-plus-one',
    scope: 'personal-descriptive-recorded-journal-only',
  }
}
