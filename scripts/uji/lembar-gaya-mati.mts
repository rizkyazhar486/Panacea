import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import postcss from 'postcss'

// ─────────────────────────────────────────────────────────────────────────────
// LEMBAR GAYA YANG TERTAUT HARUS MASIH MENYENTUH SESUATU.
//
// index.html pernah menautkan 27 lapisan CSS bertumpuk (v3 → v50). Cakupan CSS
// Chromium diukur di 21 rute × 2 tema × 2 lebar layar: sebelas lapisan tidak
// memakai satu aturan pun. Semuanya menyasar `.panacea-home`, kelas milik
// halaman Beranda lama yang tidak lagi punya rute sejak Home disusun ulang.
// Tiga di antaranya tampak "terpakai" hanya karena mendefinisikan variabel di
// `:root` — variabel yang dibaca oleh aturannya sendiri yang juga mati.
//
// Lapisan mati bukan hanya bobot unduhan. Setiap lapisan membawa puluhan
// `!important`; begitu ada yang menghidupkan lagi satu kelas lamanya, aturan
// lama itu menang diam-diam atas sistem desain yang sekarang. Gerbang ini
// menolak lembar gaya tertaut yang tidak dapat menyentuh apa pun yang benar-
// benar dimuat aplikasi.
//
// "Dimuat" diukur dari graf impor yang berawal di src/main.tsx, bukan dari
// seluruh folder src: berkas yatim seperti src/pages/Beranda.tsx masih ada di
// repo dan masih memakai kelas-kelas lama itu, tetapi tidak pernah dirender.
// ─────────────────────────────────────────────────────────────────────────────

const AKAR = resolve(dirname(new URL(import.meta.url).pathname), '..', '..')
const baca = (p: string) => readFileSync(resolve(AKAR, p), 'utf8')

// ── 1. Graf impor dari titik masuk. ─────────────────────────────────────────
const EKSTENSI = ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx', '/index.js']

function selesaikan(dari: string, spes: string): string | null {
  if (!spes.startsWith('.')) return null
  const dasar = resolve(dirname(dari), spes)
  for (const e of EKSTENSI) {
    const p = dasar + e
    if (existsSync(p) && statSync(p).isFile()) return p
  }
  return null
}

const POLA_IMPOR = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

export function modulTerjangkau(masuk: string): Set<string> {
  const terlihat = new Set<string>()
  const antre = [resolve(AKAR, masuk)]
  while (antre.length) {
    const f = antre.pop()!
    if (terlihat.has(f)) continue
    terlihat.add(f)
    if (!/\.(tsx?|m?js)$/.test(f)) continue
    const isi = readFileSync(f, 'utf8')
    for (const m of isi.matchAll(POLA_IMPOR)) {
      const r = selesaikan(f, m[1] ?? m[2] ?? m[3])
      if (r && !terlihat.has(r)) antre.push(r)
    }
  }
  return terlihat
}

// ── 2. Teks yang benar-benar dapat memberi kelas pada DOM. ──────────────────
const html = baca('index.html')
const skripPublik = [...html.matchAll(/<script[^>]+src="\/([^"?]+\.js)/g)].map((m) => m[1])
const lembarTertaut = [...html.matchAll(/<link rel="stylesheet" href="\/([^"?]+\.css)/g)].map((m) => m[1])

const terjangkau = modulTerjangkau('src/main.tsx')
const teksHidup = [
  html,
  ...skripPublik.map((s) => baca(`public/${s}`)),
  ...[...terjangkau].filter((f) => /\.(tsx?|m?js)$/.test(f)).map((f) => readFileSync(f, 'utf8')),
].join('\n')

// Kelas pada sebuah selektor, tanpa isi pseudo-fungsional: `:not(.x)` tetap
// hidup walau .x tidak ada, dan `:is(.a, .b)` cukup satu yang hidup — jadi
// isinya tidak dipakai untuk menyatakan selektor mati. Ini sengaja konservatif.
function kelasWajib(selektor: string): string[] {
  let s = selektor
  for (let i = 0; i < 6 && /\([^()]*\)/.test(s); i++) s = s.replace(/\([^()]*\)/g, '')
  return [...s.matchAll(/\.(-?[_a-zA-Z](?:[\w-]|\\.)*)/g)].map((m) => m[1].replace(/\\(.)/g, '$1'))
}

