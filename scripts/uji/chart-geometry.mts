// Geometri bagan: bentuk yang digambar harus persis mengikuti angkanya, dan masukan tak sah ditolak (gagal tertutup),
// bukan digambar dengan tebakan.
import assert from 'node:assert/strict'
import {
  arcPath, bubbleLayout, divergingBars, donutSlices, gaugeAngle, groupedBars, heatCells, polar, radarPoints, scale,
  seriesPath, stackedColumns, waterfallSteps,
} from '../../src/shared/charts/chartGeometry.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const B = { w: 100, h: 50 }
const dekat = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol

// ── polar & arc ──────────────────────────────────────────────────────────────────────────────────────────────
gagal('polar-nol-derajat-di-atas', () => {
  assert.deepEqual(polar(0, 0, 10, 0), { x: 0, y: -10 })
  assert.deepEqual(polar(0, 0, 10, 90), { x: 10, y: 0 })
  assert.deepEqual(polar(0, 0, 10, 180), { x: 0, y: 10 })
})
gagal('polar-menolak-jari-jari-negatif-dan-nan', () => {
  assert.equal(polar(0, 0, -1, 0), null)
  assert.equal(polar(0, 0, 10, NaN), null)
})
gagal('arc-busur-besar-ditandai-di-atas-180', () => {
  assert.match(arcPath(0, 0, 10, 5, 0, 181)!, /A10 10 0 1 1/)
  assert.match(arcPath(0, 0, 10, 5, 0, 179)!, /A10 10 0 0 1/)
})
gagal('arc-cincin-penuh-dua-setengah-busur', () => {
  const d = arcPath(0, 0, 10, 5, 0, 360)!
  assert.equal((d.match(/M/g) ?? []).length, 2, 'satu lingkaran butuh dua busur setengah')
  assert.equal(arcPath(0, 0, 10, 5, 0, 400), arcPath(0, 0, 10, 5, 0, 360), 'lebih dari penuh tetap penuh')
})
gagal('arc-menolak-bentuk-mustahil', () => {
  assert.equal(arcPath(0, 0, 10, 10, 0, 90), null, 'jari-jari dalam = luar')
  assert.equal(arcPath(0, 0, 10, 12, 0, 90), null, 'jari-jari dalam > luar')
  assert.equal(arcPath(0, 0, 10, 5, 90, 90), null, 'sapuan nol')
  assert.equal(arcPath(0, 0, 10, 5, 90, 20), null, 'sapuan mundur')
})

// ── donut ────────────────────────────────────────────────────────────────────────────────────────────────────
gagal('donut-sudut-sebanding-nilai-dan-menutup-lingkaran', () => {
  const s = donutSlices([{ key: 'a', value: 3 }, { key: 'b', value: 1 }])
  assert.equal(s.length, 2)
  assert.ok(dekat(s[0].to - s[0].from, 270) && dekat(s[1].to - s[1].from, 90))
  assert.ok(dekat(s[0].fraction, 0.75))
  assert.ok(dekat(s[1].to, 360), 'irisan menutup lingkaran penuh')
})
gagal('donut-mulai-dari-sudut-yang-diminta', () => {
  assert.equal(donutSlices([{ key: 'a', value: 1 }], -90)[0].from, -90)
})
gagal('donut-menolak-nilai-negatif-dan-total-nol', () => {
  assert.deepEqual(donutSlices([{ key: 'a', value: -1 }, { key: 'b', value: 2 }]), [])
  assert.deepEqual(donutSlices([{ key: 'a', value: 0 }]), [])
  assert.deepEqual(donutSlices([]), [])
  assert.deepEqual(donutSlices([{ key: 'a', value: NaN }]), [])
})

// ── gauge & scale ────────────────────────────────────────────────────────────────────────────────────────────
gagal('gauge-tengah-di-atas-dan-ujung-simetris', () => {
  assert.deepEqual(gaugeAngle(50, 0, 100), { deg: 0, t: 0.5 })
  assert.deepEqual(gaugeAngle(0, 0, 100), { deg: -120, t: 0 })
  assert.deepEqual(gaugeAngle(100, 0, 100), { deg: 120, t: 1 })
})
gagal('gauge-nilai-di-luar-rentang-dijepit-bukan-keluar-busur', () => {
  assert.deepEqual(gaugeAngle(999, 0, 100), { deg: 120, t: 1 })
  assert.deepEqual(gaugeAngle(-999, 0, 100), { deg: -120, t: 0 })
})
gagal('gauge-dan-scale-menolak-rentang-kosong', () => {
  assert.equal(gaugeAngle(1, 5, 5), null)
  assert.equal(gaugeAngle(1, 9, 5), null)
  assert.equal(scale(1, [3, 3], [0, 10]), null)
})
gagal('scale-memetakan-linier-termasuk-terbalik', () => {
  assert.equal(scale(5, [0, 10], [0, 100]), 50)
  assert.equal(scale(5, [0, 10], [100, 0]), 50)
  assert.equal(scale(0, [0, 10], [100, 0]), 100)
})

