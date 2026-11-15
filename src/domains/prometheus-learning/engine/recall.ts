// Self-rated recall practice over items that already carry their own sourced text — for example the sourced
// physiology mechanisms on the Body Exposure stage. The learner explains an item from memory, reveals the source
// text, and says whether they recalled it. Nothing here grades an answer: the rating is the learner's own, and the
// schedule is the same simple Leitner step as question practice (progress.ts) — not an optimised or validated
// algorithm, and not a certificate of competence. Pure: day numbers are injected integers; no clock, storage or RNG.

import { LEITNER_INTERVAL_DAYS, leitnerNext } from './progress.ts'

export const RECALL_SCHEMA_VERSION = '1.0.0' as const

export interface RecallEntry {
  /** Leitner box, an index into LEITNER_INTERVAL_DAYS. */
  box: number
  /** First day on which the item is due again. */
  dueDay: number
  /** Day of the most recent self-rating. */
  lastDay: number
  recalled: number
  missed: number
}

export interface RecallLog {
  schemaVersion: string
  entries: Readonly<Record<string, RecallEntry>>
}

export const newRecallLog = (): RecallLog => ({ schemaVersion: RECALL_SCHEMA_VERSION, entries: {} })

/** The log's own entry for an item — never an inherited property such as `toString`. */
export const recallEntryOf = (log: RecallLog, itemId: string): RecallEntry | undefined =>
  Object.prototype.hasOwnProperty.call(log.entries, itemId) ? log.entries[itemId] : undefined

const isDay = (day: unknown): day is number => Number.isInteger(day) && (day as number) >= 0

export type RecordRecallResult =
  | { ok: true; log: RecallLog; entry: RecallEntry }
  | { ok: false; reason: 'unknown_item' | 'bad_rating' | 'bad_day' | 'already_rated_today' }

/**
 * Records one self-rating. Refused with the log unchanged: an item outside `knownIds`, a rating that is not a
 * boolean, a day that is not a non-negative integer or falls before the item's last rating (a clock moved back),
 * and a second rating of the same item on the same day (a double submission).
 */
export function recordRecall(
  log: RecallLog,
  knownIds: ReadonlySet<string>,
  input: { itemId: string; recalled: boolean; day: number },
): RecordRecallResult {
  if (!knownIds.has(input.itemId)) return { ok: false, reason: 'unknown_item' }
  if (typeof input.recalled !== 'boolean') return { ok: false, reason: 'bad_rating' }
  if (!isDay(input.day)) return { ok: false, reason: 'bad_day' }
  const prev = recallEntryOf(log, input.itemId)
  if (prev && input.day < prev.lastDay) return { ok: false, reason: 'bad_day' }
  if (prev && input.day === prev.lastDay) return { ok: false, reason: 'already_rated_today' }
  const entry: RecallEntry = {
    ...leitnerNext(prev, input.recalled, input.day),
    lastDay: input.day,
    recalled: (prev?.recalled ?? 0) + (input.recalled ? 1 : 0),
    missed: (prev?.missed ?? 0) + (input.recalled ? 0 : 1),
  }
  return { ok: true, entry, log: { ...log, entries: { ...log.entries, [input.itemId]: entry } } }
}

export interface RecallDeckStatus {
  total: number
  /** Items rated at least once. */
  studied: number
  /** Items due on the day, most overdue first; ties keep the deck's order. */
  due: readonly string[]
  /** Items never rated, in the deck's order. */
  fresh: readonly string[]
  /** What a session on this day goes through: everything due, then everything never rated. */
  queue: readonly string[]
  /** The first later day on which a rated item falls due, or null when none is waiting. */
  nextDueDay: number | null
}

export type RecallDeckPlan = ({ ok: true } & RecallDeckStatus) | { ok: false; reason: 'bad_day' | 'duplicate_item' }

