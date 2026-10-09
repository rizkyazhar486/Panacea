import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { maintenanceFluid, resuscitation, correctedSodium, naCorrectionRate, potassiumDeficit, FLUID_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const close = (a: number | undefined, b: number, e = 1e-9) => assert.ok(a !== undefined && Math.abs(a - b) < e, `${a} vs ${b}`)
const bad = (r: { ok: boolean }) => { assert.equal(r.ok, false); return r as unknown as { missing: string[]; invalid: string[] } }

// ── Rumatan (Holliday-Segar), nilai tangan ───────────────────────────────
const m70 = maintenanceFluid(70) as Extract<ReturnType<typeof maintenanceFluid>, { ok: true }>
assert.equal(m70.ok, true); close(m70.dailyMl, 1500 + 20 * 50); close(m70.hourlyMl, 2500 / 24); close(m70.naMeq, 50 + 50); close(m70.kMeq, 30 + 0.5 * 50)
const m8 = maintenanceFluid(8) as typeof m70; close(m8.dailyMl, 800); close(m8.naMeq, 24); close(m8.kMeq, 16)
const m15 = maintenanceFluid(15) as typeof m70; close(m15.dailyMl, 1250); close(m15.naMeq, 40); close(m15.kMeq, 25)
// Batas kelompok 10/20 kg: nilai tepat (kontinu) dan satu langkah sesudahnya.
close((maintenanceFluid(10) as typeof m70).dailyMl, 1000); close((maintenanceFluid(10.1) as typeof m70).dailyMl, 1005)
close((maintenanceFluid(20) as typeof m70).dailyMl, 1500); close((maintenanceFluid(20.1) as typeof m70).dailyMl, 1502)
close((maintenanceFluid(10) as typeof m70).naMeq, 30); close((maintenanceFluid(20) as typeof m70).naMeq, 50); close((maintenanceFluid(20) as typeof m70).kMeq, 30)
assert.deepEqual(bad(maintenanceFluid(NaN)).missing, ['weight'])
assert.deepEqual(bad(maintenanceFluid(5000)).invalid, ['weight must be 0.5–300 kg'])
for (const x of [0, -3, Infinity, '70' as unknown as number]) assert.equal(maintenanceFluid(x).ok, false, String(x))

// ── Resusitasi ───────────────────────────────────────────────────────
type Res = Extract<ReturnType<typeof resuscitation>, { ok: true }>
const sep = resuscitation('adult-sepsis', 70, NaN) as Res; assert.equal(sep.ok, true); assert.equal(sep.ml, 2100); assert.equal(sep.first8hMl, null) // TBSA diabaikan
assert.equal((resuscitation('peds-shock', 20, NaN) as Res).ml, 400)
const pk = resuscitation('burns', 70, 20) as Res; assert.equal(pk.ml, 5600); assert.equal(pk.first8hMl, 2800); assert.equal(pk.next16hMl, 2800)
// Pasangan: hanya skenario yang berbeda mengubah volume (30 vs 20 mL/kg vs Parkland).
assert.notEqual((resuscitation('adult-sepsis', 70, 20) as Res).ml, (resuscitation('peds-shock', 70, 20) as Res).ml)
assert.notEqual((resuscitation('peds-shock', 70, 20) as Res).ml, (resuscitation('burns', 70, 20) as Res).ml)
assert.deepEqual(bad(resuscitation('burns', 70, NaN)).missing, ['TBSA burned'])
assert.deepEqual(bad(resuscitation('burns', NaN, 20)).missing, ['weight'])
assert.deepEqual(bad(resuscitation('burns', 70, 900)).invalid, ['TBSA burned must be 1–100 %'])
assert.deepEqual(bad(resuscitation('burns', 70, 0)).invalid, ['TBSA burned must be 1–100 %'])
assert.equal((resuscitation('burns', 70, 100) as Res).ml, 28000); assert.equal(resuscitation('burns', 70, 100.1).ok, false)
assert.deepEqual(bad(resuscitation('x' as never, 70, 20)).invalid, ['scenario must be adult-sepsis, peds-shock or burns'])
assert.equal(resuscitation('adult-sepsis', 5000, NaN).ok, false)

// ── Natrium terkoreksi (Katz) ─────────────────────────────────────────
type Cna = Extract<ReturnType<typeof correctedSodium>, { ok: true }>
close((correctedSodium(130, 400) as Cna).correctedNa, 130 + 1.6 * 3); close((correctedSodium(140, 100) as Cna).correctedNa, 140)
assert.deepEqual(bad(correctedSodium(NaN, NaN)).missing, ['sodium', 'glucose']) // regresi: dulu "−1.6 mEq/L" dari kolom kosong
assert.deepEqual(bad(correctedSodium(130, NaN)).missing, ['glucose'])
assert.deepEqual(bad(correctedSodium(130, 1e9)).invalid, ['glucose must be 20–2000 mg/dL']); assert.deepEqual(bad(correctedSodium(30, 400)).invalid, ['sodium must be 90–200 mEq/L'])

// ── Laju koreksi Na (Adrogue-Madias disederhanakan; konstanta 140 apa adanya) ───
type Nr = Extract<ReturnType<typeof naCorrectionRate>, { ok: true }>
const nm = naCorrectionRate(120, 70, 'M') as Nr; close(nm.tbw, 42); close(nm.naChangePerL, 20 / 43); close(nm.litersFor10, 10 / (20 / 43))
const nf = naCorrectionRate(120, 70, 'F') as Nr; close(nf.tbw, 35); close(nf.naChangePerL, 20 / 36)
assert.notEqual(nm.naChangePerL, nf.naChangePerL) // pasangan: hanya jenis kelamin
assert.equal((naCorrectionRate(140, 70, 'M') as Nr).litersFor10, 0) // dibagi nol dijaga seperti semula
assert.deepEqual(bad(naCorrectionRate(NaN, NaN, 'M')).missing, ['sodium', 'weight']) // regresi: dulu "140.00 mEq/L" dari kolom kosong
assert.deepEqual(bad(naCorrectionRate(120, 70, 'X')).invalid, ['sex must be M or F']); assert.equal(naCorrectionRate(120, 70, undefined).ok, false)
assert.deepEqual(bad(naCorrectionRate(5, 70, 'M')).invalid, ['sodium must be 90–200 mEq/L'])

// ── Defisit kalium ─────────────────────────────────────────────────────
type Kd = Extract<ReturnType<typeof potassiumDeficit>, { ok: true }>
const k = potassiumDeficit(3.0, 70) as Kd; close(k.lowMeq, 1 * 70 * 0.3); close(k.highMeq, 1 * 70 * 0.6)
const kn = potassiumDeficit(4.5, 70) as Kd; assert.equal(kn.lowMeq, 0); assert.equal(kn.highMeq, 0) // K di atas 4 → tidak negatif
close((potassiumDeficit(4.0, 70) as Kd).lowMeq, 0)
assert.deepEqual(bad(potassiumDeficit(NaN, NaN)).missing, ['potassium', 'weight'])
assert.deepEqual(bad(potassiumDeficit(0.2, 70)).invalid, ['potassium must be 1–10 mEq/L']); assert.deepEqual(bad(potassiumDeficit(3, 900)).invalid, ['weight must be 0.5–300 kg'])

// Batas rentang diterima, ± ditolak.
for (const [key, r] of Object.entries(FLUID_RANGES)) assert.ok(r.min < r.max, key)
assert.equal(maintenanceFluid(FLUID_RANGES.weightKg.min).ok, true); assert.equal(maintenanceFluid(FLUID_RANGES.weightKg.max).ok, true)
assert.equal(maintenanceFluid(FLUID_RANGES.weightKg.min - 0.01).ok, false); assert.equal(maintenanceFluid(FLUID_RANGES.weightKg.max + 0.01).ok, false)
assert.equal(correctedSodium(FLUID_RANGES.sodium.min, FLUID_RANGES.glucose.min).ok, true); assert.equal(correctedSodium(FLUID_RANGES.sodium.max, FLUID_RANGES.glucose.max).ok, true)
assert.equal(correctedSodium(FLUID_RANGES.sodium.max + 0.1, 100).ok, false); assert.equal(correctedSodium(140, FLUID_RANGES.glucose.min - 0.1).ok, false)
assert.deepEqual(maintenanceFluid(33), maintenanceFluid(33))

// Halaman: teks mentah + mesin, tanpa `|| 0`, setiap sub-kalkulator menampilkan alasan.
const page = readFileSync(new URL('../../src/pages/FluidCalculators.tsx', import.meta.url), 'utf8')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
for (const f of ['maintenanceFluid(', 'resuscitation(', 'correctedSodium(', 'naCorrectionRate(', 'potassiumDeficit(']) assert.ok(page.includes(f), `halaman tidak memakai ${f}`)
assert.equal((page.match(/<Penolakan r=\{/g) ?? []).length, 5, 'tiap sub-kalkulator harus menampilkan alasan penolakan')
console.log('fluid-electrolytes: nilai tangan, batas Holliday-Segar, skenario berpasangan, kosong/di luar rentang gagal tertutup, tanpa angka dari kolom kosong')
