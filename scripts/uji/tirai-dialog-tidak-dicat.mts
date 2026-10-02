import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// TIRAI MODAL TIDAK BOLEH DICAT SEBAGAI PANEL.
//
// Di Panacea, `role="dialog"` dipasang pada elemen TIRAI yang menutup seluruh
// layar (`fixed inset-0 bg-black/60`), bukan pada kotak putih di dalamnya.
// Keenam dialog yang ada semuanya berpola begitu.
//
// Karena itu aturan penyeragaman apa pun yang menyasar `[role='dialog']`
// dengan `background: ... !important` tidak merapikan panel — ia mengecat
// SELURUH VIEWPORT. Yang terjadi di 390x844: latar gelap transparan berganti
// putih pekat, halaman di belakangnya tidak lagi teredup, bingkai dan bayangan
// digambar mengelilingi layar, dan modal tampak terpotong separuh dengan
// bidang putih kosong besar di bawahnya. Setiap modal di aplikasi kena.
//
// Kesalahannya tidak terlihat dari komponen mana pun: markupnya benar, dan
// `!important` membuatnya tidak dapat dilawan dari sisi komponen.
// ─────────────────────────────────────────────────────────────────────────────

const css = readFileSync(new URL('../../public/panacea-ruthless-simple-v50.css', import.meta.url), 'utf8')

/** Aturan yang menyasar dialog sekaligus memaksa latar belakang. */
const blokDialog = [...css.matchAll(/([^{}]*\[role='dialog'\][^{}]*)\{([^}]*)\}/g)]
assert.ok(blokDialog.length > 0, 'tidak ada aturan [role=dialog] terbaca — pembacaan CSS rusak')

for (const [, pemilih, isi] of blokDialog) {
  const memaksaLatar = /(^|[;{\s])background(-color)?\s*:[^;]*!important/.test(isi)
  if (!memaksaLatar) continue
  // Pemilih yang memaksa latar HARUS mengecualikan tirai layar-penuh.
  assert.match(
    pemilih,
    /:not\([^)]*inset-0[^)]*\)/,
    `aturan CSS ini memaksa latar belakang pada [role='dialog'] tanpa mengecualikan tirai layar-penuh, sehingga mengecat seluruh viewport dan menghapus peredupan di belakang setiap modal:\n  ${pemilih.trim()}`,
  )
}

/**
 * Sisi kedua kontrak.
 *
 * Tidak setiap `role="dialog"` adalah tirai: NotificationBell memasangnya pada
 * PANEL melayang yang memang pantas mendapat permukaan bersih. Yang dijaga di
 * sini hanya yang benar-benar tirai — dikenali dari latar peredupnya
 * (`bg-black/...`). Sebuah tirai wajib tetap membawa `inset-0`, karena itulah
 * satu-satunya penanda yang dipakai pengecualian CSS di atas; begitu ia
 * berhenti memakainya, seluruh viewport kembali dicat tanpa ada yang tahu.
 */
function berkasTsx(dir: URL, keluar: URL[] = []): URL[] {
  for (const nama of readdirSync(dir, { withFileTypes: true })) {
    const anak = new URL(nama.name + (nama.isDirectory() ? '/' : ''), dir)
    if (nama.isDirectory()) berkasTsx(anak, keluar)
    else if (nama.name.endsWith('.tsx')) keluar.push(anak)
  }
  return keluar
}

const src = new URL('../../src/', import.meta.url)
let tirai = 0
for (const berkas of berkasTsx(src)) {
  const t = readFileSync(berkas, 'utf8')
  if (!t.includes('role="dialog"')) continue
  // Ambil elemen pembawa role="dialog" beserta className-nya.
  for (const m of t.matchAll(/<div\b([^>]*role="dialog"[^>]*)>/g)) {
    const atribut = m[1]
    const kelas = atribut.match(/className="([^"]*)"/)
    if (!kelas) continue
    // Hanya yang membawa latar peredup yang dihitung sebagai tirai.
    if (!/\bbg-black\//.test(kelas[1])) continue
    assert.ok(
      kelas[1].includes('inset-0'),
      `tirai role="dialog" di ${berkas.pathname.split('/').pop()} membawa latar peredup tetapi tidak lagi memakai 'inset-0', sehingga aturan penyeragaman akan kembali mengecat seluruh viewport:\n  ${kelas[1].slice(0, 120)}`,
    )
    tirai++
  }
}

assert.ok(tirai >= 5, `hanya ${tirai} tirai dialog terperiksa — pemindaian komponen rusak dan uji ini kehilangan artinya`)

console.log(`tirai-dialog-tidak-dicat: ${blokDialog.length} aturan dialog diperiksa, ${tirai} tirai layar-penuh tetap tidak dicat`)
