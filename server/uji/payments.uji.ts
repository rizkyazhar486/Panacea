import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  nextPaymentOrderStatus,
  orderStatus,
  paymentNotificationGate,
  paymentWebhook,
  verifyMidtransSignature,
  visibleOrderStatus,
} from '../src/payments'

const ownOrder = { userId: 'user-a', status: 'pending' as const }
const paidOrder = { userId: 'user-a', status: 'paid' as const }
const foreignOrder = { userId: 'user-b', status: 'failed' as const }

assert.equal(visibleOrderStatus(ownOrder, 'user-a'), 'pending')
assert.equal(visibleOrderStatus(paidOrder, 'user-a'), 'paid')
assert.equal(visibleOrderStatus(foreignOrder, 'user-a'), undefined)
assert.equal(visibleOrderStatus(undefined, 'user-a'), undefined)

let statusCode = 200
let responseBody: unknown
const res = {
  status(code: number) { statusCode = code; return this },
  json(body: unknown) { responseBody = body; return this },
}

orderStatus({ headers: {}, cookies: {}, params: { orderId: 'PMD-unknown' } } as any, res as any)
assert.equal(statusCode, 401)
assert.deepEqual(responseBody, { error: 'unauthorized' })

const TEST_SERVER_KEY = 'ci-only-midtrans-server-key'
function signedBody(overrides: Record<string, string> = {}) {
  const body: Record<string, string> = {
    order_id: 'PMD-test-order',
    status_code: '200',
    gross_amount: '1000.00',
    transaction_status: 'capture',
    fraud_status: 'accept',
    currency: 'IDR',
    ...overrides,
  }
  body.signature_key = crypto
    .createHash('sha512')
    .update(body.order_id + body.status_code + body.gross_amount + TEST_SERVER_KEY)
    .digest('hex')
  return body
}

// Signature authenticity is independent from order-state logic and uses only a
// CI-local key. No real Midtrans credentials or transaction calls are involved.
{
  const body = signedBody()
  assert.equal(verifyMidtransSignature(body, TEST_SERVER_KEY), true)
  assert.equal(verifyMidtransSignature({ ...body, signature_key: body.signature_key.toUpperCase() }, TEST_SERVER_KEY), true)
  assert.equal(verifyMidtransSignature({ ...body, gross_amount: '999.00' }, TEST_SERVER_KEY), false)
  assert.equal(verifyMidtransSignature({ ...body, signature_key: 'deadbeef' }, TEST_SERVER_KEY), false)
  assert.equal(verifyMidtransSignature({ ...body, status_code: '' }, TEST_SERVER_KEY), false)
}

// Signed success notifications must still match the server-created order and
// Midtrans success/fraud invariants before they can grant value.
{
  const order = { amountIdr: 1000 }
  assert.deepEqual(paymentNotificationGate(signedBody(), order), { kind: 'accept' })
  assert.deepEqual(
    paymentNotificationGate(signedBody({ gross_amount: '999.00' }), order),
    { kind: 'reject', reason: 'amount_mismatch' },
  )
  assert.deepEqual(
    paymentNotificationGate(signedBody({ currency: 'USD' }), order),
    { kind: 'reject', reason: 'currency_mismatch' },
  )
  assert.deepEqual(
    paymentNotificationGate(signedBody({ status_code: '201' }), order),
    { kind: 'ignore', reason: 'status_not_success' },
  )
  assert.deepEqual(
    paymentNotificationGate(signedBody({ fraud_status: 'challenge' }), order),
    { kind: 'ignore', reason: 'fraud_not_accepted' },
  )
  const settlementWithoutFraud = signedBody({ transaction_status: 'settlement', fraud_status: '' })
  assert.deepEqual(paymentNotificationGate(settlementWithoutFraud, order), { kind: 'accept' })

  // Failure notifications may transition a pending order to failed, but a late
  // failure must never downgrade a paid order after value has been fulfilled.
  assert.equal(nextPaymentOrderStatus('pending', 'capture', true), 'paid')
  assert.equal(nextPaymentOrderStatus('paid', 'capture', true), undefined)
  assert.equal(nextPaymentOrderStatus('pending', 'deny', true), 'failed')
  assert.equal(nextPaymentOrderStatus('paid', 'deny', true), undefined)
  assert.equal(nextPaymentOrderStatus('failed', 'settlement', true), 'paid')
  assert.equal(nextPaymentOrderStatus('pending', 'capture', false), undefined)
}

// The HTTP handler must reject malformed/forged notifications before looking up
// an order. This exercises the security boundary without creating any order or
// contacting Midtrans.
{
  statusCode = 200
  responseBody = undefined
  paymentWebhook({ body: { order_id: 'PMD-test-order' } } as any, res as any)
  assert.equal(statusCode, 400)
  assert.deepEqual(responseBody, { error: 'bad_request' })

  statusCode = 200
  responseBody = undefined
  paymentWebhook({ body: { ...signedBody(), signature_key: 'forged' } } as any, res as any)
  assert.equal(statusCode, 403)
  assert.deepEqual(responseBody, { error: 'bad_signature' })
}

console.log('Payment ownership, notification authenticity and state-transition boundaries verified.')
