// Adapter browser untuk Affect Engine: SATU-SATUNYA tempat yang menyentuh localStorage,
// sessionStorage, event window dan jam sistem. Logika keputusan dan ringkasan ada di
// ../engine/affectEngine.ts (murni).
import { summarizeAffectEvents, type AffectEvent, type AffectEventType, type AffectSessionSummary } from '../engine/affectEngine'

const EVENT_KEY = 'pmd_affect_events_v1'
const SESSION_KEY = 'pmd_affect_session_started_v1'
const MAX_EVENTS = 200

function readEvents(): AffectEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENT_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((event): event is AffectEvent =>
      !!event
      && typeof event.type === 'string'
      && typeof event.at === 'string'
      && Number.isFinite(Date.parse(event.at)),
    ).slice(-MAX_EVENTS)
  } catch {
    return []
  }
}

function sessionStarted(nowMs: number) {
  if (typeof window === 'undefined') return nowMs
  try {
    const stored = Number(window.sessionStorage.getItem(SESSION_KEY))
    if (Number.isFinite(stored) && stored > 0 && stored <= nowMs) return stored
    window.sessionStorage.setItem(SESSION_KEY, String(nowMs))
  } catch { /* privacy/storage restricted */ }
  return nowMs
}

export function recordAffectEvent(type: AffectEventType, value?: number, now = new Date()) {
  if (typeof window === 'undefined') return
  const events = readEvents()
  events.push({
    type,
    at: now.toISOString(),
    value: typeof value === 'number' && Number.isFinite(value) ? value : undefined,
  })
  try {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
    window.dispatchEvent(new CustomEvent('panacea-affect-event', { detail: { type } }))
  } catch { /* best-effort local telemetry only */ }
}

export function summarizeAffectSession(now = new Date()): AffectSessionSummary {
  const nowMs = now.getTime()
  return summarizeAffectEvents(readEvents(), sessionStarted(nowMs), nowMs)
}

export function resetAffectSession(now = new Date()) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(now.getTime()))
    window.dispatchEvent(new CustomEvent('panacea-affect-event', { detail: { type: 'return' } }))
  } catch { /* ignore */ }
}
