import test from 'node:test'
import assert from 'node:assert/strict'
import { tanggalKalenderSah } from '../../src/lib/tanggal.ts'
import { JENIS_LAB, periksaMasukanLab, tambahLab, tetapkanLabPadaTanggal, ambilLab,
  proyeksikanNilaiNutrisiKeLabKanonic } from '../../src/lib/lab.ts'
import { labLogToLongitudinalEvents, labLogToBodyExposureSignals } from '../../src/lib/labLongitudinalBridge.ts'
import { validasiLogLab } from '../../server/src/labLog.ts'

const invalidDates = ['2026-02-29', '2026-02-30', '2026-04-31', '1900-02-29', '2026-00-10', '2026-13-01', '2026-01-00', '2026-1-01', 'not-a-date']
const validDates = ['2000-02-29', '2024-02-29', '2026-02-28', '2026-04-30']
const now = '2026-10-04T10:00:00.000Z'
const glucose = JENIS_LAB.find(j => j.id === 'gdp')
const row = tanggal => ({ id: 'lab-1', tanggal, nilai: 90 })
const context = { receivedAt: now, confidence: 1,
  consent: { granted: true, purposes: ['personal-visualization'], grantedAt: '2026-01-01T00:00:00.000Z' } }

test('calendar date validation respects leap years and rejects rollover and malformed values', () => {
  for (const date of validDates) assert.equal(tanggalKalenderSah(date), true, date)
  for (const date of [...invalidDates, null, undefined, 20260228, {}, []]) assert.equal(tanggalKalenderSah(date), false)
})

test('lab entry and server persistence agree on genuine calendar dates', () => {
  for (const date of invalidDates) {
    assert.equal(periksaMasukanLab(glucose, '90', date, '2026-10-04').ok, false, date)
    assert.throws(() => validasiLogLab({ gdp: [row(date)] }, new Date(now)), /invalid date/, date)
  }
  for (const date of validDates) {
    assert.equal(periksaMasukanLab(glucose, '90', date, '2026-10-04').ok, true, date)
    assert.equal(validasiLogLab({ gdp: [row(date)] }, new Date(now)).gdp[0].tanggal, date)
  }
})

test('impossible draw dates never enter longitudinal events or Body Exposure signals', () => {
  for (const date of invalidDates) {
    const lab = { gdp: [row(date)] }
    const before = structuredClone(lab)
    const result = labLogToLongitudinalEvents(lab, 'patient-1', context)
    assert.deepEqual(result.events, [], date)
    assert.equal(result.skipped[0].reason, 'invalid-record', date)
    assert.deepEqual(labLogToBodyExposureSignals(lab, { nowISO: now }), [], date)
    assert.deepEqual(lab, before)
  }
  for (const date of validDates) {
    const lab = { gdp: [row(date)] }
    assert.equal(labLogToLongitudinalEvents(lab, 'patient-1', context).events[0].recordedAt, `${date}T00:00:00.000Z`)
    assert.equal(labLogToBodyExposureSignals(lab, { nowISO: now })[0].recordedAt, date)
  }
})

test('direct and nutrition writes reject impossible dates; legacy invalid rows stay outside patient context', () => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const store = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  } })
  try {
    for (const date of invalidDates) {
      tambahLab('gdp', date, 90)
      tetapkanLabPadaTanggal('gdp', date, 90)
      assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic(date, { glucose: 90 }).written, [])
      assert.equal(store.size, 0, date)
    }
    tambahLab('gdp', '2024-02-29', 90)
    const saved = ambilLab().gdp[0]
    store.set('pmd_lab_v1', JSON.stringify({ gdp: [saved, row('2026-02-30')] }))
    assert.deepEqual(ambilLab().gdp, [saved])
    assert.equal(JSON.parse(store.get('pmd_lab_v1')).gdp.length, 2, 'reading must not destroy the persisted legacy row')
  } finally {
    if (prior) Object.defineProperty(globalThis, 'localStorage', prior)
    else delete globalThis.localStorage
  }
})
