import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

// Setiap panel 3D harus punya BUKTI browser, bukan sekadar unit test.
//
// Pelajaran paling mahal dari pekerjaan Body Exposure: render 3D gagal dengan
// SUNYI. Enam kegagalan berbeda ditemukan dalam satu rangkaian kerja dan tidak
// satu pun melempar galat -- berkas terkompresi yang ditolak pemuat, aturan
// sanitasi nama yang berbeda antar versi three, ".l"/".r" yang runtuh jadi satu
// nama, nama yang tidak cocok dengan apa pun, kegagalan memuat tanpa callback,
// dan mesh berprimitive banyak yang dipecah loader.
//
// Semuanya lolos `tsc`, lolos build, dan lolos seluruh uji unit. Yang
// menangkapnya selalu pemeriksaan yang MEMBUKA halamannya dan menghitung apa
// yang benar-benar terikat.
//
// Jadi aturannya ditegakkan: sebuah panel 3D baru tidak bisa masuk tanpa
// membawa gerbang browsernya sendiri. Dan pasangannya dibuktikan lewat ATRIBUT
// KANVAS yang benar-benar dicari skripnya, bukan lewat kemiripan nama berkas --
// nama bisa cocok sementara skripnya memeriksa panel lain.

const AKAR_PANEL = new URL('../../src/pages/bodyhub/', import.meta.url).pathname
const AKAR_QA = new URL('../../scripts/qa/', import.meta.url).pathname

const berkasPanel = (await readdir(AKAR_PANEL)).filter((n) => /3D\.tsx$/.test(n))
assert.ok(berkasPanel.length >= 5, `Hanya ${berkasPanel.length} panel 3D ditemukan; pemindaiannya mungkin rusak`)

const berkasQa = (await readdir(AKAR_QA)).filter((n) => n.endsWith('.mjs'))
const isiQa = new Map<string, string>()
for (const n of berkasQa) isiQa.set(n, await readFile(AKAR_QA + n, 'utf8'))

const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))
const skrip: Record<string, string> = pkg.scripts ?? {}

// ── 1. Tiap panel menandai kanvasnya, dan tandanya unik ───────────────────
//
// Tanpa tanda, tidak ada cara memeriksa panel itu secara khusus di halaman
// yang memuat banyak kanvas. Tanda yang sama dipakai dua panel membuat
// gerbangnya memeriksa panel yang salah tanpa gejala.
const tandaPanel = new Map<string, string>()
for (const n of berkasPanel) {
  const isi = await readFile(AKAR_PANEL + n, 'utf8')
  const m = /dataset\.([a-zA-Z0-9]*3d)\b/.exec(isi)
  assert.ok(m, `${n} tidak menandai kanvasnya dengan dataset.<nama>3d`)
  const atribut = `data-${m[1].replace(/([A-Z])/g, (s) => `-${s.toLowerCase()}`)}`
  const pemilik = [...tandaPanel.entries()].find(([, a]) => a === atribut)
  assert.ok(!pemilik, `${n} memakai tanda kanvas "${atribut}" yang sudah dipakai ${pemilik?.[0]}`)
  tandaPanel.set(n, atribut)
}

// ── 2. Tanda itu harus benar-benar DICARI oleh sebuah skrip QA ────────────
//
// Inilah ikatan yang sebenarnya. Mencocokkan lewat nama berkas akan lolos
// ketika sebuah skrip bernama mirip tetapi memeriksa panel lain.
const gerbangPanel = new Map<string, string>()
for (const [panel, atribut] of tandaPanel) {
  // Dicocokkan sebagai TOKEN UTUH, bukan substring. "data-limfe3d" adalah
  // awalan dari "data-limfe3dX", jadi pencocokan substring akan menerima skrip
  // yang sebenarnya memeriksa panel lain -- persis kelalaian yang gerbang ini
  // ada untuk mencegah.
  const pola = new RegExp(`${atribut.replace(/[-]/g, '\\-')}(?![a-zA-Z0-9-])`)
  const cocok = [...isiQa.entries()].filter(([, isi]) => pola.test(isi))
  assert.ok(
    cocok.length > 0,
    `${panel} menandai kanvasnya "${atribut}" tetapi tidak ada skrip di scripts/qa/ yang mencarinya. ` +
    'Panel 3D lolos tsc, build dan seluruh uji unit sambil menggambar nol piksel.',
  )
  gerbangPanel.set(panel, cocok[0][0])
}

// ── 3. Skrip itu harus bisa DIJALANKAN lewat npm ──────────────────────────
//
// Skrip yang ada di folder tetapi tidak terdaftar tidak akan pernah dijalankan
// siapa pun, dan tidak berbeda dari tidak ada.
for (const [panel, skripQa] of gerbangPanel) {
  const terdaftar = Object.values(skrip).some((perintah) => perintah.includes(`scripts/qa/${skripQa}`))
  assert.ok(terdaftar, `${skripQa} (gerbang untuk ${panel}) tidak terdaftar di package.json scripts`)
}

// ── 4. Gerbangnya harus benar-benar MENGUKUR, bukan sekadar membuka ───────
//
// Sebuah skrip yang hanya memeriksa "kanvas ada" akan lulus pada panel yang
// benar-benar kosong: kanvasnya memang ada, hanya isinya tidak. Setiap gerbang
// harus menyentuh WebGL dan memeriksa lebar halaman di 390.
for (const [panel, skripQa] of gerbangPanel) {
  const isi = isiQa.get(skripQa) ?? ''
  assert.ok(/getContext\('webgl2'\)|getContext\("webgl2"\)/.test(isi),
    `${skripQa} (${panel}) tidak pernah memeriksa konteks WebGL`)
  assert.ok(isi.includes('390'), `${skripQa} (${panel}) tidak memeriksa lebar 390px`)
  assert.ok(/pageerror/.test(isi), `${skripQa} (${panel}) tidak mengumpulkan galat halaman`)
}

console.log(
  `Gerbang panel 3D: ${berkasPanel.length} panel di src/pages/bodyhub/ masing-masing menandai kanvasnya ` +
  'dengan tanda unik, tanda itu benar-benar dicari oleh skrip QA yang terdaftar di package.json, dan ' +
  'setiap gerbang memeriksa konteks WebGL, lebar 390px serta galat halaman.',
)
