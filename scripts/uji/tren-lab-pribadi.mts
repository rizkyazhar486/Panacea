import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analisisTrenLab, MIN_RIWAYAT_GARIS_DASAR } from '../../src/lib/labTrend.ts'
import type { JenisLab } from '../../src/lib/lab.ts'

// Mesin tren lab pribadi: garis dasar = median riwayat SEBELUM hasil terakhir,
// sebaran = MAD x 1,4826. Kasus di bawah dihitung dengan tangan.
const LDL: JenisLab = { id: 'ldl', nama: 'LDL', satuan: 'mg/dL', atas: 100, sumber: 'uji' }
const b = (t: string, n: number) => ({ id: t, tanggal: t, nilai: n })

// ── Kurang dari 3 riwayat: jangan menebak.
{
  const r = analisisTrenLab([b('2024-01-01', 90), b('2024-06-01', 95), b('2025-01-01', 140)], LDL)!
  assert.equal(r.status, 'belum-cukup-data', `baru 2 riwayat tetapi status ${r.status} — mesin menebak tanpa garis dasar`)
  assert.equal(r.garisDasar, null)
  assert.equal(MIN_RIWAYAT_GARIS_DASAR, 3)
}

// ── Riwayat 90, 92, 94 -> median 92, deviasi |−2,0,2| -> MAD 2 -> sebar 2,9652.
//    Terakhir 93: z = 1/2,9652 = 0,337 -> stabil.
{
  const r = analisisTrenLab([b('2023-01-01', 90), b('2023-07-01', 92), b('2024-01-01', 94), b('2024-07-01', 93)], LDL)!
  assert.equal(r.garisDasar, 92, `garis dasar ${r.garisDasar}, bukan median 92`)
  assert.ok(Math.abs(r.zPribadi! - 1 / (2 * 1.4826)) < 1e-9, `z pribadi ${r.zPribadi} salah`)
  assert.equal(r.status, 'stabil')
  assert.equal(r.selisih, 1)
}

// ── SATU titik melonjak (terakhir 110, z ~ 6): hanya "pantau", tidak pernah bermakna.
{
  const r = analisisTrenLab([b('2023-01-01', 90), b('2023-07-01', 92), b('2024-01-01', 94), b('2024-07-01', 110)], LDL)!
  assert.equal(r.arah, 'naik')
  assert.equal(r.status, 'pantau', `satu titik menyimpang menjadi ${r.status} — satu hasil bisa hanya derau`)
}

// ── Satu lonjakan SETELAH riwayat panjang (jalur konfirmasi benar-benar
//    dijalankan): 90,92,94,93 lalu 110. Titik sebelumnya (93) normal -> pantau.
{
  const r = analisisTrenLab([b('2023-01-01', 90), b('2023-07-01', 92), b('2024-01-01', 94), b('2024-07-01', 93), b('2025-01-01', 110)], LDL)!
  assert.equal(r.status, 'pantau', `satu lonjakan setelah riwayat panjang menjadi ${r.status} — konfirmasi dua titik tidak dijalankan`)
}

// ── DUA titik berurutan naik: riwayat 90,92,94,108 lalu 110.
//    Sebelumnya (108) vs 90,92,94: z2 = 16/2,9652 > 2, arah sama -> terkonfirmasi.
//    110 di atas batas populasi 100 -> bicarakan dengan dokter.
{
  const r = analisisTrenLab([b('2023-01-01', 90), b('2023-07-01', 92), b('2024-01-01', 94), b('2024-07-01', 108), b('2025-01-01', 110)], LDL)!
  assert.equal(r.status, 'bicarakan-dengan-dokter', `dua kenaikan berurutan di luar rentang menjadi ${r.status}`)
  // Laju: (110-108) dalam 184 hari -> 2/184*365,25 per tahun.
  assert.ok(Math.abs(r.lajuPerTahun! - (2 / 184) * 365.25) < 1e-9, `laju per tahun ${r.lajuPerTahun} salah`)
}

// ── Dua kenaikan berurutan TETAPI masih dalam rentang populasi -> perubahan bermakna, bukan dokter.
{
  const L: JenisLab = { ...LDL, atas: 200 }
  const r = analisisTrenLab([b('2023-01-01', 90), b('2023-07-01', 92), b('2024-01-01', 94), b('2024-07-01', 108), b('2025-01-01', 110)], L)!
  assert.equal(r.status, 'perubahan-bermakna', `dalam rentang populasi tetapi status ${r.status}`)
}

// ── Stabil bagi diri sendiri tetapi di luar rentang populasi -> pantau, dan dua hal itu terpisah.
{
  const r = analisisTrenLab([b('2023-01-01', 130), b('2023-07-01', 131), b('2024-01-01', 129), b('2024-07-01', 130)], LDL)!
  assert.equal(r.arah, 'datar')
  assert.equal(r.diLuarRentangPopulasi, true)
  assert.equal(r.status, 'pantau', `stabil pribadi tapi di luar populasi menjadi ${r.status}`)
}

// ── Riwayat identik (MAD = 0) tidak boleh menghasilkan z tak hingga.
{
  const r = analisisTrenLab([b('2023-01-01', 5), b('2023-07-01', 5), b('2024-01-01', 5), b('2024-07-01', 5.02)], { ...LDL, atas: 10 })!
  assert.ok(Number.isFinite(r.zPribadi!), `z pribadi ${r.zPribadi} tak hingga pada riwayat identik`)
  assert.equal(r.status, 'stabil', `5,02 setelah tiga kali 5 dinilai ${r.status}`)
}

// ── Urutan masukan tidak boleh mengubah hasil; tanggal yang yang rusak dibuang.
{
  const acak = [b('2024-07-01', 93), b('2023-01-01', 90), b('bukan-tanggal', 999), b('2024-01-01', 94), b('2023-07-01', 92)]
  const r = analisisTrenLab(acak, LDL)!
  assert.equal(r.terakhir, 93, `hasil terakhir ${r.terakhir}: urutan atau tanggal rusak ikut terbaca`)
  assert.equal(r.garisDasar, 92)
}

// ── Mesin ini tidak boleh punya tingkat "urgent".
{
  const src = readFileSync(new URL('../../src/lib/labTrend.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /'urgent|'darurat/i, 'mesin tren lab memperoleh tingkat darurat dari angka yang dimasukkan sendiri')
}

console.log('tren-lab-pribadi: garis dasar median/MAD, satu titik tak pernah bermakna, dua titik terkonfirmasi, populasi vs pribadi terpisah, tanpa tingkat darurat')

// ── Terjangkau: ubin lab dengan baris tren pribadi dipasang di halaman Your Numbers.
{
  const halaman = readFileSync(new URL('../../src/pages/PusatTubuh.tsx', import.meta.url), 'utf8')
  const ubin = readFileSync(new URL('../../src/components/UbinLab.tsx', import.meta.url), 'utf8')
  assert.match(halaman, /<UbinLab \/>/, 'ubin lab tidak lagi dipasang di Your Numbers — kembali tersembunyi di papan widget')
  assert.match(ubin, /analisisTrenLab\(/, 'ubin lab tidak lagi memakai mesin tren pribadi')
}
