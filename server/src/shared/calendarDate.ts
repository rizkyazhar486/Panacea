// Tanggal kalender YYYY-MM-DD yang benar-benar ada. Regex saja meloloskan "2026-02-30" dan
// "2026-99-99"; Date.parse meloloskan "2026-02-30" (digulung ke 2 Maret). Round-trip ISO menolak keduanya.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isRealCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const ms = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value
}
