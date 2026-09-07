import type { Notif } from './api'
import type { FiredNotification, NotificationPriority } from './notificationEngine'

export type NotificationSource = 'server' | 'smart'

export interface UnifiedNotification {
  id: string
  title: string
  body: string
  route: string | null
  at: string
  read: boolean
  source: NotificationSource
  priority: NotificationPriority
  domains: string[]
  explanation?: string
}

export interface NotificationPresentation {
  icon: string
  label: string
  accent: 'brand' | 'blue' | 'amber' | 'violet' | 'rose' | 'neutral'
}

/**
 * HashRouter accepts app-internal paths such as /owner. Server history can
 * contain old absolute/hash URLs, so every notification passes through the
 * same conservative normalizer before navigation. External URLs are never
 * opened implicitly from the notification centre.
 */
export function normalizeNotificationRoute(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  const hashIndex = value.indexOf('#/')
  if (hashIndex >= 0) return value.slice(hashIndex + 1)
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return null
}

export function serverNotification(n: Notif): UnifiedNotification {
  return {
    id: `server:${n.id}`,
    title: n.title,
    body: n.body,
    route: normalizeNotificationRoute(n.url),
    at: n.at,
    read: n.read,
    source: 'server',
    priority: inferServerPriority(n),
    domains: [],
  }
}

export function smartNotification(n: FiredNotification): UnifiedNotification {
  return {
    id: `smart:${n.ruleId}:${n.at}`,
    title: n.title,
    body: n.body,
    route: normalizeNotificationRoute(n.route),
    at: n.at,
    // Smart items have already surfaced as an in-app/native alert when they
    // enter history. They therefore must not inflate the durable unread badge.
    read: true,
    source: 'smart',
    priority: n.priority,
    domains: n.domains,
    explanation: n.explanation,
  }
}

function inferServerPriority(n: Notif): NotificationPriority {
  const text = `${n.title} ${n.body}`.toLowerCase()
  if (/urgent|emergency|darurat|overdue|gawat|critical/.test(text)) return 'high'
  return 'normal'
}

export function notificationPresentation(n: UnifiedNotification): NotificationPresentation {
  const text = `${n.id} ${n.title} ${n.body} ${n.domains.join(' ')}`.toLowerCase()

  if (/achievement|unlocked|personal best|\bpb\b|pace|cadence|distance|kilomet|\bkm\b|vo2/.test(text)) {
    return { icon: '🏆', label: 'Achievement', accent: 'amber' }
  }
  if (/owner|milestone|growth|signup|sign-up|new user|pengguna/.test(text)) {
    return { icon: '🚀', label: 'Owner growth', accent: 'violet' }
  }
  if (/ayat|qibla|kiblat|faith|quran|prayer|salat|shalat/.test(text)) {
    return { icon: '📖', label: 'Faith & daily', accent: 'brand' }
  }
  if (/medication|medicine|obat|minum|refill/.test(text)) {
    return { icon: '💊', label: 'Medication', accent: 'rose' }
  }
  if (/appointment|consult|konsul|janji|visit/.test(text)) {
    return { icon: '🩺', label: 'Consultation', accent: 'blue' }
  }
  if (/sleep|recovery|hrv|readiness/.test(text)) {
    return { icon: '🌙', label: 'Sleep & recovery', accent: 'violet' }
  }
  if (/nutrition|protein|hydration|caffeine|gizi|calorie|kcal/.test(text)) {
    return { icon: '🥗', label: 'Nutrition', accent: 'brand' }
  }
  if (/workout|training|run|running|activity|exercise|gps|step|langkah|load/.test(text)) {
    return { icon: '🏃', label: 'Activity', accent: 'blue' }
  }
  if (/message|chat|social|community|pesan|friend/.test(text)) {
    return { icon: '💬', label: 'Social', accent: 'blue' }
  }
  if (/privacy|consent|security|account|login|password/.test(text)) {
    return { icon: '🔐', label: 'Account & privacy', accent: 'neutral' }
  }
  if (/study|review|exam|learn|med-study/.test(text)) {
    return { icon: '📚', label: 'Study', accent: 'amber' }
  }
  if (/payment|billing|invoice|finance|money|bayar|tagihan/.test(text)) {
    return { icon: '💳', label: 'Finance', accent: 'amber' }
  }
  if (/lab|result|health|body|data|heart|blood/.test(text)) {
    return { icon: '🫀', label: 'Health & data', accent: 'rose' }
  }
  return { icon: '🔔', label: 'Notification', accent: 'neutral' }
}

export function sortNotifications(items: UnifiedNotification[]): UnifiedNotification[] {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.at)
    const tb = Date.parse(b.at)
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0)
  })
}

export function notificationDayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function notificationTimeAgo(iso: string): string {
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return 'unknown time'
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days < 7 ? `${days} d ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function notificationFullTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
