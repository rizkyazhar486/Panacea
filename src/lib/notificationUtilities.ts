import { isQuietTime, type NotificationSettings } from './notificationEngine'

export interface UtilityNotificationPreferences {
  faithDaily: boolean
  ownerMilestones: boolean
}

export const OWNER_USER_THRESHOLDS = [100, 250, 500, 1000] as const
const PREFS_KEY = 'pmd_utility_notification_preferences_v1'

export const DEFAULT_UTILITY_NOTIFICATION_PREFERENCES: UtilityNotificationPreferences = {
  // Faith reminders are intentionally opt-in. Panacea must never assume a
  // user's religion merely because the Faith tools exist in the product.
  faithDaily: false,
  // This setting has no effect unless the authenticated account is an owner.
  ownerMilestones: true,
}

export function loadUtilityNotificationPreferences(): UtilityNotificationPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null') as Partial<UtilityNotificationPreferences> | null
    return saved ? { ...DEFAULT_UTILITY_NOTIFICATION_PREFERENCES, ...saved } : DEFAULT_UTILITY_NOTIFICATION_PREFERENCES
  } catch {
    return DEFAULT_UTILITY_NOTIFICATION_PREFERENCES
  }
}

export function saveUtilityNotificationPreferences(next: UtilityNotificationPreferences) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch { /* local preference remains best-effort */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('panacea:utility-notification-settings'))
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
  const reached = OWNER_USER_THRESHOLDS.filter((threshold) => totalUsers >= threshold)
  if (reached.length === 0) return null
  const seenSet = new Set(seen)
  const unseenReached = reached.filter((threshold) => !seenSet.has(threshold))
  return unseenReached.length ? unseenReached[unseenReached.length - 1] : null
}
