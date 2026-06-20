import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config, features } from './config.js'
import {
  balance,
  txsFor,
  credit,
  listPosts,
  addPost,
  likePost,
  uid,
  getClinical,
  saveRecord,
  saveEducation,
  addVital,
  addSupportive,
  addPatient,
  getSettings,
  saveSettings,
  listDoctors,
  addPushSub,
  removePushSub,
  addAudit,
  getAudit,
  initStore,
  type User,
  type Post,
} from './store.js'
import { googleLogin, devLogin, currentUser, clearSession, requireAuth } from './auth.js'
import { aiMessages } from './ai.js'
import { sendPush } from './push.js'
import { createPayment, confirmPayment, paymentWebhook, orderStatus } from './payments.js'
import { attachRealtime } from './realtime.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
      cb(null, false)
    },
    credentials: true,
  }),
)

// --- health / capability discovery ---
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    features: { google: features.googleLive, payments: features.paymentsLive, ai: features.aiLive, push: features.pushLive },
    vapidPublicKey: features.pushLive ? config.vapid.publicKey : null,
    tokenToIdr: config.tokenToIdr,
    midtransClientKey: features.paymentsLive ? config.midtrans.clientKey : null,
    googleClientId: features.googleLive ? config.googleClientId : null,
  })
})

// --- auth ---
app.post('/api/auth/google', googleLogin)
app.post('/api/auth/dev-login', devLogin)
app.get('/api/auth/me', (req, res) => {
  const u = currentUser(req)
  if (!u) return res.status(401).json({ error: 'unauthorized' })
  res.json({ user: u })
})
app.post('/api/auth/logout', (_req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

// --- wallet ---
app.get('/api/wallet', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ balance: balance(u.id), transactions: txsFor(u.id), tokenToIdr: config.tokenToIdr })
})
app.post('/api/wallet/withdraw', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const amount = Math.floor(Number((req.body as { amountPnc?: number }).amountPnc) || 0)
  const bank = String((req.body as { bank?: string }).bank || 'BCA')
  if (amount <= 0) return res.status(400).json({ error: 'bad_amount' })
  if (balance(u.id) < amount) return res.status(400).json({ error: 'insufficient_funds' })
  credit(u.id, -amount, 'withdraw', `Tarik dana ke ${bank}`)
  res.json({ ok: true, balance: balance(u.id) })
})

// --- payments ---
app.post('/api/payments/create', requireAuth, createPayment)
app.post('/api/payments/confirm', requireAuth, confirmPayment)
app.post('/api/payments/webhook', paymentWebhook)
app.get('/api/payments/status/:orderId', orderStatus)

// --- social posts (persisted) ---
app.get('/api/posts', (_req, res) => res.json({ posts: listPosts() }))
app.post('/api/posts', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as Partial<Post>
  const p: Post = {
    id: uid(),
    authorEmail: u.email,
    authorName: u.name,
    role: u.role,
    kind: b.kind === 'video' ? 'video' : 'image',
    activity: String(b.activity || 'Aktivitas'),
    caption: String(b.caption || ''),
    mediaColor: String(b.mediaColor || '#00BF63'),
    durationSec: b.kind === 'video' ? 15 : undefined,
    likes: 0,
    at: new Date().toISOString(),
  }
  addPost(p)
  res.json({ post: p })
})
app.post('/api/posts/:id/like', (req, res) => {
  const p = likePost(req.params.id)
  if (!p) return res.status(404).json({ error: 'not_found' })
  res.json({ post: p })
})

