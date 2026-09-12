// Apakah tiap arteri yang dijanjikan panel benar-benar ADA dan PUNYA geometri?
//
// Kegagalan yang dijaga di sini pernah terjadi berkali-kali di repositori ini
// dan tidak satu pun melempar galat: nama yang tidak cocok apa-apa hanya diam,
// dan berkas-berkas atlas ini memuat simpul pivot BERNAMA yang tidak
// menggambar apa pun — cukup untuk lulus pemeriksaan "namanya ada" sambil
// membuat kanvas kosong. Karena itu yang diperiksa bukan keberadaan nama,
// melainkan geometri: tiap nama terikat harus punya mesh miliknya sendiri.
//
// Yang juga dijaga: daftar cabang distal harus SAMA PERSIS dengan isi GLB
// (kalau tidak, panel mengarang cabang), arteri berpasangan harus mengikat dua
// sisi yang benar-benar berbeda mesh dan berbeda tempat (kalau tidak, satu sisi
// diam-diam menyorot sisi yang lain), dan pembuluh yang dinyatakan tidak ada
// harus benar-benar tidak ada.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  ARTERI, ARTERI_TIDAK_DIMUAT, BATAS_ARTERI, BERKAS_ARTERI,
  cabangDistal, labelSimpul, namaSimpulArteri,
} from '../../src/lib/anatomy/wilayahArteri.ts'

// ── 1. Baca bongkah JSON GLB langsung, tanpa peramban dan tanpa three ───────
const berkas = `public/anatomy/${BERKAS_ARTERI}`
const buf = fs.readFileSync(berkas)
assert.equal(buf.readUInt32LE(0), 0x46546c67, `${berkas} bukan GLB`)
const panjangJson = buf.readUInt32LE(12)
assert.equal(buf.readUInt32LE(16), 0x4e4f534a, 'Bongkah pertama harus JSON')
const gltf = JSON.parse(buf.subarray(20, 20 + panjangJson).toString('utf8')) as {
  nodes: Array<{ name?: string, mesh?: number, children?: number[], translation?: number[], rotation?: number[], scale?: number[], matrix?: number[] }>
  extensionsUsed?: string[]
}
const N = gltf.nodes

// Berkas ini dimampatkan meshopt. Tanpa MeshoptDecoder, GLTFLoader menolak
// berkasnya dan kanvas tetap kosong tanpa galat — jadi kontraknya dikunci.
assert.ok(gltf.extensionsUsed?.includes('EXT_meshopt_compression'),
  'Atlas harus tetap memakai EXT_meshopt_compression')

const indeks = new Map<string, number>()
N.forEach((n, i) => { if (n.name && !indeks.has(n.name)) indeks.set(n.name, i) })

/** Simpul mesh MILIK sebuah batang: dirinya sendiri, dan anak tanpa nama. */
function simpulGeometri(i: number): number[] {
  const keluar: number[] = []
  if (N[i].mesh !== undefined) keluar.push(i)
  for (const c of N[i].children ?? []) if (!N[c].name && N[c].mesh !== undefined) keluar.push(c)
  return keluar
}
function anakBernama(i: number): string[] {
  const keluar: string[] = []
  for (const c of N[i].children ?? []) {
    if (N[c].name) keluar.push(N[c].name as string)
    else keluar.push(...anakBernama(c))
  }
  return keluar
}

// Matriks dunia dirakit sendiri supaya sisi bisa diperiksa sungguhan.
const induk = new Map<number, number>()
N.forEach((n, i) => (n.children ?? []).forEach((c) => induk.set(c, i)))
function kali(a: number[], b: number[]): number[] {
  const o = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let s = 0
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
    o[c * 4 + r] = s
  }
  return o
}
function matriksLokal(i: number): number[] {
  const n = N[i]
  if (n.matrix) return n.matrix.slice()
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1]
  const [sx, sy, sz] = n.scale ?? [1, 1, 1]
  const [tx, ty, tz] = n.translation ?? [0, 0, 0]
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = w * z2
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]
}
function posisiDunia(i: number): [number, number, number] {
  let m = matriksLokal(i)
  let p = induk.get(i)
  while (p !== undefined) { m = kali(matriksLokal(p), m); p = induk.get(p) }
  return [m[12], m[13], m[14]]
}

// ── 2. Tiap nama terikat harus ada DAN menggambar sesuatu ──────────────────
let jumlahSimpul = 0
const terlihat = new Set<string>()
for (const a of ARTERI) {
  assert.ok(!terlihat.has(a.id), `id arteri ganda: ${a.id}`)
  terlihat.add(a.id)
  assert.match(a.id, /^[a-z0-9-]+$/, `id adalah data, bukan teks: ${a.id}`)
  assert.ok(a.label.trim().length > 0, `${a.id} tanpa label`)
  assert.ok(a.wilayah.length > 0, `${a.id} tidak menyebut satu wilayah pun`)
  assert.ok(a.simpul.length > 0, `${a.id} tidak terikat ke simpul mana pun`)

  for (const s of a.simpul) {
    jumlahSimpul++
    const i = indeks.get(s.nama)
    assert.notEqual(i, undefined,
      `${a.id}: simpul "${s.nama}" tidak ada di ${berkas} — nama yang meleset tidak melempar galat, ia hanya menggambar kekosongan`)
    const geo = simpulGeometri(i as number)
    assert.ok(geo.length > 0,
      `${a.id}: "${s.nama}" ada tetapi TIDAK membawa geometri (pivot bernama tanpa mesh)`)
    // Cabang distal harus datang dari berkasnya, bukan dari ingatan.
    assert.deepEqual(s.cabang, anakBernama(i as number),
      `${a.id}: daftar cabang "${s.nama}" tidak sama dengan isi GLB`)
  }
}
assert.ok(ARTERI.length >= 40, `Katalog terlalu kecil: ${ARTERI.length}`)

