/**
 * Utang tidur 14 malam: Σ(kebutuhan − tidur) atas maksimal 14 malam terbaru yang tercatat, rata-rata, dan nada/kalimat
 * penilaian (≤2 jam baik, ≤8 jam ringan, selebihnya signifikan). Rumus dan ambang dipindahkan dari halaman tanpa perubahan;
 * yang baru: kebutuhan/jam tidur kosong tidak lagi terbaca 0 (malam 0 jam palsu tersimpan di localStorage dan utang menjadi
 * sebesar kebutuhan), dan catatan tersimpan yang rusak (bukan angka, tanggal tak valid) dibuang, bukan dihitung.
 * Alat pantau diri, bukan diagnosis tidur.
 */
import { inRange } from './inputs'

export const SLEEP_RANGES = { need: { min: 5, max: 11 }, hours: { min: 0, max: 16 } } as const
export const MAX_NIGHTS = 14
export const DEBT_GOOD_MAX_H = 2
export const DEBT_MILD_MAX_H = 8

export type Night = Readonly<{ date: string; hours: number }>
export type SleepDebtTone = 'brand' | 'low' | 'critical'
export type SleepInputResult = { ok: true } | { ok: false; reason: string }
export type SleepDebtResult =
  | { ok: true; data: { debt: number; avg: number; tone: SleepDebtTone; verdict: string; counted: number } }
  | { ok: false; reason: string }

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export function validateNeed(need: unknown): SleepInputResult {
  const { min, max } = SLEEP_RANGES.need
  return inRange(need, min, max) ? { ok: true } : { ok: false, reason: `Sleep need must be ${min}–${max} hours` }
}

export function validateHours(hours: unknown): SleepInputResult {
  const { min, max } = SLEEP_RANGES.hours
  return inRange(hours, min, max) ? { ok: true } : { ok: false, reason: `Hours slept must be ${min}–${max}` }
}

/** Buang catatan tersimpan yang tidak valid; urutan yang tersisa dipertahankan. `dropped` dilaporkan, tidak disembunyikan. */
export function sanitizeNights(raw: unknown): { nights: Night[]; dropped: number } {
  if (!Array.isArray(raw)) return { nights: [], dropped: 0 }
  const nights: Night[] = []
  for (const n of raw) {
    const ok = n && typeof n === 'object' && typeof (n as Night).date === 'string' && DATE.test((n as Night).date) && validateHours((n as Night).hours).ok
    if (ok) nights.push({ date: (n as Night).date, hours: (n as Night).hours })
  }
  return { nights, dropped: raw.length - nights.length }
}

export function sleepDebt(need: number, nights: readonly Night[]): SleepDebtResult {
  const checked = validateNeed(need)
  if (!checked.ok) return checked
  const last = nights.slice(0, MAX_NIGHTS)
  const debt = last.reduce((s, n) => s + (need - n.hours), 0)
  const avg = last.length ? last.reduce((s, n) => s + n.hours, 0) / last.length : 0
  const tone: SleepDebtTone = debt <= DEBT_GOOD_MAX_H ? 'brand' : debt <= DEBT_MILD_MAX_H ? 'low' : 'critical'
  const verdict = debt <= DEBT_GOOD_MAX_H ? 'Well-rested — minimal debt' : debt <= DEBT_MILD_MAX_H ? 'Mild sleep debt — protect your next few nights' : 'Significant sleep debt — prioritize recovery sleep'
  return { ok: true, data: { debt, avg, tone, verdict, counted: last.length } }
}
