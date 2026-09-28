import assert from 'node:assert/strict'
import { normalizeProductEventInput, summarizeProductEvents, type ProductEvent } from '../../server/src/productLearning.ts'

const normalized = normalizeProductEventInput({
  name: 'feature_open', surface: 'home', target: 'body-3d',
  heartRate: 187, diagnosis: 'secret', note: 'free text', arbitrary: { secret: true },
}, Date.UTC(2026, 8, 1))
assert.ok(normalized)
assert.deepEqual(Object.keys(normalized).sort(), ['at', 'name', 'surface', 'target'])
assert.equal(normalizeProductEventInput({ name: 'unknown', surface: 'home' }), null)
assert.equal(normalizeProductEventInput({ name: 'feature_open', surface: 'contains spaces' }), null)
assert.equal(normalizeProductEventInput({ name: 'feature_open', surface: 'home', target: 'free text spaces' }), null)

const event = (userId: string, name: ProductEvent['name'], day: number): ProductEvent => ({
  id: userId + name + day, userId, name, surface: 'home',
  at: new Date(Date.UTC(2026, 8, 1 + day, 12)).toISOString(),
})
const summary = summarizeProductEvents([
  event('u1','health_brief_view',0), event('u1','feature_open',0),
  event('u1','health_brief_view',1), event('u1','health_brief_view',7),
  event('u2','health_brief_view',0), event('u2','health_brief_view',1),
], Date.UTC(2026,8,10,12))
assert.equal(summary.usersObserved, 2)
assert.equal(summary.activatedUsers, 1)
assert.equal(summary.activationRatePct, 50)
assert.deepEqual(summary.retention.find(x=>x.day===1), {day:1,eligible:2,retained:2,ratePct:100})
assert.deepEqual(summary.retention.find(x=>x.day===7), {day:7,eligible:2,retained:1,ratePct:50})
assert.match(summary.definition.privacy, /No health measurements/)
console.log('product-learning-engine: categorical allowlist and cohort math verified')
