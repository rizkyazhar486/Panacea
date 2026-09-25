import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { judulRute, bersihkanJudul, JUDUL_CADANGAN } from '../../src/lib/judulRute.ts'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'

// ─────────────────────────────────────────────────────────────────────────────
// NAMA HALAMAN DI BILAH PERINTAH.
//
// Dua cacat yang saling menutupi, dan keduanya diukur di peramban pada 390px
// sebelum berkas ini ditulis:
//
//   1. Judulnya diambil dari katalog navigasi yang SUDAH disaring preferensi
//      pemakai. Entri Your Body dan Clinical disembunyikan di sana, jadi dua
//      super-page terpenting menampilkan "Panaceamed.id".
//   2. CSS mengunci lebar judul ke `clamp(3.8rem, 20vw, 6rem)` = 78px, padahal
//      ruang yang tersedia sekitar 170px. Apa pun judulnya terpotong.
//
// Bersama-sama keduanya menghasilkan "Panacea..." di tiga tujuan utama. Yang
// satu membuat nama halaman hilang; yang lain memastikan penggantinya pun
// tidak muat. Berkas ini menahan keduanya.
// ─────────────────────────────────────────────────────────────────────────────

const cocok = (n: { to: string; end?: boolean }, pathname: string) =>
  n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')

// ── Setiap super-page berutenya sendiri harus punya nama, bahkan ketika
// katalognya kosong sama sekali — itu keadaan persis yang menyebabkan cacatnya.
{
  for (const s of SUPER_PAGES) {
    const jalur = s.to.split('?')[0]
    if (jalur === '/') continue // For You adalah tab beranda, bukan rute sendiri
    const judul = judulRute(jalur, [], [], cocok)
    assert.equal(
      judul,
      s.label,
      `super-page ${jalur} bernama "${judul}", bukan "${s.label}" — pemakainya melihat nama merek alih-alih nama tempatnya`,
    )
    assert.notEqual(
      judul,
      JUDUL_CADANGAN,
      `super-page ${jalur} jatuh ke nama merek`,
    )
  }
}

// ── Beranda tetap beranda. Rute For You adalah '/?t=for-you', jadi
// mencocokkan lewat jalur saja akan menamai beranda "For You".
{
  const beranda = judulRute('/', [{ to: '/', label: 'Home', end: true }], [], cocok)
  assert.equal(beranda, 'Home', `beranda bernama "${beranda}" — registri super-page merebut rute '/'`)
}

// ── Rute yang DISEMBUNYIKAN pemakai tetap harus punya nama saat dibuka.
{
  const semua = [{ to: '/translator', label: 'Medical Translator' }]
  const judul = judulRute('/translator', [], semua, cocok)
  assert.equal(
    judul,
    'Medical Translator',
    `rute tersembunyi bernama "${judul}" — menyembunyikan entri menu tidak boleh ikut menghapus nama halamannya`,
  )
}

// ── Katalog yang terlihat menang atas katalog penuh, supaya label yang sedang
// dipakai pemakai tidak tertutup oleh duplikat lama.
{
  const judul = judulRute(
    '/gizi',
    [{ to: '/gizi', label: 'Nutrition Centre' }],
    [{ to: '/gizi', label: 'Old Nutrition Page' }],
    cocok,
  )
  assert.equal(judul, 'Nutrition Centre', `katalog terlihat kalah oleh katalog penuh: "${judul}"`)
}

// ── Rute tanpa entri di mana pun jatuh ke nama merek, bukan ke string kosong.
{
  assert.equal(judulRute('/entah-apa', [], [], cocok), JUDUL_CADANGAN)
}

// ── PEMBERSIHAN LABEL: hiasan menu bukan nama halaman.
{
  assert.equal(bersihkanJudul('🏃 Fitness Hub (all)'), 'Fitness Hub')
  assert.equal(bersihkanJudul('🩺 More clinical & AI tools'), 'More clinical & AI tools')
  assert.equal(bersihkanJudul('Nutrition Centre'), 'Nutrition Centre')

  // Yang TIDAK boleh rusak: kurung di tengah, tanda baca yang memang nama,
  // dan angka di depan.
  assert.equal(bersihkanJudul('A-a Gradient'), 'A-a Gradient')
  assert.equal(bersihkanJudul('Vitamin D (25-OH) panel'), 'Vitamin D (25-OH) panel')
  assert.equal(bersihkanJudul('NEWS2'), 'NEWS2')
  assert.equal(bersihkanJudul('Stories of the prophets'), 'Stories of the prophets')

  // Label yang seluruhnya hiasan tidak boleh menghasilkan judul kosong.
  assert.equal(bersihkanJudul('🏃'), '🏃')
  assert.notEqual(bersihkanJudul('🏃'), '')
}

// ── CSS: lebar judul tidak boleh dikunci lagi.
//
// Perbaikan TypeScript di atas tidak terlihat sama sekali kalau CSS-nya masih
// memotong judulnya di 78px, jadi keduanya harus dijaga bersama.
{
  for (const berkas of [
    'public/panacea-shell-mobile-compact-v49.css',
    'public/shell-mobile-compact-v49.css',
  ]) {
    const css = readFileSync(new URL(`../../${berkas}`, import.meta.url), 'utf8')
    const blokJudul = [...css.matchAll(/command-bar h1 \{([^}]*)\}/g)].map((m) => m[1])
    assert.ok(
      blokJudul.length >= 2,
      `${berkas}: aturan lebar judul bilah perintah hilang — tidak ada lagi yang dijaga di sini`,
    )
    for (const blok of blokJudul) {
      assert.doesNotMatch(
        blok,
        /max-width:\s*clamp\(/,
        `${berkas}: judul bilah perintah dikunci lebar tetap lagi — nama halaman akan terpotong walau ruangnya ada`,
      )
      assert.match(
        blok,
        /max-width:\s*none/,
        `${berkas}: judul bilah perintah tidak lagi dibebaskan lebarnya secara eksplisit`,
      )
    }
  }
}

console.log('judul-bilah-perintah: setiap super-page bernama sendiri, rute tersembunyi tetap bernama, dan lebar judul tidak dikunci lagi')
