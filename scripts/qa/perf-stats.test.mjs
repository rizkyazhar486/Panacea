import assert from 'node:assert/strict'
import test from 'node:test'
import { ANGGARAN, agregat, cumulativeLayoutShift, median, statusAnggaran, totalBlockingTime } from './perf-stats.mjs'

test('anggaran mengikuti ambang baik Web Vitals', () => { assert.deepEqual({ ...ANGGARAN }, { lcpMs: 2500, cls: 0.1, tbtMs: 200 }); assert.ok(Object.isFrozen(ANGGARAN)) })

test('median: ganjil, genap, tidak mengubah masukan, dan tidak mengarang nilai', () => {
  assert.equal(median([3, 1, 2]), 2); assert.equal(median([4, 1, 3, 2]), 2.5); assert.equal(median([7]), 7)
  const x = [3, 1, 2]; median(x); assert.deepEqual(x, [3, 1, 2])
  for (const bad of [[], null, undefined, 'abc', [1, NaN], [1, Infinity], [1, '2'], [1, null]]) assert.equal(median(bad), null, `median(${JSON.stringify(bad)})`)
  assert.equal(median([0, 0, 0]), 0, 'nol sungguhan adalah nol')
})

test('TBT: hanya tugas > 50 ms setelah FCP; masukan tak sah → null', () => {
  assert.equal(totalBlockingTime([], 100), 0)
  assert.equal(totalBlockingTime([{ startTime: 150, duration: 120 }, { startTime: 400, duration: 51 }], 100), 71)
  assert.equal(totalBlockingTime([{ startTime: 50, duration: 500 }], 100), 0, 'sebelum FCP tidak dihitung')
  assert.equal(totalBlockingTime([{ startTime: 100, duration: 80 }], 100), 30, 'tepat pada FCP dihitung')
  assert.equal(totalBlockingTime([{ startTime: 200, duration: 50 }], 100), 0, 'tepat 50 ms tidak memblokir')
  for (const bad of [[{ startTime: 1, duration: NaN }], [{ startTime: 1, duration: -5 }], [null], [{ startTime: '1', duration: 80 }]]) assert.equal(totalBlockingTime(bad, 0), null)
  for (const f of [NaN, -1, undefined, '10', Infinity]) assert.equal(totalBlockingTime([], f), null, `fcp ${String(f)}`)
  assert.equal(totalBlockingTime(null, 10), null)
})

test('CLS: pergeseran tanpa masukan dijumlah; masukan pengguna dikecualikan', () => {
  assert.equal(cumulativeLayoutShift([]), 0)
  assert.ok(Math.abs(cumulativeLayoutShift([{ value: 0.05, hadRecentInput: false }, { value: 0.02, hadRecentInput: false }, { value: 0.5, hadRecentInput: true }]) - 0.07) < 1e-12)
  for (const bad of [null, [null], [{ value: NaN }], [{ value: -1 }], [{ value: '0.1' }]]) assert.equal(cumulativeLayoutShift(bad), null)
})

test('agregat: median dan maks; sampel tak terukur → null, bukan 0', () => {
  assert.deepEqual(agregat([{ a: 1 }, { a: 5 }, { a: 3 }], 'a'), { median: 3, maks: 5, n: 3 })
  assert.deepEqual(agregat([{ a: 1 }, { a: null }], 'a'), { median: null, maks: null, n: 2 })
  assert.deepEqual(agregat([{ a: 1 }, {}], 'a'), { median: null, maks: null, n: 2 })
  assert.deepEqual(agregat([{ a: 0 }, { a: 0 }], 'a'), { median: 0, maks: 0, n: 2 })
})

test('status anggaran: batas inklusif, tak terukur dan metrik tak dikenal', () => {
  assert.equal(statusAnggaran('lcpMs', 2500), 'lulus'); assert.equal(statusAnggaran('lcpMs', 2500.01), 'melebihi'); assert.equal(statusAnggaran('cls', 0.1), 'lulus'); assert.equal(statusAnggaran('cls', 0.11), 'melebihi')
  assert.equal(statusAnggaran('tbtMs', 200), 'lulus'); assert.equal(statusAnggaran('tbtMs', 201), 'melebihi'); assert.equal(statusAnggaran('tbtMs', 0), 'lulus')
  for (const bad of [null, undefined, NaN, Infinity, -1, '5']) assert.equal(statusAnggaran('lcpMs', bad), 'tak-terukur', String(bad))
  assert.throws(() => statusAnggaran('fps', 60), /anggaran tidak dikenal/)
})
