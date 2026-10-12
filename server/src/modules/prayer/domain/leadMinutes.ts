// Menit pengingat SEBELUM waktu salat. Dulu `Math.min(60, Math.max(0, Number(x) ?? 5))`: `Number()` tidak pernah
// null/undefined, jadi `?? 5` mati. Setelan yang belum punya `salatLeadMin` menjadi NaN, `beda > 2` pada NaN
// bernilai false, dan pengingat terkirim di menit yang salah (bukan menunggu jendelanya). Nilai yang tak dapat
// dibaca sekarang jatuh ke bawaan aplikasi (5), bukan ke NaN; angka di luar rentang dijepit.
export const SALAT_LEAD_DEFAULT_MIN = 5
export const SALAT_LEAD_MAX_MIN = 60

export function salatLeadMinutes(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return SALAT_LEAD_DEFAULT_MIN
  return Math.min(SALAT_LEAD_MAX_MIN, Math.max(0, Math.round(raw)))
}
