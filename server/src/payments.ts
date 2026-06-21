import type { Request, Response } from 'express'
import crypto from 'node:crypto'
// midtrans-client is CommonJS
import midtransClient from 'midtrans-client'
import { config, features } from './config.js'
import { credit, createOrder, getOrder, setOrderStatus, getUser, saveSettings, uid, type User } from './store.js'
import { notify } from './push.js'
import { sendReceipt } from './email.js'

// Chronic-care subscription prices (IDR) — paid directly, not via PNC.
const CHRONIC_PRICE: Record<string, number> = { chronic_monthly: 50000, chronic_lifetime: 7500000 }

// Activate a chronic subscription in the user's server-side settings.
function activateChronic(userId: string, purpose: string) {
  if (purpose === 'chronic_lifetime') saveSettings(userId, { chronicLifetime: true })
  else if (purpose === 'chronic_monthly') saveSettings(userId, { chronicSubExpires: new Date(Date.now() + 30 * 86400000).toISOString() })
}

// Apply a successful order: chronic subscriptions activate access; others credit PNC.
function fulfillOrder(order: { id: string; userId: string; amountPnc: number; amountIdr: number; method: string; purpose?: string }) {
  if (order.purpose && order.purpose.startsWith('chronic')) {
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
  const isChronic = !!purpose && purpose in CHRONIC_PRICE
  const pnc = isChronic ? 0 : Math.max(1, Math.floor(Number(amountPnc) || 0))
  const amountIdr = isChronic ? CHRONIC_PRICE[purpose!] : pnc * config.tokenToIdr
  const orderId = 'PMD-' + uid().slice(0, 14)
  createOrder({ id: orderId, userId: user.id, amountPnc: pnc, amountIdr, method: method || 'QRIS', status: 'pending', createdAt: new Date().toISOString(), purpose: purpose || 'topup' })

  if (!snap) {
    // Mock mode: frontend calls /confirm to simulate a successful gateway callback.
    return res.json({ live: false, orderId, amountPnc: pnc, amountIdr, method, mock: true })
  }
  try {
    const item = isChronic
      ? { id: purpose!, price: amountIdr, quantity: 1, name: purpose === 'chronic_lifetime' ? 'Pemantauan Kronis Lifetime' : 'Pemantauan Kronis 30 hari' }
      : { id: 'PNC', price: config.tokenToIdr, quantity: pnc, name: 'PanaceaToken' }
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
