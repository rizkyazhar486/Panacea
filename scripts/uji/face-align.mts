// Wajah dari foto, langkah 1: berkas foto dicek sebelum didekode, penyelarasan dijepit agar foto selalu menutup
// lingkaran, dan Generate terkunci tanpa foto sah + persetujuan.
import assert from 'node:assert/strict'
import {
  ALIGN_START, FACE_PHOTO_BOUNDARY, FACE_PHOTO_MAX_BYTES, alignTransform, canGenerate, checkPhotoFile, checkPhotoSize, clampAlignment, photoReason,
} from '../../src/domains/body-exposure/engine/face-capture/faceAlign.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

gagal('menerima-foto-sah-dan-batas-ukuran', () => {
  assert.deepEqual(checkPhotoFile('image/jpeg', 1), { ok: true })
  assert.deepEqual(checkPhotoFile('image/webp', FACE_PHOTO_MAX_BYTES), { ok: true })
  assert.deepEqual(checkPhotoFile('image/png', FACE_PHOTO_MAX_BYTES + 1), { ok: false, reason: 'size' })
  assert.deepEqual(checkPhotoSize(256, 900), { ok: true })
  assert.deepEqual(checkPhotoSize(255, 900), { ok: false, reason: 'small' })
})
gagal('menolak-jenis-kosong-dan-tak-hingga', () => {
  assert.deepEqual(checkPhotoFile('image/gif', 100), { ok: false, reason: 'type' })
  assert.deepEqual(checkPhotoFile('image/heic', 100), { ok: false, reason: 'type' })
  assert.deepEqual(checkPhotoFile('image/png', 0), { ok: false, reason: 'empty' })
  assert.deepEqual(checkPhotoFile('image/png', Number.NaN), { ok: false, reason: 'empty' })
  assert.deepEqual(checkPhotoSize(Number.POSITIVE_INFINITY, 900), { ok: false, reason: 'small' })
  assert.equal(photoReason({ ok: false, reason: 'type' }), 'Use a JPEG, PNG or WebP photo.')
})
gagal('penyelarasan-dijepit-foto-selalu-menutup-lingkaran', () => {
  assert.deepEqual(clampAlignment(ALIGN_START), ALIGN_START)
  assert.deepEqual(clampAlignment({ zoom: 9, rotateDeg: -90, panX: 5, panY: -5 }), { zoom: 4, rotateDeg: -45, panX: 1.5, panY: -1.5 })
  assert.deepEqual(clampAlignment({ zoom: 1, rotateDeg: 0, panX: 0.3, panY: 0 }), ALIGN_START, 'zoom 1 tidak bisa digeser')
  assert.deepEqual(clampAlignment({ zoom: 2, rotateDeg: 45, panX: 0.5, panY: -0.5 }), { zoom: 2, rotateDeg: 45, panX: 0.5, panY: -0.5 })
  assert.deepEqual(clampAlignment({ zoom: Number.NaN, rotateDeg: Infinity, panX: Number.NaN, panY: 0 }), ALIGN_START)
})
gagal('transformasi-css-eksak', () => {
  assert.equal(alignTransform({ zoom: 2, rotateDeg: 10, panX: 0.25, panY: -0.1 }, 200), 'translate(50px, -20px) rotate(10deg) scale(2)')
  assert.equal(alignTransform(ALIGN_START, 200), 'translate(0px, 0px) rotate(0deg) scale(1)')
})
gagal('generate-butuh-foto-dan-persetujuan', () => {
  assert.equal(canGenerate(true, true), true)
  assert.equal(canGenerate(true, false), false)
  assert.equal(canGenerate(false, true), false)
  assert.match(FACE_PHOTO_BOUNDARY, /not a measurement/)
})
console.log('face-align: OK')
