import assert from 'node:assert/strict'
import {
  TETAPAN_INDERA, kekuatanLensa, titikDekat, amplitudoLazimUsia, energiFoton, energiFotonEv,
  tingkatTekanan, tekananDariDb, jumlahSumber, aliranUdara, deretTitikDekat, deretTekanan,
} from '../../src/lib/inderaOptikAkustik.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Dioptri linear, JARAK hiperbolik ──────────────────────────────────
//
// Invarian utama panel ini. Amplitudo turun dengan laju TETAP menurut usia,
// tetapi titik dekat bergerak makin jauh dengan percepatan. Kalau ini salah,
// kurvanya tetap tampak masuk akal dan seluruh pelajarannya hilang.
{
  // Amplitudo benar-benar linear terhadap usia (selisih tetap).
  const d1 = amplitudoLazimUsia(20) - amplitudoLazimUsia(30)
  const d2 = amplitudoLazimUsia(30) - amplitudoLazimUsia(40)
  assert.ok(dekat(d1, d2, 1e-12), 'amplitudo harus turun linear terhadap usia')
  // Sementara titik dekatnya TIDAK.
  const t20 = titikDekat(amplitudoLazimUsia(20))
  const t30 = titikDekat(amplitudoLazimUsia(30))
  const t40 = titikDekat(amplitudoLazimUsia(40))
  assert.ok((t40 - t30) > (t30 - t20) * 1.5,
    `pergeseran titik dekat harus mempercepat: ${t20} -> ${t30} -> ${t40}`)
}

// ── 2. Titik dekat adalah KEBALIKAN yang tepat, dan tak hingga di nol ────
{
  assert.ok(dekat(titikDekat(4), 0.25, 1e-12), '4 D harus memberi 25 cm')
  assert.ok(dekat(titikDekat(10), 0.1, 1e-12), '10 D harus memberi 10 cm')
  assert.equal(titikDekat(0), Number.POSITIVE_INFINITY,
    'tanpa amplitudo tidak ada titik dekat -- harus tak hingga, bukan angka besar yang mengarang')
  assert.ok(Number.isNaN(titikDekat(-1)), 'amplitudo negatif tidak sah')
  // Dan kebalikannya konsisten dengan kekuatan lensa.
  for (const f of [0.1, 0.25, 0.5, 2]) assert.ok(dekat(kekuatanLensa(f), 1 / f, 1e-12))
  assert.ok(Number.isNaN(kekuatanLensa(0)), 'fokus nol tidak sah')
}

// ── 3. Amplitudo lazim dijepit di nol dan turun monoton ─────────────────
{
  let sebelumnya = Infinity
  for (const t of deretTitikDekat(10, 90)) {
    assert.ok(t.amplitudo <= sebelumnya + 1e-12, `amplitudo naik pada usia ${t.usia}`)
    assert.ok(t.amplitudo >= 0, `amplitudo negatif pada usia ${t.usia}`)
    sebelumnya = t.amplitudo
  }
  assert.equal(amplitudoLazimUsia(80), 0, 'perkiraan ini mencapai nol, dan tidak menembusnya')
  assert.ok(Number.isNaN(amplitudoLazimUsia(-1)), 'usia negatif tidak sah')
}

// ── 4. Desibel: +6 dB per penggandaan TEKANAN, +3 dB per penggandaan daya ─
//
// Angka yang paling sering tertukar. Keduanya diperiksa di sini.
{
  const p = 0.02
  assert.ok(dekat(tingkatTekanan(2 * p) - tingkatTekanan(p), 20 * Math.log10(2), 1e-9),
    'menggandakan tekanan harus menambah sekitar 6 dB')
  assert.ok(Math.abs(tingkatTekanan(2 * p) - tingkatTekanan(p) - 6.02) < 0.01, 'yaitu 6.02 dB')
  // Dua sumber tak koheren yang sama keras: +3 dB, BUKAN +6 dan bukan dua kali.
  assert.ok(Math.abs(jumlahSumber([70, 70]) - 73.01) < 0.01, 'dua sumber 70 dB harus memberi 73 dB')
  assert.ok(Math.abs(jumlahSumber([70, 70, 70, 70]) - 76.02) < 0.01, 'empat sumber harus memberi 76 dB')
  // Sumber yang jauh lebih pelan hampir tidak menambah apa-apa.
  assert.ok(Math.abs(jumlahSumber([90, 50]) - 90) < 0.001, 'sumber 40 dB lebih pelan hampir tidak terasa')
  // Satu sumber mengembalikan dirinya sendiri.
  assert.ok(dekat(jumlahSumber([63]), 63, 1e-9))
}

