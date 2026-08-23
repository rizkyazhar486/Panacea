import { createServer } from 'node:http'
import {
  ringkasanSaya, ajukanVerifikasi, setelRadius, blokir, bukaBlokir, laporkan,
  profilPublik, bolehDilihat, ajuanMenunggu, laporanMenunggu, putuskanVerifikasi,
  putuskanLaporan, kurangiKredit, pulihkanKredit, jatuhTempoHapus, hapusAkunConnect, dek,
  tarikPersetujuan,
} from './connect.js'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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
  listMeets,
  addMeet,
  rsvpMeet,
  deleteMeet,
  listClubs,
  addClub,
  toggleClubMember,
  deleteClub,
  addSecondOpinion,
  listSecondOpinionsForPatient,
  listPendingSecondOpinions,
  completeSecondOpinion,
  uid,
  getClinical,
  saveRecord,
  saveEducation,
  addVital,
  addSupportive,
  addPatient,
  getSettings,
  saveSettings,
  getHealthProfile,
  saveHealthProfile,
  recordDeviceHealthSync,
  getHealthWebhookToken,
  rotateHealthWebhookToken,
  emailForWebhookToken,
  cariOrang,
  getSportsFavorites,
  setSportsFavorites,
  allSportsFavorites,
  listDoctors,
  addPushSub,
  removePushSub,
  listPushSubs,
  allPushUserIds,
  listReminders,
  addReminder,
  updateReminder,
  removeReminder,
  allReminders,
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
  isClinicalCalcFree,
  clinicalCalcInfo,
  CLINICAL_CALC_PRICE_PNC,
  userDirectory,
  addFeedback,
  listFeedback,
  markFeedbackRead,
  type Feedback,
  listNotifications,
  markNotificationsRead,
  getStats,
  addAudit,
  getAudit,
  initStore,
  type User,
  type Post,
  type Meet,
  type Club,
  type SecondOpinion,
  appendHrSamples, getHrSamples, appendSleepSessions, getSleepSessions, clearHealthSeries, allUsersForAlerts, stripServerOwnedSettings,
  appendWorkouts,
  getWorkouts,
  appendHrNotifications,
  getHrNotifications,
  recordWebhookDelivery,
  getWebhookDeliveries,
  diagnoseSync,
} from './store.js'
import { googleLogin, devLogin, currentUser, clearSession, requireAuth } from './auth.js'
import { emailOtpStart, emailOtpVerify, emailOtpLive } from './otp.js'
import { putusanPengingat } from './jadwal.js'
import { aiMessages, aiConsult, aiVision, aiOperator, reviewApplicationText, draftSecondOpinion, generateOperatorBriefing, aiConfigured, aiStatus } from './ai.js'
import { sendEmail } from './email.js'
import { sendPush, notify } from './push.js'
import { submitEmr } from './satusehat.js'
import { createPayment, confirmPayment, paymentWebhook, orderStatus } from './payments.js'
import { disburse, irisLive } from './iris.js'
import { KATALOG, KATEGORI } from './healthMetrics.js'
import { parseHealthWebhookPayload, extractHeartRateSeries, extractSleepSessions, newestSampleDate } from './healthWebhook.js'
import { checkHrZoneAlert, checkBedtimeReminder, checkWorkoutReminder, suggestedBedtime, ZONES } from './healthAlerts.js'
import { fetchLeagueScoreboard, fetchF1Info, fetchMotoGpInfo, LEAGUES, UNAVAILABLE } from './sports.js'
import { checkPrayerReminder } from './salat.js'
import { lingkunganKota } from './lingkungan.js'
import { searchPubmed } from './pubmed.js'
import { fetchQuote, fetchQuotes, searchSymbols, INSTRUMENTS, UNGGULAN, WATCHLIST_MAX, RANGES, isValidSymbol, type Range } from './markets.js'
import { searchTrials } from './trials.js'
import { lookupDrug } from './openfda.js'
import { lookupGene } from './mygene.js'
import { findRelatedDrugs } from './rxnorm.js'
import { attachRealtime } from './realtime.js'

const app = express()
// Security headers (CSP disabled here — the SPA is served from GitHub Pages,
// not this API host, so a strict API-side CSP would only add risk of breaking
// JSON clients without protecting the frontend).
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.set('trust proxy', 1) // behind Render's proxy — needed for correct client IPs in rate limiting

// Webhook kesehatan: satu-satunya pintu masuk data yang tidak butuh login, jadi
// dijaga LEBIH DULU daripada parser JSON global.
//
// Sebelum ini, siapa pun yang menembak /api/health-webhook/<tebakan> tetap
// membuat server membaca dan mem-parsing seluruh badan permintaan sampai 12 MB
// sebelum akhirnya menjawab 404 — terukur 267 ms untuk 5,6 MB, berbanding 6 ms
// untuk badan kecil. Dengan batas global 300 permintaan/menit, satu alamat bisa
// memaksa server mem-parsing lebih dari satu gigabita JSON per menit tanpa
// pernah memegang token yang sah.
//
// Dua lapis, berurutan:
//   1. Token diperiksa lebih dulu. Token tak dikenal ditolak tanpa satu bita pun
//      badan permintaan dibaca.
//   2. Batas badan sendiri (5 MB), jauh di bawah 12 MB yang memang diperlukan
//      jalur lain untuk gambar base64. Ekspor harian Health Auto Export jauh di
//      bawah angka ini; 12 MB hanya membuka ruang penyalahgunaan.
const webhookLimiter = rateLimit({
  windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'rate_limited' },
})
app.use('/api/health-webhook/:token', webhookLimiter, (req, res, next) => {
  const t = req.params.token
  if (!t || !emailForWebhookToken(t)) {
    res.status(404).json({ error: 'unknown_token' })
    return
  }
  next()
})
app.use('/api/health-webhook', express.json({ limit: '5mb' }))

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

// --- Rate limiting (prepares the server for many users / abuse resistance) ---
// A generous global cap on every API route, plus a much tighter cap on the
// auth & OTP surface to blunt brute-force and OTP-spam. Health check is exempt
// so uptime monitors don't get throttled.
const globalLimiter = rateLimit({
  windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { error: 'rate_limited' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'rate_limited' },
})
app.use('/api', globalLimiter)
app.use(['/api/auth', '/api/login', '/api/dev-login'], authLimiter)

