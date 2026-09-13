import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  TETAPAN_TERMO, tekananUapJenuh, pertukaranKering, kapasitasPenguapan,
  neracaPanas, lajuSuhuInti, deretKelembapan, deretSuhuUdara, kelembapanKritis,
} from '../../src/lib/termoregulasi.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Kelembapan SENDIRIAN memindahkan neraca dari tunak ke tidak tunak ──
//
// Invarian utama panel ini. Suhu udara dan produksi panas dipegang tetap; yang
// bergerak hanya kelembapan. Kalau klaim ini salah, kurvanya tetap tampak
// masuk akal dan seluruh pelajarannya hilang.
{
  const suhu = 34
  const M = 400
  const awal = neracaPanas({ suhuUdara: suhu, kelembapan: 20, metabolik: M })
  const akhir = neracaPanas({ suhuUdara: suhu, kelembapan: 95, metabolik: M })
  assert.ok(awal.tunak, 'pada udara kering neraca ini harus bisa tunak')
  assert.ok(!akhir.tunak, 'pada udara hampir jenuh neraca yang sama TIDAK boleh tunak')
  assert.ok(akhir.penguapanMaks < awal.penguapanMaks, 'kapasitas penguapan harus runtuh dengan kelembapan')
  assert.ok(akhir.simpanan > 0 && awal.simpanan <= 0, 'hanya kelembapan yang berubah, hasilnya berbalik')
}

// ── 2. Kapasitas penguapan turun MONOTON terhadap kelembapan ─────────────
{
  let sebelumnya = Infinity
  for (const t of deretKelembapan(35, 300)) {
    assert.ok(t.penguapanMaks <= sebelumnya + 1e-9, `kapasitas naik pada RH ${t.x}`)
    sebelumnya = t.penguapanMaks
  }
  // Dan nol ketika udara sama jenuhnya dengan kulit.
  assert.ok(dekat(kapasitasPenguapan(TETAPAN_TERMO.SUHU_KULIT, 100), 0, 1e-9),
    'udara jenuh pada suhu kulit tidak menyisakan kapasitas penguapan')
}

// ── 3. Pertukaran kering BERBALIK TANDA di atas suhu kulit ───────────────
//
// Di atas suhu kulit, radiasi dan konveksi berhenti membuang panas dan mulai
// MENAMBAHKANNYA. Itu pembalikan tanda, bukan pengecilan.
{
  assert.ok(pertukaranKering(25) > 0, 'udara sejuk harus membuang panas')
  assert.ok(dekat(pertukaranKering(TETAPAN_TERMO.SUHU_KULIT), 0, 1e-9), 'pada suhu kulit tidak ada gradien')
  assert.ok(pertukaranKering(40) < 0, 'di atas suhu kulit tubuh justru MENYERAP panas')
}

// ── 4. Penguapan tidak pernah melampaui kebutuhan maupun kapasitas ──────
{
  for (const rh of [0, 25, 50, 75, 100]) {
    for (const M of [100, 300, 600]) {
      const n = neracaPanas({ suhuUdara: 30, kelembapan: rh, metabolik: M })
      assert.ok(n.penguapan <= n.penguapanMaks + 1e-9, 'penguapan melampaui kapasitasnya')
      assert.ok(n.penguapan >= 0, 'penguapan negatif')
      const perlu = Math.max(0, n.produksi - n.kering)
      assert.ok(n.penguapan <= perlu + 1e-9, 'tubuh menguapkan lebih daripada yang perlu dibuang')
      // Neraca harus tertutup persis.
      assert.ok(dekat(n.simpanan, n.produksi - n.kering - n.penguapan, 1e-9), 'neraca tidak tertutup')
    }
  }
}

// ── 4b. Panel MEMBACA neracanya, tidak menyusun ulang fisikanya ─────────
//
// Versi pertama panel ini menghitung sendiri garis "panas yang harus dibuang"
// dengan menyusun ulang pertukaran kering secara inline. Dua salinan fisika
// yang sama berarti gambarnya bisa diam-diam tidak sepakat dengan setiap angka
// di sebelahnya, sementara SELURUH uji di berkas ini tetap lulus -- karena uji
// di sini menguji pustakanya, bukan gambarnya.
//
// Itu persis kegagalan yang dijaga di seluruh repositori ini, dan satu-satunya
// cara menangkapnya adalah membaca sumber panelnya.
{
  const panel = readFileSync('src/pages/bodyhub/TermoregulasiPanel.tsx', 'utf8')
  assert.ok(
    !/H_KERING\s*\*/.test(panel) && !/H_BASAH\s*\*/.test(panel),
    'the panel re-implements the heat-exchange physics inline; it must read neracaPanas() ' +
    'instead, or the picture can disagree with the numbers beside it while every test passes',
  )
  assert.ok(panel.includes('perluDiuapkan'), 'the panel must take the dashed line from the balance itself')
}

// ── 4c. perluDiuapkan konsisten dengan bagian lain neracanya ───────────
{
  for (const suhu of [20, 30, 34, 40, 45]) {
    for (const M of [100, 400, 800]) {
      const n = neracaPanas({ suhuUdara: suhu, kelembapan: 50, metabolik: M })
      assert.ok(dekat(n.perluDiuapkan, Math.max(0, n.produksi - n.kering), 1e-9),
        'perluDiuapkan harus sama dengan sisa setelah pertukaran kering')
      assert.ok(n.perluDiuapkan >= 0, 'panas yang harus diuapkan tidak pernah negatif')
      assert.ok(n.penguapan <= n.perluDiuapkan + 1e-9, 'penguapan tidak melampaui yang perlu dibuang')
    }
  }
  assert.ok(Number.isNaN(neracaPanas({ suhuUdara: 30, kelembapan: 50, metabolik: -1 }).perluDiuapkan),
    'masukan tidak sah harus merambat ke medan ini juga')
}

