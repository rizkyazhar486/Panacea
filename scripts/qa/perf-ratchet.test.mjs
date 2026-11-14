import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { TOLERANSI, bandingkanPerf, masalahBaseline } from './perf-ratchet.mjs'

const BASE = { halaman: { 'mobile-390x844|harian': { bytesJs: 100000, requests: 40, cls: 0.05 }, 'desktop-1440x900|harian': { bytesJs: 100000, requests: 40, cls: 0 } } }
const ukur = (viewport, js, req, cls) => ({ viewport, halaman: 'harian', agg: { bytesJs: { median: js }, requests: { median: req }, cls: { median: cls } } })
const lulus = () => [ukur('mobile-390x844', 100000, 40, 0.05), ukur('desktop-1440x900', 100000, 40, 0)]

test('toleransi terdokumentasi dan beku', () => {
  assert.deepEqual({ ...TOLERANSI }, { bytesJsRasio: 1.03, requestsTambah: 3, clsTambah: 0.02 }); assert.ok(Object.isFrozen(TOLERANSI))
})

test('menerima_pengukuran_sama_dengan_baseline', () => { assert.deepEqual(bandingkanPerf(lulus(), BASE), []) })

test('menerima_tepat_pada_batas_toleransi', () => {
  assert.deepEqual(bandingkanPerf([ukur('mobile-390x844', 103000, 43, 0.07), ukur('desktop-1440x900', 103000, 43, 0.02)], BASE), [])
})

test('menolak_bytesJs_satu_byte_di_atas_batas', () => {
  const g = bandingkanPerf([ukur('mobile-390x844', 103001, 40, 0.05), ukur('desktop-1440x900', 100000, 40, 0)], BASE)
  assert.equal(g.length, 1); assert.match(g[0], /^mobile-390x844\|harian: bytesJs 103001 > baseline 100000/)
})

test('menolak_requests_di_atas_batas', () => {
  const g = bandingkanPerf([ukur('mobile-390x844', 100000, 44, 0.05), ukur('desktop-1440x900', 100000, 40, 0)], BASE)
  assert.deepEqual(g, ['mobile-390x844|harian: requests 44 > baseline 40 + 3'])
})

test('menolak_cls_di_atas_batas', () => {
  const g = bandingkanPerf([ukur('mobile-390x844', 100000, 40, 0.05), ukur('desktop-1440x900', 100000, 40, 0.021)], BASE)
  assert.equal(g.length, 1); assert.match(g[0], /^desktop-1440x900\|harian: cls 0\.021/)
})

test('menolak_metrik_tak_terukur_bukan_nol', () => {
  for (const bad of [null, undefined, NaN, Infinity, -1, '100']) {
    const g = bandingkanPerf([ukur('mobile-390x844', bad, 40, 0.05), ukur('desktop-1440x900', 100000, 40, 0)], BASE)
    assert.deepEqual(g, ['mobile-390x844|harian: bytesJs tidak terukur'], String(bad))
  }
  assert.deepEqual(bandingkanPerf([ukur('mobile-390x844', 100000, null, null), ukur('desktop-1440x900', 100000, 40, 0)], BASE),
    ['mobile-390x844|harian: requests tidak terukur', 'mobile-390x844|harian: cls tidak terukur'])
})

test('menolak_halaman_baseline_yang_tidak_diukur', () => {
  assert.deepEqual(bandingkanPerf([lulus()[0]], BASE), ['desktop-1440x900|harian: ada di baseline tetapi tidak diukur'])
})

test('menolak_halaman_baru_tanpa_baseline_dan_pengukuran_ganda', () => {
  const baru = { ...ukur('mobile-390x844', 1, 1, 0), halaman: 'baru' }
  const g = bandingkanPerf([...lulus(), baru, lulus()[0]], BASE)
  assert.deepEqual(g, ['mobile-390x844|baru: halaman terukur tanpa baseline (tambahkan ke PERF_BASELINE dengan bukti run CI)', 'mobile-390x844|harian: pengukuran ganda'])
})

test('menolak_baseline_tidak_valid_fail_closed', () => {
  for (const b of [null, undefined, {}, { halaman: [] }, { halaman: {} }, { halaman: { a: null } }, { halaman: { a: { bytesJs: 1, requests: 1 } } }, { halaman: { a: { bytesJs: -1, requests: 1, cls: 0 } } }]) {
    const g = bandingkanPerf(lulus(), b)
    assert.equal(g.length, 1, JSON.stringify(b)); assert.match(g[0], /PERF_BASELINE/)
  }
  assert.equal(masalahBaseline(BASE), null)
})

test('menolak_hasil_kosong', () => {
  assert.deepEqual(bandingkanPerf([], BASE), ['tidak ada hasil pengukuran: gerbang tidak dapat dinilai (fail-closed)'])
  assert.deepEqual(bandingkanPerf(null, BASE), ['tidak ada hasil pengukuran: gerbang tidak dapat dinilai (fail-closed)'])
})

test('tidak_mengubah_masukan', () => {
  const h = lulus(); const b = structuredClone(BASE); const s = JSON.stringify([h, b])
  bandingkanPerf(h, b); assert.equal(JSON.stringify([h, b]), s)
})

test('baseline_repo_valid_dan_mencakup_semua_halaman_x_viewport_perf_audit', () => {
  const b = JSON.parse(readFileSync(new URL('../../governance/PERF_BASELINE.json', import.meta.url), 'utf8'))
  assert.equal(masalahBaseline(b), null)
  const src = readFileSync(new URL('./perf-audit.mjs', import.meta.url), 'utf8')
  const vps = [...src.matchAll(/name: '([a-z]+-\d+x\d+)'/g)].map((m) => m[1])
  const hal = [...src.matchAll(/nama: '([a-z-]+)'/g)].map((m) => m[1])
  assert.equal(vps.length, 2); assert.equal(hal.length, 6)
  assert.deepEqual(Object.keys(b.halaman).sort(), vps.flatMap((v) => hal.map((h) => `${v}|${h}`)).sort())
})
