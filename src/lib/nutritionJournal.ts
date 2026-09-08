import type { FoodEntry } from './types'

export const NUTRITION_JOURNAL_SCHEMA = 'panacea-nutrition-journal' as const
export const NUTRITION_JOURNAL_VERSION = 1 as const
export const MAX_NUTRITION_IMPORT_BYTES = 1_000_000
export const MAX_NUTRITION_IMPORT_ENTRIES = 200
export const MAX_NUTRITION_EXPORT_ENTRIES = 1_000
export const MAX_NUTRITION_TIMELINE_DAYS = 30
export const MAX_NUTRITION_FILTER_RESULTS = 50

export interface NutritionJournalEnvelope {
  schema: typeof NUTRITION_JOURNAL_SCHEMA
  version: typeof NUTRITION_JOURNAL_VERSION
  entries: FoodEntry[]
}

export interface NutritionJournalSanitizeResult {
  entries: FoodEntry[]
  rejected: number
}

export interface NutritionJournalDaySummary {
  date: string
  entries: number
  grams: number
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export interface NutritionJournalDayComparison {
  previous: NutritionJournalDaySummary
  latest: NutritionJournalDaySummary
  delta: Pick<NutritionJournalDaySummary, 'entries' | 'grams' | 'kcal' | 'carbs' | 'protein' | 'fat'>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
}

function isValidIsoDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
}

/**
 * Validate one recorded food entry as software data only.
 *
 * These checks are intentionally not nutritional reference ranges. They only
 * reject malformed, non-finite or structurally unsafe persisted/imported data.
 * Nutrient accuracy still depends on the source used when the entry was logged.
 */
export function sanitizeNutritionFoodEntry(value: unknown): FoodEntry | null {
  if (!isRecord(value)) return null
  const id = typeof value.id === 'string' ? value.id.trim() : ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const date = typeof value.date === 'string' ? value.date.trim() : ''
  if (!id || id.length > 200 || !name || name.length > 200 || !isValidIsoDay(date)) return null
  if (!isFiniteNonNegative(value.grams) || value.grams <= 0) return null
  if (!isFiniteNonNegative(value.kcal)
    || !isFiniteNonNegative(value.carbs)
    || !isFiniteNonNegative(value.protein)
    || !isFiniteNonNegative(value.fat)) return null

  return {
    id,
    date,
    name,
    grams: value.grams,
    kcal: value.kcal,
    carbs: value.carbs,
    protein: value.protein,
    fat: value.fat,
  }
}

export function sanitizeNutritionJournal(
  value: unknown,
  limit = MAX_NUTRITION_IMPORT_ENTRIES,
): NutritionJournalSanitizeResult {
  if (!Array.isArray(value)) return { entries: [], rejected: value == null ? 0 : 1 }
  const boundedLimit = Math.max(0, Math.floor(limit))
  const entries: FoodEntry[] = []
  const seenIds = new Set<string>()
  let rejected = 0

  for (const candidate of value) {
    const entry = sanitizeNutritionFoodEntry(candidate)
    if (!entry || seenIds.has(entry.id) || entries.length >= boundedLimit) {
      rejected += 1
      continue
    }
    seenIds.add(entry.id)
    entries.push(entry)
  }

  return { entries, rejected }
}

export function buildNutritionJournalTimeline(
  entries: readonly FoodEntry[],
  maxDays = 7,
): NutritionJournalDaySummary[] {
  const boundedDays = Math.min(MAX_NUTRITION_TIMELINE_DAYS, Math.max(0, Math.floor(maxDays)))
  if (!boundedDays) return []
  const sanitized = sanitizeNutritionJournal(entries, MAX_NUTRITION_EXPORT_ENTRIES).entries
  const byDate = new Map<string, NutritionJournalDaySummary>()

  for (const entry of sanitized) {
    const current = byDate.get(entry.date) ?? {
      date: entry.date,
      entries: 0,
      grams: 0,
      kcal: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
    }
    current.entries += 1
    current.grams += entry.grams
    current.kcal += entry.kcal
    current.carbs += entry.carbs
    current.protein += entry.protein
    current.fat += entry.fat
    byDate.set(entry.date, current)
  }

  const latest = [...byDate.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, boundedDays)
  return latest.reverse()
}

export function latestNutritionJournalSnapshot(entries: readonly FoodEntry[]) {
  const timeline = buildNutritionJournalTimeline(entries, 1)
  return timeline[0] ?? null
}

export function compareLatestNutritionJournalDays(entries: readonly FoodEntry[]): NutritionJournalDayComparison | null {
  const timeline = buildNutritionJournalTimeline(entries, 2)
  if (timeline.length < 2) return null
  const [previous, latest] = timeline
  return {
    previous,
    latest,
    delta: {
      entries: latest.entries - previous.entries,
      grams: latest.grams - previous.grams,
      kcal: latest.kcal - previous.kcal,
      carbs: latest.carbs - previous.carbs,
      protein: latest.protein - previous.protein,
      fat: latest.fat - previous.fat,
    },
  }
}

export function filterNutritionJournalEntries(
  entries: readonly FoodEntry[],
  query = '',
  date = '',
  limit = MAX_NUTRITION_FILTER_RESULTS,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const normalizedDate = date.trim()
  const boundedLimit = Math.min(MAX_NUTRITION_FILTER_RESULTS, Math.max(0, Math.floor(limit)))
  if (!boundedLimit) return []
  return sanitizeNutritionJournal(entries, MAX_NUTRITION_EXPORT_ENTRIES).entries
    .filter((entry) => !normalizedDate || entry.date === normalizedDate)
    .filter((entry) => !normalizedQuery
      || entry.name.toLocaleLowerCase().includes(normalizedQuery)
      || entry.date.includes(normalizedQuery))
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
    .slice(0, boundedLimit)
}

export function parseNutritionJournalJson(text: string): NutritionJournalSanitizeResult {
  if (new TextEncoder().encode(text).byteLength > MAX_NUTRITION_IMPORT_BYTES) {
    throw new Error('Nutrition journal file is larger than the 1 MB import limit.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Nutrition journal is not valid JSON.')
  }
  if (!isRecord(parsed)
    || parsed.schema !== NUTRITION_JOURNAL_SCHEMA
    || parsed.version !== NUTRITION_JOURNAL_VERSION) {
    throw new Error('Nutrition journal schema/version is not supported.')
  }
  return sanitizeNutritionJournal(parsed.entries, MAX_NUTRITION_IMPORT_ENTRIES)
}

export function serializeNutritionJournal(entries: readonly FoodEntry[]) {
  const sanitized = sanitizeNutritionJournal(entries, MAX_NUTRITION_EXPORT_ENTRIES)
  const envelope: NutritionJournalEnvelope = {
    schema: NUTRITION_JOURNAL_SCHEMA,
    version: NUTRITION_JOURNAL_VERSION,
    entries: sanitized.entries,
  }
  return {
    json: `${JSON.stringify(envelope, null, 2)}\n`,
    exported: sanitized.entries.length,
    rejected: sanitized.rejected,
  }
}
