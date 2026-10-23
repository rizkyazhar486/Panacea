/**
 * Biaya per orang untuk meet Club Hub. Kolom kosong TIDAK boleh menjadi "gratis": gratis harus keputusan eksplisit (0).
 * Batas atas hanya kewajaran input (salah ketik nol), bukan aturan harga.
 */
export const MEET_FEE_MAX_RP = 10_000_000

export type MeetFeeResult = { ok: true; feeRp: number } | { ok: false; problem: 'empty' | 'not_a_number' | 'negative' | 'fractional' | 'too_large'; message: string }

const bad = (problem: Extract<MeetFeeResult, { ok: false }>['problem'], message: string): MeetFeeResult => ({ ok: false, problem, message })

export function parseMeetFee(text: unknown): MeetFeeResult {
  if (typeof text !== 'string' || text.trim() === '') return bad('empty', 'Enter a fee, or 0 for a free meet.')
  const n = Number(text)
  if (!Number.isFinite(n)) return bad('not_a_number', 'Fee must be a number.')
  if (n < 0) return bad('negative', 'Fee cannot be negative.')
  if (!Number.isInteger(n)) return bad('fractional', 'Fee must be a whole number of rupiah.')
  if (n > MEET_FEE_MAX_RP) return bad('too_large', `Fee cannot exceed Rp${MEET_FEE_MAX_RP.toLocaleString('en-GB')}.`)
  return { ok: true, feeRp: n }
}
