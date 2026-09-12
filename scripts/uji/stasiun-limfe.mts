import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  BERKAS_LIMFOID, STASIUN_LIMFE, WILAYAH_LIMFE, MESH_PIVOT_TANPA_GEOMETRI,
  MESH_BUKAN_ANATOMI, POLA_PEMBULUH_ABSEN, semuaMeshTerikat, stasiunDariMeshAsli,
  stasiunUntuk, stasiunDiWilayah,
} from '../../src/lib/anatomy/stasiunLimfe.ts'

// Apakah stasiun yang menyala benar-benar stasiun itu, dan apakah ia menyala
// sama sekali?
//
// Panel limfe bisa gagal dengan sangat meyakinkan: daftarnya penuh, warnanya
// benar, dan yang menyala tidak ada -- atau yang menyala sisi yang salah.
// Gerbang ini membaca chunk JSON berkas GLB LANGSUNG, karena setiap jalur lain
// (memuat lewat three, memeriksa nama scene) sudah pernah lolos sambil
// mengikat nol geometri.

const buf = await readFile(new URL(`../../public/${BERKAS_LIMFOID}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8')) as {
  nodes: Array<{ name?: string; mesh?: number; children?: number[] }>
  meshes?: Array<{ name?: string }>
  materials?: Array<{ name?: string }>
  extensionsRequired?: string[]
  extensionsUsed?: string[]
}

// ── 1. Berkas ini memang butuh meshopt ────────────────────────────────────
//
// Dikunci di sini supaya alasan setMeshoptDecoder tidak pernah hilang: tanpa
// dekodernya GLTFLoader menolak berkasnya dan kanvasnya kosong, tanpa galat.
{
  const ext = [...(gltf.extensionsRequired ?? []), ...(gltf.extensionsUsed ?? [])]
  assert.ok(ext.includes('EXT_meshopt_compression'),
    'lymphoid.glb tidak lagi meshopt; pemuat harus disesuaikan, bukan gerbang ini')
}

// Indeks simpul menurut nama ASLI, persis seperti di berkas.
const simpulMenurutNama = new Map<string, Array<{ idx: number; mesh?: number }>>()
gltf.nodes.forEach((n, idx) => {
  if (!n.name) return
  const daftar = simpulMenurutNama.get(n.name) ?? []
  daftar.push({ idx, mesh: n.mesh })
  simpulMenurutNama.set(n.name, daftar)
})
const bergeometri = new Set(
  gltf.nodes.filter((n) => n.mesh !== undefined && n.name).map((n) => n.name as string),
)

// ── 2. Katalog harus koheren sebagai data ─────────────────────────────────
{
  assert.ok(STASIUN_LIMFE.length >= 60, `Katalog terlalu kecil: ${STASIUN_LIMFE.length} stasiun`)
  const id = new Set<string>()
  const label = new Set<string>()
  for (const s of STASIUN_LIMFE) {
    assert.ok(/^[a-z0-9-]+$/.test(s.id), `id bukan kunci stabil: "${s.id}"`)
    assert.ok(!id.has(s.id), `id ganda: "${s.id}"`)
    id.add(s.id)
    assert.ok(s.label.trim().length > 0, `${s.id} tanpa label`)
    assert.ok(!label.has(s.label), `Label ganda: "${s.label}"`)
    label.add(s.label)
    assert.equal(stasiunUntuk(s.id)?.id, s.id, `stasiunUntuk gagal untuk ${s.id}`)
    assert.ok(WILAYAH_LIMFE.some((w) => w.id === s.wilayah), `${s.id} berada di wilayah tak dikenal`)
  }
  for (const w of WILAYAH_LIMFE) {
    assert.ok(stasiunDiWilayah(w.id).length > 0, `Wilayah "${w.id}" kosong dan akan tampil sebagai daftar kosong`)
  }
}

// ── 3. Setiap nama terikat harus ADA dan MEMBAWA GEOMETRI ─────────────────
//
// Ini pemeriksaan intinya. Nama yang tidak cocok dengan apa pun tidak melempar
// apa-apa di three: stasiunnya tetap terdaftar, tetap bisa dipilih, dan tidak
// pernah menggambar satu piksel pun.
{
  const terlihat = new Map<string, string>()
  for (const s of STASIUN_LIMFE) {
    assert.ok(s.mesh.length > 0, `${s.id} tidak mengikat mesh apa pun`)
    for (const nama of s.mesh) {
      assert.ok(simpulMenurutNama.has(nama), `Mesh tidak ada di ${BERKAS_LIMFOID}: "${nama}"`)
      assert.ok(bergeometri.has(nama), `Simpul "${nama}" ada tetapi TIDAK membawa geometri (${s.id})`)
      const pemilik = terlihat.get(nama)
      assert.equal(pemilik, undefined, `"${nama}" diikat dua stasiun: ${pemilik} dan ${s.id}`)
      terlihat.set(nama, s.id)
      assert.equal(stasiunDariMeshAsli(nama), s.id, `Pencarian runtime gagal memetakan "${nama}" ke ${s.id}`)
    }
  }
  assert.equal(terlihat.size, semuaMeshTerikat().length, 'semuaMeshTerikat tidak sepadan dengan katalog')
}

// ── 4. Stasiun berpasangan harus mengikat KEDUA sisi, dan sisinya berbeda ──
//
// Mengikat satu sisi saja akan menyalakan separuh stasiun dan terlihat benar.
// "Berbeda" di sini berarti SIMPUL yang berbeda: berkas ini memakai ulang
// indeks mesh yang sama untuk kiri dan kanan (pasangannya dicerminkan lewat
// skala negatif), jadi indeks mesh tidak bisa dipakai sebagai pembeda.
{
  let pasangan = 0
  for (const s of STASIUN_LIMFE) {
    for (const nama of s.mesh) {
      if (!nama.endsWith('.l')) continue
      const kanan = `${nama.slice(0, -2)}.r`
      assert.ok(s.mesh.includes(kanan), `${s.id} mengikat "${nama}" tanpa pasangan "${kanan}"`)
      const kiriSimpul = simpulMenurutNama.get(nama)
      const kananSimpul = simpulMenurutNama.get(kanan)
      assert.ok(kiriSimpul && kananSimpul, `Pasangan "${nama}" tidak lengkap di berkas`)
      assert.equal(kiriSimpul.length, 1, `"${nama}" muncul ${kiriSimpul.length} kali; sisi jadi ambigu`)
      assert.equal(kananSimpul.length, 1, `"${kanan}" muncul ${kananSimpul.length} kali; sisi jadi ambigu`)
      assert.notEqual(kiriSimpul[0].idx, kananSimpul[0].idx,
        `"${nama}" dan "${kanan}" menunjuk SIMPUL yang sama; hanya satu sisi akan digambar`)
      pasangan += 1
    }
    // Sebaliknya: sebuah ".r" tanpa ".l" juga separuh stasiun.
    for (const nama of s.mesh) {
      if (!nama.endsWith('.r')) continue
      assert.ok(s.mesh.includes(`${nama.slice(0, -2)}.l`), `${s.id} mengikat "${nama}" tanpa pasangan kiri`)
    }
  }
  assert.ok(pasangan >= 40, `Terlalu sedikit pasangan diuji: ${pasangan}`)
}

// ── 5. Kontrol negatif: simpul BERLABEL tanpa geometri ────────────────────
//
// Berkas ini mengirim "Cubital nodes.l/.r" dan "Inferior deep lateral cervical
// nodes.l/.r" sebagai pivot murni. Keduanya lolos pemeriksaan "namanya ada"
// dengan mulus dan tidak menggambar apa pun. Kalau salah satu pernah terikat,
// stasiunnya akan tampak ada di daftar dan tidak pernah menyala.
{
  const terikat = new Set(semuaMeshTerikat())
  for (const nama of MESH_PIVOT_TANPA_GEOMETRI) {
    assert.ok(simpulMenurutNama.has(nama), `Kontrol negatif harus benar-benar ada di berkas: "${nama}"`)
    assert.ok(!bergeometri.has(nama), `"${nama}" ternyata membawa geometri; kontrol negatif sudah usang`)
    assert.ok(!terikat.has(nama), `Simpul pivot tanpa geometri diikat sebagai stasiun: "${nama}"`)
    assert.equal(stasiunDariMeshAsli(nama), undefined, `"${nama}" tidak boleh menemukan stasiun`)
  }
  for (const nama of MESH_BUKAN_ANATOMI) {
    assert.ok(simpulMenurutNama.has(nama), `Simpul bantu berkas hilang: "${nama}"`)
    assert.ok(!terikat.has(nama), `Simpul bantu berkas diikat sebagai anatomi: "${nama}"`)
  }
}

// ── 6. Cakupan: tidak ada stasiun bernama yang diam-diam tertinggal ───────
{
  const terikat = new Set(semuaMeshTerikat())
  const abai = new Set<string>(MESH_BUKAN_ANATOMI)
  const tertinggal = [...bergeometri].filter((n) => !terikat.has(n) && !abai.has(n))
  assert.deepEqual(tertinggal, [],
    `Simpul bernama dengan geometri tidak muncul di katalog: ${tertinggal.join(', ')}`)
}

// ── 7. Atlas ini TIDAK membawa pembuluh limfe, dan itu dibuktikan ─────────
//
// Tidak ada ductus thoracicus, tidak ada cisterna chyli, tidak ada trunkus.
// Panel menyatakannya di antarmuka; klaim itu diperiksa terhadap berkasnya di
// sini, supaya tidak ada yang tergoda menambal celah itu dengan geometri
// pinjaman atau struktur tetangga.
{
  const nama = [
    ...gltf.nodes.map((n) => n.name ?? ''),
    ...(gltf.meshes ?? []).map((m) => m.name ?? ''),
    ...(gltf.materials ?? []).map((m) => m.name ?? ''),
  ].join('\n').toLowerCase()
  for (const pola of POLA_PEMBULUH_ABSEN) {
    assert.ok(!nama.includes(pola),
      `Berkas ternyata MEMBAWA sesuatu yang cocok "${pola}"; pernyataan "tidak ada pembuluh" di panel harus diperbarui`)
  }
}

// ── 8. Batas klinis: orientasi, bukan stadium ─────────────────────────────
//
// Hubungan aliran adalah anatomi kotor baku. Ia tidak boleh berubah menjadi
// bahasa stadium, penyebaran keganasan atau prognosis lewat satu penyuntingan
// yang terlihat tidak berbahaya.
{
  const terlarang = /\b(stage|staging|metasta|prognos|malignan|cancer|tumou?r|sentinel|N[0-3]\b|biopsy|Virchow|Troisier)/i
  for (const s of STASIUN_LIMFE) {
    assert.ok(s.drainase.length > 0, `${s.id} tidak menyebut satu pun wilayah yang dialirkannya`)
    const teks = [s.label, ...s.drainase, s.catatan ?? ''].join(' ')
    assert.ok(!terlarang.test(teks), `${s.id} memakai bahasa stadium/keganasan: "${teks}"`)
    for (const d of s.drainase) assert.ok(d.trim().length > 2, `${s.id} punya entri aliran kosong`)
  }
}

console.log(
  `Stasiun limfe: ${STASIUN_LIMFE.length} stasiun mengikat ${semuaMeshTerikat().length} simpul di ${BERKAS_LIMFOID}; ` +
  'setiap nama ada DAN membawa geometri, setiap stasiun berpasangan memakai dua simpul berbeda, ' +
  'pivot berlabel tanpa geometri ("Cubital nodes", "Inferior deep lateral cervical nodes") terbukti tidak diikat, ' +
  'tidak ada simpul bernama yang tertinggal, dan berkas ini terbukti tidak membawa satu pun duktus, trunkus atau pembuluh limfe.',
)
