import assert from 'node:assert/strict'
import { keadaanLongitudinalLab, pilihProfilPerangkat, susunKeadaanLongitudinal, turunkanSelfVital, turunkanVo2 } from '../src/keadaanLongitudinal.ts'

const log = { gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: 100 }] }
const a = keadaanLongitudinalLab('user-1', log, '2026-09-29T00:00:00.000Z', '2026-09-28T00:00:00.000Z')
const b = keadaanLongitudinalLab('user-1', log, '2026-09-29T01:00:00.000Z', '2026-09-28T00:00:00.000Z')
assert.equal(a.revision, b.revision, 'the same stored log keeps one revision')
assert.equal(a.truthClass, 'patient-recorded')
assert.equal(a.method, 'patient-transcribed-lab-report')
assert.equal(a.source, 'lab-log')
assert.deepEqual(a.log, log)
assert.equal('email' in a, false)
assert.equal('biologicalAge' in a, false)

const berubah = keadaanLongitudinalLab('user-1', { gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: 110 }] }, a.generatedAt, null)
assert.notEqual(berubah.revision, a.revision, 'a changed value changes the revision')
const orangLain = keadaanLongitudinalLab('user-2', log, a.generatedAt, null)
assert.notEqual(orangLain.revision, a.revision, 'the same rows for another account are a different state')
const kosong = keadaanLongitudinalLab('user-1', undefined, a.generatedAt, null)
const objekKosong = keadaanLongitudinalLab('user-1', {}, a.generatedAt, null)
assert.equal(kosong.revision, objekKosong.revision, 'a missing log and an empty log are the same state')
assert.deepEqual(kosong.log, {})

const dasar = susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-29T00:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [], reviews: [] },
  clinical: null,
  device: null,
})
assert.equal(dasar.lab.source, 'lab-log')
assert.equal(dasar.care.source, 'care-plans')
assert.equal(dasar.device.source, 'health-profile')
assert.equal(dasar.clinical, null)
assert.equal('email' in dasar, false)
assert.deepEqual(dasar.device.current, {})

const denganCare = susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-29T02:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [{ plan: { id: 'p1' }, reports: [] }], reviews: [{ id: 'r1' }] },
  clinical: null,
  device: null,
})
assert.notEqual(denganCare.revision, dasar.revision, 'adding a care plan changes the shared revision')

const denganKlinis = susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-29T00:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [], reviews: [] },
  clinical: { records: { self: { id: 'emr1' } }, vitals: { self: [{ id: 'v1' }] }, encounters: {} },
  device: null,
})
assert.equal(denganKlinis.clinical?.source, 'clinical')
assert.equal(denganKlinis.clinical?.truthClass, 'server-stored')
assert.notEqual(denganKlinis.revision, dasar.revision, 'adding clinical records changes the shared revision')

const perangkat = pilihProfilPerangkat({
  weightKg: 72,
  restingHr: 58,
  secretToken: 'drop-me',
  email: 'leak@example.test',
  lastDeviceSyncAt: '2026-09-28T12:00:00.000Z',
  deviceSyncSource: 'Apple Watch',
  history: [
    { date: '2026-09-27', weightKg: 71, restingHr: 60, note: 'ignore' },
    { date: 'bad', weightKg: 99 },
    { date: '2026-09-28', weightKg: 72 },
  ],
})
assert.equal(perangkat.method, 'device-sync')
assert.deepEqual(perangkat.current, { weightKg: 72, restingHr: 58 })
assert.equal('secretToken' in perangkat.current, false)
assert.equal('email' in perangkat.current, false)
assert.deepEqual(perangkat.history.map((h) => h.date), ['2026-09-27', '2026-09-28'])
assert.deepEqual(perangkat.history[0].metrics, { weightKg: 71, restingHr: 60 })
assert.deepEqual(perangkat.selfVitals, [])
assert.deepEqual(perangkat.vo2maxLog, [])

const lengkap = pilihProfilPerangkat({
  systolic: 120,
  diastolic: 80,
  restingHr: 58,
  spo2Pct: 98,
  bodyTempC: 36.7,
  vo2max: 42,
  lastDeviceSyncAt: '2026-09-28T12:00:00.000Z',
  deviceSyncSource: 'Apple Watch',
  history: [{ date: '2026-09-27', systolic: 118, diastolic: 78, heartRate: 60, spo2Pct: 97, bodyTempC: 36.6, vo2max: 41 }],
})
assert.equal(lengkap.selfVitals.length, 2)
assert.equal(lengkap.selfVitals[0].id, 'health-profile:current')
assert.equal(lengkap.selfVitals[1].heartRate, 60)
assert.equal(lengkap.vo2maxLog.length, 2)
assert.equal(lengkap.vo2maxLog[0].value, 42)
assert.equal(turunkanSelfVital({ systolic: 120, diastolic: 80, restingHr: 58 }, '2026-09-28T12:00:00.000Z', 'x'), null, 'incomplete self-vital is not filled with zeros')
assert.equal(turunkanVo2({ vo2max: 40 }, null, 'x', 'y'), null, 'vo2max without a timestamp is omitted')

const dariApp = pilihProfilPerangkat({
  selfVitalsLog: [
    { id: 'app-1', at: '2026-09-28T08:00:00.000Z', systolic: 122, diastolic: 81, heartRate: 70, spo2: 99, tempC: 36.5 },
  ],
  vo2maxEntries: [
    { id: 'vo2-app', at: '2026-09-28T08:00:00.000Z', value: 44, method: 'Cooper' },
  ],
})
assert.equal(dariApp.selfVitals[0].id, 'app-1')
assert.equal(dariApp.vo2maxLog[0].value, 44)

const denganPerangkat = susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-29T00:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [], reviews: [] },
  clinical: null,
  device: { weightKg: 72, restingHr: 58, lastDeviceSyncAt: '2026-09-28T12:00:00.000Z' },
})
assert.equal(denganPerangkat.device.current.weightKg, 72)
assert.notEqual(denganPerangkat.revision, dasar.revision, 'adding device vitals changes the shared revision')
assert.equal(denganPerangkat.revision, susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-30T00:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [], reviews: [] },
  clinical: null,
  device: { weightKg: 72, restingHr: 58, lastDeviceSyncAt: '2026-09-28T12:00:00.000Z' },
}).revision, 'generatedAt alone does not change the revision')

const denganLog = susunKeadaanLongitudinal({
  subjectId: 'user-1',
  generatedAt: '2026-09-29T00:00:00.000Z',
  lab: { log, diperbaruiPada: null },
  care: { plans: [], reviews: [] },
  clinical: null,
  device: {
    selfVitalsLog: [{ id: 'app-1', at: '2026-09-28T08:00:00.000Z', systolic: 122, diastolic: 81, heartRate: 70, spo2: 99, tempC: 36.5 }],
  },
})
assert.notEqual(denganLog.revision, dasar.revision, 'synced AppState self-vitals change the shared revision')

console.log('keadaanLongitudinal: one shared revision for lab, care, clinical and device')
