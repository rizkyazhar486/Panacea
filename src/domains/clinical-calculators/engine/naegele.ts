/**
 * Aturan Naegele: EDD = HPHT + 280 hari + (siklus − 28). Semua perhitungan dalam hari kalender UTC supaya hasil tidak
 * bergantung zona waktu peramban (versi halaman memakai setDate lokal pada tanggal UTC, sehingga di zona negatif hasil
 * bisa mundur sehari). Jam diinjeksikan lewat `nowMs`; fungsi ini murni dan deterministik.
 *
 * Usia kehamilan (UK) dihitung sebagai hari sejak HPHT dikurangi koreksi siklus, sehingga UK pada hari EDD tepat 280
 * hari (40 minggu 0 hari) untuk siklus berapa pun. Halaman lama menambah koreksi (bukan mengurangi), sehingga UK pada
 * hari EDD menjadi 280 + 2 × koreksi (mis. 294 hari untuk siklus 35 hari). Untuk siklus 28 hari hasilnya identik.
 * Tampilan pendukung keputusan; konfirmasi dengan USG trimester pertama tetap dianjurkan.
 */
import { inRange } from './inputs'

const DAY_MS = 86_400_000

// Batas kewarasan masukan (bukan ambang klinis).
export const CYCLE_LENGTH_DAYS = { min: 20, max: 60 } as const
export const LMP_YEAR = { min: 1900, max: 2100 } as const
// UK lebih dari ini tidak ditampilkan sebagai "saat ini" (HPHT terlalu lama untuk kehamilan yang masih berjalan).
export const MAX_DISPLAY_GA_DAYS = 45 * 7

export type NaegeleResult =
  | {
      ok: true
      data: {
        eddIso: string
        gestationalAge: { weeks: number; days: number } | null
        // Mengapa UK tidak ditampilkan: 'not-started' = hari sejak HPHT masih di bawah koreksi siklus (UK negatif);
        // 'beyond-limit' = lebih dari MAX_DISPLAY_GA_DAYS. null bila UK ditampilkan.
        gestationalAgeHidden: 'not-started' | 'beyond-limit' | null
      }
    }
  | { ok: false; reason: string }

function parseIsoDate(iso: unknown): number | null {
  if (typeof iso !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (year < LMP_YEAR.min || year > LMP_YEAR.max) return null
  const ms = Date.UTC(year, month - 1, day)
  const d = new Date(ms)
  // Tolak tanggal yang "meluap" (mis. 2026-02-31 menjadi 2026-03-03).
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? ms : null
}

const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function naegele(lmpIso: string, cycleLengthDays: number, nowMs: number): NaegeleResult {
  const lmpMs = parseIsoDate(lmpIso)
  if (lmpMs === null) return { ok: false, reason: `LMP must be a real date (YYYY-MM-DD) between ${LMP_YEAR.min} and ${LMP_YEAR.max}` }
  if (!inRange(cycleLengthDays, CYCLE_LENGTH_DAYS.min, CYCLE_LENGTH_DAYS.max) || !Number.isInteger(cycleLengthDays)) {
    return { ok: false, reason: `Cycle length must be a whole number of ${CYCLE_LENGTH_DAYS.min}–${CYCLE_LENGTH_DAYS.max} days` }
  }
  if (!Number.isFinite(nowMs)) return { ok: false, reason: 'Current time is unavailable' }
  const todayMs = Math.floor(nowMs / DAY_MS) * DAY_MS
  if (lmpMs > todayMs) return { ok: false, reason: 'LMP cannot be in the future' }
  const adjust = cycleLengthDays - 28
  const eddIso = toIso(lmpMs + (280 + adjust) * DAY_MS)
  const gaDays = Math.floor((todayMs - lmpMs) / DAY_MS) - adjust
  const gestationalAgeHidden = gaDays < 0 ? 'not-started' : gaDays > MAX_DISPLAY_GA_DAYS ? 'beyond-limit' : null
  const gestationalAge = gestationalAgeHidden === null ? { weeks: Math.floor(gaDays / 7), days: gaDays % 7 } : null
  return { ok: true, data: { eddIso, gestationalAge, gestationalAgeHidden } }
}
