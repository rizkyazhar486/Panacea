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

/** Ids already on the account, or already removed, stay off the upload. */
export function barisBelumAda<T extends { id: string }>(akun: readonly { id: string }[], lokal: readonly T[], dihapus: readonly string[] = []): T[] {
  const ids = new Set(akun.map((r) => r.id))
  const hapus = new Set(dihapus)
  return lokal.filter((r) => r?.id && !ids.has(r.id) && !hapus.has(r.id))
}

export function makananTampil<T extends { id: string }>(akun: readonly T[] | null, lokal: readonly T[], dihapus: readonly string[] = []): T[] {
  const hapus = new Set(dihapus)
  const lokalHidup = lokal.filter((r) => r?.id && !hapus.has(r.id))
  if (!akun) return lokalHidup
  const akunHidup = akun.filter((r) => r?.id && !hapus.has(r.id))
  return [...akunHidup, ...barisBelumAda(akunHidup, lokalHidup)]
}

/** One local night hides the account row for that date so an edit does not appear twice. */
export function tidurTampil<T extends { id: string; date: string }>(akun: readonly T[] | null, lokal: readonly T[], dihapus: readonly string[] = []): T[] {
  const hapus = new Set(dihapus)
  const lokalHidup = lokal.filter((r) => r?.id && !hapus.has(r.id))
  if (!akun) return lokalHidup
  const tanggalLokal = new Set(lokalHidup.map((r) => r.date))
  const akunHidup = akun.filter((r) => r?.id && !hapus.has(r.id) && !tanggalLokal.has(r.date))
  return [...akunHidup, ...barisBelumAda(akunHidup, lokalHidup, dihapus)]
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
      if ((row.sleepHr != null && row.sleepHr > 0) || (row.waterMl != null && row.waterMl > 0)) {
        keluar.push({
          date: row.date,
          ...(row.sleepHr != null && row.sleepHr > 0 ? { sleepHr: row.sleepHr } : {}),
          ...(row.waterMl != null && row.waterMl > 0 ? { waterMl: row.waterMl } : {}),
        })
      }
      continue
    }
    const isi: { date: string; sleepHr?: number; waterMl?: number } = { date: row.date }
    if (row.sleepHr === 0 && ada.sleepHr != null) isi.sleepHr = 0
    else if (row.sleepHr != null && row.sleepHr > 0 && ada.sleepHr == null) isi.sleepHr = row.sleepHr
    if (row.waterMl === 0 && ada.waterMl != null) isi.waterMl = 0
    else if (row.waterMl != null && row.waterMl > 0 && (ada.waterMl == null || row.waterMl > ada.waterMl)) isi.waterMl = row.waterMl
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
    const berikutnya: T = { ...ada }
    if (berikutnya.sleepHr !== 0 && row.sleepHr != null) berikutnya.sleepHr = row.sleepHr
    if (berikutnya.waterMl !== 0 && row.waterMl != null && (berikutnya.waterMl == null || row.waterMl > berikutnya.waterMl)) {
      berikutnya.waterMl = row.waterMl
    }
    base[row.date] = berikutnya
  }
  return base
}

export function ringkasGpsUntukAkun<T extends { id: string; email?: string; hrSamples?: unknown }>(
  lokal: readonly T[],
  emailPemilik: string,
): Omit<T, 'email' | 'hrSamples'>[] {
  const email = emailPemilik.trim().toLocaleLowerCase('en-US')
  const keluar: Omit<T, 'email' | 'hrSamples'>[] = []
  for (const row of lokal) {
    if (!row?.id || !row.email || row.email.trim().toLocaleLowerCase('en-US') !== email) continue
    const { email: _email, hrSamples: _samples, ...ringkas } = row
    keluar.push(ringkas)
  }
  return keluar
}

export function gpsTampil<T extends { id: string; email?: string; hrSamples?: { s: number; bpm: number }[] }>(
  akun: readonly (Omit<T, 'email' | 'hrSamples' | 'emoji'> & { id: string; emoji?: string })[] | null,
  lokal: readonly T[],
  emailPemilik: string,
  dihapus: readonly string[] = [],
): T[] {
  const hapus = new Set(dihapus)
  const lokalHidup = lokal.filter((row) => row?.id && !hapus.has(row.id))
  if (!akun) return lokalHidup
  const lokalById = new Map(lokalHidup.map((row) => [row.id, row]))
  const ids = new Set<string>()
  const keluar: T[] = []
  for (const row of akun) {
    if (!row?.id || ids.has(row.id) || hapus.has(row.id)) continue
    ids.add(row.id)
    const ada = lokalById.get(row.id)
    const emoji = ('emoji' in row && typeof row.emoji === 'string' && row.emoji) ? row.emoji : (ada && 'emoji' in ada && typeof ada.emoji === 'string' ? ada.emoji : '')
    keluar.push({ ...row, email: emailPemilik, emoji, ...(ada?.hrSamples ? { hrSamples: ada.hrSamples } : {}) } as unknown as T)
  }
  for (const row of ringkasGpsUntukAkun(lokalHidup, emailPemilik)) {
    if (ids.has(row.id)) continue
    ids.add(row.id)
    keluar.push({ ...row, email: emailPemilik } as unknown as T)
  }
  return keluar
}
