// Clinical Calculators paywall over real HTTP: the first 50 accounts are free, everyone after pays 500 PNC once.
// Money path: exact balance arithmetic, no double charge, refusal changes nothing. Synthetic accounts; top-ups use the owner-approval route.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'paywall-owner@localhost.test'
const running = await startIsolatedServer('calc-paywall', ownerEmail)
try {
  const { call } = running
  type Acc = { token: string; user: { id: string }; email: string }
  const accounts: Acc[] = []
  const login = async (email: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role: 'pasien', name: email })
    assert.equal(r.status, 200, `login ${email}`)
    return { ...(r.body as { token: string; user: { id: string } }), email }
  }
  // The auth limiter allows 30 sign-ins per window per process; a restart on the same data file resets it and keeps every account.
  const owner = await login(ownerEmail); accounts.push(owner)
  for (let i = 1; i <= 51; i++) {
    if (i === 25 || i === 50) await running.restart()
    accounts.push(await login(`paywall-user-${String(i).padStart(2, '0')}@localhost.test`))
  }
  const access = async (a: Acc) => (await call('GET', '/api/clinical-calculators/access', a.token)).body
  const unlock = (a: Acc) => call('POST', '/api/clinical-calculators/unlock-pnc', a.token)
  const wallet = async (a: Acc) => (await call('GET', '/api/wallet', a.token)).body
  const WELCOME_PNC = 25 // store.ts: every new account starts with a welcome bonus, so "no balance" means exactly this

  // 1. Anonymous callers are refused on both routes.
  assert.equal((await call('GET', '/api/clinical-calculators/access')).status, 401)
  assert.equal((await call('POST', '/api/clinical-calculators/unlock-pnc')).status, 401)

  // 2. Exactly the first 50 accounts by sign-up order are free; the 51st and 52nd are not (paired boundary).
  const free: boolean[] = []
  for (const a of accounts) free.push((await access(a)).free)
  assert.equal(free.filter(Boolean).length, 50, 'exactly 50 free accounts')
  assert.deepEqual(free.slice(0, 50).every(Boolean), true, 'the first 50 sign-ups are free')
  assert.deepEqual(free.slice(50), [false, false], 'accounts 51 and 52 are not free')
  const info = await access(accounts[0]!)
  assert.equal(info.limit, 50); assert.equal(info.pricePnc, 500); assert.equal(info.priceIdr, 500000); assert.equal(info.unlocked, true)

  // 3. A free account "unlocking" is a no-op: unlocked, nothing charged.
  const freeAcc = accounts[1]!
  const freeBefore = JSON.stringify(await wallet(freeAcc))
  const freeUnlock = await unlock(freeAcc)
  assert.equal(freeUnlock.status, 200); assert.equal(freeUnlock.body.unlocked, true); assert.equal(freeUnlock.body.balance, WELCOME_PNC)
  assert.equal(JSON.stringify(await wallet(freeAcc)), freeBefore, 'free account: wallet unchanged')

  // 4. A paying account with only the welcome bonus is refused with the exact price and balance, and nothing changes.
  const payer = accounts[50]!
  const before = await access(payer)
  assert.equal(before.free, false); assert.equal(before.unlocked, false)
  const walletBefore = JSON.stringify(await wallet(payer))
  const refused = await unlock(payer)
  assert.equal(refused.status, 402); assert.deepEqual(refused.body, { error: 'insufficient_balance', price: 500, balance: WELCOME_PNC })
  assert.equal((await access(payer)).unlocked, false, 'refusal does not unlock')
  assert.equal(JSON.stringify(await wallet(payer)), walletBefore, 'refusal charges nothing and writes no transaction')

  // 5. Top-up goes through the owner approval route: 499 is one short, 500 is exactly enough.
  const topUp = async (a: Acc, amountPnc: number) => {
    const req = await call('POST', '/api/wallet/topup-request', a.token, { amountPnc })
    assert.equal(req.status, 200)
    const decided = await call('POST', '/api/wallet/topups/decide', owner.token, { id: req.body.request.id, approve: true })
    assert.equal(decided.status, 200); return decided.body.balance as number
  }
  assert.equal(await topUp(payer, 499 - WELCOME_PNC), 499)
  assert.deepEqual((await unlock(payer)).body, { error: 'insufficient_balance', price: 500, balance: 499 }, '499 PNC is one short')
  assert.equal((await access(payer)).unlocked, false)
  assert.equal(await topUp(payer, 1), 500)
  const paid = await unlock(payer)
  assert.equal(paid.status, 200); assert.deepEqual(paid.body, { ok: true, unlocked: true, balance: 0 }, '500 PNC pays exactly once')
  assert.equal((await access(payer)).unlocked, true)

  // 6. Unlocking again never charges twice: with extra balance the second and third calls leave it untouched.
  assert.equal(await topUp(payer, 700), 700)
  for (let i = 0; i < 2; i++) assert.deepEqual((await unlock(payer)).body, { ok: true, unlocked: true, balance: 700 }, `repeat unlock ${i + 1}: no second charge`)

  // 7. One account's unlock never unlocks another (the 52nd stays locked even with the same balance).
  const other = accounts[51]!
  assert.equal((await access(other)).unlocked, false)
  assert.equal((await unlock(other)).status, 402)

  console.log('calculatorPaywallHttp: 401 anonymous, exactly 50 free sign-ups, free unlock is a no-op, 402 with exact price/balance and no mutation, 499 refused / 500 pays once, no double charge, no cross-account unlock; passed')
} finally {
  await running.stop()
}
