export interface StoredWorkoutLogEntry {
  id: string
  exId: string
  date: string
  sets: number
  reps: number
  weight: number
}

interface WorkoutLogStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface WorkoutLogRepairResult {
  entries: StoredWorkoutLogEntry[]
  repaired: boolean
  dropped: number
  reason?: 'invalid-json' | 'invalid-shape' | 'invalid-entry'
}

export const WORKOUT_LOG_KEY = 'pm_workout_log'
export const WORKOUT_LOG_BACKUP_KEY = 'pm_workout_log_backup_v1'

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isStoredWorkoutLogEntry(value: unknown): value is StoredWorkoutLogEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entry = value as Record<string, unknown>
  return nonEmptyString(entry.id)
    && nonEmptyString(entry.exId)
    && nonEmptyString(entry.date)
    && Number.isFinite(Date.parse(entry.date))
    && positiveInteger(entry.sets)
    && positiveInteger(entry.reps)
    && finiteNonNegative(entry.weight)
}

export function sanitizeWorkoutLog(value: unknown): StoredWorkoutLogEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter(isStoredWorkoutLogEntry)
}

function backupOnce(storage: WorkoutLogStorage, raw: string) {
  try {
    if (storage.getItem(WORKOUT_LOG_BACKUP_KEY) == null) {
      storage.setItem(WORKOUT_LOG_BACKUP_KEY, raw)
    }
  } catch {
    // Storage can be unavailable in private/restricted contexts. Repairing the
    // active key remains best-effort and must never make Workout crash.
  }
}

/**
 * Repairs only the persisted workout-history envelope. It never invents an
 * exercise, set, rep, load, or timestamp. Invalid source data is backed up
 * once when storage permits, then excluded from the active deterministic log.
 */
export function repairWorkoutLogStorage(storage: WorkoutLogStorage): WorkoutLogRepairResult {
  let raw: string | null
  try {
    raw = storage.getItem(WORKOUT_LOG_KEY)
  } catch {
    return { entries: [], repaired: false, dropped: 0 }
  }

  if (raw == null || raw.trim() === '') {
    return { entries: [], repaired: false, dropped: 0 }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    backupOnce(storage, raw)
    try { storage.setItem(WORKOUT_LOG_KEY, '[]') } catch { /* best effort */ }
    return { entries: [], repaired: true, dropped: 0, reason: 'invalid-json' }
  }

  if (!Array.isArray(parsed)) {
    backupOnce(storage, raw)
    try { storage.setItem(WORKOUT_LOG_KEY, '[]') } catch { /* best effort */ }
    return { entries: [], repaired: true, dropped: 0, reason: 'invalid-shape' }
  }

  const entries = sanitizeWorkoutLog(parsed)
  const dropped = parsed.length - entries.length
  if (dropped === 0) {
    return { entries, repaired: false, dropped: 0 }
  }

  backupOnce(storage, raw)
  try { storage.setItem(WORKOUT_LOG_KEY, JSON.stringify(entries)) } catch { /* best effort */ }
  return { entries, repaired: true, dropped, reason: 'invalid-entry' }
}
