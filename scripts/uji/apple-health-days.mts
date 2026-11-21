// Apple Health export.xml → satu baris riwayat per hari, lewat SATU pembaca deret perangkat (deviceSeries): hari dipotong
// pada offset UTC pemakai, unit dikonversi menurut atribut unit (unit tak dikenal ditolak, bukan dianggap), sinyal
// kumulatif tidak dihitung ganda antar sumber (iPhone + Watch), level dirata-rata; rekaman tak sah dibuang.
import assert from 'node:assert/strict'
import { parseAppleHealthDays as baca, parseHealthFileDays } from '../../src/lib/healthImport.ts'

const WIB = 420
const parseAppleHealthDays = (x: string) => baca(x, WIB)

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const rec = (type: string, unit: string, start: string, value: string | number, source = 'Apple Watch') =>
  `<Record type="HKQuantityTypeIdentifier${type}" sourceName="${source}" sourceVersion="11.0" unit="${unit}" creationDate="${start}" startDate="${start}" endDate="${start}" value="${value}"/>`
const xml = (...r: string[]) => `<?xml version="1.0" encoding="UTF-8"?>\n<HealthData locale="en_ID">\n <ExportDate value="2026-11-20 08:00:00 +0700"/>\n ${r.join('\n ')}\n</HealthData>`
const t = (day: string, h = '08') => `${day} ${h}:00:00 +0700`

// ── Positif ──────────────────────────────────────────────────────────────────────────────────────────────────
await gagal('satu-baris-per-hari', async () => {
  assert.deepEqual(await parseAppleHealthDays(xml(
    rec('RestingHeartRate', 'count/min', t('2026-11-18'), 56),
    rec('StepCount', 'count', t('2026-11-18', '08'), 1200), rec('StepCount', 'count', t('2026-11-18', '17'), 3400),
    rec('HeartRate', 'count/min', t('2026-11-19', '08'), 70), rec('HeartRate', 'count/min', t('2026-11-19', '09'), 81),
    rec('OxygenSaturation', '%', t('2026-11-19'), 0.97),
  )), [
    { date: '2026-11-18', values: { restingHr: 56, steps: 4600 } },
    { date: '2026-11-19', values: { heartRate: 76, spo2Pct: 97 } },
  ])
})
await gagal('unit-dikonversi', async () => {
  const [d] = await parseAppleHealthDays(xml(
    rec('BodyMass', 'lb', t('2026-11-19'), 154.324), rec('ActiveEnergyBurned', 'kJ', t('2026-11-19'), 1046),
    rec('BodyTemperature', 'degF', t('2026-11-19'), 98.6),
  ))
  assert.deepEqual(d.values, { weightKg: 70, activeKcal: 250, bodyTempC: 37 })
})
await gagal('denyut-istirahat-tidak-dicampur-denyut-jantung', async () => {
  const [d] = await parseAppleHealthDays(xml(rec('RestingHeartRate', 'count/min', t('2026-11-19', '06'), 52), rec('HeartRate', 'count/min', t('2026-11-19', '12'), 90)))
  assert.deepEqual(d.values, { heartRate: 90, restingHr: 52 })
})
await gagal('dua-sumber-tidak-dihitung-ganda', async () => {
  // Jalan yang sama tercatat di iPhone (5000) dan Watch (4800 + 300): total hari = sumber terbesar, bukan 10100.
  const [d] = await parseAppleHealthDays(xml(
    rec('StepCount', 'count', t('2026-11-19', '07'), 5000, 'iPhone'),
    rec('StepCount', 'count', t('2026-11-19', '07'), 4800, 'Apple Watch'), rec('StepCount', 'count', t('2026-11-19', '18'), 300, 'Apple Watch'),
  ))
  assert.equal(d.values.steps, 5100)
})
await gagal('hari-dipotong-di-zona-pemakai', async () => {
  const x = xml(rec('RestingHeartRate', 'count/min', '2026-11-19 00:30:00 +0700', 50))
  assert.equal((await parseAppleHealthDays(x))[0].date, '2026-11-19', 'WIB: lewat tengah malam = hari baru')
  assert.equal((await baca(x, 0))[0].date, '2026-11-18', 'di UTC instan yang sama masih 18 November')
})
await gagal('dispatch-nama-berkas', async () => {
  const x = xml(rec('RestingHeartRate', 'count/min', t('2026-11-19'), 50))
  assert.deepEqual(await parseHealthFileDays('export.xml', x, WIB), await parseAppleHealthDays(x))
  assert.equal((await parseHealthFileDays('apa-saja.txt', x, WIB)).length, 1, 'dikenali dari isi <HealthData')
})

// ── Batas ────────────────────────────────────────────────────────────────────────────────────────────────────
await gagal('fraksi-dan-persen-sama', async () => {
  const [d] = await parseAppleHealthDays(xml(rec('OxygenSaturation', '%', t('2026-11-19', '07'), 0.96), rec('OxygenSaturation', '%', t('2026-11-19', '08'), 98)))
  assert.equal(d.values.spo2Pct, 97, '0.96 dibaca 96%, 98 tetap 98%')
})

// ── Negatif: gagal tertutup ──────────────────────────────────────────────────────────────────────────────────
await gagal('unit-tak-dikenal-ditolak', async () => {
  assert.deepEqual(await parseAppleHealthDays(xml(rec('BodyMass', 'st', t('2026-11-19'), 11))), [], 'stone tidak dianggap kilogram')
  assert.deepEqual(await parseAppleHealthDays(xml(rec('BodyMass', 'kg', t('2026-11-19'), 70))), [{ date: '2026-11-19', values: { weightKg: 70 } }], 'pasangan penerima')
})
await gagal('rekaman-tak-sah-dibuang', async () => {
  assert.deepEqual(await parseAppleHealthDays(xml(
    rec('RestingHeartRate', 'count/min', 'kemarin', 50), rec('RestingHeartRate', 'count/min', t('2026-11-19'), 0),
    rec('RestingHeartRate', 'count/min', t('2026-11-19'), -4), rec('RestingHeartRate', 'count/min', t('2026-11-19'), 'abc'),
    rec('UnknownThing', 'count', t('2026-11-19'), 5), rec('RestingHeartRate', 'count/min', t('2026-11-18'), 58),
  )), [{ date: '2026-11-18', values: { restingHr: 58 } }])
})
await gagal('bukan-ekspor-apple-kosong', async () => {
  assert.deepEqual(await parseAppleHealthDays(''), []); assert.deepEqual(await parseAppleHealthDays('<Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2026-11-19 08:00:00 +0700" value="5"/>'), [])
  assert.deepEqual(await parseAppleHealthDays('<HealthData/>'), [])
})
await gagal('deterministik', async () => {
  const x = xml(rec('StepCount', 'count', t('2026-11-19'), 10), rec('HeartRate', 'count/min', t('2026-11-19'), 60))
  assert.deepEqual(await parseAppleHealthDays(x), await parseAppleHealthDays(x))
})

console.log('apple-health-days: OK')