// --- health / capability discovery ---
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    features: { google: features.googleLive, payments: features.paymentsLive, ai: features.aiLive, push: features.pushLive, email: features.emailLive, payout: features.payoutLive, otpEmail: emailOtpLive },
    /*
     * KEMAMPUAN SERVER, supaya aplikasi dapat membedakan SERVER YANG BELUM
     * DIPERBARUI dari kegagalan yang sesungguhnya.
     *
     * Perbaikan Clinical Evidence berada di server: permintaan ber-json harus
     * diarahkan ke model penalaran dan dijawab sebagai objek, dan batas token
     * dinaikkan supaya jawabannya tidak terpotong di tengah. Selama server yang
     * terpasang masih versi lama, aplikasi hanya melihat teks yang tidak dapat
     * diurai dan menampilkan 'format tidak terduga' — pesan yang tidak
     * memberitahu apa pun kepada pemakainya, dan membuat orang menyangka
     * fiturnya rusak padahal servernya saja yang belum dipasang ulang.
     *
     * Penanda di bawah dibaca aplikasi: bila tidak ada, penyebabnya disebutkan
     * apa adanya beserta apa yang harus dikerjakan.
     */
    kemampuan: { evidenceJson: true },
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

// Clinical Calculators paywall: free for the first 50 registered accounts,
// then a one-time unlock via PNC balance or a direct Rp500.000 charge.
app.get('/api/clinical-calculators/access', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const free = isClinicalCalcFree(u.id)
  const unlocked = free || !!getSettings(u.id).clinicalCalcUnlocked
  res.json({ unlocked, free, ...clinicalCalcInfo() })
})
app.post('/api/clinical-calculators/unlock-pnc', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (isClinicalCalcFree(u.id) || getSettings(u.id).clinicalCalcUnlocked) {
    return res.json({ ok: true, unlocked: true, balance: balance(u.id) })
  }
  if (balance(u.id) < CLINICAL_CALC_PRICE_PNC) {
    return res.status(402).json({ error: 'insufficient_balance', price: CLINICAL_CALC_PRICE_PNC, balance: balance(u.id) })
  }
  credit(u.id, -CLINICAL_CALC_PRICE_PNC, 'purchase', 'Buka akses Kalkulator Klinis (500 PNC)')
  saveSettings(u.id, { clinicalCalcUnlocked: true })
  res.json({ ok: true, unlocked: true, balance: balance(u.id) })
})

// --- auth ---
app.post('/api/auth/google', googleLogin)
app.post('/api/auth/dev-login', devLogin)
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
    notify(t.userId, { title: 'Top-up approved ✅', body: `${t.amountPnc} PNC added to your balance.`, url: '/billing' }, 'notifTransactions').catch(() => {})
  } else {
    notify(t.userId, { title: 'Top-up declined', body: `Your ${t.amountPnc} PNC top-up was not approved. Contact an admin if you have questions.`, url: '/billing' }, 'notifTransactions').catch(() => {})
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
    ? { title: 'Access approved ✅', body: `Your ${a.role} registration was approved. Full access is now active.`, url: './#/' }
    : { title: 'Registration reviewed', body: `Your ${a.role} registration was not approved. Please contact an admin.`, url: './#/' },
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

// --- Club Hub meets (real, user-created — join counts are actual RSVPs) ---
app.get('/api/meets', (_req, res) => res.json({ meets: listMeets() }))
app.post('/api/meets', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as Partial<Meet>
  if (!b.title || !b.venue || !b.time) return res.status(400).json({ error: 'missing_fields' })
  const m: Meet = {
    id: uid(),
    title: String(b.title).slice(0, 120),
    club: String(b.club || u.name).slice(0, 80),
    tag: String(b.tag || 'Social').slice(0, 40),
    venue: String(b.venue).slice(0, 120),
    address: String(b.address || '').slice(0, 200),
    day: Math.min(Math.max(Number(b.day) || 0, 0), 6),
    time: String(b.time).slice(0, 5),
    durH: Math.min(Math.max(Number(b.durH) || 1, 0.5), 6),
    cap: Math.min(Math.max(Number(b.cap) || 10, 2), 200),
    feeRp: Math.max(Number(b.feeRp) || 0, 0),
    notes: Array.isArray(b.notes) ? b.notes.slice(0, 5).map((n) => String(n).slice(0, 200)) : [],
    lat: Number(b.lat) || 0,
    lng: Number(b.lng) || 0,
    emoji: String(b.emoji || '🏃').slice(0, 4),
    hostEmail: u.email,
    hostName: u.name,
    participants: [u.email],
    maybes: [],
    createdAt: new Date().toISOString(),
  }
  addMeet(m)
  res.json({ meet: m })
})
app.post('/api/meets/:id/rsvp', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const status = (req.body as { status?: string }).status
  if (status !== 'joined' && status !== 'maybe' && status !== 'none') return res.status(400).json({ error: 'invalid_status' })
  const { meet, full } = rsvpMeet(req.params.id, u.email, status)
  if (!meet) return res.status(404).json({ error: 'not_found' })
  if (full) return res.status(409).json({ error: 'full', meet })
  res.json({ meet })
})
app.delete('/api/meets/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const ok = deleteMeet(req.params.id, u.email)
  if (!ok) return res.status(403).json({ error: 'forbidden' })
  res.json({ ok: true })
})

// --- Club Hub clubs (real, user-created — member counts are actual joins) ---
app.get('/api/clubs', (_req, res) => res.json({ clubs: listClubs() }))
app.post('/api/clubs', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as Partial<Club>
  if (!b.name || !b.sport) return res.status(400).json({ error: 'missing_fields' })
  const c: Club = {
    id: uid(),
    name: String(b.name).slice(0, 80),
    emoji: String(b.emoji || '🏃').slice(0, 4),
    sport: String(b.sport).slice(0, 40),
    level: String(b.level || 'All levels').slice(0, 40),
    desc: String(b.desc || '').slice(0, 300),
    hostEmail: u.email,
    hostName: u.name,
    members: [u.email],
    createdAt: new Date().toISOString(),
  }
  addClub(c)
  res.json({ club: c })
})
app.post('/api/clubs/:id/join', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const c = toggleClubMember(req.params.id, u.email)
  if (!c) return res.status(404).json({ error: 'not_found' })
  res.json({ club: c })
})
app.delete('/api/clubs/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const ok = deleteClub(req.params.id, u.email)
  if (!ok) return res.status(403).json({ error: 'forbidden' })
  res.json({ ok: true })
})

