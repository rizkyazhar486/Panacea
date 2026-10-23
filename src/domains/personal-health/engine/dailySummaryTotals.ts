// Total harian untuk ringkasan yang dititipkan ke server: nilai yang hilang BUKAN nol.
// Dulu `kkal += Number(f.kcal) || 0` menjadikan kalori/protein yang hilang atau rusak sebagai 0, lalu total yang kurang dikirim
// seolah lengkap (aturan notifikasi seperti "protein baru 40 g pukul lima sore" bisa menyala dari angka yang terlalu kecil).
// Sekarang hanya angka hingga nonnegatif yang dihitung (nol eksplisit tetap nol); bila ada catatan hari itu yang nilainya hilang,
// totalnya TIDAK dikirim, bukan dikirim sebagian. Tidak ada angka bawaan.
import { loggedSubtotal } from './loggedCalories'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const own = (o: Record<string, unknown>, k: string): unknown => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined)

/** Nilai satu kolom dari catatan yang tanggalnya `hari`; kolom yang tidak ada dibaca `undefined` (hilang), bukan 0. */
function valuesOn(entries: readonly unknown[], day: string, dateKey: string, valueKey: string): unknown[] {
  const out: unknown[] = []
  for (const e of entries) if (isRecord(e) && own(e, dateKey) === day) out.push(own(e, valueKey))
  return out
}

/** Hanya total yang LENGKAP: tanpa catatan hari itu, atau ada nilai yang hilang/tak sah, hasilnya `undefined`. */
function completeTotal(values: readonly unknown[]): number | undefined {
  if (values.length === 0) return undefined
  const s = loggedSubtotal(values)
  return s.missing === 0 && s.total !== null ? s.total : undefined
}

export function dailyIntakeTotals(foods: unknown, day: string): { kkal?: number; proteinG?: number; carbsG?: number; fatG?: number } {
  const list = Array.isArray(foods) ? foods : []
  const kkal = completeTotal(valuesOn(list, day, 'date', 'kcal'))
  const protein = completeTotal(valuesOn(list, day, 'date', 'protein'))
  const carbs = completeTotal(valuesOn(list, day, 'date', 'carbs'))
  const fat = completeTotal(valuesOn(list, day, 'date', 'fat'))
  return {
    ...(kkal !== undefined ? { kkal: Math.round(kkal) } : {}),
    ...(protein !== undefined ? { proteinG: Math.round(protein) } : {}),
    ...(carbs !== undefined ? { carbsG: Math.round(carbs) } : {}),
    ...(fat !== undefined ? { fatG: Math.round(fat) } : {}),
  }
}

/** Total kalori per tanggal untuk hari yang SEMUA catatannya bernilai sah; hari dengan nilai hilang tidak masuk (tidak dihitung sebagai total yang lebih kecil). */
export function completeKcalByDay(foods: unknown): Map<string, number> {
  const tanggal = new Set<string>()
  for (const e of Array.isArray(foods) ? foods : []) if (isRecord(e) && typeof own(e, 'date') === 'string' && own(e, 'date') !== '') tanggal.add(own(e, 'date') as string)
  const hasil = new Map<string, number>()
  for (const day of tanggal) {
    const total = completeTotal(valuesOn(Array.isArray(foods) ? foods : [], day, 'date', 'kcal'))
    if (total !== undefined) hasil.set(day, total)
  }
  return hasil
}

/** Menit sesi fokus pada `hari`; tidak dikirim bila ada sesi yang menitnya hilang atau totalnya bukan positif. */
export function focusMinutesOn(sessions: unknown, day: string): number | undefined {
  const total = completeTotal(valuesOn(Array.isArray(sessions) ? sessions : [], day, 'tanggal', 'menit'))
  return total !== undefined && total > 0 ? Math.round(total) : undefined
}
