export interface NutritionDataExplainabilityStep {
  id: 'recorded-input' | 'structural-validation' | 'bounded-transform' | 'recorded-output'
  title: string
  detail: string
}

export interface NutritionPlainLanguageItem {
  id: 'recorded-only' | 'numbers-as-recorded' | 'missing-stays-missing' | 'decision-boundary'
  text: string
}

export const NUTRITION_DATA_EXPLAINABILITY_STEPS: readonly NutritionDataExplainabilityStep[] = [
  {
    id: 'recorded-input',
    title: '1 · Recorded input',
    detail: 'The Data tab starts from food entries the user recorded or explicitly imported. Empty history stays empty; this layer does not generate a sample meal or missing day.',
  },
  {
    id: 'structural-validation',
    title: '2 · Structural validation',
    detail: 'The shared journal sanitizer checks record identity, ISO date shape, finite non-negative nutrient fields and bounded record counts. Passing these software checks does not prove that a food identity or nutrient value is scientifically accurate.',
  },
  {
    id: 'bounded-transform',
    title: '3 · Bounded transforms',
    detail: 'Search, timeline, descriptive trend, personal-history baseline and calculator reuse validated recorded rows with hard result/history limits. Missing calendar dates remain missing rather than being silently inserted as zero.',
  },
  {
    id: 'recorded-output',
    title: '4 · Recorded output',
    detail: 'The UI presents recorded dates, counts, kcal and gram values with explicit boundaries. These outputs are descriptive journal views, not calorie or macro requirements, adequacy judgments, diagnoses, treatment rules or dietary recommendations.',
  },
] as const

export const NUTRITION_PLAIN_LANGUAGE_GUIDE: readonly NutritionPlainLanguageItem[] = [
  {
    id: 'recorded-only',
    text: 'This page shows only food entries you recorded or chose to import. It does not make up a meal or a missing day.',
  },
  {
    id: 'numbers-as-recorded',
    text: 'Calories and grams are shown as recorded. This view does not turn those numbers into a health grade or a daily eating goal.',
  },
  {
    id: 'missing-stays-missing',
    text: 'If a day or value is missing, it stays missing instead of being silently changed to zero.',
  },
  {
    id: 'decision-boundary',
    text: 'Use the original food source and appropriate clinical guidance for health decisions; this recorded-data view does not diagnose or prescribe.',
  },
] as const
