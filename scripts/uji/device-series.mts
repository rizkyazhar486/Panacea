// Device export → timestamped series: the reader behind the device-data analyzer.
//   - CSV / JSON rows, GPX track points and Apple Health records become sorted series in canonical units;
//   - a time without a zone is the wearer's wall clock at the injected offset; an impossible date or offset is refused;
//   - an implausible, non-numeric or untimed reading is counted as rejected, never clamped; an empty cell is no reading;
//   - day and hour folding: counts add, levels average, an hour with no reading stays null (never zero);
//   - the daily output feeds metricInsight's own usual range, so there is one range rule, not a second.
import assert from 'node:assert/strict'
import { dailyValues, hourProfile, MAX_TEXT_CHARS, parseDeviceSeries, parseTimestamp, SERIES, type DeviceSeriesResult } from '../../src/domains/personal-health/engine/glance/deviceSeries.ts'
import { metricInsight } from '../../src/domains/personal-health/engine/glance/metricInsight.ts'
import { glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const ok = (r: DeviceSeriesResult) => { assert.equal(r.ok, true, r.ok ? '' : r.reason); return r as Extract<DeviceSeriesResult, { ok: true }> }
const no = (r: DeviceSeriesResult, re: RegExp) => { assert.equal(r.ok, false); assert.match((r as { reason: string }).reason, re) }
const WIB = 420 // UTC+7
const T = (iso: string) => Date.parse(iso)

// ── waktu ──
await gagal('waktu_tanpa_zona_memakai_offset_pemakai', () => {
  assert.equal(parseTimestamp('2026-11-18T06:20:00', WIB), T('2026-11-17T23:20:00Z'))
  assert.equal(parseTimestamp('2026-11-18 06:20', WIB), T('2026-11-17T23:20:00Z'))
  assert.equal(parseTimestamp('2026-11-18T06:20:00', 0), T('2026-11-18T06:20:00Z'))
})
await gagal('waktu_berzona_mengabaikan_offset_pemakai', () => {
  assert.equal(parseTimestamp('2026-11-18T06:20:00Z', WIB), T('2026-11-18T06:20:00Z'))
  assert.equal(parseTimestamp('2026-11-18 06:20:00 +0700', 0), T('2026-11-17T23:20:00Z'), 'Apple Health form')
  assert.equal(parseTimestamp('2026-11-18T06:20:00-05:30', 0), T('2026-11-18T11:50:00Z'))
})
await gagal('waktu_epoch_detik_dan_milidetik', () => {
  assert.equal(parseTimestamp('1795000000'), 1795000000000)
  assert.equal(parseTimestamp('1795000000123'), 1795000000123)
})
await gagal('menolak_waktu_mustahil_atau_asing', () => {
  for (const s of ['2026-02-30T10:00:00', '2026-11-18T24:00:00', '2026-11-18T10:60:00', '18/11/2026 10:00', 'yesterday', '', '2026-11-18T10:00:00+15:00', '12345678'])
    assert.equal(parseTimestamp(s, 0), null, s)
})
await gagal('batas_offset_utc', () => {
  assert.equal(parseTimestamp('2026-11-18T00:00:00', 840), T('2026-11-17T10:00:00Z'), '+14:00 accepted')
  assert.equal(parseTimestamp('2026-11-18T00:00:00', -720), T('2026-11-18T12:00:00Z'), '−12:00 accepted')
  for (const off of [841, -721, 7.5, Number.NaN]) assert.equal(parseTimestamp('2026-11-18T00:00:00', off), null, String(off))
})

// ── CSV ──
const CSV = [
  'timestamp,heart_rate,spo2,steps',
  '2026-11-18T06:05:00,58,97.1,0',
  '2026-11-18T06:00:00,60,,12',
  '2026-11-18T06:00:00,60,,12', // exported twice
  '2026-11-18T18:00:00,999,96,300', // HR impossible, others fine
  'not-a-time,70,98,5',
  '2026-11-18T19:00:00,abc,96.5,',
].join('\n')

await gagal('csv_menjadi_seri_terurut_dan_satuan_kanonik', () => {
  const r = ok(parseDeviceSeries('watch.csv', CSV, WIB))
  assert.equal(r.format, 'csv')
  assert.deepEqual(r.series.heartRate, [{ t: T('2026-11-17T23:00:00Z'), value: 60 }, { t: T('2026-11-17T23:05:00Z'), value: 58 }])
  assert.deepEqual(r.series.spo2?.map((x) => x.value), [97.1, 96, 96.5])
  assert.deepEqual(r.series.steps?.map((x) => x.value), [12, 0, 300])
})
await gagal('csv_menghitung_tolakan_tanpa_menebak', () => {
  const r = ok(parseDeviceSeries('watch.csv', CSV, WIB))
  // HR 999, HR "abc", and the three filled cells on the untimed row; empty cells are not readings.
  assert.equal(r.rejected, 5)
  assert.equal(r.accepted, 10)
  assert.ok(!r.series.heartRate!.some((x) => x.value === 999))
})
await gagal('csv_titik_koma_dan_koma_desimal', () => {
  const r = ok(parseDeviceSeries('x.csv', 'Date;SpO2\n2026-11-18T06:00:00Z;"97,5"\n', 0))
  assert.deepEqual(r.series.spo2, [{ t: T('2026-11-18T06:00:00Z'), value: 97.5 }])
})
await gagal('menolak_csv_tanpa_kolom_waktu', () => no(parseDeviceSeries('x.csv', 'heart_rate\n60\n', 0), /time column/))
await gagal('menolak_csv_tanpa_kolom_dikenal', () => no(parseDeviceSeries('x.csv', 'time,mood\n2026-11-18T06:00:00Z,ok\n', 0), /No column/))
await gagal('menolak_csv_hanya_header', () => no(parseDeviceSeries('x.csv', 'time,hr\n', 0), /header row and at least one/))
await gagal('menolak_csv_semua_tidak_masuk_akal', () => no(parseDeviceSeries('x.csv', 'time,hr\n2026-11-18T06:00:00Z,0\n2026-11-18T06:01:00Z,400\n', 0), /all 2 were/))

// ── batas plausibilitas (dipasangkan: hanya nilai yang berbeda) ──
await gagal('batas_plausibilitas_tepat_diterima_lewat_ditolak', () => {
  const { min, max } = SERIES.heartRate.plausible
  const row = (v: number) => parseDeviceSeries('x.csv', `time,hr\n2026-11-18T06:00:00Z,${v}\n`, 0)
  assert.equal(ok(row(min)).accepted, 1)
  assert.equal(ok(row(max)).accepted, 1)
  no(row(min - 1), /all 1 were/)
  no(row(max + 1), /all 1 were/)
})

// ── JSON ──
await gagal('json_daftar_baris_atau_data', () => {
  const rows = [{ time: '2026-11-18T06:00:00Z', hrv: 61 }, { time: '2026-11-18T07:00:00Z', hrv: '55' }]
  assert.deepEqual(ok(parseDeviceSeries('x.json', JSON.stringify(rows), 0)).series.hrv?.map((x) => x.value), [61, 55])
  assert.equal(ok(parseDeviceSeries('x.json', JSON.stringify({ data: rows }), 0)).format, 'json')
})
await gagal('menolak_json_rusak_atau_bukan_baris', () => {
  no(parseDeviceSeries('x.json', '{"a":', 0), /could not be read/)
  no(parseDeviceSeries('x.json', '[1,2]', 0), /not a list of timestamped rows/)
  no(parseDeviceSeries('x.json', '{"data":[]}', 0), /not a list/)
})

// ── GPX ──
const GPX = `<?xml version="1.0"?><gpx><trk><trkseg>
<trkpt lat="1" lon="2"><ele>812.4</ele><time>2026-11-18T06:00:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>131</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
<trkpt lat="1" lon="2"><ele>815</ele><time>2026-11-18T06:00:05Z</time></trkpt>
<trkpt lat="1" lon="2"><ele>99999</ele></trkpt>
</trkseg></trk></gpx>`
await gagal('gpx_ketinggian_dan_detak_dari_titik_jejak', () => {
  const r = ok(parseDeviceSeries('ride.gpx', GPX, 0))
  assert.equal(r.format, 'gpx')
  assert.deepEqual(r.series.heartRate, [{ t: T('2026-11-18T06:00:00Z'), value: 131 }])
  assert.deepEqual(r.series.elevationM?.map((x) => x.value), [812.4, 815])
  assert.equal(r.rejected, 1, 'untimed, implausible point')
})
await gagal('menolak_gpx_kosong', () => no(parseDeviceSeries('a.gpx', '<gpx><trk></trk></gpx>', 0), /no track point/))

// ── Apple Health ──
const APPLE = `<HealthData>
<Record type="HKQuantityTypeIdentifierOxygenSaturation" unit="%" value="0.97" startDate="2026-11-18 06:00:00 +0700"/>
<Record type="HKQuantityTypeIdentifierBodyTemperature" unit="degF" value="98.6" startDate="2026-11-18 06:00:00 +0700"/>
<Record type="HKQuantityTypeIdentifierActiveEnergyBurned" unit="kJ" value="418.4" startDate="2026-11-18 06:00:00 +0700"/>
<Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" value="64" startDate="2026-11-18 06:00:00 +0700"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep" startDate="2026-11-18 01:00:00 +0700"/>
</HealthData>`
await gagal('apple_health_satuan_dinormalkan', () => {
  const r = ok(parseDeviceSeries('export.xml', APPLE, 0))
  const at = T('2026-11-17T23:00:00Z')
  assert.deepEqual(r.series.spo2, [{ t: at, value: 97 }])
  assert.ok(Math.abs(r.series.bodyTempC![0]!.value - 37) < 1e-9)
  assert.ok(Math.abs(r.series.activeKcal![0]!.value - 100) < 1e-9)
  assert.deepEqual(r.series.heartRate, [{ t: at, value: 64 }])
  assert.equal(r.accepted, 4, 'unknown record types are skipped, not counted')
})
await gagal('menolak_xml_bukan_gpx_atau_apple', () => no(parseDeviceSeries('a.xml', '<root/>', 0), /neither a GPX/))

// ── masukan umum ──
await gagal('menolak_masukan_kosong_besar_atau_offset_salah', () => {
  no(parseDeviceSeries('a.csv', '   ', 0), /empty/)
  no(parseDeviceSeries('a.csv', CSV, 900), /UTC offset/)
  no(parseDeviceSeries(undefined as unknown as string, CSV, 0), /No file/)
  no(parseDeviceSeries('a.csv', null as unknown as string, 0), /No file/)
  assert.ok(MAX_TEXT_CHARS > 1e8, 'large exports still fit')
})
await gagal('deterministik', () => assert.deepEqual(parseDeviceSeries('watch.csv', CSV, WIB), parseDeviceSeries('watch.csv', CSV, WIB)))

// ── lipatan hari dan jam ──
const R = [
  { t: T('2026-11-17T17:30:00Z'), value: 10 }, // 00:30 on the 18th at +7
  { t: T('2026-11-18T00:10:00Z'), value: 20 }, // 07:10 on the 18th
  { t: T('2026-11-18T00:50:00Z'), value: 30 }, // 07:50 on the 18th
  { t: T('2026-11-19T00:20:00Z'), value: 40 }, // 07:20 on the 19th
]
await gagal('hari_menurut_offset_jumlah_atau_rata', () => {
  assert.deepEqual(dailyValues(R, 'sum', WIB), [{ date: '2026-11-18', value: 60 }, { date: '2026-11-19', value: 40 }])
  assert.deepEqual(dailyValues(R, 'mean', WIB), [{ date: '2026-11-18', value: 20 }, { date: '2026-11-19', value: 40 }])
  assert.deepEqual(dailyValues(R, 'sum', 0).map((d) => d.date), ['2026-11-17', '2026-11-18', '2026-11-19'], 'same instants, other offset')
  assert.deepEqual(dailyValues(R, 'sum', 9999), [])
})
await gagal('jam_kosong_null_bukan_nol', () => {
  const sum = hourProfile(R, 'sum', WIB)
  assert.equal(sum.length, 24)
  assert.equal(sum[0], 5, '10 on one of two days')
  assert.equal(sum[7], 45, '(20+30) + 40 over two days')
  assert.equal(sum[3], null)
  const mean = hourProfile(R, 'mean', WIB)
  assert.equal(mean[7], 30)
  assert.ok(hourProfile([], 'mean', 0).every((h) => h === null))
  assert.ok(hourProfile(R, 'mean', -9999).every((h) => h === null))
})
await gagal('hari_mengabaikan_bacaan_tak_hingga', () => {
  assert.deepEqual(dailyValues([{ t: Number.NaN, value: 1 }, { t: 0, value: Number.POSITIVE_INFINITY }], 'sum', 0), [])
})

// ── satu aturan rentang: harian mengalir ke metricInsight ──
await gagal('seri_harian_memakai_rentang_pribadi_yang_sama', () => {
  const lines = ['time,resting_hr']
  for (let d = 1; d <= 20; d++) lines.push(`2026-11-${String(d).padStart(2, '0')}T06:00:00,${50 + (d % 10)}`)
  // "resting_hr" is not a column name the reader knows; it does not guess one.
  no(parseDeviceSeries('rhr.csv', lines.join('\n'), WIB), /No column/)
  const hr = ok(parseDeviceSeries('hr.csv', lines.join('\n').replace('resting_hr', 'heart_rate'), WIB))
  const series = dailyValues(hr.series.heartRate!, 'mean', WIB)
  assert.equal(series.length, 20)
  const insight = metricInsight({ metric: glanceMetric('restingHr')!, series, today: '2026-11-20', window: 30 })
  assert.equal(insight.ok, true)
  // 20 days of 50…59 twice: nearest-rank p10 = sorted[2] = 51, p90 = sorted[17] = 58.
  if (insight.ok) assert.deepEqual([insight.range?.low, insight.range?.high], [51, 58])
})
console.log('device-series: semua lulus')
