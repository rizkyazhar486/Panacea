export type ReviewIntervalDays = 1 | 3 | 7 | 14

export type WeakConcept = {
  id: string
  topic: string
  whyMissed: string
  createdAt: string
  dueAt: string
  intervalDays: ReviewIntervalDays
  repetitions: number
}

export function nextReviewIso(from: Date | string, days: ReviewIntervalDays) {
  const base = typeof from === 'string' ? new Date(from) : new Date(from)
  const safe = Number.isFinite(base.getTime()) ? base : new Date(0)
  safe.setDate(safe.getDate() + days)
  return safe.toISOString()
}

export function isReviewDue(dueAt: string, now: Date | string = new Date()) {
  const due = new Date(dueAt).getTime()
  const current = new Date(now).getTime()
  return Number.isFinite(due) && Number.isFinite(current) && due <= current
}

export function normalizeFocusMinutes(value: number) {
  if (!Number.isFinite(value)) return 25
  return Math.max(5, Math.min(120, Math.round(value)))
}

export function reviewIntervalFor(repetitions: number): ReviewIntervalDays {
  if (repetitions <= 0) return 1
  if (repetitions === 1) return 3
  if (repetitions === 2) return 7
  return 14
}
