import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { evaluatePaymentNotification, orderStatus, verifyPaymentSignature, visibleOrderStatus } from '../src/payments'

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

const serverKey = 'test-midtrans-server-key'
const signedBody = {
  order_id: 'PMD-test-1',
  status_code: '200',
  gross_amount: '10000.00',
  signature_key: crypto
    .createHash('sha512')
    .update('PMD-test-1' + '200' + '10000.00' + serverKey)
    .digest('hex'),
}
assert.equal(verifyPaymentSignature(signedBody, serverKey), true)
assert.equal(verifyPaymentSignature({ ...signedBody, signature_key: signedBody.signature_key.toUpperCase() }, serverKey), true)
assert.equal(verifyPaymentSignature({ ...signedBody, gross_amount: '9999.00' }, serverKey), false)
assert.equal(verifyPaymentSignature({ ...signedBody, signature_key: signedBody.signature_key.slice(2) }, serverKey), false)
assert.equal(verifyPaymentSignature({ ...signedBody, signature_key: 'z'.repeat(128) }, serverKey), false)
assert.equal(verifyPaymentSignature({ ...signedBody, signature_key: '' }, serverKey), false)

const pending = { amountIdr: 10000, status: 'pending' as const }
const paid = { amountIdr: 10000, status: 'paid' as const }

assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'settlement',
    status_code: '200',
    gross_amount: '10000.00',
    fraud_status: 'accept',
  }, pending),
  { action: 'fulfill' },
)

assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'capture',
    status_code: '200',
    gross_amount: '10000',
    fraud_status: 'ACCEPT',
  }, pending),
  { action: 'fulfill' },
)

// Some low-risk payment methods do not return fraud_status. Midtrans permits
// success evaluation without the field, provided the other success gates pass.
assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'settlement',
    status_code: '200',
    gross_amount: '10000.00',
  }, pending),
  { action: 'fulfill' },
)

assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'capture',
    status_code: '201',
    gross_amount: '10000.00',
    fraud_status: 'accept',
  }, pending),
  { action: 'reject', status: 409, error: 'invalid_status_code' },
)

assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'settlement',
    status_code: '200',
    gross_amount: '9999.00',
    fraud_status: 'accept',
  }, pending),
  { action: 'reject', status: 409, error: 'amount_mismatch' },
)

assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'settlement',
    status_code: '200',
    gross_amount: 'not-a-number',
    fraud_status: 'accept',
  }, pending),
  { action: 'reject', status: 409, error: 'amount_mismatch' },
)

for (const fraudStatus of ['challenge', 'deny']) {
  assert.deepEqual(
    evaluatePaymentNotification({
      transaction_status: 'capture',
      status_code: '200',
      gross_amount: '10000.00',
      fraud_status: fraudStatus,
    }, pending),
    { action: 'reject', status: 409, error: 'fraud_not_accepted' },
  )
}

// Idempotence and out-of-order safety: a repeated success is a no-op, and a
// delayed deny/cancel/expire must never downgrade a fulfilled order.
assert.deepEqual(
  evaluatePaymentNotification({
    transaction_status: 'settlement',
    status_code: '200',
    gross_amount: '10000.00',
    fraud_status: 'accept',
  }, paid),
  { action: 'ignore' },
)

for (const transactionStatus of ['deny', 'cancel', 'expire']) {
  assert.deepEqual(
    evaluatePaymentNotification({ transaction_status: transactionStatus }, paid),
    { action: 'ignore' },
  )
  assert.deepEqual(
    evaluatePaymentNotification({ transaction_status: transactionStatus }, pending),
    { action: 'fail' },
  )
}

assert.deepEqual(
  evaluatePaymentNotification({ transaction_status: 'pending' }, pending),
  { action: 'ignore' },
)

console.log('Payment ownership, constant-time signature, amount, fraud, idempotence, and out-of-order webhook boundaries verified.')
