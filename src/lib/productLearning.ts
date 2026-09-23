import { api, backendEnabled, type ProductEventInput, type ProductEventName } from './api'

const LOCAL_KEY = 'pmd_product_learning_local_v1'
const SESSION_KEY = 'pmd_product_learning_session_v1'
const SUBJECT_KEY = 'pmd_product_learning_subject_v1'
const DISABLED_KEY = 'pmd_product_learning_disabled_v1'
const MAX_LOCAL = 250

let queue: ProductEventInput[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function token(value: string, max = 96): string {
  return value.trim().replace(/[^a-z0-9._:\/-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max)
}

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function storageGet(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key) } catch { return null }
}

function storageSet(key: string, value: string) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value) } catch { /* local telemetry must never break product use */ }
}

function sessionId() {
  const existing = storageGet(SESSION_KEY)
  if (existing) return existing
  const created = randomId('s')
  storageSet(SESSION_KEY, created)
  return created
}

function subjectId() {
  const existing = storageGet(SUBJECT_KEY)
  if (existing) return existing
  const created = randomId('subject')
  storageSet(SUBJECT_KEY, created)
  return created
}

export function productLearningEnabled(): boolean {
  return storageGet(DISABLED_KEY) !== '1'
}

export function setProductLearningEnabled(enabled: boolean) {
  storageSet(DISABLED_KEY, enabled ? '0' : '1')
  if (!enabled) queue = []
}

function localEvents(): ProductEventInput[] {
  try {
    const parsed = JSON.parse(storageGet(LOCAL_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(-MAX_LOCAL) : []
  } catch {
    return []
  }
}

function persistLocal(events: ProductEventInput[]) {
  storageSet(LOCAL_KEY, JSON.stringify(events.slice(-MAX_LOCAL)))
}

export function getLocalProductLearningEvents(): ProductEventInput[] {
  return localEvents()
}

async function flush() {
  flushTimer = null
  if (!queue.length || !productLearningEnabled()) return
  const batch = queue.splice(0, 50)

  if (!backendEnabled) {
    persistLocal([...localEvents(), ...batch])
    return
  }

  try {
    await api.trackProductEvents(batch)
  } catch {
    // Keep a bounded first-party local fallback. We intentionally do not retry
    // forever: analytics must never compete with clinical/product traffic.
    persistLocal([...localEvents(), ...batch])
  }

  if (queue.length) scheduleFlush()
}

function scheduleFlush() {
  if (flushTimer || typeof window === 'undefined') return
  flushTimer = setTimeout(() => { void flush() }, 800)
}

export function trackProductEvent(input: {
  name: ProductEventName
  surface: string
  target?: string
}) {
  if (typeof window === 'undefined' || !productLearningEnabled()) return
  const surface = token(input.surface, 64)
  const target = input.target ? token(input.target, 96) : undefined
  if (!surface || (input.target && !target)) return

  queue.push({
    name: input.name,
    surface,
    ...(target ? { target } : {}),
    sessionId: sessionId(),
  })
  if (queue.length > 100) queue = queue.slice(-100)
  scheduleFlush()
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Stable first-party experiment assignment.
 *
 * This chooses a variant; it does NOT decide that a variant "wins".
 * OwnerAnalytics already applies a pre-committed sample-size gate before
 * interpreting A/B results.
 */
export function assignProductExperiment<T extends string>(
  experimentKey: string,
  variants: readonly T[],
): T {
  if (!variants.length) throw new Error('assignProductExperiment requires at least one variant')
  const exp = token(experimentKey, 64)
  const bucket = fnv1a(`${subjectId()}:${exp}`) % variants.length
  const variant = variants[bucket]

  const exposureKey = `pmd_exp_exposed_v1:${exp}:${variant}`
  if (!storageGet(exposureKey)) {
    storageSet(exposureKey, '1')
    trackProductEvent({
      name: 'experiment_exposure',
      surface: 'product_experiment',
      target: `${exp}:${token(variant, 32)}`,
    })
  }

  return variant
}
