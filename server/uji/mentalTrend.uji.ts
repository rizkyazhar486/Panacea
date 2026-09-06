// Uji riwayat penapisan jiwa.
//
// Bagian yang paling mudah salah di sini bukan penjumlahan skor, melainkan
// penafsiran perubahannya. Alat yang melaporkan selisih dua titik sebagai
// "membaik" akan terus-menerus memberi kabar baik yang tidak ditopang apa pun,
// dan tidak ada satu pun galat yang muncul karenanya.

import {
  pita, simpan, bacaRiwayat, riwayatAlat, perubahan, butir9Terbaru, titikGrafik,
  MCID, MAKSIMAL, KUNCI_RIWAYAT, type Catatan,
} from '../../src/lib/mentalTrend'

// localStorage tiruan — pustakanya dipakai di peramban, ujinya di Node.
const simpanan = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => simpanan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpanan.set(k, v) },
  removeItem: (k: string) => { simpanan.delete(k) },
  clear: () => simpanan.clear(),
  key: () => null,
  length: 0,
} as Storage

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const bersihkan = () => simpanan.clear()
const hari = (n: number) => new Date(Date.parse('2026-01-01T00:00:00Z') + n * 86400000).toISOString()

// ── Pita keparahan ──────────────────────────────────────────────────────────
ok('PHQ-9 0 minimal', pita('phq9', 0).label === 'Minimal')
ok('PHQ-9 4 masih minimal, 5 sudah ringan',
  pita('phq9', 4).label === 'Minimal' && pita('phq9', 5).label === 'Mild')
ok('PHQ-9 10 sedang', pita('phq9', 10).label === 'Moderate')
ok('PHQ-9 15 sedang-berat', pita('phq9', 15).label === 'Moderately severe')
ok('PHQ-9 20 berat', pita('phq9', 20).label === 'Severe')
ok('GAD-7 15 berat', pita('gad7', 15).label === 'Severe')
ok('GAD-7 tidak punya pita sedang-berat',
  pita('gad7', 15).tingkat === 4 && pita('gad7', 14).tingkat === 2)
ok('tingkat naik bersama skor', (() => {
  let t = -1
  for (let s = 0; s <= 27; s++) { const x = pita('phq9', s).tingkat; if (x < t) return false; t = x }
  return true
})())

// ── Penyimpanan ─────────────────────────────────────────────────────────────
bersihkan()
ok('riwayat kosong pada awalnya', bacaRiwayat().length === 0)
simpan({ alat: 'phq9', skor: 14, waktu: hari(0) })
simpan({ alat: 'phq9', skor: 8, waktu: hari(30) })
simpan({ alat: 'gad7', skor: 11, waktu: hari(30) })
ok('tiga catatan tersimpan', bacaRiwayat().length === 3)
ok('catatan lama tidak ditimpa', riwayatAlat(bacaRiwayat(), 'phq9').length === 2)
ok('riwayat terurut menurut waktu',
  riwayatAlat(bacaRiwayat(), 'phq9').map((c) => c.skor).join(',') === '14,8')
ok('penyaringan per alat benar', riwayatAlat(bacaRiwayat(), 'gad7').length === 1)

// Catatan rusak — dari versi lama, penyimpanan yang tersunting, atau
// penyimpanan yang penuh — tidak boleh merobohkan halamannya.
{
  simpanan.set(KUNCI_RIWAYAT, JSON.stringify([
    { alat: 'phq9', skor: 10, waktu: hari(1) },
    { alat: 'entah', skor: 5, waktu: hari(2) },
    { alat: 'phq9', skor: 99, waktu: hari(3) },
    { alat: 'phq9', skor: 5, waktu: 'kemarin' },
    null, 'bukan objek', { alat: 'gad7' },
  ]))
  ok('catatan rusak disaring, yang sah tetap terbaca', bacaRiwayat().length === 1)
  simpanan.set(KUNCI_RIWAYAT, 'bukan json')
  ok('penyimpanan rusak total tidak melempar galat', bacaRiwayat().length === 0)
}
{
  bersihkan()
  simpan({ alat: 'phq9', skor: 30, waktu: hari(0) })
  ok('skor di atas maksimum alat ditolak', bacaRiwayat().length === 0)
  simpan({ alat: 'phq9', skor: -1, waktu: hari(0) })
  ok('skor negatif ditolak', bacaRiwayat().length === 0)
  ok('maksimum tiap alat sesuai jumlah butirnya',
    MAKSIMAL.phq9 === 27 && MAKSIMAL.gad7 === 21)
}

// ── Penafsiran perubahan ────────────────────────────────────────────────────
bersihkan()
ok('tanpa catatan tidak ada perubahan', perubahan(bacaRiwayat(), 'phq9') === null)