// --- Second opinion (AI drafts a private analysis for a doctor to review;
// the patient only ever sees the doctor's finalized opinion) ---
app.post('/api/second-opinion', requireAuth, async (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const b = req.body as Partial<SecondOpinion>
  if (!b.currentDiagnosis && !b.symptoms) return res.status(400).json({ error: 'missing_fields' })
  const currentDiagnosis = String(b.currentDiagnosis || '').slice(0, 1000)
  const currentTreatment = String(b.currentTreatment || '').slice(0, 1000)
  const symptoms = String(b.symptoms || '').slice(0, 1000)
  const history = String(b.history || '').slice(0, 1000)
  const caseInfo = `Diagnosis/pengobatan saat ini: ${currentDiagnosis || '(tidak diisi)'}\nPengobatan saat ini: ${currentTreatment || '(tidak diisi)'}\nGejala: ${symptoms || '(tidak diisi)'}\nRiwayat relevan: ${history || '(tidak diisi)'}`
  const aiDraft = await draftSecondOpinion(caseInfo)
  const s: SecondOpinion = {
    id: uid(),
    patientEmail: u.email,
    patientName: u.name,
    currentDiagnosis, currentTreatment, symptoms, history,
    status: 'pending_doctor',
    aiDraft,
    createdAt: new Date().toISOString(),
  }
  addSecondOpinion(s)
  addAudit(u, 'second_opinion.submit')
  // Patient never receives aiDraft — only the doctor's eventual finalOpinion.
  res.json({ request: { ...s, aiDraft: undefined } })
})
app.get('/api/second-opinion', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (u.role === 'dokter' || u.role === 'owner') {
    return res.json({ requests: listPendingSecondOpinions() })
  }
  const mine = listSecondOpinionsForPatient(u.email).map((s) => ({ ...s, aiDraft: undefined }))
  res.json({ requests: mine })
})
app.post('/api/second-opinion/:id/complete', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (u.role !== 'dokter' && u.role !== 'owner') return res.status(403).json({ error: 'forbidden' })
  const finalOpinion = String((req.body as { finalOpinion?: string }).finalOpinion || '').slice(0, 4000)
  if (!finalOpinion.trim()) return res.status(400).json({ error: 'missing_opinion' })
  const s = completeSecondOpinion(req.params.id, { email: u.email, name: u.name }, finalOpinion)
  if (!s) return res.status(404).json({ error: 'not_found_or_already_completed' })
  addAudit(u, 'second_opinion.complete')
  res.json({ request: s })
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
      title: 'Your medical record was updated 🩺',
      body: 'Your doctor has completed your AI-EMR note. Open it to see the education and the plan.',
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
  const { apiKey: _drop, ...rest } = prefs as Record<string, unknown>
  // Entitlements and alert-cooldown stamps live in this same blob, so an
  // unfiltered write let a user grant themselves paid features and verified
  // status. Only the server may set those.
  const { safe, rejected } = stripServerOwnedSettings(rest)
  if (rejected.length) {
    console.warn(`[settings] ${u.email} attempted to write server-owned keys: ${rejected.join(', ')}`)
  }
  try {
    saveSettings(u.id, safe)
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
    return
  }
  res.json({ ok: true, settings: getSettings(u.id), rejected })
})

