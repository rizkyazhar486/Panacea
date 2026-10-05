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
const airNol = tampilkanWellness(
  [{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }],
  { '2026-09-28': { date: '2026-09-28', waterMl: 0, sleepHr: 7 } },
)
assert.equal(airNol['2026-09-28'].waterMl, 0)
assert.equal(airNol['2026-09-28'].sleepHr, 7)
const tidurNol = tampilkanWellness(
  [{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }],
  { '2026-09-28': { date: '2026-09-28', waterMl: 1800, sleepHr: 0 } },
)
assert.equal(tidurNol['2026-09-28'].sleepHr, 0)
assert.equal(tidurNol['2026-09-28'].waterMl, 1800)
assert.deepEqual(wellnessBelumAda([{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }], {
  '2026-09-28': { date: '2026-09-28', waterMl: 1800, sleepHr: 0 },
}), [{ date: '2026-09-28', sleepHr: 0 }])
assert.deepEqual(wellnessBelumAda([], {
  '2026-09-28': { date: '2026-09-28', sleepHr: 0 },
}), [])
const airNaik = tampilkanWellness(
  [{ date: '2026-09-28', waterMl: 1800 }],
  { '2026-09-28': { date: '2026-09-28', waterMl: 500 } },
)
assert.equal(airNaik['2026-09-28'].waterMl, 1800)
assert.deepEqual(wellnessBelumAda([{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }], {
  '2026-09-28': { date: '2026-09-28', waterMl: 0, sleepHr: 7 },
}), [{ date: '2026-09-28', waterMl: 0 }])
assert.deepEqual(wellnessBelumAda([{ date: '2026-09-28', waterMl: 1800 }], {
  '2026-09-28': { date: '2026-09-28', waterMl: 2200 },
}), [{ date: '2026-09-28', waterMl: 2200 }])
assert.equal(tampilkanWellness(null, { '2026-09-30': { date: '2026-09-30', waterMl: 1 } })['2026-09-30'].waterMl, 1)

const { makananTampil, tidurTampil } = await import('../../src/lib/homeCrossTabDailyState.ts')
const makan = makananTampil(
  [{ id: 'f1', name: 'rice' }, { id: 'f2', name: 'egg' }],
  [{ id: 'f1', name: 'rice' }, { id: 'f3', name: 'tea' }],
  ['f1'],
)
assert.deepEqual(makan.map((r) => r.id), ['f2', 'f3'])
assert.deepEqual(barisBelumAda([{ id: 'f2' }], [{ id: 'f1' }, { id: 'f9' }], ['f1']).map((r) => r.id), ['f9'])
const tidur = tidurTampil(
  [{ id: 's1', date: '2026-09-28', hours: 7 }, { id: 's0', date: '2026-09-27', hours: 6 }],
  [{ id: 's2', date: '2026-09-28', hours: 8 }],
  [],
)
assert.deepEqual(tidur.map((r) => [r.id, r.hours]), [['s0', 6], ['s2', 8]])
assert.deepEqual(tidurTampil([{ id: 's2', date: '2026-09-28', hours: 8 }], [{ id: 's1', date: '2026-09-28', hours: 7 }], ['s1']).map((r) => r.id), ['s2'])

const { ringkasGpsUntukAkun, gpsTampil } = await import('../../src/lib/homeCrossTabDailyState.ts')
const ringkas = ringkasGpsUntukAkun([
  { id: 'g1', email: 'A@x.com', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T00:00:00.000Z', hrSamples: [{ s: 0, bpm: 140 }] },
  { id: 'g2', email: 'other@x.com', name: 'Orang', sport: 'Lari', sportType: 'run', distKm: 1, durSec: 600, avgSpeedKmh: 6, kcal: 50, at: '2026-09-28T00:00:00.000Z' },
], 'a@x.com')
assert.deepEqual(ringkas.map((r) => r.id), ['g1'])
assert.equal('hrSamples' in ringkas[0], false)
const gpsLayar = gpsTampil(
  [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T00:00:00.000Z' }],
  [{ id: 'g1', email: 'a@x.com', name: 'Pagi', sport: 'Lari', sportType: 'run', emoji: '🏃', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T00:00:00.000Z', hrSamples: [{ s: 0, bpm: 140 }] },
    { id: 'g3', email: 'a@x.com', name: 'Baru', sport: 'Lari', sportType: 'run', emoji: '🏃', distKm: 2, durSec: 700, avgSpeedKmh: 10, kcal: 80, at: '2026-09-29T00:00:00.000Z' }],
  'a@x.com',
)
assert.equal(gpsLayar.find((r) => r.id === 'g1')?.hrSamples?.[0].bpm, 140)
assert.equal(gpsLayar.some((r) => r.id === 'g3'), true)
assert.equal(gpsLayar.some((r) => r.id === 'g2'), false)
const gpsHapus = gpsTampil(
  [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T00:00:00.000Z' }],
  [{ id: 'g1', email: 'a@x.com', name: 'Pagi', sport: 'Lari', sportType: 'run', emoji: '🏃', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T00:00:00.000Z' }],
  'a@x.com',
  ['g1'],
)
assert.equal(gpsHapus.length, 0)

console.log('catatan-harian-gabung: second device adds rows without replacing the account')
