import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  STRUKTUR_KELENJAR, BERKAS_KELENJAR, BERKAS_VISCERAL, BERKAS_NERVOUS,
  TIDAK_DIKIRIM_ATLAS, meshBerkas, petaMeshKeStruktur, jalurKemih, strukturUntuk,
} from '../../src/lib/anatomy/kelenjarSaluran.ts'

// Apakah kelenjar yang menyala benar-benar kelenjar itu?
//
// Panel ini gagal dengan sangat meyakinkan: nama yang tidak cocok dengan apa
// pun TIDAK melempar galat, ia hanya menggambar nol mesh. Karena itu yang
// diperiksa di sini bukan "namanya masuk akal" melainkan bahwa setiap nama yang
// diikat BENAR-BENAR ADA di berkasnya DAN membawa geometri.

type Simpul = { name?: string; mesh?: number; children?: number[] }

async function bacaGltf(berkas: string) {
  const buf = await readFile(new URL(`../../public/${berkas}`, import.meta.url))
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `Bukan berkas GLB: ${berkas}`)
  assert.equal(buf.readUInt32LE(16), 0x4e4f534a, `Chunk pertama bukan JSON: ${berkas}`)
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
  return json as { nodes: Simpul[]; extensionsRequired?: string[] }
}

const atlas = new Map<string, { nodes: Simpul[]; extensionsRequired?: string[] }>()
for (const berkas of BERKAS_KELENJAR) atlas.set(berkas, await bacaGltf(berkas))

/**
 * Geometri simpul bernama.
 *
 * Atlas ini menggantungkan sebagian geometri pada satu anak TANPA NAMA:
 * "Kidney.l" membawa meshnya sendiri, "Kidney.r" tidak. Anak lain (".j"/".t")
 * adalah simpul penanda tanpa geometri sama sekali -- itulah sebabnya
 * keberadaan nama saja bukan bukti apa pun.
 */
function meshSimpul(nodes: Simpul[], i: number): number | null {
  const n = nodes[i]
  if (n.mesh !== undefined) return n.mesh
  const anak = (n.children ?? []).filter((c) => nodes[c].mesh !== undefined && !nodes[c].name)
  return anak.length === 1 ? (nodes[anak[0]].mesh as number) : null
}

function cariSimpul(nodes: Simpul[], nama: string): number[] {
  const hasil: number[] = []
  nodes.forEach((n, i) => { if (n.name === nama) hasil.push(i) })
  return hasil
}

// ── 1. Berkas sumbernya harus benar-benar butuh dekoder meshopt ───────────
//
// Tanpa loader.setMeshoptDecoder(MeshoptDecoder) GLTFLoader MENOLAK berkas ini
// dan kanvasnya kosong. Gerbang ini mengunci kenyataan itu supaya penampil yang
// lupa memasang dekodernya tidak bisa disebut benar.
for (const berkas of BERKAS_KELENJAR) {
  const g = atlas.get(berkas)!
  assert.ok(
    (g.extensionsRequired ?? []).includes('EXT_meshopt_compression'),
    `${berkas} seharusnya butuh EXT_meshopt_compression`,
  )
}

// ── 2. Panel ini HARUS memuat dua berkas ──────────────────────────────────
//
// Hipotalamus tidak ada di visceral.glb. Kalau suatu saat katalog ini menyusut
// menjadi satu berkas, hipotalamusnya hilang diam-diam.
{
  assert.equal(BERKAS_KELENJAR.length, 2, 'Panel ini harus memuat dua berkas sumber')
  assert.ok(meshBerkas(BERKAS_VISCERAL).length > 0, 'Tidak ada yang diambil dari visceral.glb')
  assert.ok(meshBerkas(BERKAS_NERVOUS).length > 0, 'Tidak ada yang diambil dari nervous.glb')
  const hipo = strukturUntuk('hypothalamus')
  assert.ok(hipo, 'Hipotalamus hilang dari katalog')
  assert.equal(hipo.berkas, BERKAS_NERVOUS, 'Hipotalamus hanya dikirim nervous.glb')
  assert.equal(cariSimpul(atlas.get(BERKAS_VISCERAL)!.nodes, 'Hypothalamus').length, 0,
    'Hipotalamus ternyata ada di visceral.glb; asumsi dua-berkas perlu diperiksa ulang')
}

