import type { Request, Response } from 'express'
import crypto from 'node:crypto'
// midtrans-client is CommonJS
import midtransClient from 'midtrans-client'
import { config, features } from './config.js'
import { currentUser } from './auth.js'
import { credit, createOrder, getOrder, setOrderStatus, getUser, saveSettings, isEarlyAdopter, EARLY_ADOPTER_DISCOUNT, CLINICAL_CALC_PRICE_IDR, uid, type Order, type User } from './store.js'
import { notify } from './push.js'
import { sendReceipt } from './email.js'

// Fixed-price purposes (IDR) — paid directly, not priced per-PNC.
const FIXED_PRICE: Record<string, number> = {
  chronic_monthly: 199000,
  chronic_lifetime: 19900000,
  clinical_calc_unlock: CLINICAL_CALC_PRICE_IDR,
}

// Activate a chronic subscription in the user's server-side settings.
function activateChronic(userId: string, purpose: string) {
  if (purpose === 'chronic_lifetime') saveSettings(userId, { chronicLifetime: true })
  else if (purpose === 'chronic_monthly') saveSettings(userId, { chronicSubExpires: new Date(Date.now() + 30 * 86400000).toISOString() })
}

// Apply a successful order: chronic subscriptions/feature unlocks activate
// access directly; everything else credits PNC to the wallet.
function fulfillOrder(order: { id: string; userId: string; amountPnc: number; amountIdr: number; method: string; purpose?: string }) {
  if (order.purpose === 'clinical_calc_unlock') {
    saveSettings(order.userId, { clinicalCalcUnlocked: true })
    notify(order.userId, { title: 'Kalkulator Klinis terbuka ✅', body: 'Akses penuh ke 34 kalkulator klinis telah aktif.', url: './#/clinical-calculators' }, 'notifTransactions').catch(() => {})
  } else if (order.purpose && order.purpose.startsWith('chronic')) {
    activateChronic(order.userId, order.purpose)
    notify(order.userId, { title: 'Subscription active ✅', body: 'Your Chronic & Longevity monitoring is now active.', url: './#/nutrition' }, 'notifTransactions').catch(() => {})
  } else {
    credit(order.userId, order.amountPnc, 'deposit', `Top-up ${order.amountPnc} PNC via ${order.method}`, order.id)
    notify(order.userId, { title: 'Payment received ✅', body: `${order.amountPnc} PNC has been added to your balance.`, url: './#/billing' }, 'notifTransactions').catch(() => {})
    const payer = getUser(order.userId)
    if (payer) sendReceipt(payer.email, payer.name, order.amountPnc, order.amountIdr, order.method).catch(() => {})
  }
}

const snap = features.paymentsLive
  ? new (midtransClient as any).Snap({
      isProduction: config.midtrans.isProduction,
      serverKey: config.midtrans.serverKey,
      clientKey: config.midtrans.clientKey,
    })
  : null

// Map our UI method to Midtrans enabled_payments channels.
function channels(method: string): string[] {
  if (method === 'QRIS') return ['gopay', 'qris', 'shopeepay']
  if (method === 'Virtual Account') return ['bca_va', 'bni_va', 'bri_va', 'permata_va', 'echannel']
  return ['credit_card'] // Visa / Mastercard
}

export async function createPayment(req: Request, res: Response) {
  const user = (req as Request & { user: User }).user
  const { amountPnc, method, purpose } = req.body as { amountPnc?: number; method?: string; purpose?: string }
  const isFixed = !!purpose && purpose in FIXED_PRICE
  const pnc = isFixed ? 0 : Math.max(1, Math.floor(Number(amountPnc) || 0))
  const baseIdr = isFixed ? FIXED_PRICE[purpose!] : pnc * config.tokenToIdr
  // Early-adopter promo: first 25 emails get 75% off everything (PNC still full).
  const early = isEarlyAdopter(user.id)
  const amountIdr = early ? Math.max(1000, Math.round(baseIdr * (1 - EARLY_ADOPTER_DISCOUNT))) : baseIdr
  const orderId = 'PMD-' + uid().slice(0, 14)
  createOrder({ id: orderId, userId: user.id, amountPnc: pnc, amountIdr, method: method || 'QRIS', status: 'pending', createdAt: new Date().toISOString(), purpose: purpose || 'topup' })

  if (!snap) {
    // Mock mode: frontend calls /confirm to simulate a successful gateway callback.
    return res.json({ live: false, orderId, amountPnc: pnc, amountIdr, method, mock: true })
  }
  try {
    const fixedLabel: Record<string, string> = {
      chronic_lifetime: 'Pemantauan Kronis Lifetime',
      chronic_monthly: 'Pemantauan Kronis 30 hari',
      clinical_calc_unlock: 'Buka Kalkulator Klinis',
    }
    const itemName = (isFixed ? fixedLabel[purpose!] : `${pnc} PanaceaToken`) + (early ? ' (Diskon 75% Early Bird)' : '')
    // Single item priced at the (possibly discounted) total so Midtrans totals match.
    const item = { id: isFixed ? purpose! : 'PNC', price: amountIdr, quantity: 1, name: itemName }
    const tx = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: amountIdr },
      enabled_payments: channels(method || 'QRIS'),
      customer_details: { email: user.email, first_name: user.name },
      item_details: [item],
    })
    res.json({ live: true, orderId, token: tx.token, redirectUrl: tx.redirect_url, clientKey: config.midtrans.clientKey })
  } catch (e) {
    res.status(502).json({ error: 'midtrans_error', detail: String(e) })
  }
}

