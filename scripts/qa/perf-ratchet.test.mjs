import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { bandingkanPerf, kunciPerf, masalahBaselinePerf } from './perf-ratchet.mjs'

const baseline = () => ({ toleransiByte: 0.03, toleransiRequest: 2, batas: { 'mobile-390x844/beranda-pasien': { bytesJs: 1000, requests: 20 }, 'desktop-1440x900/beranda-pasien': { bytesJs: 1000, requests: 20 } } })
const baris = (viewport, bytesJs, requests, halaman = 'beranda-pasien') => ({ viewport, halaman, agg: { bytesJs: { median: bytesJs }, requests: { median: requests } } })
const keduanya = (b, r) => [baris('mobile-390x844', b, r), baris('desktop-1440x900', 1000, 20)]

test('menerima_pengukuran_sama_dengan_baseline', () => {
  assert.deepEqual(bandingkanPerf(keduanya(1000, 20), baseline()), { ok: true, pelanggaran: [], saranTurun: [] })
})

test('menerima_bytes_tepat_pada_batas_toleransi_dan_menolak_satu_byte_di_atasnya', () => {
  assert.equal(bandingkanPerf(keduanya(1030, 20), baseline()).ok, true)
  const r = bandingkanPerf(keduanya(1031, 20), baseline())
  assert.equal(r.ok, false)
  assert.deepEqual(r.pelanggaran, [{ kunci: 'mobile-390x844/beranda-pasien', jenis: 'melebihi', metrik: 'bytesJs', terukur: 1031, batas: 1030 }])
})

test('menerima_requests_tepat_pada_batas_dan_menolak_satu_di_atasnya', () => {
  assert.equal(bandingkanPerf(keduanya(1000, 22), baseline()).ok, true)
  const r = bandingkanPerf(keduanya(1000, 23), baseline())
  assert.deepEqual(r.pelanggaran, [{ kunci: 'mobile-390x844/beranda-pasien', jenis: 'melebihi', metrik: 'requests', terukur: 23, batas: 22 }])
})

test('menolak_median_tak_terukur_bukan_dianggap_nol', () => {
  for (const x of [null, undefined, NaN, Infinity, -1, '1000']) {
    const r = bandingkanPerf(keduanya(x, 20), baseline())
    assert.equal(r.ok, false, String(x))
    assert.deepEqual(r.pelanggaran, [{ kunci: 'mobile-390x844/beranda-pasien', jenis: 'tak-terukur', metrik: 'bytesJs' }])
  }
  assert.equal(bandingkanPerf(keduanya(0, 20), baseline()).ok, true, 'nol sungguhan terukur, hanya turun')
})

test('menolak_halaman_tanpa_baseline_dan_baseline_yang_hilang_dari_pengukuran', () => {
  const tambah = bandingkanPerf([...keduanya(1000, 20), baris('mobile-390x844', 5, 1, 'baru')], baseline())
  assert.deepEqual(tambah.pelanggaran, [{ kunci: 'mobile-390x844/baru', jenis: 'tanpa-baseline' }])
  const kurang = bandingkanPerf([baris('mobile-390x844', 1000, 20)], baseline())
  assert.deepEqual(kurang.pelanggaran, [{ kunci: 'desktop-1440x900/beranda-pasien', jenis: 'hilang-dari-pengukuran' }])
})

test('menolak_baris_duplikat_dan_pengukuran_kosong', () => {
  assert.deepEqual(bandingkanPerf([...keduanya(1000, 20), baris('mobile-390x844', 1000, 20)], baseline()).pelanggaran, [{ kunci: 'mobile-390x844/beranda-pasien', jenis: 'duplikat' }])
  for (const h of [[], null, undefined]) assert.deepEqual(bandingkanPerf(h, baseline()), { ok: false, pelanggaran: [{ kunci: '-', jenis: 'tanpa-pengukuran' }], saranTurun: [] })
})

test('menolak_baseline_cacat_fail_closed', () => {
  const cacat = [null, [], 'x', { ...baseline(), toleransiByte: 0.5 }, { ...baseline(), toleransiByte: -0.01 }, { ...baseline(), toleransiByte: NaN },
    { ...baseline(), toleransiRequest: 1.5 }, { ...baseline(), toleransiRequest: 6 }, { ...baseline(), batas: {} }, { ...baseline(), batas: [] },
    { ...baseline(), batas: { 'mobile/x': { bytesJs: 0, requests: 1 } } }, { ...baseline(), batas: { 'mobile/x': { bytesJs: 10.5, requests: 1 } } },
    { ...baseline(), batas: { tanpa_garis_miring: { bytesJs: 10, requests: 1 } } }]
  for (const b of cacat) {
    assert.ok(masalahBaselinePerf(b).length > 0, JSON.stringify(b))
    const r = bandingkanPerf(keduanya(1000, 20), b)
    assert.equal(r.ok, false)
    assert.ok(r.pelanggaran.every((p) => p.jenis === 'baseline-cacat'))
  }
  assert.deepEqual(masalahBaselinePerf({ ...baseline(), toleransiByte: 0.1, toleransiRequest: 0 }), [], 'batas atas/bawah toleransi diterima')
})

test('saran_turun_hanya_informasi_bukan_kegagalan', () => {
  const r = bandingkanPerf(keduanya(900, 17), baseline())
  assert.equal(r.ok, true)
  assert.deepEqual(r.saranTurun, [{ kunci: 'mobile-390x844/beranda-pasien', metrik: 'bytesJs', terukur: 900, batas: 1000 }, { kunci: 'mobile-390x844/beranda-pasien', metrik: 'requests', terukur: 17, batas: 20 }])
})

test('tidak_mengubah_masukan_dan_deterministik', () => {
  const b = baseline(); const h = keduanya(1031, 23)
  const salinB = JSON.stringify(b); const salinH = JSON.stringify(h)
  assert.deepEqual(bandingkanPerf(h, b), bandingkanPerf(h, b))
  assert.equal(JSON.stringify(b), salinB); assert.equal(JSON.stringify(h), salinH)
})

test('baseline_repo_sah_dan_mencakup_semua_halaman_x_viewport_perf_audit', () => {
  const b = JSON.parse(readFileSync(new URL('../../governance/PERF_BASELINE.json', import.meta.url), 'utf8'))
  assert.deepEqual(masalahBaselinePerf(b), [])
  const src = readFileSync(new URL('./perf-audit.mjs', import.meta.url), 'utf8')
  const vp = [...src.matchAll(/name: '([^']+)', width/g)].map((m) => m[1])
  const hal = [...src.matchAll(/nama: '([^']+)', rute/g)].map((m) => m[1])
  assert.ok(vp.length === 2 && hal.length >= 6)
  assert.deepEqual(Object.keys(b.batas).sort(), vp.flatMap((v) => hal.map((h) => kunciPerf(v, h))).sort())
  assert.match(src, /bandingkanPerf\(/, 'perf-audit memakai gerbang')
  const wf = readFileSync(new URL('../../.github/workflows/ux-audit-acceptance.yml', import.meta.url), 'utf8')
  assert.match(wf, /PERF_BASELINE=governance\/PERF_BASELINE\.json/, 'CI menjalankan perf-audit dengan baseline')
})