// ── 3. Setiap nama yang diikat harus ADA dan MEMBAWA GEOMETRI ─────────────
//
// Ini gerbang yang paling penting. Berkas-berkas ini mengirim simpul penanda
// bernama TANPA mesh (".j"/".t", dan grup seperti "Body of pancreas.t"); nama
// seperti itu lolos pemeriksaan keberadaan sambil menggambar nol piksel.
const meshPerStruktur = new Map<string, number[]>()
for (const s of STRUKTUR_KELENJAR) {
  assert.ok(s.mesh.length > 0, `${s.id} tidak mengikat mesh apa pun`)
  const nodes = atlas.get(s.berkas)!.nodes
  const indeks: number[] = []
  for (const nama of s.mesh) {
    const simpul = cariSimpul(nodes, nama)
    assert.equal(simpul.length, 1,
      `Nama "${nama}" cocok dengan ${simpul.length} simpul di ${s.berkas} (harus tepat satu)`)
    const mesh = meshSimpul(nodes, simpul[0])
    assert.notEqual(mesh, null,
      `"${nama}" ada di ${s.berkas} tetapi TIDAK membawa geometri — ia akan menggambar nol piksel tanpa galat`)
    indeks.push(mesh as number)
  }
  meshPerStruktur.set(s.id, indeks)
}

// ── 4. Struktur berpasangan harus mengikat DUA sisi, dan mesh BERBEDA ─────
//
// Mengikat satu sisi saja, atau mengikat mesh yang sama dua kali, menghasilkan
// gambar yang menyala separuh dan tetap terlihat benar.
{
  const berpasangan = ['suprarenal', 'kidney', 'ureter', 'renal-pelvis', 'parathyroid']
  for (const id of berpasangan) {
    const s = strukturUntuk(id)
    assert.ok(s, `Struktur berpasangan hilang: ${id}`)
    const kiri = s.mesh.filter((n) => n.endsWith('.l'))
    const kanan = s.mesh.filter((n) => n.endsWith('.r'))
    assert.ok(kiri.length > 0 && kanan.length > 0,
      `${id} hanya mengikat satu sisi: ${s.mesh.join(', ')}`)
    assert.equal(kiri.length, kanan.length, `${id} tidak seimbang kiri/kanan`)
    const indeks = meshPerStruktur.get(id)!
    assert.equal(new Set(indeks).size, indeks.length,
      `${id} memakai mesh yang SAMA untuk lebih dari satu sisi: ${indeks.join(', ')}`)
  }
  // Empat paratiroid, bukan dua.
  assert.equal(strukturUntuk('parathyroid')!.mesh.length, 4,
    'Paratiroid biasanya empat kelenjar dan atlas ini mengirim keempatnya')
}

// ── 5. Tidak ada mesh yang dipakai dua struktur ───────────────────────────
//
// Dua struktur yang menunjuk geometri yang sama berarti memilih salah satunya
// akan menyalakan yang lain juga.
{
  const dipakai = new Map<string, string>()
  for (const s of STRUKTUR_KELENJAR) {
    for (const [i, nama] of s.mesh.entries()) {
      const kunci = `${s.berkas}#${meshPerStruktur.get(s.id)![i]}`
      const lama = dipakai.get(kunci)
      assert.equal(lama, undefined, `Mesh yang sama dipakai "${lama}" dan "${s.id}" (${nama})`)
      dipakai.set(kunci, s.id)
    }
  }
  const peta = petaMeshKeStruktur()
  assert.equal(peta.size, STRUKTUR_KELENJAR.flatMap((s) => s.mesh).length,
    'Ada nama mesh yang sama dipakai dua kali di katalog')
}

