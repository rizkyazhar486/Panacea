import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bacaMetaGlb, klasifikasiAset, inventaris, ringkasKelas, UKURAN_MIN_KREDIT } from '../qa/public-asset-inventory.mjs'

// ── Fixture GLB minimal: header + chunk JSON (tanpa chunk biner).
const glb = (json: unknown): Buffer => {
  let j = Buffer.from(JSON.stringify(json), 'utf8'); while (j.length % 4) j = Buffer.concat([j, Buffer.from(' ')])
  const h = Buffer.alloc(20); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(20 + j.length, 8); h.writeUInt32LE(j.length, 12); h.writeUInt32LE(0x4e4f534a, 16)
  return Buffer.concat([h, j])
}
const node = (lic?: string, src?: string) => ({ name: 'n', extras: { ...(lic !== undefined ? { panacea_license: lic } : {}), ...(src !== undefined ? { panacea_source: src } : {}) } })

// ── bacaMetaGlb: positif, negatif, batas
assert.deepEqual(bacaMetaGlb(glb({ nodes: [node('CC BY 4.0', 'Atlas')], asset: { copyright: 'x' } })), { nodes: 1, denganLisensi: 1, denganSumber: 1, hakCipta: 'x' })
assert.deepEqual(bacaMetaGlb(glb({ nodes: [node('  ', 'A'), node('L')] })), { nodes: 2, denganLisensi: 1, denganSumber: 1, hakCipta: '' }, 'spasi saja bukan lisensi; per-node dihitung terpisah')
for (const buruk of [null, undefined, Buffer.alloc(0), Buffer.from('bukan glb sama sekali, hanya teks biasa!'), Buffer.concat([glb({ nodes: [] }).subarray(0, 18)])]) {
  assert.equal(bacaMetaGlb(buruk as Buffer), null, 'GLB tidak valid harus null tanpa melempar')
}
const rusak = glb({ nodes: [] }); rusak[20] = 0x7b; rusak[21] = 0x7b  // JSON rusak
assert.equal(bacaMetaGlb(rusak), null)

// ── klasifikasiAset: tiap kelas, urutan prioritas, fail-closed
const lengkap = { nodes: 2, denganLisensi: 2, denganSumber: 2, hakCipta: '' }
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: lengkap, adaBerkasKredit: false }), 'per-node')
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: { ...lengkap, denganSumber: 1 }, adaBerkasKredit: false }), 'tanpa-jejak', 'satu node tanpa sumber -> tidak per-node (batas -1)')
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: { nodes: 0, denganLisensi: 0, denganSumber: 0, hakCipta: '' }, adaBerkasKredit: false }), 'tanpa-jejak', 'nol node tidak boleh dianggap lengkap')
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: { nodes: 3, denganLisensi: 0, denganSumber: 0, hakCipta: 'BodyParts3D, (c) DBCLS, CC BY 4.0' }, adaBerkasKredit: false }), 'hak-cipta-tertanam')
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: { nodes: 3, denganLisensi: 0, denganSumber: 0, hakCipta: 'All rights reserved by someone' }, adaBerkasKredit: false }), 'tanpa-jejak', 'hak cipta tanpa lisensi dikenal tidak cukup')
assert.equal(klasifikasiAset({ ekstensi: 'glb', meta: null, adaBerkasKredit: true }), 'berkas-kredit')
assert.equal(klasifikasiAset({ ekstensi: 'svg', meta: null, adaBerkasKredit: true }), 'berkas-kredit')
assert.equal(klasifikasiAset({ ekstensi: 'svg', meta: null, adaBerkasKredit: false }), 'tanpa-jejak')
// Berpasangan: hanya adaBerkasKredit yang berbeda
assert.notEqual(klasifikasiAset({ ekstensi: 'png', meta: null, adaBerkasKredit: true }), klasifikasiAset({ ekstensi: 'png', meta: null, adaBerkasKredit: false }))

