import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hollidaySegar, pedsDose } from '../../src/domains/clinical-calculators/index.ts'

// ── Holliday-Segar: nilai tangan dari 4-2-1 (100/50/20 mL/kg per tingkat) ──
for (const [kg, ml] of [[3, 300], [10, 1000], [15, 1250], [20, 1500], [25, 1600], [70, 2500], [0.3, 30], [300, 7100]] as const) {
  const r = hollidaySegar(kg)
  assert.ok(r.ok, `berat ${kg}`)
  if (r.ok) { assert.equal(r.data.mlPerDay, ml, `mL/hari ${kg} kg`); assert.equal(r.data.mlPerHour, ml / 24) }
}
// Kontinuitas di batas tingkat (tidak ada lompatan di 10 dan 20 kg).
for (const kg of [10, 20]) {
  const bawah = hollidaySegar(kg - 1e-9), atas = hollidaySegar(kg + 1e-9)
  assert.ok(bawah.ok && atas.ok)
  if (bawah.ok && atas.ok) assert.ok(Math.abs(atas.data.mlPerDay - bawah.data.mlPerDay) < 1e-4, `lompatan di ${kg} kg`)
}
const GALAT_BERAT = { ok: false, reason: 'Weight must be 0.3–300 kg' }
for (const kg of [0.29, 0, -1, 300.01, NaN, Infinity, -Infinity, +'']) assert.deepEqual(hollidaySegar(kg), GALAT_BERAT, `berat ${kg}`)
for (const salah of [undefined, null, '20', {}] as unknown as number[]) assert.equal(hollidaySegar(salah).ok, false)
assert.equal('data' in (hollidaySegar(0) as object), false)

// ── Dosis anak: aritmetika murni; tidak ada batas dosis obat yang diciptakan ──
const ok = pedsDose(15, 10, 3, 25)
assert.deepEqual(ok, { ok: true, data: { totalDailyMg: 150, perDoseMg: 50, perDoseMl: 2 } })
assert.deepEqual(pedsDose(15, 10, 3, 25), ok, 'deterministik')
// Pasangan: hanya frekuensi berubah → mg/dosis berubah, total harian tetap.
const f2 = pedsDose(15, 10, 2, 25)
assert.ok(f2.ok && f2.data.totalDailyMg === 150 && f2.data.perDoseMg === 75 && f2.data.perDoseMl === 3)
// Dosis tinggi tidak ditolak: batas obat bukan urusan fungsi ini (tidak boleh mengarang ambang klinis).
assert.equal(pedsDose(15, 5000, 3, 25).ok, true)
// Batas berat, frekuensi.
for (const kg of [0.3, 200]) assert.equal(pedsDose(kg, 10, 3, 25).ok, true, `berat ${kg}`)
for (const kg of [0.29, 200.01, 0, -3, NaN, Infinity, +'']) assert.deepEqual(pedsDose(kg, 10, 3, 25), { ok: false, reason: 'Weight must be 0.3–200 kg' }, `berat ${kg}`)
for (const f of [1, 24]) assert.equal(pedsDose(15, 10, f, 25).ok, true, `frek ${f}`)
const GALAT_FREK = { ok: false, reason: 'Frequency must be a whole number of 1–24 times per day' }
for (const f of [0, -1, 25, 2.5, 0.5, NaN, Infinity, +'']) assert.deepEqual(pedsDose(15, 10, f, 25), GALAT_FREK, `frek ${f}`)
// Dosis dan konsentrasi: harus > 0 dan hingga.
for (const d of [0, -10, NaN, Infinity, -Infinity, +'']) assert.deepEqual(pedsDose(15, d, 3, 25), { ok: false, reason: 'Dose must be a number above 0 mg/kg/day' }, `dosis ${d}`)
for (const c of [0, -25, NaN, Infinity, +'']) assert.deepEqual(pedsDose(15, 10, 3, c), { ok: false, reason: 'Concentration must be a number above 0 mg/mL' }, `konsentrasi ${c}`)
for (const salah of [undefined, null, '15', {}] as unknown as number[]) {
  assert.equal(pedsDose(salah, 10, 3, 25).ok, false); assert.equal(pedsDose(15, salah, 3, 25).ok, false)
  assert.equal(pedsDose(15, 10, salah, 25).ok, false); assert.equal(pedsDose(15, 10, 3, salah).ok, false)
}
assert.equal('data' in (pedsDose(15, 10, 0, 25) as object), false)

// Jebakan nyata rumus lama: frekuensi kosong → pembagian nol → Infinity mL/dosis; konsentrasi kosong → Infinity.
assert.equal(150 / +'' / 25, Infinity)
assert.equal(50 / +'', Infinity)

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /hollidaySegar\(weight\)/)
assert.match(halaman, /pedsDose\(weight, doseMgKg, freqPerDay, concMgMl\)/)
assert.match(halaman, /fluid\.ok \?/)
assert.match(halaman, /dose\.ok \?/)
assert.match(halaman, /\{fluid\.reason\}/)
assert.match(halaman, /\{dose\.reason\}/)
assert.doesNotMatch(halaman, /1000 \+ \(w - 10\) \* 50/, 'rumus 4-2-1 tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /weight \* doseMgKg/, 'aritmetika dosis tidak boleh disalin ke halaman')
console.log('peds-dose-holliday-segar: golden values, fail-closed ranges, no invented drug limits, single-source formulas')
