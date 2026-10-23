import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bandingkan, ringkasPelanggaran } from './axe-ratchet.mjs'

const dasar = (aturan = {}, total = 0, incomplete = 0) => ({ aturan, totalNodeSeriusKritis: total, incompleteTotal: incomplete })
const node = (n) => Array.from({ length: n }, () => ({}))

test('lulus_tanpa_pelanggar_dan_baseline_nol', () => {
  assert.deepEqual(bandingkan({}, dasar(), 0), [])
})

test('lulus_pada_batas_tepat_baseline', () => {
  assert.deepEqual(bandingkan({ 'aria-x': { dampak: 'serious', node: 3 } }, dasar({ 'aria-x': 3 }, 3), 0), [])
})

test('menolak_satu_node_di_atas_baseline_aturan', () => {
  const g = bandingkan({ 'aria-x': { dampak: 'serious', node: 4 } }, dasar({ 'aria-x': 3 }, 10), 0)
  assert.deepEqual(g, ['aria-x (serious) naik: 4 > baseline 3'])
})

test('menolak_aturan_kritis_baru_yang_tidak_ada_di_baseline', () => {
  const g = bandingkan({ 'aria-baru': { dampak: 'critical', node: 1 } }, dasar({}, 5), 0)
  assert.deepEqual(g, ['aturan baru critical tidak ada di baseline: aria-baru (1 node)'])
})

test('menolak_total_melampaui_baseline_walau_tiap_aturan_di_batasnya', () => {
  const g = bandingkan({ a: { dampak: 'serious', node: 1 }, b: { dampak: 'critical', node: 1 } }, dasar({ a: 1, b: 1 }, 1), 0)
  assert.deepEqual(g, ['total node serius+kritis 2 > baseline 1'])
})

test('dampak_moderate_dan_minor_tidak_menggagalkan_gerbang', () => {
  assert.deepEqual(bandingkan({ x: { dampak: 'moderate', node: 99 }, y: { dampak: 'minor', node: 99 } }, dasar(), 0), [])
})

test('fail_closed_tanpa_baseline_atau_baseline_rusak', () => {
  const pesan = ['AXE_BASELINE tidak ada atau tidak valid: gerbang tidak dapat dinilai (fail-closed)']
  assert.deepEqual(bandingkan({}, null), pesan)
  assert.deepEqual(bandingkan({}, undefined), pesan)
  assert.deepEqual(bandingkan({}, { aturan: null, totalNodeSeriusKritis: 0 }), pesan)
  assert.deepEqual(bandingkan({}, { aturan: {}, totalNodeSeriusKritis: NaN }), pesan)
  assert.deepEqual(bandingkan({}, { aturan: {} }, 0), pesan)
  assert.deepEqual(bandingkan({}, { aturan: {}, totalNodeSeriusKritis: 0 }, 0), pesan, 'baseline tanpa incompleteTotal harus fail-closed')
})

test('tidak_memutasi_masukan', () => {
  const aturan = { a: { dampak: 'serious', node: 2 } }; const b = dasar({ a: 1 }, 1)
  const salinanA = JSON.stringify(aturan); const salinanB = JSON.stringify(b)
  bandingkan(aturan, b, 0)
  assert.equal(JSON.stringify(aturan), salinanA); assert.equal(JSON.stringify(b), salinanB)
})

test('ringkas_menghitung_node_dan_menjadikan_dampak_kosong_minor', () => {
  assert.deepEqual(ringkasPelanggaran([{ id: 'p', impact: 'serious', nodes: node(3) }, { id: 'q', impact: null, nodes: node(1) }]),
    { p: { dampak: 'serious', node: 3 }, q: { dampak: 'minor', node: 1 } })
  assert.deepEqual(ringkasPelanggaran([]), {})
})

test('incomplete_lulus_pada_batas_dan_gagal_satu_di_atas', () => {
  assert.deepEqual(bandingkan({}, dasar({}, 0, 2), 2), [])
  assert.deepEqual(bandingkan({}, dasar({}, 0, 2), 3), ['incomplete naik: 3 > baseline 2'])
})

test('incomplete_tak_terukur_ditolak_bukan_dianggap_nol', () => {
  for (const nilai of [undefined, NaN, null]) assert.deepEqual(bandingkan({}, dasar(), nilai), ['incompleteTotal tidak terukur'], String(nilai))
})