/** Where a deck stands on a day. Entries for items outside the deck are ignored; a deck must not list an item twice. */
export function planRecallDeck(log: RecallLog, itemIds: readonly string[], day: number): RecallDeckPlan {
  if (!isDay(day)) return { ok: false, reason: 'bad_day' }
  if (new Set(itemIds).size !== itemIds.length) return { ok: false, reason: 'duplicate_item' }
  const due: { id: string; dueDay: number; order: number }[] = []
  const fresh: string[] = []
  let nextDueDay: number | null = null
  for (const [order, id] of itemIds.entries()) {
    const entry = recallEntryOf(log, id)
    if (!entry) fresh.push(id)
    else if (entry.dueDay <= day) due.push({ id, dueDay: entry.dueDay, order })
    else nextDueDay = nextDueDay === null ? entry.dueDay : Math.min(nextDueDay, entry.dueDay)
  }
  const dueIds = due.sort((a, b) => a.dueDay - b.dueDay || a.order - b.order).map((item) => item.id)
  return {
    ok: true,
    total: itemIds.length,
    studied: itemIds.length - fresh.length,
    due: dueIds,
    fresh,
    queue: [...dueIds, ...fresh],
    nextDueDay,
  }
}

export const serializeRecallLog = (log: RecallLog): string => JSON.stringify(log)

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

/** True when the entry could have come from recordRecall: whole numbers, a real box, a due day that box implies. */
function wellFormed(value: unknown): value is RecallEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entry = value as Record<string, unknown>
  if (!isCount(entry.box) || entry.box >= LEITNER_INTERVAL_DAYS.length) return false
  if (!isDay(entry.lastDay) || !isCount(entry.recalled) || !isCount(entry.missed) || entry.recalled + entry.missed === 0) return false
  return entry.dueDay === entry.lastDay + LEITNER_INTERVAL_DAYS[entry.box]!
}

export type RestoreRecallResult =
  | { ok: true; log: RecallLog; dropped: number }
  | { ok: false; reason: 'corrupt' | 'incompatible_version' }

/**
 * Restores a stored log. Nothing stored (null) is a fresh log. Text that is not a well-formed log, or comes from an
 * incompatible schema, is refused so the caller starts fresh rather than guessing. Entries for items no longer in
 * the deck are dropped and counted: they refer to nothing that is shown, and keeping the rest of a learner's record
 * matters more than failing the whole log because one source was renamed.
 */
export function restoreRecallLog(raw: string | null, knownIds: ReadonlySet<string>): RestoreRecallResult {
  if (raw === null) return { ok: true, log: newRecallLog(), dropped: 0 }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return { ok: false, reason: 'corrupt' } }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'corrupt' }
  const { schemaVersion, entries } = parsed as Record<string, unknown>
  if (typeof schemaVersion !== 'string' || !entries || typeof entries !== 'object' || Array.isArray(entries)) return { ok: false, reason: 'corrupt' }
  if (schemaVersion.split('.')[0] !== RECALL_SCHEMA_VERSION.split('.')[0]) return { ok: false, reason: 'incompatible_version' }
  const kept: Record<string, RecallEntry> = {}
  let dropped = 0
  for (const [id, entry] of Object.entries(entries)) {
    if (!wellFormed(entry)) return { ok: false, reason: 'corrupt' }
    if (!knownIds.has(id)) { dropped += 1; continue }
    const { box, dueDay, lastDay, recalled, missed } = entry
    Object.defineProperty(kept, id, { value: { box, dueDay, lastDay, recalled, missed }, enumerable: true, writable: true, configurable: true })
  }
  return { ok: true, log: { schemaVersion: RECALL_SCHEMA_VERSION, entries: kept }, dropped }
}

const DAY_MS = 86_400_000

/**
 * The learner's calendar day as a whole number, from an instant (ms since the epoch) and the local offset at that
 * instant in minutes as `Date#getTimezoneOffset` reports it (positive west of UTC). Null for a value no clock gives.
 */
export function calendarDayOf(epochMs: number, timezoneOffsetMinutes: number): number | null {
  if (!Number.isFinite(epochMs) || !Number.isFinite(timezoneOffsetMinutes) || Math.abs(timezoneOffsetMinutes) > 18 * 60) return null
  const day = Math.floor((epochMs - timezoneOffsetMinutes * 60_000) / DAY_MS)
  return day >= 0 ? day : null
}
