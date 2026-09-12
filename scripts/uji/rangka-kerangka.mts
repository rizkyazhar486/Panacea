import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  BERKAS_KERANGKA, JUMLAH_NAMA_TERIKAT, KELOMPOK_TULANG, NODE_BUKAN_TULANG,
  TIDAK_DIBAWA, WILAYAH_RANGKA, kelompokDariNama,
} from '../../src/lib/anatomy/rangkaKerangka.ts'

// Apakah tulang yang dipilih benar-benar ada di berkasnya?
//
// Nama node yang tidak cocok dengan apa pun TIDAK menimbulkan galat: kelompok
// itu hanya diam dan tidak pernah menyala, sementara panelnya tetap terlihat
// bekerja. Karena itu yang diperiksa di sini bukan kode, melainkan BERKASNYA:
// chunk JSON GLB dibaca langsung, dan tiap nama yang diikat katalog harus ada
// DAN membawa geometri.

const buf = await readFile(new URL(`../../public/${BERKAS_KERANGKA}`, import.meta.url))
assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Bukan berkas GLB')
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Chunk pertama bukan JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8')) as {
  nodes: Array<{ name?: string; mesh?: number; children?: number[]; translation?: number[] }>
  extensionsUsed?: string[]
}
const nodes = gltf.nodes

// ── 0. Berkasnya memang termampat meshopt ─────────────────────────────────
//
// Tanpa MeshoptDecoder, GLTFLoader menolak berkas ini dan kanvasnya kosong
// tanpa satu pun galat. Kalau pemampatan itu hilang dari berkasnya, catatan di
// viewer ikut basi.
assert.ok(
  gltf.extensionsUsed?.includes('EXT_meshopt_compression'),
  `${BERKAS_KERANGKA} tidak lagi memakai EXT_meshopt_compression — periksa ulang pemuatnya`,
)

/** Indeks node per nama asli. Nama boleh berulang (sisi kiri dan kanan). */
const perNama = new Map<string, number[]>()
nodes.forEach((n, i) => {
  if (!n.name) return
  const daftar = perNama.get(n.name) ?? []
  daftar.push(i)
  perNama.set(n.name, daftar)
})

/** Benar bila node itu, atau salah satu keturunannya, membawa geometri. */
function adaGeometriDiKeturunan(i: number, kedalaman = 0): boolean {
  if (kedalaman > 8) return false
  const n = nodes[i]
  if (n.mesh !== undefined) return true
  return (n.children ?? []).some((c) => adaGeometriDiKeturunan(c, kedalaman + 1))
}

// ── 1. Katalognya utuh ────────────────────────────────────────────────────
{
  const id = new Set(KELOMPOK_TULANG.map((k) => k.id))
  assert.equal(id.size, KELOMPOK_TULANG.length, 'Ada id kelompok yang dipakai dua kali')
  for (const w of WILAYAH_RANGKA) {
    assert.ok(
      KELOMPOK_TULANG.some((k) => k.wilayah === w),
      `Tidak ada satu pun kelompok di wilayah ${w}`,
    )
  }
  for (const k of KELOMPOK_TULANG) {
    assert.ok(k.mesh.length > 0, `${k.id} tidak mengikat mesh apa pun`)
    assert.equal(new Set(k.mesh).size, k.mesh.length, `${k.id} menyebut nama mesh yang sama dua kali`)
    assert.ok(k.artikulasi.length > 0, `${k.id} tidak menyebut satu pun artikulasi`)
    assert.ok(k.label.length > 0 && k.ringkas.length > 0, `${k.id} tidak punya teks`)
  }
  // Satu nama node hanya boleh dimiliki satu kelompok, kalau tidak sorotannya
  // berebut dan yang menyala bergantung urutan.
  const pemilik = new Map<string, string>()
  for (const k of KELOMPOK_TULANG) {
    for (const n of k.mesh) {
      const lama = pemilik.get(n)
      assert.equal(lama, undefined, `"${n}" diklaim oleh ${lama} dan ${k.id}`)
      pemilik.set(n, k.id)
    }
  }
  assert.equal(pemilik.size, JUMLAH_NAMA_TERIKAT, 'JUMLAH_NAMA_TERIKAT tidak sesuai katalog')
}

// ── 2. Tiap nama ADA dan MEMBAWA GEOMETRI ─────────────────────────────────
//
// Keberadaan nama saja tidak cukup: berkas ini juga mengirim node pivot
// berlabel tanpa mesh ("Frontal bone", "Ethmoid bone", "Sphenoid bone"), yang
// geometrinya ada di anak tanpa nama. Node semacam itu hanya boleh lolos bila
// kelompoknya menyatakannya lewat `meshViaAnak`.
let lewatAnak = 0
for (const k of KELOMPOK_TULANG) {
  const viaAnak = new Set(k.meshViaAnak ?? [])
  for (const n of viaAnak) {
    assert.ok(k.mesh.includes(n), `${k.id}: meshViaAnak "${n}" tidak ada di daftar mesh`)
  }
  for (const nama of k.mesh) {
    const idx = perNama.get(nama)
    assert.ok(idx && idx.length > 0, `Node tidak ada di ${BERKAS_KERANGKA}: "${nama}" (${k.id})`)
    if (viaAnak.has(nama)) {
      assert.ok(
        idx.every((i) => nodes[i].mesh === undefined),
        `${k.id}: "${nama}" ternyata punya mesh sendiri — hapus dari meshViaAnak`,
      )
      assert.ok(
        idx.every((i) => adaGeometriDiKeturunan(i)),
        `${k.id}: "${nama}" node pivot tanpa geometri di keturunannya — kelompok ini tidak akan pernah menyala`,
      )
      lewatAnak++
    } else {
      assert.ok(
        idx.every((i) => nodes[i].mesh !== undefined),
        `${k.id}: "${nama}" ada tetapi tidak membawa geometri (node pivot) — nyatakan lewat meshViaAnak`,
      )
    }
  }
}
assert.ok(lewatAnak >= 3, `Tiga node pivot tengkorak harus tertangani, dapat ${lewatAnak}`)

