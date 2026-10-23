// Ringkasan GPS 7 hari: jarak atau durasi yang tidak valid pada salah satu sesi membuat totalnya tidak diketahui, bukan 0.
// Dulu `Number.isFinite(x) ? x : 0` menjumlahkan sesi rusak sebagai 0 km / 0 detik dan totalnya tampil lengkap.

export interface GpsActivityLike { at: string; distKm?: unknown; durSec?: unknown }

export interface GpsWeek {
  /** `null` bila ada sesi minggu ini dengan jarak tidak valid; tanpa sesi tetap 0. */
  distanceKm: number | null
  movingSec: number | null
  count: number
}

const valid = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

export function gpsWeek(activities: GpsActivityLike[], now: number): GpsWeek {
  const weekStart = now - 7 * 24 * 60 * 60 * 1000
  const weekly = activities.filter((a) => {
    const at = new Date(a.at).getTime()
    return Number.isFinite(at) && at >= weekStart && at <= now
  })
  const total = (pick: (a: GpsActivityLike) => unknown): number | null => {
    let sum = 0
    for (const a of weekly) {
      const v = pick(a)
      if (!valid(v)) return null
      sum += v
    }
    return sum
  }
  return { distanceKm: total((a) => a.distKm), movingSec: total((a) => a.durSec), count: weekly.length }
}
