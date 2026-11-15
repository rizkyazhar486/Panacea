// Home health glance: the brief's micro charts and the insight sheet they open (the geometry and the tile's week are
// tested in glance-chart-geometry.mts).
//   - micro chart: a recorded zero is a stub, a missing day nothing; a gap splits the line;
//   - chart: the readout starts on the latest recorded day; the chart is named and keyboard-reachable;
//   - sheet content: hero, position, window choice, stats, lines tagged Reading/Calculated, every day as a table with
//     "No reading" for missing days, the empty state, the claim boundary — no NaN, every control and chart named.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'
import { dateOfDay, dayNumber, metricInsight, type DayValue, type MetricInsight } from '../../src/domains/personal-health/engine/glance/metricInsight.ts'
import { audit } from './support/markupAudit.mts'

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const TODAY = '2026-11-15'
const day = (back: number) => dateOfDay(dayNumber(TODAY)! - back)
const run = (n: number, f: (i: number) => number, endBack = 0): DayValue[] =>
  Array.from({ length: n }, (_, i) => ({ date: day(endBack + n - 1 - i), value: f(i) }))
const ok = (r: MetricInsight) => { assert.equal(r.ok, true); return r as Extract<MetricInsight, { ok: true }> }
const STEPS = glanceMetric('steps')!
const RHR = glanceMetric('restingHr')!

// ── UI dirender ──
const { build } = await import('esbuild')
const out = await build({
  stdin: {
    contents: [
      "export { MicroTrend, microTrendMarks, microTrendLabel } from './src/domains/personal-health/ui/glance/MicroTrend.tsx'",
      "export { InsightChart, readoutFor, chartLabel } from './src/domains/personal-health/ui/glance/InsightChart.tsx'",
      "export { MetricInsightContent } from './src/domains/personal-health/ui/glance/MetricInsightSheet.tsx'",
      "export { MemoryRouter } from 'react-router-dom'",
    ].join('\n'),
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/health-glance.uji.mjs', out.outputFiles[0]!.text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/health-glance.uji.mjs')).href)
const html = (component: unknown, props: Record<string, unknown>) => renderToStaticMarkup(createElement(component as never, props as never))
const inRouter = (component: unknown, props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(m.MemoryRouter, null, createElement(component as never, props as never)))
const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length
const clean = (markup: string) => {
  assert.deepEqual(audit(markup), [], 'accessibility findings')
  assert.doesNotMatch(markup.replace(/<[^>]+>/g, ' '), /NaN|undefined|Infinity/)
}

await gagal('mikro_batang_nol_tercatat_berbeda_dari_kosong', () => {
  const points = ok(metricInsight({ metric: STEPS, series: [{ date: day(5), value: 0 }, { date: day(0), value: 9000 }], today: TODAY, window: 7 })).points
  const marks = m.microTrendMarks(STEPS, points, 56, 26)
  assert.equal(marks.bars.length, 2, 'a recorded zero and a reading; five missing days draw nothing')
  assert.equal(marks.bars[0].height, 1.5, 'a recorded zero is a stub')
  const markup = html(m.MicroTrend, { metric: STEPS, points, dark: false })
  assert.equal(count(markup, /<rect/g), 2)
  assert.match(markup, /role="img" aria-label="Steps, last 7 days: 2 recorded"/)
  clean(markup)
  const empty = html(m.MicroTrend, { metric: STEPS, points: points.map((p: { date: string }) => ({ date: p.date, value: null })), dark: false })
  assert.equal(count(empty, /<rect|<polyline|<circle/g), 0, 'an empty week draws only its baseline')
  assert.match(empty, /0 recorded/)
})

await gagal('mikro_garis_dan_titik_terakhir', () => {
  const points = ok(metricInsight({ metric: RHR, series: [...run(2, () => 55, 4), ...run(2, () => 58)], today: TODAY, window: 7 })).points
  const markup = html(m.MicroTrend, { metric: RHR, points, dark: true })
  assert.equal(count(markup, /<polyline/g), 2, 'the gap splits the line')
  assert.equal(count(markup, /<circle/g), 1)
  assert.match(markup, /fill="#ec5872"/, 'dark step of the hue')
})