// ── 3. Kelompok berpasangan harus mengikat KEDUA sisi, dan sisi yang
//      benar-benar berbeda ────────────────────────────────────────────────
//
// Pada berkas ini sisi kiri dan kanan MEMAKAI INDEKS MESH YANG SAMA — yang
// membedakan hanya nodenya dan transformasinya (skala X negatif di kiri). Jadi
// buktinya adalah dua NODE berbeda dengan tanda X berlawanan; menuntut dua
// indeks mesh berbeda justru akan menolak berkas yang benar.
for (const k of KELOMPOK_TULANG.filter((x) => x.berpasangan)) {
  const kiri = k.mesh.filter((n) => n.endsWith('.l'))
  const kanan = k.mesh.filter((n) => n.endsWith('.r'))
  assert.ok(kiri.length > 0 && kanan.length > 0, `${k.id} mengaku berpasangan tetapi hanya satu sisi`)
  for (const n of kiri) {
    const pasangan = `${n.slice(0, -2)}.r`
    assert.ok(k.mesh.includes(pasangan), `${k.id}: "${n}" terikat tanpa pasangannya "${pasangan}"`)
  }
  for (const n of kiri) {
    const pasangan = `${n.slice(0, -2)}.r`
    const a = perNama.get(n)![0]
    const b = perNama.get(pasangan)![0]
    assert.notEqual(a, b, `${k.id}: "${n}" dan "${pasangan}" adalah node yang sama`)
    const xa = nodes[a].translation?.[0] ?? 0
    const xb = nodes[b].translation?.[0] ?? 0
    assert.ok(
      Math.sign(xa) !== Math.sign(xb) || Math.abs(xa - xb) > 1e-6,
      `${k.id}: "${n}" dan "${pasangan}" berdiri di tempat yang sama (x=${xa}) — salah satunya salah sisi`,
    )
  }
}

// ── 4. Yang TIDAK dibawa harus terbukti tidak ada ─────────────────────────
//
// Menyatakan sesuatu absen adalah cara termurah membuat gerbang lulus. Tiap
// klaim di TIDAK_DIBAWA dicari di berkasnya; kalau ternyata ada, klaimnya
// salah dan panelnya sedang berbohong kepada pembacanya.
const semuaNamaKecil = [...perNama.keys()].map((n) => n.toLowerCase())
for (const t of TIDAK_DIBAWA) {
  assert.ok(t.cari.length > 0, `${t.label} tidak membawa istilah pencarian`)
  for (const istilah of t.cari) {
    const kena = semuaNamaKecil.filter((n) => n.includes(istilah.toLowerCase()))
    assert.equal(
      kena.length, 0,
      `Diklaim tidak dibawa ("${t.label}") tetapi berkasnya memuat: ${kena.slice(0, 3).join(', ')}`,
    )
  }
}

// ── 5. Cakupan: hampir seluruh berkas harus terikat ───────────────────────
//
// Kalau sebagian besar node tidak terikat, katalognya bukan kerangka melainkan
// sekumpulan tulang pilihan, dan itu harus terlihat di sini.
{
  const bermesh = nodes.filter((n) => n.mesh !== undefined && n.name)
  const bukanTulang = new Set(NODE_BUKAN_TULANG)
  const tulang = bermesh.filter((n) => !bukanTulang.has(n.name!))
  const takTerikat = tulang.filter((n) => kelompokDariNama(n.name!) === null)
  assert.deepEqual(
    takTerikat.map((n) => n.name),
    [],
    `Node bergeometri yang tidak masuk kelompok mana pun: ${takTerikat.length}`,
  )
  for (const n of NODE_BUKAN_TULANG) {
    assert.ok(perNama.has(n), `Node hiasan "${n}" tidak lagi ada — daftarnya perlu diperbarui`)
    assert.equal(kelompokDariNama(n), null, `"${n}" bukan tulang tetapi ikut terikat`)
  }
}

const jumlahPasangan = KELOMPOK_TULANG.filter((k) => k.berpasangan).length
console.log(
  `rangka-kerangka: ok (${KELOMPOK_TULANG.length} kelompok, ${JUMLAH_NAMA_TERIKAT} nama node terikat, ` +
  `${jumlahPasangan} kelompok berpasangan diperiksa dua sisi, ${lewatAnak} node pivot lewat anak, ` +
  `${TIDAK_DIBAWA.length} klaim "tidak dibawa" terbukti)`,
)
