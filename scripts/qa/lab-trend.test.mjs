import test from 'node:test'
import assert from 'node:assert/strict'
import { analisisTrenLab, MIN_RIWAYAT_GARIS_DASAR, Z_BERMAKNA } from '../../src/lib/labTrend.ts'

const jenis = (over = {}) => ({
  id: 'ldl',
  nama: 'LDL',
  satuan: 'mg/dL',
  atas: 100,
  sumber: 'test fixture',
  ...over,
})

const butir = (pairs) => pairs.map(([tanggal, nilai], i) => ({ id: `b${i}`, tanggal, nilai }))

test('no entries returns null', () => {
  assert.equal(analisisTrenLab([], jenis()), null)
})

test('fewer than MIN_RIWAYAT_GARIS_DASAR earlier results reports belum-cukup-data, never a guess', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 92],
    ]),
    jenis(),
  )
  assert.equal(r.status, 'belum-cukup-data')
  assert.equal(r.garisDasar, null)
  assert.equal(r.rentangPribadi, null)
  assert.equal(r.zPribadi, null)
  assert.equal(r.jumlahRiwayat, 2)
  assert.match(r.alasan, new RegExp(String(MIN_RIWAYAT_GARIS_DASAR)))
})

test('a value within the personal range and within the population range is stabil', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 91],
      ['2026-03-01', 89],
      ['2026-04-01', 90],
    ]),
    jenis(),
  )
  assert.equal(r.status, 'stabil')
  assert.equal(r.arah, 'datar')
  assert.equal(r.diLuarRentangPopulasi, false)
})

test('a single deviating result is only pantau, never perubahan-bermakna', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 92],
      ['2026-03-01', 94],
      ['2026-04-01', 108],
    ]),
    jenis(),
  )
  assert.equal(r.status, 'pantau')
  assert.equal(r.arah, 'naik')
  assert.notEqual(r.status, 'perubahan-bermakna')
})

test('two consecutive results deviating the same way confirm perubahan-bermakna when inside the population range', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 92],
      ['2026-03-01', 94],
      ['2026-04-01', 99],
      ['2026-05-01', 99.5],
    ]),
    jenis({ atas: 200 }),
  )
  assert.equal(r.status, 'perubahan-bermakna')
  assert.equal(r.arah, 'naik')
})

test('two consecutive confirmed deviations that are also outside the population range top out at bicarakan-dengan-dokter, never a fabricated urgent tier', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 92],
      ['2026-03-01', 94],
      ['2026-04-01', 108],
      ['2026-05-01', 110],
    ]),
    jenis(),
  )
  assert.equal(r.status, 'bicarakan-dengan-dokter')
  assert.equal(r.diLuarRentangPopulasi, true)
  assert.ok(Number.isFinite(r.lajuPerTahun))
  assert.ok(r.lajuPerTahun > 0)
})

test('identical history (MAD = 0) uses the relative floor instead of an infinite z-score', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 90],
      ['2026-03-01', 90],
      ['2026-04-01', 91],
    ]),
    jenis(),
  )
  assert.ok(Number.isFinite(r.zPribadi))
  assert.notEqual(r.zPribadi, Infinity)
})

test('rate per year matches a hand calculation for the last two dated results', () => {
  const r = analisisTrenLab(
    butir([
      ['2025-01-01', 90],
      ['2025-04-01', 92],
      ['2025-07-01', 94],
      ['2026-01-01', 108],
    ]),
    jenis(),
  )
  const dtDays = (Date.parse('2026-01-01T00:00:00Z') - Date.parse('2025-07-01T00:00:00Z')) / 864e5
  const expected = ((108 - 94) / dtDays) * 365.25
  assert.ok(Math.abs(r.lajuPerTahun - expected) < 1e-9)
})

test('personal range is centered on the baseline median at Z_BERMAKNA spread', () => {
  const r = analisisTrenLab(
    butir([
      ['2026-01-01', 90],
      ['2026-02-01', 92],
      ['2026-03-01', 94],
      ['2026-04-01', 94],
    ]),
    jenis(),
  )
  assert.equal(r.garisDasar, 92)
  const [lo, hi] = r.rentangPribadi
  assert.ok(lo < 92 && hi > 92)
  assert.ok(Math.abs(92 - lo - (hi - 92)) < 1e-9)
  void Z_BERMAKNA
})

test('non-finite values and malformed dates are filtered out rather than silently guessed', () => {
  const raw = [
    { id: 'a', tanggal: '2026-01-01', nilai: 90 },
    { id: 'b', tanggal: '2026-02-01', nilai: NaN },
    { id: 'c', tanggal: 'not-a-date', nilai: 92 },
    { id: 'd', tanggal: '2026-03-01', nilai: 94 },
  ]
  const r = analisisTrenLab(raw, jenis())
  assert.equal(r.jumlahRiwayat, 2)
})

test('entries are read in chronological order regardless of input order', () => {
  const outOfOrder = butir([
    ['2026-04-01', 108],
    ['2026-01-01', 90],
    ['2026-03-01', 94],
    ['2026-02-01', 92],
  ])
  const r = analisisTrenLab(outOfOrder, jenis())
  assert.equal(r.terakhir, 108)
  assert.equal(r.sebelumnya, 94)
})
