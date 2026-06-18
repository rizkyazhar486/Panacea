import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config, features } from './config.js'
import { balance, txsFor, credit, type User } from './store.js'
import { googleLogin, devLogin, currentUser, clearSession, requireAuth } from './auth.js'
import { createPayment, confirmPayment, paymentWebhook, orderStatus } from './payments.js'

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
    features: { google: features.googleLive, payments: features.paymentsLive },
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

app.listen(config.port, () => {
  console.log(`Panaceamed backend on http://localhost:${config.port}`)
  console.log(`  Google login: ${features.googleLive ? 'LIVE' : 'mock (dev-login)'}`)
  console.log(`  Payments:     ${features.paymentsLive ? 'LIVE (Midtrans)' : 'mock'}`)
})
