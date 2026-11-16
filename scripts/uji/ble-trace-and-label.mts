// Two small pure pieces of the Bluetooth panel (src/domains/devices/engine):
//   - tracePoints: one scale from the series' own min/max; flat runs mid-height; a gap draws nothing;
//   - deviceLabel: the name a saved reading is filed under, from what the device reported — never invented.
import assert from 'node:assert/strict'
import { tracePoints, deviceLabel } from '../../src/domains/devices/index.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

gagal('garis_memakai_min_maks_deretnya_sendiri', () => {
  // W 104, H 24, pad 2: x at 2, 52, 102; max 70 at the top (y 2), min 60 at the bottom (y 22), 65 halfway (y 12).
  assert.deepEqual(tracePoints([60, 70, 65], 104, 24), [[2, 22], [52, 2], [102, 12]])
})

gagal('deret_datar_di_tengah', () => {
  assert.deepEqual(tracePoints([60, 60], 104, 24), [[2, 12], [102, 12]])
})

gagal('satu_titik_di_tengah_kotak', () => {
  assert.deepEqual(tracePoints([61], 104, 24), [[52, 12]])
})

gagal('deret_berlubang_atau_kosong_tidak_digambar', () => {
  assert.deepEqual(tracePoints([], 104, 24), [])
  assert.deepEqual(tracePoints([60, Number.NaN, 62], 104, 24), [])
  assert.deepEqual(tracePoints([60, Number.POSITIVE_INFINITY], 104, 24), [])
  assert.equal(tracePoints([60, 62], 104, 24).length, 2, 'twin without the gap draws')
})

gagal('kotak_terlalu_kecil_tidak_digambar', () => {
  assert.deepEqual(tracePoints([60, 62], 4, 24), [])
  assert.deepEqual(tracePoints([60, 62], 104, 4), [])
  assert.equal(tracePoints([60, 62], 5, 5).length, 2, 'one pixel inside the padding is enough')
})

gagal('label_dari_yang_dilaporkan_perangkat', () => {
  assert.equal(deviceLabel({ name: 'Band', manufacturer: 'Acme', model: 'Strap One' }), 'Acme Strap One')
  assert.equal(deviceLabel({ name: 'Band', manufacturer: 'Acme', model: 'acme Strap' }), 'acme Strap', 'the maker is not repeated')
  assert.equal(deviceLabel({ name: 'Band', manufacturer: null, model: 'Strap One' }), 'Strap One')
  assert.equal(deviceLabel({ name: 'Band', manufacturer: 'Acme', model: null }), 'Band')
  assert.equal(deviceLabel({ name: null, manufacturer: 'Acme', model: null }), 'Acme')
})

gagal('tanpa_keterangan_label_umum', () => {
  assert.equal(deviceLabel(null), 'Bluetooth device')
  assert.equal(deviceLabel({ name: null, manufacturer: null, model: null }), 'Bluetooth device')
})

console.log('ble trace and label: the trace uses one scale and draws no line through a gap; a saved reading is filed under what the device reported')