// Per-user health profile (manual / WHOOP / Apple Watch / other). Stored by
// email so it follows the user across devices.
app.get('/api/health-profile', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ profile: getHealthProfile(u.email) })
})
app.put('/api/health-profile', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const data = (req.body as { profile?: Record<string, unknown> }).profile ?? {}
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    res.status(400).json({ error: 'invalid health profile payload' })
    return
  }
  try {
    res.json({ ok: true, profile: saveHealthProfile(u.email, data as Record<string, unknown>) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

// Per-user webhook token + endpoint for automatic Apple Health sync via the
// "Health Auto Export" app (HealthyApps). The app POSTs its own JSON export to
// the URL below on a schedule; the opaque token in the path IS the auth (no
// login/cookie possible from a background phone automation).
app.get('/api/health-profile/webhook-token', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ token: getHealthWebhookToken(u.email) })
})
app.post('/api/health-profile/webhook-token/rotate', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ token: rotateHealthWebhookToken(u.email) })
})
// Reuses the global express.json() limit (12mb, set at app.use above) — plenty
// for an incremental daily export of a handful of metrics.
app.post('/api/health-webhook/:token', (req, res) => {
  const email = emailForWebhookToken(req.params.token)
  if (!email) {
    res.status(404).json({ error: 'unknown_token' })
    return
  }
  // Names only (never values) — safe to log for diagnosing "0 imported" reports,
  // since a wrong Date Range in Health Auto Export can send metric groups with
  // no samples, which looks identical to a naming-mismatch bug from the outside.
  const rawMetrics = (req.body as { data?: { metrics?: { name?: string; data?: unknown[] }[] } })?.data?.metrics
  const metricNames = Array.isArray(rawMetrics) ? rawMetrics.map((m) => `${m?.name ?? '?'}(${m?.data?.length ?? 0})`) : []
  const mapped = parseHealthWebhookPayload(req.body)
  const workoutCount = Array.isArray((req.body as { data?: { workouts?: unknown[] } })?.data?.workouts)
    ? (req.body as { data: { workouts: unknown[] } }).data.workouts.length
    : 0
  console.log(`[health-webhook] ${email}: groups=${metricNames.join(', ') || 'none'} workouts=${workoutCount} matched=${Object.keys(mapped).join(',') || 'none'}`)

  try {
    // Series FIRST, and unconditionally. Health Auto Export sends one Data Type
    // per automation, so a "Workouts" automation arrives with data.workouts and
    // NO data.metrics at all. Bailing out on an empty metric map would have
    // thrown that entire payload away — including the densest heart-rate data
    // the phone can produce.
    const hrSamples = extractHeartRateSeries(req.body)
    const hrBaru = appendHrSamples(email, hrSamples)
    // Store the sessions themselves, not just their heart rates. Without this
    // a correctly-configured Workouts automation still produced an empty
    // Riwayat Latihan, because that screen only ever read localStorage.
    const rawWorkouts = (req.body as { data?: { workouts?: Record<string, unknown>[] } })?.data?.workouts
    const latihanBaru = appendWorkouts(email, Array.isArray(rawWorkouts) ? rawWorkouts as Record<string, any>[] : [])

    // The "Heart Rate Notifications" data type had no handling at all: the
    // payload was accepted, logged as matching nothing, and dropped.
    const rawNotifs = (req.body as { data?: { heartRateNotifications?: Record<string, unknown>[] } })?.data?.heartRateNotifications
    const notifBaru = appendHrNotifications(email, Array.isArray(rawNotifs) ? rawNotifs as Record<string, any>[] : [])
    const tidurBaru = appendSleepSessions(email, extractSleepSessions(req.body))

    // Zone alert rides on the sync that just delivered the data — there is no
    // other moment the server learns a heart rate changed.
    const zoneUser = getUserByEmail(email)
    if (zoneUser) checkHrZoneAlert(zoneUser.id, hrSamples).catch(() => {})

    // Record what this payload actually contained, so the app can diagnose a
    // silent misconfiguration itself instead of the user having to send in
    // their exporter config for someone to read by hand.
    const diukurPada = newestSampleDate(req.body)
    recordWebhookDelivery(email, {
      at: new Date().toISOString(),
      metricGroups: Array.isArray(rawMetrics)
        ? rawMetrics.map((m) => ({ name: String(m?.name ?? '?'), samples: m?.data?.length ?? 0 }))
        : [],
      workouts: workoutCount,
      hrSamples: hrBaru,
      sleepNights: tidurBaru,
      matched: Object.keys(mapped),
      newestSampleDate: diukurPada,
    })

    if (!Object.keys(mapped).length) {
      res.status(200).json({
        ok: true,
        imported: 0,
        hrSamples: hrBaru,
        sleepNights: tidurBaru,
        workoutsSaved: latihanBaru,
        hrNotifications: notifBaru,
        hint: hrBaru > 0 || tidurBaru > 0 || latihanBaru > 0 || notifBaru > 0
          ? 'Tidak ada metrik ringkas yang cocok, namun deret sampel tetap tersimpan — ini normal untuk otomatisasi bertipe Workouts.'
          : 'Tidak ada metrik yang cocok — kemungkinan belum ada data untuk rentang tanggal yang dipilih (mis. VO2max/berat badan tidak tercatat setiap hari). Coba perluas Date Range ke "Last 7 Days".',
        metricsReceived: metricNames,
      })
      return
    }

    // Store the latest values AND auto-append a dated snapshot to the trend
    // history + stamp the sync time, so device data is processed and shown on
    // the website automatically with no manual save.
    const profile = recordDeviceHealthSync(email, mapped, 'Apple Watch', diukurPada)
    res.json({
      ok: true,
      imported: Object.keys(mapped).length,
      hrSamples: hrBaru,
      sleepNights: tidurBaru,
      workoutsSaved: latihanBaru,
      hrNotifications: notifBaru,
      syncedAt: profile.lastDeviceSyncAt,
      profile,
    })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

// Sessions pushed by the device, in the exporter's own shape so the frontend
// can reuse the same parser it uses for manual uploads.
app.get('/api/workouts', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const workouts = getWorkouts(u.email)
  res.json({ workouts, count: workouts.length })
})

// Katalog metrik: dipakai layar profil untuk menampilkan SEMUA yang tertangkap,
// beserta label, kategori dan satuannya, tanpa menduplikasi daftar di frontend.
app.get('/api/health-metrics/catalog', (_req, res) => {
  res.json({
    metrics: KATALOG.map((d) => ({ kunci: d.kunci, label: d.label, kategori: d.kategori, satuan: d.tampil })),
    kategori: KATEGORI,
    total: KATALOG.length,
  })
})

app.get('/api/hr-notifications', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const notifications = getHrNotifications(u.email)
  res.json({ notifications, count: notifications.length })
})

// Why is nothing arriving? Answers with named settings, not vague advice.
app.get('/api/health-sync/diagnosis', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ ...diagnoseSync(u.email), recent: getWebhookDeliveries(u.email).slice(-10).reverse() })
})

// Heart-rate log. `since` is epoch ms; defaults to the last 24 hours so a
// casual open never drags the whole ring buffer over the wire.
app.get('/api/health-series/heart-rate', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const since = Number(req.query.since)
  const from = Number.isFinite(since) && since > 0 ? since : Date.now() - 24 * 3600_000
  const samples = getHrSamples(u.email, from)
  res.json({ samples, from, count: samples.length })
})

// Everything the alert settings screen needs, computed server-side so the
// suggested bedtime comes from the same data the scheduler will actually use.
app.get('/api/health-alerts/context', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({
    suggestedBedtime: suggestedBedtime(u.email),
    zones: ZONES,
  })
})

app.get('/api/health-series/sleep', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ sessions: getSleepSessions(u.email) })
})

app.delete('/api/health-series', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  clearHealthSeries(u.email)
  res.json({ ok: true })
})

// --- Sports scores (free, no-key sources: ESPN site API + Jolpica-F1) ---
// Public routes — scores aren't user data, no auth needed.
app.get('/api/sports/leagues', (_req, res) => {
  res.json({ leagues: LEAGUES.map((l) => ({ id: l.id, label: l.label })), unavailable: UNAVAILABLE })
})
app.get('/api/sports/scores', async (req, res) => {
  const league = String(req.query.league ?? '')
  if (!LEAGUES.some((l) => l.id === league)) {
    res.status(400).json({ error: 'unknown_league' })
    return
  }
  // dates opsional (YYYYMMDD-YYYYMMDD) supaya widget dapat menanyakan jadwal
  // beberapa hari ke depan, bukan hanya pertandingan hari ini.
  res.json(await fetchLeagueScoreboard(league, req.query.dates ? String(req.query.dates) : undefined))
})
// Udara dan UV di kota pengguna — publik seperti papan skor, karena bukan
// data pribadi siapa pun: yang dikirim hanya nama kota.
app.get('/api/lingkungan', async (req, res) => {
  res.json(await lingkunganKota(String(req.query.kota ?? 'Jakarta')))
})
app.get('/api/sports/f1', async (_req, res) => {
  res.json(await fetchF1Info())
})
app.get('/api/sports/motogp', async (_req, res) => {
  res.json(await fetchMotoGpInfo())
})

