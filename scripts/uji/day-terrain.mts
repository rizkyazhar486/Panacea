// Lanskap 3D hari × jam: kisi dari pembaca seri (hari tidak dikarang, dua sumber tidak dijumlah) dan proyeksinya
// (jam kosong = titik lantai bukan batang nol, digambar jauh→dekat, sudut di luar rentang ditolak, deterministik).
import assert from 'node:assert/strict'
import { dayHourGrid, type Reading } from '../../src/domains/personal-health/engine/glance/deviceSeries.ts'
import { dayTerrain } from '../../src/domains/personal-health/engine/glance/dayTerrain.ts'
import { glanceMetric } from '../../src/domains/personal-health/engine/glance/glanceMetrics.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const WIB = 420
const t = (iso: string) => Date.parse(`${iso}+07:00`)
const HRV = glanceMetric('hrvMs')!
const STEPS = glanceMetric('steps')!
const kosong = () => Array<number | null>(24).fill(null)

// ── Kisi hari × jam ──────────────────────────────────────────────────────────────────────────────────────────
gagal('kisi-rata-rata-kadar-per-jam-dan-hari-terurut', () => {
  const r: Reading[] = [
    { t: t('2026-11-19T06:10:00'), value: 50 }, { t: t('2026-11-19T06:50:00'), value: 60 },
    { t: t('2026-11-18T23:30:00'), value: 40 },
  ]
  const g = dayHourGrid(r, 'mean', WIB)
  assert.deepEqual(g.days, ['2026-11-18', '2026-11-19'])
  assert.equal(g.cells[1]![6], 55); assert.equal(g.cells[0]![23], 40); assert.equal(g.cells[0]![6], null, 'jam tanpa bacaan = null')
})
gagal('kisi-hitungan-ambil-sumber-terbesar-bukan-jumlah', () => {
  const r: Reading[] = [
    { t: t('2026-11-19T08:05:00'), value: 300, source: 'phone' }, { t: t('2026-11-19T08:20:00'), value: 200, source: 'phone' },
    { t: t('2026-11-19T08:10:00'), value: 450, source: 'watch' },
  ]
  assert.equal(dayHourGrid(r, 'sum', WIB).cells[0]![8], 500)
})
gagal('kisi-batas-hari-dan-masukan-tak-sah', () => {
  const r: Reading[] = Array.from({ length: 20 }, (_, i) => ({ t: t(`2026-11-${String(i + 1).padStart(2, '0')}T12:00:00`), value: i }))
  const g = dayHourGrid(r, 'mean', WIB, 14)
  assert.equal(g.days.length, 14); assert.equal(g.days[0], '2026-11-07', 'yang terbaru disimpan')
  assert.deepEqual(dayHourGrid(r, 'mean', 9999), { days: [], cells: [] })
  assert.deepEqual(dayHourGrid(r, 'mean', WIB, 0), { days: [], cells: [] }); assert.deepEqual(dayHourGrid(r, 'mean', WIB, 91), { days: [], cells: [] })
  assert.equal(dayHourGrid(r, 'mean', WIB, 90).days.length, 20)
  assert.deepEqual(dayHourGrid([{ t: Number.NaN, value: 1 }, { t: t('2026-11-01T01:00:00'), value: Number.NaN }], 'mean', WIB), { days: [], cells: [] })
})

// ── Proyeksi ─────────────────────────────────────────────────────────────────────────────────────────────────
const dua = { days: ['2026-11-18', '2026-11-19'], cells: [kosong().map((_, h) => (h === 3 ? 60 : h === 15 ? 20 : null)), kosong().map((_, h) => (h === 3 ? 58 : null))] }
gagal('tiga-muka-per-batang-dan-titik-untuk-jam-kosong', () => {
  const s = dayTerrain(HRV, dua)!
  assert.equal(s.faces.length, 3 * 3, '3 batang × (atap + 2 sisi terlihat)')
  assert.equal(s.faces.filter((f) => f.shade === 0).length, 3)
  assert.equal(s.gaps.length, 48 - 3, 'jam kosong = titik lantai')
  assert.equal(s.faces.filter((f) => f.peak && f.shade === 0).length, 1)
  assert.equal(s.sentence, 'Across 2 days: highest 60 ms at 03:00 on Nov 18; 3 of 48 hours have readings.')
  assert.deepEqual(s.labels.map((l) => l.text), ['00', '06', '12', '18', 'Nov 19', 'Nov 18'])
  assert.doesNotMatch(s.sentence, /normal|healthy|abnormal|good|bad/i)
})
gagal('menghadap-lurus-hanya-sisi-depan', () => {
  const s = dayTerrain(HRV, dua, 0)!
  assert.equal(s.faces.length, 3 * 2, 'yaw 0: atap + sisi depan saja')
})
gagal('digambar-jauh-ke-dekat', () => {
  const s = dayTerrain(HRV, dua)!
  const atap = s.faces.filter((f) => f.shade === 0).map((f) => Math.max(...f.points.split(' ').map((p) => Number(p.split(',')[1]))))
  assert.ok(atap[0]! <= atap[atap.length - 1]!, 'atap pertama (jauh) lebih tinggi di layar daripada yang terakhir (dekat)')
})
gagal('kadar-terendah-tetap-terlihat-hitungan-nol-datar', () => {
  const lv = dayTerrain(HRV, dua)!.faces.filter((f) => f.shade === 0).map((f) => f.level)
  assert.ok(Math.abs(Math.min(...lv) - 0.08) < 1e-9, 'kadar terendah 8% tinggi'); assert.equal(Math.max(...lv), 1)
  const langkah = { days: ['2026-11-19'], cells: [kosong().map((_, h) => (h === 8 ? 1000 : h === 9 ? 0 : null))] }
  const l2 = dayTerrain(STEPS, langkah)!.faces.filter((f) => f.shade === 0).map((f) => f.level)
  assert.deepEqual(l2.sort(), [0, 1], 'hitungan 0 = batang datar, tetap bacaan (bukan titik)')
  assert.equal(dayTerrain(STEPS, langkah)!.gaps.length, 22)
})
gagal('menolak-kisi-dan-sudut-tak-sah', () => {
  assert.equal(dayTerrain(HRV, { days: [], cells: [] }), null)
  assert.equal(dayTerrain(HRV, { days: ['2026-11-19'], cells: [kosong()] }), null, 'tanpa bacaan')
  assert.equal(dayTerrain(HRV, { days: ['2026-11-19'], cells: [Array(23).fill(1)] }), null)
  assert.equal(dayTerrain(HRV, { days: ['a', 'b'], cells: [kosong()] }), null, 'jumlah baris ≠ hari')
  assert.equal(dayTerrain(HRV, dua, Number.NaN), null)
  assert.equal(dayTerrain(HRV, dua, -35, 4.9), null); assert.equal(dayTerrain(HRV, dua, -35, 85.1), null)
  assert.ok(dayTerrain(HRV, dua, -35, 5)); assert.ok(dayTerrain(HRV, dua, -35, 85))
})
gagal('deterministik-dan-putaran-mengubah-titik-bukan-isi', () => {
  assert.deepEqual(dayTerrain(HRV, dua), dayTerrain(HRV, dua))
  const a = dayTerrain(HRV, dua, -35)!, b = dayTerrain(HRV, dua, 30)!
  assert.notEqual(a.faces[0]!.points, b.faces[0]!.points); assert.equal(a.faces.length, b.faces.length); assert.equal(a.sentence, b.sentence)
})
console.log('day-terrain: OK')
