import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  durasiBacaMs,
  BACA_MIN_MS,
  BACA_MAKS_MS,
  KUTIPAN_HIDUP,
} from '../../src/lib/lifeQuotes.ts'

// ─────────────────────────────────────────────────────────────────────────────
// SPANDUK PENGINGAT HARIAN HARUS MENYINGKIR SENDIRI.
//
// Komentar di DailyQuoteBanner sudah lama berjanji spanduknya bertahan "sampai
// ditutup sendiri atau setelah waktu baca yang wajar". Paruh keduanya tidak
// pernah ditulis: tidak ada pengatur waktu sama sekali, jadi satu-satunya
// jalan keluar adalah menekan ×.
//
// Akibatnya terukur di peramban pada 390x844: kartunya menutupi 290 px, yaitu
// 34% layar pertama, di SETIAP halaman — Your Body, Clinical, beranda — dan
// judul halamannya sendiri hilang di baliknya sampai pemakainya menutupnya.
//
// Cacat seperti ini tidak pernah muncul sebagai galat. Ia hanya membuat setiap
// halaman terlihat berantakan pada bukaan pertama.
// ─────────────────────────────────────────────────────────────────────────────

// ── Durasi baca: monoton, berpagar, dan tidak pernah nol.
{
  const pendek = durasiBacaMs('Do. Or do not.')
  const sedang = durasiBacaMs('It does not matter how slowly you go as long as you do not stop.')
  const panjang = durasiBacaMs(
    Array.from({ length: 120 }, (_, i) => `kata${i}`).join(' '),
  )

  assert.ok(
    sedang >= pendek,
    `kutipan lebih panjang justru mendapat waktu baca lebih singkat (${sedang} < ${pendek})`,
  )
  assert.ok(
    panjang > sedang,
    `waktu baca tidak tumbuh mengikuti panjang teks (${panjang} tidak lebih dari ${sedang})`,
  )

  assert.equal(pendek, BACA_MIN_MS, `kutipan pendek mendapat ${pendek} ms, bukan lantai ${BACA_MIN_MS} ms`)
  assert.equal(panjang, BACA_MAKS_MS, `kutipan sangat panjang mendapat ${panjang} ms, melewati langit-langit`)

  // Tidak ada masukan yang boleh menghasilkan spanduk abadi atau spanduk yang
  // berkedip hilang sebelum sempat dibaca.
  for (const teks of ['', '   ', '\n\t']) {
    const ms = durasiBacaMs(teks)
    assert.ok(
      ms >= BACA_MIN_MS && ms <= BACA_MAKS_MS,
      `teks kosong menghasilkan ${ms} ms, di luar pagar`,
    )
  }

  // Seluruh kutipan yang benar-benar dipakai harus jatuh di dalam pagar.
  for (const k of KUTIPAN_HIDUP) {
    const ms = durasiBacaMs(`${k.quote} ${k.source}`)
    assert.ok(
      ms >= BACA_MIN_MS && ms <= BACA_MAKS_MS,
      `kutipan "${k.quote.slice(0, 40)}..." menghasilkan ${ms} ms, di luar pagar`,
    )
  }
}

// ── Komponennya harus BENAR-BENAR memasang pengatur waktu itu, dan menandai
// hari yang sama sudah dilihat — spanduk yang menyingkir tetapi tidak dicatat
// akan kembali pada muat halaman berikutnya di hari yang sama.
{
  const src = readFileSync(
    new URL('../../src/components/DailyQuoteBanner.tsx', import.meta.url),
    'utf8',
  )

  assert.match(
    src,
    /durasiBacaMs/,
    'DailyQuoteBanner tidak lagi memakai durasi baca — spanduknya kembali abadi sampai ditekan',
  )
  assert.match(
    src,
    /setTimeout\(\s*\(\)\s*=>\s*\{[^}]*setVisible\(false\)[^}]*tandaiSudahDilihat\(\)/s,
    'pengatur waktu tidak menyembunyikan spanduk sekaligus menandainya sudah dilihat',
  )
  assert.match(
    src,
    /return \(\) => clearTimeout\(t\)/,
    'pengatur waktu tidak dibersihkan saat komponennya dilepas',
  )

  // Ringkas: baris label dan bantalan besar yang mendorong kartunya melewati
  // sepertiga layar tidak boleh kembali.
  // Yang dicari adalah label yang BENAR-BENAR dirender, bukan penyebutannya
  // di komentar: mencocokkan teks mentah membuat penjelasan di kode ikut
  // dihitung sebagai cacat.
  assert.doesNotMatch(
    src,
    />\s*Today[’']s reminder/,
    'baris label kembali dirender — ia tidak menambah makna di atas kutipan dan ikut menaikkan tinggi kartunya',
  )
  assert.match(
    src,
    /WebkitLineClamp: 3/,
    'kutipan tidak lagi dibatasi tiga baris, sehingga kutipan panjang dapat menutupi setengah layar',
  )
}

console.log('pengingat-harian-menyingkir: spanduk kutipan menyingkir sendiri setelah waktu baca berpagar, dan tidak kembali di hari yang sama')