// ── 5. dB <-> Pa adalah kebalikan yang tepat ────────────────────────────
{
  for (const db of [0, 20, 40, 60, 85, 120]) {
    assert.ok(dekat(tingkatTekanan(tekananDariDb(db)), db, 1e-9), `bolak-balik gagal pada ${db} dB`)
  }
  // Kontrol positif: 0 dB PERSIS tekanan acuan.
  assert.ok(dekat(tekananDariDb(0), TETAPAN_INDERA.P_ACUAN, 1e-18), '0 dB harus tepat 20 µPa')
  assert.ok(dekat(tingkatTekanan(TETAPAN_INDERA.P_ACUAN), 0, 1e-9))
  // 94 dB adalah 1 Pa, kontrol kalibrasi yang lazim dipakai.
  assert.ok(Math.abs(tekananDariDb(94) - 1) < 0.01, '94 dB harus sekitar 1 Pa')
}

// ── 6. Tekanan tumbuh EKSPONENSIAL terhadap desibel ─────────────────────
{
  const deret = deretTekanan(0, 120, 10)
  for (let i = 1; i < deret.length; i += 1) {
    assert.ok(deret[i].tekananPa > deret[i - 1].tekananPa, 'tekanan harus naik monoton')
  }
  // Setiap +20 dB harus mengalikan tekanan dengan SEPULUH, persis.
  for (let i = 2; i < deret.length; i += 2) {
    assert.ok(Math.abs(deret[i].tekananPa / deret[i - 2].tekananPa - 10) < 1e-9,
      '+20 dB harus melipatsepuluhkan tekanan')
  }
}

// ── 7. Energi foton: kontrol positif terhadap nilai yang diketahui ──────
{
  // Cahaya tampak kira-kira 1.6-3.3 eV; 550 nm (hijau) sekitar 2.25 eV.
  assert.ok(Math.abs(energiFotonEv(550) - 2.25) < 0.02, '550 nm harus sekitar 2.25 eV')
  assert.ok(energiFotonEv(380) > energiFotonEv(740), 'gelombang lebih pendek membawa energi lebih besar')
  assert.ok(energiFoton(550) > 0)
  assert.ok(Number.isNaN(energiFoton(0)), 'panjang gelombang nol tidak sah')
  assert.ok(Number.isNaN(energiFoton(-1)), 'panjang gelombang negatif tidak sah')
}

// ── 8. Aliran udara dan kontrol negatifnya ─────────────────────────────
{
  assert.ok(dekat(aliranUdara(8, 2), 4, 1e-12))
  assert.ok(Number.isNaN(aliranUdara(8, 0)), 'hambatan nol tidak sah -- aliran tak hingga tidak dicetak')
  assert.ok(Number.isNaN(aliranUdara(8, -1)), 'hambatan negatif tidak sah')
}

// ── 9. Kontrol negatif akustik ─────────────────────────────────────────
assert.ok(Number.isNaN(tingkatTekanan(0)), 'tekanan nol tidak punya tingkat -- bukan -Infinity yang dicetak')
assert.ok(Number.isNaN(tingkatTekanan(-1)), 'tekanan negatif tidak sah')
assert.ok(Number.isNaN(jumlahSumber([])), 'tanpa sumber tidak ada jumlah')
assert.ok(Number.isNaN(jumlahSumber([70, Number.NaN])), 'satu masukan rusak merusak jumlahnya')

console.log(
  'OK indera-optik-akustik: dioptri linear tetapi titik dekat hiperbolik ' +
  `(${titikDekat(amplitudoLazimUsia(20)).toFixed(2)} m pada usia 20 menjadi ` +
  `${titikDekat(amplitudoLazimUsia(50)).toFixed(2)} m pada usia 50), ` +
  'menggandakan tekanan menambah 6.02 dB sementara dua sumber sama keras hanya menambah 3.01 dB, ' +
  'dan dB<->Pa bolak-balik tepat.',
)
