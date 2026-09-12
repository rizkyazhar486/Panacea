import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  SURGICAL_PROCEDURES,
  SURGICAL_STRUCTURES_WITHOUT_GEOMETRY,
} from '../../src/lib/surgicalAtlas.ts'

// Apakah "struktur yang berisiko" pada atlas bedah benar-benar punya geometri?
//
// `structuresAtRisk` selama ini hanya prosa. Tidak ada satu pun pemeriksaan yang
// menghubungkannya dengan mesh yang benar-benar dikirim, sehingga sebuah nama
// bisa terlihat meyakinkan di layar padahal tidak ada wujudnya di berkas GLB —
// dan sebaliknya, struktur yang sebenarnya TERSEDIA bisa dianggap tidak ada dan
// tidak pernah dipakai. Dua-duanya kerugian, maka dua-duanya digagalkan di sini.
//
// Berkas GLB dibaca langsung dari chunk JSON-nya (magic 0x46546c67 di offset 0,
// panjang JSON di 12, tipe chunk 0x4e4f534a di 16, muatan mulai 20) supaya yang
// dibandingkan adalah berkas yang benar-benar dikirim ke pengguna, bukan indeks
// turunan yang bisa basi.
//
// Aturan kecocokannya sengaja ketat dan tidak "mendekat-dekatkan" nama:
//   * akhiran sisi/varian GLTF (".l", ".r", ".j", ".t") dilepas;
//   * label harus muncul sebagai FRASA UTUH di dalam nama simpul;
//   * label yang seluruh katanya generik ("Vessels", "Nerves", "Cartilage")
//     tidak pernah dianggap resolve — mencocokkannya hanya menghasilkan
//     kepastian palsu atas 240 simpul yang tidak ada hubungannya;
//   * satu-satunya perluasan yang diizinkan adalah "<X> vessels" -> arteri dan
//     vena bernama "<X>", karena itu memang satu struktur yang sama.
// Anatomi TIDAK boleh diganti namanya supaya cocok. Kalau strukturnya memang
// tidak dikirim, itulah temuannya, dan temuan itu harus dinyatakan.

const AKAR_GLB = 'public/anatomy'

const KATA_GENERIK = new Set([
  'vessel', 'vasculature', 'microvasculature', 'nerve', 'structure', 'tissue', 'cartilage',
  'region', 'field', 'bundle', 'branch', 'target', 'route', 'edge', 'surface', 'wall',
  'plane', 'space', 'mechanism', 'parenchyma', 'bowel', 'airway', 'cortex', 'adjacent',
  'deep', 'local', 'superficial', 'underlying', 'operative', 'exposed', 'relevant',
  'to', 'the', 'approach', 'and', 'of', 'or', 'graft', 'recipient', 'conduit', 'depending',
  'on', 'neurovascular', 'biliary', 'eloquent', 'functional', 'posterior', 'anterior',
])

function tunggal(kata: string): string {
  if (kata.length <= 3) return kata
  if (kata.endsWith('ies')) return `${kata.slice(0, -3)}y`
  if (/(s|x|ch|sh)es$/.test(kata)) return kata.slice(0, -2)
  if (kata.endsWith('ss')) return kata
  if (kata.endsWith('s')) return kata.slice(0, -1)
  return kata
}

