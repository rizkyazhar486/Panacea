// Validasi jumlah penarikan PNC (murni). Sebelumnya UI memakai `Number(x) || 0`
// dan store hanya menolak `<= 0`, sehingga NaN lolos dan pecahan PNC (0.5) diterima.
export type WithdrawAmountResult = { ok: true; amount: number } | { ok: false; reason: string }

export const WITHDRAW_INVALID = 'Enter a whole number of PNC, 1 or more.'

export function parseWithdrawAmount(input: unknown): WithdrawAmountResult {
  const n = typeof input === 'number' ? input : typeof input === 'string' && input.trim() !== '' ? Number(input) : NaN
  if (!Number.isSafeInteger(n) || n < 1) return { ok: false, reason: WITHDRAW_INVALID }
  return { ok: true, amount: n }
}
