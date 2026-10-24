// C6 (bagian rekayasa), tahap 12: ambang yang MENGUBAH LABEL ATAU SKOR. Sapuan mutasi (docs/governance/CALCULATOR_MUTATION_SWEEP.md) menemukan
// bahwa suite sebelumnya tidak mengunci tepi pita GRACE (108/140), pita NEWS2 (total >= 1), ambang interpretasi MAP (60/100), kondisi MELD-Na
// (meld > 11), pagar MELD (6/40), batas atas kelas Killip (3), dan penjaga "tepat satu kolom kosong" pada GRACE. Suite ini mengunci semuanya.
// Nilai ambang ditulis ulang sebagai literal di sini: mengubah mesin tidak boleh ikut mengubah acuan. Rumus MELD-Na ditulis TERPISAH dari
// mesin. Bukti rekayasa bahwa ambang yang sekarang ada terkunci, BUKAN tinjauan klinis atau pernyataan bahwa ambangnya benar.
import assert from 'node:assert/strict'
import { close } from './support/calculatorHarness.mts'
import {
  DIASTOLIC_MMHG, SYSTOLIC_MMHG, graceBand, graceScore, meanArterialPressure, meldNa, news2Band,
} from '../../src/domains/clinical-calculators/index.ts'

// ── GRACE: pita risiko. Rendah <= 108, menengah 109..140, tinggi >= 141 (setiap bilangan bulat diperiksa, bukan hanya tepinya).
for (let score = 0; score <= 400; score++) {
  const label = score <= 108 ? 'Low risk' : score <= 140 ? 'Intermediate risk' : 'High risk'
  const tone = score <= 108 ? 'brand' : score <= 140 ? 'low' : 'critical'
  const band = graceBand(score)
  assert.equal(band.label, label, `GRACE ${score}`)
  assert.equal(band.tone, tone, `GRACE tone ${score}`)
}
assert.equal(graceBand(108).label, 'Low risk')
assert.equal(graceBand(109).label, 'Intermediate risk', 'pasangan: hanya 108 -> 109 yang berbeda')
assert.equal(graceBand(140).label, 'Intermediate risk')
assert.equal(graceBand(141).label, 'High risk', 'pasangan: hanya 140 -> 141 yang berbeda')

// ── GRACE: batas atas kelas Killip dan penjaga kolom kosong.
const G = { age: 60, hr: 80, sbp: 120, creat: 1.0, killip: 0, arrest: false, stDev: false, markers: false }
const grace = (over: Record<string, unknown>) => graceScore({ ...G, ...over } as typeof G)
assert.equal(grace({ killip: 3 }).invalid.length, 0, 'Killip 3 diterima')
assert.deepEqual(grace({ killip: 4 }).invalid, ['Killip class must be 0–3'], 'Killip 4 ditolak dengan alasan bernama')
assert.deepEqual(grace({ killip: -1 }).invalid, ['Killip class must be 0–3'])
assert.deepEqual(grace({ killip: 1.5 }).invalid, ['Killip class must be 0–3'], 'bukan bilangan bulat ditolak')
assert.equal(grace({ killip: 4 }).score, null, 'masukan tidak sah tidak menghasilkan skor')
// Tepat SATU kolom kosong (bukan nol, bukan dua): tidak boleh lolos menjadi skor.
const oneMissing = grace({ age: Number.NaN })
assert.equal(oneMissing.missing.length, 1, 'tepat satu kolom kosong dilaporkan')
assert.deepEqual(oneMissing.invalid, [], 'kolom kosong bukan masukan tidak sah')
assert.equal(oneMissing.score, null, 'satu kolom kosong tidak boleh menghasilkan skor')
assert.equal(oneMissing.band, null)
assert.equal(grace({}).missing.length, 0, 'pasangan: tanpa kolom kosong, tidak ada yang hilang')
assert.notEqual(grace({}).score, null, 'pasangan: masukan lengkap menghasilkan skor')

