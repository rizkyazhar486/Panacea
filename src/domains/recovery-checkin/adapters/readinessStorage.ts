// Satu-satunya tempat I/O check-in tidur. Penyimpanan bisa kosong/melempar: bacaan gagal = belum ada, tulisan gagal = dilaporkan.
import { hariIni } from '../../../lib/tanggal'
import { readSleepQuality, READINESS_STORAGE_KEY, recordSleepQuality } from '../engine/readinessRecord'
import type { SleepQuality } from '../model/types'

export function readTodaySleepQuality(): SleepQuality | null {
  try { return readSleepQuality(localStorage.getItem(READINESS_STORAGE_KEY), hariIni()) } catch { return null }
}

/** true bila tersimpan dan terbaca kembali sama; false bila ditolak (data rusak, penyimpanan menolak). Tidak menimpa data yang tak terbaca. */
export function saveTodaySleepQuality(quality: SleepQuality): boolean {
  try {
    const result = recordSleepQuality(localStorage.getItem(READINESS_STORAGE_KEY), hariIni(), quality)
    if (!result.ok) return false
    localStorage.setItem(READINESS_STORAGE_KEY, result.json)
    return readTodaySleepQuality() === quality
  } catch { return false }
}
