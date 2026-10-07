import assert from 'node:assert/strict'
import { uraikanLembarLab, ALIAS_LAB } from '../../src/lib/imporLab.ts'
import { JENIS_LAB } from '../../src/lib/lab.ts'

// Every catalog analyte must have at least one explicit OCR/paste alias.
for (const j of JENIS_LAB) {
  assert.ok((ALIAS_LAB[j.id]?.length ?? 0) > 0, `ALIAS_LAB missing for ${j.id}`)
}

// Teks tipikal lembar lab Indonesia yang disalin dari PDF.
const lembar = `
LABORATORIUM KLINIK CONTOH — Tgl ambil: 20/09/2026
PEMERIKSAAN            HASIL    SATUAN     NILAI RUJUKAN
Hemoglobin             14.2     g/dL       13.0 - 17.0
Leukosit               6,8      10^3/uL    4.0 - 11.0
Glukosa Puasa          108      mg/dL      74 - 106
HbA1c                  5.6      %          4.0 - 5.6
Kreatinin              88       umol/L     62 - 106
SGOT                   24       U/L        < 35
Kolesterol HDL         52       mg/dL      > 40
`
const k = uraikanLembarLab(lembar)
const per = Object.fromEntries(k.map((x) => [x.jenisId, x]))
assert.deepEqual(Object.keys(per).sort(), ['gdp', 'hb', 'hba1c', 'hdl', 'kreatinin', 'sgot', 'wbc'].sort())
assert.equal(per.gdp.nilai, 108); assert.equal(per.gdp.rujukanBawah, 74); assert.equal(per.gdp.rujukanAtas, 106); assert.equal(per.gdp.masalah, null)
assert.equal(per.wbc.nilai, 6.8, 'koma desimal Indonesia salah dibaca'); assert.equal(per.wbc.masalah, null, '10^3/uL tidak diakui setara 10³/µL')
assert.equal(per.hba1c.nilai, 5.6); assert.equal(per.hb.nilai, 14.2, 'HbA1c tertukar dengan Hemoglobin')
// Kreatinin dalam µmol/L: aplikasi memakai mg/dL — JANGAN diimpor diam-diam.
assert.equal(per.kreatinin.masalah, 'satuan-berbeda', 'satuan berbeda lolos tanpa tanda — nilai µmol/L akan tersimpan sebagai mg/dL')
// "< 35" dan "> 40" bukan rentang dua sisi: tidak boleh dikarang.
assert.equal(per.sgot.rujukanBawah, undefined); assert.equal(per.hdl.rujukanAtas, undefined)
// Baris tanpa angka / teks bebas tidak menghasilkan kandidat.
assert.deepEqual(uraikanLembarLab('Catatan: hemoglobin normal\nDokter penanggung jawab'), [])

// OCR-style draft (what a vision model might emit): uneven spaces, mixed ID/EN,
// Indonesian decimal comma. Same fail-closed unit rules as clean paste.
const ocrDraft = `
Hemoglobin  14.2  g/dL  13.0 - 17.0
Leukosit 6,8 10^3/uL 4.0 - 11.0
Fasting glucose  108 mg/dL  74 - 106
Kreatinin 1.1 mg/dL 0.7 - 1.3
Patient: DO_NOT_PARSE_THIS
`
const ocr = Object.fromEntries(uraikanLembarLab(ocrDraft).map((x) => [x.jenisId, x]))
assert.equal(ocr.hb?.nilai, 14.2)
assert.equal(ocr.wbc?.nilai, 6.8)
assert.equal(ocr.gdp?.nilai, 108)
assert.equal(ocr.kreatinin?.nilai, 1.1)
assert.equal(ocr.kreatinin?.masalah, null)
assert.equal(Object.keys(ocr).includes('patient' as string), false)

// OCR draft: column drift + repeated analyte (keep last readable line), no PHI keys.
const ocrKolom = `
HASIL PEMERIKSAAN DARAH
Hb     13,5   g/dL
HGB 13.5 g/dL 12-16
Glukosa Puasa    99   mg/dL   70 - 100
Creatinine 0.9 mg/dL 0.6-1.2
CRP   2,5  mg/L
Nama Pasien: JANGAN_IMPOR
`
const kolom = Object.fromEntries(uraikanLembarLab(ocrKolom).map((x) => [x.jenisId, x]))
assert.equal(kolom.hb?.nilai, 13.5, 'Hb/HGB OCR harus terbaca')
assert.equal(kolom.gdp?.nilai, 99)
assert.equal(kolom.kreatinin?.nilai, 0.9)
assert.equal(kolom.crp?.nilai, 2.5)
assert.equal(Object.keys(kolom).some((k) => /pasien|nama/i.test(k)), false)