// Live journal retrieval for the Clinical Evidence page — real PubMed articles
// via NCBI E-utilities (free, no key). Auth-gated so it isn't abused as an open
// proxy, and covered by the global rate limiter.
app.get('/api/evidence/pubmed', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'empty_query' })
  try {
    const articles = await searchPubmed(q, 6)
    res.json({ articles })
  } catch (e) {
    console.log('[pubmed] error:', (e as Error).message)
    res.json({ articles: [], error: 'pubmed_unavailable' })
  }
})

// Live clinical-trials search — real registered studies from ClinicalTrials.gov
// (free, no key). Auth-gated & rate-limited.
app.get('/api/trials', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'empty_query' })
  const recruitingOnly = String(req.query.recruiting || '') === '1'
  const country = String(req.query.country || '').trim() || undefined
  try {
    const trials = await searchTrials(q, { recruitingOnly, country })
    res.json({ trials })
  } catch (e) {
    console.log('[trials] error:', (e as Error).message)

    res.json({ trials: [], error: 'trials_unavailable' })
  }
})

// Drug information lookup — official FDA labels via openFDA (free, no key).
app.get('/api/drugs/label', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'empty_query' })
  try {
    const info = await lookupDrug(q)
    if (!info) return res.json({ drug: null })
    res.json({ drug: info })
  } catch (e) {
    console.log('[openfda] error:', (e as Error).message)
    res.json({ drug: null, error: 'drug_unavailable' })
  }
})

// Related brand/generic drug names — RxNorm (free, no key). NOT an
// interaction checker (that RxNav sub-API was retired by NLM in Jan 2024).
app.get('/api/drugs/related', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'empty_query' })
  try {
    const drugs = await findRelatedDrugs(q)
    res.json({ drugs })
  } catch (e) {
    console.log('[rxnorm] error:', (e as Error).message)
    res.json({ drugs: [], error: 'rxnorm_unavailable' })
  }
})

// Gene information lookup — MyGene.info (free, no key).
app.get('/api/genes/info', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'empty_query' })
  try {
    const gene = await lookupGene(q)
    if (!gene) return res.json({ gene: null })
    res.json({ gene })
  } catch (e) {
    console.log('[mygene] error:', (e as Error).message)
    res.json({ gene: null, error: 'gene_unavailable' })
  }
})
app.get('/api/sports/favorites', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ teams: getSportsFavorites(u.id) })
})
app.put('/api/sports/favorites', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const teams = (req.body as { teams?: unknown }).teams
  if (!Array.isArray(teams) || !teams.every((t) => typeof t === 'string')) {
    res.status(400).json({ error: 'invalid_teams_payload' })
    return
  }
  res.json({ teams: setSportsFavorites(u.id, teams as string[]) })
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
  if (author) notify(author.id, { title: 'New subscriber 🎉', body: `You earned ${authorCut} PNC from a creator subscription.`, url: './#/' }).catch(() => {})
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

// --- Live medical news (Google News RSS proxy — keyless & free) ---
// The browser can't fetch news.google.com directly (CORS), so the server
// proxies two health-topic RSS feeds (Indonesian + international), parses the
// XML with a minimal regex parser (no new dependencies), and caches for 10
// minutes so we stay a polite consumer while the client still sees
// continuously fresh headlines.
interface LiveNewsItem { title: string; link: string; source: string; pubDate: string; region: 'domestic' | 'international' }
let newsCache: { items: LiveNewsItem[]; at: number } | null = null
const NEWS_TTL_MS = 10 * 60 * 1000

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()
}

function parseRss(xml: string, region: LiveNewsItem['region']): LiveNewsItem[] {
  const items: LiveNewsItem[] = []
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
    const link = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '')
    const pubDate = decodeXml(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '')
    const source = decodeXml(block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? '')
    if (title && link) items.push({ title, link, source, pubDate, region })
  }
  return items
}

async function fetchNewsFeed(url: string, region: LiveNewsItem['region']): Promise<LiveNewsItem[]> {
  const r = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; PanaceamedNews/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`news feed ${r.status}`)
  return parseRss(await r.text(), region)
}

app.get('/api/news', async (_req, res) => {
  if (newsCache && Date.now() - newsCache.at < NEWS_TTL_MS) {
    return res.json({ items: newsCache.items, fetchedAt: newsCache.at, cached: true })
  }
  const [dom, intl] = await Promise.allSettled([
    fetchNewsFeed('https://news.google.com/rss/headlines/section/topic/HEALTH?hl=id&gl=ID&ceid=ID:id', 'domestic'),
    fetchNewsFeed('https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en', 'international'),
  ])
  const items = [
    ...(dom.status === 'fulfilled' ? dom.value.slice(0, 12) : []),
    ...(intl.status === 'fulfilled' ? intl.value.slice(0, 12) : []),
  ]
  if (items.length === 0) {
    // Both feeds failed — serve the stale cache if we have one, else 503 so
    // the client falls back to its curated content.
    if (newsCache) return res.json({ items: newsCache.items, fetchedAt: newsCache.at, cached: true, stale: true })
    return res.status(503).json({ error: 'news_unavailable' })
  }
  newsCache = { items, at: Date.now() }
  res.json({ items, fetchedAt: newsCache.at, cached: false })
})

// --- Market data (free, no-key: Yahoo Finance public chart endpoint) ---
// Public routes: prices are not user data. Delayed/indicative — the payload
// carries `delayed: true` so the client cannot present it as live tick data.
app.get('/api/markets/instruments', (_req, res) => {
  res.json({ instruments: INSTRUMENTS, ranges: RANGES })
})

app.get('/api/markets/quote', async (req, res) => {
  const symbol = String(req.query.symbol ?? '').trim()
  const range = String(req.query.range ?? '1mo') as Range
  if (!isValidSymbol(symbol)) return res.status(400).json({ error: 'invalid_symbol' })
  if (!RANGES.includes(range)) return res.status(400).json({ error: 'invalid_range' })
  try {
    res.json(await fetchQuote(symbol, range))
  } catch (e) {
    console.log('[markets] quote error:', (e as Error).message)
    res.status(503).json({ error: 'market_unavailable' })
  }
})

