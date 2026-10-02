import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  SURGICAL_PROCEDURES,
  SURGICAL_FOCUS_WITHOUT_GEOMETRY,
  BATAS_FOKUS_TERLALU_LUAS,
} from '../../src/lib/surgicalAtlas.ts'

// Apakah kata kunci fokus benar-benar MENYOROT sesuatu?
//
// Ini satu lapis di atas bedah-struktur-risiko.mts. Di sana namanya hanya
// dibaca manusia; di sini namanya MENGEMUDIKAN penampil: Body3D mencocokkan
// tiap kata kunci sebagai substring ke nama simpul asli, menyalakan emissive
// pada mesh yang cocok, lalu membingkai ulang kamera ke kotak gabungannya.
//
// Karena itu ada DUA cara gagal, dan keduanya tidak terlihat:
//   * kata kunci yang tidak cocok dengan apa pun tidak menyorot apa pun dan
//     tidak memindahkan kamera. Fasenya tetap terbuka dan terlihat normal.
//   * kata kunci yang cocok dengan ratusan mesh menyorot sebagian besar atlas
//     dan membingkai kamera ke kotak sebesar tubuh — "fokus" yang justru
//     menjauhkan penampil dari struktur yang dimaksud.
//
// PENCOCOKNYA HARUS SAMA PERSIS DENGAN PRODUKSI. Menguji dengan pencocok yang
// lebih longgar atau lebih ketat daripada Body3D tidak membuktikan apa pun
// tentang apa yang dilihat pengguna. Karena itu berkas ini memakai
// `name.toLowerCase().includes(kata.toLowerCase())` — persis satu baris yang
// dipakai penampilnya — dan sebuah uji di bawah menjaga baris itu tetap sama.

const AKAR_GLB = 'public/anatomy'

function namaSimpulGlb(path: string): string[] {
  const buf = readFileSync(path)
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return []
  const panjang = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return []
  const json = JSON.parse(buf.subarray(20, 20 + panjang).toString('utf8')) as { nodes?: Array<{ name?: string }> }
  return (json.nodes ?? []).map((n) => n.name).filter((n): n is string => Boolean(n))
}

const berkas = readdirSync(AKAR_GLB).filter((f) => f.endsWith('.glb')).sort()
assert.ok(berkas.length > 0, 'shipped anatomy layers must be readable or this gate proves nothing')

const nama: string[] = []
for (const f of berkas) {
  const n = namaSimpulGlb(join(AKAR_GLB, f))
  assert.ok(n.length > 0, `${f} must expose named GLTF nodes; an unreadable layer would silently pass`)
  nama.push(...n)
}
assert.ok(nama.length > 1000, `only ${nama.length} nodes read; the reader is probably broken`)

/** Pencocok produksi, disalin apa adanya dari Body3D. */
const cocok = (namaSimpul: string, kata: string) => namaSimpul.toLowerCase().includes(kata.toLowerCase())

const jumlahCocok = (kata: string) => nama.filter((n) => cocok(n, kata)).length

// ── 0. Pencocok di sini harus tetap sama dengan pencocok di penampil ───────
//
// Kalau Body3D suatu hari beralih ke pencocokan frasa atau kata utuh, gerbang
// ini akan diam-diam menguji perilaku yang sudah tidak ada lagi.
{
  const sumber = readFileSync('src/components/Body3D.tsx', 'utf8')
  assert.ok(
    /keywords\.some\(\(k\) => name\.toLowerCase\(\)\.includes\(k\)\)/.test(sumber),
    'Body3D no longer matches focus keywords by lowercase substring; this gate must be updated to match it',
  )
}

const kataKunci = new Set<string>()
for (const p of SURGICAL_PROCEDURES) for (const fase of p.phases) for (const k of fase.focusKeywords) kataKunci.add(k)
assert.ok(kataKunci.size > 30, `only ${kataKunci.size} focus keywords collected; the reader is probably broken`)

