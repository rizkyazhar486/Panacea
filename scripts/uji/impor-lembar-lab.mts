import assert from 'node:assert/strict'
import { uraikanLembarLab } from '../../src/lib/imporLab.ts'

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
console.log('impor-lembar-lab: nama ID/EN, koma desimal, rentang dua sisi saja, satuan berbeda ditandai tidak diimpor')
{
  const { readFileSync } = await import('node:fs')
  const ui = readFileSync('src/components/ImporLembarLab.tsx', 'utf8')
  assert.match(ui, /disabled=\{!!k\.masalah\}/, 'kandidat bersatuan berbeda bisa dicentang')
  assert.match(ui, /Object\.fromEntries\(k\.map\(\(x\) => \[x\.jenisId, false\]\)\)/, 'kandidat tercentang otomatis — angka tersimpan tanpa konfirmasi pengguna')
  assert.match(ui, /periksaMasukanLab\(jenis, String\(k\.nilai\), tanggal, hariIni\(\)\)/, 'impor melewati pemeriksa masukan lab')
  assert.match(readFileSync('src/components/UbinLab.tsx', 'utf8'), /<ImporLembarLab \/>/)
}
