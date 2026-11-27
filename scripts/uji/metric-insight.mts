// Metric insight for the Home brief: one recorded signal over 7/30/90 days, read against the person's own record.
//   - empty is not zero: a day without a reading stays null in the points and is left out of every statistic;
//   - every refusal (bad day, bad window, malformed/future/implausible/duplicate entries) is paired with an accepted twin;
//   - usual range: 10th–90th percentile of up to 90 days, only from 14 recorded days (boundary 13/14), same as rentangPribadi;
//   - week comparison: last 7 vs the 7 before, each half needs 4 recorded days (boundary 3/4);
//   - the words carry their numbers and never judge health.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GLANCE_METRICS, glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'
import {
  dateOfDay,
  dayNumber,
  metricInsight,
  personalRange,
  rangePosition,
  RANGE_MIN_DAYS,
  WEEK_MIN_DAYS,
  type DayValue,
  type MetricInsight,
} from '../../src/domains/personal-health/engine/glance/metricInsight.ts'
import { INSIGHT_BOUNDARY, insightLines, shortDate, withUnit } from '../../src/domains/personal-health/engine/glance/insightText.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const STEPS = glanceMetric('steps')!
const RHR = glanceMetric('restingHr')!
const TODAY = '2026-11-15'
const day = (back: number) => dateOfDay(dayNumber(TODAY)! - back)
/** n consecutive days ending `endBack` days ago, value from f(i) (i = 0 oldest). */
const run = (n: number, f: (i: number) => number, endBack = 0): DayValue[] =>
  Array.from({ length: n }, (_, i) => ({ date: day(endBack + n - 1 - i), value: f(i) }))
const ok = (r: MetricInsight) => { assert.equal(r.ok, true, JSON.stringify(r)); return r as Extract<MetricInsight, { ok: true }> }

// ── tanggal ──
gagal('tanggal_kalender_sah_dan_ditolak', () => {
  assert.equal(dateOfDay(dayNumber('2026-11-15')!), '2026-11-15')
  assert.equal(dayNumber('2024-02-29') !== null, true, 'leap day exists in 2024')
  for (const bad of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-5', '15-11-2026', '', '2026-11-15T00:00']) {
    assert.equal(dayNumber(bad), null, bad)
  }
})

// ── penolakan berpasangan ──
gagal('menolak_hari_ini_tidak_sah', () => {
  assert.deepEqual(metricInsight({ metric: STEPS, series: [], today: '2026-02-30', window: 7 }), { ok: false, reason: 'bad_today' })
  assert.equal(metricInsight({ metric: STEPS, series: [], today: '2026-02-28', window: 7 }).ok, true)
})

gagal('menolak_jendela_selain_7_30_90', () => {
  for (const window of [0, 1, 14, 31, 365, Number.NaN]) {
    assert.deepEqual(metricInsight({ metric: STEPS, series: [], today: TODAY, window }), { ok: false, reason: 'bad_window' }, String(window))
  }
  for (const window of [7, 30, 90]) assert.equal(metricInsight({ metric: STEPS, series: [], today: TODAY, window }).ok, true)
})

gagal('entri_rusak_dibuang_dan_dihitung', () => {
  const good = { date: day(1), value: 5000 }
  const cases: [string, unknown][] = [
    ['bad date', { date: '2026-02-30', value: 5000 }],
    ['future', { date: dateOfDay(dayNumber(TODAY)! + 1), value: 5000 }],
    ['NaN', { date: day(2), value: Number.NaN }],
    ['Infinity', { date: day(2), value: Number.POSITIVE_INFINITY }],
    ['string', { date: day(2), value: '5000' }],
    ['negative', { date: day(2), value: -1 }],
    ['implausible', { date: day(2), value: 100_001 }],
    ['null', null],
  ]
  for (const [name, entry] of cases) {
    const r = ok(metricInsight({ metric: STEPS, series: [good, entry as DayValue], today: TODAY, window: 7 }))
    assert.equal(r.rejected, 1, name)
    assert.equal(r.stats?.recorded, 1, name)
    assert.equal(r.stats?.latest.value, 5000, name)
  }
  // Twin: the same entry with a valid value is used.
  const twin = ok(metricInsight({ metric: STEPS, series: [good, { date: day(2), value: 100_000 }], today: TODAY, window: 7 }))
  assert.equal(twin.rejected, 0)
  assert.equal(twin.stats?.recorded, 2)
})

gagal('duplikat_hari_yang_terakhir_menang', () => {
  const r = ok(metricInsight({ metric: STEPS, series: [{ date: day(0), value: 1000 }, { date: day(0), value: 4000 }], today: TODAY, window: 7 }))
  assert.equal(r.rejected, 1)
  assert.equal(r.points.at(-1)?.value, 4000)
})

