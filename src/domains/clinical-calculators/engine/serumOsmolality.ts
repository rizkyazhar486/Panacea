/**
 * Osmolalitas serum terhitung 2·Na + glukosa/18 + BUN/2,8 (+ etanol/3,7) dan selisih osmolal terhadap nilai terukur
 * (Dorwart & Chalmers 1975). Rumus, pembagi, dan pita nilai dipindahkan dari halaman tanpa perubahan; yang baru hanya
 * penolakan masukan di luar rentang. Na/glukosa/BUN kosong sebelumnya terbaca 0, sehingga "Hypo-osmolal" tampil dengan angka
 * palsu; terukur yang tidak valid diam-diam dianggap "belum diisi". Etanol dan terukur bersifat opsional: kosong (undefined)
 * berarti tidak diberikan, tetapi bila diberikan harus dalam rentang. Alat bantu skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const OSM_RANGES = {
  na: { min: 90, max: 200, name: 'Na', unit: ' mmol/L' },
  glucose: { min: 20, max: 2000, name: 'Glucose', unit: ' mg/dL' },
  bun: { min: 1, max: 300, name: 'BUN', unit: ' mg/dL' },
  ethanol: { min: 0, max: 1000, name: 'Ethanol', unit: ' mg/dL' },
  measured: { min: 150, max: 600, name: 'Measured osmolality', unit: ' mOsm/kg' },
} as const

export type OsmTone = 'brand' | 'low' | 'critical'
export type OsmInput = Readonly<{ na: number; glucose: number; bun: number; ethanol?: number; measured?: number }>
export type OsmResult =
  | { ok: true; data: { calculated: number; band: { label: string; tone: OsmTone }; gap: number | null; gapBand: { label: string; tone: OsmTone } | null } }
  | { ok: false; reason: string }

export function gapBand(gap: number): { label: string; tone: OsmTone } {
  if (gap > 20) return { label: 'Markedly elevated gap', tone: 'critical' }
  if (gap > 10) return { label: 'Elevated gap', tone: 'low' }
  if (gap >= -10) return { label: 'Normal gap', tone: 'brand' }
  return { label: 'Negative gap — recheck values/units', tone: 'low' }
}

export function osmBand(osm: number): { label: string; tone: OsmTone } {
  if (osm < 275) return { label: 'Hypo-osmolal', tone: 'low' }
  if (osm <= 295) return { label: 'Normal', tone: 'brand' }
  if (osm <= 320) return { label: 'Hyperosmolal', tone: 'low' }
  return { label: 'Severely hyperosmolal', tone: 'critical' }
}

export function serumOsmolality(input: OsmInput): OsmResult {
  for (const key of ['na', 'glucose', 'bun'] as const) {
    const { min, max, name, unit } = OSM_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${name} must be ${min}–${max}${unit}` }
  }
  for (const key of ['ethanol', 'measured'] as const) {
    const v = input[key]
    if (v === undefined) continue
    const { min, max, name, unit } = OSM_RANGES[key]
    if (!inRange(v, min, max)) return { ok: false, reason: `${name} must be ${min}–${max}${unit}` }
  }
  const { na, glucose, bun, ethanol, measured } = input
  const calculated = 2 * na + glucose / 18 + bun / 2.8 + (ethanol !== undefined && ethanol > 0 ? ethanol / 3.7 : 0)
  const gap = measured !== undefined ? measured - calculated : null
  return { ok: true, data: { calculated, band: osmBand(calculated), gap, gapBand: gap !== null ? gapBand(gap) : null } }
}
