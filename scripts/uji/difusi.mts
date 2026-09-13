import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  TETAPAN_DIFUSI, ZAT_RUJUKAN, waktuDifusi, jarakDifusi, fluksFick, deretWaktu,
} from '../../src/lib/difusi.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol
const rel = (a: number, b: number, tol = 1e-9) => Math.abs(a / b - 1) <= tol

// ── 1. Waktu difusi KUADRAT terhadap jarak ───────────────────────────────
//
// Invarian utama panel ini. Kalau ini salah, kurvanya tetap tampak masuk akal
// dan seluruh pelajarannya hilang. Diperiksa sebagai RASIO, bukan pada satu
// contoh: menggandakan jarak harus MELIPATEMPATKAN waktunya, setiap kali.
{
  const D = TETAPAN_DIFUSI.D_OKSIGEN
  for (const x of [1e-6, 5e-6, 2e-5, 1e-4, 1e-3]) {
    assert.ok(rel(waktuDifusi(2 * x, D) / waktuDifusi(x, D), 4, 1e-12),
      `menggandakan ${x} m harus melipatempatkan waktunya`)
    assert.ok(rel(waktuDifusi(10 * x, D) / waktuDifusi(x, D), 100, 1e-12),
      'sepuluh kali jarak harus seratus kali waktu')
  }
}

// ── 2. Kenapa tubuh perlu memompa: angka yang sebenarnya ────────────────
//
// Kontrol positif terhadap besaran yang diketahui, bukan terhadap dirinya
// sendiri. Satu mikrometer harus di bawah satu milidetik; satu milimeter harus
// hitungan menit; satu meter harus lebih lama daripada hidup seseorang.
{
  const D = TETAPAN_DIFUSI.D_OKSIGEN
  const t1um = waktuDifusi(1e-6, D)
  const t1mm = waktuDifusi(1e-3, D)
  const t1m = waktuDifusi(1, D)
  assert.ok(t1um < 1e-3, `1 µm harus di bawah 1 ms, terbaca ${t1um} s`)
  assert.ok(t1mm > 100 && t1mm < 1000, `1 mm harus hitungan menit, terbaca ${t1mm} s`)
  assert.ok(t1m > 1e8, `1 m harus jauh lebih lama daripada satu umur, terbaca ${t1m} s`)
  // Dan jarak "aman" dari kapiler: puluhan mikrometer dalam waktu di bawah satu detik.
  assert.ok(waktuDifusi(50e-6, D) < 1, '50 µm harus ditempuh dalam di bawah satu detik')
}

// ── 3. Jarak dan waktu adalah kebalikan yang tepat ──────────────────────
{
  for (const zat of ZAT_RUJUKAN) {
    for (const x of [1e-6, 1e-5, 1e-4, 1e-3]) {
      assert.ok(rel(jarakDifusi(waktuDifusi(x, zat.d), zat.d), x, 1e-9),
        `bolak-balik gagal untuk ${zat.nama} pada ${x} m`)
    }
  }
}

// ── 4. Molekul yang lebih besar berdifusi lebih lambat ──────────────────
{
  const x = 50e-6
  assert.ok(waktuDifusi(x, TETAPAN_DIFUSI.D_GLUKOSA) > waktuDifusi(x, TETAPAN_DIFUSI.D_OKSIGEN),
    'glukosa harus lebih lambat daripada oksigen')
  // CO2 lebih lambat DI SINI karena berkas ini memakai koefisien difusi bebas
  // dan tidak memodelkan kelarutan. Perpindahan CO2 yang sesungguhnya melintasi
  // jaringan justru jauh lebih cepat daripada oksigen (koefisien Krogh). Uji ini
  // menjaga agar keterbatasan itu tetap DINYATAKAN, bukan tersembunyi.
  assert.ok(waktuDifusi(x, TETAPAN_DIFUSI.D_CO2) > waktuDifusi(x, TETAPAN_DIFUSI.D_OKSIGEN),
    'pada koefisien difusi bebas, CO2 lebih lambat daripada oksigen')
  {
    const sumber = readFileSync('src/lib/difusi.ts', 'utf8')
    assert.ok(/Krogh/.test(sumber),
      'keterbatasan CO2 (kelarutan/koefisien Krogh) harus dinyatakan di sumbernya')
    const panel = readFileSync('src/pages/bodyhub/DifusiPanel.tsx', 'utf8')
    assert.ok(/Krogh|solubilit/i.test(panel),
      'panel harus menyatakan bahwa urutan kecepatan ini hanya berlaku untuk difusi bebas')
  }
  for (const zat of ZAT_RUJUKAN) assert.ok(zat.d > 0, `${zat.nama} harus punya koefisien positif`)
}

