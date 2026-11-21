// Impor Health Auto Export: nilai terbaru (perilaku lama, golden) dan BARIS HARIAN bertanggal untuk riwayat — satu
// aturan konversi untuk keduanya (kJ→kkal, proporsi→%, menit tidur→jam), ekspor per-jam dilipat menjadi satu hari
// (kumulatif dijumlah, level dirata-rata), dan sampel tanpa tanggal/tak sah dibuang, bukan ditebak.
import assert from 'node:assert/strict'
import { parseHealthAutoExport, parseHealthAutoExportDays, parseHealthFile, parseHealthFileDays, parseHealthFileSeries } from '../../src/lib/healthImport.ts'

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hae = (metrics: unknown[]) => JSON.stringify({ data: { metrics } })
const d = (day: string, h = '00') => `${day} ${h}:00:00 +0700`

const HARIAN = hae([
  { name: 'resting_heart_rate', units: 'count/min', data: [{ date: d('2026-11-17'), qty: 55 }, { date: d('2026-11-18'), qty: 57 }, { date: d('2026-11-19'), qty: 54 }] },
  { name: 'step_count', units: 'count', data: [{ date: d('2026-11-17'), qty: 8012 }, { date: d('2026-11-19'), qty: 10450 }] },
  { name: 'blood_oxygen_saturation', units: '%', data: [{ date: d('2026-11-18'), Avg: 0.97 }] },
  { name: 'active_energy', units: 'kJ', data: [{ date: d('2026-11-19'), qty: 1046 }] },
  { name: 'sleep_analysis', units: 'min', data: [{ date: d('2026-11-18'), asleep: 0, totalSleep: 432, deep: 60 }] },
  { name: 'unknown_metric', units: 'x', data: [{ date: d('2026-11-19'), qty: 9 }] },
])

// ── Positif ──────────────────────────────────────────────────────────────────────────────────────────────────
await gagal('nilai-terbaru-tetap-sama', async () => {
  const r = parseHealthAutoExport(HARIAN)
  assert.equal(r.restingHr, 54); assert.equal(r.steps, 10450); assert.equal(r.spo2Pct, 97)
  assert.equal(r.activeKcal, 250, '1046 kJ / 4.184 = 250 kkal'); assert.equal(r.sleepH, 7.2); assert.equal(r.sleepDeepH, 1)
  assert.equal(r.source, 'Apple Watch'); assert.equal(r.measuredAt, new Date('2026-11-19T00:00:00+07:00').toISOString())
})
await gagal('baris-harian-per-tanggal-ekspor', async () => {
  assert.deepEqual(parseHealthAutoExportDays(HARIAN), [
    { date: '2026-11-17', values: { restingHr: 55, steps: 8012 } },
    { date: '2026-11-18', values: { restingHr: 57, spo2Pct: 97, sleepH: 7.2, sleepDeepH: 1 } },
    { date: '2026-11-19', values: { restingHr: 54, steps: 10450, activeKcal: 250 } },
  ])
})
await gagal('ekspor-per-jam-dilipat-menjadi-satu-hari', async () => {
  const perJam = hae([
    { name: 'step_count', units: 'count', data: [{ date: d('2026-11-19', '08'), qty: 1200 }, { date: d('2026-11-19', '09'), qty: 800 }] },
    { name: 'heart_rate', units: 'count/min', data: [{ date: d('2026-11-19', '08'), Avg: 70 }, { date: d('2026-11-19', '09'), Avg: 81 }] },
  ])
  assert.deepEqual(parseHealthAutoExportDays(perJam), [{ date: '2026-11-19', values: { steps: 2000, heartRate: 76 } }], 'langkah dijumlah, denyut dirata-rata')
})
await gagal('tanggal-ditulis-ponsel-tanpa-geser-zona', async () => {
  // 23:30 +0700 adalah 16:30 UTC hari yang sama, tetapi 00:30 +0700 adalah 17:30 UTC hari SEBELUMNYA; tanggal dari teks.
  const r = parseHealthAutoExportDays(hae([{ name: 'resting_heart_rate', data: [{ date: '2026-11-19 00:30:00 +0700', qty: 50 }] }]))
  assert.equal(r[0].date, '2026-11-19')
})
await gagal('urutan-argumen-parseHealthFile', async () => {
  assert.equal(parseHealthFile('export.json', HARIAN).restingHr, 54)
  assert.deepEqual(parseHealthFile(HARIAN, 'export.json'), {}, 'argumen terbalik tidak mengenali apa pun — ini bug kartu Quick Sync')
  assert.equal((await parseHealthFileDays('export.json', HARIAN)).length, 3)
})

