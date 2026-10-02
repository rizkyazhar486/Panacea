import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'

// Apakah organ yang dinyatakan HILANG benar-benar tidak ada di berkas mana pun?
//
// Gerbang cakupan organ membaca manifes, dan manifes adalah pernyataan. Sebuah
// organ bisa berstatus 'missing' hanya karena tidak ada yang pernah
// mendeklarasikannya, sementara geometrinya dikirim sejak lama -- itu persis
// yang pernah terjadi pada hipofisis dan simpul limfe, keduanya terhitung
// selesai justru ke arah sebaliknya.
//
// Uji ini memeriksa pernyataan itu terhadap BERKAS. Ia gagal ke dua arah:
//
//   * organ yang dinyatakan hilang padahal geometrinya ada -- pekerjaan yang
//     bisa diselesaikan hari ini dan tidak ada yang tahu;
//   * organ yang dinyatakan hilang dan suatu hari geometrinya ditambahkan --
//     gerbangnya memberi tahu alih-alih membiarkannya tidak terpakai.

const BERKAS = ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid']

const semuaNama: string[] = []
for (const f of BERKAS) {
  const buf = await readFile(new URL(`../../public/anatomy/${f}.glb`, import.meta.url))
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `${f}.glb bukan berkas GLB`)
  const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
  for (const n of gltf.nodes) {
    if (n.mesh !== undefined && n.name) semuaNama.push(n.name)
  }
}
assert.ok(semuaNama.length > 1000, `Hanya ${semuaNama.length} mesh terbaca; berkasnya mungkin tidak terbaca benar`)

/**
 * Pola pencarian untuk organ yang saat ini dinyatakan hilang.
 *
 * Polanya sengaja LONGGAR. Uji ini menjawab "apakah ada sesuatu yang menyerupai
 * organ ini di berkas", dan pola yang terlalu sempit akan menjawab "tidak ada"
 * hanya karena namanya berbeda -- yaitu kegagalan yang justru ingin dicegah.
 */
const POLA: Record<string, RegExp> = {
  'skin': /\bskin\b|epidermis|dermis|integument/i,
  'major-joints': /joint capsule|articular capsule|meniscus|glenoid labrum|acetabular labrum|articular disc/i,
  'lymphatic-vessels': /thoracic duct|lymphatic (vessel|trunk)|cisterna chyli|right lymphatic duct/i,
  'female-reproductive': /\buterus\b|\bovary\b|uterine tube|\bvagina\b/i,
  'major-fascial-planes': /fascia lata|thoracolumbar fascia|clavipectoral fascia|\bfascial? (plane|sheet)\b/i,
}

/**
 * Organ yang berstatus 'missing' BUKAN karena geometrinya tidak ada.
 *
 * Daftar ini KOSONG, dan itu hasil kerja, bukan kebetulan. Rongga hidung
 * sempat masuk ke sini: geometrinya dikirim, tetapi simpulnya dideklarasikan
 * berskala 'suborgan' sementara gerbang cakupan hanya menerima 'organ', jadi
 * ia terhitung hilang. Yang diperbaiki adalah klasifikasinya, bukan aturan
 * skalanya, sehingga catatannya tidak lagi diperlukan.
 *
 * Kalau daftar ini terisi lagi, setiap catatan WAJIB membuktikan geometrinya
 * memang ada, supaya ia tidak bisa dipakai menyembunyikan organ yang benar-
 * benar tidak dikirim.
 */
const HILANG_KARENA_SKALA: Record<string, RegExp> = {}
const laporan = buildOrganCoverageReport(COMPLETE_WHOLE_BODY_ATLAS)
const hilang = laporan.entries.filter((e) => e.status === 'missing')

// ── 1. Setiap organ hilang harus punya pola, dan sebaliknya ───────────────
//
// Tanpa ini sebuah organ bisa menjadi hilang tanpa pernah diperiksa, atau
// polanya tertinggal setelah organnya selesai -- keduanya membuat uji ini
// perlahan berhenti menguji apa pun.
{
  const idHilang = new Set(hilang.map((e) => e.id))
  const idPola = new Set([...Object.keys(POLA), ...Object.keys(HILANG_KARENA_SKALA)])
  const tanpaPola = [...idHilang].filter((id) => !idPola.has(id))
  const polaYatim = [...idPola].filter((id) => !idHilang.has(id))
  assert.deepEqual(tanpaPola, [], `Organ hilang tanpa pola pencarian: ${tanpaPola.join(', ')}`)
  assert.deepEqual(polaYatim, [], `Pola untuk organ yang tidak lagi hilang: ${polaYatim.join(', ')}`)
}

// ── 2. Yang dinyatakan hilang harus BENAR-BENAR tidak ada ─────────────────
{
  const sebenarnyaAda: string[] = []
  for (const e of hilang) {
    if (HILANG_KARENA_SKALA[e.id]) continue
    const cocok = semuaNama.filter((n) => POLA[e.id].test(n))
    if (cocok.length > 0) {
      sebenarnyaAda.push(`${e.label}: ${[...new Set(cocok)].slice(0, 5).join(', ')}`)
    }
  }
  assert.deepEqual(
    sebenarnyaAda, [],
    'Organ dinyatakan hilang padahal geometrinya DIKIRIM. Ini pekerjaan yang bisa diselesaikan, ' +
    `bukan kegagalan uji:\n  ${sebenarnyaAda.join('\n  ')}`,
  )
}

// ── 2b. Pengecualian skala harus membuktikan geometrinya ADA ──────────────
//
// Arah sebaliknya dari uji di atas. Sebuah organ boleh dikecualikan hanya
// dengan menunjukkan geometrinya benar-benar dikirim; tanpa syarat ini, daftar
// pengecualian akan menjadi cara termurah membuat gerbang ini diam.
{
  for (const [id, pola] of Object.entries(HILANG_KARENA_SKALA)) {
    const cocok = semuaNama.filter((n) => pola.test(n))
    assert.ok(
      cocok.length > 0,
      `"${id}" dikecualikan sebagai masalah skala, tetapi geometrinya tidak ditemukan di berkas mana pun`,
    )
  }
}

// ── 3. Pola kontrol positif harus benar-benar menemukan sesuatu ───────────
//
// Sebuah regex yang salah ketik tidak menemukan apa-apa, dan uji di atas akan
// lulus dengan gemilang tanpa memeriksa apa pun. Jadi pola dengan bentuk yang
// sama dicoba pada organ yang MEMANG ada.
{
  const kontrol: Array<[string, RegExp]> = [
    ['liver', /\bliver\b/i],
    ['spleen', /\bspleen\b/i],
    ['vertebra', /^Vertebra T\d/i],
    ['pectoralis', /pectoralis/i],
  ]
  for (const [nama, pola] of kontrol) {
    assert.ok(semuaNama.some((n) => pola.test(n)), `Kontrol positif "${nama}" tidak menemukan apa pun`)
  }
}

console.log(
  `Cakupan organ vs berkas: ${semuaNama.length} nama mesh dibaca dari ${BERKAS.length} berkas atlas; ` +
  `${hilang.length - Object.keys(HILANG_KARENA_SKALA).length} organ yang dinyatakan hilang terbukti memang ` +
  `tidak dikirim, dan ${Object.keys(HILANG_KARENA_SKALA).length} dicatat sebagai masalah SKALA dengan ` +
  'geometrinya dibuktikan ada.',
)