const kelasHidup = (k: string) => teksHidup.includes(k)

export interface NilaiLembar {
  berkas: string
  deklarasiHidup: number
  selektorMati: number
  selektor: number
}

export function nilaiLembar(berkas: string, css: string, varDipakaiDiLuar: (nama: string) => boolean): NilaiLembar {
  const akar = postcss.parse(css)
  let deklarasiHidup = 0
  let selektor = 0
  let selektorMati = 0
  akar.walkRules((r) => {
    if (r.parent?.type === 'atrule' && /keyframes/i.test((r.parent as postcss.AtRule).name)) return
    const hidup = r.selectors.filter((s) => kelasWajib(s).every(kelasHidup))
    selektor += r.selectors.length
    selektorMati += r.selectors.length - hidup.length
    if (!hidup.length) return
    r.walkDecls((d) => {
      // Variabel kustom hanya berarti bila ada pembacanya di luar berkas ini.
      if (d.prop.startsWith('--') && !varDipakaiDiLuar(d.prop)) return
      deklarasiHidup++
    })
  })
  return { berkas, deklarasiHidup, selektorMati, selektor }
}

const semuaCss = lembarTertaut.map((f) => ({ f, css: baca(`public/${f}`) }))
const hasil = semuaCss.map(({ f, css }) => {
  const lainnya = teksHidup + '\n' + semuaCss.filter((x) => x.f !== f).map((x) => x.css).join('\n')
  return nilaiLembar(f, css, (nama) => lainnya.includes(`var(${nama}`))
})

// ── 3. Pemeriksaan-diri: pengukurnya harus mampu melihat lapisan mati. ──────
// Tanpa ini gerbang bisa lulus hanya karena pengukurnya buta.
{
  const mati = nilaiLembar('uji-mati.css', '.kelas-yang-tidak-pernah-dirender .x { color: red !important } :root { --uji-var-yatim: 1px }', () => false)
  assert.equal(mati.deklarasiHidup, 0, 'pengukur gagal mengenali lapisan yang seluruhnya menyasar kelas tak terender')
  const hidup = nilaiLembar('uji-hidup.css', 'body { margin: 0 } .x:not(.kelas-yang-tidak-pernah-dirender) { color: red }', () => false)
  assert.ok(hidup.deklarasiHidup >= 1, 'pengukur salah menyatakan aturan elemen/`:not()` sebagai mati')
  assert.ok(terjangkau.has(resolve(AKAR, 'src/pages/Home.tsx')), 'graf impor tidak mencapai Home — pola impor dinamis tidak lagi terbaca')
}

assert.ok(lembarTertaut.length > 0, 'index.html tidak lagi menautkan lembar gaya apa pun — pola pencariannya perlu diperbarui')

const mati = hasil.filter((h) => h.deklarasiHidup === 0)
assert.equal(
  mati.length,
  0,
  `lembar gaya tertaut yang tidak dapat menyentuh apa pun yang dirender: ${mati.map((m) => m.berkas).join(', ')}. ` +
    'Setiap selektornya membutuhkan kelas yang tidak ada di modul mana pun yang dapat dicapai dari src/main.tsx. ' +
    'Lepaskan tautannya dan hapus berkasnya, alih-alih menambah lapisan baru di atasnya.',
)

// Lapisan yang pernah dilepas tidak boleh kembali tertaut.
const PENSIUN = [
  'home-widget-v3.css', 'home-widget-hd-v9.css', 'home-widget-hd-v10.css', 'home-widget-clean-v11.css',
  'home-theme-v18.css', 'home-visual-v25.css', 'home-comfort-v26.css', 'home-contrast-v27.css',
  'home-widget-dark-v31.css', 'home-cosmic-command-v35.css', 'home-readability-v36.css',
]
for (const p of PENSIUN) {
  assert.ok(!lembarTertaut.includes(p), `${p} tertaut lagi — lapisan ini dilepas karena hanya menyasar Beranda lama yang tak berute`)
  assert.ok(!existsSync(resolve(AKAR, 'public', p)), `${p} muncul lagi di public/ — berkas lapisan mati yang tersedia akan ditautkan ulang`)
}

console.log(
  `lembar-gaya-mati: ${lembarTertaut.length} lembar tertaut, semuanya menyentuh modul yang dirender; ` +
    `${PENSIUN.length} lapisan Beranda lama tetap pensiun`,
)