app.get('/api/markets/watchlist', async (req, res) => {
  const raw = String(req.query.symbols ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  // Falling back to the whole INSTRUMENTS list would silently truncate to the
  // first symbols in declaration order, i.e. all indices and no crypto. The
  // featured spread is the honest default for "everything".
  const symbols = (raw.length ? raw : UNGGULAN).slice(0, WATCHLIST_MAX)
  if (symbols.some((s) => !isValidSymbol(s))) return res.status(400).json({ error: 'invalid_symbol' })
  const range = String(req.query.range ?? '1mo') as Range
  if (!RANGES.includes(range)) return res.status(400).json({ error: 'invalid_range' })
  try {
    res.json(await fetchQuotes(symbols, range))
  } catch (e) {
    console.log('[markets] watchlist error:', (e as Error).message)
    res.status(503).json({ error: 'market_unavailable' })
  }
})

// Pencarian orang untuk kotak pencarian global. Wajib masuk — direktori
// pengguna aplikasi kesehatan bukan sesuatu yang pantas terbuka bagi anonim.
app.get('/api/users/search', requireAuth, (req, res) => {
  const q = String(req.query.q ?? '')
  res.json({ results: cariOrang(q) })
})

// Symbol lookup, so the search box can reach beyond the built-in watchlist.
app.get('/api/markets/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 40)
  if (q.length < 2) return res.json({ results: [] })
  try {
    res.json({ results: await searchSymbols(q) })
  } catch (e) {
    console.log('[markets] search error:', (e as Error).message)
    res.status(503).json({ error: 'market_unavailable' })
  }
})

// Business & finance headlines, same Google News RSS proxy the health feed uses.
let bizNewsCache: { items: LiveNewsItem[]; at: number } | null = null
app.get('/api/markets/news', async (_req, res) => {
  if (bizNewsCache && Date.now() - bizNewsCache.at < NEWS_TTL_MS) {
    return res.json({ items: bizNewsCache.items, fetchedAt: bizNewsCache.at, cached: true })
  }
  const [dom, intl] = await Promise.allSettled([
    fetchNewsFeed('https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=id&gl=ID&ceid=ID:id', 'domestic'),
    fetchNewsFeed('https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en', 'international'),
  ])
  const items = [
    ...(dom.status === 'fulfilled' ? dom.value.slice(0, 12) : []),
    ...(intl.status === 'fulfilled' ? intl.value.slice(0, 12) : []),
  ]
  if (items.length === 0) {
    if (bizNewsCache) return res.json({ items: bizNewsCache.items, fetchedAt: bizNewsCache.at, cached: true, stale: true })
    return res.status(503).json({ error: 'news_unavailable' })
  }
  bizNewsCache = { items, at: Date.now() }
  res.json({ items, fetchedAt: bizNewsCache.at, cached: false })
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
  // Diagnostic reason for the common "sent: 0" case, so the client (and the
  // owner reading Render logs) doesn't have to guess why. Not exhaustive —
  // VAPID init failures still only appear in the server console (see push.ts)
  // since we don't want to leak internal error strings to the client.
  let reason: string | undefined
  if (sent === 0) {
    if (!features.pushLive) reason = 'vapid_not_configured'
    else if (listPushSubs(u.id).length === 0) reason = 'no_subscriptions_on_file'
    else reason = 'send_failed_see_server_logs'
  }
  res.json({ ok: true, sent, reason })
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

// --- Medication reminders ---
// Client computes `nextFireAt` (a UTC ISO instant) from the user's local
// wall-clock time-of-day so the server never has to know their timezone; the
// scheduler loop below just compares Date.now() against it.
app.get('/api/reminders', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ reminders: listReminders(u.id) })
})
app.post('/api/reminders', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const { medName, dose, timeOfDay, nextFireAt } = req.body as { medName?: string; dose?: string; timeOfDay?: string; nextFireAt?: string }
  if (!medName?.trim() || !timeOfDay || !nextFireAt) return res.status(400).json({ error: 'missing_fields' })
  const rem = addReminder(u.id, { medName: medName.trim(), dose: (dose ?? '').trim(), timeOfDay, nextFireAt, active: true })
  res.json({ reminder: rem })
})
app.patch('/api/reminders/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const patch = req.body as Partial<{ medName: string; dose: string; timeOfDay: string; nextFireAt: string; active: boolean }>
  const rem = updateReminder(u.id, req.params.id, patch)
  if (!rem) return res.status(404).json({ error: 'not_found' })
  res.json({ reminder: rem })
})
app.delete('/api/reminders/:id', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  removeReminder(u.id, req.params.id)
  res.json({ ok: true })
})

// Owner gate — by configured owner email OR an explicit owner role.
function isOwner(u: User): boolean {
  return u.email.toLowerCase() === config.ownerEmail || u.role === 'owner'
}

// ── Connect: verifikasi, kredit kepercayaan, laporan, blokir ────────────────
//
// Pemisahannya tegas: yang bisa dilakukan pengguna atas dirinya sendiri, dan
// yang HANYA boleh dilakukan pemilik. Tidak ada endpoint yang mengembalikan
// agama, orientasi seksual, atau NIK kepada siapa pun selain pemilik akun itu
// sendiri dan pemilik aplikasi saat meninjau.

app.get('/api/connect/saya', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json(ringkasanSaya(u.email))
})

app.post('/api/connect/verifikasi', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const r = ajukanVerifikasi(u.email, req.body ?? {})
  if (!r.ok) return res.status(400).json({ error: r.galat })
  res.json({ ok: true })
})

app.post('/api/connect/radius', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  res.json({ radiusKm: setelRadius(u.email, Number((req.body ?? {}).km)) })
})

// Deck: kartu calon kenalan yang sudah lolos verifikasi, blokir, kredit,
// kecocokan orientasi, dan radius kedua belah pihak. Semua penyaringan terjadi
// di server — klien tidak pernah menerima daftar mentah lalu menyaringnya
// sendiri, karena daftar mentah itulah yang tidak boleh sampai ke klien.
// Penarikan persetujuan (UU PDP Pasal 9). Harus semudah memberikannya, jadi
// satu permintaan sudah cukup — tanpa surel, tanpa alasan, tanpa antrean.
app.post('/api/connect/tarik-persetujuan', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const r = tarikPersetujuan(u.email)
  addAudit(u, 'connect_tarik_persetujuan', u.email)
  res.status(r.ok ? 200 : 400).json(r)
})

