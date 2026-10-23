import assert from 'node:assert/strict'
import { readToolkitStorage, writeToolkitStorage, toolkitStorageKey } from '../../src/domains/personal-health/adapters/toolkitStorage.ts'
import { sanitizeMinutes, sanitizeRoutine, sanitizeSymptoms } from '../../src/domains/personal-health/engine/toolkitData.ts'
import { bindPersonalHealthAccount, parsePersonalHealthStorageScope } from '../../src/shared/kernel/personalHealthStorageScope.ts'
const memory = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } })
const setSession = (id: string, age = 0) => {
  const account = { id, patientId: `self-${id}` }
  const raw = JSON.stringify({ account, loginAt: Date.now() - age })
  memory.set('panaceamed.session.v1', raw)
  bindPersonalHealthAccount(account)
  const scope = parsePersonalHealthStorageScope(raw, Date.now())
  assert.equal(scope.kind, 'account')
  return scope as Extract<typeof scope, { kind: 'account' }>
}
const key = 'pmd_symptom_map_v1'
const entry = { t: 1, region: 'Chest', severity: 0, note: 'synthetic private log' }
memory.set(key, JSON.stringify([entry]))
const a = setSession('a')
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [], 'unowned legacy must not migrate')
assert.equal(writeToolkitStorage(key, a, [entry]), true)
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [entry])
const b = setSession('b')
assert.notEqual(toolkitStorageKey(key, a), toolkitStorageKey(key, b))
assert.deepEqual(readToolkitStorage(key, b, sanitizeSymptoms), [])
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [], 'stale read denied')
assert.equal(writeToolkitStorage(key, a, []), false, 'stale callback cannot write into either account')
bindPersonalHealthAccount({ id: 'a', patientId: 'self-a' })
assert.equal(writeToolkitStorage(key, b, [entry]), false, 'cross-tab remembered identity must match mounted account')
setSession('a')
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [entry])
memory.set('panaceamed.session.v1', JSON.stringify({ account: { id: 'a', patientId: 'self-a' }, loginAt: Date.now() - 8 * 86400000 }))
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [])
assert.equal(writeToolkitStorage(key, a, []), false)
memory.set('panaceamed.session.v1', '{bad')
assert.equal(writeToolkitStorage(key, a, []), false)
memory.delete('panaceamed.session.v1')
assert.equal(writeToolkitStorage(key, null, [entry]), false, 'guest never persists personal data')
assert.deepEqual(readToolkitStorage(key, null, sanitizeSymptoms), [])
assert.deepEqual(JSON.parse(memory.get(key)!), [entry], 'legacy unchanged')
setSession('a')
memory.set(toolkitStorageKey(key, a), '{broken')
assert.deepEqual(readToolkitStorage(key, a, sanitizeSymptoms), [])
for (const bad of [null, {}, 'wrong', [null, {}, { ...entry, severity: NaN }, { ...entry, t: Infinity }, { ...entry, note: 3 }, { ...entry, region: 'unknown' }]]) assert.deepEqual(sanitizeSymptoms(bad), [])
assert.equal(sanitizeSymptoms(Array(35).fill(entry)).length, 30)
assert.deepEqual(sanitizeRoutine({ morning: ['Cleanser', 'Cleanser', 'unknown', null], night: 'wrong' }), { morning: ['Cleanser'], night: [] })
assert.deepEqual(sanitizeMinutes({ '2026-10-12': 0, '2026-10-11': 1440, invalid: 30, '2026-10-10': -1, '2026-10-09': Infinity, '2026-10-08': '60' }), { '2026-10-12': 0, '2026-10-11': 1440 })
bindPersonalHealthAccount(undefined)
console.log('Body Toolkit: account, subject, stale callback, expiry, guest, legacy and corrupt-cache regressions PASS')
