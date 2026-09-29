import assert from 'node:assert/strict'
import { bacaSelfVitalsLog, bacaVo2maxLog, validasiSelfVitalsLog, validasiVo2maxLog } from '../src/catatanKesehatanDiri.ts'

const ok = validasiSelfVitalsLog([
  { id: 'a1', at: '2026-09-28T10:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 },
])
assert.equal(ok.length, 1)
assert.equal(ok[0].systolic, 120)

assert.throws(() => validasiSelfVitalsLog([{ id: 'x', at: '2026-09-28T10:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98 }]), /incomplete/)
assert.throws(() => validasiSelfVitalsLog([{ id: 'x', at: 'nope', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 }]), /time/)
assert.throws(() => validasiVo2maxLog([{ id: 'v1', at: '2026-09-28T10:00:00.000Z', value: 0, method: 'x' }]), /value/)

const vo2 = validasiVo2maxLog([
  { id: 'v1', at: '2026-09-28T10:00:00.000Z', value: 42.5, method: 'Cooper' },
  { id: 'v1', at: '2026-09-27T10:00:00.000Z', value: 40, method: 'dup' },
])
assert.equal(vo2.length, 1, 'duplicate ids keep the first occurrence after sort input order dedupe')

assert.deepEqual(bacaSelfVitalsLog({ selfVitalsLog: 'bad' }), [])
assert.deepEqual(bacaVo2maxLog({ vo2maxEntries: [{ id: 'bad' }] }), [])

console.log('catatanKesehatanDiri: self-vital and vo2max lists validate fail-closed')
