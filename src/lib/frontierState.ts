export const FRONTIER_DOMAINS = ['Time', 'Health', 'Money', 'Knowledge', 'Social', 'Family', 'Career'] as const
export type FrontierDomain = typeof FRONTIER_DOMAINS[number]
export interface FrontierState {
  weeklyHours?: number
  decision?: string
  prediction?: string
  knowledge?: string
  nextAction?: string
  legacy?: string
  social?: Record<string, number>
  autopilot?: FrontierDomain[]
  future?: string
  horizon?: number
  savedAt?: string
}

export function parseFrontierState(value: unknown): FrontierState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const result: FrontierState = {}
  for (const key of ['decision', 'prediction', 'knowledge', 'nextAction', 'legacy', 'future', 'savedAt'] as const) {
    if (typeof input[key] === 'string') result[key] = input[key].slice(0, key === 'savedAt' ? 40 : 800)
  }
  if (typeof input.weeklyHours === 'number' && Number.isFinite(input.weeklyHours)) result.weeklyHours = Math.max(0, Math.min(168, input.weeklyHours))
  if (typeof input.horizon === 'number' && [1, 5, 10, 20].includes(input.horizon)) result.horizon = input.horizon
  if (Array.isArray(input.autopilot)) result.autopilot = [...new Set(input.autopilot.filter((domain): domain is FrontierDomain => FRONTIER_DOMAINS.includes(domain)))].slice(0, 3)
  if (input.social && typeof input.social === 'object' && !Array.isArray(input.social)) {
    const social = input.social as Record<string, unknown>
    result.social = Object.fromEntries(['Belonging', 'Support', 'Reciprocity', 'Reach'].map(axis => {
      const value = social[axis]
      return [axis, typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : 5]
    }))
  }
  return result
}
