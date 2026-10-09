import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pediatricDka, kaliumBand, hollidaySegarDailyMl, DKA_RANGES, HYPOKALEMIA_BELOW, HYPERKALEMIA_ABOVE } from '../../src/domains/clinical-calculators/index.ts'

const base = { weightKg: 18, dehydrationPct: 10, potassiumMeq: 4.2, insulinRateUKgHr: 0.05, shock: false }
const run = (o: Partial<typeof base> = {}) => pediatricDka({ ...base, ...o })
const close = (a: number | null | undefined, b: number, e = 1e-9) => assert.ok(a != null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan (dihitung tanpa mesin): 18 kg, 10%, tanpa syok.
// defisit = 0.10×18×1000 = 1800; rumatan harian = 1000+50×8 = 1400 → ×2 = 2800; total = 4600; bolus 10×18 = 180; net 4420; /48 = 92.0833…
const d = run()
assert.ok(d.fluids !== null)
close(d.fluids.deficitMl, 1800); close(d.fluids.maintenance48hMl, 2800); close(d.fluids.total48hMl, 4600)
close(d.fluids.bolusMl, 180); assert.equal(d.fluids.bolusMlPerKg, 10); close(d.fluids.netAfterBolusMl, 4420); close(d.fluids.ratePerHr, 4420 / 48)
close(d.insulinUHr, 0.9) // 0.05 × 18
close(run({ weightKg: 30 }).insulinUHr, 1.5); close(run({ weightKg: 30, insulinRateUKgHr: 0.1 }).insulinUHr, 3) // bergantung pada berat DAN laju
assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
// Syok: bolus 20 mL/kg → net 4600 − 360 = 4240.
const syok = run({ shock: true }); assert.equal(syok.fluids?.bolusMlPerKg, 20); close(syok.fluids?.netAfterBolusMl, 4240)
// Pasangan: hanya syok yang berbeda mengubah laju.
assert.notEqual(run({ shock: true }).fluids?.ratePerHr, run({ shock: false }).fluids?.ratePerHr)

// Holliday-Segar: batas 10 dan 20 kg tepat dan ±.
for (const [kg, ml] of [[2, 200], [10, 1000], [10.1, 1005], [20, 1500], [20.1, 1502], [30, 1700], [60, 2300]] as [number, number][]) close(hollidaySegarDailyMl(kg), ml, 1e-9)
// Net ≥ 0 di seluruh rentang sah (Math.max pelindung; mutan tanpa Math.max setara karena rumatan 48 jam ≥ 20 mL/kg×berat — dibuktikan, bukan diklaim).
assert.ok((run({ weightKg: 120, dehydrationPct: 1 }).fluids?.netAfterBolusMl ?? -1) >= 0)

// Pita kalium: ambang tepat. <3.5 → hipo; >5.5 → hiper; batas sendiri normo.
assert.equal(HYPOKALEMIA_BELOW, 3.5); assert.equal(HYPERKALEMIA_ABOVE, 5.5)
assert.match(kaliumBand(3.4).label, /^Hypokalemic — hold insulin/); assert.equal(kaliumBand(3.4).tone, 'critical')
assert.match(kaliumBand(3.5).label, /^Normokalemic/); assert.match(kaliumBand(5.5).label, /^Normokalemic/)
assert.match(kaliumBand(5.6).label, /^Hyperkalemic/)
assert.notEqual(kaliumBand(3.4).label, kaliumBand(3.5).label) // pasangan di ambang bawah
assert.notEqual(kaliumBand(5.5).label, kaliumBand(5.6).label) // pasangan di ambang atas
assert.equal(run({ potassiumMeq: NaN }).kBand, null) // tidak diukur → tidak ada pita (bukan "hold insulin")
assert.equal(run({ potassiumMeq: NaN }).fluids !== null, true) // kalium opsional untuk cairan

// Kosong → bernama; tanpa cairan/U per jam.
const kosong = run({ weightKg: NaN, dehydrationPct: NaN })
assert.deepEqual(kosong.missing, ['weight', 'dehydration estimate']); assert.equal(kosong.fluids, null); assert.equal(kosong.insulinUHr, null)
assert.deepEqual(run({ insulinRateUKgHr: NaN }).missing, ['insulin rate']); assert.equal(run({ insulinRateUKgHr: NaN }).insulinUHr, null)
assert.notEqual(run({ insulinRateUKgHr: NaN }).fluids, null) // cairan tidak bergantung pada insulin

// Regresi: berat 5000 kg / dehidrasi 80% / insulin 5 U/kg/jam / K 50 dulu lolos "> 0"; kini ditolak dengan alasan, bagian terkait kosong.
assert.deepEqual(run({ weightKg: 5000 }).invalid, ['weight must be 2–120 kg']); assert.equal(run({ weightKg: 5000 }).fluids, null); assert.equal(run({ weightKg: 5000 }).insulinUHr, null)
assert.deepEqual(run({ dehydrationPct: 80 }).invalid, ['dehydration estimate must be 1–15 %']); assert.equal(run({ dehydrationPct: 80 }).fluids, null)
assert.deepEqual(run({ insulinRateUKgHr: 5 }).invalid, ['insulin rate must be 0.01–0.1 U/kg/hr']); assert.equal(run({ insulinRateUKgHr: 5 }).insulinUHr, null)
assert.notEqual(run({ insulinRateUKgHr: 5 }).fluids, null) // pasangan: hanya insulin yang ditolak
assert.deepEqual(run({ potassiumMeq: 50 }).invalid, ['serum potassium must be 1–10 mEq/L']); assert.equal(run({ potassiumMeq: 50 }).kBand, null)
for (const bad of [Infinity, -1, 0]) assert.equal(run({ weightKg: bad }).fluids, null, `weight ${bad}`)
assert.equal(run({ weightKg: '18' as unknown as number }).fluids, null)

// Batas rentang diterima; ±sedikit ditolak.
for (const [k, r] of Object.entries(DKA_RANGES)) {
  const ok = (v: number) => run({ [k]: v }).invalid.length === 0
  assert.ok(ok(r.min) && ok(r.max), `${k} bounds`); assert.ok(!ok(r.min - 0.001) && !ok(r.max + 0.001), `${k} outside`)
}
assert.deepEqual(run(), run())

// Halaman: teks mentah + mesin; tanpa `|| 0`; menampilkan alasan penolakan.
const page = readFileSync(new URL('../../src/pages/clinical/scores/PediatricDkaCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/pediatricDka\(/.test(page) && /parseNumberField\(weightText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('pediatric-dka: nilai tangan, syok, Holliday-Segar, pita kalium di ambang, kosong/di luar rentang gagal tertutup per bagian')
