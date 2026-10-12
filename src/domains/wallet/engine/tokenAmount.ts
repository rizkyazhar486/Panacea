// Validasi jumlah PNC untuk dompet simulasi. NaN lolos `amount <= 0` dan `balance < amount`
// (keduanya false), sehingga saldo bisa menjadi NaN dan riwayat rusak; pecahan juga tidak
// mewakili token utuh. Murni & deterministik: tidak menyentuh state.
export type TokenAmountCheck = { ok: true; amount: number } | { ok: false; reason: string }

export function checkTokenAmount(amount: unknown): TokenAmountCheck {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return { ok: false, reason: 'Invalid amount.' }
  if (amount <= 0) return { ok: false, reason: 'Invalid amount.' }
  if (!Number.isInteger(amount)) return { ok: false, reason: 'Amount must be a whole number of PNC.' }
  return { ok: true, amount }
}