// OCR draft: uric acid + platelets + EN longevity panel names (fail-closed units).
const ocrLongevity = `
Uric acid  5.8  mg/dL  3.5 - 7.0
Platelets  220  x10^9/L  150 - 450
PLT 210 ×10⁹/L 150-450
25-OH Vitamin D  32  ng/mL  20 - 50
Vitamin B12  450  pg/mL  200 - 900
Thyroid stimulating hormone  1.8  mIU/L  0.4 - 4.0
Estimated GFR  95  mL/min/1.73m2
Asam urat 6,1 mg/dL 3.4-7.0
`
const longev = Object.fromEntries(uraikanLembarLab(ocrLongevity).map((x) => [x.jenisId, x]))
assert.equal(longev.asamUrat?.nilai, 5.8, 'uric acid harus terbaca sebelum baris ID kedua')
assert.equal(longev.asamUrat?.masalah, null)
assert.equal(longev.trombosit?.nilai, 220, 'Platelets/PLT OCR harus terbaca')
assert.equal(longev.trombosit?.masalah, null, 'x10^9/L harus setara ×10⁹/L')
assert.equal(longev.vitd?.nilai, 32)
assert.equal(longev.vitd?.masalah, null)
assert.equal(longev.b12?.nilai, 450)
assert.equal(longev.b12?.masalah, null)
assert.equal(longev.tsh?.nilai, 1.8)
assert.equal(longev.egfr?.nilai, 95)
assert.equal(longev.egfr?.masalah, null)

// Lipid panel: total cholesterol must not steal LDL/HDL lines.
const lipid = `
Kolesterol Total  198  mg/dL  < 200
Kolesterol LDL  118  mg/dL  < 100
Kolesterol HDL  52  mg/dL  > 40
Total cholesterol  210 mg/dL  0 - 200
Triglycerides  140 mg/dL  < 150
`
const lip = Object.fromEntries(uraikanLembarLab(lipid).map((x) => [x.jenisId, x]))
assert.equal(lip.chol?.nilai, 198, 'kolesterol total harus terbaca')
assert.equal(lip.chol?.masalah, null)
assert.equal(lip.ldl?.nilai, 118)
assert.equal(lip.hdl?.nilai, 52)
assert.notEqual(lip.ldl?.jenisId, 'chol')
assert.equal(uraikanLembarLab('Kolesterol LDL 118 mg/dL').map((x) => x.jenisId).join(), 'ldl')
assert.equal(uraikanLembarLab('Total cholesterol 210 mg/dL').map((x) => x.jenisId).join(), 'chol')

// Negatif: alias asam urat tidak boleh menelan baris tanpa angka.
assert.deepEqual(uraikanLembarLab('Uric acid within normal limits\nPlatelets adequate'), [])

// Negatif OCR: sampah vision / kosong → tidak ada kandidat (fail-closed).
assert.deepEqual(uraikanLembarLab(''), [])
assert.deepEqual(uraikanLembarLab('   \n\t  '), [])
assert.deepEqual(uraikanLembarLab('lorem ipsum dolor sit amet\n###\n???'), [])
assert.deepEqual(uraikanLembarLab('Hemoglobin normal\nLeukosit dalam batas'), [])

console.log('impor-lembar-lab: nama ID/EN, koma desimal, rentang dua sisi saja, satuan berbeda ditandai tidak diimpor')
{
  const { readFileSync } = await import('node:fs')
  const ui = readFileSync('src/components/clinical/ImporLembarLab.tsx', 'utf8')
  assert.match(ui, /disabled=\{!!k\.masalah\}/, 'kandidat bersatuan berbeda bisa dicentang')
  assert.match(ui, /Object\.fromEntries\(k\.map\(\(x\) => \[x\.jenisId, false\]\)\)/, 'kandidat tercentang otomatis — angka tersimpan tanpa konfirmasi pengguna')
  assert.match(ui, /periksaMasukanLab\(jenis, String\(k\.nilai\), tanggal, hariIni\(\)\)/, 'impor melewati pemeriksa masukan lab')
  assert.match(ui, /data-lab-photo-button/, 'lab import must offer a photo OCR draft path')
  assert.match(ui, /PERINTAH_BACA_LEMBAR_LAB/, 'photo path must use the lab-specific vision prompt')
  assert.match(ui, /Draft from photo|technical draft/, 'photo OCR must not claim clinical validation')
  assert.match(ui, /Nothing is saved until you tick/, 'photo OCR must still require per-value confirm')
  assert.match(readFileSync('src/components/UbinLab.tsx', 'utf8'), /<ImporLembarLab \/>/)
  assert.match(readFileSync('src/lib/imporLab.ts', 'utf8'), /export const PERINTAH_BACA_LEMBAR_LAB/, 'lab vision prompt must stay next to the deterministic parser')
}