await gagal('grafik_pembacaan_dan_label', () => {
  const insight = ok(metricInsight({ metric: RHR, series: [{ date: day(2), value: 57 }], today: TODAY, window: 7 }))
  assert.equal(m.readoutFor(insight, 4), '57 bpm · Fri, Nov 13')
  assert.equal(m.readoutFor(insight, 6), 'No reading · Sun, Nov 15')
  assert.equal(m.readoutFor(insight, 99), '')
  const markup = html(m.InsightChart, { insight, dark: false })
  assert.match(markup, /aria-roledescription="chart"/)
  assert.match(markup, /aria-label="Resting HR, last 7 days, 1 recorded\. Use the left and right arrow keys to read each day\."/)
  assert.match(markup, /<strong[^>]*>57 bpm<\/strong>/, 'the readout starts on the latest recorded day, not on an empty today')
  assert.match(markup, /tabindex="0"/)
  clean(markup)
})

const series = [...run(7, () => 6000, 7), ...run(7, (i) => (i === 6 ? 8029 : 9000))]

await gagal('isi_lembar_angka_baris_dan_tabel', () => {
  const markup = inRouter(m.MetricInsightContent, { metricId: 'steps', series, today: TODAY, dark: false, boundary: createElement('p', null, 'BOUNDARY') })
  clean(markup)
  assert.match(markup, />8,029<\/span>/)
  assert.match(markup, /Latest reading Sun, Nov 15</)
  // Regression: the sheet once named the vitals' last-sync source as this reading's device. The history keeps no
  // source per reading, so none is claimed.
  assert.doesNotMatch(markup, /· from |Source:/)
  assert.match(markup, /Within your usual/)
  assert.equal(count(markup, /aria-pressed="true"/g), 1)
  assert.match(markup, /aria-pressed="true"[^>]*>7 days</)
  assert.equal(count(markup, />Reading</g), 1)
  assert.equal(count(markup, />Calculated</g), 3)
  assert.match(markup, /Last 7 days averaged 8,861 steps — 2,861 steps more than the 7 days before\./)
  assert.equal(count(markup, /<tr style/g), 7, 'a row for each of the 7 days')
  assert.match(markup, /Compared with your own records only — not a medical assessment\./)
  assert.match(markup, /BOUNDARY/)
  assert.match(markup, /href="\/tubuh\?t=gerak"/)
})

await gagal('isi_lembar_hari_kosong_tertulis_kosong', () => {
  const markup = inRouter(m.MetricInsightContent, { metricId: 'restingHr', series: run(3, () => 57, 2), today: TODAY, dark: false, initialDays: 7 })
  assert.equal(count(markup, />No reading</g), 4, 'four of the 7 days have no reading and say so')
  assert.match(markup, /A usual range appears after 14 recorded days; 3 so far\./)
  assert.doesNotMatch(markup, /Within your usual|Above your usual|Below your usual/, 'no position without a range')
  clean(markup)
})

await gagal('isi_lembar_tanpa_data_sama_sekali', () => {
  const markup = inRouter(m.MetricInsightContent, { metricId: 'vo2max', series: [], today: TODAY, dark: false })
  assert.match(markup, /No VO₂max readings in the last 90 days/)
  assert.match(markup, /a missing day is shown as missing, never as zero/)
  assert.match(markup, /href="\/health-data"/)
  assert.doesNotMatch(markup, /aria-roledescription="chart"|<table/, 'nothing charted from nothing')
  clean(markup)
})

await gagal('isi_lembar_menolak_nama_atau_tanggal_tak_dikenal', () => {
  assert.match(inRouter(m.MetricInsightContent, { metricId: 'stress', series, today: TODAY, dark: false }), /role="alert"/)
  assert.match(inRouter(m.MetricInsightContent, { metricId: 'steps', series, today: '2026-02-30', dark: false }), /role="alert"/)
  // Twin: the same props with a known name and a real day render the sheet.
  assert.doesNotMatch(inRouter(m.MetricInsightContent, { metricId: 'steps', series, today: TODAY, dark: false }), /role="alert"/)
})

await gagal('isi_lembar_jendela_90_hari', () => {
  const markup = inRouter(m.MetricInsightContent, { metricId: 'steps', series, today: TODAY, dark: true, initialDays: 90 })
  assert.equal(count(markup, /<tr style/g), 90)
  assert.match(markup, /aria-pressed="true"[^>]*>90 days</)
  assert.match(markup, />14</, 'days recorded')
  assert.match(markup, />of 90</)
  clean(markup)
})

console.log('health glance: micro charts and sheet render recorded days only, missing days stay "No reading", lines tagged Reading/Calculated, every control and chart named')
