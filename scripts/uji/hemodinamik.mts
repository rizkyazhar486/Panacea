import assert from 'node:assert/strict'
import {
  kandunganOksigen, isiSekuncup, curahJantung, fraksiEjeksi,
  hantaranOksigen, konsumsiOksigenFick, curahJantungFick, rasioEkstraksiOksigen,
  HUFNER, KELARUTAN_PLASMA, RUJUKAN_HEMODINAMIK as R,
} from '../../src/lib/hemodinamik.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Rantai rujukan harus mendarat di angka yang memang dilaporkan ───────
//
// Rantai ini punya tujuh langkah. Kalau satu masukan digeser sampai
// keluarannya tidak masuk akal, uji ini gagal -- dan itu satu-satunya cara
// nilai rujukan bisa dipertahankan tanpa sekadar dipercaya.
const sv = isiSekuncup(R.volumeAkhirDiastol, R.volumeAkhirSistol)
const co = curahJantung(R.denyutPerMenit, sv)
const ef = fraksiEjeksi(sv, R.volumeAkhirDiastol)
const caO2 = kandunganOksigen(R.hemoglobin, R.saturasiArteri, R.tekananParsialArteri)
const cvO2 = kandunganOksigen(R.hemoglobin, R.saturasiVena, R.tekananParsialVena)
const do2 = hantaranOksigen(co, caO2)
const vo2 = konsumsiOksigenFick(co, caO2, cvO2)

assert.ok(sv > 60 && sv < 90, `Isi sekuncup di luar kisaran dewasa: ${sv}`)
assert.ok(co > 4 && co < 6.5, `Curah jantung di luar kisaran istirahat: ${co}`)
assert.ok(ef > 0.5 && ef < 0.75, `Fraksi ejeksi di luar kisaran normal: ${ef}`)
assert.ok(caO2 > 18 && caO2 < 22, `CaO2 harus sekitar 20 mL/dL; dapat ${caO2.toFixed(2)}`)
assert.ok(do2 > 850 && do2 < 1150, `DO2 harus sekitar 1000 mL/menit; dapat ${do2.toFixed(0)}`)
assert.ok(vo2 > 200 && vo2 < 300, `VO2 harus sekitar 250 mL/menit; dapat ${vo2.toFixed(0)}`)
assert.ok(rasioEkstraksiOksigen(vo2, do2) > 0.2 && rasioEkstraksiOksigen(vo2, do2) < 0.32,
  'Ekstraksi oksigen istirahat sekitar 25%.')

// ── 2. Fick dua arah harus bertemu, tepat ──────────────────────────────────
//
// Pemeriksaan paling tajam di berkas ini. Menghitung VO2 dari sebuah curah
// jantung lalu mengembalikan curah jantung dari VO2 itu harus memberi angka
// semula. Tidak ada cara memalsukannya: kesalahan tanda, faktor sepuluh yang
// hilang, atau pembilang dan penyebut yang tertukar semuanya merusak keduanya
// dengan arah yang berbeda.
{
  const kembali = curahJantungFick(vo2, caO2, cvO2)
  assert.ok(dekat(kembali, co), `Fick bolak-balik harus kembali ke ${co}; dapat ${kembali}`)
}
for (const uji of [{ co: 3, hb: 10 }, { co: 8, hb: 18 }, { co: 12.5, hb: 7 }]) {
  const a = kandunganOksigen(uji.hb, 0.97, 90)
  const v = kandunganOksigen(uji.hb, 0.7, 35)
  assert.ok(dekat(curahJantungFick(konsumsiOksigenFick(uji.co, a, v), a, v), uji.co),
    `Fick bolak-balik gagal pada CO=${uji.co}, Hb=${uji.hb}`)
}

// ── 3. Dua jalur menuju ekstraksi harus sepakat ────────────────────────────
//
// O2ER = VO2/DO2, dan juga (CaO2 - CvO2)/CaO2. Keduanya menempuh jalan yang
// berbeda melalui curah jantung -- yang satu memakainya, yang lain
// mencoretnya.
{
  const lewatAliran = rasioEkstraksiOksigen(vo2, do2)
  const lewatKandungan = (caO2 - cvO2) / caO2
  assert.ok(dekat(lewatAliran, lewatKandungan),
    `Dua jalur ekstraksi harus sepakat: ${lewatAliran} vs ${lewatKandungan}`)
  // Curah jantung dicoret, jadi mengubahnya tidak boleh menggeser ekstraksi.
  const co2x = curahJantung(140, sv)
  assert.ok(dekat(rasioEkstraksiOksigen(konsumsiOksigenFick(co2x, caO2, cvO2), hantaranOksigen(co2x, caO2)), lewatKandungan),
    'Ekstraksi tidak boleh bergantung pada curah jantung.')
}

// ── 4. Dua jalur menuju fraksi ejeksi harus sepakat ────────────────────────
{
  const edv = 150, esv = 60
  assert.ok(dekat(fraksiEjeksi(isiSekuncup(edv, esv), edv), (edv - esv) / edv))
}

// ── 5. Suku terlarut kecil tetapi harus ada ────────────────────────────────
//
// Menghapusnya membuat oksigen hiperbarik mustahil dijelaskan: dengan
// hemoglobin jenuh penuh, satu-satunya yang masih bisa naik adalah suku ini.
{
  const jenuh = kandunganOksigen(15, 1, 100)
  const hiperbarik = kandunganOksigen(15, 1, 2000)
  assert.ok(hiperbarik > jenuh, 'Menaikkan PaO2 pada hemoglobin jenuh tetap menambah kandungan.')
  assert.ok(dekat(hiperbarik - jenuh, KELARUTAN_PLASMA * 1900), 'Selisihnya adalah suku terlarut saja.')
  // Anemia berat: kandungan turun sebanding dengan hemoglobin, bukan saturasi.
  assert.ok(dekat(kandunganOksigen(7.5, 0.98, 100) - KELARUTAN_PLASMA * 100,
    (kandunganOksigen(15, 0.98, 100) - KELARUTAN_PLASMA * 100) / 2),
    'Setengah hemoglobin memberi setengah oksigen terikat.')
  assert.ok(dekat(kandunganOksigen(15, 1, 0), HUFNER * 15))
}

// ── 6. Masukan tidak sah menghasilkan NaN, bukan angka yang meyakinkan ─────
assert.ok(Number.isNaN(fraksiEjeksi(70, 0)))
assert.ok(Number.isNaN(rasioEkstraksiOksigen(250, 0)))
assert.ok(Number.isNaN(kandunganOksigen(-1, 0.98, 100)))
// Beda arteri-vena nol berarti tidak ada oksigen yang diambil; curah jantung
// tidak bisa disimpulkan, dan mengembalikan tak hingga akan menyesatkan.
assert.ok(Number.isNaN(curahJantungFick(250, 20, 20)))

console.log('Hemodinamik: rantai rujukan mendarat pada CaO2 20 mL/dL, DO2 ~1000 dan VO2 ~250 dengan ekstraksi 24%; Fick bolak-balik kembali tepat, dan kedua jalur ekstraksi sepakat.')
