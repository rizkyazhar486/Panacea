// Glance chart geometry and the tile's week: the pure engine behind the Home micro charts and the insight chart.
//   - one scale for marks, ticks and the usual-range band; bars start at zero; a missing day has no mark; a line breaks
//     at a missing day; the pointer index is clamped to a day; all-zero totals keep a positive axis;
//   - the tile's 7-day glance claims a position only from this week's reading, never from a stale one.
import assert from 'node:assert/strict'
import { barPath, DEFAULT_BOX, niceTicks, planChart } from '../../src/domains/personal-health/engine/glance/chartGeometry.ts'
import { glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'
import { dateOfDay, dayNumber, metricInsight, type DayValue, type MetricInsight } from '../../src/domains/personal-health/engine/glance/metricInsight.ts'
import { localDayOf, weekGlance } from '../../src/domains/personal-health/engine/glance/weekGlance.ts'

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const TODAY = '2026-11-15'
const day = (back: number) => dateOfDay(dayNumber(TODAY)! - back)
const run = (n: number, f: (i: number) => number, endBack = 0): DayValue[] =>
  Array.from({ length: n }, (_, i) => ({ date: day(endBack + n - 1 - i), value: f(i) }))
const ok = (r: MetricInsight) => { assert.equal(r.ok, true); return r as Extract<MetricInsight, { ok: true }> }
const STEPS = glanceMetric('steps')!
const RHR = glanceMetric('restingHr')!

// ── skala ──
await gagal('nice_ticks_nilai_eksak_dan_ditolak', () => {
  assert.deepEqual(niceTicks(0, 9000, 3), [0, 5000, 10000])
  assert.deepEqual(niceTicks(50.2, 62.8, 3), [50, 55, 60, 65])
  assert.deepEqual(niceTicks(0, 7.9, 3), [0, 5, 10])
  assert.deepEqual(niceTicks(57, 57, 3), [54, 56, 58, 60], 'a flat series still gets a span (±5%)')
  assert.deepEqual(niceTicks(0, 0, 3), [-1, 0, 1])
  for (const [a, b, t] of [[Number.NaN, 1, 3], [0, Number.POSITIVE_INFINITY, 3], [5, 1, 3], [0, 1, 0]] as const) {
    assert.deepEqual(niceTicks(a, b, t), [], `${a},${b},${t}`)
  }
})

await gagal('rencana_batang_dari_nol_dan_hari_kosong_tanpa_tanda', () => {
  const insight = ok(metricInsight({ metric: STEPS, series: [{ date: day(6), value: 4000 }, { date: day(0), value: 8000 }], today: TODAY, window: 7 }))
  const plan = planChart(insight)
  assert.equal(plan.xs.length, 7)
  assert.equal(plan.ticks[0]!.value, 0, 'bars start at zero')
  assert.equal(plan.ticks[0]!.y, DEFAULT_BOX.height - DEFAULT_BOX.pad.bottom)
  assert.deepEqual(plan.bars.map((b) => b.index), [0, 6], 'only recorded days have a bar')
  assert.equal(plan.runs.length, 0)
  const [first, last] = plan.bars
  assert.ok(Math.abs(first!.height * 2 - last!.height) < 1e-9, 'a bar twice as long means twice the value')
  for (const bar of plan.bars) assert.ok(bar.width <= 24 && bar.width > 0)
  assert.match(barPath(last!), /^M[\d.]+,[\d.]+V/)
})

await gagal('rencana_garis_putus_di_hari_kosong', () => {
  const series = [...run(3, () => 55, 4), ...run(3, () => 58)] // days 6..4 and 2..0; day 3 missing
  const plan = planChart(ok(metricInsight({ metric: RHR, series, today: TODAY, window: 7 })))
  assert.deepEqual(plan.runs.map((r) => r.map((d) => d.index)), [[0, 1, 2], [4, 5, 6]])
  assert.equal(plan.bars.length, 0)
  assert.ok(plan.ticks[0]!.value < 55 && plan.ticks.at(-1)!.value > 58, 'the domain pads around the readings')
})

await gagal('pita_rentang_pada_skala_yang_sama', () => {
  const series = run(20, (i) => 50 + (i % 10)) // usual range 51..58
  const insight = ok(metricInsight({ metric: RHR, series, today: TODAY, window: 7 }))
  const plan = planChart(insight)
  const y = (v: number) => {
    const [a, b] = [plan.ticks[0]!, plan.ticks.at(-1)!]
    return a.y + ((v - a.value) / (b.value - a.value)) * (b.y - a.y)
  }
  assert.ok(plan.band)
  assert.ok(Math.abs(plan.band!.y - y(insight.range!.high)) < 1e-9)
  assert.ok(Math.abs(plan.band!.y + plan.band!.height - y(insight.range!.low)) < 1e-9)
  // Twin without a range: no band.
  assert.equal(planChart(ok(metricInsight({ metric: RHR, series: run(5, () => 55), today: TODAY, window: 7 }))).band, null)
})

await gagal('indeks_pointer_dijepit_ke_hari', () => {
  const plan = planChart(ok(metricInsight({ metric: STEPS, series: [], today: TODAY, window: 30 })))
  assert.equal(plan.indexAt(-50), 0)
  assert.equal(plan.indexAt(DEFAULT_BOX.width + 50), 29)
  assert.equal(plan.indexAt(plan.xs[12]!), 12)
  assert.equal(plan.bars.length + plan.dots.length + plan.ticks.length, 0, 'no data, no marks, no axis values')
  assert.equal(plan.xLabels.length, 3)
})

await gagal('rekaman_nol_semua_tetap_bersumbu_positif', () => {
  const plan = planChart(ok(metricInsight({ metric: STEPS, series: run(3, () => 0), today: TODAY, window: 7 })))
  assert.deepEqual(plan.ticks.map((t) => t.value), [0, 0.5, 1])
  assert.ok(plan.ticks.every((t) => t.value >= 0), 'no negative axis for a daily total')
  assert.equal(plan.bars.length, 3)
})

// ── ubin ──
await gagal('ubin_7_hari_dan_posisi_bacaan_pekan_ini', () => {
  const series = [...run(30, () => 70, 60), ...run(60, (i) => (i === 59 ? 75 : 50))]
  const glance = weekGlance('restingHr', series, TODAY)!
  assert.equal(glance.points.length, 7)
  assert.equal(glance.window, 7)
  assert.equal(glance.position, 'above', 'today 75 against a 90-day range 50–70')
  // A reading older than the week: the range exists, but the tile claims no position from a stale reading.
  const stale = weekGlance('restingHr', series.slice(0, -10), TODAY)!
  assert.notEqual(stale.range, null)
  assert.equal(stale.stats, null)
  assert.equal(stale.position, null)
  assert.equal(weekGlance('stress', series, TODAY), null)
  assert.equal(weekGlance('restingHr', series, '2026-02-30'), null)
  assert.equal(localDayOf(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
})

console.log('glance chart geometry: one scale for bars, lines and the usual-range band, bars from zero, gaps stay gaps, pointer clamped to a day; a tile claims no position from a stale reading')