// ── titik: kosong bukan nol ──
gagal('titik_satu_per_hari_kosong_tetap_kosong', () => {
  const r = ok(metricInsight({ metric: STEPS, series: [{ date: day(0), value: 8029 }, { date: day(3), value: 0 }], today: TODAY, window: 7 }))
  assert.equal(r.points.length, 7)
  assert.equal(r.points[0]!.date, day(6))
  assert.equal(r.points[6]!.date, TODAY)
  assert.deepEqual(r.points.map((p) => p.value), [null, null, null, 0, null, null, 8029], 'a recorded 0 stays 0; a missing day stays null')
  assert.equal(r.stats?.recorded, 2)
  assert.equal(r.stats?.mean, 4014.5)
  for (const window of [30, 90] as const) {
    const wide = ok(metricInsight({ metric: STEPS, series: [], today: TODAY, window }))
    assert.equal(wide.points.length, window)
    assert.equal(wide.points.every((p) => p.value === null), true)
    assert.equal(wide.stats, null)
  }
})

gagal('statistik_jendela_nilai_eksak', () => {
  const r = ok(metricInsight({ metric: RHR, series: run(7, (i) => [58, 54, 61, 54, 57, 61, 55][i]!), today: TODAY, window: 7 }))
  assert.deepEqual(r.stats, {
    recorded: 7,
    mean: 400 / 7,
    low: { date: day(5), value: 54 }, // the earlier of two 54s
    high: { date: day(1), value: 61 }, // the later of two 61s
    latest: { date: TODAY, value: 55 },
  })
  // Data older than the window does not enter the window's statistics.
  const older = ok(metricInsight({ metric: RHR, series: [{ date: day(7), value: 40 }, { date: day(0), value: 55 }], today: TODAY, window: 7 }))
  assert.equal(older.stats?.recorded, 1)
  assert.equal(older.stats?.low.value, 55)
})

// ── rentang pribadi ──
gagal('rentang_pribadi_persentil_10_90_eksak', () => {
  const values = Array.from({ length: 20 }, (_, i) => 50 + i) // 50..69
  // Nearest rank on (n-1)*p: index round(1.9)=2 → 52, round(17.1)=17 → 67.
  assert.deepEqual(personalRange(values), { low: 52, high: 67, days: 20 })
  assert.equal(rangePosition({ low: 52, high: 67, days: 20 }, 51), 'below')
  assert.equal(rangePosition({ low: 52, high: 67, days: 20 }, 52), 'within')
  assert.equal(rangePosition({ low: 52, high: 67, days: 20 }, 67), 'within')
  assert.equal(rangePosition({ low: 52, high: 67, days: 20 }, 68), 'above')
  assert.equal(personalRange([...values.slice(0, 13), Number.NaN, 1]), null, 'a non-number refuses the range')
})

gagal('rentang_muncul_tepat_pada_14_hari', () => {
  const at = (n: number) => ok(metricInsight({ metric: RHR, series: run(n, (i) => 50 + (i % 9)), today: TODAY, window: 30 }))
  assert.equal(at(RANGE_MIN_DAYS - 1).range, null)
  assert.equal(at(RANGE_MIN_DAYS - 1).position, null)
  assert.equal(at(RANGE_MIN_DAYS - 1).rangeDays, 13)
  assert.notEqual(at(RANGE_MIN_DAYS).range, null)
  assert.equal(at(RANGE_MIN_DAYS).rangeDays, 14)
})

gagal('rentang_dari_90_hari_apa_pun_jendelanya', () => {
  // 30 days 70 bpm long ago, then 60 days at 50: the 7-day window still states the 90-day range.
  const series = [...run(30, () => 70, 60), ...run(60, () => 50)]
  const r = ok(metricInsight({ metric: RHR, series, today: TODAY, window: 7 }))
  assert.equal(r.rangeDays, 90)
  assert.deepEqual(r.range, { low: 50, high: 70, days: 90 })
  // A day older than 90 days is outside the span.
  const old = ok(metricInsight({ metric: RHR, series: [...series, { date: day(90), value: 99 }], today: TODAY, window: 7 }))
  assert.equal(old.rangeDays, 90)
  assert.equal(old.range?.high, 70)
})

gagal('posisi_bacaan_terakhir_terhadap_rentang', () => {
  const base = run(20, (i) => 50 + (i % 5)) // 50..54, ending yesterday? no: ends today
  const withLatest = (value: number) => ok(metricInsight({ metric: RHR, series: [...base.slice(0, -1), { date: TODAY, value }], today: TODAY, window: 7 }))
  assert.equal(withLatest(52).position, 'within')
  assert.equal(withLatest(70).position, 'above')
  assert.equal(withLatest(40).position, 'below')
})

// ── perbandingan pekan ──
gagal('banding_pekan_butuh_4_hari_per_paruh', () => {
  const recent = (n: number) => run(n, () => 9000)
  const previous = (n: number) => run(n, () => 6000, 7)
  const r = (a: number, b: number) => ok(metricInsight({ metric: STEPS, series: [...previous(b), ...recent(a)], today: TODAY, window: 30 }))
  assert.equal(r(WEEK_MIN_DAYS - 1, 7).change, null, 'recent half short')
  assert.equal(r(7, WEEK_MIN_DAYS - 1).change, null, 'previous half short')
  assert.deepEqual(r(WEEK_MIN_DAYS, WEEK_MIN_DAYS).change, { recentMean: 9000, previousMean: 6000, delta: 3000, recentDays: 4, previousDays: 4 })
  assert.equal(r(7, 7).change?.delta, 3000)
})

