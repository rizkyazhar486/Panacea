import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  IKATAN_TINGKAT, MESH_LINTASAN, BERKAS_SARAF, kunciNama, meshSorot, ikatanUntuk,
} from '../../src/lib/anatomy/tingkatLesiMesh.ts'
import { TINGKAT, type TingkatLesi } from '../../src/lib/lokalisasiLesi.ts'

// Apakah tempat lesi yang disorot benar-benar tempat itu?
//
// Menyorot struktur yang keliru pada model anatomi adalah kegagalan yang
// TIDAK terlihat seperti kegagalan: ada yang menyala, gambarnya meyakinkan,
// dan yang menyala adalah tempat lain. Karena itu berkas GLB-nya dibaca
// langsung dan pernyataan cakupan diperiksa ke DUA arah.

const buf = await readFile(new URL(`../../public/${BERKAS_SARAF}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))

const bermesh: string[] = gltf.nodes
  .filter((n: { mesh?: number }) => n.mesh !== undefined)
  .map((n: { name?: string }) => n.name ?? '')
const kunci = new Set(bermesh.map(kunciNama))

// ── 1. Setiap nama yang akan disorot harus ada DAN membawa geometri ────────
for (const ikatan of IKATAN_TINGKAT) {
  const semua = [...Object.values(ikatan.mesh).flat(), ...(ikatan.meshTanpaSisi ?? [])]
  for (const nama of semua) {
    assert.ok(kunci.has(kunciNama(nama)), `Mesh tidak ada di ${BERKAS_SARAF}: "${nama}"`)
  }
}
for (const nama of MESH_LINTASAN) {
  assert.ok(kunci.has(kunciNama(nama)), `Mesh lintasan tidak ada: "${nama}"`)
}

// ── 2. Setiap tingkat yang bisa disimpulkan harus punya ikatan ─────────────
//
// Sebuah tingkat yang ditambahkan ke model penalaran tetapi lupa diikat akan
// tampil sebagai jawaban yang tidak pernah menyala, tanpa penjelasan apa pun.
for (const t of TINGKAT) {
  assert.ok(ikatanUntuk(t), `Tingkat lesi tanpa ikatan mesh: ${t}`)
}
assert.equal(IKATAN_TINGKAT.length, TINGKAT.length, 'Ada ikatan untuk tingkat yang tidak dimodelkan')

// ── 3. Cakupan yang dinyatakan harus cocok dengan isi berkas ───────────────
//
// Arah pertama: 'berpasangan' harus benar-benar punya kedua sisi, dan
// 'sebagian' harus benar-benar hanya punya satu.
for (const ikatan of IKATAN_TINGKAT) {
  const kiri = (ikatan.mesh.kiri ?? []).length
  const kanan = (ikatan.mesh.kanan ?? []).length
  switch (ikatan.cakupan) {
    case 'berpasangan':
      assert.ok(kiri > 0 && kanan > 0, `${ikatan.tingkat} dinyatakan berpasangan tanpa kedua sisi`)
      break
    case 'sebagian':
      assert.ok((kiri > 0) !== (kanan > 0), `${ikatan.tingkat} dinyatakan sebagian tetapi punya nol atau dua sisi`)
      assert.ok(ikatan.keterangan, `${ikatan.tingkat} sebagian tanpa keterangan untuk pengguna`)
      break
    case 'tanpa-sisi':
      assert.equal(kiri + kanan, 0, `${ikatan.tingkat} tanpa-sisi tetapi mendaftarkan mesh bersisi`)
      assert.ok((ikatan.meshTanpaSisi ?? []).length > 0, `${ikatan.tingkat} tanpa-sisi tanpa mesh`)
      assert.ok(ikatan.keterangan, `${ikatan.tingkat} tanpa-sisi tanpa keterangan untuk pengguna`)
      break
    case 'tidak-ada':
      assert.equal(kiri + kanan + (ikatan.meshTanpaSisi ?? []).length, 0)
      assert.ok(ikatan.keterangan, `${ikatan.tingkat} tidak-ada tanpa keterangan untuk pengguna`)
      break
  }
}

// ── 4. Arah sebaliknya: 'tidak-ada' dan 'sebagian' harus BENAR-BENAR kurang ─
//
// Ini uji yang paling penting di berkas ini. Menyatakan sebuah tingkat tidak
// punya geometri adalah cara termurah membuat gerbang ini hijau, dan kalau
// geometrinya sebenarnya ada, tidak ada yang akan memberitahu. Jadi nama simpul
// berkas dicari untuk kata kunci tingkat itu, dan kekurangannya harus nyata.
{
  const KATA: Record<TingkatLesi, RegExp> = {
    'korteks': /precentral/i,
    'kapsula-interna': /internal capsule|capsula interna/i,
    'midbrain': /midbrain|mesencephalon/i,
    'pons': /^pons/i,
    'medula': /medulla oblongata/i,
    'medula-spinalis': /spinal cord/i,
  }
  for (const ikatan of IKATAN_TINGKAT) {
    const cocok = bermesh.filter((n) => KATA[ikatan.tingkat].test(n))
    if (ikatan.cakupan === 'tidak-ada') {
      assert.deepEqual(
        cocok, [],
        `${ikatan.tingkat} dinyatakan tidak punya geometri, padahal berkas mengirim: ${cocok.join(', ')}`,
      )
    } else {
      assert.ok(cocok.length > 0, `${ikatan.tingkat} tidak menemukan satu pun simpul yang cocok`)
    }
    if (ikatan.cakupan === 'sebagian') {
      const kiri = cocok.filter((n) => /\.l$/.test(n)).length
      const kanan = cocok.filter((n) => /\.r$/.test(n)).length
      assert.ok(
        (kiri > 0) !== (kanan > 0),
        `${ikatan.tingkat} dinyatakan sebagian, tetapi berkas mengirim kiri=${kiri} kanan=${kanan}`,
      )
    }
  }
}

// ── 5. meshSorot harus mengembalikan kosong persis saat tidak bisa digambar ─
//
// Pemanggilnya bergantung pada ini untuk memilih antara menggambar dan
// menjelaskan. Kalau ia diam-diam mengembalikan mesh sisi lain, gambarnya akan
// menunjukkan sisi yang salah -- kesalahan yang sama persis yang pernah dibuat
// modul lokalisasi ini sendiri, dulu, dengan invarian penyilangan terbalik.
{
  assert.deepEqual(meshSorot('kapsula-interna', 'kiri'), [])
  assert.deepEqual(meshSorot('kapsula-interna', 'kanan'), [])
  assert.deepEqual(meshSorot('pons', 'kanan'), [], 'Pons kanan tidak dikirim dan tidak boleh dicerminkan')
  assert.ok(meshSorot('pons', 'kiri').length > 0)

  // Berpasangan: kedua sisi ada, dan TIDAK SAMA. Mengembalikan mesh yang sama
  // untuk kiri dan kanan akan lolos setiap uji "tidak kosong".
  for (const t of ['korteks', 'midbrain', 'medula'] as TingkatLesi[]) {
    const kiri = meshSorot(t, 'kiri')
    const kanan = meshSorot(t, 'kanan')
    assert.ok(kiri.length > 0 && kanan.length > 0, `${t} harus punya kedua sisi`)
    assert.notDeepEqual(kiri, kanan, `${t} mengembalikan mesh yang sama untuk kedua sisi`)
  }

  // Tanpa sisi: kedua sisi mengembalikan mesh yang SAMA, dan itu disengaja.
  assert.deepEqual(meshSorot('medula-spinalis', 'kiri'), meshSorot('medula-spinalis', 'kanan'))
}

console.log(
  'Tingkat lesi 3D: keenam tingkat terikat, setiap nama mesh benar-benar membawa geometri di nervous.glb, ' +
  'kapsula interna terbukti memang tidak dikirim, pons terbukti memang hanya sisi kiri, dan tidak ada sisi ' +
  'yang dicerminkan untuk menutupi kekurangan.',
)
