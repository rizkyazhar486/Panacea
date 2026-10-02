import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { YANG_BELUM_DIMILIKI_PANACEA, KALOLUMEN } from '../../src/lib/rujukanKaloLumen.ts'

// ─────────────────────────────────────────────────────────────────────────────
// SATU HALAMAN TIDAK BOLEH MEMBANTAH DIRINYA SENDIRI.
//
// Panel pencitraan volumetrik di Body Exposure memuat dua blok yang saling
// bertentangan. Yang satu berbunyi "Panacea can also read an actual DICOM
// study" dan menautkan pembacanya ke /radiology. Yang lain, sebuah kotak
// merah beberapa baris di bawahnya, berbunyi "Panacea does not read DICOM
// files".
//
// Yang kedua ditulis lebih dulu, ketika memang begitu keadaannya, lalu tidak
// pernah diperbarui. src/lib/dicom.ts memuat pengurai sungguhan dan
// Radiology.tsx memanggil bacaDicom() atas berkas yang dipilih pemakai.
//
// Arah kesalahannya layak disebut: ia MENGECILKAN apa yang ada. Pernyataan
// batas yang terlalu berhati-hati tetap pernyataan yang keliru, dan yang ini
// sekaligus menyembunyikan fitur yang benar-benar bekerja.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const dicom = baca('../../src/lib/dicom.ts')
const radiologi = baca('../../src/pages/Radiology.tsx')
const panel = baca('../../src/pages/bodyhub/PencitraanVolumetrikPanel.tsx')

// ── 1. Apakah Panacea benar-benar membaca DICOM? Diperiksa, bukan diandaikan ─
const bisaBacaDicom = /export function bacaDicom\(/.test(dicom) && /bacaDicom\(await file\.arrayBuffer\(\)\)/.test(radiologi)

// ── 2. Kalau bisa, tidak boleh ada kalimat yang menyangkalnya ──────────────
if (bisaBacaDicom) {
  for (const b of YANG_BELUM_DIMILIKI_PANACEA) {
    assert.ok(!/Panacea does not read DICOM/i.test(b),
      `a boundary statement denies a capability that exists: "${b}". src/lib/dicom.ts exports bacaDicom() and Radiology.tsx calls it on a user-picked file.`)
  }
  // Dan panel itu harus MENUNJUK ke tempatnya, bukan diam.
  assert.ok(/to="\/radiology"/.test(panel), 'the panel no longer points at the viewer that does read DICOM')
  assert.ok(YANG_BELUM_DIMILIKI_PANACEA.some((b) => /viewer linked above/i.test(b))
    || YANG_BELUM_DIMILIKI_PANACEA.some((b) => /contents of the files you pick/i.test(b)),
    'the boundary list no longer tells the reader what is and is not being shown')
} else {
  // Kalau penguraianya benar-benar hilang, kalimat lamalah yang benar --
  // dan blok yang menjanjikan pembaca sebuah penampil harus ikut hilang.
  assert.ok(!/Panacea can also read an actual DICOM study/.test(panel),
    'the panel promises a DICOM viewer that no longer exists')
}

// ── 3. Batas yang MASIH benar tidak boleh ikut terhapus ────────────────────
// Ini yang paling mudah rusak saat memperbaiki kalimat: memperbaiki satu
// pernyataan lalu menghapus tiga lainnya sekalian.
assert.ok(YANG_BELUM_DIMILIKI_PANACEA.length >= 4, 'the boundary list was thinned out while being corrected')
for (const pola of [
  /does not bundle, call, embed or license KaloLumen/i,
  /not a scan, and not anyone/i,
  /nothing here is a diagnosis or a clinical finding/i,
]) {
  assert.ok(YANG_BELUM_DIMILIKI_PANACEA.some((b) => pola.test(b)), `a still-true boundary matching ${pola} disappeared`)
}

// ── 3b. Klaim "tidak memuat studi" harus sesuai dengan panelnya ────────────
//
// Gerbang ini pernah LOLOS ketika seharusnya gagal. Ia memeriksa bahwa
// kalimat 'This panel loads no study' ADA, bukan bahwa ia BENAR -- jadi pada
// hari panel itu mulai membaca berkas sungguhan, kalimatnya menjadi keliru
// dan gerbangnya tetap hijau. Yang diperiksa sekarang adalah kenyataannya.
const panelMemuatStudi = /<VolumeDicomBagian\s*\/>/.test(panel)
const bagian = (() => {
  try {
    return readFileSync(new URL('../../src/pages/bodyhub/VolumeDicomBagian.tsx', import.meta.url), 'utf8')
  } catch {
    return ''
  }
})()
if (panelMemuatStudi) {
  assert.ok(/bacaDicom\(/.test(bagian),
    'the panel mounts a loader section that never calls bacaDicom — it claims to render a study it does not read')
  for (const b of YANG_BELUM_DIMILIKI_PANACEA) {
    assert.ok(!/panel loads no study/i.test(b) && !/no CT or MRI file is read/i.test(b),
      `the panel now reads DICOM files, but a boundary statement still says it does not: "${b}"`)
  }
} else {
  assert.ok(YANG_BELUM_DIMILIKI_PANACEA.some((b) => /loads no study|no CT or MRI file is read/i.test(b)),
    'the panel loads nothing, yet no boundary statement says so')
}

// ── 4. Provenans KaloLumen tetap belum terselesaikan ───────────────────────
// Tidak ada di sepanjang perbaikan ini yang boleh diam-diam mengubahnya
// menjadi lisensi yang terdengar aman.
assert.equal(KALOLUMEN.lisensi, 'unresolved', 'the KaloLumen licence was given a value it was never verified to have')
assert.ok(/Educational and research use only/.test(KALOLUMEN.batasPenulis), "the author's own stated limit was dropped")

// ── 5. Dan yang dijanjikan penampilnya harus sesuai kemampuannya ───────────
// Halaman itu menjanjikan DICOM tak terkompresi saja. Kalau suatu hari
// penolakan itu hilang, janjinya berubah menjadi jebakan.
assert.ok(/Uncompressed DICOM only/.test(panel), 'the panel no longer states the viewer only reads uncompressed DICOM')
assert.ok(/Transfer Syntax|transfer syntax|terkompresi|compressed/i.test(dicom),
  'the parser no longer mentions compression at all, yet the panel still promises compressed studies are refused by name')

console.log('pencitraan-tak-saling-membantah: ok')