app.get('/api/connect/dek', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const batas = Number(req.query.batas)
  res.json({ kartu: dek(u.email, Number.isFinite(batas) ? batas : 50) })
})

app.post('/api/connect/blokir', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const { email, buka } = (req.body ?? {}) as { email?: string; buka?: boolean }
  if (!email) return res.status(400).json({ error: 'email_wajib' })
  const r = buka ? bukaBlokir(u.email, email) : blokir(u.email, email)
  if (!r.ok) return res.status(400).json({ error: r.galat })
  res.json({ ok: true })
})

app.post('/api/connect/lapor', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const { email, alasan, catatan } = (req.body ?? {}) as { email?: string; alasan?: string; catatan?: string }
  const r = laporkan(u.email, String(email ?? ''), String(alasan ?? ''), catatan)
  if (!r.ok) return res.status(400).json({ error: r.galat })
  res.json({ ok: true })
})

app.get('/api/connect/profil/:email', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const target = req.params.email
  if (!bolehDilihat(u.email, target)) return res.status(404).json({ error: 'tidak_tersedia' })
  res.json({ profil: profilPublik(target) })
})

// ── Hanya pemilik ────────────────────────────────────────────────────────────
app.get('/api/connect/tinjau', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ ajuan: ajuanMenunggu(), laporan: laporanMenunggu() })
})

app.post('/api/connect/tinjau/verifikasi', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { email, setuju, alasan } = (req.body ?? {}) as { email?: string; setuju?: boolean; alasan?: string }
  const r = putuskanVerifikasi(String(email ?? ''), !!setuju, alasan)
  if (!r.ok) return res.status(400).json({ error: r.galat })
  addAudit(u, setuju ? 'connect_verifikasi_setuju' : 'connect_verifikasi_tolak', String(email))
  res.json({ ok: true })
})

app.post('/api/connect/tinjau/laporan', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { id, poin, catatan } = (req.body ?? {}) as { id?: string; poin?: number; catatan?: string }
  const r = putuskanLaporan(String(id ?? ''), Number(poin ?? 0), u.email, catatan)
  if (!r.ok) return res.status(400).json({ error: r.galat })
  addAudit(u, 'connect_putus_laporan', `${id}:${poin}`)
  res.json({ ok: true })
})

app.post('/api/connect/tinjau/kredit', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  const { email, poin, alasan, pulihkan } = (req.body ?? {}) as
    { email?: string; poin?: number; alasan?: string; pulihkan?: boolean }
  if (!email) return res.status(400).json({ error: 'email_wajib' })
  const hasil = pulihkan
    ? pulihkanKredit(String(email), Number(poin ?? 0))
    : kurangiKredit(String(email), Number(poin ?? 0), String(alasan ?? 'Pelanggaran'), u.email)
  addAudit(u, pulihkan ? 'connect_pulihkan_kredit' : 'connect_kurangi_kredit', `${email}:${poin}`)
  res.json(hasil)
})

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

// --- owner user directory: who signed up / paid / subscribed ---
app.get('/api/owner/users', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ users: userDirectory() })
})

// --- "Pesan & Saran" — in-app feedback delivered to the owner only ---
app.post('/api/feedback', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  const { kind, text } = req.body as { kind?: Feedback['kind']; text?: string }
  const trimmed = (text ?? '').trim()
  if (trimmed.length < 5) return res.status(400).json({ error: 'text_too_short' })
  const validKinds: Feedback['kind'][] = ['Suggestion', 'Problem/Bug', 'Question', 'Compliment', 'Feature Request']
  const safeKind = validKinds.includes(kind as Feedback['kind']) ? (kind as Feedback['kind']) : 'Suggestion'
  const entry: Feedback = { id: uid(), userId: u.id, userEmail: u.email, userName: u.name, kind: safeKind, text: trimmed, at: new Date().toISOString(), read: false }
  addFeedback(entry)
  const owner = getUserByEmail(config.ownerEmail)
  if (owner) {
    notify(owner.id, { title: `💬 ${safeKind} baru dari ${u.name}`, body: trimmed.slice(0, 120), url: '/owner' }, 'notifTransactions').catch(() => {})
  }
  res.json({ ok: true, entry })
})
app.get('/api/feedback', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  res.json({ feedback: listFeedback() })
})
app.post('/api/feedback/:id/read', requireAuth, (req, res) => {
  const u = (req as express.Request & { user: User }).user
  if (!isOwner(u)) return res.status(403).json({ error: 'forbidden' })
  markFeedbackRead(req.params.id)
  res.json({ ok: true })
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

// Poll leagues that at least one user follows a team in, diff scores/state
// against the last poll, and notify affected users on goals or full-time —
// reuses the existing push/notification inbox infra (notify()).
const lastSportsState = new Map<string, { state: string; homeScore?: string; awayScore?: string }>()
async function pollSportsFavorites() {
  const favs = allSportsFavorites()
  const followedLeagues = new Set<string>()
  for (const teams of Object.values(favs)) for (const t of teams) followedLeagues.add(t.split(':')[0])
  if (!followedLeagues.size) return

  for (const leagueId of followedLeagues) {
    const result = await fetchLeagueScoreboard(leagueId)
    if (result.error) continue
    for (const ev of result.events) {
      const key = `${leagueId}:${ev.id}`
      const prev = lastSportsState.get(key)
      const cur = { state: ev.state, homeScore: ev.home.score, awayScore: ev.away.score }
      lastSportsState.set(key, cur)
      if (!prev) continue // first sight of this match — establish baseline, don't notify retroactively

      const scoreChanged = prev.homeScore !== cur.homeScore || prev.awayScore !== cur.awayScore
      const justFinished = prev.state !== 'post' && cur.state === 'post'
      if (!scoreChanged && !justFinished) continue

      for (const [userId, teams] of Object.entries(favs)) {
        const follows = teams.some((t) => t === `${leagueId}:${ev.home.name}` || t === `${leagueId}:${ev.away.name}`)
        if (!follows) continue
        const title = justFinished ? `Selesai: ${ev.home.name} ${ev.home.score}-${ev.away.score} ${ev.away.name}` : `Gol! ${ev.home.name} ${ev.home.score}-${ev.away.score} ${ev.away.name}`
        notify(userId, { title, body: `${result.label} · ${ev.statusDetail}`, tag: key }, 'sportsNotif').catch(() => {})
      }
    }
  }
}

// --- Production incident alerting ---------------------------------------------
// Push a notification (and email) to the owner when something goes wrong in
// production: unhandled route errors, uncaught exceptions, and rejected
// promises. Throttled so one recurring fault can't spam a flood of alerts.
let lastOwnerAlert = 0
function alertOwner(kind: string, detail: string) {
  const now = Date.now()
  if (now - lastOwnerAlert < 60_000) return // at most one alert/minute
  lastOwnerAlert = now
  const owner = getUserByEmail(config.ownerEmail)
  const body = `${kind}: ${detail}`.slice(0, 300)
  console.error(`[incident] ${body}`)
  if (owner) notify(owner.id, { title: '🚨 Panaceamed production incident', body, url: '/owner' }, 'notifTransactions').catch(() => {})
  sendEmail(config.ownerEmail, '🚨 Panaceamed production incident', `<p><b>${kind}</b></p><pre>${detail.slice(0, 2000)}</pre>`).catch(() => {})
}

// Express error-handling middleware (must be registered AFTER all routes).
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Kesalahan KLIEN dipisahkan dari kesalahan server. Sebelumnya semuanya
  // dijawab 500 dan semuanya memicu peringatan ke pemilik — dua akibat buruk:
  //
  //   1. Badan permintaan yang terlalu besar atau JSON rusak dijawab 500,
  //      sehingga terlihat seperti bug server. Kalau ekspor Health Auto Export
  //      suatu hari melewati batas, gejalanya sama persis dengan kegagalan
  //      senyap yang selama ini paling sulit dilacak.
  //   2. Siapa pun bisa membanjiri peringatan pemilik hanya dengan mengirim
  //      JSON rusak berulang kali.
  const e = err as { type?: string; status?: number; statusCode?: number }
  const kode = e?.status ?? e?.statusCode
  if (e?.type === 'entity.too.large' || kode === 413) {
    if (!res.headersSent) res.status(413).json({ error: 'payload_too_large' })
    return
  }
  if (e?.type === 'entity.parse.failed' || (typeof kode === 'number' && kode >= 400 && kode < 500)) {
    if (!res.headersSent) res.status(400).json({ error: 'bad_request' })
    return
  }
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
  alertOwner(`Route error @ ${req.method} ${req.path}`, msg)
  if (!res.headersSent) res.status(500).json({ error: 'internal_error' })
})

