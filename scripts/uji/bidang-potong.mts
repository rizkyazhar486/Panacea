import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalBidang, dipertahankan, JARAK_MAKS, BIDANG_AWAL } from '../../src/lib/bidangPotong.ts'
import { buatResep, bacaResep } from '../../src/lib/resepRender.ts'

for (const [t, r] of [[0, 0], [45, 90], [90, 30], [180, 270]] as const) {
  const n = normalBidang({ aktif: true, kemiringanDerajat: t, putaranDerajat: r, posisi: 0 })
  assert.ok(Math.abs(Math.hypot(...n) - 1) < 1e-12, 'normal bukan vektor satuan')
}
const datar = { aktif: true, kemiringanDerajat: 0, putaranDerajat: 0, posisi: 0 }
assert.equal(dipertahankan([0, 0, -0.3], datar), true)
assert.equal(dipertahankan([0, 0, 0.3], datar), false, 'sisi depan bidang tidak dibuang')
// Miring 90° putar 0 → normal +X.
assert.equal(dipertahankan([0.3, 0, 0], { ...datar, kemiringanDerajat: 90 }), false)
assert.equal(dipertahankan([-0.3, 0, 0], { ...datar, kemiringanDerajat: 90 }), true)
// Posisi maksimum mempertahankan seluruh kotak; mati = semua dipertahankan.
const sudut = [-0.5, 0.5].flatMap((x) => [-0.5, 0.5].flatMap((y) => [-0.5, 0.5].map((z) => [x, y, z] as [number, number, number])))
assert.ok(sudut.every((p) => dipertahankan(p, { aktif: true, kemiringanDerajat: 37, putaranDerajat: 211, posisi: JARAK_MAKS })))
assert.ok(sudut.every((p) => dipertahankan(p, { ...BIDANG_AWAL, posisi: -JARAK_MAKS })), 'bidang mati tetap memotong')

// Shader: sisi terbuang DILEWATI (continue), tidak mengakhiri sinar (break).
const s = readFileSync('src/components/VolumeDicom3D.tsx', 'utf8')
assert.match(s, /return uBidangAktif == 1 && dot\(p, uBidangNormal\) > uBidangJarak;/)
assert.equal((s.match(/if \(terpotongBidang\(p\)\) \{ p \+= langkahVec; continue; \}/g) ?? []).length, 3, 'tidak semua mode render melewati sisi terpotong')
assert.doesNotMatch(s, /terpotongBidang\(p\)\) break/, 'sinar berhenti di sisi terpotong — bidang dari arah kamera menghapus seluruh volume')

// Resep membawa bidang; resep lama tanpa bidang → bidang mati.
const miring = { aktif: true, kemiringanDerajat: 60, putaranDerajat: 120, posisi: -0.2 }
const r = buatResep({ jumlahBerkas: 1, sha256: ['a'.repeat(64)], modalitas: 'CT', voxel: [2, 2, 2], fisikMm: [1, 1, 1] },
  { mode: 'volume', ambangBawah: 0, ambangAtas: 1, kepekatan: 0.1, pajanan: 1, potong: [1, 1, 1], halus: 1.5, lapisan: [], bidang: miring }, new Date(0))
assert.deepEqual(bacaResep(JSON.parse(JSON.stringify(r))).parameter.bidang, miring, 'resep tidak membawa bidang potong')
const lama = JSON.parse(JSON.stringify(r)); delete lama.parameter.bidang
assert.equal(bacaResep(lama).parameter.bidang?.aktif, false)
console.log('bidang-potong: normal satuan, sisi depan dibuang, sisi terbuang dilewati sinar (3 mode), resep membawa bidang')
