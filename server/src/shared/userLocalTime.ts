// Offset zona waktu pengguna (menit TIMUR dari UTC; Jakarta = +420) disimpan klien di setelan.
// `Number(x) || 0` meloloskan angka raksasa: `new Date(now + 1e12 * 60_000).toISOString()` melempar
// RangeError sehingga semua pengingat pengguna itu mati diam-diam. Zona nyata hanya -12:00..+14:00.
export const TZ_OFFSET_MIN_MENIT = -12 * 60
export const TZ_OFFSET_MAKS_MENIT = 14 * 60

/** Offset sah (bilangan bulat dalam rentang zona nyata) atau 0 (UTC) bila tidak sah/hilang. */
export function tzOffsetMenit(prefs: Record<string, unknown>): number {
  const v = prefs.tzOffsetMin
  if (typeof v !== 'number' || !Number.isInteger(v)) return 0
  return v >= TZ_OFFSET_MIN_MENIT && v <= TZ_OFFSET_MAKS_MENIT ? v : 0
}

/** Jam dinding pengguna: baca lewat getUTC*() / toISOString() pada hasilnya. */
export function waktuLokalPengguna(prefs: Record<string, unknown>, nowMs: number): Date {
  return new Date(nowMs + tzOffsetMenit(prefs) * 60_000)
}
