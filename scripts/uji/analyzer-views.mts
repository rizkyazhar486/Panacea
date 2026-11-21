// Tampilan penganalisis Health Data: pola hari-dalam-pekan, sebaran 90 hari, dan cakupan sinyal. Memakai aturan
// metricInsight yang sama (hari kosong tetap kosong, impor mustahil ditolak), kalimat menyebut angkanya dan tidak
// pernah menilai sehat/sakit, dan masukan tak sah gagal tertutup.
import assert from 'node:assert/strict'
import { ANALYZER_METRICS, GLANCE_METRICS, glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'
import { WEEKDAY_MIN_READINGS, coverage, spread, typicalDay, weekdayPattern } from '../../src/domains/personal-health/engine/glance/analyzerViews.ts'
import { dateOfDay, dayNumber } from '../../src/domains/personal-health/engine/glance/metricInsight.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const HARI = '2026-11-20' // Jumat
const RHR = glanceMetric('restingHr')!
const T = dayNumber(HARI)!
const deret = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => ({ date: dateOfDay(T - n + 1 + i), value: f(i) }))
const TANPA_PENILAIAN = /normal|healthy|abnormal|good|bad|sehat/i

// ── Daftar metrik ────────────────────────────────────────────────────────────────────────────────────────────
gagal('empat-metrik-home-tetap-dan-penganalisis-memperluasnya', () => {
  assert.deepEqual(GLANCE_METRICS.map((m) => m.id), ['steps', 'sleepH', 'restingHr', 'vo2max'], 'Home tidak berubah')
  assert.deepEqual(ANALYZER_METRICS.map((m) => m.id), ['steps', 'sleepH', 'restingHr', 'vo2max', 'hrvMs', 'spo2Pct', 'respRate', 'systolic', 'weightKg'])
  assert.equal(new Set(ANALYZER_METRICS.map((m) => m.id)).size, ANALYZER_METRICS.length, 'tanpa duplikat')
  for (const m of ANALYZER_METRICS) {
    assert.ok(m.plausible.min < m.plausible.max, m.id); assert.match(m.hue.light, /^#[0-9a-f]{6}$/); assert.match(m.hue.dark, /^#[0-9a-f]{6}$/)
    assert.match(m.deepLink, /^\//); assert.doesNotMatch(m.about, TANPA_PENILAIAN, `${m.id}: penjelasan tidak menilai`)
  }
  assert.equal(glanceMetric('spo2Pct')?.unit, '%'); assert.equal(glanceMetric('tidak-ada'), null)
})

// ── Pola hari dalam pekan ────────────────────────────────────────────────────────────────────────────────────
gagal('pola-pekan-senin-dulu-dan-menyebut-median', () => {
  // 8 pekan; Senin 70, Minggu 50, hari lain 60.
  const p = weekdayPattern(RHR, deret(56, (i) => { const wd = new Date(`${dateOfDay(T - 55 + i)}T12:00:00Z`).getUTCDay(); return wd === 1 ? 70 : wd === 0 ? 50 : 60 }), HARI)
  assert.deepEqual(p.days.map((d) => d.name), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  assert.equal(p.sentence, 'Highest on Mon (median 70 bpm), lowest on Sun (50).')
  assert.ok(p.days.every((d) => d.values.length === 8))
})
gagal('pola-pekan-batas-4-bacaan', () => {
  const tiga = weekdayPattern(RHR, deret(21, () => 60), HARI)
  assert.ok(tiga.days.every((d) => d.values.length === 0), '3 bacaan per hari tidak cukup')
  assert.equal(tiga.sentence, `Weekday pattern needs ${WEEKDAY_MIN_READINGS} readings on at least two weekdays.`)
  // Hanya Senin yang cukup: tidak ada pembanding, jadi tidak ada kalimat "tertinggi/terendah".
  const senin = [0, 1, 2, 3].map((w) => ({ date: dateOfDay(T - 4 - 7 * w), value: 60 })) // 2026-11-16 = Senin
  const satu = weekdayPattern(RHR, senin, HARI)
  assert.equal(satu.days.filter((d) => d.values.length).length, 1)
  assert.equal(satu.sentence, `Weekday pattern needs ${WEEKDAY_MIN_READINGS} readings on at least two weekdays.`)
  const empat = weekdayPattern(RHR, deret(28, () => 60), HARI)
  assert.ok(empat.days.every((d) => d.values.length === 4))
})

// ── Sebaran ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('sebaran-peringkat-terakhir', () => {
  const s = spread(RHR, deret(10, (i) => 50 + i), HARI)
  assert.equal(s.latest, 59); assert.equal(s.rank, 1)
  assert.equal(s.sentence, 'Latest 59 bpm is at or above 100% of your last 10 readings.')
  const turun = spread(RHR, deret(10, (i) => 60 - i), HARI)
  assert.equal(turun.rank, 0.1); assert.equal(turun.sentence, 'Latest 51 bpm is below 90% of your last 10 readings.')
  // Separuh di bawah, separuh di atas: peringkat 0.5 memakai kalimat "at or above".
  assert.equal(spread(RHR, [...deret(9, (i) => (i < 5 ? 50 : 70)), { date: HARI, value: 60 }].slice(-10), HARI).sentence.startsWith('Latest 60 bpm is'), true)
})
gagal('angka-ribuan-seperti-baris-wawasan-lain', () => {
  const s = spread(glanceMetric('steps')!, deret(6, (i) => 12000 + i * 1000), HARI)
  assert.equal(s.sentence, 'Latest 17,000 steps is at or above 100% of your last 6 readings.')
})
gagal('sebaran-terlalu-sedikit-dan-kosong', () => {
  assert.equal(spread(RHR, deret(4, () => 60), HARI).sentence, '4 readings so far — too few to show a spread.')
  assert.equal(spread(RHR, deret(5, () => 60), HARI).sentence, 'Latest 60 bpm is at or above 100% of your last 5 readings.')
  const kosong = spread(RHR, [], HARI)
  assert.deepEqual([kosong.latest, kosong.rank, kosong.values.length], [null, null, 0])
})

// ── Cakupan ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('cakupan-baris-metrik-kolom-hari', () => {
  const c = coverage([RHR, glanceMetric('steps')!], { restingHr: deret(3, () => 60), steps: [{ date: dateOfDay(T - 27), value: 8000 }] }, HARI)
  assert.equal(c.days, 28); assert.deepEqual(c.counts, [3, 1])
  assert.deepEqual(c.matrix[0].slice(-4), [0, 1, 1, 1]); assert.equal(c.matrix[1][0], 1, 'hari tertua di kiri')
  assert.equal(c.sentence, 'Resting HR arrived on 3 of 28 days; Steps on 1.')
})
gagal('cakupan-impor-mustahil-dihitung-kosong', () => {
  const c = coverage([RHR], { restingHr: [{ date: HARI, value: 900 }, { date: dateOfDay(T - 1), value: NaN }] }, HARI)
  assert.deepEqual(c.counts, [0]); assert.equal(c.sentence, 'No readings arrived in the last 28 days. Connect a device or import a file.')
})
gagal('cakupan-menolak-tak-sah', () => {
  for (const [t, d] of [['x', 28], [HARI, 0], [HARI, 91], [HARI, 2.5]] as const) {
    const c = coverage([RHR], {}, t, d)
    assert.deepEqual([c.matrix.length, c.days], [0, 0], `${t}/${d}`)
  }
  assert.deepEqual(coverage([], {}, HARI).matrix, [])
})

