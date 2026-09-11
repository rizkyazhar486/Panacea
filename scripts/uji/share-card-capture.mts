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

// ── 5. Gambar ekspor harus memakai huruf aplikasi, bukan serif bawaan ───────
//
// html2canvas-pro menyalin simpul kartu ke dokumen lain. Huruf aplikasi
// dipasang di `body { font-family: var(--font-sans) }`, sehingga klonnya
// kehilangan pewarisan itu dan peramban jatuh ke serif bawaan. Terlihat
// langsung pada gambar yang dibagikan pengguna: kartu Inter di layar keluar
// bergaya Times. Tumpukan huruf karena itu harus ditulis literal -- var() CSS
// pun tinggal di :root yang tidak ikut tersalin.
assert.match(source, /onclone:/, 'Klon penangkapan harus diberi gaya, bukan diserahkan ke bawaan peramban.')
assert.match(source, /'Inter'/, 'Huruf badan harus disebut literal di dalam gaya ekspor.')
assert.match(source, /'Oxanium'/, 'Judul ekspor memakai huruf hero aplikasi.')
assert.match(source, /'JetBrains Mono'/, 'Angka ekspor memakai huruf lebar-tetap supaya kolom metrik lurus.')
// Diperiksa pada blok gayanya, bukan pada seluruh berkas: kalimat penjelas di
// atas menyebut `var(--font-sans)` sebagai kutipan, dan pemeriksaan sekasar itu
// tidak bisa membedakan prosa dari CSS.
const blokGaya = source.slice(source.indexOf('const GAYA_EKSPOR'), source.indexOf('export function ShareCardButton'))
assert.doesNotMatch(blokGaya, /font-family:\s*var\(/,
  'var() CSS tidak tersedia di dokumen klon; tumpukan huruf harus literal.')
assert.match(blokGaya, /font-family: \$\{SANS\} !important/,
  'Badan kartu ekspor harus dipaksa ke tumpukan huruf aplikasi.')
assert.match(blokGaya, /font-family: \$\{HERO\} !important/, 'Judul ekspor memakai huruf hero.')
assert.match(blokGaya, /font-family: \$\{ANGKA\} !important/, 'Metrik ekspor memakai huruf lebar-tetap.')
assert.match(source, /document\.fonts\?\.ready/,
  'Potret harus menunggu huruf web termuat, kalau tidak klon dirender dengan huruf pengganti.')

// ── 6. Tombol share tidak boleh ikut tercetak di dalam gambarnya sendiri ────
//
// Simpul yang dipotret membungkus tombolnya, jadi cip share muncul di tengah
// kartu yang dibagikan. Ia dibuang dari klon, bukan disembunyikan di layar.
assert.match(source, /data-share-hide/, 'Tombol share harus ditandai supaya bisa dibuang dari klon.')
assert.match(source, /\[data-share-hide\]'\)\.forEach\(\(el\) => el\.remove\(\)\)/,
  'Elemen bertanda harus dibuang dari klon sebelum potret diambil.')

// ── 7. Watermark harus punya ruangnya sendiri ───────────────────────────────
//
// Stempel digambar di sudut kanan bawah kanvas. Tanpa pita khusus ia jatuh di
// atas baris teks terakhir -- terlihat pada laporan pengguna, "Panaceamed.id"
// menimpa kata "finishing".
assert.match(source, /PITA_WATERMARK/, 'Pita watermark harus dipesan secara eksplisit.')
assert.match(source, /padding-bottom: \$\{PITA_WATERMARK\}px/,
  'Pita itu harus benar-benar dipakai sebagai ruang bawah kartu ekspor.')

// ── 8. Kulit ekspor tidak boleh memaksakan warna latar ──────────────────────
//
// Versi pertama kulit ini memasang gradien gelap. Diuji di peramban, kartu
// keluar hitam-di-atas-hitam: halaman sedang bermode terang, warna teksnya
// tetap gelap, dan hanya latarnya yang diganti. Latar adalah milik kartu; yang
// boleh diatur di sini hanya huruf, aksen, dan pita watermark.
assert.doesNotMatch(blokGaya, /\.pmd-share-export \{[^}]*background:/,
  'Latar kartu ekspor harus tetap milik kartunya sendiri.')

console.log('Share card export: huruf aplikasi terpakai, tombol tidak ikut tercetak, watermark punya pita sendiri.')
