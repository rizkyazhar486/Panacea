import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const halaman = await readFile(new URL('../../src/pages/GenomeLab.tsx', import.meta.url), 'utf8')
const mesin = await readFile(new URL('../../src/lib/replikasiDna.ts', import.meta.url), 'utf8')

// Halaman ini menyentuh penuaan, sel punca, dan penyuntingan genom sekaligus.
// Itu gabungan yang paling gampang berubah menjadi janji kesehatan kalau
// batasnya tidak dijaga secara eksplisit.

// ── 1. Batas ilmiah harus dinyatakan, dan harus di ATAS ─────────────────────
const iBatas = halaman.indexOf('What this is, and what it is not')
assert.ok(iBatas > 0, 'Halaman harus menyatakan batas ilmiahnya.')
const iReplikasi = halaman.indexOf('1 · DNA replication')
assert.ok(iBatas < iReplikasi,
  'Batasnya harus dibaca sebelum angkanya, bukan diletakkan di kaki halaman.')

for (const wajib of [
  'Nothing on this page is measured from you',
  'does not predict lifespan',
  'not a laboratory protocol',
  'not reviewed by a qualified human expert',
]) {
  assert.ok(halaman.includes(wajib), `Pernyataan batas hilang: "${wajib}"`)
}

// ── 2. Tidak boleh ada klaim personal ───────────────────────────────────────
//
// "Usia biologis Anda", "umur Anda", skor pribadi -- semuanya di luar batas
// untuk halaman mekanisme. Disebut dalam kalimat penyangkalan boleh; dipakai
// sebagai label keluaran tidak.
const label = halaman.match(/label="[^"]+"/g) ?? []
for (const l of label) {
  assert.doesNotMatch(l, /\byour\b|\bbiological age\b|\blifespan\b/i,
    `Label keluaran tidak boleh bersifat personal: ${l}`)
}

// ── 3. Angka harus turunan, bukan ditulis tangan di halaman ────────────────
//
// Kalau angka seperti batas Hayflick diketik langsung sebagai teks, ia akan
// diam-diam berbeda dari mesinnya begitu tetapannya berubah.
assert.match(halaman, /batasHayflick\(\)/, 'Batas Hayflick harus dihitung, bukan diketik.')
assert.match(halaman, /lamaFaseSDetik\(\)/, 'Lama fase S harus dihitung, bukan diketik.')
assert.match(halaman, /anggaranGalat\(\)/, 'Anggaran galat harus dihitung, bukan diketik.')
assert.doesNotMatch(halaman, />\s*50 divisions\s*</, 'Angka biologis tidak boleh ditanam sebagai teks.')

// ── 4. Antarmuka berbahasa Inggris ──────────────────────────────────────────
for (const indonesia of ['Panjang telomer', 'Pembelahan', 'Urutan DNA', 'Ambang']) {
  assert.ok(!halaman.includes(`>${indonesia}`), `String antarmuka harus bahasa Inggris: ${indonesia}`)
}

// ── 5. CRISPR: kemampuan alat tidak boleh dilebihkan ────────────────────────
//
// `rancangPanduan` hanya memeriksa kecocokan di dalam urutan yang diketik.
// Menyebutnya "aman" atau "spesifik" akan keliru dengan cara yang berbahaya.
assert.match(halaman, /not .{0,10}safe in a genome/i,
  'Halaman harus menyatakan bahwa spesifisitas di sini bukan penilaian genome-wide.')
assert.doesNotMatch(halaman, /\bsafe to edit\b|\bclinically validated\b|\bready for (use|therapy)\b/i,
  'Tidak boleh ada klaim kesiapan klinis untuk penyuntingan genom.')

// ── 6. Mesin: setiap tetapan membawa asal dan tingkat buktinya ──────────────
assert.match(mesin, /bukti: EvidenceLevel/, 'Tetapan harus membawa tingkat bukti.')
assert.match(mesin, /BUKAN protokol laboratorium/,
  'Mesin harus menyatakan bahwa ia menjelaskan mekanisme, bukan memberi langkah lab.')
assert.match(mesin, /bukan pengukuran pada seseorang/,
  'Mesin harus menyatakan bahwa tetapannya bukan pengukuran personal.')

// Pemisahan biakan vs in vivo harus tetap ada: menggabungkannya memberi 85
// pembelahan alih-alih ~50 yang dilaporkan.
assert.match(mesin, /atrisiInVivoLeukosit/,
  'Atrisi in vivo dan atrisi biakan harus tetap terpisah.')

console.log('Genome Lab: batas ilmiah dinyatakan lebih dulu, angka diturunkan dari mesin, dan klaim CRISPR dibatasi pada apa yang benar-benar diperiksa.')