// ── kata-kata ──
gagal('kalimat_membawa_angka_dan_tidak_menilai', () => {
  // 7 days of 6,000 then 6 days of 9,000 and 8,029 today: range from 14 days, both week halves complete.
  const series = [...run(7, () => 6000, 7), ...run(7, (i) => (i === 6 ? 8029 : 9000))]
  const lines = insightLines(ok(metricInsight({ metric: STEPS, series, today: TODAY, window: 30 })))
  assert.deepEqual(lines.map((l) => l.text), [
    'Latest: 8,029 steps on Nov 15.',
    'Within your usual range of 6,000–9,000 steps (middle 80% of 14 recorded days out of the last 90).',
    'Last 7 days averaged 8,861 steps — 2,861 steps more than the 7 days before.',
    'Average over 30 days: 7,431 steps, from 14 recorded days.',
  ])
  assert.deepEqual(lines.map((l) => l.truth), ['measured', 'derived', 'derived', 'derived'])
  for (const l of lines) assert.doesNotMatch(l.text, /healthy|unhealthy|normal|abnormal|good|bad|risk|NaN|undefined|Infinity/i)
  assert.match(INSIGHT_BOUNDARY, /not a medical assessment/)
})

gagal('kalimat_tanpa_rentang_dan_tanpa_data', () => {
  const few = insightLines(ok(metricInsight({ metric: RHR, series: run(3, () => 57), today: TODAY, window: 7 })))
  assert.deepEqual(few.map((l) => l.text), [
    'Latest: 57 bpm on Nov 15.',
    'A usual range appears after 14 recorded days; 3 so far.',
    'Average over 7 days: 57 bpm, from 3 recorded days.',
  ])
  const none = insightLines(ok(metricInsight({ metric: RHR, series: [], today: TODAY, window: 90 })))
  assert.deepEqual(none, [{ text: 'Nothing recorded in the last 90 days.', truth: 'measured' }])
  const one = insightLines(ok(metricInsight({ metric: RHR, series: run(1, () => 57), today: TODAY, window: 7 })))
  assert.equal(one.at(-1)!.text, 'Average over 7 days: 57 bpm, from 1 recorded day.')
})

gagal('selisih_nol_pada_presisi_tampil_disebut_sama', () => {
  const series = [...run(7, () => 57.2, 7), ...run(7, () => 57.4)]
  const text = insightLines(ok(metricInsight({ metric: RHR, series, today: TODAY, window: 30 }))).map((l) => l.text).join(' ')
  assert.match(text, /averaged 57 bpm — about the same as the 7 days before/)
  const down = [...run(7, () => 60, 7), ...run(7, () => 57)]
  assert.match(insightLines(ok(metricInsight({ metric: RHR, series: down, today: TODAY, window: 30 }))).map((l) => l.text).join(' '), /3 bpm less than/)
})

gagal('format_satuan_dan_tanggal', () => {
  assert.equal(withUnit(8029, 0, 'steps'), '8,029 steps')
  assert.equal(withUnit(6.75, 1, 'h'), '6.8 h')
  assert.equal(withUnit(42.4, 1, ''), '42.4')
  assert.equal(shortDate('2026-01-05'), 'Jan 5')
})

gagal('registri_empat_sinyal_beku_dan_masuk_akal', () => {
  assert.deepEqual(GLANCE_METRICS.map((m) => m.id), ['steps', 'sleepH', 'restingHr', 'vo2max'])
  assert.equal(glanceMetric('stress'), null)
  for (const m of GLANCE_METRICS) {
    assert.ok(m.plausible.min < m.plausible.max, m.id)
    assert.match(m.hue.light, /^#[0-9a-f]{6}$/)
    assert.match(m.hue.dark, /^#[0-9a-f]{6}$/)
    assert.match(m.deepLink, /^\//)
  }
})

// One range rule for the whole app: the "usual" sentence from lib/riwayatVitals and this sheet must never state
// different numbers for the same days, so riwayatVitals may not carry a percentile formula of its own.
{
  const riwayat = readFileSync(new URL('../../src/lib/riwayatVitals.ts', import.meta.url), 'utf8')
  assert.match(riwayat, /import \{[^}]*\bpersonalRange\b[^}]*\} from '\.\.\/domains\/personal-health\/engine\/glance\/metricInsight\.ts'/,
    'rentangPribadi no longer uses the shared personalRange')
  assert.doesNotMatch(riwayat, /Math\.round\(\(\w+\.length - 1\) \* p\)/, 'riwayatVitals grew its own percentile formula again')
}

console.log('metric insight: empty days stay null; every refusal paired; usual range from 14 of 90 days and week comparison from 4+4 days at their boundaries; sentences carry numbers and never judge health')
