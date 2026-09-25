import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// `.dark .bg-white` memetakan latar putih ke #17191c. Untuk tombol yang
// sengaja putih dengan teks hitam, hasilnya hitam di atas hitam: tombol
// "Ask →" di Clinical terukur nyaris lenyap. Pasangan itu harus tetap putih,
// dan aturannya harus lebih spesifik daripada pemetaan umumnya.
const css = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
const umum = css.indexOf('.dark .bg-white { background-color: #17191c')
const kecuali = css.search(/\.dark \.bg-white:is\([^)]*\.text-black[^)]*\.text-ink[^)]*\)\s*\{\s*background-color:\s*#fff !important/)
assert.ok(umum >= 0, 'pemetaan .dark .bg-white hilang — asumsi berkas ini tidak berlaku lagi')
assert.ok(kecuali > 0, 'pengecualian tombol putih+teks gelap hilang — CTA kembali hitam di atas hitam dalam permukaan gelap')
assert.ok(kecuali > umum, 'pengecualian ditulis sebelum pemetaan umum; urutannya harus sesudah')
console.log('tombol-putih-tetap-terbaca: tombol putih bertulisan gelap tetap putih di dalam permukaan gelap')
