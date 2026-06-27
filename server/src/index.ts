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
  reactPost,
  deletePost,
  updatePost,
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
  allPushUserIds,
  findUserBySelfPatientId,
  getUserByEmail,
  addCreatorSub,
  activeCreatorSubs,
  addManualTopup,
  listManualTopups,
  setManualTopupStatus,
  addApplication,
  listApplications,
  setApplicationStatus,
  setApplicationVerdict,
  isEarlyAdopter,
  earlyAdopterInfo,
  listNotifications,
  markNotificationsRead,
  getStats,
  addAudit,
  getAudit,
  initStore,
  type User,
  type Post,
} from './store.js'
import { googleLogin, devLogin, currentUser, clearSession, requireAuth } from './auth.js'
import { otpStart, otpVerify, otpLive, emailOtpStart, emailOtpVerify, emailOtpLive } from './otp.js'
import { aiMessages, aiConsult, aiVision, aiOperator, reviewApplicationText, generateOperatorBriefing, aiConfigured, aiStatus } from './ai.js'
import { sendEmail } from './email.js'
import { sendPush, notify } from './push.js'
import { submitEmr } from './satusehat.js'
import { createPayment, confirmPayment, paymentWebhook, orderStatus } from './payments.js'
import { disburse, irisLive } from './iris.js'
import { attachRealtime } from './realtime.js'

const app = express()
app.use(express.json({ limit: '12mb' })) // allow base64 images for AI vision
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
    features: { google: features.googleLive, payments: features.paymentsLive, ai: features.aiLive, push: features.pushLive, email: features.emailLive, payout: features.payoutLive, otp: otpLive, otpEmail: emailOtpLive },
    vapidPublicKey: features.pushLive ? config.vapid.publicKey : null,
    tokenToIdr: config.tokenToIdr,
    aiConsultPnc: config.aiConsultPnc,
    midtransClientKey: features.paymentsLive ? config.midtrans.clientKey : null,
    googleClientId: features.googleLive ? config.googleClientId : null,
    promo: earlyAdopterInfo(),
  })
})

// Per-user promo status (am I one of the first 25? → 75% off everything).
app.get('/api/promo', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ ...earlyAdopterInfo(), eligible: isEarlyAdopter(u.id) })
})

// --- auth ---
app.post('/api/auth/google', googleLogin)
app.post('/api/auth/dev-login', devLogin)
app.post('/api/auth/otp/start', otpStart)
app.post('/api/auth/otp/verify', otpVerify)
app.post('/api/auth/otp/email/start', emailOtpStart)
app.post('/api/auth/otp/email/verify', emailOtpVerify)
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
app.post('/api/wallet/withdraw', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as { amountPnc?: number; bank?: string; accountNumber?: string; accountHolder?: string }
  const amount = Math.floor(Number(b.amountPnc) || 0)
  const bank = String(b.bank || '').trim()
  const accountNumber = String(b.accountNumber || '').replace(/\s/g, '')
  const accountHolder = String(b.accountHolder || '').trim()
  if (amount <= 0) return res.status(400).json({ error: 'bad_amount' })
  if (!bank || !accountNumber || !accountHolder) return res.status(400).json({ error: 'missing_account' })
  if (balance(u.id) < amount) return res.status(400).json({ error: 'insufficient_funds' })

  const amountIdr = amount * config.tokenToIdr
  // Try an automatic Iris bank disbursement; fall back to manual settlement.
  let payout
  try {
    payout = await disburse({ amountIdr, bank, accountNumber, accountHolder, email: u.email })
  } catch (e) {
    return res.status(502).json({ error: 'payout_failed', detail: (e as Error).message })
  }
  // Deduct only after the payout was accepted (or queued for manual handling).
  const noteBase = `Tarik Rp${amountIdr.toLocaleString('id-ID')} ke ${bank} ${accountNumber} a.n. ${accountHolder}`
  const note = payout.status === 'manual' ? `${noteBase} (manual)` : `${noteBase} · Iris ${payout.referenceNo ?? payout.status}`
  credit(u.id, -amount, 'withdraw', note)
  addAudit(u, 'wallet.withdraw', note)
  const body = payout.status === 'processed'
    ? `Rp${amountIdr.toLocaleString('id-ID')} sedang dikirim ke rekening ${bank} Anda.`
    : payout.status === 'queued'
    ? `Penarikan Rp${amountIdr.toLocaleString('id-ID')} dibuat & menunggu persetujuan.`
    : `Penarikan Rp${amountIdr.toLocaleString('id-ID')} diterima — diproses manual oleh tim.`
  notify(u.id, { title: 'Penarikan diproses', body, url: '/billing' }, 'notifTransactions').catch(() => {})
  // Notify the owner of every withdrawal so manual transfers (1×24 jam) can be
  // actioned — includes the requester's bank account details.
  const owner = getUserByEmail(config.ownerEmail)
  if (owner && owner.id !== u.id) {
    notify(
      owner.id,
      {
        title: '💸 Permintaan Penarikan PNC',
        body: `${u.name} menarik Rp${amountIdr.toLocaleString('id-ID')} → ${bank} ${accountNumber} a.n. ${accountHolder}. Proses manual maks 1×24 jam.`,
        url: '/billing',
      },
      'notifTransactions',
    ).catch(() => {})
  }
  res.json({ ok: true, balance: balance(u.id), payout })
})

