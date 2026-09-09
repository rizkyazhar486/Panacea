export const PANACEA_OS_CATEGORIES = [
  'work',
  'study',
  'appointment',
  'health',
  'training',
  'nutrition',
  'family',
  'social',
  'finance',
  'spiritual',
  'recovery',
  'leisure',
  'admin',
] as const

export type PanaceaOsCategory = (typeof PANACEA_OS_CATEGORIES)[number]

export interface PanaceaOsItem {
  id: string
  date: string
  title: string
  category: PanaceaOsCategory
  time?: string
  createdAt: string
  completedAt?: string
}

export interface PanaceaOsFocusSlot {
  slot: 'Now' | 'Next' | 'Later'
  item: PanaceaOsItem
  timing: 'overdue' | 'soon' | 'scheduled' | 'open'
  minutesFromNow?: number
}

const SLOT_NAMES: PanaceaOsFocusSlot['slot'][] = ['Now', 'Next', 'Later']

export function parseClockMinutes(value?: string): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function compareItems(a: PanaceaOsItem, b: PanaceaOsItem): number {
  const aTime = parseClockMinutes(a.time)
  const bTime = parseClockMinutes(b.time)
  if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime
  if (aTime !== null && bTime === null) return -1
  if (aTime === null && bTime !== null) return 1
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
}

export function sortPanaceaOsItems(items: PanaceaOsItem[]): PanaceaOsItem[] {
  return items.slice().sort(compareItems)
}

export function classifyTiming(item: PanaceaOsItem, nowMinutes: number): Omit<PanaceaOsFocusSlot, 'slot' | 'item'> {
  const scheduled = parseClockMinutes(item.time)
  if (scheduled === null) return { timing: 'open' }
  const delta = scheduled - nowMinutes
  if (delta < -15) return { timing: 'overdue', minutesFromNow: delta }
  if (delta <= 45) return { timing: 'soon', minutesFromNow: delta }
  return { timing: 'scheduled', minutesFromNow: delta }
}

export function resolvePanaceaOsFocus(items: PanaceaOsItem[], nowMinutes: number): PanaceaOsFocusSlot[] {
  const pending = sortPanaceaOsItems(items.filter((item) => !item.completedAt))
  return pending.slice(0, 3).map((item, index) => ({ slot: SLOT_NAMES[index], item, ...classifyTiming(item, nowMinutes) }))
}

export function panaceaOsStorageKey(date: string): string {
  return `panacea.os.day.v1:${date}`
}

export function isPanaceaOsItem(value: unknown): value is PanaceaOsItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PanaceaOsItem>
  return typeof item.id === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(item.date ?? '')
    && typeof item.title === 'string'
    && item.title.trim().length > 0
    && PANACEA_OS_CATEGORIES.includes(item.category as PanaceaOsCategory)
    && typeof item.createdAt === 'string'
    && (item.time === undefined || parseClockMinutes(item.time) !== null)
    && (item.completedAt === undefined || typeof item.completedAt === 'string')
}

export function readPanaceaOsItems(raw: string | null, date: string): PanaceaOsItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return sortPanaceaOsItems(parsed.filter(isPanaceaOsItem).filter((item) => item.date === date))
  } catch {
    return []
  }
}
