import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  normalizeProductEventInput,
  summarizeProductEvents,
  type ProductEvent,
} from '../../server/src/productLearning.ts'

function event(userId: string, name: ProductEvent['name'], day: number, target?: string): ProductEvent {
  const at = new Date(Date.UTC(2026, 8, 1 + day, 12, 0, 0)).toISOString()
  return { id: `${userId}-${name}-${day}`, userId, name, surface: 'home', ...(target ? { target } : {}), at }
}

const normalized = normalizeProductEventInput({
  name: 'health_brief_view',
  surface: 'home_health_brief',
  target: 'steps',
  value: 187,
  bpm: 187,
  diagnosis: 'sensitive-free-text',
  arbitrary: { secret: true },
}, Date.UTC(2026, 8, 1))

assert.ok(normalized)
assert.equal(normalized?.name, 'health_brief_view')
assert.equal(normalized?.surface, 'home_health_brief')
assert.equal(normalized?.target, 'steps')
assert.equal('value' in (normalized as object), false)
assert.equal('bpm' in (normalized as object), false)
assert.equal('diagnosis' in (normalized as object), false)
assert.equal('arbitrary' in (normalized as object), false)
assert.equal(normalizeProductEventInput({ name: 'unknown', surface: 'home' }), null)
assert.equal(normalizeProductEventInput({ name: 'feature_open', surface: 'home', target: 'contains spaces and free text' }), null)

const now = Date.UTC(2026, 8, 10, 12, 0, 0)
const events: ProductEvent[] = [
  event('u1', 'health_brief_view', 0),
  event('u1', 'quick_action_open', 0, 'ask'),
  event('u1', 'health_brief_view', 1),
  event('u1', 'health_brief_view', 7),
  event('u2', 'health_brief_view', 0),
  event('u2', 'health_brief_view', 1),
  event('u3', 'feature_open', 0, 'body-3d'),
]

const summary = summarizeProductEvents(events, now)
assert.equal(summary.usersObserved, 3)
assert.equal(summary.activatedUsers, 1)
assert.equal(summary.activationRatePct, 33.3)
assert.equal(summary.repeatUsers7d >= 1, true)
assert.deepEqual(summary.retention.find((x) => x.day === 1), {
  day: 1,
  eligible: 3,
  retained: 2,
  ratePct: 66.7,
})
assert.deepEqual(summary.retention.find((x) => x.day === 7), {
  day: 7,
  eligible: 3,
  retained: 1,
  ratePct: 33.3,
})
assert.match(summary.definition.privacy, /No health measurements/)

const clientSource = await readFile(new URL('../../src/lib/productLearning.ts', import.meta.url), 'utf8')
for (const forbidden of ['heartRate:', 'diagnosis:', 'symptomText:', 'labValue:']) {
  assert.equal(clientSource.includes(forbidden), false, `client analytics must not define ${forbidden}`)
}
assert.match(clientSource, /experiment_exposure/)
assert.match(clientSource, /trackProductEvents/)

console.log('product learning engine: OK')
