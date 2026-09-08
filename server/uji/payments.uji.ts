import assert from 'node:assert/strict'
import { orderStatus, visibleOrderStatus } from '../src/payments'

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

console.log('Payment order-status ownership boundary verified.')