// --- manual bank-transfer top-up (no Midtrans needed) ---
// User submits a request after transferring; the owner approves to credit PNC.
app.post('/api/wallet/topup-request', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const amount = Math.floor(Number((req.body as { amountPnc?: number }).amountPnc) || 0)
  if (amount <= 0) return res.status(400).json({ error: 'bad_amount' })
  const row = addManualTopup({ userId: u.id, email: u.email, name: u.name, amountPnc: amount, amountIdr: amount * config.tokenToIdr })
  addAudit(u, 'wallet.topup_request', `${amount} PNC (Rp${row.amountIdr.toLocaleString('id-ID')})`)
  res.json({ ok: true, request: row })
})
app.get('/api/wallet/topups', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ requests: listManualTopups() })
})
app.post('/api/wallet/topups/decide', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { id, approve } = req.body as { id?: string; approve?: boolean }
  const t = setManualTopupStatus(String(id || ''), approve ? 'approved' : 'rejected')
  if (!t) return res.status(404).json({ error: 'not_found_or_decided' })
  if (approve) {
    credit(t.userId, t.amountPnc, 'deposit', `Top-up manual disetujui (Rp${t.amountIdr.toLocaleString('id-ID')})`)
    notify(t.userId, { title: 'Top-up disetujui ✅', body: `Saldo Anda bertambah ${t.amountPnc} PNC.`, url: '/billing' }, 'notifTransactions').catch(() => {})
  } else {
    notify(t.userId, { title: 'Top-up ditolak', body: `Permintaan top-up ${t.amountPnc} PNC tidak disetujui. Hubungi admin bila ada pertanyaan.`, url: '/billing' }, 'notifTransactions').catch(() => {})
  }
  addAudit(u, approve ? 'wallet.topup_approve' : 'wallet.topup_reject', `${t.amountPnc} PNC · ${t.email}`)
  res.json({ ok: true, request: t, balance: balance(t.userId) })
})

