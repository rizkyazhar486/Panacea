// D8 — inventaris provenance SELURUH aset biner terpublikasi di public/ (bukan hanya public/bodyexposure).
// Murni dan deterministik (membaca berkas, tanpa jaringan). Tiap aset diklasifikasikan:
//   per-node            GLB: setiap node membawa panacea_license DAN panacea_source
//   hak-cipta-tertanam  GLB: asset.copyright tidak kosong dan memuat lisensi yang dikenali
//   berkas-kredit       ada CREDITS*/PROVENANCE*/LICENSE*/NOTICE* (>= UKURAN_MIN_KREDIT byte) di direktori yang sama, ATAU
//                       berkas kredit di direktori induk (bukan akar public/) yang MENYEBUT nama berkas aset itu, ATAU
//                       ASSET_SOURCES* (di direktori yang sama/induk) yang menyebut nama berkas aset itu. ASSET_SOURCES hanya menutup aset yang disebut namanya:
//                       aset lain di direktori yang sama tetap tercatat sebagai celah (tidak ada tebakan "semua di sini sama asalnya").
//   tanpa-jejak         tidak ada satu pun di atas -> TIDAK dianggap tercakup (fail-closed)
// BATAS: mengukur ADA-nya jejak, bukan KEABSAHAN lisensi; berkas kredit direktori tidak membuktikan tiap aset di dalamnya.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, dirname, sep } from 'node:path'

export const EKSTENSI_ASET = new Set(['glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'woff', 'woff2', 'ttf', 'otf', 'hdr', 'ktx2', 'gif', 'avif', 'ico'])
/** Berkas kredit kosong/terlalu pendek tidak menjadi bukti: batas bawah ukuran (byte). */
export const UKURAN_MIN_KREDIT = 40
export const POLA_KREDIT = /^(credits?|provenance|licen[cs]es?|notice)(\.|$)/i
/** Daftar sumber per-aset: menutup HANYA aset yang disebut namanya. */
export const POLA_SUMBER_ASET = /^asset[-_]sources?(\.|$)/i
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Nama berkas disebut utuh (bukan potongan nama lain): batas = awal/akhir teks atau karakter di luar [A-Za-z0-9_.-]. */
export const menyebutBerkas = (teks, nama) => new RegExp(`(^|[^A-Za-z0-9_.-])${escapeRe(nama)}($|[^A-Za-z0-9_.-])`).test(teks)
const LISENSI_DIKENAL = /(CC\s*BY(?:-SA)?\s*\d(?:\.\d)?|CC0|public\s+domain|MIT\b|Apache[- ]2|ODbL|BSD)/i

/** Baca metadata dari buffer GLB. Mengembalikan null bila bukan GLB valid (tanpa melempar). */
export function bacaMetaGlb(buf) {
  try {
    if (!buf || buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(16) !== 0x4e4f534a) return null
    const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
    const nodes = Array.isArray(json.nodes) ? json.nodes : []
    const berisi = (v) => typeof v === 'string' && v.trim() !== ''
    return {
      nodes: nodes.length,
      denganLisensi: nodes.filter((n) => berisi(n?.extras?.panacea_license)).length,
      denganSumber: nodes.filter((n) => berisi(n?.extras?.panacea_source)).length,
      hakCipta: berisi(json.asset?.copyright) ? String(json.asset.copyright) : '',
    }
  } catch { return null }
}

/** Klasifikasi satu aset dari fakta yang sudah dibaca. Murni. */
export function klasifikasiAset({ ekstensi, meta, adaBerkasKredit }) {
  if (ekstensi === 'glb' && meta) {
    if (meta.nodes > 0 && meta.denganLisensi === meta.nodes && meta.denganSumber === meta.nodes) return 'per-node'
    if (meta.hakCipta && LISENSI_DIKENAL.test(meta.hakCipta)) return 'hak-cipta-tertanam'
  }
  return adaBerkasKredit ? 'berkas-kredit' : 'tanpa-jejak'
}

function* telusuri(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* telusuri(p)
    else if (e.isFile()) yield p
  }
}

/** Inventaris seluruh aset biner di <akar>/public (kecuali ui-iterations: CSS/JS bukan aset media). */
export function inventaris(akar) {
  const publik = join(akar, 'public')
  const semua = [...telusuri(publik)]
  const sah = (p) => statSync(p).size >= UKURAN_MIN_KREDIT
  const kreditPerDir = new Set(semua.filter((p) => POLA_KREDIT.test(p.split(sep).pop()) && sah(p)).map((p) => dirname(p)))
  // Berkas yang boleh menutup aset lewat penyebutan nama: kredit (induk) dan ASSET_SOURCES (direktori yang sama atau induk). Akar public/ tidak pernah menutup turunannya.
  const penyebut = semua.filter((p) => dirname(p) !== publik && sah(p) && (POLA_KREDIT.test(p.split(sep).pop()) || POLA_SUMBER_ASET.test(p.split(sep).pop())))
    .map((p) => ({ dir: dirname(p), teks: readFileSync(p, 'utf8') }))
  const disebutLeluhur = (p) => penyebut.some((k) => (dirname(p) === k.dir || dirname(p).startsWith(k.dir + sep)) && menyebutBerkas(k.teks, p.split(sep).pop()))
  const hasil = []
  for (const p of semua) {
    const rel = relative(akar, p).split(sep).join('/')
    if (rel.startsWith('public/ui-iterations/')) continue
    const ekstensi = rel.split('.').pop().toLowerCase()
    if (!EKSTENSI_ASET.has(ekstensi)) continue
    const meta = ekstensi === 'glb' ? bacaMetaGlb(readFileSync(p)) : null
    hasil.push({ jalur: rel, ekstensi, kelas: klasifikasiAset({ ekstensi, meta, adaBerkasKredit: kreditPerDir.has(dirname(p)) || disebutLeluhur(p) }), ukuran: statSync(p).size })
  }
  return hasil.sort((a, b) => a.jalur.localeCompare(b.jalur))
}

export const ringkasKelas = (daftar) => daftar.reduce((a, x) => ((a[x.kelas] = (a[x.kelas] ?? 0) + 1), a), {})