// ── series / area ────────────────────────────────────────────────────────────────────────────────────────────
gagal('series-nilai-tertinggi-di-atas-kotak', () => {
  const d = seriesPath([0, 10], 0, 10, B)!
  assert.equal(d, 'M0 50L100 0', 'min di dasar, maks di puncak, x dari 0 ke lebar')
})
gagal('series-tertutup-menambah-garis-dasar', () => {
  assert.match(seriesPath([0, 10], 0, 10, B, true)!, /L100 50L0 50Z$/)
})
gagal('series-menolak-satu-titik-kotak-nol-dan-rentang-kosong', () => {
  assert.equal(seriesPath([1], 0, 10, B), null)
  assert.equal(seriesPath([1, 2], 0, 10, { w: 0, h: 50 }), null)
  assert.equal(seriesPath([1, 2], 5, 5, B), null)
  assert.equal(seriesPath([1, NaN], 0, 10, B), null)
})

// ── stacked ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('stacked-kolom-terbesar-penuh-dan-bagian-bertumpuk-ke-atas', () => {
  const r = stackedColumns([{ key: 'a', parts: [1, 1] }, { key: 'b', parts: [1, 0] }], B, 0)
  const a = r.filter((x) => x.key === 'a')
  assert.ok(dekat(a[0].h + a[1].h, 50), 'kolom terbesar setinggi kotak')
  assert.ok(dekat(a[0].y, 25) && dekat(a[1].y, 0), 'bagian kedua duduk di atas yang pertama')
  assert.ok(dekat(r.find((x) => x.key === 'b')!.h, 25), 'kolom setengah → setengah tinggi')
})
gagal('stacked-menolak-baris-tak-seragam-nilai-negatif-dan-total-nol', () => {
  assert.deepEqual(stackedColumns([{ key: 'a', parts: [1] }, { key: 'b', parts: [1, 2] }], B), [])
  assert.deepEqual(stackedColumns([{ key: 'a', parts: [-1] }], B), [])
  assert.deepEqual(stackedColumns([{ key: 'a', parts: [0] }], B), [])
  assert.deepEqual(stackedColumns([{ key: 'a', parts: [1] }], B, 1), [], 'jarak 100% tidak menyisakan batang')
})

// ── diverging ────────────────────────────────────────────────────────────────────────────────────────────────
gagal('diverging-tumbuh-dua-arah-dari-garis-tengah', () => {
  const r = divergingBars([{ key: 'naik', value: 10 }, { key: 'turun', value: -5 }], B, 0)
  // Skala diambil dari BESARNYA, jadi nilai negatif terbesar pun tetap muat setengah kotak.
  const neg = divergingBars([{ key: 'turun', value: -10 }, { key: 'naik', value: 5 }], B, 0)
  assert.ok(dekat(neg[0].w, 50) && dekat(neg[1].w, 25), 'yang terbesar negatif tetap menjadi acuan skala')
  assert.ok(neg.every((x) => x.w <= 50.01), 'tidak ada batang yang melewati setengah kotak')
  assert.equal(r[0].x, 50, 'nilai positif mulai dari tengah')
  assert.ok(dekat(r[0].w, 50) && dekat(r[1].w, 25), 'panjang sebanding besarnya')
  assert.equal(r[1].x + r[1].w, 50, 'nilai negatif berakhir di tengah')
  assert.deepEqual([r[0].positive, r[1].positive], [true, false])
})
gagal('diverging-menolak-semua-nol-dan-nan', () => {
  assert.deepEqual(divergingBars([{ key: 'a', value: 0 }], B), [])
  assert.deepEqual(divergingBars([{ key: 'a', value: NaN }], B), [])
})

// ── waterfall ────────────────────────────────────────────────────────────────────────────────────────────────
gagal('waterfall-setiap-langkah-mulai-di-akhir-langkah-sebelumnya', () => {
  const r = waterfallSteps(100, [{ key: 'a', delta: -40 }, { key: 'b', delta: -10 }, { key: 'sisa', delta: 999, total: true }], B, 0)
  assert.deepEqual([r[0].start, r[0].end], [100, 60])
  assert.deepEqual([r[1].start, r[1].end], [60, 50])
  assert.deepEqual([r[2].start, r[2].end, r[2].total], [0, 50, true], 'batang total diukur dari nol dan mengabaikan delta')
  assert.ok(dekat(r[2].h, 25), 'total 50 dari rentang 0..100 → setengah tinggi')
})
gagal('waterfall-menolak-langkah-kosong-dan-delta-tak-sah', () => {
  assert.deepEqual(waterfallSteps(100, [], B), [])
  assert.deepEqual(waterfallSteps(100, [{ key: 'a', delta: NaN }], B), [])
  assert.deepEqual(waterfallSteps(0, [{ key: 'a', delta: 0 }], B), [], 'tanpa rentang tidak ada bentuk')
})

