// C2: kolom indeks gesekan yang kosong atau tidak valid bukan nol.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { parseFrictionField: pf, parseFriction, FRICTION_KEYS } = await import('../../src/components/dashboard/frictionInputs.ts')
const ok = { waitingHours: '24', travelMinutes: '45', outOfPocketCost: '250000', monthlyDisposableBudget: '2000000', numberOfSteps: '3', missedWorkHours: '2' }
assert.deepEqual(parseFriction(ok as any, 1), { digitalBarrier: 1, waitingHours: 24, travelMinutes: 45, outOfPocketCost: 250000, monthlyDisposableBudget: 2000000, numberOfSteps: 3, missedWorkHours: 2 })
assert.equal(pf('waitingHours', '0'), 0, 'nol yang diketik adalah nol sungguhan')
for (const k of FRICTION_KEYS) for (const bad of ['', '  ', 'abc', 'NaN', 'Infinity', '-1', '1e99', undefined, 5])
  assert.equal(pf(k, bad as any), undefined, `${k} ${JSON.stringify(bad)} tidak valid`)
assert.equal(pf('monthlyDisposableBudget', '0'), undefined, 'anggaran minimal 1'); assert.equal(pf('numberOfSteps', '0'), undefined, 'langkah minimal 1')
assert.equal(pf('monthlyDisposableBudget', '1'), 1); assert.equal(pf('waitingHours', '8760'), 8760); assert.equal(pf('waitingHours', '8761'), undefined)
for (const k of FRICTION_KEYS) assert.equal(parseFriction({ ...ok, [k]: '' } as any, 1), null, `${k} kosong → tidak ada indeks`)
const page = readFileSync('src/components/dashboard/HealthGapNavigator.tsx', 'utf8')
assert.doesNotMatch(page, /Number\.isFinite\(value\) \? value : 0/); assert.match(page, /friction \? friction\.score : '—'/); assert.match(page, /enter all fields/); assert.match(page, /frictionInput \? careFriction\(frictionInput\) : null/)
assert.match(page, /value=\{frictionText\.waitingHours\}/)
console.log('friction-blank-input: ok')
