// Ringkasan latihan 7 hari untuk ubin dasbor: durasi yang asal-usulnya tidak diketahui bukan 0 menit.
import { workoutDurationSeconds } from '../../../shared/kernel/workoutDurationEvidence'

interface SesiRingkas { jarakKm?: number; durasi: number; durationSource?: string; mulai: string; selesai: string }

export interface RingkasanLatihan {
  sesi: number
  km: number
  /** null bila ada sesi yang durasinya tidak diketahui. */
  menit: number | null
  /** Detik per km; null bila menit atau km tidak diketahui. */
  detikPerKm: number | null
}

export function ringkasLatihan(sesi: SesiRingkas[]): RingkasanLatihan {
  const km = sesi.reduce((a, w) => a + (w.jarakKm ?? 0), 0)
  const detik = sesi.map(workoutDurationSeconds)
  const menit = detik.some((d) => d === null) ? null : Math.round(detik.reduce<number>((a, d) => a + (d ?? 0), 0) / 60)
  return { sesi: sesi.length, km, menit, detikPerKm: menit !== null && menit > 0 && km > 0 ? (menit * 60) / km : null }
}

const HARI = 864e5
const kunciHari = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Menit latihan per hari untuk tujuh hari terakhir (hari ini paling kanan); null = ada sesi hari itu dengan durasi tidak diketahui, 0 = tidak ada sesi. */
export function menitTujuhHari(sesi: SesiRingkas[], sekarang = Date.now()): (number | null)[] {
  const per = new Map<string, number | null>()
  for (const w of sesi) {
    const d = new Date(Date.parse(w.mulai))
    if (Number.isNaN(d.getTime())) continue
    const k = kunciHari(d)
    const detik = workoutDurationSeconds(w)
    const sebelum = per.has(k) ? per.get(k)! : 0
    per.set(k, detik === null || sebelum === null ? null : sebelum + Math.round(detik / 60))
  }
  const out: (number | null)[] = []
  for (let i = 6; i >= 0; i--) {
    const k = kunciHari(new Date(sekarang - i * HARI))
    out.push(per.has(k) ? per.get(k)! : 0)
  }
  return out
}
