import test from 'node:test'; import assert from 'node:assert/strict'
import { posisiFisikVoxel, type VolumeMpr } from '../../src/lib/dicomMpr'

// Volume 5x5x5, jarak 2 mm di semua sumbu; pusat voxel (2,2,2) = titik asal lokal.
const volume = (asalSpasi: VolumeMpr['asalSpasi'], ganti: Partial<VolumeMpr> = {}): VolumeMpr => ({
  irisan: [], baris: 5, kolom: 5, kedalaman: 5,
  jarakBarisMm: 2, jarakKolomMm: 2, jarakIrisMm: 2,
  minimum: 0, maksimum: 100, terbalik: false,
  asalSpasi, ...ganti,
})
const SAH: NonNullable<VolumeMpr['asalSpasi']> = { baris: 'dicom', kolom: 'dicom', iris: 'posisi' }

// positif
test('positif: voxel pusat berada di titik asal lokal dan ukuran volume benar', () => {
  const p = posisiFisikVoxel(volume(SAH), 2, 2, 2)
  assert.deepEqual(p, { xIndex: 2, yIndex: 2, zIndex: 2, mm: { lebar: 10, tinggi: 10, kedalaman: 10, x: 0, y: 0, z: 0 } })
})
test('positif: pojok kiri-atas depan = (-4, +4, -4) mm; Y naik ke atas', () => {
  assert.deepEqual(posisiFisikVoxel(volume(SAH), 0, 0, 0).mm, { lebar: 10, tinggi: 10, kedalaman: 10, x: -4, y: 4, z: -4 })
})
test('positif: jarak anisotropik dipakai per sumbu', () => {
  const p = posisiFisikVoxel(volume(SAH, { jarakKolomMm: 1, jarakBarisMm: 3, jarakIrisMm: 5 }), 4, 4, 4)
  assert.deepEqual(p.mm, { lebar: 5, tinggi: 15, kedalaman: 25, x: 2, y: -6, z: 10 })
})
test('positif: tebal-iris sebagai asal jarak irisan dianggap sah', () => {
  assert.notEqual(posisiFisikVoxel(volume({ ...SAH, iris: 'tebal-iris' }), 2, 2, 2).mm, null)
})
// batas
test('batas: kursor di luar rentang dijepit ke voxel tepi, bukan melewatinya', () => {
  const p = posisiFisikVoxel(volume(SAH), -3, 99, 4.6)
  assert.deepEqual([p.xIndex, p.yIndex, p.zIndex], [0, 4, 4])
})
test('batas: ±1 langkah di luar tepi menghasilkan indeks yang sama dengan tepi', () => {
  assert.equal(posisiFisikVoxel(volume(SAH), 5, 0, 0).xIndex, posisiFisikVoxel(volume(SAH), 4, 0, 0).xIndex)
  assert.equal(posisiFisikVoxel(volume(SAH), -1, 0, 0).xIndex, posisiFisikVoxel(volume(SAH), 0, 0, 0).xIndex)
})
// negatif: fail-closed, mm null (dan indeks tetap terdefinisi)
test('negatif: jarak baris diasumsikan -> mm null', () => {
  assert.equal(posisiFisikVoxel(volume({ ...SAH, baris: 'asumsi' }), 2, 2, 2).mm, null)
})
test('negatif: jarak kolom diasumsikan -> mm null', () => {
  assert.equal(posisiFisikVoxel(volume({ ...SAH, kolom: 'asumsi' }), 2, 2, 2).mm, null)
})
test('negatif: jarak irisan diasumsikan -> mm null', () => {
  assert.equal(posisiFisikVoxel(volume({ ...SAH, iris: 'asumsi' }), 2, 2, 2).mm, null)
})
test('negatif: tanpa catatan asal jarak -> mm null', () => {
  assert.equal(posisiFisikVoxel(volume(undefined), 2, 2, 2).mm, null)
})
test('negatif: jarak nol, negatif atau tak-hingga/NaN -> mm null', () => {
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(posisiFisikVoxel(volume(SAH, { jarakIrisMm: bad }), 2, 2, 2).mm, null, `jarak ${bad}`)
  }
})
test('negatif: kursor NaN -> indeks 0 dan mm null, bukan indeks NaN', () => {
  const p = posisiFisikVoxel(volume(SAH), Number.NaN, 2, 2)
  assert.equal(p.xIndex, 0); assert.equal(p.mm, null)
})
test('negatif: kursor finite di luar volume (-50, 500) -> indeks dijepit tetapi mm null', () => {
  for (const [x, y, z] of [[-50, 2, 2], [2, 500, 2], [2, 2, -1], [5, 2, 2], [4.6, 2, 2]]) {
    const p = posisiFisikVoxel(volume(SAH), x, y, z)
    assert.equal(p.mm, null, `${x},${y},${z}`)
    assert.ok([p.xIndex, p.yIndex, p.zIndex].every((i) => i >= 0 && i <= 4))
  }
})
test('batas: voxel tepi terakhir (4) dan pembulatan 4.4 tetap sah; 4.6 tidak', () => {
  assert.notEqual(posisiFisikVoxel(volume(SAH), 4, 4, 4).mm, null)
  assert.notEqual(posisiFisikVoxel(volume(SAH), 4.4, 0, 0).mm, null)
  assert.notEqual(posisiFisikVoxel(volume(SAH), -0.4, 0, 0).mm, null)
  assert.equal(posisiFisikVoxel(volume(SAH), -0.6, 0, 0).mm, null)
})
// pasangan: hanya beda pada kondisi yang diuji
test('pasangan: volume identik, hanya asalSpasi.baris berbeda -> sah vs null', () => {
  assert.notEqual(posisiFisikVoxel(volume(SAH), 1, 1, 1).mm, null)
  assert.equal(posisiFisikVoxel(volume({ ...SAH, baris: 'asumsi' }), 1, 1, 1).mm, null)
})
test('determinisme: dua panggilan identik', () => {
  assert.deepEqual(posisiFisikVoxel(volume(SAH), 3, 1, 2), posisiFisikVoxel(volume(SAH), 3, 1, 2))
})
