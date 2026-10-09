import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { widmarkBac, gramsOf, DRINKS, BAC_RANGES, WIDMARK_R, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`)
const BEER = 'Beer (330 ml, 5%)', WINE = 'Wine (150 ml, 12%)', SPIRIT = 'Spirits, single (30 ml, 40%)'
const run = (o: Partial<{ sex: 'M' | 'F'; weightKg: number; hours: number; counts: Record<string, number> }>) =>
  widmarkBac({ sex: 'M', weightKg: 70, hours: 1, counts: { [BEER]: 1 }, ...o })
const data = (o = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }

// Nilai tangan: 1 bir 330 ml 5% = 330×0.05×0.789 = 13.0185 g; pria 70 kg: 13.0185/(0.68×70) = 0.273499… ‰; −0.15 → 0.123499… ‰.
close(gramsOf(DRINKS[0]), 13.0185)
const d1 = data()
close(d1.totalGrams, 13.0185); close(d1.unitsUK, 13.0185 / 8); close(d1.standardUS, 13.0185 / 14)
close(d1.permille, 13.0185 / 47.6 - 0.15); close(d1.percent, d1.permille / 10)
// Pasangan: hanya jenis kelamin berbeda → r 0.55: 13.0185/38.5 − 0.15.
close(data({ sex: 'F' }).permille, 13.0185 / 38.5 - 0.15)
assert.ok(data({ sex: 'F' }).permille > data({ sex: 'M' }).permille)
// Pasangan: hanya berat berbeda; lebih berat → BAC lebih rendah.
assert.ok(data({ weightKg: 100 }).permille < data({ weightKg: 50 }).permille)
// Penjumlahan beberapa jenis: 2 bir + 1 anggur + 1 spirit.
close(data({ counts: { [BEER]: 2, [WINE]: 1, [SPIRIT]: 1 } }).totalGrams, 2 * 13.0185 + 150 * 0.12 * 0.789 + 30 * 0.4 * 0.789)
// Lantai nol: sedikit alkohol dan waktu lama → 0, bukan negatif.
assert.equal(data({ hours: 12 }).permille, 0)
assert.equal(data({ counts: {} }).permille, 0); assert.equal(data({ counts: {} }).totalGrams, 0)
// Batas lantai: tepat saat eliminasi = konsumsi tidak negatif.
assert.ok(data({ hours: 0 }).permille > 0); close(data({ hours: 0 }).permille, 13.0185 / 47.6)
assert.deepEqual(run({}), run({}))

// Konstanta dipatok literal.
assert.deepEqual({ ...WIDMARK_R }, { M: 0.68, F: 0.55 })
assert.deepEqual(JSON.parse(JSON.stringify(BAC_RANGES)), { weightKg: { min: 30, max: 200 }, hours: { min: 0, max: 12 }, drinkCount: { min: 0, max: 50 } })
assert.deepEqual(DRINKS.map((d) => [d.label, d.volumeMl, d.abv]), [
  [BEER, 330, 5], ['Beer, strong (330 ml, 8%)', 330, 8], [WINE, 150, 12], [SPIRIT, 30, 40], ['Cocktail (250 ml, 15%)', 250, 15],
])

// Berat: batas diterima, di luar ditolak tanpa data.
const GW = { ok: false, reason: 'Body weight must be 30–200 kg' }
for (const w of [30, 200]) assert.equal(run({ weightKg: w }).ok, true)
for (const w of [29.99, 0, -70, 200.01, Number.NaN, Infinity, -Infinity]) assert.deepEqual(run({ weightKg: w }), GW, `berat ${w}`)
for (const salah of [undefined, null, '70', {}] as unknown as number[]) assert.deepEqual(run({ weightKg: salah }), GW)
// Jam.
const GH = { ok: false, reason: 'Hours must be 0–12' }
for (const h of [0, 12]) assert.equal(run({ hours: h }).ok, true)
for (const h of [-0.5, 12.5, Number.NaN, Infinity]) assert.deepEqual(run({ hours: h }), GH, `jam ${h}`)
// Jumlah minuman: negatif dulu mengurangi total gram (BAC tampak lebih rendah); kini ditolak.
const GC = { ok: false, reason: `${BEER} count must be 0–50` }
for (const n of [0, 50]) assert.equal(run({ counts: { [BEER]: n } }).ok, true)
for (const n of [-1, 50.5, 51, Number.NaN, Infinity]) assert.deepEqual(run({ counts: { [BEER]: n } }), GC, `jumlah ${n}`)
const lama = (c: Record<string, number>) => DRINKS.reduce((s, d) => s + (c[d.label] ?? 0) * gramsOf(d), 0)
assert.ok(lama({ [BEER]: -2, [WINE]: 3 }) < lama({ [WINE]: 3 }), 'kontrol positif: negatif memang menurunkan total')
assert.equal(run({ counts: { [BEER]: -2, [WINE]: 3 } }).ok, false)
assert.deepEqual(run({ counts: { [WINE]: 99 } }), { ok: false, reason: 'Wine (150 ml, 12%) count must be 0–50' })
// Jenis kelamin.
assert.deepEqual(run({ sex: 'X' as 'M' }), { ok: false, reason: 'Sex must be M or F' })
// Regresi: berat 0/kosong dulu → pembagian dengan nol.
assert.equal(13.0185 / (0.68 * 0) - 0.15, Infinity)
assert.ok(Number.isNaN(Math.max(0, 0 / (0.68 * 0) - 0.15)))
assert.deepEqual(run({ weightKg: parseNumberField(''), counts: {} }), GW)
assert.equal('data' in run({ weightKg: 0 }), false)
// Urutan pemeriksaan: jenis kelamin → berat → jam → minuman.
assert.deepEqual(run({ weightKg: 0, hours: 99 }), GW)
assert.deepEqual(run({ hours: 99, counts: { [BEER]: -1 } }), GH)

// Halaman.
const src = readFileSync('src/pages/AlcoholCalculator.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { DRINKS, parseNumberField, widmarkBac } from '../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0')
assert.ok(!/Math\.max\(0|const r =|const beta|ETHANOL_DENSITY|gramsOf\(|\/ 8\b|\/ 14\b/.test(src), 'rumus/konstanta tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok && ('))
assert.ok(lines.some((l) => l.includes('{res.reason}')))
assert.ok(lines.includes('{res.ok && res.data.totalGrams > 0 && ('))

// Regresi: profil bawaan (pria 70 kg) tidak boleh disulihkan; hanya profil tersimpan, dan jenis kelamin kosong ditolak mesin.
assert.ok(!/\bgetDemo\(\)/.test(src) && src.includes('getDemoTersimpan()'), 'halaman tidak boleh memakai getDemo()')
assert.ok(!/\|\|\s*(70|'M')/.test(src), 'tanpa bawaan 70 kg / pria')
assert.deepEqual(run({ sex: '' as 'M' }), { ok: false, reason: 'Sex must be M or F' })

console.log('widmark-bac: hand values, sex/weight pairs, floor at zero, fail-closed weight/hours/counts, negative counts no longer lower BAC')
