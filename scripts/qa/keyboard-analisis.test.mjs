import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analisisFokus, bandingkanKeyboard, BATAS_BERURUTAN_SAMA } from './keyboard-analisis.mjs'

const stop = (key, o = {}) => ({ hilang: false, key, terlihat: true, indikator: true, ...o })
const hilang = () => ({ hilang: true })
const nol = { tanpaIndikator: 0, takTerlihat: 0, terjebak: 0, tanpaStopFokus: 0 }

test('menghitung_unik_dan_nol_masalah_pada_urutan_sehat', () => {
  const r = analisisFokus([stop('a'), stop('b'), stop('c'), hilang(), stop('a')])
  assert.deepEqual(r, { langkah: 5, unik: 3, tanpaIndikator: 0, takTerlihat: 0, terjebak: 0, tanpaStopFokus: 0 })
})

test('menandai_stop_tanpa_indikator_dan_yang_tak_terlihat_terpisah', () => {
  const r = analisisFokus([stop('a', { indikator: false }), stop('b', { terlihat: false }), stop('c')])
  assert.equal(r.tanpaIndikator, 1); assert.equal(r.takTerlihat, 1)
})

test('segmen_input_waktu_sampai_batas_bukan_jebakan_dan_satu_di_atasnya_ya', () => {
  const sama = (n) => Array.from({ length: n }, () => stop('time'))
  assert.equal(analisisFokus(sama(BATAS_BERURUTAN_SAMA)).terjebak, 0)
  assert.equal(analisisFokus(sama(BATAS_BERURUTAN_SAMA + 1)).terjebak, 1)
})

test('fokus_hilang_memutus_urutan_sehingga_bukan_jebakan', () => {
  const l = [...Array.from({ length: 4 }, () => stop('x')), hilang(), ...Array.from({ length: 4 }, () => stop('x'))]
  assert.equal(analisisFokus(l).terjebak, 0)
})

test('halaman_tanpa_satu_pun_stop_fokus_ditandai', () => {
  assert.equal(analisisFokus([hilang(), hilang()]).tanpaStopFokus, 1)
  assert.equal(analisisFokus([]).tanpaStopFokus, 1)
})

test('menolak_masukan_bukan_array', () => {
  assert.throws(() => analisisFokus(null), TypeError)
  assert.throws(() => analisisFokus('abc'), TypeError)
})

test('baseline_lulus_pada_batas_dan_gagal_satu_di_atas', () => {
  assert.deepEqual(bandingkanKeyboard({ ...nol, tanpaIndikator: 2 }, { ...nol, tanpaIndikator: 2 }), [])
  assert.deepEqual(bandingkanKeyboard({ ...nol, tanpaIndikator: 3 }, { ...nol, tanpaIndikator: 2 }), ['tanpaIndikator naik: 3 > baseline 2'])
})

test('setiap_metrik_digerbang_sendiri', () => {
  for (const k of ['tanpaIndikator', 'takTerlihat', 'terjebak', 'tanpaStopFokus']) {
    assert.deepEqual(bandingkanKeyboard({ ...nol, [k]: 1 }, nol), [`${k} naik: 1 > baseline 0`], k)
  }
})

test('fail_closed_tanpa_baseline_rusak_atau_metrik_tak_terukur', () => {
  const pesan = ['KEYBOARD_BASELINE tidak ada atau tidak valid: gerbang tidak dapat dinilai (fail-closed)']
  assert.deepEqual(bandingkanKeyboard(nol, null), pesan)
  assert.deepEqual(bandingkanKeyboard(nol, { tanpaIndikator: 0 }), pesan)
  assert.deepEqual(bandingkanKeyboard(nol, { ...nol, terjebak: NaN }), pesan)
  assert.deepEqual(bandingkanKeyboard({ ...nol, terjebak: undefined }, nol), ['metrik terjebak tidak terukur'])
})
