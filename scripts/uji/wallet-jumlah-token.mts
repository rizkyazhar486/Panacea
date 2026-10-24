// Jumlah PNC: NaN/Infinity/pecahan/nol/negatif ditolak; bilangan bulat positif diterima.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { checkTokenAmount } from '../../src/domains/wallet/engine/tokenAmount'

// positif
assert.deepEqual(checkTokenAmount(1), { ok: true, amount: 1 })
assert.deepEqual(checkTokenAmount(250), { ok: true, amount: 250 })

// negatif: tiap aturan ditolak dengan alasan spesifik
const tolak = (v: unknown, re: RegExp) => {
  const r = checkTokenAmount(v)
  assert.equal(r.ok, false, String(v))
  if (!r.ok) assert.match(r.reason, re)
}
tolak(Number.NaN, /Invalid amount/)
tolak(Number.POSITIVE_INFINITY, /Invalid amount/)
tolak(Number.NEGATIVE_INFINITY, /Invalid amount/)
tolak('5', /Invalid amount/)
tolak(null, /Invalid amount/)
tolak(undefined, /Invalid amount/)
tolak(0, /Invalid amount/)
tolak(-1, /Invalid amount/)
tolak(0.5, /whole number/)
tolak(1.0000001, /whole number/)

// batas berpasangan: 1 sah, 0 dan 0.99 tidak
assert.equal(checkTokenAmount(1).ok, true)
assert.equal(checkTokenAmount(0).ok, false)
assert.equal(checkTokenAmount(0.99).ok, false)

// determinisme
assert.deepEqual(checkTokenAmount(7), checkTokenAmount(7))

// Wiring: spendPnc memakai checkTokenAmount; withdrawal telah dijaga parseWithdrawAmount dari main
const store = readFileSync('src/lib/store.tsx', 'utf8')
assert.equal((store.match(/checkTokenAmount\(amount\)/g) ?? []).length, 1)
assert.match(store, /const parsed = parseWithdrawAmount\(amount\)/)
tolak(Number.MAX_SAFE_INTEGER + 1, /whole number/)
// Execute the production action, including state effects; helper/wiring checks alone
// cannot detect a debit that happens before validation or a rejected mutation.
const start = store.indexOf('spendPnc: (amount, note) => {')
const end = store.indexOf('      subscribe:', start)
assert.ok(start >= 0 && end > start, 'production spend action must be located')
const action = store.slice(start, end).replace(/^spendPnc:\s*/, '').replace(/,\s*$/, '')
const fixedAt = '2026-10-23T00:00:00.000Z'
class FixedDate extends Date { constructor() { super(fixedAt) } }
const initialWallet = { balance: 100, transactions: [{ id: 'existing', type: 'reward', amount: 100, note: 'synthetic opening', at: fixedAt }] }
function spend(amount: unknown, balance = 100) {
  let state = { wallet: { ...structuredClone(initialWallet), balance }, sentinel: 'preserved' }
  const before = structuredClone(state)
  let writes = 0
  const run = new Function('checkTokenAmount', 'state', 'setState', 'uid', 'Date', `return ${stripTypeScriptTypes(`(${action})`)}`)(
    checkTokenAmount, state, (update: (s: typeof state) => typeof state) => { writes++; state = update(state) }, () => 'synthetic-purchase', FixedDate,
  )
  const result = run(amount, 'synthetic purchase')
  return { result, state, before, writes }
}
for (const amount of [NaN, Infinity, -Infinity, -1, 0.5, 1.0000001, '5', null, undefined, {}, [], true, Number.MAX_SAFE_INTEGER + 1]) {
  const r = spend(amount)
  assert.deepEqual(r.result, { ok: false, reason: 'invalid_amount' }, `reject ${String(amount)}`)
  assert.equal(r.writes, 0)
  assert.deepEqual(r.state, r.before, 'invalid amount must preserve balance, history and other state')
}
const free = spend(0)
assert.deepEqual(free.result, { ok: true })
assert.equal(free.writes, 0)
assert.deepEqual(free.state, free.before)
const insufficient = spend(101)
assert.deepEqual(insufficient.result, { ok: false, reason: 'insufficient_balance' })
assert.equal(insufficient.writes, 0)
assert.deepEqual(insufficient.state, insufficient.before)
for (const amount of [1, 25, 100, Number.MAX_SAFE_INTEGER]) {
  const balance = amount === Number.MAX_SAFE_INTEGER ? amount : 100
  const r = spend(amount, balance)
  assert.deepEqual(r.result, { ok: true })
  assert.equal(r.writes, 1)
  assert.deepEqual(r.state, { sentinel: 'preserved', wallet: { balance: balance - amount, transactions: [
    { id: 'synthetic-purchase', type: 'purchase', amount: -amount, note: 'synthetic purchase', at: fixedAt },
    ...r.before.wallet.transactions,
  ] } })
}
console.log('wallet-jumlah-token: helper and actual-action state invariants OK')
