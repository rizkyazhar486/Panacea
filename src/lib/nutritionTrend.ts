import type { FoodEntry } from './types'
import { buildNutritionJournalTimeline } from './nutritionJournal'

export const MAX_NUTRITION_TREND_DAYS = 7

export type NutritionEnergyTrendDirection = 'higher' | 'lower' | 'flat'

export interface NutritionEnergyTrendSummary {
  firstDate: string
  latestDate: string
  observedDays: number
  elapsedCalendarDays: number
  firstKcal: number
  latestKcal: number
  deltaKcal: number
  kcalPerCalendarDay: number
  direction: NutritionEnergyTrendDirection
}

function isoDayToUtcMs(day: string) {
  return Date.parse(`${day}T00:00:00Z`)
}

/**
 * Summarize only the user's recorded daily energy totals.
 * Missing dates remain missing. This is descriptive arithmetic only and is not
 * a calorie target, energy-balance estimate, adequacy judgment, diagnosis,
 * treatment rule, recommendation, or patient-specific clinical inference.
 */
export function summarizeNutritionEnergyTrend(
  entries: readonly FoodEntry[],
  maxDays = MAX_NUTRITION_TREND_DAYS,
): NutritionEnergyTrendSummary | null {
  const boundedDays = Math.min(MAX_NUTRITION_TREND_DAYS, Math.max(0, Math.floor(maxDays)))
  if (boundedDays < 2) return null

  const timeline = buildNutritionJournalTimeline(entries, boundedDays)
  if (timeline.length < 2) return null

  const first = timeline[0]
  const latest = timeline[timeline.length - 1]
  const elapsedCalendarDays = Math.round((isoDayToUtcMs(latest.date) - isoDayToUtcMs(first.date)) / 86_400_000)
  if (!Number.isFinite(elapsedCalendarDays) || elapsedCalendarDays <= 0) return null

  const deltaKcal = latest.kcal - first.kcal
  return {
    firstDate: first.date,
    latestDate: latest.date,
    observedDays: timeline.length,
    elapsedCalendarDays,
    firstKcal: first.kcal,
    latestKcal: latest.kcal,
    deltaKcal,
    kcalPerCalendarDay: deltaKcal / elapsedCalendarDays,
    direction: deltaKcal > 0 ? 'higher' : deltaKcal < 0 ? 'lower' : 'flat',
  }
}
