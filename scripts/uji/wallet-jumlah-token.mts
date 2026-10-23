// Jumlah PNC: NaN/Infinity/pecahan/nol/negatif ditolak; bilangan bulat positif diterima.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
console.log('wallet-jumlah-token: OK')