// ── NEWS2: pita. >= 7 tinggi; >= 5 atau ada satu parameter bernilai 3 menengah; >= 1 rendah-menengah; 0 rendah.
for (let total = 0; total <= 20; total++) {
  for (const anyThree of [false, true]) {
    const label = total >= 7 ? 'High risk' : total >= 5 || anyThree ? 'Medium risk' : total >= 1 ? 'Low-medium risk' : 'Low risk'
    assert.equal(news2Band(total, anyThree).label, label, `NEWS2 total=${total} anyThree=${anyThree}`)
  }
}
assert.equal(news2Band(0, false).label, 'Low risk')
assert.equal(news2Band(1, false).label, 'Low-medium risk', 'pasangan: hanya 0 -> 1 yang berbeda')
assert.equal(news2Band(4, false).label, 'Low-medium risk')
assert.equal(news2Band(5, false).label, 'Medium risk', 'pasangan: hanya 4 -> 5 yang berbeda')
assert.equal(news2Band(4, true).label, 'Medium risk', 'satu parameter 3 menaikkan pita')
assert.equal(news2Band(6, false).label, 'Medium risk')
assert.equal(news2Band(7, false).label, 'High risk', 'pasangan: hanya 6 -> 7 yang berbeda')

// ── MAP = (S + 2D) / 3. < 60 sangat rendah; <= 100 normal; di atasnya tinggi. Rentang masukan dipaku sebagai literal.
assert.deepEqual({ ...SYSTOLIC_MMHG }, { min: 40, max: 300 })
assert.deepEqual({ ...DIASTOLIC_MMHG }, { min: 20, max: 200 })
const map = (s: number, d: number) => meanArterialPressure(s, d)
const label = (s: number, d: number) => { const r = map(s, d); return r.ok ? r.data.label : `ditolak: ${r.reason}` }
assert.equal(label(100, 40), 'Normal', 'MAP tepat 60 adalah Normal (bukan < 60)')
assert.equal(label(99, 40), 'Very low', 'pasangan: MAP 59,67 sangat rendah')
assert.equal(label(140, 80), 'Normal', 'MAP tepat 100 adalah Normal (<= 100)')
assert.equal(label(141, 80), 'High', 'pasangan: MAP 100,33 tinggi')
{
  const r = map(120, 80)
  assert.ok(r.ok && Math.abs(r.data.map - (120 + 160) / 3) < 1e-12, 'nilai emas 120/80 -> 93,33')
}
// Batas rentang: tepat di batas diterima, satu langkah di luar ditolak dengan alasan bernama.
assert.equal(map(300, 100).ok, true, 'sistolik 300 diterima')
assert.equal(label(301, 100), 'ditolak: Systolic must be 40–300 mmHg')
assert.equal(map(40, 20).ok, true, 'sistolik 40 / diastolik 20 diterima')
assert.equal(label(39, 20), 'ditolak: Systolic must be 40–300 mmHg')
assert.equal(map(300, 200).ok, true, 'diastolik 200 diterima')
assert.equal(label(300, 201), 'ditolak: Diastolic must be 20–200 mmHg')
assert.equal(label(100, 19), 'ditolak: Diastolic must be 20–200 mmHg')
for (const bad of [Number.NaN, Infinity, -Infinity, -5]) {
  assert.equal(map(bad, 80).ok, false, `sistolik ${bad} ditolak`)
  assert.equal(map(120, bad).ok, false, `diastolik ${bad} ditolak`)
}
assert.equal(label(80, 80), 'ditolak: Systolic must be higher than diastolic', 'tekanan nadi nol ditolak')