// ── 5. Kerja mengurangi panas, tidak menambahnya ─────────────────────────
{
  const tanpa = neracaPanas({ suhuUdara: 30, kelembapan: 50, metabolik: 500 })
  const dengan = neracaPanas({ suhuUdara: 30, kelembapan: 50, metabolik: 500, kerja: 100 })
  assert.ok(dengan.produksi < tanpa.produksi, 'kerja eksternal membawa energi keluar sebagai kerja')
  assert.ok(dekat(dengan.produksi, 400, 1e-9))
}

// ── 6. Ambang kritis dihitung dari neraca yang SAMA dengan kurvanya ──────
{
  const suhu = 34, M = 400
  const kritis = kelembapanKritis(suhu, M)
  assert.ok(kritis !== null, 'pada beban ini harus ada ambang')
  assert.ok(neracaPanas({ suhuUdara: suhu, kelembapan: kritis!, metabolik: M }).tunak === false,
    'tepat di ambang neracanya sudah tidak tunak')
  assert.ok(neracaPanas({ suhuUdara: suhu, kelembapan: kritis! - 0.5, metabolik: M }).tunak === true,
    'tepat di bawah ambang neracanya masih tunak')
  // Beban lebih berat harus menurunkan ambangnya.
  const kritisBerat = kelembapanKritis(suhu, 700)
  assert.ok(kritisBerat !== null && kritisBerat < kritis!, 'beban lebih berat harus mengambang lebih cepat')
  // Udara sejuk: tidak ada ambang sama sekali.
  assert.equal(kelembapanKritis(18, 200), null, 'pada udara sejuk dan beban ringan tidak ada ambang')
}

// ── 7. Laju suhu inti mengikuti massa, dan arahnya benar ────────────────
{
  assert.ok(lajuSuhuInti(200, 70) > 0, 'simpanan positif harus menaikkan suhu')
  assert.ok(lajuSuhuInti(-200, 70) < 0, 'simpanan negatif harus menurunkannya')
  assert.ok(lajuSuhuInti(200, 50) > lajuSuhuInti(200, 100), 'massa lebih kecil memanas lebih cepat')
  assert.ok(dekat(lajuSuhuInti(0, 70), 0, 1e-12), 'tanpa simpanan tidak ada perubahan')
  // Kontrol positif angka, dihitung ulang dari tetapannya:
  // 200 W / (70 kg x 3470 J/(kg·K)) x 3600 s = 2.96 °C/jam. Itu besaran yang
  // masuk akal untuk tekanan panas yang tidak terkompensasi -- beberapa derajat
  // dalam satu jam, bukan sepersepuluh derajat.
  const laju = lajuSuhuInti(200, 70)
  assert.ok(laju > 2.9 && laju < 3.0, `200 W pada 70 kg harus sekitar 2.96 °C/jam, terbaca ${laju}`)
}

// ── 8. Tekanan uap jenuh: kontrol positif terhadap nilai terukur ────────
{
  assert.ok(Math.abs(tekananUapJenuh(0) - 0.611) < 0.01, '0 °C harus sekitar 0.611 kPa')
  assert.ok(Math.abs(tekananUapJenuh(100) - 101.3) < 3, '100 °C harus mendekati tekanan atmosfer')
  assert.ok(Math.abs(tekananUapJenuh(37) - 6.28) < 0.1, '37 °C harus sekitar 6.28 kPa')
  assert.ok(tekananUapJenuh(40) > 2 * tekananUapJenuh(20), 'bentuknya eksponensial, bukan linear')
}

// ── 9. Kontrol negatif: masukan mustahil menolak mencetak angka ─────────
assert.ok(Number.isNaN(kapasitasPenguapan(30, -1)), 'kelembapan negatif tidak sah')
assert.ok(Number.isNaN(kapasitasPenguapan(30, 101)), 'kelembapan di atas 100 % tidak sah')
assert.ok(Number.isNaN(kapasitasPenguapan(30, 50, 0)), 'luas nol tidak sah')
assert.ok(Number.isNaN(neracaPanas({ suhuUdara: 30, kelembapan: 50, metabolik: -1 }).simpanan), 'metabolik negatif tidak sah')
assert.ok(Number.isNaN(neracaPanas({ suhuUdara: 30, kelembapan: 50, metabolik: 100, kerja: 200 }).simpanan),
  'kerja melampaui metabolisme tidak sah')
assert.ok(Number.isNaN(lajuSuhuInti(100, 0)), 'massa nol tidak sah')
assert.ok(Number.isNaN(tekananUapJenuh(Number.NaN)), 'NaN masuk, NaN keluar')

// ── 10. Kapasitas tidak pernah negatif walau udara lebih lembap dari kulit ─
{
  for (const t of deretSuhuUdara(100, 300)) {
    assert.ok(t.penguapanMaks >= 0, `kapasitas negatif pada ${t.x} °C`)
  }
}

{
  const suhu = 34, M = 400
  console.log(
    `OK termoregulasi: pada ${suhu} °C dan ${M} W, neracanya berhenti tunak di ` +
    `RH ${kelembapanKritis(suhu, M)} % -- hanya kelembapan yang berubah; ` +
    'pertukaran kering berbalik tanda di atas suhu kulit, dan penguapan tidak pernah ' +
    'melampaui kebutuhan maupun kapasitasnya.',
  )
}
