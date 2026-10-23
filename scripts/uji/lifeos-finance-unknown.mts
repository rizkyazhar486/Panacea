// C2: entri keuangan tanpa jenis/jumlah valid bukan Rp0; jumlah tidak tampil lengkap bila ada yang dilewati.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { monthTotals: mt } = await import('../../src/components/dashboard/lifeOsFinance.ts')
const M = '2026-10'
assert.deepEqual(mt([{ date: '2026-10-02', kind: 'income', amount: 1000 }, { date: '2026-10-03', kind: 'expense', amount: 400 }], M), { income: 1000, expense: 400, net: 600, skipped: 0 })
assert.deepEqual(mt([{ date: '2026-10-02', kind: 'expense', amount: 0 }], M), { income: 0, expense: 0, net: 0, skipped: 0 }, 'nol yang tercatat adalah nol sungguhan')
assert.deepEqual(mt([], M), { income: 0, expense: 0, net: null, skipped: 0 }, 'tanpa entri: tidak ada net')
for (const bad of [{ amount: undefined }, { amount: NaN }, { amount: Infinity }, { amount: '500' as any }, { amount: null as any }, { kind: undefined }, { kind: 'transfer' as any }]) {
  const r = mt([{ date: '2026-10-02', kind: 'income', amount: 100, ...bad } as any], M)
  assert.equal(r.skipped, 1, `${JSON.stringify(bad)} dilewati`); assert.equal(r.net, null, 'semua dilewati → net tidak diketahui'); assert.equal(r.income, 0)
}
const r = mt([{ date: '2026-10-02', kind: 'income', amount: 100 }, { date: '2026-10-03', kind: 'expense' }], M)
assert.deepEqual([r.net, r.skipped], [100, 1], 'sebagian dilewati dilaporkan')
assert.equal(mt([{ date: '2026-09-30', kind: 'income', amount: 5 }, { kind: 'income', amount: 5 }, null as any], M).skipped, 0, 'bulan lain/tanpa tanggal bukan "dilewati"')
const w = readFileSync('src/components/dashboard/LifeOSWidgets.tsx', 'utf8')
assert.match(w, /monthTotals\(finance, monthKey\)/); assert.match(w, /net === null \? '—'/); assert.match(w, /totals\.skipped > 0 \? ` · \$\{totals\.skipped\} not counted \(no valid amount\)`/); assert.doesNotMatch(w, /Number\.isFinite\(tx\.amount\) \? Number\(tx\.amount\) : 0/)
console.log('lifeos-finance-unknown: ok')