// --- professional onboarding applications (doctor/writer/verifier) ---
app.post('/api/applications', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as Record<string, string>
  const app_ = addApplication({
    userId: u.id, email: u.email, name: u.name, role: u.role,
    str: b.str, gelar: b.gelar, keahlian: b.keahlian, universitas: b.universitas,
    tahunLulus: b.tahunLulus, spesialis: b.spesialis, subspesialis: b.subspesialis, pdfName: b.pdfName,
  })
  addAudit(u, 'application.submit', `${u.role} · ${u.email}`)
  const summary = `Pendaftar: ${u.name} (${u.email})\nPeran: ${u.role}\nSTR: ${b.str || '-'}\nGelar: ${b.gelar || '-'}\nKeahlian: ${b.keahlian || '-'}\nUniversitas: ${b.universitas || '-'} (lulus ${b.tahunLulus || '-'})\nSpesialis: ${b.spesialis || '-'}\nSubspesialis: ${b.subspesialis || '-'}\nDokumen: ${b.pdfName || 'tidak ada'}`
  // AI-Agent review (async) then store the verdict.
  reviewApplicationText(summary).then((verdict) => setApplicationVerdict(app_.id, verdict)).catch(() => {})
  // Email the owner so applications never get missed.
  sendEmail(
    config.ownerEmail,
    `Pendaftar baru (${u.role}): ${u.name}`,
    `<h2>Pendaftaran ${u.role}</h2><pre style="font-family:inherit;font-size:14px;white-space:pre-wrap">${summary}</pre><p>Tinjau & beri akses di panel Owner → Pendaftar.</p>`,
  ).catch(() => {})
  res.json({ ok: true, application: app_ })
})
app.get('/api/applications', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ applications: listApplications() })
})
app.post('/api/applications/decide', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { id, grant } = req.body as { id?: string; grant?: boolean }
  const a = setApplicationStatus(String(id || ''), grant ? 'granted' : 'rejected')
  if (!a) return res.status(404).json({ error: 'not_found' })
  notify(a.userId, grant
    ? { title: 'Akses disetujui ✅', body: `Pendaftaran ${a.role} Anda disetujui. Akses penuh aktif.`, url: './#/' }
    : { title: 'Pendaftaran ditinjau', body: `Pendaftaran ${a.role} Anda belum disetujui. Hubungi admin.`, url: './#/' },
  ).catch(() => {})
  addAudit(u, grant ? 'application.grant' : 'application.reject', `${a.role} · ${a.email}`)
  res.json({ ok: true, application: a })
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
// Delete a post (owner-only).
app.delete('/api/posts/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const ok = deletePost(req.params.id, u.email)
  if (!ok) return res.status(403).json({ error: 'forbidden' })
  res.json({ ok: true })
})
// Patch a post's caption/activity/flags (owner-only).
app.patch('/api/posts/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const p = updatePost(req.params.id, u.email, req.body as Partial<Post>)
  if (!p) return res.status(403).json({ error: 'forbidden' })
  res.json({ post: p })
})
// Toggle an emoji reaction (cross-user). Requires auth so we know who reacted.
app.post('/api/posts/:id/react', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const emoji = String((req.body as { emoji?: string }).emoji || '').slice(0, 8)
  if (!emoji) return res.status(400).json({ error: 'missing_emoji' })
  const p = reactPost(req.params.id, emoji, u.email)
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
  const actor = (req as express.Request & { user: User }).user
  saveRecord(patientId, record)
  addAudit(actor, 'emr.save', patientId)
  // Notify the patient (if they have a linked account) that their EMR is ready.
  const patientUser = findUserBySelfPatientId(patientId)
  if (patientUser && patientUser.id !== actor.id) {
    notify(patientUser.id, {
      title: 'Rekam medis Anda diperbarui 🩺',
      body: 'Dokter telah menyelesaikan catatan AI-EMR Anda. Buka untuk melihat edukasi & rencana.',
      url: './#/education',
    }, 'notifVitals').catch(() => {})
  }
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
app.post('/api/ai/consult', requireAuth, aiConsult)
app.post('/api/ai/vision', requireAuth, aiVision)
app.post('/api/ai/operator', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  return aiOperator(req, res)
})

// Daily AI briefing → emailed to the owner. Triggered by a scheduled GET with a
// secret key (e.g. a free Render Cron Job). No login needed; protected by token.
app.get('/api/cron/daily-briefing', async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (!secret || req.query.key !== secret) return res.status(403).json({ error: 'forbidden' })
  if (!aiConfigured()) return res.status(503).json({ error: 'ai_not_configured' })
  try {
    const { text, pending } = await generateOperatorBriefing()
    const html = `<h2>Briefing Harian Panaceamed.id</h2><p style="color:#869586">${new Date().toLocaleString('id-ID')} · ${pending.topups} top-up & ${pending.doctors} pendaftar menunggu</p><pre style="font-family:inherit;font-size:14px;white-space:pre-wrap;line-height:1.6">${text}</pre>`
    const sent = await sendEmail(config.ownerEmail, 'Briefing Harian — Panaceamed.id', html)
    res.json({ ok: true, emailed: sent })
  } catch (e) {
    res.status(502).json({ error: 'briefing_failed', detail: (e as Error).message })
  }
})

// --- targeted notification (verifier/admin/owner → a specific user) ---
app.post('/api/notify/user', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!['verifikator', 'admin', 'owner'].includes(u.role) && !isOwner(u)) {
    return res.status(403).json({ error: 'forbidden' })
  }
  const { email, title, body, url } = req.body as { email?: string; title?: string; body?: string; url?: string }
  if (!email || !body?.trim()) return res.status(400).json({ error: 'bad_request' })
  const target = getUserByEmail(email.toLowerCase())
  if (!target) return res.json({ ok: true, sent: 0, note: 'user_not_registered' })
  const sent = await notify(target.id, { title: title?.trim() || 'Panaceamed.id', body: body.trim(), url: url || './' })
  res.json({ ok: true, sent })
})