process.on('uncaughtException', (e) => alertOwner('Uncaught exception', e?.stack || String(e)))
process.on('unhandledRejection', (e) => alertOwner('Unhandled promise rejection', e instanceof Error ? (e.stack || e.message) : String(e)))

const server = createServer(app)
attachRealtime(server)
await initStore()
// Penghapusan akun Connect yang kreditnya jatuh di bawah ambang. Dijadwalkan
// tujuh hari, bukan seketika: keputusan yang keliru masih bisa ditarik pemilik
// lewat pulihkanKredit, dan penghapusan yang tidak bisa dibatalkan bukan hal
// yang pantas dijalankan tanpa jeda.
setInterval(() => {
  for (const email of jatuhTempoHapus()) {
    hapusAkunConnect(email)
    console.log('[connect] akun dihapus karena kredit di bawah ambang:', email)
  }
}, 3600_000)

setInterval(() => { pollSportsFavorites().catch((e) => console.log('[sports] poll error:', (e as Error).message)) }, 90_000)
// Medication reminder scheduler — checked every minute; a reminder is due
// once Date.now() passes its nextFireAt (a UTC instant the client computed
// from the user's local time, so no server-side timezone handling needed).
setInterval(() => {
  const now = Date.now()
  for (const { userId, reminder } of allReminders()) {
    if (!reminder.active) continue
    const jadwal = new Date(reminder.nextFireAt).getTime()
    if (!Number.isFinite(jadwal) || jadwal > now) continue

    // Jadwal dikejar sekaligus, dan dosis yang sudah lewat jauh tidak
    // diberitahukan. Alasan keduanya ada di server/src/jadwal.ts.
    const { beritahu, berikutnya } = putusanPengingat(jadwal, now)
    updateReminder(userId, reminder.id, { nextFireAt: new Date(berikutnya).toISOString() })
    if (!beritahu) continue
    notify(userId, {
      title: `💊 ${reminder.medName}`,
      body: reminder.dose ? `Time for your ${reminder.dose} dose.` : 'Time to take your medication.',
      url: '/med-reminders',
      tag: `reminder-${reminder.id}`,
    }, 'notifMedReminders').catch(() => {})
  }
}, 60_000)
// Bedtime reminder — checked every minute like the medication scheduler. Each
// user's own local clock is used via the UTC offset their client stored, so a
// 22:30 target means 22:30 where they actually are.
setInterval(() => {
  for (const u of allUsersForAlerts()) {
    checkBedtimeReminder(u.id, u.email).catch(() => {})
    // Pengingat latihan harian, penjadwal yang sama persis: jam milik
    // pengguna sendiri, sekali sehari, jendela toleransi dua menit.
    checkWorkoutReminder(u.id).catch(() => {})
    // Pengingat SEBELUM waktu salat (bawaan lima menit). Bukan adzan — Web
    // Push tidak dapat memutar lantunan, jadi yang dijanjikan hanya kabarnya.
    checkPrayerReminder(u.id).catch(() => {})
  }
}, 60_000)

server.listen(config.port, () => {
  console.log(`Panaceamed backend on http://localhost:${config.port}`)
  console.log(`  AI:           ${aiStatus()}`)
  console.log(`  Web Push:     ${features.pushLive ? 'LIVE (VAPID set)' : 'off (set VAPID_PUBLIC_KEY/PRIVATE_KEY)'}`)
  console.log(`  Email:        ${features.emailLive ? 'LIVE (Resend)' : 'off (set RESEND_API_KEY)'}`)
  console.log(`  Google login: ${features.googleLive ? 'LIVE' : 'mock (dev-login)'}`)
  console.log(`  Payments:     ${features.paymentsLive ? 'LIVE (Midtrans)' : 'mock'}`)
  console.log(`  Payout (Iris):${irisLive ? ' LIVE' : ' off (set IRIS_API_KEY for auto-disbursement)'}`)
})
