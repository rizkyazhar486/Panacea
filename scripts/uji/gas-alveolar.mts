import assert from 'node:assert/strict'
import {
  TETAPAN_GAS, tekananBarometrik, tekananInspirasi, tekananAlveolar,
  selisihAa, selisihAaLazimUsia, deretTerhadapPaco2, deretTerhadapKetinggian,
} from '../../src/lib/gasAlveolar.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Kemiringan terhadap PaCO2 adalah -1/R, PERSIS, dan bebas FiO2 ───────
//
// Inilah invarian utamanya. Panel menggambar dua kurva pada FiO2 berbeda dan
// mengklaim keduanya SEJAJAR: yang diubah FiO2 hanyalah tinggi kurva, bukan
// kemiringannya. Kalau klaim itu salah, gambarnya tetap tampak masuk akal.
for (const r of [0.7, 0.8, 1.0]) {
  const kemiringan: number[] = []
  for (const fio2 of [0.21, 0.30, 0.40, 0.60, 1.0]) {
    const a = tekananAlveolar({ fio2, paco2: 40, r })
    const b = tekananAlveolar({ fio2, paco2: 50, r })
    kemiringan.push((b - a) / 10)
    assert.ok(dekat((b - a) / 10, -1 / r, 1e-9), `kemiringan pada FiO2 ${fio2} harus -1/R`)
  }
  const pertama = kemiringan[0]
  for (const k of kemiringan) assert.ok(dekat(k, pertama, 1e-12), 'kemiringan tidak boleh bergantung pada FiO2')
}

// ── 2. Hipoventilasi menurunkan oksigen TANPA melebarkan selisih A-a ───────
//
// Pelajaran klinis yang paling mudah salah dibaca. PaO2 dan PAO2 harus turun
// bersama-sama; kalau selisihnya ikut melebar, panel akan mengajarkan bahwa
// hipoventilasi merusak pertukaran gas, dan itu keliru.
{
  const aa = 10
  let sebelumnya = Infinity
  for (const paco2 of [40, 50, 60, 70, 80]) {
    const pao2A = tekananAlveolar({ fio2: 0.21, paco2 })
    const pao2Arteri = pao2A - aa
    assert.ok(pao2A < sebelumnya, 'PAO2 harus turun saat PaCO2 naik')
    assert.ok(dekat(selisihAa(pao2A, pao2Arteri), aa, 1e-9), 'selisih A-a harus TETAP pada hipoventilasi murni')
    sebelumnya = pao2A
  }
}

// ── 3. Ketinggian menurunkan PAO2 dan juga tidak menyentuh selisih A-a ─────
{
  const deret = deretTerhadapKetinggian(0.21, 40, 5000, 500)
  for (let i = 1; i < deret.length; i += 1) {
    assert.ok(deret[i].pao2 < deret[i - 1].pao2, 'PAO2 harus turun monoton dengan ketinggian')
    assert.ok(deret[i].pio2 < deret[i - 1].pio2, 'PIO2 harus turun monoton dengan ketinggian')
  }
  // Selisih A-a dibentuk dari PAO2 dan PaO2 yang turun bersama-sama.
  const aa = 8
  for (const t of deret) assert.ok(dekat(selisihAa(t.pao2, t.pao2 - aa), aa, 1e-9), 'ketinggian tidak melebarkan A-a')
  assert.ok(dekat(tekananBarometrik(0), TETAPAN_GAS.PATM_LAUT, 1e-6), 'permukaan laut harus 760 mmHg')
  // Kontrol positif angka: Denver (~1609 m) sekitar 630 mmHg.
  const denver = tekananBarometrik(1609)
  assert.ok(denver > 620 && denver < 640, `1609 m harus sekitar 630 mmHg, terbaca ${denver}`)
}