// --- creator subscriptions (exclusive content) with PNC revenue split ---
app.get('/api/creator/subs', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ authors: activeCreatorSubs(u.id), price: config.creatorSubPnc })
})
app.post('/api/creator/subscribe', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const authorEmail = String((req.body as { authorEmail?: string }).authorEmail || '').toLowerCase()
  if (!authorEmail) return res.status(400).json({ error: 'missing_author' })
  if (authorEmail === u.email.toLowerCase()) return res.status(400).json({ error: 'self_subscribe' })
  const price = config.creatorSubPnc
  const adminCut = Math.min(config.creatorSubAdminPnc, price)
  const authorCut = price - adminCut
  if (balance(u.id) < price) return res.status(402).json({ error: 'insufficient_balance', price, balance: balance(u.id) })

  const author = getUserByEmail(authorEmail)
  // Move PNC: subscriber pays, author gets 75, platform/owner gets 25.
  credit(u.id, -price, 'purchase', `Langganan kreator @${authorEmail}`)
  if (author) credit(author.id, authorCut, 'payout', `Royalti langganan dari ${u.email}`)
  const owner = getUserByEmail(config.ownerEmail)
  if (owner) credit(owner.id, adminCut, 'deposit', `Komisi platform langganan @${authorEmail}`)

  const expires = addCreatorSub(u.id, authorEmail)
  if (author) notify(author.id, { title: 'Subscriber baru 🎉', body: `Anda mendapat ${authorCut} PNC dari langganan kreator.`, url: './#/' }).catch(() => {})
  res.json({ ok: true, balance: balance(u.id), expires, authorCut, adminCut })
})

// --- in-app notification inbox ---
app.get('/api/notifications', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ notifications: listNotifications(u.id) })
})
app.post('/api/notifications/read', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  markNotificationsRead(u.id)
  res.json({ ok: true })
})

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
// Owner broadcast — push an announcement to all opted-in subscribers.
app.post('/api/push/broadcast', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { title, body, url } = req.body as { title?: string; body?: string; url?: string }
  if (!body?.trim()) return res.status(400).json({ error: 'empty' })
  const ids = allPushUserIds()
  let sent = 0
  for (const id of ids) {
    sent += await notify(id, { title: title?.trim() || 'Panaceamed.id', body: body.trim(), url: url || './', tag: 'broadcast' }, 'notifBroadcasts')
  }
  addAudit(u, 'push.broadcast', `${sent} terkirim`)
  res.json({ ok: true, sent, recipients: ids.length })
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

// --- owner stats dashboard ---
app.get('/api/stats', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json(getStats())
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

// --- SATUSEHAT: submit an EMR as a FHIR R4 Bundle (dokter/owner) ---
app.post('/api/satusehat/encounter', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (u.role !== 'dokter' && !isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { patient, record } = req.body as { patient?: unknown; record?: unknown }
  if (!patient || !record) return res.status(400).json({ error: 'missing_data' })
  try {
    const out = await submitEmr(patient, record, u.name)
    addAudit(u, 'satusehat.submit', (patient as { id?: string })?.id)
    res.json({ ok: true, ...out })
  } catch (e) {
    res.status(502).json({ error: 'satusehat_failed', detail: String(e) })
  }
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
  console.log(`  AI:           ${aiStatus()}`)
  console.log(`  Web Push:     ${features.pushLive ? 'LIVE (VAPID set)' : 'off (set VAPID_PUBLIC_KEY/PRIVATE_KEY)'}`)
  console.log(`  Email:        ${features.emailLive ? 'LIVE (Resend)' : 'off (set RESEND_API_KEY)'}`)
  console.log(`  Google login: ${features.googleLive ? 'LIVE' : 'mock (dev-login)'}`)
  console.log(`  Payments:     ${features.paymentsLive ? 'LIVE (Midtrans)' : 'mock'}`)
  console.log(`  Payout (Iris):${irisLive ? ' LIVE' : ' off (set IRIS_API_KEY for auto-disbursement)'}`)
  console.log(`  OTP SMS:      ${otpLive ? 'LIVE (Twilio Verify)' : 'off (set TWILIO_ACCOUNT_SID/AUTH_TOKEN/VERIFY_SERVICE_SID)'}`)
})
