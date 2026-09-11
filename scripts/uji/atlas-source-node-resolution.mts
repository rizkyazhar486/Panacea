import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'

// Apakah setiap simpul atlas benar-benar menemukan geometrinya?
//
// Manifes atlas mengikat organ ke berkas GLB lewat `nodeHints`, yaitu potongan
// nama yang harus cocok dengan nama simpul di dalam berkas itu. Tidak ada yang
// pernah memeriksa kecocokan itu. Akibatnya sebuah organ bisa berstatus
// 'shipped' di gerbang cakupan, dihitung sebagai selesai, dan tetap tidak
// pernah tampil -- karena petunjuknya tidak cocok dengan satu simpul pun.
//
// Dua contoh yang ditemukan justru begitu:
//
//   * endo:pituitary menunjuk 'pituitary'. Berkasnya menamainya 'hypophysis'.
//   * Akar sistem limfatik menunjuk 'lymph node'. Berkasnya memakai '... nodes'.
//
// Keduanya terhitung selesai selama ini. Uji ini membaca chunk JSON GLB-nya
// langsung, jadi yang dibandingkan adalah berkas yang benar-benar dikirim.

async function namaSimpulGlb(path: string): Promise<string[] | null> {
  let buf: Buffer
  try { buf = await readFile(path) } catch { return null }
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return null
  const panjang = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return null
  const json = JSON.parse(buf.subarray(20, 20 + panjang).toString('utf8')) as { nodes?: Array<{ name?: string }> }
  return (json.nodes ?? []).map((n) => n.name).filter((n): n is string => Boolean(n))
}

// Tidak ada utang yang tersisa.
//
// Daftar ini semula memuat empat belas simpul pernapasan yang tidak menemukan
// geometrinya. Semuanya ternyata salah nama, bukan tidak punya mesh: berkasnya
// memakai Terminologia Anatomica ("Superior lobe of right lung", "Anterior
// segmental bronchus of right lung (BIII)") sementara petunjuknya ditulis
// dalam bahasa klinis ("upper lobe of right lung", "... of right upper lobe").
//
// Sengaja dibiarkan kosong dan tetap diperiksa: begitu ada simpul baru yang
// tidak resolve, uji ini gagal, dan tidak ada tempat untuk menyembunyikannya.
const UTANG_DIKETAHUI = new Set<string>([])

const cache = new Map<string, string[] | null>()
async function isi(berkas: string): Promise<string[] | null> {
  if (!cache.has(berkas)) cache.set(berkas, await namaSimpulGlb(`public/anatomy/${berkas}`))
  return cache.get(berkas) ?? null
}

const tidakResolve: string[] = []
let diperiksa = 0

for (const simpul of COMPLETE_WHOLE_BODY_ATLAS.nodes) {
  const berkas = simpul.source?.files
  const petunjuk = simpul.source?.nodeHints
  if (!berkas?.length || !petunjuk?.length) continue

  const semua: string[] = []
  let adaBerkas = false
  for (const f of berkas) {
    const v = await isi(f)
    if (v) { adaBerkas = true; semua.push(...v) }
  }
  // Berkas yang tidak ada di repositori ini bukan urusan uji ini.
  if (!adaBerkas) continue
  diperiksa++

  const cocok = (h: string) => semua.some((n) => n.toLowerCase().includes(h.toLowerCase()))

  // Mode menentukan artinya. 'specific-fallback' adalah daftar berurut: cukup
  // satu yang cocok. 'composite' memang menuntut seluruh komponennya, tetapi
  // yang diuji di sini hanya kegagalan total, supaya satu komponen yang hilang
  // tidak langsung memerahkan seluruh berkas.
  const resolve = simpul.source.mode === 'composite'
    ? petunjuk.some(cocok)
    : petunjuk.some(cocok)
  if (!resolve) tidakResolve.push(simpul.id)
}

assert.ok(diperiksa > 60, `Terlalu sedikit simpul bersumber yang diperiksa (${diperiksa}); berkas GLB mungkin tidak terbaca.`)

const baru = tidakResolve.filter((id) => !UTANG_DIKETAHUI.has(id))
assert.deepEqual(baru, [],
  `Simpul atlas berikut tidak menemukan satu pun geometri yang cocok:\n  ${baru.join('\n  ')}`)

// Utang yang sudah diperbaiki harus dikeluarkan dari daftar, supaya daftarnya
// tidak menjadi tempat sampah yang tumbuh selamanya.
const sudahBeres = [...UTANG_DIKETAHUI].filter((id) => !tidakResolve.includes(id))
assert.deepEqual(sudahBeres, [],
  `Sudah resolve dan harus dihapus dari UTANG_DIKETAHUI:\n  ${sudahBeres.join('\n  ')}`)

console.log(`Resolusi simpul sumber: ${diperiksa} simpul bersumber diperiksa, ${tidakResolve.length} utang yang sudah didaftarkan, 0 kegagalan baru.`)