// --- clinical (patients + EMR + vitals/supportive + education) ---
app.get('/api/clinical', requireAuth, (req, res) => {
  addAudit((req as express.Request & { user: User }).user, 'clinical.read')
  res.json(getClinical())
})
app.post('/api/clinical/record', requireAuth, (req, res) => {
  const { patientId, record } = req.body as { patientId?: string; record?: unknown }
  if (!patientId) return res.status(400).json({ error: 'missing_patientId' })
  saveRecord(patientId, record)
  addAudit((req as express.Request & { user: User }).user, 'emr.save', patientId)
  res.json({ ok: true })
})
app.post('/api/clinical/education', requireAuth, (req, res) => {
  const { patientId, sheet } = req.body as { patientId?: string; sheet?: unknown }
  if (!patientId) return res.status(400).json({ error: 'missing_patientId' })
  saveEducation(patientId, sheet)
  res.json({ ok: true })
})
app.post('/api/clinical/vital', requireAuth, (req, res) => {
  const { patientId, vital } = req.body as { patientId?: string; vital?: unknown }
  if (!patientId) return res.status(400).json({ error: 'missing_patientId' })
  addVital(patientId, vital)
  res.json({ ok: true })
})
app.post('/api/clinical/supportive', requireAuth, (req, res) => {
  const { patientId, result } = req.body as { patientId?: string; result?: unknown }
  if (!patientId) return res.status(400).json({ error: 'missing_patientId' })
  addSupportive(patientId, result)
  res.json({ ok: true })
})
app.post('/api/clinical/patient', requireAuth, (req, res) => {
  const { patient } = req.body as { patient?: unknown }
  if (!patient) return res.status(400).json({ error: 'missing_patient' })
  addPatient(patient)
  res.json({ ok: true })
})

// --- user settings / preferences (cross-device sync; no secrets) ---
app.get('/api/settings', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ settings: getSettings(u.id) })
})
app.put('/api/settings', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const prefs = (req.body as { settings?: Record<string, unknown> }).settings ?? {}
  // Defensive: never persist the Anthropic API key server-side.
  const { apiKey: _drop, ...safe } = prefs as Record<string, unknown>
  saveSettings(u.id, safe)
  res.json({ ok: true, settings: getSettings(u.id) })
})

// --- AI (server-side Claude proxy) ---
app.post('/api/ai/messages', requireAuth, aiMessages)

// --- Web Push notifications ---
app.get('/api/push/key', (_req, res) => res.json({ key: features.pushLive ? config.vapid.publicKey : null }))
app.post('/api/push/subscribe', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const sub = (req.body as { subscription?: unknown }).subscription
  if (!sub || typeof sub !== 'object') return res.status(400).json({ error: 'bad_subscription' })
  addPushSub(u.id, sub)
  res.json({ ok: true })
})
app.post('/api/push/unsubscribe', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const endpoint = (req.body as { endpoint?: string }).endpoint
  if (endpoint) removePushSub(u.id, endpoint)
  res.json({ ok: true })
})
app.post('/api/push/test', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const sent = await sendPush(u.id, { title: 'Panaceamed.id', body: 'Notifikasi berhasil diaktifkan ✅', url: './' })
  res.json({ ok: true, sent })
})

// Owner gate — by configured owner email OR an explicit owner role.
function isOwner(u: User): boolean {
  return u.email.toLowerCase() === config.ownerEmail || u.role === 'owner'
}

// --- audit log (Permenkes 24/2022) — owner-only access ---
app.get('/api/audit', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ entries: getAudit(300) })
})

// --- doctor STR verification (owner-only) ---
app.get('/api/doctors', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ doctors: listDoctors() })
})
app.post('/api/doctors/:id/verify', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const id = req.params.id
  const status = (req.body as { status?: string }).status === 'pending' ? 'pending' : 'verified'
  saveSettings(id, { strStatus: status })
  addAudit(u, 'str.verify', id)
  res.json({ ok: true })
})

// --- SATUSEHAT interoperability (Kemenkes) — integration skeleton ---
app.get('/api/satusehat/status', requireAuth, (_req, res) => {
  const configured = Boolean(process.env.SATUSEHAT_CLIENT_ID && process.env.SATUSEHAT_CLIENT_SECRET)
  res.json({ configured, env: process.env.SATUSEHAT_ENV || 'sandbox', note: configured ? 'Kredensial terdeteksi — siap integrasi.' : 'Belum dikonfigurasi (set SATUSEHAT_CLIENT_ID/SECRET).' })
})

const server = createServer(app)
attachRealtime(server)
await initStore()
server.listen(config.port, () => {
  console.log(`Panaceamed backend on http://localhost:${config.port}`)
  console.log(`  AI (Claude):  ${features.aiLive ? 'LIVE (server key)' : 'off (clients use own key / demo)'}`)
  console.log(`  Web Push:     ${features.pushLive ? 'LIVE (VAPID set)' : 'off (set VAPID_PUBLIC_KEY/PRIVATE_KEY)'}`)
  console.log(`  Google login: ${features.googleLive ? 'LIVE' : 'mock (dev-login)'}`)
  console.log(`  Payments:     ${features.paymentsLive ? 'LIVE (Midtrans)' : 'mock'}`)
})
