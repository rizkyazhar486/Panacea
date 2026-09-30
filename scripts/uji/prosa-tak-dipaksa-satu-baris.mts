import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// SATU BARIS TEKS BISA MERUSAK SELURUH TATA LETAK PONSEL.
//
// v43 memasang `white-space: nowrap` pada SETIAP p/li/dd/figcaption di dalam
// main. Niatnya masuk akal: permukaan utama tetap visual, prosa panjang pindah
// ke balik konteks. Tetapi nowrap melakukan hal kedua yang tidak disengaja —
// lebar min-content sebuah paragraf menjadi selebar SELURUH kalimat, dan anak
// grid/flex bawaannya `min-width: auto`. Kolomnya ikut melar melewati layar.
//
// Terukur di 390x844 sebelum perbaikan: /med-study punya 11 anak grid yang
// lebih lebar dari induknya (kartu 486px di dalam kolom 325px) dan 6 paragraf
// terpotong mendatar; /longevity 4 dan 7; /health-data 0 dan 7.
//
// Sesudahnya, kelimanya nol — dan prosanya tetap pendek, dipotong pada tiga
// baris, bukan pada satu.
// ─────────────────────────────────────────────────────────────────────────────

const css = readFileSync(new URL('../../public/panacea-visual-first-v43.css', import.meta.url), 'utf8')
// Komentar dibuang: pemeriksaan di bawah membaca SELEKTOR, dan prosa yang
// menjelaskan sebuah larangan pernah tertangkap sebagai pelanggarannya.
const cssKode = css.replace(/\/\*[\s\S]*?\*\//g, '')
/** Setiap blok aturan sebagai pasangan [selektor, isi]. */
const aturan = [...cssKode.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const)

/** Blok aturan yang selektornya memuat `sepotong`. */
function blok(sepotong: string): string {
  const i = css.indexOf(sepotong)
  assert.notEqual(i, -1, `the rule for ${sepotong} disappeared from the v43 layer`)
  const buka = css.indexOf('{', i)
  const tutup = css.indexOf('}', buka)
  return css.slice(buka, tutup)
}

// ── 1. Prosa tidak boleh dipaksa satu baris ──────────────────────────────
const prosa = blok("main :where(p,li,dd,figcaption)")
assert.ok(!/white-space:\s*nowrap/.test(prosa),
  'prose inside main is forced onto a single line again. That truncates every sentence after a few words AND ' +
  'raises the min-content width of every grid/flex column that contains it, which is what pushed cards off ' +
  'the screen at 390px.')
assert.ok(/white-space:\s*normal/.test(prosa),
  'prose no longer resets white-space, so it inherits nowrap from the heading/control rule above it ' +
  'whenever a card is itself a button or a link')
assert.ok(/line-clamp:\s*\d+/.test(prosa),
  'the line clamp is gone; v43 wanted short text on the main surface, and clamping lines is how that is kept ' +
  'without inflating layout')

// ── 2. Anak grid/flex harus boleh menyusut ───────────────────────────────
assert.ok(/main :where\(\[class\*='grid'\], \[class\*='flex'\]\) > \* \{[^}]*min-width:\s*0/.test(css),
  'the min-width:0 rule for grid/flex children in main is gone. Without it a single nowrap heading or button ' +
  'inside a card still stretches its whole column past the viewport.')

// ── 3. Permukaan detail harus benar-benar lepas dari pemotongan ──────────
//
// Pelepasannya kini dua aturan, dan pemisahan itu bukan gaya penulisan.
// `white-space` dan `text-overflow` boleh berlaku luas sampai span dan div;
// `display` tidak boleh, dan blok kedua di bawah menjaganya.
const lepasTeks = blok("data-pmd-unclamped='true'")
// Aturan yang benar-benar melepas pemotongan dicari menurut ISINYA, bukan
// menurut teks selektor yang persis. Versi pertama mencocokkan selektor kata
// demi kata, jadi begitu selektornya berubah pemeriksa ini patah lebih dulu —
// dan sabotase yang seharusnya ditangkap penjaga span/div justru gagal dengan
// pesan yang salah.
const aturanRevert = aturan.filter(([, isi]) => /display:\s*revert/.test(isi))
assert.ok(aturanRevert.length > 0,
  'nothing resets display any more, so dialogs and detail surfaces stay clamped at three lines')
const isiRevert = aturanRevert.map(([, isi]) => isi).join('\n')
for (const [p, teks] of [
  ['white-space:\\s*normal', lepasTeks],
  ['-webkit-line-clamp:\\s*none', isiRevert],
  ['\\n\\s*line-clamp:\\s*none', isiRevert],
] as const) {
  assert.ok(new RegExp(p).test(teks),
    `the opt-out for dialogs and detail surfaces no longer resets ${p.replace(/\\[ns]|\\s\*/g, '').split(':')[0]}, ` +
    'so those surfaces stay clipped')
}

// ── 4. Judul dan kendali tetap satu baris, tetapi tidak menular ──────────
const judul = blok("main :where(h1,h2,h3,h4,h5,h6)")
assert.ok(/white-space:\s*nowrap/.test(judul),
  'headings and controls no longer stay on one line; that part of v43 is deliberate and should not be lost')
assert.ok(/min-width:\s*0/.test(judul),
  'headings and controls can stretch their own column again: without min-width:0 their nowrap text sets the ' +
  "column's minimum width")


// ── 6. `display: revert` TIDAK BOLEH menyentuh span atau div ─────────────
//
// Ini bukan kerapian, ini cacat yang pernah hidup di produksi. Aturan pertama
// menyertakan `span,div` bersama prosa, dan `display: revert` mengembalikan
// sebuah div ke `block` bawaan peramban — sehingga setiap `display:flex` dan
// `display:grid` milik kelas Tailwind di dalam permukaan yang memilih keluar
// ikut hilang.
//
// Terukur di 390x844 pada /body-explorer: baris 40 tab yang seharusnya satu
// jalur bergulir mendatar berubah menjadi `display:block` dengan anak
// `inline-block`, membungkus menjadi 18 baris setinggi 800 piksel pada layar
// setinggi 844 piksel. Halamannya tidak rusak menurut TypeScript, tidak rusak
// menurut gerbang mana pun, dan tetap tampak "hanya panjang".
for (const [selektor] of aturanRevert) {
  assert.ok(!/\bspan\b|\bdiv\b/.test(selektor),
    'display: revert is applied to span or div again. That resets a div to the browser default `block`, so every ' +
    'Tailwind flex/grid layout inside an opted-out surface collapses — the Body Explorer tab rail became an ' +
    '800px wall of 18 rows the last time this shipped. Only p/li/dd/figcaption/.pmd-vf-copy are ever clamped, ' +
    `so only they need reverting. Offending selector: ${selektor.trim().slice(0, 90)}`)
}

console.log('prosa-tak-dipaksa-satu-baris: ok (prose wraps and clamps; grid/flex children may shrink)')
