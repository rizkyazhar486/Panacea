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
// hari yang sama sudah dilihat — kutipan yang tidak dicatat akan kembali pada
// muat halaman berikutnya di hari yang sama.
//
// PERUBAHAN 2026-11-16: pengatur waktu tidak lagi MENCABUT kartu. Masalah asalnya
// (kartu melayang menutupi 34% layar pertama di setiap halaman) sudah selesai
// dengan menaruh kartu di alur isi Beranda saja. Mencabutnya selagi tampil justru
// melompatkan Beranda 116 px ke atas sekitar 13 dtk setelah dibuka, dan jeda 500 ms
// sebelum muncul mendorongnya 116 px ke bawah ~1 dtk setelah dibuka (masing-masing
// CLS 0,127 terukur pada 390x844). Yang dikunci sekarang adalah HASILnya.
// Smoke peramban nyata: scripts/qa/daily-quote-shift-smoke.mjs.

/** Alasan-alasan sumber DailyQuoteBanner melanggar kontrak; kosong = patuh. */
export function pelanggaranSpanduk(src: string): string[] {
  const alasan: string[] = []
  if (!/durasiBacaMs/.test(src)) alasan.push('tidak memakai durasi baca')
  const timer = src.match(/setTimeout\(\s*\(\)\s*=>\s*\{([^}]*)\}\s*,\s*durasiBacaMs\(/s)
  if (!timer) alasan.push('pengatur waktu baca tidak ditemukan')
  else {
    if (!/tandaiSudahDilihat\(\)/.test(timer[1])) alasan.push('waktu baca tidak mencatat hari ini sudah dilihat')
    if (/setVisible\(false\)/.test(timer[1])) alasan.push('waktu baca mencabut kartu selagi tampil')
  }
  if (!/return \(\) => clearTimeout\(t\)/.test(src)) alasan.push('pengatur waktu tidak dibersihkan saat dilepas')
  if (!/useState\(belumDilihatHariIni\)/.test(src)) alasan.push('visibilitas tidak diputuskan pada render pertama')
  if (/setVisible\(true\)/.test(src)) alasan.push('kartu dimunculkan belakangan')
  if (!/function dismiss\(\)\s*\{[^}]*setVisible\(false\)[^}]*tandaiSudahDilihat\(\)/s.test(src)) alasan.push('× tidak menutup sekaligus mencatat')
  return alasan
}

{
  const src = readFileSync(
    new URL('../../src/components/dashboard/DailyQuoteBanner.tsx', import.meta.url),
    'utf8',
  )

  // Positif: sumber yang dikirim patuh.
  assert.deepEqual(pelanggaranSpanduk(src), [], 'DailyQuoteBanner melanggar kontrak kutipan harian')

  // Negatif berpasangan: tiap mutasi hanya berbeda pada satu aturan, dan aturan itulah yang menolaknya.
  const timerAsli = /setTimeout\(\(\) => \{\s*tandaiSudahDilihat\(\)\s*\}/
  assert.match(src, timerAsli, 'bentuk pengatur waktu baca berubah; perbarui mutasi uji ini')
  const mutasi: Array<[string, string, string]> = [
    ['timer mencabut kartu', src.replace(timerAsli, 'setTimeout(() => { setVisible(false); tandaiSudahDilihat() }'), 'waktu baca mencabut kartu selagi tampil'],
    ['timer tanpa pencatatan', src.replace(timerAsli, 'setTimeout(() => { void 0 }'), 'waktu baca tidak mencatat hari ini sudah dilihat'],
    ['jeda sebelum muncul', src.replace('useState(belumDilihatHariIni)', 'useState(false)'), 'visibilitas tidak diputuskan pada render pertama'],
    ['muncul belakangan', src.replace('const quote = kutipanHariIni()', 'const quote = kutipanHariIni()\n  useEffect(() => { const d = setTimeout(() => setVisible(true), 500); return () => clearTimeout(d) }, [])'), 'kartu dimunculkan belakangan'],
    ['timer tak dibersihkan', src.replaceAll('return () => clearTimeout(t)', 'return undefined'), 'pengatur waktu tidak dibersihkan saat dilepas'],
    ['tanpa durasi baca', src.replaceAll('durasiBacaMs', 'durasiTetapMs'), 'tidak memakai durasi baca'],
  ]
  for (const [nama, sumber, harap] of mutasi) {
    assert.notEqual(sumber, src, `mutasi "${nama}" tidak mengubah apa pun`)
    assert.ok(pelanggaranSpanduk(sumber).includes(harap), `mutasi "${nama}" lolos: ${JSON.stringify(pelanggaranSpanduk(sumber))}`)
  }

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

console.log('pengingat-harian-menyingkir: kutipan diputuskan pada render pertama, dicatat setelah waktu baca berpagar tanpa dicabut dari bawah jari, × menutup dan mencatat; 6 mutasi ditolak oleh aturannya masing-masing')
