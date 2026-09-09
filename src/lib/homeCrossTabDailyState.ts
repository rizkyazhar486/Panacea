import type { AppState } from './types'

export const PANACEA_STATE_STORAGE_KEY = 'panaceamed.state.v3'

export type HomeDailyState = Pick<AppState, 'foods' | 'sleepLogs' | 'wellness'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read only the daily slices Home needs from another tab's persisted state.
 * This deliberately does not rehydrate the global Store. Malformed or
 * incomplete daily data is ignored rather than replacing known-good state.
 */
export function parseHomeDailyState(raw: string | null): HomeDailyState | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    const { foods, sleepLogs, wellness } = parsed
    if (!Array.isArray(foods) || !Array.isArray(sleepLogs) || !isRecord(wellness)) return null
    return {
      foods: foods as AppState['foods'],
      sleepLogs: sleepLogs as AppState['sleepLogs'],
      wellness: wellness as AppState['wellness'],
    }
  } catch {
    return null
  }
}

export function emptyHomeDailyState(): HomeDailyState {
  return { foods: [], sleepLogs: [], wellness: {} }
}

export function homeDailyStateSignature(state: HomeDailyState): string {
  try {
    return JSON.stringify([state.foods, state.sleepLogs, state.wellness])
  } catch {
    return ''
  }
}