// ── 3. Arteri berpasangan: dua sisi, dan sungguh-sungguh berbeda ───────────
let jumlahPasangan = 0
for (const a of ARTERI) {
  const kiri = a.simpul.filter((s) => s.sisi === 'kiri')
  const kanan = a.simpul.filter((s) => s.sisi === 'kanan')
  if (kiri.length === 0 || kanan.length === 0) continue
  jumlahPasangan++
  const gKiri = simpulGeometri(indeks.get(kiri[0].nama) as number)
  const gKanan = simpulGeometri(indeks.get(kanan[0].nama) as number)
  assert.ok(gKiri.every((n) => !gKanan.includes(n)),
    `${a.id}: kedua sisi menunjuk simpul mesh yang sama — satu sisi akan menyorot sisi lain`)
  const xKiri = posisiDunia(gKiri[0])[0]
  const xKanan = posisiDunia(gKanan[0])[0]
  assert.ok(Math.abs(xKiri - xKanan) > 1e-4,
    `${a.id}: kedua sisi berada di tempat yang sama (x ${xKiri} vs ${xKanan})`)
}
assert.ok(jumlahPasangan >= 20, `Terlalu sedikit arteri berpasangan diikat: ${jumlahPasangan}`)

// ── 4. Ketiadaan harus DIBUKTIKAN, bukan didiamkan ────────────────────────
const semuaNama = N.map((n) => n.name ?? '').join('\n')
for (const t of ARTERI_TIDAK_DIMUAT) {
  const pola = new RegExp(`^.*(${t.pola}).*artery.*$`, 'gim')
  const cocok = semuaNama.match(pola) ?? []
  const terikat = cocok.filter((c) => namaSimpulArteri().includes(c))
  assert.equal(terikat.length, 0,
    `${t.nama} dinyatakan tidak dimuat, tetapi katalog mengikat ${terikat.join(', ')}`)
  const persis = cocok.filter((c) => labelSimpul(c).toLowerCase() === t.nama.toLowerCase())
  assert.equal(persis.length, 0,
    `${t.nama} ternyata ADA di berkas (${persis.join(', ')}) — daftar ketiadaan harus disusut`)
}
// Pembanding: pola yang sama memang menemukan sesuatu untuk tiroid, sehingga
// pemeriksaan di atas bukan sekadar regex yang tidak pernah cocok apa pun.
assert.ok(/Inferior thyroid artery/.test(semuaNama),
  'Pemeriksaan ketiadaan tidak berarti kalau polanya tidak pernah menemukan apa pun')

// ── 5. Batas klinis tidak boleh hilang dari panel ─────────────────────────
assert.ok(BATAS_ARTERI.length >= 4)
assert.ok(BATAS_ARTERI.some((b) => /vary between people/i.test(b)), 'Variasi antarorang harus dinyatakan')
assert.ok(BATAS_ARTERI.some((b) => /collateral/i.test(b)), 'Sirkulasi kolateral harus dinyatakan')
assert.ok(BATAS_ARTERI.some((b) => /diagnosis/i.test(b)))

const panel = fs.readFileSync('src/pages/bodyhub/ArteriPanel.tsx', 'utf8')
assert.match(panel, /BATAS_ARTERI/, 'Panel harus menampilkan batas klinisnya')
assert.match(panel, /ARTERI_TIDAK_DIMUAT/, 'Panel harus menyatakan pembuluh yang tidak dimuat')
assert.match(panel, /aria-pressed/, 'Tiap arteri harus bisa dipilih tanpa menunjuk model 3D')

const tampilan = fs.readFileSync('src/pages/bodyhub/Arteri3D.tsx', 'utf8')
assert.match(tampilan, /setMeshoptDecoder/, 'Tanpa MeshoptDecoder, GLTFLoader menolak berkasnya dan kanvas kosong tanpa galat')
assert.match(tampilan, /parser\.associations/, 'Nama asli harus dipulihkan lewat associations, bukan dari nama scene')
assert.doesNotMatch(tampilan, /scale\.x\s*=\s*-1/, 'Geometri tidak boleh dicerminkan untuk menutup lubang')

// ── 6. Label yang tampil tidak boleh membawa akhiran sisi mentah ──────────
for (const a of ARTERI) {
  for (const c of cabangDistal(a)) {
    assert.doesNotMatch(c, /\.[lr]$/i, `Label cabang masih membawa akhiran berkas: ${c}`)
  }
}

console.log(
  `Wilayah arteri: ${ARTERI.length} arteri terikat ke ${jumlahSimpul} simpul glTF, semuanya ada dan membawa geometri; ` +
  `${jumlahPasangan} arteri berpasangan mengikat dua sisi dengan mesh dan posisi berbeda; daftar cabang distal sama persis ` +
  `dengan isi GLB; dan ${ARTERI_TIDAK_DIMUAT.length} pembuluh yang dinyatakan tidak dimuat terbukti memang tidak ada.`,
)
