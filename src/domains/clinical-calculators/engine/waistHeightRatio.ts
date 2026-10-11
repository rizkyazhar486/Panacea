/**
 * Rasio lingkar pinggang / tinggi badan (WHtR) untuk Self-Assessment Toolkit.
 * Halaman lama membaca kolom kosong sebagai 0: tinggi kosong → rasio "Infinity" berlabel High risk, pinggang kosong → 0,00
 * berlabel Lower risk. Di sini kolom kosong/NaN/di luar rentang ditolak tanpa angka. Rentang = batas yang sudah tertulis pada
 * kolom halaman (kewajaran masukan, bukan ambang klinis); ambang 0,5/0,6 dipindahkan tanpa perubahan dan bukan diagnosis.
 */
import { inRange, parseNumberField } from './inputs'

export const WHTR_WAIST_CM = { min: 40, max: 200 } as const
export const WHTR_HEIGHT_CM = { min: 100, max: 230 } as const
export const WHTR_THRESHOLDS = { increased: 0.5, high: 0.6 } as const

export type WhtrBand = 'lower' | 'increased' | 'high'
export type WhtrResult = { ok: true; ratio: number; band: WhtrBand } | { ok: false; reasons: string[] }

export function whtrBand(ratio: number): WhtrBand {
  return ratio < WHTR_THRESHOLDS.increased ? 'lower' : ratio < WHTR_THRESHOLDS.high ? 'increased' : 'high'
}

export function waistHeightRatio(waistCm: number, heightCm: number): WhtrResult {
  const reasons: string[] = []
  if (!inRange(waistCm, WHTR_WAIST_CM.min, WHTR_WAIST_CM.max)) reasons.push(`Waist must be ${WHTR_WAIST_CM.min}–${WHTR_WAIST_CM.max} cm`)
  if (!inRange(heightCm, WHTR_HEIGHT_CM.min, WHTR_HEIGHT_CM.max)) reasons.push(`Height must be ${WHTR_HEIGHT_CM.min}–${WHTR_HEIGHT_CM.max} cm`)
  if (reasons.length) return { ok: false, reasons }
  const ratio = waistCm / heightCm
  return { ok: true, ratio, band: whtrBand(ratio) }
}

/** Dari teks kolom mentah; kolom kosong ditolak (bukan 0). */
export const waistHeightRatioFromText = (waistText: string, heightText: string): WhtrResult =>
  waistHeightRatio(parseNumberField(waistText), parseNumberField(heightText))
