// Wallet top-up request amount guard over real HTTP. Regression: a JSON amount such as 1e999 parses to Infinity and used to be stored
// as a manual top-up request; non-finite/unsafe amounts must now be refused with bad_amount and leave no request behind.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'wallet-owner@localhost.test'
const running = await startIsolatedServer('wallet-topup-amount', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string }
  }
  const owner = await login(ownerEmail, 'pasien')
  const alice = await login('wallet-alice@localhost.test', 'pasien')
  const pending = async () => (await call('GET', '/api/wallet/topups', owner.token)).body.requests.length as number
  assert.equal(await pending(), 0)
  assert.equal((await call('POST', '/api/wallet/topup-request', undefined, { amountPnc: 25 })).status, 401)
  assert.equal((await call('POST', '/api/wallet/withdraw', undefined, { amountPnc: 25 })).status, 401)
  assert.equal((await call('GET', '/api/wallet/topups', alice.token)).status, 403)

  // JSON.stringify(Infinity) is null, so use Node 24's raw numeric JSON token
  // to genuinely exercise Express JSON parsing of 1e999 into Infinity.
  const rawJSON = (JSON as typeof JSON & { rawJSON(value: string): unknown }).rawJSON
  const badAmounts = [0, -5, 'abc', '', ' ', null, true, false, [], [25], {}, rawJSON('1e999'), rawJSON('-1e999'), Number.MAX_SAFE_INTEGER, 1e21]
  for (const bad of badAmounts) {
    const r = await call('POST', '/api/wallet/topup-request', alice.token, { amountPnc: bad })
    assert.equal(r.status, 400, `amount ${JSON.stringify(bad)}`)
    assert.deepEqual(r.body, { error: 'bad_amount' })
    const w = await call('POST', '/api/wallet/withdraw', alice.token, { amountPnc: bad, bank: 'BCA', accountNumber: '1', accountHolder: 'A' })
    assert.equal(w.status, 400)
    assert.deepEqual(w.body, { error: 'bad_amount' })
  }
  assert.equal(await pending(), 0, 'no request stored for refused amounts')
  await running.restart()
  assert.equal(await pending(), 0, 'refused requests must not appear after a persistence restart')

  // Paired valid case differing only in the amount.
  const ok = await call('POST', '/api/wallet/topup-request', alice.token, { amountPnc: 25.9 })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.request.amountPnc, 25)
  assert.equal(await pending(), 1)
  await running.restart()
  const saved = await call('GET', '/api/wallet/topups', owner.token)
  assert.equal(saved.body.requests.length, 1)
  assert.equal(saved.body.requests[0].amountPnc, 25)

  console.log('wallet top-up amount HTTP: ok')
} finally {
  await running.stop()
}
