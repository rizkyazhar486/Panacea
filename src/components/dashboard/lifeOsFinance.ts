// Ringkasan keuangan bulan ini untuk Life OS: entri tanpa jumlah yang valid bukan nol rupiah.
// Dulu `Number.isFinite(amount) ? amount : 0` menjumlahkan entri rusak sebagai Rp0 dan jumlahnya tampil seolah lengkap.

export type FinanceTx = { date?: string; kind?: 'income' | 'expense'; amount?: number }

export interface MonthTotals {
  income: number
  expense: number
  /** `null` bila tidak ada satu pun entri dengan jenis dan jumlah yang valid. */
  net: number | null
  /** Entri bulan ini yang tidak dihitung (jenis atau jumlah tidak valid). */
  skipped: number
}

export function monthTotals(finance: FinanceTx[], monthKey: string): MonthTotals {
  let income = 0
  let expense = 0
  let counted = 0
  let skipped = 0
  for (const tx of finance) {
    if (typeof tx?.date !== 'string' || !tx.date.startsWith(monthKey)) continue
    const valid = (tx.kind === 'income' || tx.kind === 'expense') && typeof tx.amount === 'number' && Number.isFinite(tx.amount)
    if (!valid) { skipped += 1; continue }
    counted += 1
    if (tx.kind === 'income') income += tx.amount as number
    else expense += tx.amount as number
  }
  return { income, expense, net: counted > 0 ? income - expense : null, skipped }
}
