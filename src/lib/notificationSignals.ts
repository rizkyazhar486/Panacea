import {
  DEFAULT_NOTIFICATION_SETTINGS,
  defaultEnabledRuleIds,
  type FiredNotification,
  type NotificationSettings,
  type NotificationSnapshot,
  type SignalValue,
} from './notificationEngine'

const SIGNAL_KEY = 'pmd_notification_signals_v1'
const SETTINGS_KEY = 'pmd_smart_notification_settings_v1'
const HISTORY_KEY = 'pmd_smart_notification_history_v1'
const WEAK_KEY = 'pmd_study_weak_concepts_v1'
const STUDY_GOAL_KEY = 'pmd_study_goal_v1'
const LIFE_SAVED_KEY = 'pmd_life_library_saved_v1'
const LIFE_READ_KEY = 'pmd_life_library_read_v1'
const MAX_HISTORY = 100

interface StoredSignal {
  value: SignalValue
  updatedAt: number
  expiresAt?: number
}

type SignalStore = Record<string, StoredSignal>

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

function readJson<T>(key: string, fallback: T): T {
  const s = storage()
  if (!s) return fallback
  try {
    const parsed = JSON.parse(s.getItem(key) || '')
    return parsed == null ? fallback : parsed as T
  } catch { return fallback }
}

function writeJson(key: string, value: unknown) {
  const s = storage()
  if (!s) return
  try { s.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable/full */ }
}

export function publishNotificationSignal(key: string, value: SignalValue, ttlMinutes?: number, now = Date.now()) {
  const clean = key.trim()
  if (!clean) return
  const store = readJson<SignalStore>(SIGNAL_KEY, {})
  store[clean] = {
    value,
    updatedAt: now,
    ...(typeof ttlMinutes === 'number' && ttlMinutes > 0 ? { expiresAt: now + ttlMinutes * 60_000 } : {}),
  }
  writeJson(SIGNAL_KEY, store)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('panacea:notification-signal', { detail: { key: clean, value } }))
}

export function clearNotificationSignal(key: string) {
  const store = readJson<SignalStore>(SIGNAL_KEY, {})
  delete store[key]
  writeJson(SIGNAL_KEY, store)
}

export function readPublishedNotificationSignals(now = Date.now()): NotificationSnapshot {
  const store = readJson<SignalStore>(SIGNAL_KEY, {})
  const snapshot: NotificationSnapshot = {}
  let dirty = false
  for (const [key, signal] of Object.entries(store)) {
    if (!signal || (signal.expiresAt != null && signal.expiresAt <= now)) {
      delete store[key]
      dirty = true
      continue
    }
    snapshot[key] = signal.value
  }
  if (dirty) writeJson(SIGNAL_KEY, store)
  return snapshot
}

function readStringSet(key: string): Set<string> {
  const raw = readJson<unknown>(key, [])
  return new Set(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [])
}

function builtInStudySignals(now: number): NotificationSnapshot {
  const raw = readJson<unknown>(WEAK_KEY, [])
  const weak = Array.isArray(raw) ? raw : []
  let due = 0
  for (const item of weak) {
    if (!item || typeof item !== 'object') continue
    const dueAt = (item as { dueAt?: unknown }).dueAt
    if (typeof dueAt === 'string') {
      const time = Date.parse(dueAt)
      if (Number.isFinite(time) && time <= now) due += 1
    }
  }
  let goalPresent = false
  try { goalPresent = Boolean(storage()?.getItem(STUDY_GOAL_KEY)?.trim()) } catch { /* unavailable */ }
  return { 'study.reviewDue': due, 'study.goalPresent': goalPresent }
}

function builtInLifeSignals(): NotificationSnapshot {
  const saved = readStringSet(LIFE_SAVED_KEY)
  const read = readStringSet(LIFE_READ_KEY)
  let savedUnread = 0
  for (const id of saved) if (!read.has(id)) savedUnread += 1
  return { 'life.savedUnread': savedUnread }
}

export function collectNotificationSnapshot(now = Date.now()): NotificationSnapshot {
  return {
    ...readPublishedNotificationSignals(now),
    ...builtInStudySignals(now),
    ...builtInLifeSignals(),
    'app.online': typeof navigator !== 'undefined' ? navigator.onLine : true,
    'app.notificationPermission': typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  }
}

export function loadNotificationSettings(): NotificationSettings {
  const saved = readJson<Partial<NotificationSettings>>(SETTINGS_KEY, {})
  const enabledRuleIds = Array.isArray(saved.enabledRuleIds)
    ? saved.enabledRuleIds.filter((item): item is string => typeof item === 'string')
    : defaultEnabledRuleIds()
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...saved,
    enabledRuleIds,
    maxPerDay: Math.min(20, Math.max(1, Number(saved.maxPerDay ?? DEFAULT_NOTIFICATION_SETTINGS.maxPerDay) || DEFAULT_NOTIFICATION_SETTINGS.maxPerDay)),
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  writeJson(SETTINGS_KEY, settings)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('panacea:notification-settings'))
}

export function loadNotificationHistory(): FiredNotification[] {
  const raw = readJson<unknown>(HISTORY_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is FiredNotification => Boolean(item && typeof item === 'object' && typeof (item as FiredNotification).ruleId === 'string')).slice(0, MAX_HISTORY)
}

export function appendNotificationHistory(item: FiredNotification) {
  const previous = loadNotificationHistory()
  const next = [item, ...previous.filter((entry) => !(entry.ruleId === item.ruleId && entry.at === item.at))].slice(0, MAX_HISTORY)
  writeJson(HISTORY_KEY, next)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('panacea:notification-history'))
}

export function lastFiredByRule(history = loadNotificationHistory()): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of history) {
    const at = Date.parse(item.at)
    if (!Number.isFinite(at)) continue
    out[item.ruleId] = Math.max(out[item.ruleId] || 0, at)
  }
  return out
}

export function notificationsToday(history = loadNotificationHistory(), now = new Date()): number {
  const y = now.getFullYear(); const m = now.getMonth(); const d = now.getDate()
  return history.filter((item) => {
    const at = new Date(item.at)
    return !Number.isNaN(at.getTime()) && at.getFullYear() === y && at.getMonth() === m && at.getDate() === d
  }).length
}
