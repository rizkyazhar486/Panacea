import assert from 'node:assert/strict'
import { hitungHasilTerukur, JENDELA_TINJAUAN_HARI } from '../../src/lib/hasilTerukurLab.ts'

const kini = '2026-09-25'
// Tanpa data: penyebut nol → null, bukan 0% atau 100%.
{
  const h = hitungHasilTerukur({}, [], kini)
  assert.equal(h.cakupanTinjauan.nilai, null, 'penyebut nol harus null')
  assert.equal(h.kepatuhanCekUlang.nilai, null)
  assert.equal(h.medianHariKeTinjauan, null)
}
const lab = {
  hba1c: [
    { id: 'a', tanggal: '2026-08-01', nilai: 7.1 }, // luar, ditinjau hari ke-3
    { id: 'b', tanggal: '2026-08-20', nilai: 6.8 }, // luar, tak ditinjau, jendela lewat
    { id: 'c', tanggal: '2026-09-20', nilai: 6.9 }, // luar, jendela belum lewat → tidak dihitung
    { id: 'd', tanggal: '2026-09-01', nilai: 5.2 }, // normal
  ],
  gdp: [{ id: 'e', tanggal: '2026-08-01', nilai: 130, rujukanBawah: 70, rujukanAtas: 140 }], // dalam rentang lab-nya sendiri
}
const tinjauan = [
  { tes: 'hba1c', ditinjau: '2026-08-04T10:00:00Z', cekUlangSebelum: '2026-09-10' }, // cek ulang terpenuhi oleh 'd'
  { tes: 'gdp', ditinjau: '2026-08-05T10:00:00Z', cekUlangSebelum: '2026-09-01' }, // tidak ada hasil baru
  { tes: 'hba1c', ditinjau: '2026-09-21T10:00:00Z', cekUlangSebelum: '2026-12-01' }, // tenggat belum lewat
]
const h = hitungHasilTerukur(lab, tinjauan, kini)
// a tertinjau hari ke-3, c hari ke-1; b tidak ditinjau dalam jendela (tinjauan 09-21 = hari ke-32) → 2/3.
assert.deepEqual([h.cakupanTinjauan.pembilang, h.cakupanTinjauan.penyebut], [2, 3], 'cakupan tinjauan salah hitung')
assert.equal(h.medianHariKeTinjauan, 2, 'median hari ke tinjauan (1 dan 3)')
// gdp 130 dalam rentang lab-nya sendiri (70–140) walau di atas rentang umum → bukan kasus.
// Cek ulang: hba1c tenggat 09-10 terpenuhi oleh 'd' (09-01); gdp 09-01 tidak; tenggat 12-01 belum lewat.
assert.deepEqual([h.kepatuhanCekUlang.pembilang, h.kepatuhanCekUlang.penyebut], [1, 2], 'kepatuhan cek ulang salah hitung')
// Tinjauan SEBELUM pengambilan tidak boleh menutup hasil itu.
assert.equal(hitungHasilTerukur({ hba1c: [{ id: 'z', tanggal: '2026-08-10', nilai: 7 }] }, [{ tes: 'hba1c', ditinjau: '2026-08-01' }], kini).cakupanTinjauan.nilai, 0)
// Hasil yang jendelanya belum lewat tidak menurunkan cakupan.
assert.equal(hitungHasilTerukur({ hba1c: [{ id: 'y', tanggal: '2026-09-20', nilai: 7 }] }, [], kini).cakupanTinjauan.nilai, null)
assert.equal(JENDELA_TINJAUAN_HARI, 14)
{
  const { readFileSync } = await import('node:fs')
  const ui = readFileSync('src/components/UbinLab.tsx', 'utf8')
  assert.match(ui, /hitungHasilTerukur\(ambilLab\(\), tinjauan,/, 'kartu Lab tidak lagi menampilkan lingkaran tindak lanjut dari data nyata')
  assert.match(ui, /penyebut > 0/, 'lingkaran tampil walau penyebut nol — akan menampilkan 0 of 0')
}
console.log('hasil-terukur-lab: cakupan tinjauan, median jeda, kepatuhan cek ulang (lab-outcome-v1)')
