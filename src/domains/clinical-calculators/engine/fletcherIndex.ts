/**
 * Indeks Fletcher: rata-rata ambang nada murni 500/1000/2000 Hz (dasar) atau + 3000 Hz (AAO-HNS 4-frekuensi).
 * Kelas dipindahkan dari halaman tanpa perubahan ambang (<26, <41, <56, <71, <91). Tampilan pendukung keputusan.
 */
import { inRange } from './inputs'

// Batas kewarasan ambang dengar audiometer dB HL (bukan ambang klinis).
export const THRESHOLD_DB = { min: -10, max: 120 } as const

export type FletcherTone = 'normal' | 'low' | 'critical'
export type FletcherMode = 'basic' | 'complete'
export type FletcherResult =
  | { ok: true; data: { index: number; label: string; tone: FletcherTone } }
  | { ok: false; reason: string }

const CLASSES: ReadonlyArray<{ below: number; label: string; tone: FletcherTone }> = [
  { below: 26, label: 'Normal', tone: 'normal' },
  { below: 41, label: 'Mild hearing loss', tone: 'low' },
  { below: 56, label: 'Moderate hearing loss', tone: 'low' },
  { below: 71, label: 'Moderately severe hearing loss', tone: 'critical' },
  { below: 91, label: 'Severe hearing loss', tone: 'critical' },
]

export function fletcherIndex(mode: FletcherMode, t500: number, t1000: number, t2000: number, t3000: number): FletcherResult {
  if (mode !== 'basic' && mode !== 'complete') return { ok: false, reason: 'Mode must be basic or complete' }
  const used = mode === 'basic' ? [['500', t500], ['1000', t1000], ['2000', t2000]] as const : [['500', t500], ['1000', t1000], ['2000', t2000], ['3000', t3000]] as const
  for (const [hz, v] of used) {
    if (!inRange(v, THRESHOLD_DB.min, THRESHOLD_DB.max)) return { ok: false, reason: `${hz} Hz threshold must be ${THRESHOLD_DB.min}–${THRESHOLD_DB.max} dB` }
  }
  const index = used.reduce((s, [, v]) => s + v, 0) / used.length
  const hit = CLASSES.find((c) => index < c.below)
  return { ok: true, data: { index, label: hit?.label ?? 'Profound (total) hearing loss', tone: hit?.tone ?? 'critical' } }
}