function normalkan(mentah: string): string {
  return mentah
    .replace(/\.[a-z]$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(tunggal)
    .join(' ')
}

function namaSimpulGlb(path: string): string[] {
  const buf = readFileSync(path)
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return []
  const panjang = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return []
  const json = JSON.parse(buf.subarray(20, 20 + panjang).toString('utf8')) as { nodes?: Array<{ name?: string }> }
  return (json.nodes ?? []).map((n) => n.name).filter((n): n is string => Boolean(n))
}

const berkas = readdirSync(AKAR_GLB).filter((f) => f.endsWith('.glb')).sort()
assert.ok(berkas.length > 0, 'shipped anatomy layer files must be readable for this gate to mean anything')

const simpul: Array<{ file: string; raw: string; norm: string }> = []
for (const f of berkas) {
  const nama = namaSimpulGlb(join(AKAR_GLB, f))
  assert.ok(nama.length > 0, `${f} must expose named GLTF nodes; an unreadable layer would silently pass this gate`)
  for (const raw of nama) simpul.push({ file: f, raw, norm: normalkan(raw) })
}

function seluruhnyaGenerik(norm: string): boolean {
  const kata = norm.split(' ').filter(Boolean)
  return kata.length > 0 && kata.every((k) => KATA_GENERIK.has(k))
}

function varian(label: string): string[] {
  const n = normalkan(label)
  if (/ vessel$/.test(n)) {
    const dasar = n.replace(/ vessel$/, '')
    return [`${dasar} artery`, `${dasar} vein`]
  }
  return [n]
}

function cocokFrasa(namaSimpul: string, frasa: string): boolean {
  if (namaSimpul === frasa) return true
  const pola = new RegExp(`(^| )${frasa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`)
  return pola.test(namaSimpul)
}

export function resolveStructureNodes(label: string): string[] {
  const norm = normalkan(label)
  if (!norm || seluruhnyaGenerik(norm)) return []
  const hasil = new Set<string>()
  for (const v of varian(label)) {
    if (!v || seluruhnyaGenerik(v)) continue
    for (const node of simpul) if (cocokFrasa(node.norm, v)) hasil.add(node.raw)
  }
  return [...hasil].sort()
}

// Kumpulkan seluruh label dari atlas.
const label = new Set<string>()
for (const prosedur of SURGICAL_PROCEDURES) {
  for (const fase of prosedur.phases) {
    for (const s of fase.structuresAtRisk) label.add(s)
  }
}
assert.ok(label.size > 0, 'the surgical atlas must declare structures at risk')

const resolve = new Map<string, string[]>()
for (const s of [...label].sort()) resolve.set(s, resolveStructureNodes(s))

const tidakResolve = [...resolve].filter(([, n]) => n.length === 0).map(([s]) => s)
const adaGeometri = [...resolve].filter(([, n]) => n.length > 0).map(([s]) => s)

// Daftar yang dinyatakan harus utuh: setiap catatan punya alasan yang nyata.
const dinyatakan = new Map<string, string>()
for (const entri of SURGICAL_STRUCTURES_WITHOUT_GEOMETRY) {
  assert.ok(entri.structure.trim().length > 0, 'a declared unresolvable structure must name a structure')
  assert.ok(
    entri.reason.trim().length >= 24,
    `declared unresolvable structure "${entri.structure}" needs a real reason, not a placeholder`,
  )
  assert.ok(!dinyatakan.has(entri.structure), `duplicate declaration for "${entri.structure}"`)
  dinyatakan.set(entri.structure, entri.reason)
}

// Arah pertama: tidak resolve tetapi tidak dinyatakan. Ini kecelakaan diam.
const belumDinyatakan = tidakResolve.filter((s) => !dinyatakan.has(s))
assert.deepEqual(
  belumDinyatakan,
  [],
  `these structures at risk resolve to no shipped mesh node and are not declared in SURGICAL_STRUCTURES_WITHOUT_GEOMETRY:\n  - ${belumDinyatakan.join('\n  - ')}`,
)

// Arah kedua: dinyatakan tidak ada, padahal ada. Ini pekerjaan yang terbuang.
const salahDinyatakan = [...dinyatakan.keys()].filter((s) => (resolve.get(s)?.length ?? 0) > 0)
assert.deepEqual(
  salahDinyatakan,
  [],
  `these structures are declared unresolvable but DO resolve to shipped mesh nodes; the geometry is available and nobody knows it:\n  - ${salahDinyatakan.map((s) => `${s} -> ${resolve.get(s)?.slice(0, 3).join(', ')}`).join('\n  - ')}`,
)

// Arah ketiga: catatan yang menunjuk struktur yang sudah tidak ada di atlas.
const yatim = [...dinyatakan.keys()].filter((s) => !label.has(s))
assert.deepEqual(
  yatim,
  [],
  `these declarations no longer correspond to any structure at risk in the atlas:\n  - ${yatim.join('\n  - ')}`,
)

// Gerbang ini kehilangan gigi kalau tidak ada satu pun yang resolve: kalau
// kecocokan rusak total, semuanya "tidak resolve" dan daftar pernyataan bisa
// dibuat menelan apa saja. Jadi sebagian harus benar-benar terikat geometri.
assert.ok(
  adaGeometri.length >= 12,
  `only ${adaGeometri.length} structures at risk resolve to shipped geometry; matching is probably broken`,
)

console.log(`bedah: ${adaGeometri.length}/${label.size} structures at risk resolve to shipped mesh nodes; ${tidakResolve.length} declared unresolvable with a recorded reason`)
