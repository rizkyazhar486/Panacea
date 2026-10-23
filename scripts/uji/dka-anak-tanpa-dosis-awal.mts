import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pediatricDka } from '../../src/domains/clinical-calculators/index.ts'

// ─────────────────────────────────────────────────────────────────────────────
// HALAMAN INI MENGELUARKAN DOSIS, BUKAN SKOR.
//
// Kalkulator DKA anak dahulu terbuka pada berat 18 kg -- seorang anak sekitar
// empat tahun yang tidak ada -- dengan dehidrasi 10% dan kalium 3,5 mEq/L.
// Dari ketiganya ia langsung mencetak laju infus dalam mL/jam, laju insulin
// dalam unit/jam IV, satu pita kalium yang dapat berbunyi "hold insulin
// until K rechecked", dan sebuah ringkasan siap salin yang berbentuk lembar
// kerja DKA yang sudah selesai diisi.
//
// Yang membedakannya dari seluruh berkas uji sebelumnya: di sini yang salah
// bukan sebuah label risiko melainkan sebuah ANGKA YANG DIBERIKAN KEPADA
// PASIEN.
// ─────────────────────────────────────────────────────────────────────────────

const src = readFileSync(new URL('../../src/pages/clinical/scores/PediatricDkaCalculator.tsx', import.meta.url), 'utf8')
const engineSrc = readFileSync(new URL('../../src/domains/clinical-calculators/engine/pediatricDka.ts', import.meta.url), 'utf8')
const engineKode = engineSrc.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*') && !b.trim().startsWith('/*')).join('\n')
const kode = src.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── 1. Berat, dehidrasi dan kalium dimulai kosong ──────────────────────────
assert.ok(!/useState\(18\)/.test(kode), 'the 18 kg starting weight is back')
assert.ok(!/useState\(10\)/.test(kode), 'the 10% dehydration default is back')
assert.ok(!/useState\(3\.5\)/.test(kode), 'the 3.5 mEq/L potassium default is back')
assert.ok(/const bisaCairan = hasil\.fluids !== null/.test(kode), 'the page no longer gates fluids on the engine result')
// Perilaku mesin (lebih kuat dari pola teks): berat/dehidrasi kosong → tidak ada cairan, tidak ada U/jam.
const kosongDka = pediatricDka({ weightKg: NaN, dehydrationPct: NaN, potassiumMeq: NaN, insulinRateUKgHr: 0.05, shock: false })
assert.equal(kosongDka.fluids, null, 'fluids were produced from an empty weight/dehydration')
assert.equal(kosongDka.insulinUHr, null, 'U/hr was produced without a weight')
assert.deepEqual(kosongDka.missing, ['weight', 'dehydration estimate'])

// ── 2. Tidak ada volume, laju, atau unit tanpa berat dan dehidrasi ─────────
assert.ok(/\{bisaCairan \?/.test(src), 'volumes and the mL/hr rate are not gated on having a weight')
assert.ok(/U\/hr cannot be shown without a weight/.test(src),
  'U/hr is printed again without a weight to multiply by')

// ── 3. Pita kalium tidak boleh ada tanpa kalium ────────────────────────────
// band(0) dahulu menjawab "Hypokalemic -- hold insulin until K rechecked":
// kolom kosong ditampilkan sebagai perintah menahan insulin.
assert.equal(pediatricDka({ weightKg: 18, dehydrationPct: 10, potassiumMeq: NaN, insulinRateUKgHr: 0.05, shock: false }).kBand, null,
  'an empty potassium field is banded again — as "hypokalemic, hold insulin"')
assert.equal(pediatricDka({ weightKg: 18, dehydrationPct: 10, potassiumMeq: 0, insulinRateUKgHr: 0.05, shock: false }).kBand, null,
  'potassium 0 is banded as a measurement')
assert.ok(/kBand !== null/.test(src), 'the potassium badge is not gated on a measured value')

// ── 4. Lembar kerja siap salin butuh keduanya ──────────────────────────────
assert.ok(/\{bisaCairan && adaKalium && <div className="mt-4"><CopyNote/.test(src),
  'the copyable DKA worksheet can be produced without a weight or a potassium')

// ── 5. YANG BUKAN PENGUKURAN HARUS TETAP PUNYA NILAI AWAL ──────────────────
// Penjaga terhadap perbaikan yang kebablasan, dan bedanya nyata:
//   - "tidak syok" adalah penilaian yang dijawab, bukan kekosongan;
//   - 0,05 U/kg/jam adalah PILIHAN PROTOKOL antara 0,05 dan 0,1, sebuah
//     setelan alat, bukan pengukuran tentang pasien.
assert.ok(/const \[shock, setShock\] = useState\(false\)/.test(kode),
  'shock was turned into an unanswered field; "no shock" is a clinical assessment, not a blank')
assert.ok(/const \[insulinText, setInsulinRate\] = useState\('0\.05'\)/.test(kode),
  'the 0.05 U/kg/hr protocol choice was removed; it is a setting, not a measurement of this child')

// ── 6. Aritmetikanya harus tetap benar ─────────────────────────────────────
// Holliday-Segar ditulis ulang di sini, bukan dicerminkan dari halamannya.
const holliday = (kg: number) => (kg <= 10 ? 100 * kg : kg <= 20 ? 1000 + 50 * (kg - 10) : 1500 + 20 * (kg - 20))
assert.equal(holliday(8), 800, 'Holliday-Segar under 10 kg changed')
assert.equal(holliday(18), 1400, 'Holliday-Segar 10-20 kg changed')
assert.equal(holliday(30), 1700, 'Holliday-Segar over 20 kg changed')
assert.ok(/return 1000 \+ 50 \* \(weightKg - 10\)/.test(engineKode), 'the engine no longer uses Holliday-Segar')
assert.ok(/pediatricDka\(/.test(kode), 'the page no longer uses the engine')
// Dan laju 48 jam: (defisit + 2x rumatan - bolus) / 48.
const laju = (kg: number, deh: number, syok: boolean) =>
  Math.max(0, (deh / 100) * kg * 1000 + holliday(kg) * 2 - (syok ? 20 : 10) * kg) / 48
// 18 kg, dehidrasi 10%, tanpa syok:
//   defisit 1800 + rumatan 2x1400 = 2800  -> 4600, dikurangi bolus 180 = 4420
//   4420 / 48 jam = 92,08 mL/jam
assert.ok(Math.abs(laju(18, 10, false) - 92.08) < 0.01, 'the 48-hour rate arithmetic changed')
assert.ok(/netAfterBolusMl \/ 48/.test(engineKode), 'the engine no longer spreads the deficit over 48 hours')
const nyata = pediatricDka({ weightKg: 18, dehydrationPct: 10, potassiumMeq: NaN, insulinRateUKgHr: 0.05, shock: false })
assert.ok(nyata.fluids !== null && Math.abs(nyata.fluids.ratePerHr - laju(18, 10, false)) < 1e-9, 'engine rate differs from the independent rewrite')

console.log('dka-anak-tanpa-dosis-awal: ok')
