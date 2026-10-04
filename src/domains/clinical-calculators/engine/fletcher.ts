/**
 * Indeks Fletcher: rata-rata ambang nada murni pada 500/1000/2000 Hz (dasar) atau ditambah 3000 Hz (lengkap, AAO-HNS).
 * Klasifikasi derajat (26/41/56/71/91 dB) dipindahkan dari halaman tanpa perubahan. Kolom yang belum diisi ditolak
 * (halaman lama membacanya 0 dB dan menampilkan "Normal" tanpa data audiometri). Bukan diagnosis; audiometri dan
 * interpretasinya milik klinisi.
 */
import { inRange } from './inputs'

// Rentang audiometer klinis umum, dB HL (kewarasan masukan, bukan ambang klinis). Ambang negatif sah pada pendengaran baik.
export const THRESHOLD_DB_HL = { min: -10, max: 120 } as const

export type FletcherMode = 'basic' | 'complete'
export type FletcherTone = 'normal' | 'low' | 'critical'
export type FletcherResult =
  | { ok: true; data: { indexDb: number; label: string; tone: FletcherTone } }
  | { ok: false; reason: string }

export function fletcherIndex(mode: FletcherMode, t500: number, t1000: number, t2000: number, t3000: number | undefined): FletcherResult {
  if (mode !== 'basic' && mode !== 'complete') return { ok: false, reason: 'Mode must be basic or complete' }
  const fields: Array<[string, number | undefined]> = [['500 Hz', t500], ['1000 Hz', t1000], ['2000 Hz', t2000]]
  if (mode === 'complete') fields.push(['3000 Hz', t3000])
  for (const [name, v] of fields) {
    if (!inRange(v, THRESHOLD_DB_HL.min, THRESHOLD_DB_HL.max)) {
      return { ok: false, reason: `${name} threshold must be ${THRESHOLD_DB_HL.min}–${THRESHOLD_DB_HL.max} dB` }
    }
  }
  const indexDb = mode === 'basic' ? (t500 + t1000 + t2000) / 3 : (t500 + t1000 + t2000 + (t3000 as number)) / 4
  const cls: { label: string; tone: FletcherTone } = indexDb < 26
    ? { label: 'Normal', tone: 'normal' }
    : indexDb < 41
    ? { label: 'Mild hearing loss', tone: 'low' }
    : indexDb < 56
    ? { label: 'Moderate hearing loss', tone: 'low' }
    : indexDb < 71
    ? { label: 'Moderately severe hearing loss', tone: 'critical' }
    : indexDb < 91
    ? { label: 'Severe hearing loss', tone: 'critical' }
    : { label: 'Profound (total) hearing loss', tone: 'critical' }
  return { ok: true, data: { indexDb, ...cls } }
}