// ── Negatif: gagal tertutup ──────────────────────────────────────────────────────────────────────────────────
await gagal('sampel-tanpa-tanggal-atau-nilai-tak-sah-dibuang', async () => {
  const kotor = hae([{ name: 'resting_heart_rate', data: [
    { qty: 60 }, { date: 'kemarin', qty: 61 }, { date: d('2026-11-19'), qty: 0 }, { date: d('2026-11-19'), qty: -5 },
    { date: d('2026-11-19'), qty: 'NaN' }, { date: d('2026-11-18'), qty: 58 },
  ] }])
  assert.deepEqual(parseHealthAutoExportDays(kotor), [{ date: '2026-11-18', values: { restingHr: 58 } }])
})
await gagal('bukan-health-auto-export-kosong', async () => {
  assert.deepEqual(parseHealthAutoExportDays('bukan json'), []); assert.deepEqual(parseHealthAutoExportDays('{"a":1}'), [])
  assert.deepEqual(await parseHealthFileDays('cycles.csv', 'a,b\n1,2'), []); assert.deepEqual(await parseHealthFileDays('export.xml', '<HealthData/>'), [], 'ekspor tanpa rekaman')
  assert.deepEqual(parseHealthAutoExportDays(hae([{ name: 'unknown_metric', data: [{ date: d('2026-11-19'), qty: 3 }] }])), [], 'metrik tak dikenal tidak membuat hari kosong')
})
await gagal('deterministik', async () => { assert.deepEqual(parseHealthAutoExportDays(HARIAN), parseHealthAutoExportDays(HARIAN)) })

// Hari khas: butuh waktu tiap bacaan, jadi dihitung saat impor dari berkas apa pun yang dibaca pembaca seri.
await gagal('jam-khas-dari-csv-tanpa-hari', async () => {
  const csv = 'time,hrv,steps\n2026-11-18T06:10:00,52,100\n2026-11-18T06:40:00,54,300\n2026-11-19T06:20:00,56,200\n2026-11-19T13:00:00,,900'
  const { days, hours } = await parseHealthFileSeries('watch.csv', csv, 420)
  assert.deepEqual(days, [], 'CSV tetap tanpa hari, seperti sebelumnya')
  assert.equal(hours.hrvMs?.length, 24); assert.equal(hours.hrvMs?.[6], 54); assert.equal(hours.hrvMs?.[13], null, 'jam tanpa bacaan = null')
  assert.equal(hours.steps?.[6], 300, 'hitungan: total jam dibagi jumlah hari berbacaan'); assert.equal(hours.steps?.[13], 450)
  assert.equal(hours.steps?.[0], null)
})
await gagal('jam-khas-apple-satu-baca-hari-dan-jam', async () => {
  const xml = '<HealthData><Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" startDate="2026-11-19 06:00:00 +0700" value="52"/></HealthData>'
  const r = await parseHealthFileSeries('export.xml', xml, 420)
  assert.deepEqual(r.days, await parseHealthFileDays('export.xml', xml, 420), 'hari sama dengan jalur lama')
  assert.equal(r.days[0]?.values.restingHr, 52); assert.equal(r.hours.restingHr?.[6], 52)
})
await gagal('jam-khas-berkas-tak-terbaca-kosong', async () => {
  assert.deepEqual(await parseHealthFileSeries('notes.txt', 'tidak ada angka', 420), { days: [], hours: {} })
  assert.deepEqual(await parseHealthFileSeries('export.xml', '<HealthData/>', 420), { days: [], hours: {} })
  assert.deepEqual(await parseHealthFileSeries('watch.csv', 'time,hrv\n2026-11-18T06:10:00,52', 9999), { days: [], hours: {} }, 'offset mustahil')
})

console.log('health-import-days: OK')