// ── 6. Cakupan minimum: setiap kelenjar dan setiap langkah jalur kemih ────
{
  const wajib = [
    'hypothalamus', 'adenohypophysis', 'neurohypophysis', 'pineal', 'thyroid',
    'parathyroid', 'suprarenal', 'pancreas',
    'kidney', 'ureter', 'bladder', 'urethra',
  ]
  for (const id of wajib) assert.ok(strukturUntuk(id), `Struktur wajib hilang: ${id}`)

  // Hipofisis: kedua lobus, dan NAMANYA bukan "pituitary" di berkas ini.
  for (const id of ['adenohypophysis', 'neurohypophysis']) {
    const s = strukturUntuk(id)!
    assert.ok(s.mesh.every((n) => /hypophysis/i.test(n)),
      `${id} harus mengikat nama hipofisis atlas ini, bukan "${s.mesh.join(', ')}"`)
  }

  // Jalur kemih harus berurutan dan tanpa lompatan.
  const jalur = jalurKemih()
  assert.deepEqual(jalur.map((s) => s.urutanKemih), [1, 2, 3, 4, 5], 'Jalur kemih tidak berurutan rapat')
  assert.deepEqual(jalur.map((s) => s.id), ['kidney', 'renal-pelvis', 'ureter', 'bladder', 'urethra'],
    'Urutan jalur kemih tidak mengikuti arah aliran urin')
}

// ── 7. Ketiadaan DIBUKTIKAN, bukan ditutupi ──────────────────────────────
//
// Menyatakan sesuatu tidak dikirim adalah cara termurah untuk meloloskan
// gerbang, jadi klaim ketiadaan itu sendiri diperiksa pada berkasnya.
for (const t of TIDAK_DIKIRIM_ATLAS) {
  const pola = new RegExp(t.pola, 'i')
  for (const berkas of BERKAS_KELENJAR) {
    const cocok = atlas.get(berkas)!.nodes.filter((n) => pola.test(n.name ?? '')).map((n) => n.name)
    assert.equal(cocok.length, 0,
      `Diklaim tidak dikirim, tetapi "${t.pola}" cocok di ${berkas}: ${cocok.join(', ')}`)
  }
}

// ── 8. Batas klinis pada teks yang tampil ────────────────────────────────
//
// Panel ini menamai fisiologi, bukan memberi angka. Dosis, rentang rujukan atau
// ambang yang menyelinap ke katalog akan tampil sebagai anjuran klinis.
{
  const angkaKlinis = /\b\d+(\.\d+)?\s?(mg|mcg|µg|g|ml|mmol|mEq|IU|units?|mmHg|ng\/dL|mIU\/L|pg\/mL)\b/i
  const katalarang = /\bdiagnos|\bnormal range|\breference range|\btreat(ment|ed)?\b|\bdose|\bdosing|\btherapy\b/i
  for (const s of STRUKTUR_KELENJAR) {
    const teks = [s.label, s.letak, ...s.peran].join(' ')
    assert.ok(!angkaKlinis.test(teks), `${s.id} memuat angka klinis: "${teks}"`)
    assert.ok(!katalarang.test(teks), `${s.id} memuat bahasa diagnostik/terapeutik: "${teks}"`)
    assert.ok(s.letak.length > 20, `${s.id} tidak menyebutkan letaknya`)
    assert.ok(s.peran.length > 0, `${s.id} tidak menyebutkan sekresi atau perannya`)
  }
}

console.log(
  `Kelenjar & saluran kemih: ${STRUKTUR_KELENJAR.length} struktur terikat pada dua berkas atlas ` +
  `(${meshBerkas(BERKAS_VISCERAL).length} mesh dari visceral.glb, ${meshBerkas(BERKAS_NERVOUS).length} dari nervous.glb); ` +
  'setiap nama ada DAN membawa geometri, struktur berpasangan memakai mesh yang berbeda di kedua sisi, ' +
  'tidak ada mesh dipakai dua kali, jalur kemih berurutan, dan setiap klaim ketiadaan terbukti pada berkasnya.',
)
