import assert from 'node:assert/strict'
import {
  phDariBikarbonat, bikarbonatDariPh, celahAnion, celahAnionTerkoreksi, rasioDelta,
  gangguanUtama, kompensasiDiharapkan, tafsirkan, TETAPAN,
} from '../../src/lib/asamBasa.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Gas darah normal harus MENDARAT pada pH 7,4 ─────────────────────────
//
// 24 mmol/L dan 40 mmHg adalah pasangan buku teks. Kalau tetapan kelarutan
// hilang dari penyebut, pH melompat ke ~8,9 dan uji ini gagal seketika.
{
  const ph = phDariBikarbonat({ bikarbonat: 24, paco2: 40 })
  assert.ok(dekat(ph, 7.4, 0.01), `pH normal harus 7,40; dapat ${ph.toFixed(3)}`)
  assert.equal(gangguanUtama({ bikarbonat: 24, paco2: 40 }), 'normal')
}

// ── 2. Bolak-balik Henderson-Hasselbalch harus tepat ───────────────────────
//
// Ini juga persamaan yang MENGGAMBAR isobar. Kalau kurva dan angka berasal
// dari dua sumber, gambar bisa berbohong tanpa satu uji pun gagal; karena itu
// keduanya satu fungsi dan inversinya diuji di seluruh bidang yang digambar.
for (const paco2 of [20, 30, 40, 60, 80]) {
  for (const hco3 of [8, 14, 24, 32, 40]) {
    const ph = phDariBikarbonat({ bikarbonat: hco3, paco2 })
    const kembali = bikarbonatDariPh(ph, paco2)
    assert.ok(dekat(kembali, hco3, 1e-9), `Isobar ${paco2}: ${hco3} -> pH ${ph} -> ${kembali}`)
  }
}

// ── 3. Isobar harus monoton naik dan tidak pernah berpotongan ──────────────
//
// Dua isobar PaCO2 yang bersilangan berarti satu titik pH-bikarbonat mewakili
// dua PaCO2 sekaligus, dan diagramnya tidak bermakna. Ini menguji gambarnya,
// bukan sekadar aritmetikanya.
{
  let sebelumnya = -Infinity
  for (const ph of [7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7]) {
    const rendah = bikarbonatDariPh(ph, 20)
    const tinggi = bikarbonatDariPh(ph, 80)
    assert.ok(tinggi > rendah, `PaCO2 tinggi harus di atas PaCO2 rendah pada pH ${ph}`)
    assert.ok(rendah > sebelumnya, `Isobar harus naik terhadap pH di ${ph}`)
    sebelumnya = rendah
  }
}

// ── 4. Kelarutan CO2 adalah satu-satunya jembatan ke PaCO2 ─────────────────
//
// Menggandakan PaCO2 pada bikarbonat tetap harus menurunkan pH tepat log10(2).
{
  const a = phDariBikarbonat({ bikarbonat: 24, paco2: 40 })
  const b = phDariBikarbonat({ bikarbonat: 24, paco2: 80 })
  assert.ok(dekat(a - b, Math.log10(2), 1e-12), `Selisih harus log10(2); dapat ${a - b}`)
  assert.equal(TETAPAN.kelarutanCo2, 0.03)
}

// ── 5. Celah anion dan koreksi albumin ─────────────────────────────────────
//
// Hipoalbuminemia menyembunyikan asidosis celah-lebar. Kasus ini normal saat
// mentah dan lebar setelah dikoreksi -- persis kegagalan yang dikoreksi untuk.
{
  const normal = { natrium: 140, klorida: 104, bikarbonat: 24, albumin: 4.0 }
  assert.ok(dekat(celahAnion(normal), 12), `AG normal harus 12; dapat ${celahAnion(normal)}`)
  assert.ok(dekat(celahAnionTerkoreksi(normal), 12), 'Albumin 4,0 tidak boleh menggeser koreksi')

  const hipoalbumin = { natrium: 140, klorida: 112, bikarbonat: 16, albumin: 2.0 }
  assert.ok(dekat(celahAnion(hipoalbumin), 12), 'AG mentah tampak normal')
  assert.ok(celahAnionTerkoreksi(hipoalbumin) > 15, 'AG terkoreksi harus mengungkap celah lebar')
}

