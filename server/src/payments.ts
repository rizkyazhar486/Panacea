import type { Request, Response } from 'express'
import crypto from 'node:crypto'
// midtrans-client is CommonJS
import midtransClient from 'midtrans-client'
import { config, features } from './config.js'
import { credit, createOrder, getOrder, setOrderStatus, getUser, saveSettings, isEarlyAdopter, EARLY_ADOPTER_DISCOUNT, CLINICAL_CALC_PRICE_IDR, uid, type User } from './store.js'
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
    notify(order.userId, { title: 'Langganan aktif ✅', body: 'Pemantauan Kronis & Longevity Anda telah aktif.', url: './#/nutrition' }, 'notifTransactions').catch(() => {})
  } else {
    credit(order.userId, order.amountPnc, 'deposit', `Top-up ${order.amountPnc} PNC via ${order.method}`, order.id)
    notify(order.userId, { title: 'Pembayaran berhasil ✅', body: `${order.amountPnc} PNC telah ditambahkan ke saldo Anda.`, url: './#/billing' }, 'notifTransactions').catch(() => {})
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

// Real Midtrans webhook (HTTP notification). Verifies signature, credits wallet.
export function paymentWebhook(req: Request, res: Response) {
  const body = req.body as Record<string, string>
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body
  if (!order_id) return res.status(400).json({ error: 'bad_request' })
  const expected = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + config.midtrans.serverKey)
    .digest('hex')
  if (signature_key !== expected) return res.status(403).json({ error: 'bad_signature' })

  const order = getOrder(order_id)
  if (!order) return res.status(404).json({ error: 'order_not_found' })

  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    if (order.status !== 'paid') {
      setOrderStatus(order.id, 'paid')
      fulfillOrder(order)
    }
  } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
    setOrderStatus(order.id, 'failed')
  }
  res.json({ ok: true })
}

export function orderStatus(req: Request, res: Response) {
  const order = getOrder(req.params.orderId)
  if (!order) return res.status(404).json({ error: 'order_not_found' })
  res.json({ status: order.status })
}
