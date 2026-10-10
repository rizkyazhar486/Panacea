import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { zone2HeartRate, validateGripKg, ZONE2_AGE_YEARS, GRIP_KG } from '../../src/domains/clinical-calculators/index.ts'

// ── Zona 2 (Tanaka 208 − 0,7×usia; 60–70%). Nilai tangan: usia 40 → 180 → 108–126; usia 50 → 173 → 103,8→104 dan 121,1→121.
const z40 = zone2HeartRate(40); assert.deepEqual(z40, { ok: true, hrMax: 180, lower: 108, upper: 126 })
const z50 = zone2HeartRate(50); assert.ok(z50.ok && Math.abs(z50.hrMax - 173) < 1e-9 && z50.lower === 104 && z50.upper === 121)
// Bukan 220 − usia: usia 40 akan memberi 108–126 vs 220−40=180 → sama di 40, tetapi berbeda di 70 (Tanaka 159 → 95–111; 220−70=150 → 90–105).
const z70 = zone2HeartRate(70); assert.ok(z70.ok && z70.lower === 95 && z70.upper === 111)
// Batas usia 10–100 dan ±1 di luar.
for (const a of [10, 100]) assert.equal(zone2HeartRate(a).ok, true, `usia ${a}`)
for (const a of [9, 101]) assert.deepEqual(zone2HeartRate(a), { ok: false, reason: 'age must be 10–100 years' }, `usia ${a}`)
// Kosong ≠ 0: NaN = "required" (dulu usia kosong terbaca 0 dan menampilkan 125–146 bpm); 0 sendiri di luar rentang.
assert.deepEqual(zone2HeartRate(NaN), { ok: false, reason: 'age is required' }); assert.deepEqual(zone2HeartRate(0), { ok: false, reason: 'age must be 10–100 years' })
for (const bad of [Infinity, -Infinity, -5]) assert.equal(zone2HeartRate(bad).ok, false, String(bad))
assert.equal(zone2HeartRate('40' as unknown as number).ok, false)
assert.deepEqual(zone2HeartRate(40), zone2HeartRate(40))

// ── Genggam: 1–100 kg; kosong = required; tanpa nilai awal.
assert.deepEqual(validateGripKg(32.5), { ok: true, kg: 32.5 })
for (const k of [1, 100]) assert.equal(validateGripKg(k).ok, true, `kg ${k}`)
for (const k of [0, 0.99, 100.01, -3, 5000]) assert.deepEqual(validateGripKg(k), { ok: false, reason: 'grip strength must be 1–100 kg' }, `kg ${k}`)
assert.deepEqual(validateGripKg(NaN), { ok: false, reason: 'grip strength is required' }); assert.equal(validateGripKg(Infinity).ok, false)
assert.equal(validateGripKg('30' as unknown as number).ok, false)
assert.deepEqual([ZONE2_AGE_YEARS.min, ZONE2_AGE_YEARS.max, GRIP_KG.min, GRIP_KG.max], [10, 100, 1, 100])

const page = readFileSync(new URL('../../src/pages/MovementToolkit.tsx', import.meta.url), 'utf8')
const kode = page.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
assert.ok(/zone2HeartRate\(parseNumberField\(ageText\)\)/.test(kode) && /validateGripKg\(parseNumberField\(kgText\)\)/.test(kode), 'halaman tidak memakai mesin domain')
assert.ok(!/useState\(30\)/.test(kode) && !/getDemo\(\)/.test(kode) && !/\bgetDemo\s*\(/.test(kode), 'nilai awal 30 atau getDemo() kembali')
assert.ok(/\{grip\.ok \? \(/.test(kode) && /<ScoreTrend[^>]*total=\{grip\.kg\}/.test(kode), 'ScoreTrend tidak digerbang oleh genggam yang sah')
assert.ok(/Tanaka: 208 − 0\.7 × age/.test(kode) && !/60-70% of 220/.test(kode), 'label Zona 2 tidak sesuai rumus Tanaka')
console.log('movement-inputs: Tanaka 40→108–126, 70→95–111 (bukan 220−usia), genggam 1–100 tanpa nilai awal, kosong ≠ 0')
