export const PRODUCT_EVENT_NAMES = [
  'health_brief_view',
  'health_brief_signal_open',
  'quick_action_open',
  'daily_log_open',
  'feedback_submit',
  'share',
  'feature_open',
  'experiment_exposure',
] as const

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number]

export interface ProductEventInput {
  name: ProductEventName
  surface: string
  target?: string
  sessionId?: string
}

export interface ProductEvent extends ProductEventInput {
  id: string
  userId: string
  at: string
}

export interface RetentionPoint {
  day: 1 | 7 | 30
  eligible: number
  retained: number
  ratePct: number | null
}

export interface ProductLearningSummary {
  eventCount: number
  usersObserved: number
  activeUsers1d: number
  activeUsers7d: number
  activeUsers30d: number
  activatedUsers: number
  activationRatePct: number | null
  repeatUsers7d: number
  retention: RetentionPoint[]
  topTargets: { key: string; users: number; events: number }[]
  dailyActive7d: { day: string; users: number; events: number }[]
  definition: {
    activation: string
    retention: string
    privacy: string
  }
}

const EVENT_SET = new Set<string>(PRODUCT_EVENT_NAMES)
const DAY_MS = 86_400_000
const ACTION_EVENTS = new Set<ProductEventName>([
  'health_brief_signal_open',
  'quick_action_open',
  'daily_log_open',
  'feedback_submit',
  'share',
  'feature_open',
])

function cleanToken(value: unknown, max = 96): string | undefined {
  if (typeof value !== 'string') return undefined
  const out = value.trim()
  if (!out || out.length > max) return undefined
  if (!/^[a-z0-9._:\/-]+$/i.test(out)) return undefined
  return out
}

/**
 * Product-learning telemetry is deliberately NOT a generic analytics envelope.
 * It accepts only an allow-listed event name and short categorical identifiers.
 * Arbitrary properties, health values, free text, diagnoses, measurements,
 * URLs, query strings and device payloads are intentionally discarded.
 */
export function normalizeProductEventInput(
  input: unknown,
  nowMs = Date.now(),
): Omit<ProductEvent, 'id' | 'userId'> | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const name = typeof raw.name === 'string' && EVENT_SET.has(raw.name)
    ? raw.name as ProductEventName
    : null
  const surface = cleanToken(raw.surface, 64)
  if (!name || !surface) return null

  const target = raw.target === undefined ? undefined : cleanToken(raw.target, 96)
  if (raw.target !== undefined && !target) return null

  const sessionId = raw.sessionId === undefined ? undefined : cleanToken(raw.sessionId, 80)
  if (raw.sessionId !== undefined && !sessionId) return null

  return {
    name,
    surface,
    ...(target ? { target } : {}),
    ...(sessionId ? { sessionId } : {}),
    at: new Date(nowMs).toISOString(),
  }
}

function utcDayNumber(iso: string): number | null {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const d = new Date(t)
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS)
}

function dayKey(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)
}

function retentionFor(events: ProductEvent[], nowDay: number, day: 1 | 7 | 30): RetentionPoint {
  const byUser = new Map<string, Set<number>>()
  for (const e of events) {
    const n = utcDayNumber(e.at)
    if (n === null) continue
    const set = byUser.get(e.userId) ?? new Set<number>()
    set.add(n)
    byUser.set(e.userId, set)
  }

  let eligible = 0
  let retained = 0
  for (const days of byUser.values()) {
    const first = Math.min(...days)
    if (first > nowDay - day) continue
    eligible++
    if (days.has(first + day)) retained++
  }

  return {
    day,
    eligible,
    retained,
    ratePct: eligible ? Math.round((retained / eligible) * 1000) / 10 : null,
  }
}

export function summarizeProductEvents(
  inputEvents: ProductEvent[],
  nowMs = Date.now(),
): ProductLearningSummary {
  const events = inputEvents
    .filter((e) => !!e && typeof e.userId === 'string' && EVENT_SET.has(e.name))
    .filter((e) => utcDayNumber(e.at) !== null)

  const nowDay = utcDayNumber(new Date(nowMs).toISOString()) ?? Math.floor(nowMs / DAY_MS)
  const usersObserved = new Set(events.map((e) => e.userId))

  const activeUsers = (days: number) => {
    const cutoff = nowMs - days * DAY_MS
    return new Set(events.filter((e) => Date.parse(e.at) >= cutoff).map((e) => e.userId)).size
  }

  const activated = new Set<string>()
  for (const userId of usersObserved) {
    const userEvents = events.filter((e) => e.userId === userId)
    const sawBrief = userEvents.some((e) => e.name === 'health_brief_view')
    const tookAction = userEvents.some((e) => ACTION_EVENTS.has(e.name))
    if (sawBrief && tookAction) activated.add(userId)
  }

  const recent7 = events.filter((e) => Date.parse(e.at) >= nowMs - 7 * DAY_MS)
  const daysPerUser = new Map<string, Set<number>>()
  for (const e of recent7) {
    const n = utcDayNumber(e.at)
    if (n === null) continue
    const set = daysPerUser.get(e.userId) ?? new Set<number>()
    set.add(n)
    daysPerUser.set(e.userId, set)
  }
  const repeatUsers7d = [...daysPerUser.values()].filter((days) => days.size >= 2).length

  const targetMap = new Map<string, { users: Set<string>; events: number }>()
  for (const e of events) {
    const key = e.target ? `${e.name}:${e.target}` : e.name
    const row = targetMap.get(key) ?? { users: new Set<string>(), events: 0 }
    row.users.add(e.userId)
    row.events++
    targetMap.set(key, row)
  }
  const topTargets = [...targetMap.entries()]
    .map(([key, row]) => ({ key, users: row.users.size, events: row.events }))
    .sort((a, b) => b.users - a.users || b.events - a.events || a.key.localeCompare(b.key))
    .slice(0, 12)

  const dailyActive7d: ProductLearningSummary['dailyActive7d'] = []
  for (let offset = 6; offset >= 0; offset--) {
    const day = nowDay - offset
    const dayEvents = events.filter((e) => utcDayNumber(e.at) === day)
    dailyActive7d.push({
      day: dayKey(day),
      users: new Set(dayEvents.map((e) => e.userId)).size,
      events: dayEvents.length,
    })
  }

  return {
    eventCount: events.length,
    usersObserved: usersObserved.size,
    activeUsers1d: activeUsers(1),
    activeUsers7d: activeUsers(7),
    activeUsers30d: activeUsers(30),
    activatedUsers: activated.size,
    activationRatePct: usersObserved.size ? Math.round((activated.size / usersObserved.size) * 1000) / 10 : null,
    repeatUsers7d,
    retention: [retentionFor(events, nowDay, 1), retentionFor(events, nowDay, 7), retentionFor(events, nowDay, 30)],
    topTargets,
    dailyActive7d,
    definition: {
      activation: 'A user viewed the Home Health Brief and then opened at least one meaningful action, feature, feedback or share surface.',
      retention: 'Exact-day cohort retention: return on day N after the user first generated a product-learning event. Immature cohorts are excluded.',
      privacy: 'First-party categorical telemetry only. No health measurements, diagnoses, free text, arbitrary properties or third-party analytics payloads are accepted.',
    },
  }
}