// Mock-only: simulate a successful payment callback (no real gateway).
export function confirmPayment(req: Request, res: Response) {
  const user = (req as Request & { user: User }).user
  const { orderId } = req.body as { orderId?: string }
  const order = orderId ? getOrder(orderId) : undefined
  if (!order || order.userId !== user.id) return res.status(404).json({ error: 'order_not_found' })
  if (snap) return res.status(400).json({ error: 'use_real_gateway' })
  if (order.status !== 'paid') {
    setOrderStatus(order.id, 'paid')
    fulfillOrder(order)
  }
  res.json({ ok: true, status: 'paid' })
}

type PaymentNotificationGate =
  | { kind: 'accept' }
  | { kind: 'ignore'; reason: 'status_not_success' | 'fraud_not_accepted' }
  | { kind: 'reject'; reason: 'amount_mismatch' | 'currency_mismatch' }

function cleanBodyField(body: Record<string, unknown> | null | undefined, key: string): string {
  const value = body?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** Verify the Midtrans SHA-512 notification signature without leaking timing by early character comparison. */
export function verifyMidtransSignature(body: Record<string, unknown>, serverKey = config.midtrans.serverKey): boolean {
  const orderId = cleanBodyField(body, 'order_id')
  const statusCode = cleanBodyField(body, 'status_code')
  const grossAmount = cleanBodyField(body, 'gross_amount')
  const signature = cleanBodyField(body, 'signature_key').toLowerCase()
  if (!orderId || !statusCode || !grossAmount || !signature || !serverKey) return false

  const expected = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex')
  const actualBytes = Buffer.from(signature, 'utf8')
  const expectedBytes = Buffer.from(expected, 'utf8')
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes)
}

/**
 * Cross-check a signed notification against the server-created order before any
 * state transition. Midtrans documents `gross_amount` as the transaction total,
 * successful notifications with status_code 200, and fraud_status=accept when
 * that field exists. A non-accepted fraud/status notification is acknowledged
 * but must not grant value; amount/currency conflicts fail closed.
 */
export function paymentNotificationGate(
  body: Record<string, unknown>,
  order: Pick<Order, 'amountIdr'>,
): PaymentNotificationGate {
  const grossAmount = cleanBodyField(body, 'gross_amount')
  const notifiedAmount = grossAmount ? Number(grossAmount) : Number.NaN
  if (!Number.isFinite(notifiedAmount) || Math.abs(notifiedAmount - order.amountIdr) > 0.001) {
    return { kind: 'reject', reason: 'amount_mismatch' }
  }

  const currency = cleanBodyField(body, 'currency').toUpperCase()
  if (currency && currency !== 'IDR') return { kind: 'reject', reason: 'currency_mismatch' }

  const transactionStatus = cleanBodyField(body, 'transaction_status').toLowerCase()
  if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
    if (cleanBodyField(body, 'status_code') !== '200') {
      return { kind: 'ignore', reason: 'status_not_success' }
    }
    const fraudStatus = cleanBodyField(body, 'fraud_status').toLowerCase()
    if (fraudStatus && fraudStatus !== 'accept') {
      return { kind: 'ignore', reason: 'fraud_not_accepted' }
    }
  }

  return { kind: 'accept' }
}

/** Monotonic/idempotent order transition: a paid order is never downgraded by a late failure notification. */
export function nextPaymentOrderStatus(
  current: Order['status'],
  transactionStatus: string,
  successAccepted = true,
): Order['status'] | undefined {
  const status = transactionStatus.trim().toLowerCase()
  if (status === 'settlement' || status === 'capture') {
    return successAccepted && current !== 'paid' ? 'paid' : undefined
  }
  if (['deny', 'cancel', 'expire'].includes(status)) {
    return current !== 'paid' && current !== 'failed' ? 'failed' : undefined
  }
  return undefined
}

// Real Midtrans webhook (HTTP notification). Verifies authenticity and server-side order invariants before granting value.
export function paymentWebhook(req: Request, res: Response) {
  const rawBody = req.body
  const body: Record<string, unknown> = rawBody && typeof rawBody === 'object' ? rawBody as Record<string, unknown> : {}
  const orderId = cleanBodyField(body, 'order_id')
  const transactionStatus = cleanBodyField(body, 'transaction_status')
  if (!orderId || !transactionStatus || !cleanBodyField(body, 'status_code') || !cleanBodyField(body, 'gross_amount') || !cleanBodyField(body, 'signature_key')) {
    return res.status(400).json({ error: 'bad_request' })
  }
  if (!verifyMidtransSignature(body)) return res.status(403).json({ error: 'bad_signature' })

  const order = getOrder(orderId)
  if (!order) return res.status(404).json({ error: 'order_not_found' })

  const gate = paymentNotificationGate(body, order)
  if (gate.kind === 'reject') return res.status(409).json({ error: gate.reason })
  if (gate.kind === 'ignore') return res.json({ ok: true, ignored: gate.reason })

  const nextStatus = nextPaymentOrderStatus(order.status, transactionStatus, true)
  if (nextStatus === 'paid') {
    setOrderStatus(order.id, 'paid')
    fulfillOrder(order)
  } else if (nextStatus === 'failed') {
    setOrderStatus(order.id, 'failed')
  }
  res.json({ ok: true })
}

export function visibleOrderStatus(order: Pick<Order, 'userId' | 'status'> | undefined, requesterUserId: string): Order['status'] | undefined {
  if (!order || order.userId !== requesterUserId) return undefined
  return order.status
}

export function orderStatus(req: Request, res: Response) {
  const user = currentUser(req)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const status = visibleOrderStatus(getOrder(req.params.orderId), user.id)
  if (!status) return res.status(404).json({ error: 'order_not_found' })
  res.json({ status })
}