// ── inventaris pada pohon fixture (deterministik, tanpa jaringan)
const akar = mkdtempSync(join(tmpdir(), 'pub-asset-'))
try {
  const tulis = (rel: string, isi: Buffer | string) => { const p = join(akar, rel); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, isi) }
  tulis('public/a/model.glb', glb({ nodes: [node('CC BY 4.0', 'Atlas')] }))
  tulis('public/b/CREDITS.txt', 'Sumber: Atlas X; lisensi CC0 1.0; dikutip sesuai ketentuan.')
  tulis('public/b/gambar.webp', 'x')
  tulis('public/c/yatim.png', 'x')
  tulis('public/c/catatan.json', '{}')                       // bukan aset biner -> diabaikan
  tulis('public/ui-iterations/gaya.css', 'a{}')               // CSS -> diabaikan
  tulis('public/f/CREDITS.txt', '')                           // kredit KOSONG bukan bukti
  tulis('public/f/kosong.png', 'x')
  tulis('public/g/CREDITS.txt', 'k'.repeat(UKURAN_MIN_KREDIT))   // tepat di batas
  tulis('public/g/pas.png', 'x')
  tulis('public/h/CREDITS.txt', 'k'.repeat(UKURAN_MIN_KREDIT - 1)) // satu di bawah batas
  tulis('public/h/kurang.png', 'x')
  tulis('public/d/tanpa-kredit.glb', glb({ nodes: [{ name: 'tak-ada-extras' }] }))
  const d = inventaris(akar)
    assert.deepEqual(Object.fromEntries(d.map((x: { jalur: string; kelas: string }) => [x.jalur, x.kelas])), {
    'public/a/model.glb': 'per-node', 'public/b/gambar.webp': 'berkas-kredit', 'public/c/yatim.png': 'tanpa-jejak', 'public/d/tanpa-kredit.glb': 'tanpa-jejak',
    'public/f/kosong.png': 'tanpa-jejak', 'public/g/pas.png': 'berkas-kredit', 'public/h/kurang.png': 'tanpa-jejak',
  })
  assert.deepEqual(ringkasKelas(d), { 'per-node': 1, 'berkas-kredit': 2, 'tanpa-jejak': 4 })
  assert.deepEqual(inventaris(akar), d, 'determinisme')
  // Sabotase: aset baru tanpa jejak harus muncul sebagai tanpa-jejak (dan karenanya gagal di ratchet di bawah).
  tulis('public/e/baru.mp4', 'x')
  assert.equal(inventaris(akar).find((x: { jalur: string }) => x.jalur === 'public/e/baru.mp4')?.kelas, 'tanpa-jejak')
  // Menambah CREDITS pada direktori itu mengubah hanya kelasnya (aturan itu yang menolak).
  tulis('public/e/NOTICE.md', 'Aset berasal dari X, lisensi CC0 1.0, tanpa perubahan.')
  assert.equal(inventaris(akar).find((x: { jalur: string }) => x.jalur === 'public/e/baru.mp4')?.kelas, 'berkas-kredit')
} finally { rmSync(akar, { recursive: true, force: true }) }

// ── Ratchet pada repo nyata: aset tanpa jejak tidak boleh bertambah; entri basi harus dibuang.
const akarRepo = new URL('../../', import.meta.url).pathname
const baseline = JSON.parse(readFileSync(new URL('../../governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json', import.meta.url), 'utf8')) as { tanpaJejak: string[]; jumlahTotalAset: number }
const nyata = inventaris(akarRepo)
const tanpa = new Set(nyata.filter((x: { kelas: string }) => x.kelas === 'tanpa-jejak').map((x: { jalur: string }) => x.jalur))
const izin = new Set(baseline.tanpaJejak)
const baru = [...tanpa].filter((p) => !izin.has(p))
assert.deepEqual(baru, [], `aset publik BARU tanpa jejak provenance (tambahkan CREDITS/PROVENANCE/metadata, jangan menambah baseline): ${baru.join(', ')}`)
const basi = [...izin].filter((p) => !tanpa.has(p))
assert.deepEqual(basi, [], `entri baseline sudah tercakup atau terhapus; buang dari baseline agar angka menyusut: ${basi.join(', ')}`)
console.log(`public-asset-provenance: ${nyata.length} aset publik; ${JSON.stringify(ringkasKelas(nyata))}; ${tanpa.size} tanpa jejak (baseline ${izin.size}); klasifikasi, negatif, batas, determinisme, ratchet; passed`)