simpan({ alat: 'phq9', skor: 14, waktu: hari(0) })
{
  const p = perubahan(bacaRiwayat(), 'phq9')!
  ok('catatan pertama ditandai baru', p.arah === 'baru')
  ok('catatan pertama menyarankan ulangi dua sampai empat pekan',
    p.kalimat.includes('two to four weeks'))
  ok('catatan pertama tidak mengaku bermakna', p.bermakna === false)
}

// Turun 3 titik: nyata di angka, tetapi di bawah MCID PHQ-9 yang 5 titik.
simpan({ alat: 'phq9', skor: 11, waktu: hari(28) })
{
  const p = perubahan(bacaRiwayat(), 'phq9')!
  ok('selisih 3 titik pada PHQ-9 TIDAK disebut membaik', p.arah === 'tetap')
  ok('selisih di bawah ambang dijelaskan sebagai variasi biasa',
    p.kalimat.includes('ordinary variation'))
  ok('ambang MCID disebutkan angkanya', p.kalimat.includes('5-point'))
  ok('jarak hari dihitung', p.hariAntara === 28)
  ok('selisih dilaporkan apa adanya', p.selisih === -3)
}

// Turun 6 titik: melewati ambang.
simpan({ alat: 'phq9', skor: 5, waktu: hari(56) })
{
  const p = perubahan(bacaRiwayat(), 'phq9')!
  ok('selisih 6 titik disebut membaik', p.arah === 'membaik' && p.bermakna)
  ok('perbaikan menyebut ambangnya', p.kalimat.includes('meaningful improvement'))
}

// Naik melewati ambang: harus mengajak bicara ke seseorang.
simpan({ alat: 'phq9', skor: 16, waktu: hari(84) })
{
  const p = perubahan(bacaRiwayat(), 'phq9')!
  ok('kenaikan melewati ambang disebut memburuk', p.arah === 'memburuk' && p.bermakna)
  ok('pemburukan mengajak memberi tahu seseorang',
    p.kalimat.includes('telling someone'))
}

// GAD-7 memakai ambang 4, bukan 5 — selisih yang sama bisa bermakna di satu
// alat dan tidak di alat lain.
{
  bersihkan()
  simpan({ alat: 'gad7', skor: 12, waktu: hari(0) })
  simpan({ alat: 'gad7', skor: 8, waktu: hari(20) })
  const g = perubahan(bacaRiwayat(), 'gad7')!
  ok('selisih 4 titik bermakna pada GAD-7', g.bermakna && g.arah === 'membaik')
  bersihkan()
  simpan({ alat: 'phq9', skor: 12, waktu: hari(0) })
  simpan({ alat: 'phq9', skor: 8, waktu: hari(20) })
  const p = perubahan(bacaRiwayat(), 'phq9')!
  ok('selisih 4 titik yang sama TIDAK bermakna pada PHQ-9', !p.bermakna)
  ok('ambang kedua alat memang berbeda', MCID.phq9 === 5 && MCID.gad7 === 4)
}

// ── Butir 9 ─────────────────────────────────────────────────────────────────
{
  bersihkan()
  // Skor total ringan tetapi butir 9 positif: inilah keadaan yang totalnya
  // menutupi, dan yang tidak boleh ikut hilang.
  simpan({ alat: 'phq9', skor: 6, waktu: hari(0), butir9: 1 })
  ok('butir 9 positif terdeteksi walau total ringan', butir9Terbaru(bacaRiwayat()))
  ok('total tetap ringan', pita('phq9', 6).label === 'Mild')
  simpan({ alat: 'phq9', skor: 18, waktu: hari(10), butir9: 0 })
  ok('butir 9 mengikuti catatan TERBARU, bukan yang terburuk',
    !butir9Terbaru(bacaRiwayat()))
  ok('butir 9 tidak ikut dijumlahkan ke total',
    riwayatAlat(bacaRiwayat(), 'phq9')[0].skor === 6)
}

// ── Titik grafik ────────────────────────────────────────────────────────────
{
  bersihkan()
  simpan({ alat: 'phq9', skor: 27, waktu: hari(0) })
  simpan({ alat: 'phq9', skor: 0, waktu: hari(10) })
  const t = titikGrafik(bacaRiwayat(), 'phq9')
  ok('titik dinormalkan terhadap maksimal alat', t[0].y === 1 && t[1].y === 0)
  ok('sumbu mendatar terentang penuh', t[0].x === 0 && t[1].x === 1)
  ok('skor asli ikut dibawa', t[0].skor === 27)
  bersihkan()
  simpan({ alat: 'phq9', skor: 10, waktu: hari(0) })
  ok('satu titik tidak membuat pembagian nol',
    titikGrafik(bacaRiwayat(), 'phq9').every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)))
  ok('tanpa catatan grafik kosong', titikGrafik([], 'gad7').length === 0)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
