import assert from 'node:assert/strict'
import { foodLogToLongitudinalEvents } from '../../src/lib/healthStoreLongitudinalBridge.ts'
import { projectLongitudinalSnapshot, emptyLongitudinalServer } from '../../src/lib/longitudinalSnapshot.ts'
import { labelMetrik } from '../../src/lib/perubahanLongitudinal.ts'
import type { Account, FoodEntry } from '../../src/lib/types.ts'

const consent = { granted: true, purposes: ['personal-visualization'] as const, grantedAt: '1970-01-01T00:00:00.000Z' }
const receivedAt = '2026-09-30T03:00:00.000Z'
const ctx = { consent, receivedAt, confidence: 1 }

const food = (partial: Partial<FoodEntry> & Pick<FoodEntry, 'id' | 'date'>): FoodEntry => ({
  name: 'rice', grams: 100, kcal: 0, protein: 0, carbs: 0, fat: 0, ...partial,
})

{
  const { events, skipped } = foodLogToLongitudinalEvents('p1', [
    food({ id: 'a', date: '2026-09-29', kcal: 200, protein: 10, carbs: 30, fat: 5 }),
    food({ id: 'b', date: '2026-09-29', kcal: 50, protein: 4.5, carbs: 0, fat: 1 }),
  ], ctx)
  const protein = events.find((e) => e.metric === 'nutrition.dietary-protein')
  assert.equal(protein?.value, 14.5)
  assert.equal(protein?.unit, 'g')
  assert.equal(protein?.domain, 'nutrition')
  assert.equal(protein?.provenance.method, 'nutrition-food-log')
  assert.equal(protein?.provenance.sourceKind, 'manual')
  assert.equal(events.find((e) => e.metric === 'nutrition.dietary-energy')?.value, 250)
  assert.equal(events.find((e) => e.metric === 'nutrition.dietary-carbohydrate')?.value, 30)
  assert.equal(events.find((e) => e.metric === 'nutrition.dietary-fat')?.value, 6)
  assert.equal(events.filter((e) => e.metric === 'dietary-protein').length, 0, 'food log must not reuse the device diet metric')
  assert.equal(skipped.filter((s) => s.reason === 'invalid-number' && s.field === 'carbs').length, 1)
}

{
  const before = foodLogToLongitudinalEvents('p1', [
    food({ id: 'bad', date: '2026-09-29', kcal: 10, protein: -3 }),
  ], ctx)
  assert.equal(before.events.find((e) => e.metric === 'nutrition.dietary-protein'), undefined)
  assert.equal(before.events.find((e) => e.metric === 'nutrition.dietary-energy')?.value, 10)
  assert.ok(before.skipped.some((s) => s.field === 'protein' && s.reason === 'invalid-number'))
}

{
  const future = foodLogToLongitudinalEvents('p1', [
    food({ id: 'fut', date: '2026-10-02', kcal: 400, protein: 20 }),
  ], ctx)
  assert.equal(future.events.length, 0)
  assert.equal(future.skipped[0]?.sourceRecordId, 'fut')
}

{
  const pagi = foodLogToLongitudinalEvents('p1', [
    food({ id: 'today', date: '2026-09-30', kcal: 80, protein: 8 }),
  ], ctx)
  const energy = pagi.events.find((e) => e.metric === 'nutrition.dietary-energy')
  assert.equal(energy?.value, 80)
  assert.equal(energy?.recordedAt, receivedAt, 'local today ahead of noon UTC clamps to receivedAt')
}

{
  const batas = foodLogToLongitudinalEvents('p1', [
    food({ id: 'edge', date: '2026-10-01', kcal: 1, protein: 1 }),
  ], ctx)
  assert.equal(batas.events.length, 2, 'one calendar day ahead of UTC is accepted')
  assert.equal(batas.events[0]?.recordedAt, receivedAt)
}

assert.throws(() => foodLogToLongitudinalEvents('  ', [], ctx), /subjectId/)
assert.throws(() => foodLogToLongitudinalEvents('p1', [], { ...ctx, confidence: 2 }), /confidence/)
assert.equal(labelMetrik('nutrition.dietary-protein'), 'Logged protein')

{
  const account = { patientId: 'p1', email: 'qa@localhost.test', role: 'pasien' } as Account
  const snap = projectLongitudinalSnapshot({
    app: {
      account,
      vitals: {},
      selfVitals: [],
      vo2maxLog: [],
      foods: [food({ id: 'a', date: '2026-09-29', kcal: 100, protein: 12, carbs: 1, fat: 1 })],
    },
    local: { owner: account, vitals: {}, labs: {} },
    server: emptyLongitudinalServer(),
  }, receivedAt)
  const metrics = Object.values(snap.state?.eventsById ?? {}).map((e) => e.metric)
  assert.ok(metrics.includes('nutrition.dietary-protein'))
  assert.equal(Object.values(snap.state?.eventsById ?? {}).find((e) => e.metric === 'nutrition.dietary-protein')?.value, 12)
}

console.log('makanan-longitudinal: food log totals enter canonical state as nutrition metrics, not device diet')
