/**
 * Validasi masukan simulasi kebijakan (Taylor rule) di Macro Lab. Sebelumnya setiap kolom dibaca `Number(x) || 0`:
 * kolom kosong menjadi 0 diam-diam, dan karena nilai dikembalikan ke kolom sebagai angka, mengetik "-" atau "2."
 * langsung ditimpa — angka negatif (deflasi, output gap negatif) dan desimal tak bisa diketik. Rentang di sini
 * adalah kewajaran masukan sebuah sandbox, bukan batas ekonomi atau rekomendasi kebijakan.
 */
export const POLICY_BOUNDS = {
  startInflationPct: { min: -10, max: 200, label: 'Starting inflation' },
  targetInflationPct: { min: -5, max: 20, label: 'Inflation target' },
  startPolicyRatePct: { min: -5, max: 100, label: 'Starting policy rate' },
  outputGapPct: { min: -30, max: 30, label: 'Output gap' },
} as const

export type PolicyField = keyof typeof POLICY_BOUNDS
export type PolicyInputText = Record<PolicyField, string>
export type PolicyInputValue = Record<PolicyField, number>

/** `problems` dikunci per kolom agar halaman menampilkannya di bawah kolom yang salah. */
export type PolicyInputResult =
  | { ok: true; value: PolicyInputValue }
  | { ok: false; problems: Partial<Record<PolicyField, string>> }

export function validatePolicyInput(raw: PolicyInputText): PolicyInputResult {
  const value = {} as PolicyInputValue
  const problems: Partial<Record<PolicyField, string>> = {}
  for (const k of Object.keys(POLICY_BOUNDS) as PolicyField[]) {
    const { min, max, label } = POLICY_BOUNDS[k]
    const text = raw?.[k]
    const n = typeof text === 'string' && text.trim() !== '' ? Number(text) : Number.NaN
    if (!Number.isFinite(n)) problems[k] = `${label}: enter a number`
    else if (n < min || n > max) problems[k] = `${label}: ${min} to ${max}`
    else value[k] = n
  }
  return Object.keys(problems).length > 0 ? { ok: false, problems } : { ok: true, value }
}
