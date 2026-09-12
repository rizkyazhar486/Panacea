import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  WILAYAH_ABDOMEN, MESH_PUNGGUNG_MIRIP, BERKAS_PERMUKAAN, kunciNama, kunciDasar,
  petaDasarKeWilayah, wilayahDariMesh, TANDA_X_KANAN,
} from '../../src/lib/anatomy/wilayahAbdomen.ts'

// Apakah wilayah yang menyala benar-benar wilayah itu?
//
// Anatomi permukaan gagal dengan cara yang sangat meyakinkan: sesuatu menyala
// di perut, warnanya benar, dan yang menyala adalah wilayah sebelahnya. Dua
// jebakan khusus berkas ini diuji langsung, bukan diandaikan.

const buf = await readFile(new URL(`../../public/${BERKAS_PERMUKAAN}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
const bermesh: string[] = gltf.nodes
  .filter((n: { mesh?: number }) => n.mesh !== undefined)
  .map((n: { name?: string }) => n.name ?? '')
const kunci = new Set(bermesh.map(kunciNama))

// ── 1. Skemanya harus benar-benar sembilan, tiga kali tiga ────────────────
{
  assert.equal(WILAYAH_ABDOMEN.length, 9, 'Skema sembilan wilayah harus punya sembilan wilayah')
  const sel = new Set(WILAYAH_ABDOMEN.map((w) => `${w.baris}/${w.kolom}`))
  assert.equal(sel.size, 9, 'Dua wilayah menempati sel kisi yang sama')
  for (const baris of ['atas', 'tengah', 'bawah']) {
    assert.equal(WILAYAH_ABDOMEN.filter((w) => w.baris === baris).length, 3, `Baris ${baris} bukan tiga wilayah`)
  }
}

// ── 2. Setiap mesh harus ada DAN membawa geometri ─────────────────────────
for (const w of WILAYAH_ABDOMEN) {
  assert.ok(w.mesh.length > 0, `${w.id} tidak mengikat mesh apa pun`)
  for (const nama of w.mesh) {
    assert.ok(kunci.has(kunciNama(nama)), `Mesh tidak ada di ${BERKAS_PERMUKAAN}: "${nama}"`)
  }
}

// ── 3. Wilayah garis tengah harus memakai KEDUA belahan ───────────────────
//
// Berkas ini membelah epigastrium, umbilikal dan hipogastrium menjadi kiri dan
// kanan, sementara secara klinis masing-masing satu wilayah. Memakai satu sisi
// saja akan menyalakan separuh perut dan tetap terlihat benar.
{
  for (const id of ['epigastric', 'umbilical', 'hypogastric']) {
    const w = WILAYAH_ABDOMEN.find((x) => x.id === id)
    assert.ok(w, `Wilayah garis tengah hilang: ${id}`)
    assert.equal(w.kolom, 'tengah', `${id} harus berada di kolom tengah`)
    const kiri = w.mesh.filter((n) => /\.l$/.test(n)).length
    const kanan = w.mesh.filter((n) => /\.r$/.test(n)).length
    assert.ok(kiri > 0 && kanan > 0, `${id} hanya memakai satu belahan: ${w.mesh.join(', ')}`)
  }
  // Sebaliknya, wilayah berpasangan harus memakai SATU sisi saja, dan sisi
  // yang sesuai dengan kolomnya.
  for (const w of WILAYAH_ABDOMEN.filter((x) => x.kolom !== 'tengah')) {
    const akhiran = w.kolom === 'kiri' ? '.l' : '.r'
    for (const nama of w.mesh) {
      assert.ok(nama.endsWith(akhiran), `${w.id} berada di kolom ${w.kolom} tetapi memakai "${nama}"`)
    }
  }
}

// ── 4. Wilayah punggung TIDAK BOLEH dipakai sebagai wilayah perut ─────────
//
// Berkas ini mengirim "Lumbar region", dan itu punggung. Skema sembilan-wilayah
// menyebut pinggang depan sebagai regio lumbalis juga, sehingga nama itu
// tampak seperti pilihan yang benar. Memakainya akan menyalakan punggung ketika
// yang dimaksud perut -- menyala, masuk akal, dan salah.
{
  const dipakai = petaDasarKeWilayah()
  for (const nama of MESH_PUNGGUNG_MIRIP) {
    assert.ok(kunci.has(kunciNama(nama)), `Kontrol negatif harus benar-benar ada di berkas: "${nama}"`)
    assert.ok(!dipakai.has(kunciDasar(nama)), `Wilayah punggung dipakai sebagai wilayah perut: "${nama}"`)
    // Dan lewat jalur runtime yang sebenarnya, pada kedua sisi.
    const namaScene = nama.replace(/\.[lr]$/, '').replace(/ /g, '_')
    assert.equal(wilayahDariMesh(namaScene, 1), undefined, `"${namaScene}" tidak boleh menemukan wilayah perut`)
    assert.equal(wilayahDariMesh(namaScene, -1), undefined, `"${namaScene}" tidak boleh menemukan wilayah perut`)
  }
  const lateral = WILAYAH_ABDOMEN.filter((w) => w.id.startsWith('lateral-'))
  assert.equal(lateral.length, 2)
  for (const w of lateral) {
    for (const nama of w.mesh) {
      assert.ok(/^Lateral region of abdomen/.test(nama), `${w.id} harus memakai wilayah lateral abdomen, bukan "${nama}"`)
    }
  }
}

// ── 5. Nama dasar boleh dipakai paling banyak dua wilayah, dan berbeda sisi ─
{
  const peta = petaDasarKeWilayah()
  for (const [dasar, ids] of peta) {
    assert.ok(ids.length <= 2, `Nama dasar "${dasar}" dipakai ${ids.length} wilayah`)
    if (ids.length === 2) {
      const kolom = ids.map((id) => WILAYAH_ABDOMEN.find((w) => w.id === id)?.kolom)
      assert.deepEqual([...kolom].sort(), ['kanan', 'kiri'], `"${dasar}" dipakai dua wilayah pada sisi yang sama`)
    }
  }
}

// ── 6. Proyeksi harus bersisi benar, dan tidak menyeberang ────────────────
//
// Uji ini menangkap kesalahan yang paling mudah lolos dari pembacaan sekilas:
// menuliskan limpa di sisi kanan atau apendiks di sisi kiri. Keduanya akan
// tetap terbaca sebagai kalimat yang wajar.
{
  const sisiWajib: Array<[string, RegExp]> = [
    ['hypochondriac-right', /liver|gallbladder|right/i],
    ['hypochondriac-left', /spleen/i],
    ['inguinal-right', /appendix/i],
  ]
  for (const [id, pola] of sisiWajib) {
    const w = WILAYAH_ABDOMEN.find((x) => x.id === id)
    assert.ok(w && w.proyeksi.some((p) => pola.test(p)), `${id} kehilangan struktur penandanya`)
  }
  const kiri = WILAYAH_ABDOMEN.filter((w) => w.kolom === 'kiri').flatMap((w) => w.proyeksi)
  const kanan = WILAYAH_ABDOMEN.filter((w) => w.kolom === 'kanan').flatMap((w) => w.proyeksi)
  assert.ok(!kiri.some((p) => /gallbladder|appendix|caecum|ascending colon/i.test(p)),
    'Struktur sisi kanan muncul di wilayah kiri')
  assert.ok(!kanan.some((p) => /spleen|descending colon|sigmoid/i.test(p)),
    'Struktur sisi kiri muncul di wilayah kanan')
  for (const w of WILAYAH_ABDOMEN) {
    assert.ok(w.proyeksi.length >= 3, `${w.id} punya terlalu sedikit proyeksi untuk berguna`)
  }
}

// ── 7. Sisi TIDAK BISA dibaca dari nama, jadi dibaca dari posisi ─────────
//
// Ini kegagalan paling tajam yang ditemukan saat membangun panel ini, dan ia
// tidak melempar apa pun. GLTFLoader membuang tanda titik, sehingga
// "Hypochondriac region.l" dan "...r" TIBA DENGAN NAMA YANG SAMA,
// "Hypochondriac_region", dibedakan hanya oleh akhiran angka yang urutannya
// tidak dijamin. Menebak sisi dari akhiran itu akan menaruh limpa di tempat
// hati, dan gambarnya tetap terlihat benar.
//
// Sisi karena itu diambil dari koordinat X. Tandanya diturunkan dari berkasnya
// dan dikunci di sini: kalau atlas suatu hari dicerminkan, gerbang ini gagal
// alih-alih diam-diam menukar kiri dan kanan.
{
  const simpul = new Map<string, number>()
  for (const n of gltf.nodes) {
    if (n.mesh === undefined || !n.name) continue
    if (n.translation) simpul.set(n.name, n.translation[0])
  }

  let pasangan = 0
  for (const w of WILAYAH_ABDOMEN.filter((x) => x.kolom !== 'tengah')) {
    for (const nama of w.mesh) {
      const x = simpul.get(nama)
      assert.ok(x !== undefined, `Simpul "${nama}" tidak punya translasi untuk menentukan sisi`)
      assert.notEqual(Math.sign(x), 0, `"${nama}" duduk di garis tengah dan tidak bisa memberi sisi`)
      const tandaDiharapkan = w.kolom === 'kanan' ? TANDA_X_KANAN : -TANDA_X_KANAN
      assert.equal(Math.sign(x), tandaDiharapkan, `"${nama}" berada di sisi X yang salah untuk kolom ${w.kolom}`)
      // Jalur yang dipakai runtime, dengan nama SEPERTI YANG TIBA di scene:
      // titik dan akhiran sisi sudah hilang, akhiran angka bisa ada.
      const namaScene = nama.replace(/\.[lr]$/, '').replace(/ /g, '_')
      assert.equal(wilayahDariMesh(namaScene, x), w.id, `"${namaScene}" pada X=${x} tidak menemukan ${w.id}`)
      assert.equal(wilayahDariMesh(`${namaScene}_2`, x), w.id, 'Akhiran angka loader harus diabaikan')
      pasangan += 1
    }
  }
  assert.ok(pasangan >= 6, `Harus menguji keenam wilayah berpasangan, hanya ${pasangan}`)

  // Jalur utama: nama ASLI masih menyebut sisinya, dan harus dipercaya lebih
  // dulu. Ia diuji dengan X yang SENGAJA dibalik: kalau posisi yang menang,
  // wilayahnya akan tertukar dan uji ini gagal.
  for (const w of WILAYAH_ABDOMEN.filter((x) => x.kolom !== 'tengah')) {
    for (const nama of w.mesh) {
      const x = simpul.get(nama) ?? 0
      assert.equal(wilayahDariMesh(nama, x), w.id, `Nama asli "${nama}" tidak menemukan wilayahnya`)
      assert.equal(wilayahDariMesh(nama, -x), w.id, `Nama asli "${nama}" kalah oleh posisi yang dibalik`)
    }
  }

  // Menukar tanda X harus menukar wilayahnya. Tanpa ini, sebuah implementasi
  // yang mengabaikan posisi sama sekali akan tetap lolos seluruh uji di atas.
  const kanan = WILAYAH_ABDOMEN.find((w) => w.id === 'hypochondriac-right')
  assert.ok(kanan)
  const xKanan = simpul.get(kanan.mesh[0])
  assert.ok(xKanan !== undefined)
  assert.equal(wilayahDariMesh('Hypochondriac_region', xKanan), 'hypochondriac-right')
  assert.equal(wilayahDariMesh('Hypochondriac_region', -xKanan), 'hypochondriac-left')

  // Wilayah garis tengah tidak boleh bergantung pada X sama sekali.
  for (const id of ['epigastric', 'umbilical', 'hypogastric']) {
    const w = WILAYAH_ABDOMEN.find((x) => x.id === id)
    assert.ok(w)
    const namaScene = kunciDasar(w.mesh[0])
    assert.ok(namaScene.length > 0)
    assert.equal(wilayahDariMesh(w.mesh[0].replace(/\.[lr]$/, ''), 1), id)
    assert.equal(wilayahDariMesh(w.mesh[0].replace(/\.[lr]$/, ''), -1), id)
  }
}

console.log(
  'Wilayah abdomen: sembilan wilayah mengisi kisi tiga-kali-tiga, setiap mesh ada di surface.glb, wilayah ' +
  'garis tengah memakai kedua belahan, wilayah punggung "Lumbar region" terbukti tidak dipakai sebagai perut, ' +
  'dan tidak ada struktur penanda sisi yang menyeberang; sisi diambil dari nama asli yang dipulihkan lewat parser.associations, dengan koordinat X sebagai cadangan.',
)
