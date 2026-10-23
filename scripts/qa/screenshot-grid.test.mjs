import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gridDari, bandingkanGrid, bandingkanSemua, KOLOM, BARIS, TOL_SEL, MAKS_SEL_MENYIMPANG, TOL_RATA } from './screenshot-grid.mjs'

const rata = (w, h, v) => { const a = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < a.length; i += 4) { a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255 } return a }
const grid = (v) => new Array(KOLOM * BARIS).fill(v)

test('grid_dari_gambar_rata_bernilai_sama', () => {
  assert.deepEqual(gridDari(rata(80, 120, 100), 80, 120), grid(100))
})
test('grid_menolak_ukuran_tak_cocok_dan_terlalu_kecil', () => {
  assert.equal(gridDari(rata(80, 120, 100), 80, 119), null)
  assert.equal(gridDari(rata(4, 4, 1), 4, 4), null)
  assert.equal(gridDari(null, 80, 120), null)
  assert.equal(gridDari(rata(80, 120, 0), 80.5, 120), null)
})
test('grid_membedakan_separuh_atas_dan_bawah', () => {
  const a = rata(80, 120, 0); for (let i = 80 * 60 * 4; i < a.length; i += 4) { a[i] = a[i + 1] = a[i + 2] = 255 }
  const g = gridDari(a, 80, 120)
  assert.equal(g[0], 0); assert.equal(g[g.length - 1], 255)
})
test('lulus_untuk_grid_identik_dan_derau_kecil', () => {
  assert.deepEqual(bandingkanGrid(grid(100), grid(100)), [])
  assert.deepEqual(bandingkanGrid(grid(110), grid(100)), [])
})
test('menolak_layar_kosong_vs_halaman_berisi', () => {
  const g = bandingkanGrid(grid(255), grid(30))
  assert.equal(g.length, 2); assert.match(g[0], /sel menyimpang/); assert.match(g[1], /rata-rata/)
})
test('batas_sel_menyimpang_tepat_dan_satu_di_atas', () => {
  const base = grid(100)
  const ukur = (n) => grid(100).map((v, i) => (i < n ? v + TOL_SEL + 1 : v))
  assert.deepEqual(bandingkanGrid(ukur(MAKS_SEL_MENYIMPANG), base), [])
  assert.match(bandingkanGrid(ukur(MAKS_SEL_MENYIMPANG + 1), base)[0], /sel menyimpang/)
})
test('batas_selisih_rata_tepat_dan_di_atas', () => {
  const base = grid(100)
  assert.deepEqual(bandingkanGrid(grid(100 + TOL_RATA), base), [])
  assert.match(bandingkanGrid(grid(100 + TOL_RATA + 1), base).join(), /rata-rata/)
})
test('fail_closed_untuk_grid_tak_sahih', () => {
  assert.match(bandingkanGrid(grid(1), null)[0], /baseline/)
  assert.match(bandingkanGrid(grid(1), [1, 2])[0], /baseline/)
  assert.match(bandingkanGrid([...grid(1).slice(1), NaN], grid(1))[0], /terukur/)
  assert.match(bandingkanGrid(grid(300), grid(1))[0], /terukur/)
})
test('semua_menolak_baseline_kosong_kunci_hilang_dan_kunci_baru', () => {
  assert.match(bandingkanSemua({ a: grid(1) }, null)[0], /fail-closed/)
  assert.match(bandingkanSemua({ a: grid(1) }, { grid: {} })[0], /fail-closed/)
  assert.deepEqual(bandingkanSemua({ a: grid(1) }, { grid: { a: grid(1) } }), [])
  assert.match(bandingkanSemua({}, { grid: { a: grid(1) } })[0], /a: tidak terukur/)
  assert.match(bandingkanSemua({ a: grid(1), b: grid(1) }, { grid: { a: grid(1) } })[0], /b: tidak ada di baseline/)
})
test('deterministik', () => {
  const a = rata(80, 120, 77)
  assert.deepEqual(gridDari(a, 80, 120), gridDari(a, 80, 120))
})

import { readFileSync } from 'node:fs'
test('baseline_repo_berbentuk_sah_dan_mencakup_semua_kombinasi', () => {
  const b = JSON.parse(readFileSync(new URL('../../governance/SCREENSHOT_GRID_BASELINE.json', import.meta.url), 'utf8'))
  assert.equal(b.kolom, KOLOM); assert.equal(b.baris, BARIS)
  const kunci = Object.keys(b.grid)
  assert.equal(kunci.length, 36, '9 halaman x 2 viewport x 2 tema')
  for (const k of kunci) assert.deepEqual(bandingkanGrid(b.grid[k], b.grid[k]), [], `${k}: grid baseline harus sahih dan lulus terhadap dirinya sendiri`)
  // negatif: satu kombinasi dihapus = gerbang menolak (fail-closed), bukan diam-diam menurunkan cakupan
  const {[kunci[0]]: _, ...kurang} = b.grid
  assert.match(bandingkanSemua(b.grid, { grid: kurang }).join(), /tidak ada di baseline/)
  // negatif: layar kosong (putih) pada satu kombinasi gelap ditolak dengan nama kuncinya
  const putih = { ...b.grid, [kunci.find((k) => k.includes('|dark|'))]: grid(255) }
  assert.match(bandingkanSemua(putih, b).join(), /\|dark\|.*sel menyimpang/)
})
