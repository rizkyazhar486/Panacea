import { useCallback, useEffect } from 'react'
import { api, backendEnabled } from '../lib/api'
import { isQuietTime, type FiredNotification, type NotificationSettings } from '../lib/notificationEngine'
import {
  appendNotificationHistory,
  loadNotificationHistory,
  loadNotificationSettings,
  notificationsToday,
} from '../lib/notificationSignals'
import { useStore } from '../lib/store'

const FAITH_DAY_KEY = 'pmd_faith_daily_notified_v1'
const OWNER_MILESTONE_KEY = 'pmd_owner_user_milestones_seen_v1'
const OWNER_THRESHOLDS = [100, 250, 500, 1000] as const

function localDateKey(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readText(key: string): string {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}

function writeText(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* local history remains best-effort */ }
}

function readNumbers(key: string): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)) : []
  } catch {
    return []
  }
}

function writeNumbers(key: string, value: number[]) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore storage quota/private mode */ }
}

export function canSurfaceUtilityNotification(
  settings: NotificationSettings,
  now: Date,
  todayCount: number,
): boolean {
  if (!settings.enabled) return false
  if (todayCount >= Math.max(1, settings.maxPerDay)) return false
  return !isQuietTime(now, settings.quietStart, settings.quietEnd)
}

export function ownerMilestoneToSurface(totalUsers: number, seen: number[]): number | null {
  if (!Number.isFinite(totalUsers) || totalUsers < 0) return null
  const reached = OWNER_THRESHOLDS.filter((threshold) => totalUsers >= threshold)
  if (reached.length === 0) return null
  const seenSet = new Set(seen)
  const unseenReached = reached.filter((threshold) => !seenSet.has(threshold))
  return unseenReached.length ? unseenReached[unseenReached.length - 1] : null
}

async function showNative(item: FiredNotification) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(item.title, {
      body: item.body,
      icon: `${import.meta.env.BASE_URL}logo-mark.png`,
      badge: `${import.meta.env.BASE_URL}logo-mark.png`,
      tag: `panacea-utility:${item.ruleId}`,
      data: { url: `./#${item.route}`, source: 'panacea-utility', ruleId: item.ruleId },
    })
  } catch {
    // The durable in-app history still contains the notification.
  }
}

function emit(item: FiredNotification) {
  appendNotificationHistory(item)
  void showNative(item)
}

/**
 * Small global producer mounted with the header bell. It creates only two
 * notifications that cannot be expressed as ordinary health-signal rules:
 * a once-per-day Faith utility and owner-only real registration milestones.
 * It never asks for browser permission and never manufactures a measurement.
 */
export function NotificationUtilityProducer() {
  const { account } = useStore()

  const maybeFaith = useCallback(() => {
    const now = new Date()
    // A daily verse is useful as a morning ritual, not as an interruption at
    // arbitrary hours. If Panacea is not open in this window, nothing is faked
    // or back-dated; the user can still open Faith normally.
    if (now.getHours() < 7 || now.getHours() >= 12) return
    const dateKey = localDateKey(now)
    if (readText(FAITH_DAY_KEY) === dateKey) return

    const settings = loadNotificationSettings()
    const history = loadNotificationHistory()
    if (!canSurfaceUtilityNotification(settings, now, notificationsToday(history, now))) return

    // Mark before emitting so repeated React mounts cannot duplicate it.
    writeText(FAITH_DAY_KEY, dateKey)
    emit({
      ruleId: `faith-daily:${dateKey}`,
      title: 'Ayat hari ini & arah kiblat',
      body: 'Buka Faith untuk ayat harian dan arah kiblat berdasarkan lokasi perangkat Anda.',
      route: '/scripture',
      priority: 'low',
      domains: ['life'],
      explanation: 'Daily utility reminder only. The notification does not invent a verse, prayer time, or qibla bearing; those are resolved inside the Faith tools.',
      at: now.toISOString(),
    })
  }, [])

  const maybeOwnerMilestone = useCallback(async () => {
    if (!account?.isOwner || !backendEnabled) return
    try {
      const stats = await api.stats()
      const seen = readNumbers(OWNER_MILESTONE_KEY)
      const milestone = ownerMilestoneToSurface(stats.totalUsers, seen)
      if (milestone == null) return

      const reached = OWNER_THRESHOLDS.filter((threshold) => stats.totalUsers >= threshold)
      // Persist every already-reached threshold, but only surface the highest
      // unseen one. An owner joining the feature at 700 users should not get
      // three historical popups for 100, 250 and 500.
      writeNumbers(OWNER_MILESTONE_KEY, [...new Set([...seen, ...reached])])

      const now = new Date()
      const settings = loadNotificationSettings()
      const history = loadNotificationHistory()
      if (!canSurfaceUtilityNotification(settings, now, notificationsToday(history, now))) return

      emit({
        ruleId: `owner-users:${milestone}`,
        title: `Owner milestone · ${milestone.toLocaleString('en-GB')} users`,
        body: `Panacea has ${stats.totalUsers.toLocaleString('en-GB')} registered users. Review activation, conversion and retention before the next growth step.`,
        route: '/owner',
        priority: 'normal',
        domains: ['social', 'finance'],
        explanation: 'The registration count comes from the owner backend statistics. Reaching a user-count milestone is not presented as revenue, retention, or a sale.',
        at: now.toISOString(),
      })
    } catch {
      // No owner notification is better than a guessed count when the backend
      // cannot be reached.
    }
  }, [account?.isOwner])

  useEffect(() => {
    maybeFaith()
    const interval = window.setInterval(maybeFaith, 15 * 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') maybeFaith() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [maybeFaith])

  useEffect(() => {
    if (!account?.isOwner || !backendEnabled) return
    void maybeOwnerMilestone()
    const interval = window.setInterval(() => void maybeOwnerMilestone(), 5 * 60_000)
    return () => window.clearInterval(interval)
  }, [account?.isOwner, maybeOwnerMilestone])

  return null
}

export default NotificationUtilityProducer
