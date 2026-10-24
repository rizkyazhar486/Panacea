// C6 (bagian rekayasa), tahap 14: dua penjaga yang lolos dari sapuan mutasi (docs/governance/CALCULATOR_MUTATION_SWEEP.md).
// (1) cvdRisk: tepat SATU kolom kosong tidak boleh lolos menjadi risiko. (2) sleepDebt: pola tanggal menerima bulan 01-12 dan hari 01-31 dan
// menolak yang di luar itu. Hanya yang tidak ambigu yang dikunci: pola ini juga menerima tanggal kalender yang mustahil (2026-02-30,
// 2026-04-31); itu TEMUAN (dicatat di dokumen sapuan), sengaja tidak dikunci sebagai perilaku yang benar.
// Bukti rekayasa, BUKAN tinjauan klinis.
import assert from 'node:assert/strict'
import { cvdRisk, sanitizeNights } from '../../src/domains/clinical-calculators/index.ts'

// ── cvdRisk: penjaga kolom kosong.
const GOOD = { age: 55, sex: 'M' as const, totChol: 200, hdl: 50, sbp: 130, treatedBP: false, smoker: false, diabetic: false }
const good = cvdRisk(GOOD)
assert.deepEqual(good.missing, [], 'masukan lengkap: tidak ada yang hilang')
assert.equal(good.riskPct, 11.1, 'nilai emas: risiko 11,1 untuk masukan baku')
assert.equal(good.band?.label, 'Intermediate risk')
for (const field of ['age', 'totChol', 'hdl', 'sbp'] as const) {
  const r = cvdRisk({ ...GOOD, [field]: Number.NaN })
  assert.equal(r.missing.length, 1, `${field} kosong dilaporkan tepat satu kali`)
  assert.equal(r.riskPct, null, `${field} kosong: tidak boleh ada risiko`)
  assert.equal(r.band, null, `${field} kosong: tidak boleh ada pita`)
  assert.deepEqual(r.invalid, [], `${field} kosong bukan masukan tidak sah`)
}
assert.equal(cvdRisk({ ...GOOD, age: Number.NaN, sbp: Number.NaN }).missing.length, 2, 'pasangan: dua kolom kosong dilaporkan dua')
assert.equal(cvdRisk({ ...GOOD, sex: 'X' as never }).riskPct, null, 'jenis kelamin tidak sah ditolak')
assert.equal(cvdRisk({ ...GOOD, hdl: 200 }).riskPct, null, 'HDL tidak boleh di atas kolesterol total')

// ── sleepDebt: pola tanggal pada sanitizeNights.
const kept = (date: string) => sanitizeNights([{ date, hours: 7 }]).nights.length
for (let m = 1; m <= 12; m++) assert.equal(kept(`2026-${String(m).padStart(2, '0')}-15`), 1, `bulan ${m} diterima`)
for (const bad of ['2026-00-15', '2026-13-15', '2026-14-15', '2026-19-15', '2026-20-15', '2026-21-15', '2026-99-15']) assert.equal(kept(bad), 0, `bulan tidak sah ditolak: ${bad}`)
for (let d = 1; d <= 31; d++) assert.equal(kept(`2026-10-${String(d).padStart(2, '0')}`), 1, `hari ${d} diterima`)
for (const bad of ['2026-10-00', '2026-10-32', '2026-10-40', '2026-10-99']) assert.equal(kept(bad), 0, `hari tidak sah ditolak: ${bad}`)
for (const bad of ['2026-1-15', '2026-10-5', '26-10-15', '2026/10/15', '2026-10-15T00:00', ' 2026-10-15', '']) assert.equal(kept(bad), 0, `bentuk tidak sah ditolak: "${bad}"`)
assert.equal(sanitizeNights([{ date: '2026-10-15', hours: 7 }, { date: '2026-13-15', hours: 7 }]).dropped, 1, 'yang dibuang dilaporkan, tidak disembunyikan')
assert.deepEqual(sanitizeNights('bukan larik'), { nights: [], dropped: 0 })
assert.deepEqual(sanitizeNights([{ date: '2026-10-15', hours: 7 }]), sanitizeNights([{ date: '2026-10-15', hours: 7 }]), 'determinisme')

console.log('calculator-independent-reference-14: cvdRisk menolak tepat satu kolom kosong (empat kolom), pola tanggal sleepDebt bulan 01-12 dan hari 01-31 terkunci; tanggal kalender mustahil dicatat sebagai temuan, tidak dikunci')
