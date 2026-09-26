import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hasilDariTeksOcr } from '../../src/lib/ocrLembarLab.ts'
import { uraikanLembarLab } from '../../src/lib/imporLab.ts'

// Foto lembar hasil lab tidak boleh punya jalur kepercayaan sendiri yang
// berbeda dari tempel-teks: OCR hanya boleh menghasilkan teks, dan teks itu
// harus lewat parser deterministik yang sama sebelum jadi kandidat.

// 1. Teks kosong/spasi dari OCR gagal tertutup dengan alasan yang dapat dibaca,
//    tidak pernah dianggap "tidak ada hasil" secara diam-diam.
for (const kosong of ['', '   ', '\n\n']) {
  const h = hasilDariTeksOcr(kosong)
  assert.equal(h.ok, false, `teks OCR kosong ("${kosong}") diterima sebagai sah`)
  assert.ok(h.alasan && h.alasan.length > 5, 'kegagalan OCR tanpa alasan yang dapat dibaca')
}

// 2. Teks bersih dari OCR diteruskan apa adanya (dipangkas), lalu diuraikan
//    oleh parser yang SAMA dengan jalur tempel-teks (tidak ada duplikasi logika).
{
  const h = hasilDariTeksOcr('  HbA1c 6.1 %\nFasting glucose 98 mg/dL 70-100\n  ')
  assert.equal(h.ok, true)
  const k = uraikanLembarLab(h.teks)
  assert.equal(k.find((x) => x.jenisId === 'hba1c')?.nilai, 6.1, 'teks OCR bersih tidak sampai ke parser teks yang sama')
  assert.equal(k.find((x) => x.jenisId === 'gdp')?.nilai, 98, 'baris kedua dari OCR tidak terurai')
}

// 3. Teks bernoise khas OCR (spasi ganda, baris kosong sisipan) tetap terurai —
//    kerapuhan OCR pada spasi tidak boleh diam-diam menghilangkan hasil yang
//    sebenarnya ada di foto.
{
  const k = uraikanLembarLab('HbA1c   6,1  %\n\n\nApolipoprotein B  85 mg/dL  40-100')
  assert.equal(k.find((x) => x.jenisId === 'hba1c')?.nilai, 6.1)
  assert.equal(k.find((x) => x.jenisId === 'apob')?.nilai, 85)
}

// 4. UI: foto diproses on-device dan diuraikan lewat KANDIDAT yang sama —
//    tidak ada penyimpanan otomatis dari hasil OCR, dan input foto tidak pernah
//    diunggah ke server (tidak ada fetch/upload di sekitar berkas foto).
{
  const ui = readFileSync('src/components/ImporLembarLab.tsx', 'utf8')
  assert.match(ui, /data-ocr-photo-input/, 'input foto lembar lab hilang dari UI')
  assert.match(ui, /await import\('\.\.\/lib\/ocrLembarLab'\)/, 'modul OCR tidak lagi dimuat lambat (lazy) — akan membengkakkan bundel awal')
  assert.match(ui, /uraiTeks\(h\.teks\)/, 'hasil OCR tidak diuraikan lewat parser kandidat yang sama dengan tempel-teks')
  assert.doesNotMatch(ui, /fetch\(|XMLHttpRequest|\.upload\(/, 'foto lembar lab tampak diunggah, bukan diproses di perangkat')
  assert.match(ui, /never uploaded/, 'penjelasan privasi foto/teks di perangkat hilang dari UI')
}

// 5. Modul OCR sendiri tidak memuat mesin tesseract.js secara statis di level
//    modul (termasuk import bertipe) — hanya lewat impor dinamis di dalam
//    ambilWorker(), agar mengimpor modul ini saja tidak pernah memicu jaringan,
//    dan agar tidak ada spesifier statis 'tesseract.js' yang bisa membujuk
//    pemadat menariknya lebih awal daripada dipanggil.
{
  const modul = readFileSync('src/lib/ocrLembarLab.ts', 'utf8')
  assert.doesNotMatch(modul, /^import\s.*['"]tesseract\.js['"]/m, 'tesseract.js diimpor statis di level modul, bukan lambat (lazy)')
  assert.match(modul, /typeof import\('tesseract\.js'\)/, 'tipe worker tidak lagi diambil lewat impor tipe dinamis')
  assert.match(modul, /=\s*import\('tesseract\.js'\)/, 'pemuatan lambat mesin OCR hilang')
}

console.log('ocrLembarLab: foto lembar lab gagal tertutup pada teks kosong, teks OCR bersih/bernoise lewat parser tempel-teks yang sama, foto diproses di perangkat dan dimuat lambat')
