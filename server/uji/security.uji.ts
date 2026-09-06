import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import { WebSocket } from 'ws'

// Pisahkan data uji dan matikan integrasi berbayar sebelum memuat aplikasi.
const dir = await mkdtemp(join(tmpdir(), 'panacea-security-'))
process.env.NODE_ENV = 'test'
process.env.PANACEA_DATA_FILE = join(dir, 'data.json')
process.env.JWT_SECRET = 'test-only-secret-not-for-production-123456789'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.DOTENV_CONFIG_PATH = join(dir, 'absent.env')
for (const key of ['ALLOW_DEV_LOGIN', 'ALLOW_MOCK_PAYMENTS', 'MONGODB_URI', 'RESEND_API_KEY', 'MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'IRIS_API_KEY', 'IRIS_CREATOR_KEY']) process.env[key] = ''
const { app } = await import('../src/index.js')
const store = await import('../src/store.js')
const { config, features } = await import('../src/config.js')
const { setSession } = await import('../src/auth.js')
const { safeJson, validPushSubscription } = await import('../src/security.js')
const { attachRealtime } = await import('../src/realtime.js')
const alice = store.upsertUser('alice@example.test', 'Alice Security', 'pasien')
const bob = store.upsertUser('bob@example.test', 'Bob Security', 'pasien')
const doctor = store.upsertUser('doctor@example.test', 'Doctor Security', 'dokter')
const token = (id: string) => setSession({ cookie() {} } as unknown as Response, id)
const http = createServer(app)
const wss = attachRealtime(http)
http.listen(0, '127.0.0.1')
await once(http, 'listening')
const address = http.address() as { port: number }
const base = `http://127.0.0.1:${address.port}`
const request = (path: string, user = alice, body?: unknown, headers: Record<string, string> = {}) => fetch(base + path, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { Authorization: `Bearer ${token(user.id)}`, 'Content-Type': 'application/json', ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
})
after(async () => {
  for (const ws of wss.clients) ws.terminate()
  await new Promise<void>(resolve => wss.close(() => resolve()))
  await new Promise<void>(resolve => http.close(() => resolve()))
  await rm(dir, { recursive: true, force: true })
})

test('registration cannot grant elevated roles or overwrite an existing role', () => {
  assert.equal(store.upsertUser('attacker@example.test', 'Attacker', 'owner').role, 'pasien')
  assert.equal(store.upsertUser(alice.email, alice.name, 'owner').role, 'pasien')
})

test('development login and unconfigured payments fail closed', async () => {
  assert.equal((await request('/api/auth/dev-login', alice, { email: 'new@example.test' })).status, 404)
  assert.equal((await request('/api/payments/create', alice, { amountPnc: 10 })).status, 503)
  assert.equal((await request('/api/payments/confirm', alice, { orderId: 'fake' })).status, 404)
  assert.equal((await request('/api/payments/webhook', alice, {})).status, 503)
})

test('forged tokens, cross-origin mutations and dangerous JSON are rejected', async () => {
  const forged = jwt.sign({ uid: alice.id, sv: 0 }, 'dev-insecure-secret')
  assert.equal((await request('/api/clinical', alice, undefined, { Authorization: `Bearer ${forged}` })).status, 401)
  assert.equal((await request('/api/wallet/topup-request', alice, { amountPnc: 10 }, { Origin: 'https://untrusted.example' })).status, 403)
  assert.equal((await request('/api/wallet/topup-request', alice, JSON.parse('{"__proto__":{"polluted":true}}'))).status, 400)
  assert.equal(safeJson({ value: Infinity }), false)
  assert.equal(safeJson(JSON.parse('{"constructor":{}}')), false)
})

test('cookie mutations require a trusted origin', async () => {
  const response = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: `pmd_session=${token(alice.id)}` } })
  assert.equal(response.status, 403)
})

