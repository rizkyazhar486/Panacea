// Mesin murni untuk satu penilaian tidur per hari di catatan Readiness yang SUDAH ada (kunci `pmd_readiness_v1`).
// Tidak membuat penyimpanan kedua: hanya menulis `sleepQ` pada hari yang diminta dan membiarkan semua isian lain
// (HRV, detak istirahat, jam tidur, perilaku, latihan, hari lain) apa adanya. Data rusak ditolak, bukan ditimpa.
import { tanggalKalenderSah } from '../../../lib/tanggal'
import type { RecordResult, SleepQuality } from '../model/types'

export const READINESS_STORAGE_KEY = 'pmd_readiness_v1'

/** Tanggal kalender sah (menolak limpahan seperti 30 Februari): satu-satunya aturan ada di lib/tanggal. */
export const isCalendarDay = tanggalKalenderSah

export function isSleepQuality(value: unknown): value is SleepQuality {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
}

function parseStore(raw: string | null): Record<string, unknown> | null {
  if (raw === null || raw === '') return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
  } catch { return null }
}

/** Penilaian tersimpan untuk hari itu, atau null bila belum ada / tidak sah. Kosong bukan nol. */
export function readSleepQuality(raw: string | null, day: string): SleepQuality | null {
  if (!isCalendarDay(day)) return null
  const store = parseStore(raw)
  const row = store?.[day]
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const q = (row as Record<string, unknown>).sleepQ
  return isSleepQuality(q) ? q : null
}

/** Hasil penyimpanan baru sebagai JSON, atau penolakan bernama; `raw` tidak pernah diubah. */
export function recordSleepQuality(raw: string | null, day: unknown, quality: unknown): RecordResult {
  if (!isSleepQuality(quality)) return { ok: false, reason: 'bad-quality' }
  if (!isCalendarDay(day)) return { ok: false, reason: 'bad-date' }
  const store = parseStore(raw)
  if (store === null) return { ok: false, reason: 'store-unreadable' }
  const current = store[day]
  const row = current && typeof current === 'object' && !Array.isArray(current) ? current as Record<string, unknown> : {}
  return { ok: true, json: JSON.stringify({ ...store, [day]: { behaviors: [], workouts: [], ...row, sleepQ: quality } }) }
}
