export interface LoggedSubtotal {
  total: number | null
  recorded: number
  missing: number
  overflow: boolean
}

/** Only explicit finite nonnegative numbers are observations; absence is not zero. */
export function loggedSubtotal(values: readonly unknown[]): LoggedSubtotal {
  let total = 0
  let recorded = 0
  let missing = 0
  for (const value of values) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) missing++
    else { total += value; recorded++ }
  }
  const overflow = !Number.isFinite(total)
  return { total: recorded && !overflow ? total : null, recorded, missing, overflow }
}

export function localCalorieDay(timestamp: number): string | null {
  if (!Number.isFinite(timestamp)) return null
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function loggedCaloriesToday(foods: readonly unknown[], workouts: readonly unknown[], now = Date.now()) {
  const day = localCalorieDay(now)
  const food: unknown[] = []
  const training: unknown[] = []
  if (day) {
    for (const entry of foods) {
      if (entry && typeof entry === 'object' && 'date' in entry && entry.date === day) food.push('kcal' in entry ? entry.kcal : undefined)
    }
    for (const entry of workouts) {
      if (!entry || typeof entry !== 'object' || !('mulai' in entry) || typeof entry.mulai !== 'string') continue
      if (localCalorieDay(Date.parse(entry.mulai)) === day) training.push('kcal' in entry ? entry.kcal : undefined)
    }
  }
  return { day, food: loggedSubtotal(food), training: loggedSubtotal(training) }
}