// ── 6. Rasio delta memisahkan campuran, dan tak terdefinisi saat tak berlaku ─
{
  // Celah lebar murni: AG naik 12, bikarbonat turun 12 -> rasio 1.
  const murni = { natrium: 140, klorida: 104, bikarbonat: 12, albumin: 4.0 }
  assert.ok(dekat(rasioDelta(murni), 1), `Rasio delta harus 1; dapat ${rasioDelta(murni)}`)

  // Hiperkloremik: bikarbonat turun tanpa AG naik -> rasio 0.
  const hiperkloremik = { natrium: 140, klorida: 116, bikarbonat: 12, albumin: 4.0 }
  assert.ok(rasioDelta(hiperkloremik) < 0.4, 'Asidosis hiperkloremik harus memberi rasio rendah')

  // Bikarbonat tidak turun: rasionya tidak punya arti, dan harus BILANG begitu
  // alih-alih membagi dengan nol dan mencetak Infinity di layar.
  assert.ok(Number.isNaN(rasioDelta({ natrium: 140, klorida: 104, bikarbonat: 24, albumin: 4.0 })))
}

// ── 7. Winter: kompensasi yang pas dan yang tidak ──────────────────────────
{
  // Asidosis metabolik, bikarbonat 12 -> PaCO2 diharapkan 26 +/- 2.
  const terkompensasi = tafsirkan({ bikarbonat: 12, paco2: 26 })
  assert.equal(terkompensasi.gangguan, 'asidosis-metabolik')
  assert.equal(terkompensasi.sesuaiKompensasi, true)

  // PaCO2 40 pada bikarbonat 12 bukan "normal": paru tidak ikut bekerja, dan
  // itu asidosis respiratorik yang menyertai.
  const gagalKompensasi = tafsirkan({ bikarbonat: 12, paco2: 40 })
  assert.equal(gagalKompensasi.sesuaiKompensasi, false)

  const rentang = kompensasiDiharapkan('asidosis-metabolik', { bikarbonat: 12, paco2: 26 })
  assert.ok(rentang && dekat(rentang.bawah, 24) && dekat(rentang.atas, 28), 'Rentang Winter salah')
}

// ── 8. Akut dan kronik BERBEDA, dan kronik selalu mengembalikan lebih jauh ──
//
// Satu angka untuk keduanya akan menandai PPOK stabil sebagai gangguan
// campuran setiap kali.
{
  const g = { bikarbonat: 30, paco2: 60 }
  const akut = kompensasiDiharapkan('asidosis-respiratorik', g, true)
  const kronik = kompensasiDiharapkan('asidosis-respiratorik', g, false)
  assert.ok(akut && kronik)
  assert.ok(kronik.bawah > akut.atas, 'Kompensasi kronik harus jelas di atas akut')
  assert.ok(dekat(akut.bawah + 2, 26), `Akut harus berpusat di 26; dapat ${akut.bawah + 2}`)
  assert.ok(dekat(kronik.bawah + 2, 32), `Kronik harus berpusat di 32; dapat ${kronik.bawah + 2}`)
}

// ── 9. Kompensasi tidak pernah melampaui gangguannya ───────────────────────
//
// Invarian, bukan regresi: tidak ada kompensasi yang menyeberangkan pH ke sisi
// lain. Kalau aturannya ditulis dengan tanda terbalik, ini yang menangkapnya.
for (const paco2 of [50, 60, 70, 80]) {
  const rentang = kompensasiDiharapkan('asidosis-respiratorik', { bikarbonat: 24, paco2 }, false)
  assert.ok(rentang)
  const ph = phDariBikarbonat({ bikarbonat: (rentang.bawah + rentang.atas) / 2, paco2 })
  assert.ok(ph < 7.42, `Kompensasi PaCO2 ${paco2} menyeberangkan pH ke ${ph.toFixed(3)}`)
}
for (const paco2 of [20, 25, 30, 35]) {
  const rentang = kompensasiDiharapkan('alkalosis-respiratorik', { bikarbonat: 24, paco2 }, false)
  assert.ok(rentang)
  const ph = phDariBikarbonat({ bikarbonat: (rentang.bawah + rentang.atas) / 2, paco2 })
  assert.ok(ph > 7.38, `Kompensasi PaCO2 ${paco2} menyeberangkan pH ke ${ph.toFixed(3)}`)
}

console.log(
  'Asam-basa: gas normal mendarat pada pH 7,40, isobar Davenport adalah inversi tepat dari pH ' +
  'yang ditampilkan dan tidak pernah berpotongan, koreksi albumin mengungkap celah lebar yang ' +
  'tersembunyi, rasio delta menolak membagi dengan nol, dan tidak ada aturan kompensasi yang ' +
  'menyeberangkan pH.',
)
