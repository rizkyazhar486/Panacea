import { test } from 'node:test'
import assert from 'node:assert/strict'
import { klasifikasiDeploy, galatHttp, STATUS_LULUS, JALUR_BACKEND, JALUR_FRONTEND } from './deploy-equivalence.mjs'

const M = 'a'.repeat(40), D = 'b'.repeat(40)
const k = (o) => klasifikasiDeploy({ deployedSha: D, mainSha: M, adalahLeluhur: true, jalurBerubah: [], ...o })

test('sama_bila_sha_identik', () => { assert.equal(k({ deployedSha: M }).status, 'sama') })
test('setara_bila_leluhur_tanpa_perubahan_jalur', () => { assert.equal(k({}).status, 'setara') })
test('tertinggal_bila_ada_perubahan_jalur_dan_menyebut_berkas', () => {
  const r = k({ jalurBerubah: ['server/src/a.ts'] })
  assert.equal(r.status, 'tertinggal'); assert.match(r.alasan, /server\/src\/a\.ts/)
})
test('menyimpang_bila_bukan_leluhur_meski_jalur_tak_berubah', () => { assert.equal(k({ adalahLeluhur: false }).status, 'menyimpang') })
test('tidak_diketahui_untuk_sha_tak_valid', () => {
  for (const bad of [null, undefined, '', 'main', 'B'.repeat(40), 'b'.repeat(39), 'b'.repeat(41), 'g'.repeat(40), 12]) assert.equal(k({ deployedSha: bad }).status, 'tidak-diketahui', String(bad))
  assert.equal(k({ mainSha: 'x' }).status, 'tidak-diketahui')
})
test('hanya_sama_dan_setara_lulus', () => {
  assert.deepEqual([...STATUS_LULUS].sort(), ['sama', 'setara'])
  for (const s of ['tertinggal', 'menyimpang', 'tidak-diketahui']) assert.equal(STATUS_LULUS.has(s), false)
})
test('sha_sama_mengalahkan_data_leluhur_yang_keliru', () => { assert.equal(k({ deployedSha: M, adalahLeluhur: false, jalurBerubah: ['x'] }).status, 'sama') })
test('jalur_server_dan_render_ada_di_backend_dan_src_di_frontend', () => {
  assert.ok(JALUR_BACKEND.includes('server') && JALUR_BACKEND.includes('render.yaml')); assert.ok(JALUR_FRONTEND.includes('src') && JALUR_FRONTEND.includes('public'))
})

test('galat_http_menyebut_layanan_disuspend_pemilik_secara_eksplisit', () => {
  const m = galatHttp(503, 'suspend-by-user')
  assert.match(m, /^HTTP 503; Render: service suspended by its owner \(x-render-routing: suspend-by-user\)/)
  assert.match(m, /resume the service on Render/)
})
test('galat_http_tanpa_header_tetap_generik_dan_header_lain_dikutip_tanpa_klaim_suspend', () => {
  assert.equal(galatHttp(503, null), 'HTTP 503')
  assert.equal(galatHttp(404, ''), 'HTTP 404')
  assert.equal(galatHttp(503, 'dynamic'), 'HTTP 503 (x-render-routing: dynamic)')
  assert.doesNotMatch(galatHttp(503, 'dynamic'), /suspended/)
})
test('galat_http_tidak_mengutip_nilai_header_yang_bukan_token', () => {
  for (const v of ['suspend-by-user\n::error::injected', 'x'.repeat(41), 'Suspend-By-User', 'a b']) assert.equal(galatHttp(503, v), 'HTTP 503', JSON.stringify(v))
})

