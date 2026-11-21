// Impor Health Auto Export: nilai terbaru (perilaku lama, golden) dan BARIS HARIAN bertanggal untuk riwayat — satu
// aturan konversi untuk keduanya (kJ→kkal, proporsi→%, menit tidur→jam), ekspor per-jam dilipat menjadi satu hari
// (kumulatif dijumlah, level dirata-rata), dan sampel tanpa tanggal/tak sah dibuang, bukan ditebak.
import assert from 'node:assert/strict'
import { parseHealthAutoExport, parseHealthAutoExportDays, parseHealthFile, parseHealthFileDays } from '../../src/lib/healthImport.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
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
gagal('nilai-terbaru-tetap-sama', () => {
  const r = parseHealthAutoExport(HARIAN)
  assert.equal(r.restingHr, 54); assert.equal(r.steps, 10450); assert.equal(r.spo2Pct, 97)
  assert.equal(r.activeKcal, 250, '1046 kJ / 4.184 = 250 kkal'); assert.equal(r.sleepH, 7.2); assert.equal(r.sleepDeepH, 1)
  assert.equal(r.source, 'Apple Watch'); assert.equal(r.measuredAt, new Date('2026-11-19T00:00:00+07:00').toISOString())
})
gagal('baris-harian-per-tanggal-ekspor', () => {
  assert.deepEqual(parseHealthAutoExportDays(HARIAN), [
    { date: '2026-11-17', values: { restingHr: 55, steps: 8012 } },
    { date: '2026-11-18', values: { restingHr: 57, spo2Pct: 97, sleepH: 7.2, sleepDeepH: 1 } },
    { date: '2026-11-19', values: { restingHr: 54, steps: 10450, activeKcal: 250 } },
  ])
})
gagal('ekspor-per-jam-dilipat-menjadi-satu-hari', () => {
  const perJam = hae([
    { name: 'step_count', units: 'count', data: [{ date: d('2026-11-19', '08'), qty: 1200 }, { date: d('2026-11-19', '09'), qty: 800 }] },
    { name: 'heart_rate', units: 'count/min', data: [{ date: d('2026-11-19', '08'), Avg: 70 }, { date: d('2026-11-19', '09'), Avg: 81 }] },
  ])
  assert.deepEqual(parseHealthAutoExportDays(perJam), [{ date: '2026-11-19', values: { steps: 2000, heartRate: 76 } }], 'langkah dijumlah, denyut dirata-rata')
})
gagal('tanggal-ditulis-ponsel-tanpa-geser-zona', () => {
  // 23:30 +0700 adalah 16:30 UTC hari yang sama, tetapi 00:30 +0700 adalah 17:30 UTC hari SEBELUMNYA; tanggal dari teks.
  const r = parseHealthAutoExportDays(hae([{ name: 'resting_heart_rate', data: [{ date: '2026-11-19 00:30:00 +0700', qty: 50 }] }]))
  assert.equal(r[0].date, '2026-11-19')
})
gagal('urutan-argumen-parseHealthFile', () => {
  assert.equal(parseHealthFile('export.json', HARIAN).restingHr, 54)
  assert.deepEqual(parseHealthFile(HARIAN, 'export.json'), {}, 'argumen terbalik tidak mengenali apa pun — ini bug kartu Quick Sync')
  assert.equal(parseHealthFileDays('export.json', HARIAN).length, 3)
})

// ── Negatif: gagal tertutup ──────────────────────────────────────────────────────────────────────────────────
gagal('sampel-tanpa-tanggal-atau-nilai-tak-sah-dibuang', () => {
  const kotor = hae([{ name: 'resting_heart_rate', data: [
    { qty: 60 }, { date: 'kemarin', qty: 61 }, { date: d('2026-11-19'), qty: 0 }, { date: d('2026-11-19'), qty: -5 },
    { date: d('2026-11-19'), qty: 'NaN' }, { date: d('2026-11-18'), qty: 58 },
  ] }])
  assert.deepEqual(parseHealthAutoExportDays(kotor), [{ date: '2026-11-18', values: { restingHr: 58 } }])
})
gagal('bukan-health-auto-export-kosong', () => {
  assert.deepEqual(parseHealthAutoExportDays('bukan json'), []); assert.deepEqual(parseHealthAutoExportDays('{"a":1}'), [])
  assert.deepEqual(parseHealthFileDays('cycles.csv', 'a,b\n1,2'), []); assert.deepEqual(parseHealthFileDays('export.xml', '<HealthData/>'), [])
  assert.deepEqual(parseHealthAutoExportDays(hae([{ name: 'unknown_metric', data: [{ date: d('2026-11-19'), qty: 3 }] }])), [], 'metrik tak dikenal tidak membuat hari kosong')
})
gagal('deterministik', () => { assert.deepEqual(parseHealthAutoExportDays(HARIAN), parseHealthAutoExportDays(HARIAN)) })

console.log('health-import-days: OK')