// ── radar ────────────────────────────────────────────────────────────────────────────────────────────────────
gagal('radar-sumbu-pertama-di-atas-dan-nilai-menentukan-jarak', () => {
  const p = radarPoints([1, 0.5, 0], 0, 0, 10)
  assert.equal(p.length, 3)
  assert.deepEqual(p[0], { x: 0, y: -10 }, 'sumbu pertama jam 12')
  assert.ok(dekat(Math.hypot(p[1].x, p[1].y), 5), 'nilai 0,5 → setengah jari-jari')
  assert.deepEqual(p[2], { x: 0, y: 0 }, 'nilai 0 → pusat')
})
gagal('radar-menolak-kurang-dari-tiga-sumbu-dan-nilai-negatif', () => {
  assert.deepEqual(radarPoints([1, 1], 0, 0, 10), [])
  assert.deepEqual(radarPoints([1, 1, -1], 0, 0, 10), [])
  assert.deepEqual(radarPoints([1, 1, 1], 0, 0, 0), [])
})
gagal('radar-nilai-di-atas-satu-dijepit-di-tepi', () => {
  assert.deepEqual(radarPoints([5, 1, 1], 0, 0, 10)[0], { x: 0, y: -10 })
})

// ── bubble ───────────────────────────────────────────────────────────────────────────────────────────────────
gagal('bubble-jari-jari-mengikuti-akar-luas', () => {
  const r = bubbleLayout([{ key: 'a', x: 0, y: 0, size: 4 }, { key: 'b', x: 1, y: 1, size: 1 }], [0, 1], [0, 1], B, 10)
  assert.equal(r[0].r, 10)
  assert.equal(r[1].r, 5, 'ukuran seperempat → jari-jari setengah (luas, bukan panjang)')
  assert.ok(r[0].cy > r[1].cy, 'nilai y lebih besar digambar lebih tinggi')
})
gagal('bubble-menolak-ukuran-negatif-domain-kosong-dan-semua-nol', () => {
  assert.deepEqual(bubbleLayout([{ key: 'a', x: 0, y: 0, size: -1 }], [0, 1], [0, 1], B, 10), [])
  assert.deepEqual(bubbleLayout([{ key: 'a', x: 0, y: 0, size: 1 }], [1, 1], [0, 1], B, 10), [])
  assert.deepEqual(bubbleLayout([{ key: 'a', x: 0, y: 0, size: 0 }], [0, 1], [0, 1], B, 10), [])
})

// ── heatmap ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('heat-t-menempatkan-nilai-antara-minimum-dan-maksimum', () => {
  const c = heatCells([[0, 5], [10, 5]], B, 0)
  assert.deepEqual(c.map((x) => x.t), [0, 0.5, 1, 0.5])
  assert.ok(dekat(c[0].w, 50) && dekat(c[0].h, 25), 'sel membagi kotak rata')
})
gagal('heat-matriks-datar-di-tengah-skala', () => {
  assert.deepEqual(heatCells([[3, 3]], B, 0).map((x) => x.t), [0.5, 0.5])
})
gagal('heat-menolak-baris-tak-seragam-dan-sel-lebih-kecil-dari-jarak', () => {
  assert.deepEqual(heatCells([[1, 2], [3]], B), [])
  assert.deepEqual(heatCells([[1, NaN]], B), [])
  assert.deepEqual(heatCells([[1, 2]], { w: 4, h: 4 }, 10), [])
})

// ── grouped ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('grouped-batang-tertinggi-penuh-dan-tidak-bertindih', () => {
  const r = groupedBars([{ key: 'a', values: [10, 5] }, { key: 'b', values: [0, 10] }], B, 0, 0)
  assert.ok(dekat(r[0].h, 50) && dekat(r[1].h, 25))
  assert.ok(r[0].x + r[0].w <= r[1].x + 0.01, 'batang dalam satu grup berdampingan')
  assert.equal(r.find((x) => x.value === 0)!.h, 0)
})
gagal('grouped-menolak-grup-tak-seragam-dan-maksimum-nol', () => {
  assert.deepEqual(groupedBars([{ key: 'a', values: [1] }, { key: 'b', values: [1, 1] }], B), [])
  assert.deepEqual(groupedBars([{ key: 'a', values: [0, 0] }], B), [])
  assert.deepEqual(groupedBars([{ key: 'a', values: [-1] }], B), [])
})

// ── determinisme ─────────────────────────────────────────────────────────────────────────────────────────────
gagal('deterministik', () => {
  assert.equal(arcPath(1, 2, 9, 4, 10, 200), arcPath(1, 2, 9, 4, 10, 200))
  assert.deepEqual(heatCells([[1, 2], [3, 4]], B), heatCells([[1, 2], [3, 4]], B))
})

console.log('chart-geometry: OK')
