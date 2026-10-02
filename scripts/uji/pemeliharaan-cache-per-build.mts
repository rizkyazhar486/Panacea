import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// PEMBERSIHAN CACHE HARUS BERJALAN SEKALI PER BUILD, BUKAN SEKALI SEUMUR
// KONSTANTA YANG DISUNTING TANGAN.
//
// index.html menyimpan penanda di localStorage dan melewati pemeliharaan bila
// penandanya cocok. Selama penanda itu hanya `MAINTENANCE_VERSION`, sebuah
// konstanta yang berubah hanya kalau seseorang ingat menaikkannya, gerbangnya
// menutup selamanya setelah sekali jalan: rilis berikutnya tidak pernah
// memicu pembersihan lagi.
//
// Kegagalan seperti itu TIDAK BERSUARA. Build terkirim, CI hijau, deploy
// sukses — dan pengguna yang sudah pernah membuka aplikasi tetap melihat yang
// lama, tanpa satu pun sinyal yang memberi tahu. Mekanisme rilis tidak boleh
// bergantung pada ingatan manusia.
//
// Nama bundel modul memuat hash isi, jadi ia berubah sendiri setiap kali kode
// berubah. Berkas ini menahan agar penanda tetap mengandungnya.
// ─────────────────────────────────────────────────────────────────────────────

const index = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

assert.match(
  index,
  /const MAINTENANCE_KEY = 'pmd-cache-maintenance-version'/,
  'kunci pemeliharaan cache hilang dari index.html',
)

/** Penanda harus dihitung dari bundel yang benar-benar dimuat. */
assert.match(
  index,
  /script\[type="module"\]\[src\]/,
  'penanda pemeliharaan tidak lagi membaca bundel modul, sehingga ia kembali bergantung pada konstanta yang disunting tangan',
)
assert.match(
  index,
  /const maintenanceStamp = \(\) => \{/,
  'fungsi penanda pemeliharaan per-build hilang',
)
assert.match(
  index,
  /return MAINTENANCE_VERSION \+ '\|' \+ bundel/,
  'penanda pemeliharaan tidak lagi menggabungkan versi dengan identitas bundel',
)

/**
 * Yang DISIMPAN dan yang DIBANDINGKAN harus sama-sama penanda per-build.
 * Menyimpan penanda tetapi membandingkan konstanta akan membuat pemeliharaan
 * berjalan pada setiap muat halaman; sebaliknya membuatnya tidak pernah jalan.
 */
assert.match(
  index,
  /localStorage\.setItem\(MAINTENANCE_KEY, maintenanceStamp\(\)\)/,
  'penanda yang disimpan bukan penanda per-build',
)
assert.match(
  index,
  /localStorage\.getItem\(MAINTENANCE_KEY\) === maintenanceStamp\(\)/,
  'perbandingan penanda bukan terhadap penanda per-build',
)
assert.doesNotMatch(
  index,
  /localStorage\.getItem\(MAINTENANCE_KEY\) === MAINTENANCE_VERSION/,
  'perbandingan lama terhadap konstanta yang disunting tangan muncul kembali',
)

/**
 * Pembacaannya harus DITUNDA. Tag skrip modul belum tentu ada di DOM saat
 * skrip sebaris ini dijalankan, sehingga membaca penanda seketika akan
 * menghasilkan bundel kosong dan menyamakan semua build.
 */
const posPeriksa = index.indexOf('const periksaPemeliharaan')
const posIdle = index.indexOf('requestIdleCallback', posPeriksa)
assert.ok(posPeriksa > 0, 'pemeriksaan pemeliharaan yang ditunda hilang')
assert.ok(
  posIdle > posPeriksa,
  'pemeriksaan pemeliharaan tidak lagi dijadwalkan setelah DOM terurai, sehingga identitas bundel terbaca kosong',
)

/** Service worker di repo ini sengaja tidak mencegat fetch; jangan berubah diam-diam. */
const sw = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')
assert.doesNotMatch(
  sw,
  /addEventListener\(\s*'fetch'/,
  'service worker mulai mencegat fetch — itu justru kelas kegagalan basi yang catatan di berkas itu sendiri jelaskan dihindari',
)

console.log('pemeliharaan-cache-per-build: penanda pemeliharaan terikat ke bundel ber-hash dan dibaca setelah DOM terurai')