// ── 5. Fick: sebanding lurus dan berbanding terbalik, persis ────────────
{
  const dasar = { luas: 70, d: TETAPAN_DIFUSI.D_OKSIGEN, bedaKonsentrasi: 0.05, tebal: 1e-6 }
  const f = fluksFick(dasar)
  assert.ok(rel(fluksFick({ ...dasar, luas: 140 }) / f, 2, 1e-12), 'dua kali luas, dua kali fluks')
  assert.ok(rel(fluksFick({ ...dasar, bedaKonsentrasi: 0.1 }) / f, 2, 1e-12), 'dua kali gradien, dua kali fluks')
  assert.ok(rel(fluksFick({ ...dasar, tebal: 2e-6 }) / f, 0.5, 1e-12), 'dua kali tebal, separuh fluks')
  // Gradien nol memberi fluks nol, bukan NaN: itu keadaan yang sah.
  assert.ok(dekat(fluksFick({ ...dasar, bedaKonsentrasi: 0 }), 0, 1e-18))
  // Luas nol juga sah dan memberi nol.
  assert.ok(dekat(fluksFick({ ...dasar, luas: 0 }), 0, 1e-18))
}

// ── 6. Kontrol negatif: masukan mustahil menolak mencetak angka ─────────
{
  const dasar = { luas: 70, d: TETAPAN_DIFUSI.D_OKSIGEN, bedaKonsentrasi: 0.05, tebal: 1e-6 }
  assert.ok(Number.isNaN(fluksFick({ ...dasar, tebal: 0 })),
    'tebal nol memberi fluks tak hingga, yang tidak ada di alam -- harus ditolak')
  assert.ok(Number.isNaN(fluksFick({ ...dasar, tebal: -1 })), 'tebal negatif tidak sah')
  assert.ok(Number.isNaN(fluksFick({ ...dasar, d: 0 })), 'koefisien nol tidak sah')
  assert.ok(Number.isNaN(fluksFick({ ...dasar, luas: -1 })), 'luas negatif tidak sah')
  assert.ok(Number.isNaN(waktuDifusi(-1, TETAPAN_DIFUSI.D_OKSIGEN)), 'jarak negatif tidak sah')
  assert.ok(Number.isNaN(waktuDifusi(1e-6, 0)), 'tanpa koefisien tidak ada waktu')
  assert.ok(Number.isNaN(jarakDifusi(-1, TETAPAN_DIFUSI.D_OKSIGEN)), 'waktu negatif tidak sah')
  assert.equal(waktuDifusi(0, TETAPAN_DIFUSI.D_OKSIGEN), 0, 'jarak nol memakan waktu nol')
}

// ── 7. Kurvanya benar-benar melengkung ke atas (bukan garis) ───────────
//
// Diperiksa pada selisih BERTURUT-TURUT: pada parabola selisihnya membesar
// terus. Sebuah garis akan lolos setiap uji rasio di atas kalau koefisiennya
// kebetulan dipilih pas, tetapi tidak akan lolos ini.
{
  const deret = deretWaktu(TETAPAN_DIFUSI.D_OKSIGEN, 200, 10)
  let selisihSebelumnya = -Infinity
  for (let i = 1; i < deret.length; i += 1) {
    const selisih = deret[i].detik - deret[i - 1].detik
    assert.ok(selisih > selisihSebelumnya, `selisih tidak membesar pada ${deret[i].jarakUm} µm`)
    selisihSebelumnya = selisih
  }
  assert.equal(deret[0].detik, 0, 'kurvanya mulai dari nol')
}

{
  const D = TETAPAN_DIFUSI.D_OKSIGEN
  console.log(
    `OK difusi: waktu difusi kuadrat terhadap jarak -- oksigen menempuh 1 µm dalam ` +
    `${(waktuDifusi(1e-6, D) * 1000).toFixed(3)} ms tetapi 1 mm dalam ` +
    `${waktuDifusi(1e-3, D).toFixed(0)} s; menggandakan jarak melipatempatkan waktunya, ` +
    'dan Fick menolak tebal nol alih-alih mencetak fluks tak hingga.',
  )
}
