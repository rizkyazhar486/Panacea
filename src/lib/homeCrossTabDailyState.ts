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

/** Ids already on the account stay; local-only ids are the ones worth uploading. */
export function barisBelumAda<T extends { id: string }>(akun: readonly { id: string }[], lokal: readonly T[]): T[] {
  const ids = new Set(akun.map((r) => r.id))
  return lokal.filter((r) => r?.id && !ids.has(r.id))
}

export function wellnessBelumAda(
  akun: readonly { date: string; sleepHr?: number; waterMl?: number }[],
  lokal: Readonly<Record<string, { date: string; sleepHr?: number; waterMl?: number }>>,
): { date: string; sleepHr?: number; waterMl?: number }[] {
  const keluar: { date: string; sleepHr?: number; waterMl?: number }[] = []
  for (const row of Object.values(lokal)) {
    if (!row?.date) continue
    const ada = akun.find((d) => d.date === row.date)
    if (!ada) {
      if (row.sleepHr != null || row.waterMl != null) keluar.push({ date: row.date, ...(row.sleepHr != null ? { sleepHr: row.sleepHr } : {}), ...(row.waterMl != null ? { waterMl: row.waterMl } : {}) })
      continue
    }
    const isi: { date: string; sleepHr?: number; waterMl?: number } = { date: row.date }
    if (row.sleepHr != null && ada.sleepHr == null) isi.sleepHr = row.sleepHr
    if (row.waterMl != null && ada.waterMl == null) isi.waterMl = row.waterMl
    if (isi.sleepHr != null || isi.waterMl != null) keluar.push(isi)
  }
  return keluar
}

export function tampilkanWellness<T extends { date: string; sleepHr?: number; waterMl?: number }>(
  akun: readonly { date: string; sleepHr?: number; waterMl?: number }[] | null,
  lokal: Readonly<Record<string, T>>,
): Record<string, T> {
  if (!akun) {
    const salinan = {} as Record<string, T>
    for (const row of Object.values(lokal)) if (row?.date) salinan[row.date] = row
    return salinan
  }
  const base = {} as Record<string, T>
  for (const row of Object.values(lokal)) if (row?.date) base[row.date] = { ...row }
  for (const row of akun) {
    const ada = base[row.date] ?? ({ date: row.date } as T)
    base[row.date] = {
      ...ada,
      ...(row.sleepHr != null ? { sleepHr: row.sleepHr } : {}),
      ...(row.waterMl != null ? { waterMl: row.waterMl } : {}),
    }
  }
  return base
}
