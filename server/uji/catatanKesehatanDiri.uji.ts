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

const { validasiDiarySleep, validasiDiaryFoods, validasiDiaryWellness, bacaDiarySleep } = await import('../src/catatanKesehatanDiri.ts')
const tidur = validasiDiarySleep([
  { id: 's1', date: '2026-09-28', hours: 7.5, bedtimeConsistent: true },
  { id: 's1', date: '2026-09-27', hours: 6, bedtimeConsistent: false },
])
assert.equal(tidur.length, 1)
assert.equal(tidur[0].hours, 7.5)
assert.equal(validasiDiarySleep([{ id: 's0', date: '2026-09-28', hours: 0, bedtimeConsistent: false }])[0].hours, 0)
assert.throws(() => validasiDiarySleep([{ id: 's1', date: '2026-09-28', hours: 24.1, bedtimeConsistent: true }]), /invalid sleep/)
assert.throws(() => validasiDiarySleep('nope'), /list/)
assert.throws(() => validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: ' ', grams: 100, kcal: 10, protein: 1, carbs: 1, fat: 1 }]), /invalid food/)
assert.throws(() => validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: 'rice', grams: 100, kcal: 0, protein: 0, carbs: 0, fat: 0 }]), /invalid food/)
const makan = validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: ' rice ', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 }])
assert.equal(makan[0].name, 'rice')
assert.equal(makan[0].fat, 0)
assert.throws(() => validasiDiaryWellness([{ date: '2026-09-28', waterMl: -1 }]), /water/)
const hari = validasiDiaryWellness([
  { date: '2026-09-28', waterMl: 1800 },
  { date: '2026-09-28', sleepHr: 8 },
  { date: '2026-09-27' },
])
assert.equal(hari.length, 1)
assert.equal(hari[0].waterMl, 1800)
assert.deepEqual(bacaDiarySleep({ diarySleep: [{ id: 'bad' }] }), [])

console.log('catatanKesehatanDiri: self-vital and vo2max lists validate fail-closed')
