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

type PaymentNotificationOrder = Pick<Order, 'amountIdr' | 'status'>
export type PaymentNotificationDecision =
  | { action: 'fulfill' }
  | { action: 'fail' }
  | { action: 'ignore' }
  | { action: 'reject'; status: 400 | 409; error: 'invalid_status_code' | 'amount_mismatch' | 'fraud_not_accepted' }

/**
 * Pure webhook-state gate. Signature verification happens separately in the
 * HTTP handler; this function checks whether an authenticated notification is
 * actually safe to fulfill against the order Panacea created.
 *
 * Midtrans documents successful delivery as transaction_status settlement (or
 * capture for card), status_code 200, and fraud_status=accept when the field is
 * present. We additionally require the signed gross_amount to match the local
 * order amount, and never downgrade an already-paid order when delayed failure
 * notifications arrive out of order.
 */
export function evaluatePaymentNotification(
  body: Record<string, string>,
  order: PaymentNotificationOrder,
): PaymentNotificationDecision {
  const transactionStatus = String(body.transaction_status ?? '').trim().toLowerCase()
  const success = transactionStatus === 'settlement' || transactionStatus === 'capture'

  if (success) {
    if (String(body.status_code ?? '').trim() !== '200') {
      return { action: 'reject', status: 409, error: 'invalid_status_code' }
    }

    const grossAmount = Number(body.gross_amount)
    if (!Number.isFinite(grossAmount) || Math.abs(grossAmount - order.amountIdr) > 0.005) {
      return { action: 'reject', status: 409, error: 'amount_mismatch' }
    }

    const fraudStatus = String(body.fraud_status ?? '').trim().toLowerCase()
    if (fraudStatus && fraudStatus !== 'accept') {
      return { action: 'reject', status: 409, error: 'fraud_not_accepted' }
    }

    if (order.status === 'paid') return { action: 'ignore' }
    return { action: 'fulfill' }
  }

  if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
    // Midtrans notes notifications can arrive out of order. A delayed failure
    // event must never roll a fulfilled order back to failed.
    if (order.status === 'paid') return { action: 'ignore' }
    return { action: 'fail' }
  }

  return { action: 'ignore' }
}

/**
 * Verify Midtrans' documented SHA-512 notification signature without a
 * data-dependent string comparison. Invalid/malformed signatures fail closed
 * before timingSafeEqual, which requires equal-length buffers.
 */
export function verifyPaymentSignature(body: Record<string, string>, serverKey: string): boolean {
  const provided = String(body.signature_key ?? '').trim()
  if (!/^[0-9a-f]{128}$/i.test(provided)) return false

  const expected = crypto
    .createHash('sha512')
    .update(String(body.order_id ?? '') + String(body.status_code ?? '') + String(body.gross_amount ?? '') + serverKey)
    .digest()
  const received = Buffer.from(provided, 'hex')
  return received.length === expected.length && crypto.timingSafeEqual(received, expected)
}

// Real Midtrans webhook (HTTP notification). Verifies signature and only then
// applies a state transition that is safe for the matching local order.
export function paymentWebhook(req: Request, res: Response) {
  const body = req.body as Record<string, string>
  const { order_id } = body
  if (!order_id) return res.status(400).json({ error: 'bad_request' })
  if (!verifyPaymentSignature(body, config.midtrans.serverKey)) return res.status(403).json({ error: 'bad_signature' })

  const order = getOrder(order_id)
  if (!order) return res.status(404).json({ error: 'order_not_found' })

  const decision = evaluatePaymentNotification(body, order)
  if (decision.action === 'reject') {
    return res.status(decision.status).json({ error: decision.error })
  }
  if (decision.action === 'fulfill') {
    setOrderStatus(order.id, 'paid')
    fulfillOrder(order)
  } else if (decision.action === 'fail') {
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