// ── Lintas tampilan ──────────────────────────────────────────────────────────────────────────────────────────
gagal('tanpa-penilaian-kesehatan-dan-deterministik', () => {
  const s = deret(60, (i) => 55 + (i % 7))
  for (const t of [weekdayPattern(RHR, s, HARI).sentence, spread(RHR, s, HARI).sentence, coverage([RHR], { restingHr: s }, HARI).sentence]) {
    assert.doesNotMatch(t, TANPA_PENILAIAN, t)
  }
  assert.deepEqual(weekdayPattern(RHR, s, HARI), weekdayPattern(RHR, s, HARI))
})
gagal('hari-ini-tak-sah-tanpa-data', () => {
  assert.ok(weekdayPattern(RHR, deret(30, () => 60), '2026-02-30').days.every((d) => d.values.length === 0))
  assert.equal(spread(RHR, deret(30, () => 60), 'bukan-tanggal').latest, null)
})

// ── Hari khas (jam 24) ───────────────────────────────────────────────────────────────────────────────────────
const STEPS = glanceMetric('steps')!
const jam = (f: (h: number) => number | null) => Array.from({ length: 24 }, (_, h) => f(h))
const jari = (d: NonNullable<ReturnType<typeof typicalDay>>, h: number) => { const s = d.spokes.find((x) => x.hour === h)!; return Math.hypot(s.x2 - 100, s.y2 - 100) }
gagal('hari-khas-garis-hanya-jam-terekam', () => {
  const d = typicalDay(RHR, jam((h) => (h % 2 ? null : 50 + h)))!
  assert.equal(d.spokes.length, 12); assert.equal(d.empty.length, 12, 'jam kosong = titik, bukan jari nol')
  const nol = d.spokes.find((s) => s.hour === 0)!
  assert.deepEqual([nol.x1, nol.y1, nol.x2, nol.y2], [100, 60, 100, 54], 'tengah malam di atas; terendah = 6 px minimum')
  assert.ok(Math.abs(jari(d, 22) - 84) < 0.01, 'tertinggi mencapai cincin luar')
  assert.equal(d.sentence, 'Highest around 22:00 (72 bpm), lowest around 00:00 (50); 12 of 24 hours have readings.')
  assert.doesNotMatch(d.sentence, TANPA_PENILAIAN)
})
gagal('hari-khas-batang-mulai-dari-nol', () => {
  const d = typicalDay(STEPS, jam((h) => (h === 12 ? 1000 : h === 0 ? 500 : null)))!
  assert.ok(Math.abs(jari(d, 12) - 84) < 0.01)
  assert.ok(Math.abs(jari(d, 0) - (40 + 6 + 0.5 * (84 - 40 - 6))) < 0.01, 'hitungan: 500 dari 1000 = setengah rentang')
  const rendah = typicalDay(RHR, jam((h) => (h === 12 ? 1000 : h === 0 ? 500 : null)))!
  assert.ok(Math.abs(jari(rendah, 0) - 46) < 0.01, 'kadar: mulai dari jam terendah')
})
gagal('hari-khas-rata-dan-satu-jam', () => {
  const rata = typicalDay(RHR, jam(() => 60))!
  assert.equal(rata.spokes.length, 24); assert.ok(rata.spokes.every((s) => Math.abs(Math.hypot(s.x2 - 100, s.y2 - 100) - 84) < 0.01))
  const satu = typicalDay(RHR, jam((h) => (h === 5 ? 58 : null)))!
  assert.equal(satu.spokes.length, 1); assert.equal(satu.empty.length, 23)
  assert.equal(satu.sentence, 'Only 05:00 has readings so far (58 bpm).')
})
gagal('hari-khas-menolak-profil-tak-sah', () => {
  assert.equal(typicalDay(RHR, jam(() => null)), null)
  assert.equal(typicalDay(RHR, Array(23).fill(60)), null); assert.equal(typicalDay(RHR, Array(25).fill(60)), null)
  assert.equal(typicalDay(RHR, jam(() => 60), 0), null)
  assert.equal(typicalDay(RHR, jam((h) => (h ? null : Number.NaN))), null, 'NaN bukan bacaan')
})

console.log('analyzer-views: OK')
