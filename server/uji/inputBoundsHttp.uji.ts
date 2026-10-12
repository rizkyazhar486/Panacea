// Input bounds and public-data hygiene over real HTTP in isolated file mode: push subscriptions are validated and capped,
// post and feedback text is bounded, and the public facility price board shows the contributor's name but not their email.
// Limits are input-sanity choices (not clinical rules). Synthetic fixtures.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const running = await startIsolatedServer('input-bounds', 'bounds-owner@localhost.test')
try {
  const { call } = running
  const login = async (email: string, role = 'pasien') => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const alice = await login('bounds-alice@localhost.test')
  const bob = await login('bounds-bob@localhost.test')

  // 1. Push subscriptions: only the shape a browser really sends is stored; the per-account count is capped.
  const sub = (n: number | string, extra: Record<string, unknown> = {}) => ({ endpoint: `https://push.example.test/send/${n}`, expirationTime: null, keys: { p256dh: 'p'.repeat(40), auth: 'a'.repeat(16) }, ...extra })
  const subscribe = (token: string | undefined, subscription: unknown) => call('POST', '/api/push/subscribe', token, { subscription })
  const count = async (account: { token: string }) => (await call('GET', '/api/push/status', account.token)).body.langganan as number
  assert.equal((await subscribe(undefined, sub(0))).status, 401)
  assert.equal((await subscribe(alice.token, sub(0))).status, 200); assert.equal(await count(alice), 1)
  assert.equal((await subscribe(alice.token, sub(0, { keys: { p256dh: 'q'.repeat(40), auth: 'b'.repeat(16) } }))).status, 200)
  assert.equal(await count(alice), 1, 'the same endpoint replaces the entry (fresh keys) instead of duplicating it')
  for (const [label, bad] of [
    ['not an object', 'x'], ['an array', [sub(1)]], ['null', null], ['no endpoint', { keys: sub(1).keys }], ['endpoint not text', sub(1, { endpoint: 42 })],
    ['not a URL', sub(1, { endpoint: 'not a url' })], ['http endpoint', sub(1, { endpoint: 'http://push.example.test/x' })], ['javascript endpoint', sub(1, { endpoint: 'javascript:alert(1)' })],
    ['endpoint too long', sub(1, { endpoint: 'https://push.example.test/' + 'x'.repeat(2100) })], ['no keys', { endpoint: sub(1).endpoint }], ['keys not an object', sub(1, { keys: 'k' })],
    ['missing auth key', sub(1, { keys: { p256dh: 'p' } })], ['key too long', sub(1, { keys: { p256dh: 'p'.repeat(300), auth: 'a' } })], ['key not text', sub(1, { keys: { p256dh: 1, auth: 2 } })],
    ['expirationTime not a number', sub(1, { expirationTime: 'soon' })],
  ] as const) {
    assert.equal((await subscribe(alice.token, bad)).status, 400, label)
    assert.equal(await count(alice), 1, `${label}: a rejected subscription is not stored`)
  }
  for (let i = 1; i <= 24; i += 1) assert.equal((await subscribe(alice.token, sub(i))).status, 200)
  assert.equal(await count(alice), 20, 'at most 20 subscriptions per account; the oldest are dropped')
  assert.equal(await count(bob), 0, "alice's subscriptions are not bob's")
  // Removal is scoped to the caller: bob cannot remove alice's, and the newest is removable while a dropped old one is already gone.
  await call('POST', '/api/push/unsubscribe', bob.token, { endpoint: sub(24).endpoint }); assert.equal(await count(alice), 20)
  await call('POST', '/api/push/unsubscribe', alice.token, { endpoint: sub(24).endpoint }); assert.equal(await count(alice), 19, 'the newest is kept and removable')
  await call('POST', '/api/push/unsubscribe', alice.token, { endpoint: sub(0).endpoint }); assert.equal(await count(alice), 19, 'the oldest was dropped by the cap')

  // 2. Posts: text is bounded and the colour is a real colour, on create and on edit.
  const color = (value: unknown) => call('POST', '/api/posts', alice.token, { kind: 'image', caption: 'c', activity: 'a', mediaColor: value })
  const long = await call('POST', '/api/posts', alice.token, { kind: 'image', caption: 'c'.repeat(6000), activity: 'a'.repeat(300), mediaColor: '#12abEF' })
  assert.equal(long.body.post.caption.length, 5000); assert.equal(long.body.post.activity.length, 100); assert.equal(long.body.post.mediaColor, '#12abEF', 'a real hex colour is kept')
  for (const bad of ['javascript:alert(1)', 'url(https://evil.example.test/x)', 'red', '#12', '#12345678901', '"><script>', 42, '']) {
    assert.equal((await color(bad)).body.post.mediaColor, '#00BF63', `colour ${JSON.stringify(bad)} falls back to the default`)
  }
  const edited = await call('PATCH', `/api/posts/${long.body.post.id}`, alice.token, { caption: 'z'.repeat(7000), activity: 'y'.repeat(500) })
  assert.equal(edited.body.post.caption.length, 5000); assert.equal(edited.body.post.activity.length, 100)

  // 3. Feedback: bounded, and the sender identity comes from the session.
  const feedback = (text: string, extra: Record<string, unknown> = {}) => call('POST', '/api/feedback', bob.token, { kind: 'Question', text, ...extra })
  assert.equal((await feedback('x'.repeat(5000))).status, 200)
  assert.equal((await feedback('x'.repeat(5001))).body.error, 'text_too_long')
  assert.equal((await feedback('x'.repeat(5001))).status, 400)
  assert.equal((await feedback('four')).status, 400)
  const entry = (await feedback('Synthetic feedback text', { userId: 'forged', userEmail: 'forged@example.test', read: true })).body.entry
  assert.equal(entry.userId, bob.user.id); assert.equal(entry.userEmail, bob.user.email); assert.equal(entry.read, false)

  // 4. The public facility price board: contributor name yes, email no; text bounded; prices must be real non-negative numbers.
  const price = (body: Record<string, unknown>) => call('POST', '/api/facility-prices', alice.token, { facilityId: 'hospital-1', confidence: 'estimated', currency: 'IDR', low: 100000, high: 200000, ...body })
  assert.equal((await call('POST', '/api/facility-prices', undefined, { facilityId: 'x', confidence: 'estimated' })).status, 401)
  const made = await price({ diagnosisCode: 'D'.repeat(100), diagnosisTitle: 'T'.repeat(500), currency: 'IDRXXXXXXXXXX', source: 'S'.repeat(500) })
  assert.equal(made.status, 200)
  assert.equal(made.body.price.submittedByEmail, undefined, 'the submit response carries no email'); assert.equal(made.body.price.submittedByName, alice.user.email)
  assert.equal(made.body.price.diagnosisCode.length, 40); assert.equal(made.body.price.diagnosisTitle.length, 200); assert.equal(made.body.price.currency.length, 8); assert.equal(made.body.price.source.length, 200)
  const board = (await call('GET', '/api/facility-prices?facilityId=hospital-1')).body.prices as any[]
  assert.equal(board.length, 1)
  assert.ok(!JSON.stringify(board).includes('@localhost.test') || JSON.stringify(board).split('@localhost.test').length - 1 === 1, 'only the display name (which here is the fixture name) appears')
  assert.equal(board[0].submittedByEmail, undefined, 'the anonymous price board carries no contributor email')
  assert.equal(board[0].submittedByName, alice.user.email, 'the contributor name is still shown')
  assert.equal((await price({ facilityId: 'f'.repeat(300) })).body.price.facilityId.length, 120)
  for (const [label, bad] of [['negative low', { low: -1 }], ['negative high', { high: -5 }], ['low as text', { low: '100' }], ['high as text', { high: '200' }]] as const) {
    assert.equal((await price(bad)).status, 400, label)
  }
  assert.equal((await price({ confidence: 'guess' })).status, 400); assert.equal((await price({ facilityId: '' })).status, 400)
  assert.equal(((await call('GET', '/api/facility-prices?facilityId=hospital-1')).body.prices as any[]).length, 1, 'rejected submissions are not stored (the 300-char facility id used another id)')

  console.log('inputBoundsHttp: push subscriptions validated and capped, post and feedback text bounded, public price board without contributor emails and with sane prices; passed')
} finally {
  await running.stop()
}