const dinyatakan = new Map(SURGICAL_FOCUS_WITHOUT_GEOMETRY.map((d) => [d.keyword, d.reason]))

// ── 1. Kata kunci yang menyorot NOL mesh harus dinyatakan ─────────────────
{
  const kosong = [...kataKunci].filter((k) => jumlahCocok(k) === 0).sort()
  const tidakDinyatakan = kosong.filter((k) => !dinyatakan.has(k))
  assert.deepEqual(
    tidakDinyatakan, [],
    `focus keywords highlight nothing and are not declared: ${tidakDinyatakan.join(', ')}. ` +
    'Declare them with a reason, or narrow them — never bend a keyword onto the nearest mesh.',
  )
}

// ── 2. Arah sebaliknya: yang dinyatakan kosong padahal ADA meshnya ────────
//
// Tanpa ini, daftar di atas perlahan menjadi tempat pembuangan, dan geometri
// yang sebenarnya tersedia tidak pernah dipakai karena tercatat tidak ada.
{
  const keliru = [...dinyatakan.keys()].filter((k) => jumlahCocok(k) > 0).sort()
  assert.deepEqual(
    keliru, [],
    `declared as having no geometry, but shipped meshes do match: ${keliru.map((k) => `${k} (${jumlahCocok(k)})`).join(', ')}. ` +
    'Remove the declaration and use the geometry.',
  )
}

// ── 3. Setiap yang dinyatakan harus benar-benar dipakai atlas ─────────────
{
  const yatim = [...dinyatakan.keys()].filter((k) => !kataKunci.has(k)).sort()
  assert.deepEqual(yatim, [], `declarations name focus keywords the atlas no longer uses: ${yatim.join(', ')}`)
}

// ── 4. Setiap yang dinyatakan harus punya alasan yang sebenarnya ─────────
{
  for (const [k, alasan] of dinyatakan) {
    assert.ok(alasan.trim().length > 30, `declaration for "${k}" has no real reason: "${alasan}"`)
  }
}

// ── 5. Kata kunci yang TERLALU LUAS ditolak ──────────────────────────────
//
// Menyorot 353 dari 2.892 simpul bukan fokus. Kamera membingkai kotak sebesar
// tubuh, dan pengguna justru dijauhkan dari struktur yang dimaksud.
{
  const luas = [...kataKunci]
    .map((k) => ({ k, n: jumlahCocok(k) }))
    .filter((r) => r.n > BATAS_FOKUS_TERLALU_LUAS)
    .sort((a, b) => b.n - a.n)
  assert.deepEqual(
    luas.map((r) => `${r.k} (${r.n})`), [],
    `focus keywords match far too much of the atlas to focus anything: ${luas.map((r) => `${r.k}=${r.n}`).join(', ')} ` +
    `out of ${nama.length} nodes. Name the vessel, do not name the category.`,
  )
}

// ── 6. Lantai: sebagian besar kata kunci harus benar-benar menyorot ──────
//
// Tanpa lantai, pencocok yang rusak akan membuat SEMUANYA "tidak resolve",
// dan gerbang ini akan lulus dengan menelan setiap pernyataan.
{
  const resolve = [...kataKunci].filter((k) => jumlahCocok(k) > 0)
  assert.ok(
    resolve.length >= 30,
    `only ${resolve.length} of ${kataKunci.size} focus keywords resolve; the matcher is probably broken`,
  )
}

{
  const resolve = [...kataKunci].filter((k) => jumlahCocok(k) > 0).length
  console.log(
    `OK bedah-kata-fokus: ${resolve}/${kataKunci.size} kata kunci fokus menyorot geometri nyata ` +
    `(${dinyatakan.size} dinyatakan tanpa geometri, dengan alasan), tidak ada yang melampaui ` +
    `${BATAS_FOKUS_TERLALU_LUAS} dari ${nama.length} simpul, dan pencocoknya masih sama dengan Body3D.`,
  )
}
