/**
 * Validasi masukan penasihat jet lag. Dulu kolom zona waktu/hari persiapan memakai `Number(x) || 0`: kolom kosong terbaca UTC+0
 * (rencana London palsu), zona 99 lolos, dan jam bangun tidak sah diam-diam diganti 07.00. Di sini kosong = "belum diisi" dan
 * nilai di luar rentang ditolak dengan alasan; tidak ada nilai tebakan. Rentang zona waktu UTC−12..+14 adalah rentang offset
 * nyata dunia; hari persiapan 0–4 sesuai batas rencana (Math.min(…, 4)). Batas kewajaran masukan, bukan batas klinis.
 */
import { inRange } from './inputs'

export const JETLAG_RANGES = {
  timeZone: { min: -12, max: 14 },
  prepDays: { min: 0, max: 4 },
} as const

export type JetLagInput = Readonly<{ tzAsal: number; tzTujuan: number; jamBangunBiasa: string; hariPersiapan: number }>
export type JetLagValidation =
  | Readonly<{ ok: true; value: JetLagInput }>
  | Readonly<{ ok: false; reasons: readonly string[] }>

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateJetLagInput(raw: { tzAsal: unknown; tzTujuan: unknown; jamBangunBiasa: unknown; hariPersiapan: unknown }): JetLagValidation {
  const reasons: string[] = []
  const tz = JETLAG_RANGES.timeZone
  if (!inRange(raw.tzAsal, tz.min, tz.max)) reasons.push('origin time zone must be a number from −12 to +14')
  if (!inRange(raw.tzTujuan, tz.min, tz.max)) reasons.push('destination time zone must be a number from −12 to +14')
  if (typeof raw.jamBangunBiasa !== 'string' || !HHMM.test(raw.jamBangunBiasa)) reasons.push('usual wake time must be a valid HH:MM time')
  const pd = JETLAG_RANGES.prepDays
  if (!inRange(raw.hariPersiapan, pd.min, pd.max) || !Number.isInteger(raw.hariPersiapan)) reasons.push('preparation days must be a whole number from 0 to 4')
  if (reasons.length > 0) return { ok: false, reasons }
  return { ok: true, value: raw as JetLagInput }
}