// ── MELD-Na: acuan terpisah dari mesin (Kim 2008 / kebijakan OPTN 2016, seperti dijelaskan di dokumentasi mesin).
const meldRef = (bili: number, inr: number, cr: number, na: number, dialysis: boolean) => {
  const b = Math.max(bili, 1), i = Math.max(inr, 1), c = dialysis ? 4 : Math.min(Math.max(cr, 1), 4), n = Math.min(Math.max(na, 125), 137)
  const meld = Math.min(Math.max(3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43, 6), 40)
  const adjusted = meld > 11 ? meld + 1.32 * (137 - n) - 0.033 * meld * (137 - n) : meld
  return { meld, meldNa: Math.min(Math.max(adjusted, 6), 40) }
}
const meldCase = (bili: number, inr: number, cr: number, na: number, dialysis = false) => {
  const r = meldNa({ bilirubin: bili, inr, creatinine: cr, sodium: na, dialysis })
  const e = meldRef(bili, inr, cr, na, dialysis)
  assert.notEqual(r.meld, null, `MELD ${bili},${inr},${cr},${na}`)
  close(r.meld as number, e.meld, `meld ${bili},${inr},${cr},${na}`)
  close(r.meldNa as number, e.meldNa, `meldNa ${bili},${inr},${cr},${na}`)
  return e
}
// Koreksi natrium hanya bila MELD > 11: satu kasus tepat DI ATAS 11 (11 < meld < 12) dan satu tepat DI BAWAH (10 < meld < 11), natrium 125.
{
  const above = meldCase(2, 1.2, 1, 125)
  assert.ok(above.meld > 11 && above.meld < 12, `kasus di atas ambang harus 11 < meld < 12, dapat ${above.meld}`)
  assert.ok(above.meldNa - above.meld > 10, 'MELD > 11 dengan natrium 125 DIKOREKSI naik')
  const below = meldCase(1.5, 1.2, 1, 125)
  assert.ok(below.meld > 10 && below.meld < 11, `kasus di bawah ambang harus 10 < meld < 11, dapat ${below.meld}`)
  assert.equal(below.meldNa, below.meld, 'MELD <= 11 TIDAK dikoreksi natrium meski natrium 125')
}
// Pagar: nilai laboratorium minimum -> MELD 6,43 (lantai rumus; pagar bawah 6 tidak mengikat tetapi 7 akan terlihat); sangat tinggi -> 40.
{
  const low = meldCase(1, 1, 1, 137)
  close(low.meld, 6.43, 'MELD minimum rumus')
  const r = meldNa({ bilirubin: 1, inr: 1, creatinine: 1, sodium: 137, dialysis: false })
  close(r.meld as number, 6.43, 'mesin: MELD minimum 6,43 (bukan dibulatkan ke 7)')
  close(r.meldNa as number, 6.43, 'mesin: MELD-Na minimum 6,43')
  const high = meldCase(60, 10, 20, 100)
  assert.equal(high.meld, 40, 'acuan: MELD dipagari 40')
  const rh = meldNa({ bilirubin: 60, inr: 10, creatinine: 20, sodium: 100, dialysis: false })
  assert.equal(rh.meld, 40, 'mesin: MELD dipagari tepat 40 (bukan 41)')
  assert.equal(rh.meldNa, 40, 'mesin: MELD-Na dipagari 40')
}
// Pita prioritas pada skor yang dihasilkan, dan dialisis mematok kreatinin 4,0.
meldCase(3, 2, 2, 130)
meldCase(10, 3, 1, 137, true)
assert.deepEqual(meldNa({ bilirubin: 1, inr: 1, creatinine: Number.NaN, sodium: 137, dialysis: false }).missing, ['creatinine'], 'kreatinin kosong dilaporkan, tidak diganti 1,0')
assert.equal(meldNa({ bilirubin: 1, inr: 1, creatinine: Number.NaN, sodium: 137, dialysis: true }).missing.length, 0, 'pasangan: dengan dialisis kreatinin tidak diminta')
assert.equal(meldNa({ bilirubin: 1, inr: 1, creatinine: 1, sodium: 99, dialysis: false }).meldNa, null, 'natrium di luar 100-180 ditolak')
assert.equal(meldNa({ bilirubin: 1, inr: 1, creatinine: 1, sodium: 100, dialysis: false }).meldNa === null, false, 'natrium 100 diterima')
// determinisme
assert.deepEqual(meldNa({ bilirubin: 2, inr: 1.2, creatinine: 1, sodium: 125, dialysis: false }), meldNa({ bilirubin: 2, inr: 1.2, creatinine: 1, sodium: 125, dialysis: false }))

console.log('calculator-independent-reference-12: GRACE (pita 108/140 setiap bilangan bulat, Killip 0-3, satu kolom kosong), NEWS2 (pita setiap total 0-20), MAP (ambang 60/100 dan rentang), MELD-Na (kondisi > 11, pagar 6/40, dialisis) terkunci terhadap acuan terpisah')