test('clinical data is scoped to the patient and explicitly authorized verified clinicians', async () => {
  const id = `self-${alice.id}`
  assert.equal((await request('/api/clinical/patient', alice, { patient: { id, name: 'Test Patient', sex: 'P' } })).status, 200)
  assert.equal((await request('/api/clinical/vital', alice, { patientId: id, vital: { hr: 70 } })).status, 200)
  assert.deepEqual((await (await request('/api/clinical', bob)).json()).patients, [])
  assert.equal((await request('/api/clinical/vital', bob, { patientId: id, vital: { hr: 80 } })).status, 403)
  assert.equal((await request('/api/clinical/record', alice, { patientId: id, record: { assessment: 'test' } })).status, 403)
  assert.equal((await request('/api/clinical/access', alice, { patientId: id, practitionerId: doctor.id })).status, 403)
  store.saveSettings(doctor.id, { strStatus: 'verified' })
  assert.equal((await request('/api/clinical/record', doctor, { patientId: id, record: {} })).status, 403)
  assert.equal((await request('/api/clinical/access', alice, { patientId: id, practitionerId: doctor.id })).status, 200)
  assert.equal((await request('/api/clinical/record', doctor, { patientId: id, record: { assessment: 'test' } })).status, 200)
  assert.equal(store.findUserBySelfPatientId(id)?.id, alice.id)
  assert.equal((await request('/api/clinical/access', alice, { patientId: id, practitionerId: doctor.id, action: 'revoke' })).status, 200)
  assert.deepEqual((await (await request('/api/clinical', doctor)).json()).patients, [])
})

test('legacy records remain inaccessible until identity mapping is reviewed', async () => {
  store.addPatient({ id: 'legacy-unmapped', name: 'Legacy Test', sex: 'L' })
  const data = await (await request('/api/clinical')).json()
  assert.equal(data.patients.some((p: { id: string }) => p.id === 'legacy-unmapped'), false)
})

test('push subscriptions cannot target internal services', () => {
  const keys = { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) }
  assert.equal(validPushSubscription({ endpoint: 'http://127.0.0.1/admin', keys }), false)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com.evil.test/push', keys }), false)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys }), true)
})

test('wallet topups reject coercion, fractional amounts and excessive values', async () => {
  for (const amountPnc of ['100', 0, -1, 1.5, 1000001]) assert.equal((await request('/api/wallet/topup-request', alice, { amountPnc })).status, 400)
})

test('payment ownership, signed amounts and replay protection', async () => {
  config.midtrans.serverKey = 'test-only-midtrans-secret'
  features.paymentsLive = true
  store.createOrder({ id: 'security-order', userId: alice.id, amountPnc: 10, amountIdr: 10000, method: 'QRIS', status: 'pending', createdAt: new Date().toISOString() })
  const startingBalance = store.balance(alice.id)
  assert.equal((await request('/api/payments/status/security-order', bob)).status, 404)
  const send = (amount: string, status: string, validSignature = true) => {
    const signature = createHash('sha512').update('security-order200' + amount + config.midtrans.serverKey).digest('hex')
    return request('/api/payments/webhook', alice, { order_id: 'security-order', status_code: '200', gross_amount: amount, transaction_status: status, signature_key: validSignature ? signature : '0'.repeat(128) })
  }
  assert.equal((await send('10000', 'settlement', false)).status, 403)
  assert.equal((await send('1', 'settlement')).status, 400)
  assert.equal((await send('10000', 'settlement')).status, 200)
  await send('10000', 'cancel')
  await send('10000', 'settlement')
  assert.equal(store.balance(alice.id), startingBalance + 10)
  assert.equal(store.getOrder('security-order')?.status, 'paid')
  features.paymentsLive = false
})

test('logout invalidates previously issued tokens', async () => {
  const oldToken = token(bob.id)
  assert.equal((await request('/api/auth/logout', bob, {})).status, 200)
  assert.equal((await request('/api/clinical', bob, undefined, { Authorization: `Bearer ${oldToken}` })).status, 401)
})

test('unauthenticated websocket rooms are rejected', async () => {
  const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws')
  await once(ws, 'open')
  const closed = once(ws, 'close')
  ws.send(JSON.stringify({ type: 'join', room: 'guessed', from: alice.name }))
  assert.equal((await closed)[0], 1008)
})

test('chat derives sender identity and stops sending to revoked sessions', { timeout: 10000 }, async () => {
  const connect = async (user: typeof alice, peer: typeof alice) => {
    const ticket = await (await request('/api/realtime/ticket', user, { peerName: peer.name })).json()
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws')
    await once(ws, 'open')
    const joined = once(ws, 'message')
    ws.send(JSON.stringify({ type: 'auth', ticket: ticket.ticket }))
    await joined
    return ws
  }
  const a = await connect(alice, bob)
  const b = await connect(bob, alice)
  const received = once(b, 'message')
  a.send(JSON.stringify({ type: 'msg', text: 'hello', from: 'Spoofed', room: 'forged' }))
  const message = JSON.parse((await received)[0].toString())
  assert.equal(message.from, alice.name)
  assert.equal(message.text, 'hello')
  store.revokeSessions(bob.id)
  const closed = once(b, 'close')
  a.send(JSON.stringify({ type: 'msg', text: 'must not arrive' }))
  assert.equal((await closed)[0], 1008)
  a.close()
})
