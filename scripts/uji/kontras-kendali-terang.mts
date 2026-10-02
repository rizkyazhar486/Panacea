import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// LATAR YANG DIPAKSA HARUS MEMAKSA TINTANYA JUGA.
//
// Lapisan penyeragaman kendali mengecat setiap tombol di mode terang dengan
// gradien terang, memakai `!important` supaya menang atas gaya komponen.
// Warna teks pasangannya dulu ditulis TANPA `!important`.
//
// Akibatnya pasangan latar/teks dapat TERBELAH: latarnya dipaksa terang,
// sementara `text-white` dari komponen tetap menang atas warna teks. Yang
// tersisa di layar adalah tulisan putih di atas kartu putih — terbaca sebagai
// kartu kosong. Ini bukan kemungkinan teoretis: hasil pencarian global memang
// tampil begitu di mode terang, karena panelnya `bg-slate-900` sehingga isinya
// wajar memakai `text-white`.
//
// Aturan yang dijaga berkas ini berlaku umum: SETIAP aturan yang memaksa latar
// belakang sebuah kendali wajib memaksa `color`-nya dengan kekuatan yang sama.
// Memaksa satu sisi saja selalu dapat menghasilkan pasangan yang tak terbaca.
// ─────────────────────────────────────────────────────────────────────────────

const css = readFileSync(new URL('../../public/panacea-control-grading-v46.css', import.meta.url), 'utf8')

/** Semua blok aturan: pemilih + isinya. */
const blok = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
assert.ok(blok.length > 20, `hanya ${blok.length} blok CSS terbaca — pembacaan berkas rusak`)

const menyasarKendali = (pemilih: string) =>
  /\bbutton\b|input\[type='(button|submit|reset)'\]/.test(pemilih)

let diperiksa = 0
for (const [, pemilih, isi] of blok) {
  if (!menyasarKendali(pemilih)) continue

  const latarDipaksa = /(^|[;{\s])background(-color|-image)?\s*:[^;]*!important/.test(isi)
  if (!latarDipaksa) continue

  // Aturan yang memaksa latar tetapi tidak menyebut warna teks sama sekali
  // mewarisi tinta dari tempat lain; yang berbahaya hanya yang menyebut
  // `color` namun lemah, karena ia BERMAKSUD menetapkan tinta dan gagal.
  const adaColor = /(^|[;{\s])color\s*:/.test(isi)
  if (!adaColor) continue

  diperiksa++
  const colorDipaksa = /(^|[;{\s])color\s*:[^;]*!important/.test(isi)
  assert.ok(
    colorDipaksa,
    `aturan ini memaksa latar belakang kendali dengan !important tetapi menetapkan warna teksnya tanpa !important, sehingga utility seperti text-white masih menang dan menghasilkan teks tak terbaca di atas latar terang:\n  ${pemilih.trim().replace(/\s+/g, ' ').slice(0, 160)}`,
  )
}

assert.ok(
  diperiksa >= 2,
  `hanya ${diperiksa} aturan kendali berlatar-paksa yang terperiksa — pemindaian rusak dan uji ini kehilangan artinya`,
)

/* Cache-busting: mengubah isi berkas tanpa menaikkan penanda versinya berarti
   peramban yang sudah menyimpannya tetap memakai aturan lama, dan perbaikan
   kontras ini tidak pernah sampai ke pengguna yang justru paling terdampak. */
const index = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
assert.match(
  index,
  /panacea-control-grading-v46\.css\?v=20260919-1/,
  'penanda versi panacea-control-grading-v46.css belum dinaikkan, sehingga perbaikan kontras tidak akan sampai ke peramban yang sudah menyimpan versi lamanya',
)

console.log(`kontras-kendali-terang: ${diperiksa} aturan kendali berlatar-paksa memaksa tintanya juga`)
