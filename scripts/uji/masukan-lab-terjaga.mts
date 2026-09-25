import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JENIS_LAB, periksaMasukanLab, FAKTOR_CURIGA_SATUAN } from '../../src/lib/lab.ts'

// Satu angka salah di riwayat lab merusak garis dasar, tren dan PhenoAge sekaligus,
// dan hasilnya tetap tampak meyakinkan. Sebelumnya: nilai tak valid diabaikan
// diam-diam, tanggal masa depan diterima, dan salah satuan tidak terdeteksi.
const hari = '2026-09-25'
const gdp = JENIS_LAB.find((j) => j.id === 'gdp')!
assert.ok(gdp && typeof gdp.bawah === 'number', 'jenis glukosa puasa beserta rentangnya hilang')

// Tolak dengan alasan yang terbaca, bukan diam.
for (const [teks, tgl] of [['', hari], ['abc', hari], ['5 mg/dL', hari], ['0', hari], ['-3', hari], ['90', '2026-09-26'], ['90', 'kemarin']] as const) {
  const h = periksaMasukanLab(gdp, teks, tgl, hari)
  assert.equal(h.ok, false, `"${teks}" @ ${tgl} diterima padahal tidak sah`)
  if (!h.ok) assert.ok(h.alasan.length > 5, 'penolakan tanpa alasan yang dapat dibaca')
}
// Koma desimal gaya Indonesia diterima.
{ const h = periksaMasukanLab(gdp, '92,5', hari, hari); assert.ok(h.ok && h.nilai === 92.5 && h.periksaSatuan === null) }
// Glukosa 5,4 di kolom mg/dL: hampir pasti mmol/L — minta konfirmasi, jangan simpan diam-diam.
{ const h = periksaMasukanLab(gdp, '5,4', hari, hari); assert.ok(h.ok && h.periksaSatuan, 'salah satuan (mmol/L di kolom mg/dL) lolos tanpa peringatan') }
// Ambang diturunkan dari rentang tercatat, bukan angka baru.
{
  const b = gdp.bawah!
  assert.equal(periksaMasukanLab(gdp, String(b / FAKTOR_CURIGA_SATUAN + 0.01), hari, hari).ok && (periksaMasukanLab(gdp, String(b / FAKTOR_CURIGA_SATUAN + 0.01), hari, hari) as { periksaSatuan: string | null }).periksaSatuan, null)
}
// UI: galat tampil sebagai alert, simpan butuh tekan kedua untuk nilai mencurigakan.
{
  const ui = readFileSync('src/components/UbinLab.tsx', 'utf8')
  assert.match(ui, /periksaMasukanLab\(/, 'UI tidak lagi memakai pemeriksa masukan')
  assert.match(ui, /role="alert"/, 'penolakan tidak lagi ditampilkan kepada pengguna')
  assert.match(ui, /konfirmasi !== kunci/, 'nilai bersatuan mencurigakan disimpan tanpa konfirmasi')
  assert.doesNotMatch(ui, /if \(!Number\.isFinite\(n\) \|\| n <= 0\) return/, 'penolakan diam-diam kembali')
}
console.log('masukan-lab-terjaga: nilai tak sah ditolak dengan alasan, tanggal masa depan ditolak, salah satuan butuh konfirmasi')
