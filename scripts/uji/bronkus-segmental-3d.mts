import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { IKATAN_BRONKUS, petaMeshKeSegmen, kunciNama, BERKAS_BRONKUS } from '../../src/lib/anatomy/bronkusSegmental.ts'
import { SEGMEN_VENTILASI } from '../../src/lib/ventilasiSegmental.ts'

// Apakah yang diwarnai di layar benar-benar ada di dalam berkas yang dikirim?
//
// Sebuah viewer 3D gagal dengan SUNYI. Kalau sebuah nama mesh salah ketik,
// segmen itu tidak diwarnai, tidak ada yang error, dan gambarnya tetap tampak
// meyakinkan -- hanya saja satu bronkus diam-diam tidak pernah ikut bernapas.
// Uji ini membaca chunk JSON GLB-nya langsung, jadi yang diperiksa adalah
// berkas yang benar-benar dikirim ke pengguna.

const buf = await readFile(new URL(`../../public/${BERKAS_BRONKUS}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
const panjangJson = buf.readUInt32LE(12)
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + panjangJson).toString('utf8'))

const bermesh = new Set<string>(
  gltf.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined)
    .map((n: { name?: string }) => n.name ?? ''),
)

// ── 1. Setiap nama yang akan diwarnai harus ada DAN membawa geometri ────────
//
// Node parenkim per segmen ("Apical segment of right lung (SI)") memang ada di
// berkas ini, tetapi hanya sebagai pivot berlabel tanpa mesh. Mengikat ke node
// seperti itu akan lolos pemeriksaan "nama ada" dan tetap tidak menggambar
// apa pun; karena itu yang diuji adalah kepemilikan mesh, bukan keberadaan nama.
for (const ikatan of IKATAN_BRONKUS) {
  assert.ok(ikatan.mesh.length > 0, `${ikatan.segmen} tidak mengikat mesh apa pun`)
  for (const nama of ikatan.mesh) {
    assert.ok(bermesh.has(nama), `Mesh tidak ada atau tanpa geometri di ${BERKAS_BRONKUS}: "${nama}"`)
  }
}

// ── 2. Setiap segmen ventilasi harus punya ikatan, tanpa kecuali ───────────
//
// Delapan belas segmen di panel; delapan belas di gambar. Kalau suatu hari
// sebuah segmen ditambahkan ke model dan lupa diikat, panelnya akan
// menampilkan baris yang tidak pernah menyala di layar.
{
  const terikat = new Set(IKATAN_BRONKUS.map((i) => i.segmen))
  for (const s of SEGMEN_VENTILASI) {
    assert.ok(terikat.has(s.id), `Segmen ventilasi tanpa ikatan bronkus: ${s.id}`)
  }
  assert.equal(terikat.size, SEGMEN_VENTILASI.length, 'Ada ikatan untuk segmen yang tidak dimodelkan')
}

// ── 3. Tidak ada mesh yang diklaim dua segmen ──────────────────────────────
//
// Klaim ganda berarti satu bronkus menampilkan dua pengisian sekaligus, dan
// yang menang tergantung urutan penelusuran scene.
{
  const peta = petaMeshKeSegmen()
  for (const ikatan of IKATAN_BRONKUS) {
    for (const nama of ikatan.mesh) {
      assert.equal(peta.get(kunciNama(nama)), ikatan.segmen, `"${nama}" diklaim segmen lain`)
    }
  }
}

// ── 3b. Normalisasi nama harus injektif ────────────────────────────────────
//
// Kuncinya membuang segalanya kecuali huruf dan angka supaya aturan sanitasi
// GLTFLoader mana pun tetap cocok. Harga yang harus dijaga: dua bronkus
// berbeda tidak boleh runtuh menjadi satu kunci, karena itu akan menyalakan
// segmen yang salah tanpa gejala apa pun.
{
  const kunci = new Map<string, string>()
  for (const ikatan of IKATAN_BRONKUS) {
    for (const nama of ikatan.mesh) {
      const k = kunciNama(nama)
      const ada = kunci.get(k)
      assert.ok(!ada || ada === nama, `Kunci "${k}" dipakai "${ada}" dan "${nama}"`)
      kunci.set(k, nama)
    }
  }
  assert.equal(kunci.size, IKATAN_BRONKUS.reduce((n, i) => n + i.mesh.length, 0))
}

// ── 3c. Nama seperti yang BENAR-BENAR ditulis loader harus cocok ───────────
//
// Empat nama ini dibaca dari scene three.js r185 yang berjalan, bukan dikarang:
// spasi menjadi garis bawah dan tanda kurung DIPERTAHANKAN. Penyanitas lama di
// repo ini juga membuang tanda kurung, dan memakai aturan itu memberi nol
// bronkus berwarna tanpa satu pun galat. Uji ini mengunci keduanya agar cocok.
{
  const peta = petaMeshKeSegmen()
  const dariScene: Record<string, string> = {
    '(Anteromedial_basal_segmental_bronchus_of_left_lung)': 'resp:segment:l-s7-8',
    'Anterior_basal_segmental_bronchus_of_left_lung_(BVIII)': 'resp:segment:l-s7-8',
    'Lateral_basal_segmental_bronchus_of_left_lung_(BIX)': 'resp:segment:l-s9',
    'Medial_basal_segmental_bronchus_of_left_lung_(BVII)': 'resp:segment:l-s7-8',
  }
  for (const [nama, segmen] of Object.entries(dariScene)) {
    assert.equal(peta.get(kunciNama(nama)), segmen, `Nama scene tidak cocok: "${nama}"`)
  }
}

// ── 4. Tidak ada bronkus segmental yang TERTINGGAL ─────────────────────────
//
// Arah sebaliknya, dan yang paling mudah dilewatkan: berkasnya mengirim dua
// puluh bronkus segmental. Kalau salah satu tidak diklaim, ia akan tampil abu-
// abu di tengah paru yang bernapas dan tampak seperti cacat render, bukan
// seperti pemetaan yang kurang.
{
  const semuaBronkus = [...bermesh].filter((n) => /segmental bronchus of (left|right) lung/i.test(n))
  const diklaim = petaMeshKeSegmen()
  const tertinggal = semuaBronkus.filter((n) => !diklaim.has(kunciNama(n)))
  assert.deepEqual(tertinggal, [], `Bronkus segmental tanpa segmen: ${tertinggal.join(', ')}`)
  assert.equal(semuaBronkus.length, 20, `Harus ada 20 bronkus segmental, ada ${semuaBronkus.length}`)
}

console.log(
  `Bronkus segmental 3D: ke-18 segmen ventilasi terikat ke ${IKATAN_BRONKUS.reduce((n, i) => n + i.mesh.length, 0)} ` +
  'mesh bronkus yang benar-benar membawa geometri di visceral.glb, tanpa klaim ganda dan tanpa satu pun ' +
  'bronkus segmental tertinggal.',
)
