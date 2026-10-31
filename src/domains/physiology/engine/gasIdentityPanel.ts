/**
 * Model tampilan untuk dua identitas pertukaran gas (lihat gasExchangeIdentities.ts). Murni: tidak membaca penyimpanan,
 * tidak menulis apa pun, tidak mengisi nilai kosong. Kolom kosong = "belum diisi", BUKAN nol (nol adalah nilai fisik yang berbeda).
 */
import { deadSpaceFraction, shuntFraction, type IdentityResult } from './gasExchangeIdentities'

export type FieldState = { state: 'missing' } | { state: 'invalid' } | { state: 'ok'; value: number }

/** Angka desimal biasa saja; koma desimal (5,3) diterima karena itu cara pengguna Indonesia menulisnya. Notasi ilmiah, spasi dalam angka, dan teks lain ditolak. */
export function parseFieldNumber(raw: string): FieldState {
  const text = raw.trim()
  if (text === '') return { state: 'missing' }
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) return { state: 'invalid' }
  const value = Number(text.replace(',', '.'))
  return Number.isFinite(value) ? { state: 'ok', value } : { state: 'invalid' }
}

export type Segment = { label: string; fraction: number }
export type PanelView =
  | { status: 'incomplete'; missing: readonly string[] }
  | { status: 'invalid-field'; fields: readonly string[] }
  | { status: 'rejected'; reason: 'invalid-input' | 'impossible-combination'; detail: string }
  | { status: 'ok'; fraction: number; segments: readonly [Segment, Segment]; result: Extract<IdentityResult, { ok: true }> }

function evaluate(
  names: readonly string[], raws: readonly string[],
  run: (values: number[]) => IdentityResult,
  labels: readonly [string, string],
): PanelView {
  const parsed = raws.map(parseFieldNumber)
  const invalid = names.filter((_, i) => parsed[i].state === 'invalid')
  if (invalid.length) return { status: 'invalid-field', fields: invalid }
  const missing = names.filter((_, i) => parsed[i].state === 'missing')
  if (missing.length) return { status: 'incomplete', missing }
  const result = run(parsed.map((p) => (p as { value: number }).value))
  if (!result.ok) return { status: 'rejected', reason: result.reason, detail: result.detail }
  return { status: 'ok', fraction: result.fraction, segments: [{ label: labels[0], fraction: result.fraction }, { label: labels[1], fraction: 1 - result.fraction }], result }
}

export function deadSpacePanel(paco2: string, pecco2: string): PanelView {
  return evaluate(['PaCO₂', 'Mixed expired PCO₂'], [paco2, pecco2], ([a, e]) => deadSpaceFraction(a, e), ['Dead space (VD)', 'Alveolar share (VT − VD)'])
}

export function shuntPanel(cc: string, ca: string, cv: string): PanelView {
  return evaluate(['CcO₂', 'CaO₂', 'CvO₂'], [cc, ca, cv], ([c, a, v]) => shuntFraction(c, a, v), ['Shunted flow (Qs)', 'Capillary flow (Qt − Qs)'])
}
