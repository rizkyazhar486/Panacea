/**
 * Hitungan "unsupported claims" pada penilaian studi validasi klinis. Sebelumnya `Number(teks) || 0`: kolom kosong atau
 * teks bukan angka ("abc") terekam sebagai 0 klaim tak didukung — penilai tampak menyatakan keluaran sistem bersih padahal
 * tidak menilai. Di sini kosong/bukan-angka ditolak, dan batasnya sama dengan server (bilangan bulat 0–100,
 * server/src/validasiLedger.ts) agar penolakan terjadi sebelum kirim, bukan sebagai galat server.
 */
export const UNSUPPORTED_CLAIM_MAX = 100

export type UnsupportedClaimResult = { ok: true; value: number } | { ok: false; problem: string }

export function parseUnsupportedClaimCount(text: unknown): UnsupportedClaimResult {
  if (typeof text !== 'string') return { ok: false, problem: 'Unsupported claims must be a whole number.' }
  const t = text.trim()
  if (t === '') return { ok: false, problem: 'Enter the number of unsupported claims (0 if none).' }
  if (!/^\d+$/.test(t)) return { ok: false, problem: 'Unsupported claims must be a whole number.' }
  const value = Number(t)
  if (value > UNSUPPORTED_CLAIM_MAX) return { ok: false, problem: `Unsupported claims cannot exceed ${UNSUPPORTED_CLAIM_MAX}.` }
  return { ok: true, value }
}
