import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Kartu Training menampilkan tanggal sesi terakhir dan berhenti di situ.
// "Tuesday 8 September" tidak bisa dibedakan dari dua keadaan yang berbeda
// jauh: belum berlatih sejak Selasa, atau sudah berlatih tetapi datanya belum
// sampai. Keduanya terlihat identik, dan yang kedua benar-benar terjadi —
// pemakainya berlari, membuka Panacea, melihat tanggal lama, lalu menyangka
// aplikasinya rusak.
//
// Sesi latihan hanya masuk lewat otomatisasi Workouts di Health Auto Export
// atau impor berkas. Kalau otomatisasi itu tidak pernah dibuat, tidak ada yang
// berangkat sama sekali — bukan gagal di tengah jalan, dan karena itu tidak ada
// galat apa pun untuk ditampilkan. Satu-satunya jalan keluar adalah menyebutkan
// apa yang diketahui.

const source = await readFile(new URL('../../src/components/KolomPelatih.tsx', import.meta.url), 'utf8')

// ── Pita itu harus ada, dan harus terpasang di kartu debrief ────────────────
assert.match(source, /function KesegaranData\(/, 'Pita kesegaran data harus ada.')
assert.match(source, /<KesegaranData jedaMs=\{jedaMs\} \/>/,
  'Pita harus terpasang di kartu rangkuman sesi, bukan hanya didefinisikan.')

// ── Ia harus membedakan "diterima" dari "dilakukan" ─────────────────────────
assert.match(source, /most recent session Panacea has <strong>received<\/strong>/,
  'Kalimatnya harus menyebut DITERIMA, karena itulah yang membedakan belum berlatih dari data belum sampai.')
assert.match(source, /the data has not arrived yet/,
  'Kemungkinan kedua harus disebut terang-terangan.')

// ── Harus menunjukkan tempat memeriksanya, bukan sekadar mengeluh ───────────
assert.match(source, /to="\/health-data"/,
  'Pita harus menautkan ke tempat sinkronisasi/impor bisa diperiksa.')

// ── Tidak boleh muncul pada jeda yang wajar ─────────────────────────────────
assert.match(source, /const AMBANG_BASI_MS = 48 \* 3600_000/,
  'Ambangnya harus eksplisit; hari istirahat biasa tidak boleh memicunya.')
assert.match(source, /if \(jedaMs === null \|\| jedaMs < AMBANG_BASI_MS\) return null/,
  'Di bawah ambang, dan ketika tidak ada sesi sama sekali, pita harus diam.')

// ── Bahasa antarmuka tetap Inggris ─────────────────────────────────────────
const blok = source.slice(source.indexOf('function KesegaranData('), source.indexOf('function SejakTerakhir('))
for (const kata of ['Terbaru', 'Belum', 'Periksa', 'sinkron']) {
  assert.ok(!blok.includes(kata), `String antarmuka harus bahasa Inggris; ditemukan "${kata}".`)
}

console.log('Training data freshness: pita terpasang, membedakan diterima dari dilakukan, menautkan jalan keluar, diam pada jeda wajar.')
