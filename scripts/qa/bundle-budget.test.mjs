import test from 'node:test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import { analisisIndeks, periksaAnggaran } from './bundle-budget.mjs'

const gz = (b) => gzipSync(b, { level: 9 }).length
const A = Buffer.from('console.log("entri");'.repeat(200))
const V = Buffer.from('export const vendor = 1;'.repeat(300))
const D = Buffer.from('window.defer = 1;'.repeat(50))
const S1 = Buffer.from('.a{color:red}'.repeat(400))
const S2 = Buffer.from('.b{color:blue}'.repeat(100))
const berkas = { 'assets/index-1.js': A, 'assets/react-2.js': V, 'ui/d.js': D, 'ui/s1.css': S1, 'ui/s2.css': S2 }
const baca = (p) => berkas[p] ?? null
const HTML = `<!doctype html><head>
<link rel="stylesheet" href="./ui/s1.css?v=1" />
<link rel="stylesheet" href="/ui/s2.css" />
<script defer src="./ui/d.js?v=2"></script>
<script type="module" crossorigin src="./assets/index-1.js"></script>
<link rel="modulepreload" crossorigin href="./assets/react-2.js">
</head><body></body>`

test('mengukur_css_pemblokir_js_dan_total_gzip_persis', () => {
  const { metrik, galat } = analisisIndeks(HTML, baca)
  assert.deepEqual(galat, [])
  assert.equal(metrik.cssBlokirBerkas, 2)
  assert.equal(metrik.cssBlokirGzip, gz(S1) + gz(S2))
  assert.equal(metrik.jsBerkas, 3)
  assert.equal(metrik.jsGzip, gz(A) + gz(V) + gz(D))
  assert.equal(metrik.jsBlokirBerkas, 0)
  assert.equal(metrik.cssBlokirEksternal, 0)
  assert.equal(metrik.totalGzip, gz(S1) + gz(S2) + gz(A) + gz(V) + gz(D))
})

test('query_dan_awalan_relatif_atau_slash_dibuang_saat_membaca_berkas', () => {
  const diminta = []
  analisisIndeks(HTML, (p) => { diminta.push(p); return berkas[p] ?? null })
  assert.deepEqual(diminta.sort(), ['assets/index-1.js', 'assets/react-2.js', 'ui/d.js', 'ui/s1.css', 'ui/s2.css'])
})

test('menolak_berkas_yang_dirujuk_tetapi_hilang_dan_tidak_menghitungnya', () => {
  const tanpaVendor = (p) => (p === 'assets/react-2.js' ? null : berkas[p] ?? null)
  const { metrik, galat } = analisisIndeks(HTML, tanpaVendor)
  assert.deepEqual(galat, ['berkas dirujuk index.html tidak ada di dist: assets/react-2.js'])
  assert.equal(metrik.jsBerkas, 2) // vendor tidak ikut terhitung
  assert.equal(metrik.jsGzip, gz(A) + gz(D))
})

test('stylesheet_lintas_origin_dihitung_pemblokir_tetapi_tidak_diukur_ukurannya', () => {
  const html = HTML.replace('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap"></head>')
  const { metrik, galat } = analisisIndeks(html, baca)
  assert.deepEqual(galat, [])
  assert.equal(metrik.cssBlokirEksternal, 1)
  assert.equal(metrik.cssBlokirBerkas, 2) // lokal tetap 2
})

test('skrip_lintas_origin_adalah_galat_karena_tak_dapat_diukur', () => {
  const html = HTML.replace('</head>', '<script src="https://cdn.example/x.js"></script></head>')
  assert.deepEqual(analisisIndeks(html, baca).galat, ['skrip lintas-origin tak terukur: https://cdn.example/x.js'])
})

test('stylesheet_media_print_tidak_memblokir_render', () => {
  const html = HTML.replace('<link rel="stylesheet" href="/ui/s2.css" />', '<link rel="stylesheet" href="/ui/s2.css" media="print" />')
  const { metrik } = analisisIndeks(html, baca)
  assert.equal(metrik.cssBlokirBerkas, 1)
  assert.equal(metrik.cssBlokirGzip, gz(S1))
})

test('skrip_tanpa_defer_async_atau_module_dihitung_pemblokir', () => {
  const html = HTML.replace('<script defer src="./ui/d.js?v=2"></script>', '<script src="./ui/d.js"></script>')
  const { metrik } = analisisIndeks(html, baca)
  assert.equal(metrik.jsBlokirBerkas, 1)
  assert.equal(metrik.jsBerkas, 3)
})

test('atribut_data_src_tidak_dianggap_src', () => {
  const html = '<script type="module" data-src="./nope.js" src="./assets/index-1.js"></script>'
  const { metrik, galat } = analisisIndeks(html, baca)
  assert.deepEqual(galat, [])
  assert.equal(metrik.jsGzip, gz(A))
})

test('halaman_tanpa_skrip_adalah_galat_bukan_lulus', () => {
  const { galat } = analisisIndeks('<html><body>kosong</body></html>', baca)
  assert.equal(galat.length, 1)
  assert.match(galat[0], /tidak ada skrip/)
})

test('deterministik_dua_kali_hasil_identik', () => {
  assert.deepEqual(analisisIndeks(HTML, baca), analisisIndeks(HTML, baca))
})

const M = { cssBlokirBerkas: 15, cssBlokirGzip: 1000, cssBlokirEksternal: 2, jsBerkas: 8, jsGzip: 2000, jsBlokirBerkas: 0, totalGzip: 3000 }
const DASAR = { batas: { ...M } }

test('anggaran_tepat_di_batas_lulus', () => {
  assert.deepEqual(periksaAnggaran(M, DASAR), [])
})

test('anggaran_satu_di_atas_batas_gagal_dengan_nama_metrik', () => {
  assert.deepEqual(periksaAnggaran({ ...M, cssBlokirGzip: 1001 }, DASAR), ['cssBlokirGzip: 1001 > 1000'])
  assert.deepEqual(periksaAnggaran({ ...M, jsBlokirBerkas: 1 }, DASAR), ['jsBlokirBerkas: 1 > 0'])
})

test('anggaran_satu_di_bawah_batas_lulus', () => {
  assert.deepEqual(periksaAnggaran({ ...M, totalGzip: 2999 }, DASAR), [])
})

test('baseline_tanpa_batas_untuk_suatu_metrik_gagal_fail_closed', () => {
  const { totalGzip, ...tanpa } = DASAR.batas
  assert.deepEqual(periksaAnggaran(M, { batas: tanpa }), ['totalGzip: baseline tidak punya batas (fail-closed)'])
  assert.equal(periksaAnggaran(M, {}).length, Object.keys(M).length)
  assert.equal(periksaAnggaran(M, { batas: { ...DASAR.batas, jsGzip: 'banyak' } }).length, 1)
})
