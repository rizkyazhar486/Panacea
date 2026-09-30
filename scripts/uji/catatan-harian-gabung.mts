import assert from 'node:assert/strict'
import { barisBelumAda, tampilkanWellness, wellnessBelumAda } from '../../src/lib/homeCrossTabDailyState.ts'

const akunTidur = [{ id: 's1', date: '2026-09-28', hours: 7 }]
const lokalTidur = [
  { id: 's1', date: '2026-09-28', hours: 4 },
  { id: 's2', date: '2026-09-29', hours: 8 },
  { id: '', date: '2026-09-30', hours: 6 },
]
const belum = barisBelumAda(akunTidur, lokalTidur)
assert.deepEqual(belum.map((r) => r.id), ['s2'])
assert.deepEqual(barisBelumAda(akunTidur, [{ id: 's1', date: '2026-09-28', hours: 7 }]), [])
assert.deepEqual(barisBelumAda([], lokalTidur).map((r) => r.id), ['s1', 's2'])

const akunHari = [{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }]
assert.deepEqual(wellnessBelumAda(akunHari, {
  '2026-09-28': { date: '2026-09-28', waterMl: 200, sleepHr: 5 },
}), [])
assert.deepEqual(wellnessBelumAda(akunHari, {
  '2026-09-28': { date: '2026-09-28', waterMl: 1800 },
  '2026-09-29': { date: '2026-09-29', waterMl: 1500 },
}), [{ date: '2026-09-29', waterMl: 1500 }])
assert.deepEqual(wellnessBelumAda([{ date: '2026-09-28', waterMl: 1800 }], {
  '2026-09-28': { date: '2026-09-28', sleepHr: 7, waterMl: 100 },
}), [{ date: '2026-09-28', sleepHr: 7 }])

const tampil = tampilkanWellness(akunHari, {
  '2026-09-28': { date: '2026-09-28', waterMl: 200, sleepHr: 5, exerciseMin: 20 },
  '2026-09-30': { date: '2026-09-30', exerciseMin: 15 },
})
assert.equal(tampil['2026-09-28'].waterMl, 1800)
assert.equal(tampil['2026-09-28'].sleepHr, 7)
assert.equal(tampil['2026-09-28'].exerciseMin, 20)
assert.equal(tampil['2026-09-30'].exerciseMin, 15)
assert.equal(tampilkanWellness(null, { '2026-09-30': { date: '2026-09-30', waterMl: 1 } })['2026-09-30'].waterMl, 1)

console.log('catatan-harian-gabung: second device adds rows without replacing the account')
