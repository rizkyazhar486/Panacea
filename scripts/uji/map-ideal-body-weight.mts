import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dailyCalories, idealBodyWeight, meanArterialPressure } from '../../src/domains/clinical-calculators/index.ts'

// ── MAP ──
const map = (s: number, d: number) => meanArterialPressure(s, d)
const view = (s: number, d: number) => { const r = map(s, d); assert.ok(r.ok, `${s}/${d}`); return r.ok ? r.data : (undefined as never) }
assert.ok(Math.abs(view(120, 80).map - 280 / 3) < 1e-9)
assert.equal(view(120, 80).label, 'Normal')
assert.deepEqual(map(90, 60), { ok: true, data: { map: 70, label: 'Normal', tone: 'normal', note: 'Generally sufficient for organ perfusion (target MAP ≥65 in septic shock).' } })
assert.equal(view(60, 40).label, 'Very low'); assert.equal(view(60, 40).tone, 'critical')
assert.equal(view(200, 120).label, 'High'); assert.equal(view(200, 120).tone, 'low')
// Ambang MAP tepat di batas (pasangan di tiap sisi): < 60 sangat rendah, ≤ 100 normal.
assert.equal(view(98, 41).map, 60); assert.equal(view(98, 41).label, 'Normal')
assert.equal(view(97, 41).label, 'Very low')
assert.equal(view(130, 85).map, 100); assert.equal(view(130, 85).label, 'Normal')
assert.equal(view(131, 85).label, 'High')
// Regresi: identik dengan rumus halaman lama pada seluruh masukan sah.
for (let s = 41; s <= 300; s += 7) for (let d = 20; d < s && d <= 200; d += 9) assert.equal(view(s, d).map, (s + 2 * d) / 3)
// Penolakan: batas diterima, satu langkah di luar ditolak dengan alasan; sistolik harus > diastolik.
for (const [s, d] of [[40, 20], [300, 200], [300, 20], [41, 40]] as const) assert.equal(map(s, d).ok, true, `${s}/${d}`)
const GS = { ok: false, reason: 'Systolic must be 40–300 mmHg' }, GD = { ok: false, reason: 'Diastolic must be 20–200 mmHg' }
for (const s of [39.99, 0, -120, 300.01, NaN, Infinity, +'']) assert.deepEqual(map(s, 80), GS, `sys ${s}`)
for (const d of [19.99, 0, -80, 200.01, NaN, Infinity, +'']) assert.deepEqual(map(120, d), GD, `dia ${d}`)
const GP = { ok: false, reason: 'Systolic must be higher than diastolic' }
assert.deepEqual(map(80, 80), GP); assert.deepEqual(map(70, 80), GP); assert.equal(map(81, 80).ok, true)
for (const salah of [undefined, null, '120', {}] as unknown as number[]) { assert.equal(map(salah, 80).ok, false); assert.equal(map(120, salah).ok, false) }
assert.equal('data' in (map(0, 80) as object), false)
// Jebakan nyata: kolom kosong → 0 → halaman lama menampilkan MAP 53 "Very low" untuk diastolik kosong.
assert.equal(Math.round((120 + 2 * +'') / 3), 40)

