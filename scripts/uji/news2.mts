import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { news2, news2Band, NEWS2_RANGES, rrPoints, spo2Points, news2SbpPoints, hrPoints, tempPoints } from '../../src/domains/clinical-calculators/index.ts'

const base = { rr: 16, spo2: 98, sbp: 120, hr: 75, temp: 37.0, onOxygen: false, alert: true }
const run = (o: Partial<typeof base> = {}) => news2({ ...base, ...o })

// Nilai tangan: keenam parameter "normal" bernilai 0 → total 0, Low risk — hanya sah karena SEMUA diukur.
const nol = run(); assert.equal(nol.total, 0); assert.equal(nol.band?.label, 'Low risk'); assert.equal(nol.anyThree, false); assert.equal(nol.rows.length, 7)
assert.deepEqual(nol.rows.map((r) => r.name), ['Respiration rate', 'SpO₂', 'Air or oxygen', 'Systolic BP', 'Pulse', 'Consciousness (AVPU)', 'Temperature'])
// Kasus berat: RR 26 (3) + SpO2 90 (3) + O2 (2) + SBP 85 (3) + HR 135 (3) + tidak sadar (3) + suhu 34 (3) = 20.
const berat = run({ rr: 26, spo2: 90, onOxygen: true, sbp: 85, hr: 135, alert: false, temp: 34 }); assert.equal(berat.total, 20); assert.equal(berat.band?.label, 'High risk'); assert.equal(berat.band?.tone, 'critical')

// Ambang tiap parameter: tepat di batas dan satu langkah berikutnya (perbandingan `<=` dipertahankan).
const t = (fn: (v: number) => number, pairs: [number, number][], tag: string) => { for (const [v, p] of pairs) assert.equal(fn(v), p, `${tag} ${v}`) }
t(rrPoints, [[8, 3], [9, 1], [11, 1], [12, 0], [20, 0], [21, 2], [24, 2], [25, 3]], 'RR')
t(spo2Points, [[91, 3], [92, 2], [93, 2], [94, 1], [95, 1], [96, 0]], 'SpO2')
t(news2SbpPoints, [[90, 3], [91, 2], [100, 2], [101, 1], [110, 1], [111, 0], [219, 0], [220, 3]], 'SBP')
t(hrPoints, [[40, 3], [41, 1], [50, 1], [51, 0], [90, 0], [91, 1], [110, 1], [111, 2], [130, 2], [131, 3]], 'HR')
t(tempPoints, [[35.0, 3], [35.1, 1], [36.0, 1], [36.1, 0], [38.0, 0], [38.1, 1], [39.0, 1], [39.1, 2]], 'Temp')
// Oksigen +2 dan kesadaran +3 berpasangan (hanya satu input berbeda).
assert.equal(run({ onOxygen: true }).total, run().total! + 2); assert.equal(run({ alert: false }).total, run().total! + 3)

// Pita: ≥7 tinggi; ≥5 ATAU satu parameter bernilai 3 → sedang; ≥1 rendah-sedang; 0 rendah.
assert.equal(news2Band(7, false).label, 'High risk'); assert.equal(news2Band(6, false).label, 'Medium risk'); assert.equal(news2Band(5, false).label, 'Medium risk')
assert.equal(news2Band(4, false).label, 'Low-medium risk'); assert.equal(news2Band(1, false).label, 'Low-medium risk'); assert.equal(news2Band(0, false).label, 'Low risk')
assert.equal(news2Band(3, true).label, 'Medium risk') // satu parameter merah memicu eskalasi walau total 3
assert.notEqual(news2Band(3, true).label, news2Band(3, false).label) // pasangan: hanya anyThree berbeda
assert.equal(run({ rr: 8 }).anyThree, true); assert.equal(run({ rr: 8 }).total, 3); assert.equal(run({ rr: 8 }).band?.label, 'Medium risk') // satu parameter 3 → sedang
assert.equal(news2Band(7, false).tone, 'critical'); assert.equal(news2Band(5, false).tone, 'low'); assert.equal(news2Band(1, false).tone, 'brand'); assert.equal(news2Band(0, false).tone, 'brand')
assert.match(news2Band(0, false).action, /^Routine monitoring/); assert.match(news2Band(7, false).action, /critical care/)
assert.deepEqual(run(), run())

// Kosong → bernama; TANPA skor, TANPA pita, TANPA baris (dulu nol di semua kolom = "Low risk").
const kosong = run({ rr: NaN, spo2: NaN, sbp: NaN, hr: NaN, temp: NaN })
assert.deepEqual(kosong.missing, ['respiration rate', 'SpO₂', 'systolic BP', 'pulse', 'temperature']); assert.equal(kosong.total, null); assert.equal(kosong.band, null); assert.equal(kosong.rows.length, 0)
assert.deepEqual(run({ hr: NaN }).missing, ['pulse']); assert.equal(run({ hr: NaN }).total, null)
// Regresi: RR 5000 / suhu 900 / SpO2 500 lolos "> 0" dulu; kini ditolak dengan alasan, tanpa skor.
assert.deepEqual(run({ rr: 5000 }).invalid, ['respiration rate must be 1–80 /min']); assert.equal(run({ rr: 5000 }).total, null)
assert.deepEqual(run({ temp: 900 }).invalid, ['temperature must be 20–45 °C']); assert.deepEqual(run({ spo2: 500 }).invalid, ['SpO₂ must be 30–100 %'])
assert.deepEqual(run({ sbp: 5 }).invalid, ['systolic BP must be 20–300 mmHg']); assert.deepEqual(run({ hr: 2 }).invalid, ['pulse must be 10–300 bpm'])
for (const bad of [Infinity, -1, 0]) assert.equal(run({ rr: bad }).total, null, `RR ${bad}`)
assert.equal(run({ spo2: '98' as unknown as number }).total, null)
// Pembacaan kritis nyata tetap diterima (rentang longgar): SpO2 60, SBP 40, HR 25, RR 6, suhu 30.
const kritis = run({ spo2: 60, sbp: 40, hr: 25, rr: 6, temp: 30 }); assert.notEqual(kritis.total, null); assert.equal(kritis.band?.label, 'High risk')
// Batas rentang: diterima; ± ditolak.
for (const [k, r] of Object.entries(NEWS2_RANGES)) {
  assert.notEqual(run({ [k]: r.min }).total, null, `${k} min`); assert.notEqual(run({ [k]: r.max }).total, null, `${k} max`)
  assert.equal(run({ [k]: r.min - 0.01 }).total, null, `${k} <min`); assert.equal(run({ [k]: r.max + 0.01 }).total, null, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/News2Score.tsx', import.meta.url), 'utf8')
assert.ok(/news2\(\{ rr, spo2, sbp, hr, temp, onOxygen, alert \}\)/.test(page) && /parseNumberField\(rrText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('news2: poin & ambang tujuh parameter, pita (termasuk pemicu satu-parameter-3), kosong/di luar rentang gagal tertutup, pembacaan kritis nyata diterima')
