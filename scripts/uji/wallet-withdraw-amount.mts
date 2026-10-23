import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { parseWithdrawAmount, WITHDRAW_INVALID } from '../../src/domains/wallet/index.ts'

const tolak = { ok: false, reason: WITHDRAW_INVALID }

// Positif: bilangan bulat valid, angka maupun teks.
assert.deepEqual(parseWithdrawAmount(10), { ok: true, amount: 10 })
assert.deepEqual(parseWithdrawAmount(' 25 '), { ok: true, amount: 25 })
// Batas berpasangan: 1 diterima, 0 dan -1 ditolak; maksimum aman diterima, +1 ditolak.
assert.deepEqual(parseWithdrawAmount(1), { ok: true, amount: 1 })
assert.deepEqual(parseWithdrawAmount(0), tolak)
assert.deepEqual(parseWithdrawAmount(-1), tolak)
assert.deepEqual(parseWithdrawAmount(Number.MAX_SAFE_INTEGER), { ok: true, amount: Number.MAX_SAFE_INTEGER })
assert.deepEqual(parseWithdrawAmount(Number.MAX_SAFE_INTEGER + 1), tolak)
// Negatif: pecahan, NaN, ±Infinity, kosong, bukan angka, tipe salah.
for (const bad of [0.5, 1.5, NaN, Infinity, -Infinity, '', '  ', 'abc', '1e999', '1.5', null, undefined, {}, [], true]) {
  assert.deepEqual(parseWithdrawAmount(bad), tolak, `menolak ${String(bad)}`)
}
// Determinisme.
assert.deepEqual(parseWithdrawAmount(7), parseWithdrawAmount(7))

// Every ordinary whole amount survives textual input without rounding; a nearby
// fraction must never become a debit of that whole amount.
for (let amount = 1; amount <= 1000; amount++) {
  assert.deepEqual(parseWithdrawAmount(String(amount)), { ok: true, amount })
  assert.deepEqual(parseWithdrawAmount(String(amount + 0.5)), tolak)
}

// Regresi sumber: store memvalidasi lewat parser, UI tidak lagi memakai `|| 0`.
const store = readFileSync('src/lib/store.tsx', 'utf8')
assert.match(store, /parseWithdrawAmount\(amount\)/)
const billing = readFileSync('src/pages/admin/Billing.tsx', 'utf8')
assert.doesNotMatch(billing, /withdrawTokens\(Number\(withdraw\) \|\| 0/)

// Exercise the production action in both configured modes. A server-backed
// balance must never be debited by the offline demo action.
const actionSource = store.slice(store.indexOf('withdrawTokens: (amount, bank) => {'), store.indexOf('      spendPnc:', store.indexOf('withdrawTokens: (amount, bank) => {')))
const action = actionSource.replace(/^withdrawTokens:\s*/, '').replace(/,\s*$/, '')
for (const enabled of [false, true]) {
  let wallet = { balance: 100, transactions: [] as { amount: number; note: string }[] }
  let writes = 0
  const run = new Function('backendEnabled', 'parseWithdrawAmount', 'state', 'setState', 'uid', `return ${stripTypeScriptTypes(`(${action})`)}`)(
    enabled, parseWithdrawAmount, { wallet }, (update: (s: { wallet: typeof wallet }) => { wallet: typeof wallet }) => { writes++; wallet = update({ wallet }).wallet }, () => 'synthetic-debit',
  )
  const result = run(25, 'BCA')
  if (enabled) {
    assert.equal(result.ok, false)
    assert.equal(writes, 0)
    assert.deepEqual(wallet, { balance: 100, transactions: [] })
  } else {
    assert.equal(result.ok, true)
    assert.equal(wallet.balance, 75)
    assert.equal(wallet.transactions[0].amount, -25)
    assert.match(wallet.transactions[0].note, /Demo debit.*no bank payout requested/)
  }
}
console.log('wallet-withdraw-amount: ok')