// ── Berat badan ideal & kalori ──
const ibw = (h: number, s: 'M' | 'F', f: 'broca' | 'lorentz') => { const r = idealBodyWeight(h, s, f); assert.ok(r.ok, `${h}${s}${f}`); return r.ok ? r.data.ibwKg : NaN }
assert.equal(ibw(165, 'M', 'broca'), 58.5)      // 65 − 10%
assert.equal(ibw(165, 'F', 'broca'), 55.25)     // 65 − 15%
assert.equal(ibw(165, 'M', 'lorentz'), 61.25)   // 65 − 15/4
assert.equal(ibw(165, 'F', 'lorentz'), 59)      // 65 − 15/2.5
assert.equal(ibw(150, 'M', 'lorentz'), 50); assert.equal(ibw(150, 'F', 'lorentz'), 50) // suku koreksi nol di 150 cm
// Pasangan: hanya jenis kelamin berbeda → hasil berbeda pada kedua rumus.
assert.notEqual(ibw(170, 'M', 'broca'), ibw(170, 'F', 'broca')); assert.notEqual(ibw(170, 'M', 'lorentz'), ibw(170, 'F', 'lorentz'))
// Regresi: sama dengan rumus lama kedua halaman pada seluruh tinggi sah.
for (let h = 120; h <= 250; h += 5) {
  const base = h - 100
  assert.equal(ibw(h, 'M', 'broca'), base - base * 0.1); assert.equal(ibw(h, 'F', 'broca'), base - base * 0.15)
  assert.equal(ibw(h, 'M', 'lorentz'), h - 100 - (h - 150) / 4); assert.equal(ibw(h, 'F', 'lorentz'), h - 100 - (h - 150) / 2.5)
}
// Kalori: BBI × 30/35/40; satu sumber dengan hasil BBI.
assert.deepEqual(dailyCalories(165, 'M', 'lorentz', 'sedang'), { ok: true, data: { ibwKg: 61.25, kcalPerDay: 61.25 * 35 } })
assert.equal((dailyCalories(165, 'M', 'broca', 'ringan') as { data: { kcalPerDay: number } }).data.kcalPerDay, 58.5 * 30)
assert.equal((dailyCalories(165, 'M', 'broca', 'berat') as { data: { kcalPerDay: number } }).data.kcalPerDay, 58.5 * 40)
// Penolakan: batas tinggi, jenis kelamin, rumus, aktivitas — hanya yang rusak yang menolak.
for (const h of [120, 250]) assert.equal(idealBodyWeight(h, 'M', 'broca').ok, true, `h ${h}`)
const GH = { ok: false, reason: 'Height must be 120–250 cm' }
for (const h of [119.99, 0, -165, 250.01, 1650, NaN, Infinity, +'']) assert.deepEqual(idealBodyWeight(h, 'M', 'broca'), GH, `h ${h}`)
assert.deepEqual(idealBodyWeight(165, 'X' as 'M', 'broca'), { ok: false, reason: 'Sex must be M or F' })
assert.deepEqual(idealBodyWeight(165, 'M', 'devine' as 'broca'), { ok: false, reason: 'Formula must be broca or lorentz' })
assert.deepEqual(dailyCalories(165, 'M', 'broca', 'sedang' as 'sedang'), dailyCalories(165, 'M', 'broca', 'sedang'))
assert.deepEqual(dailyCalories(165, 'M', 'broca', 'toberat' as 'berat'), { ok: false, reason: 'Activity must be ringan, sedang or berat' })
assert.deepEqual(dailyCalories(165, 'M', 'broca', 'toString' as 'berat'), { ok: false, reason: 'Activity must be ringan, sedang or berat' }, 'kunci prototipe tidak boleh lolos')
assert.deepEqual(dailyCalories(0, 'M', 'broca', 'sedang'), GH)
for (const salah of [undefined, null, '165'] as unknown as number[]) assert.equal(idealBodyWeight(salah, 'M', 'broca').ok, false)
assert.equal('data' in (idealBodyWeight(0, 'M', 'broca') as object), false)
assert.deepEqual(dailyCalories(165, 'F', 'lorentz', 'berat'), dailyCalories(165, 'F', 'lorentz', 'berat'), 'deterministik')

// Halaman memakai fungsi kanonik; rumus tidak lagi disalin (Broca sebelumnya ada di dua halaman).
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /meanArterialPressure\(sys, dia\)/)
assert.match(halaman, /idealBodyWeight\(height, sex, 'broca'\)/)
assert.match(halaman, /dailyCalories\(height, sex, formula, activity\)/)
for (const re of [/map\.ok \?/, /ibw\.ok \?/, /energy\.ok \?/, /\{map\.reason\}/, /\{ibw\.reason\}/, /\{energy\.reason\}/]) assert.match(halaman, re)
assert.doesNotMatch(halaman, /\(sys \+ 2 \* dia\) \/ 3/, 'rumus MAP tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /base - base \* 0\.1/, 'rumus Broca tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /\(height - 150\) \/ 4/, 'rumus Lorentz tidak boleh disalin ke halaman')
console.log('map-ideal-body-weight: golden values, MAP thresholds at the boundary, regression grids, fail-closed ranges, single-source Broca')
