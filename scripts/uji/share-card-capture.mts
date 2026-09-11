import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Tombol Share pernah tidak melakukan apa-apa sama sekali, dan laporannya
// berbunyi "tombolnya tidak berfungsi" — bukan "share gagal". Dua sebab yang
// harus tetap tertutup:
//
//   1. Tailwind v4 menulis warna tema sebagai oklch()/oklab(). html2canvas
//      1.4.1 lebih tua daripada fungsi warna itu dan melempar
//      'Attempting to parse an unsupported color function "oklab"' pada kartu
//      mana pun yang memakai warna tema. Terukur di peramban pada bundel
//      produksi: 186 aturan oklch dalam satu berkas CSS. Artinya tombol itu
//      tidak pernah bisa bekerja sejak Tailwind v4, bukan gagal sesekali.
//
//   2. Galatnya ditelan `catch {}` kosong, sehingga tidak ada berkas, tidak
//      ada pesan, dan tidak ada jejak di console. Kegagalan yang tidak
//      meninggalkan jejak tidak bisa dibedakan dari tombol mati.

const source = await readFile(new URL('../../src/components/ShareCardButton.tsx', import.meta.url), 'utf8')
const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
const deps = { ...pkg.dependencies, ...pkg.devDependencies }

// ── 1. Pustaka penangkap harus memahami fungsi warna modern ─────────────────
assert.match(source, /from 'html2canvas-pro'/,
  'Penangkapan kartu harus memakai html2canvas-pro; html2canvas 1.4.1 tidak bisa membaca oklch/oklab.')
assert.doesNotMatch(source, /from 'html2canvas'/,
  'html2canvas lama tidak boleh dipakai lagi.')
assert.ok(deps['html2canvas-pro'], 'html2canvas-pro harus terdaftar sebagai dependensi.')
assert.ok(!deps['html2canvas'],
  'html2canvas lama harus dilepas supaya tidak ada dua pustaka kanvas yang bersaing.')

// ── 2. Kegagalan harus meninggalkan jejak ───────────────────────────────────
assert.doesNotMatch(source, /\}\s*catch\s*\{\s*(\/\/[^\n]*\n\s*)*\}/,
  'catch kosong menyembunyikan kegagalan; tombol yang gagal harus bisa dibedakan dari tombol mati.')
assert.match(source, /catch \(e\)/, 'Galat harus ditangkap sebagai nilai, bukan dibuang.')
assert.match(source, /console\.error\('\[share\] capture failed', e\)/,
  'Galat harus tercatat supaya bisa didiagnosis.')

// ── 3. Kegagalan harus terlihat oleh pemakai, bukan hanya di console ────────
assert.match(source, /setGalat\(true\)/, 'Kegagalan harus mengubah keadaan tombol.')
assert.match(source, /setGalat\(false\)/, 'Percobaan baru harus menghapus keadaan gagal sebelumnya.')
assert.match(source, /Sharing failed — tap to try again/,
  'Tombol yang gagal harus mengatakannya, dan harus bisa dicoba lagi.')

// ── 4. Tetap tidak boleh menandai kartu yang hidup ──────────────────────────
assert.match(source, /stampWatermark/, 'Watermark hanya untuk gambar yang diekspor.')

console.log('Share card capture: pustaka warna-modern terpasang, catch kosong tertutup, kegagalan terlihat dan bisa diulang.')
