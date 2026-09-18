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
const lepas = blok("data-pmd-unclamped='true'")
// Keduanya disebut terpisah dengan sengaja: `line-clamp` saja juga cocok
// dengan `-webkit-line-clamp`, jadi menghapus salah satunya akan lolos.
for (const p of ['white-space:\\s*normal', 'display:\\s*revert', '-webkit-line-clamp:\\s*none', '\\n\\s*line-clamp:\\s*none']) {
  assert.ok(new RegExp(p).test(lepas),
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

console.log('prosa-tak-dipaksa-satu-baris: ok (prose wraps and clamps; grid/flex children may shrink)')
