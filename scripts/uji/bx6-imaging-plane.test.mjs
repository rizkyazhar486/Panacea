import test from 'node:test'
import assert from 'node:assert/strict'
import { correlateImagingPlane } from '../../src/domains/body-exposure/engine/imagingPlaneEngine.ts'

// Frame atlas: [x kiri, y superior, z anterior]. A dan B bertumpuk di sumbu Y (superior) pada y=2.
const A = { name: 'A', min: [-1, 0, -1], max: [1, 2, 1] }
const B = { name: 'B', min: [-1, 2, -1], max: [1, 4, 1] }

test('menerima_aksial_pada_y1_hanya_memotong_A', () => {
  const r = correlateImagingPlane('axial', 1, [A, B])
  assert.deepEqual(r.intersectedStructures, ['A']); assert.equal(r.truthClass, 'reference'); assert.equal(r.label, 'Atlas reference — not patient imaging')
})
test('batas_aksial_y2_menyentuh_keduanya_dan_epsilon_memilih_satu', () => {
  assert.deepEqual(correlateImagingPlane('axial', 2, [A, B]).intersectedStructures, ['A', 'B'])
  assert.deepEqual(correlateImagingPlane('axial', 2 + 1e-9, [A, B]).intersectedStructures, ['B'])
  assert.deepEqual(correlateImagingPlane('axial', 2 - 1e-9, [A, B]).intersectedStructures, ['A'])
})
test('sagital_memakai_x_dan_koronal_memakai_z', () => {
  const C = { name: 'C', min: [0.5, 0, -3], max: [2, 1, -2] }
  assert.deepEqual(correlateImagingPlane('sagittal', 1.5, [A, C]).intersectedStructures, ['C'])
  assert.deepEqual(correlateImagingPlane('coronal', -2.5, [A, C]).intersectedStructures, ['C'])
})
test('berpasangan_kotak_jauh_di_z_terpilih_aksial_tetapi_tidak_koronal', () => {
  // D hanya berbeda dari A pada sumbu Z: aksial (sumbu Y) tetap memotongnya, koronal pada z=0.5 tidak.
  const D = { name: 'D', min: [-1, 0, 5], max: [1, 2, 6] }
  assert.deepEqual(correlateImagingPlane('axial', 1, [D]).intersectedStructures, ['D'])
  assert.deepEqual(correlateImagingPlane('coronal', 0.5, [D]).intersectedStructures, [])
})
test('bidang_tanpa_potongan_tidak_mengklaim_apa_pun', () => {
  const r = correlateImagingPlane('axial', 99, [A, B]); assert.equal(r.ok, true); assert.deepEqual(r.intersectedStructures, [])
})
test('menolak_koordinat_nan_dan_infinity', () => {
  assert.deepEqual(correlateImagingPlane('axial', NaN, [A]), { ok: false, reason: 'invalid_coordinate' })
  assert.deepEqual(correlateImagingPlane('axial', Infinity, [A]), { ok: false, reason: 'invalid_coordinate' })
  assert.deepEqual(correlateImagingPlane('axial', '1', [A]), { ok: false, reason: 'invalid_coordinate' })
})
test('menolak_bidang_tak_dikenal_termasuk_kunci_prototipe', () => {
  assert.deepEqual(correlateImagingPlane('oblique', 0, [A]), { ok: false, reason: 'invalid_plane' })
  assert.deepEqual(correlateImagingPlane('constructor', 0, [A]), { ok: false, reason: 'invalid_plane' })
  assert.deepEqual(correlateImagingPlane('toString', 0, [A]), { ok: false, reason: 'invalid_plane' })
})
test('menolak_kotak_rusak_tanpa_jawaban_tebakan', () => {
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: 'X', min: [0, 3, 0], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: '', min: [0, 0, 0], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: 'Y', min: [0, NaN, 0], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: 'Z', min: [0, 0], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, null), { ok: false, reason: 'invalid_structure' })
})
test('berpasangan_kotak_terbalik_di_sumbu_lain_juga_ditolak_padahal_sumbu_bidang_valid', () => {
  const valid = { name: 'V', min: [0, 0, 0], max: [1, 2, 1] }
  const invertedX = { name: 'V', min: [2, 0, 0], max: [1, 2, 1] } // hanya X yang terbalik; bidang aksial memakai Y
  assert.equal(correlateImagingPlane('axial', 1, [valid]).ok, true)
  assert.deepEqual(correlateImagingPlane('axial', 1, [invertedX]), { ok: false, reason: 'invalid_structure' })
})
test('deterministik_dan_tidak_mengubah_masukan', () => {
  const input = [A, B]; const snap = JSON.stringify(input)
  assert.deepEqual(correlateImagingPlane('axial', 2, input), correlateImagingPlane('axial', 2, input))
  assert.equal(JSON.stringify(input), snap)
})
