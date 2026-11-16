// "Your systems" board: one row per body system with the person's own latest measured signal, or an explicit
// "nothing recorded". Pure: the caller injects `now`. It states how long ago something was recorded, never
// whether a value is good or bad, and it never fills a system that has no data with a guess.
import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../data/bodySystems'
import type { SinyalSistem } from '../../../lib/sinyalPribadiSistem'

/** Display convention only (not a clinical threshold): recorded within the last 30 days. */
export const RECENT_DAYS = 30
const DAY_MS = 86_400_000

export type Recency = 'recent' | 'older' | 'unknown' | 'none'

export interface SystemBoardRow {
  readonly id: BodySystemId
  readonly label: string
  readonly signalCount: number
  readonly headline: SinyalSistem | null
  readonly ageDays: number | null
  readonly recency: Recency
}

const SYSTEM_IDS: ReadonlySet<string> = new Set(BODY_SYSTEM_SOURCE_WAVE.map((s) => s.id))

/** Accepts only a known system id from a URL; anything else (case variants, prototype keys, blanks) is rejected. */
export function parseSystemParam(raw: string | null | undefined): BodySystemId | null {
  return typeof raw === 'string' && SYSTEM_IDS.has(raw) ? (raw as BodySystemId) : null
}

function ageOf(recordedAt: string, now: Date): number | null {
  const t = Date.parse(recordedAt)
  const n = now.getTime()
  if (!Number.isFinite(t) || !Number.isFinite(n) || t > n) return null
  return Math.floor((n - t) / DAY_MS)
}

export function buildSystemBoard(
  signals: ReadonlyMap<BodySystemId, readonly SinyalSistem[]>,
  now: Date,
): SystemBoardRow[] {
  const rows = BODY_SYSTEM_SOURCE_WAVE.map((system, order): SystemBoardRow & { order: number } => {
    const list = signals.get(system.id) ?? []
    // Newest first, by recording time (the input order is not trusted).
    const headline = [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null
    const ageDays = headline ? ageOf(headline.recordedAt, now) : null
    const recency: Recency = !headline ? 'none' : ageDays === null ? 'unknown' : ageDays <= RECENT_DAYS ? 'recent' : 'older'
    return { id: system.id, label: system.label, signalCount: list.length, headline, ageDays, recency, order }
  })
  // Systems with data first (most recently recorded first), then the rest in canonical order.
  rows.sort((a, b) => {
    if ((a.headline === null) !== (b.headline === null)) return a.headline === null ? 1 : -1
    if (a.headline && b.headline) {
      const c = b.headline.recordedAt.localeCompare(a.headline.recordedAt)
      if (c !== 0) return c
    }
    return a.order - b.order
  })
  return rows.map(({ order: _o, ...row }) => row)
}

/** Plain-language age for a row; null (unreadable or future date) says so instead of guessing. */
export function formatAge(ageDays: number | null): string {
  if (ageDays === null || !Number.isInteger(ageDays) || ageDays < 0) return 'date unreadable'
  if (ageDays === 0) return 'today'
  if (ageDays === 1) return 'yesterday'
  return `${ageDays} days ago`
}
