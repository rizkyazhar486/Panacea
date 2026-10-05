import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const { getVitals, mergeVitals } = await import('../../src/lib/healthVitals.ts')

test('partial wearable updates never reattribute another account or unbound cache', async (t) => {
  t.mock.method(Date, 'now', () => 1791104400000)
  const values = new Map()
  const oldStorage = globalThis.localStorage
  const oldChannel = globalThis.BroadcastChannel
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  globalThis.BroadcastChannel = undefined
  const login = (id, patientId) => values.set('panaceamed.session.v1', JSON.stringify({ account: { id, patientId }, loginAt: Date.now() }))
  try {
    login('doctor-a', 'patient-a')
    const a = mergeVitals({ heartRate: 173, source: 'Device', measuredAt: '2026-10-04T09:00:00Z' })
    assert.equal(a.ownerAccountId, 'doctor-a')
    assert.equal(a.subjectId, 'patient-a')
    assert.equal(getVitals().heartRate, 173)
    login('doctor-b', 'patient-b')
    const b = mergeVitals({ weightKg: 68, subjectId: 'patient-a', ownerAccountId: 'doctor-a' })
    assert.equal(b.subjectId, 'patient-b')
    assert.equal(b.ownerAccountId, 'doctor-b')
    assert.equal(b.heartRate, undefined)
    assert.equal(b.weightKg, 68)
    assert.equal(mergeVitals({ heartRate: 72 }).weightKg, 68)
    // Corrupt the active namespace, rather than an unrelated quarantined legacy key.
    values.set(`pmd_vitals_scope_v1:${encodeURIComponent(JSON.stringify(['doctor-b', 'patient-b']))}`, JSON.stringify({ heartRate: 199 }))
    assert.equal(mergeVitals({ weightKg: 70 }).heartRate, undefined)
    values.delete('panaceamed.session.v1')
    const anonymous = mergeVitals({ heartRate: 60, subjectId: 'patient-b', ownerAccountId: 'doctor-b' })
    assert.equal(anonymous.subjectId, undefined)
    assert.equal(anonymous.ownerAccountId, undefined)
    assert.equal(anonymous.weightKg, undefined)
    for (const session of ['{', JSON.stringify({ account: { id: 'doctor-b', patientId: 'patient-b' }, loginAt: Date.now() + 1 }), JSON.stringify({ account: { id: 'doctor-b', patientId: 'patient-b' }, loginAt: Date.now() - 7 * 86400000 - 1 }), JSON.stringify({ account: { id: '', patientId: 'patient-b' }, loginAt: Date.now() })]) {
      values.set('panaceamed.session.v1', session)
      const unbound = mergeVitals({ heartRate: 61 })
      assert.equal(unbound.subjectId, undefined)
      assert.equal(unbound.ownerAccountId, undefined)
    }
    login('doctor-b', 'patient-b')
    values.set('panaceamed.session.v1', JSON.stringify({ account: { id: 'doctor-b', patientId: 'patient-b' }, loginAt: Date.now() - 7 * 86400000 }))
    assert.equal(mergeVitals({ heartRate: 62 }).subjectId, 'patient-b')
    await import('../../src/lib/riwayatVitals.ts')
    await new Promise(resolve => setImmediate(resolve))
  } finally {
    globalThis.localStorage = oldStorage
    globalThis.BroadcastChannel = oldChannel
  }
})