// ── 4. Oksigen tambahan menghapus kepekaan terhadap PaCO2 secara RELATIF ───
//
// Kemiringan mutlaknya sama (lihat 1); yang berubah adalah porsinya terhadap
// PAO2. Itulah alasan fisiologis oksigen menolong pada hipoventilasi.
{
  const jatuhRelatif = (fio2: number) => {
    const a = tekananAlveolar({ fio2, paco2: 40 })
    const b = tekananAlveolar({ fio2, paco2: 80 })
    return (a - b) / a
  }
  assert.ok(jatuhRelatif(0.21) > jatuhRelatif(0.40), 'FiO2 lebih tinggi harus mengurangi jatuh relatif')
  assert.ok(jatuhRelatif(0.40) > jatuhRelatif(1.0), 'monoton terhadap FiO2')
}

// ── 5. Uap air SELALU dikurangi ───────────────────────────────────────────
//
// Melupakan 47 mmHg adalah galat paling lazim pada rumus ini dan menaikkan
// PAO2 udara ruang sekitar 10 mmHg -- cukup untuk tampak benar.
{
  const benar = tekananInspirasi(0.21, 760)
  assert.ok(dekat(benar, 0.21 * 713, 1e-9), 'PIO2 harus memakai Patm - PH2O')
  assert.ok(benar < 0.21 * 760, 'PIO2 harus lebih kecil daripada FiO2 x Patm')
}

// ── 6. Kontrol negatif: masukan mustahil menolak mencetak angka ───────────
assert.ok(Number.isNaN(tekananInspirasi(0, 760)), 'FiO2 nol tidak sah')
assert.ok(Number.isNaN(tekananInspirasi(1.2, 760)), 'FiO2 > 1 tidak sah')
assert.ok(Number.isNaN(tekananInspirasi(-0.1, 760)), 'FiO2 negatif tidak sah')
assert.ok(Number.isNaN(tekananInspirasi(0.21, 40)), 'Patm di bawah tekanan uap air tidak sah')
assert.ok(Number.isNaN(tekananAlveolar({ fio2: 0.21, paco2: -1 })), 'PaCO2 negatif tidak sah')
assert.ok(Number.isNaN(tekananAlveolar({ fio2: 0.21, paco2: 40, r: 0 })), 'R nol tidak sah')
assert.ok(Number.isNaN(tekananBarometrik(-100)), 'ketinggian negatif tidak sah')
assert.ok(Number.isNaN(selisihAa(100, 120)), 'PaO2 melampaui PAO2 harus ditolak, bukan dicetak negatif')
assert.ok(Number.isNaN(selisihAaLazimUsia(-1)), 'usia negatif tidak sah')

// ── 7. PAO2 dijepit di nol, tidak pernah negatif ──────────────────────────
{
  const ekstrem = tekananAlveolar({ fio2: 0.21, paco2: 400 })
  assert.ok(ekstrem === 0, `PaCO2 ekstrem harus memberi nol, terbaca ${ekstrem}`)
  for (const t of deretTerhadapPaco2(0.21, 20, 300, 5)) {
    assert.ok(t.pao2 >= 0, 'kurva tidak boleh menembus sumbu')
  }
}

// ── 8. Rujukan usia naik dengan usia dan tetap sekadar rujukan ────────────
{
  assert.ok(selisihAaLazimUsia(20) < selisihAaLazimUsia(70), 'rujukan harus naik dengan usia')
  assert.ok(dekat(selisihAaLazimUsia(20), 9, 1e-9), 'usia 20 memberi 9 mmHg')
}

// ── 9. Kontrol positif angka: udara ruang normal ──────────────────────────
{
  const pao2 = tekananAlveolar({ fio2: 0.21, paco2: 40 })
  assert.ok(pao2 > 99 && pao2 < 100, `udara ruang PaCO2 40 harus sekitar 99.7 mmHg, terbaca ${pao2}`)
}

console.log('OK gas-alveolar: kemiringan -1/R bebas FiO2, hipoventilasi dan ketinggian tidak melebarkan A-a')
