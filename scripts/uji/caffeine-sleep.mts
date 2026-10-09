import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { caffeineAtBedtime, caffeineBand, caffeineDecayCurve, CAFFEINE_DRINKS, CAFFEINE_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { servings: { 'Brewed coffee (240 ml)': 1 }, customMg: NaN, consumedAt: '08:00', bedtime: '22:00', halfLifeH: 5 }
type In = Parameters<typeof caffeineAtBedtime>[0]
const run = (o: Partial<In> = {}) => caffeineAtBedtime({ ...base, ...o } as In)
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan: 95 mg, 14 jam, t½ 5 → 95×0,5^(2,8) = 13,6…; pct = 0,5^2,8×100 = 14,35…
const r = run(); close(r.totalDoseMg, 95); close(r.hoursUntilBed, 14); close(r.remainingMg, 95 * Math.pow(0.5, 2.8)); close(r.pctAtBed, Math.pow(0.5, 2.8) * 100)
assert.equal(r.band, 'near'); close(r.hoursTo12pct, 15); assert.equal(r.curve.length, 17); close(r.curve[5], 95 * 0.5)
// Tepat satu waktu paruh → setengah; dosis jamak + mg tambahan dijumlahkan.
close(run({ bedtime: '13:00' }).remainingMg, 47.5)
close(run({ servings: { 'Brewed coffee (240 ml)': 2, 'Espresso shot': 1 }, customMg: 10 }).totalDoseMg, 2 * 95 + 63 + 10)
// Lewat tengah malam: konsumsi 23:00, tidur 01:00 = 2 jam; sama jam = 0 jam.
close(run({ consumedAt: '23:00', bedtime: '01:00' }).hoursUntilBed, 2); close(run({ consumedAt: '22:00', bedtime: '22:00' }).hoursUntilBed, 0)
// Pita: >25 high; >12,5 near; ≤12,5 low (batas tepat termasuk pita bawah).
for (const [p, b] of [[25.01, 'high'], [25, 'near'], [12.51, 'near'], [12.5, 'low']] as const) assert.equal(caffeineBand(p), b, String(p))
// Tidak minum: kosong = 0 mg, sah (tanpa penolakan), pct 0.
const nol = run({ servings: { 'Brewed coffee (240 ml)': NaN } }); assert.deepEqual(nol.invalid, []); assert.equal(nol.totalDoseMg, 0); assert.equal(nol.pctAtBed, 0)
close(caffeineDecayCurve(100, 5, 2)[2], 100 * Math.pow(0.5, 0.4)); assert.ok(CAFFEINE_DRINKS.every((d) => d.mg > 0))
assert.deepEqual(run(), run())

// Negatif / di luar rentang: ditolak, tanpa angka (dulu porsi -5 menghasilkan dosis negatif, 1e9 porsi lolos).
const tolak = (o: Partial<In>, pesan: string) => { const x = run(o); assert.deepEqual(x.invalid, [pesan]); assert.equal(x.totalDoseMg, null); assert.equal(x.remainingMg, null); assert.equal(x.band, null); assert.equal(x.curve.length, 0) }
tolak({ servings: { 'Brewed coffee (240 ml)': -1 } }, 'Brewed coffee (240 ml) servings must be 0–20')
tolak({ servings: { 'Brewed coffee (240 ml)': 1e9 } }, 'Brewed coffee (240 ml) servings must be 0–20')
tolak({ servings: { 'Brewed coffee (240 ml)': Infinity } }, 'Brewed coffee (240 ml) servings must be 0–20')
tolak({ servings: { 'Mystery brew': 1 } }, 'unknown drink: Mystery brew')
tolak({ customMg: -5 }, 'custom caffeine must be 0–2000 mg'); tolak({ customMg: 1e6 }, 'custom caffeine must be 0–2000 mg')
tolak({ halfLifeH: 0 }, 'half-life must be 1.5–9.5 hours'); tolak({ halfLifeH: 100 }, 'half-life must be 1.5–9.5 hours'); tolak({ halfLifeH: NaN }, 'half-life must be 1.5–9.5 hours')
tolak({ consumedAt: '' }, 'time consumed must be a valid HH:MM time'); tolak({ bedtime: '25:00' }, 'bedtime must be a valid HH:MM time')
tolak({ bedtime: '22:60' }, 'bedtime must be a valid HH:MM time'); tolak({ consumedAt: 800 as unknown as string }, 'time consumed must be a valid HH:MM time')
// Batas rentang: diterima; ± ditolak.
// Literais, bukan CAFFEINE_RANGES: mutan yang menggeser konstanta harus gagal oleh nama, bukan ikut bergeser.
for (const v of [0, 20]) assert.equal(run({ servings: { 'Espresso shot': v } }).invalid.length, 0, `servings ${v}`)
for (const v of [-1, 21]) assert.equal(run({ servings: { 'Espresso shot': v } }).invalid.length, 1, `servings ${v}`)
for (const v of [0, 2000]) assert.equal(run({ customMg: v }).invalid.length, 0, `custom ${v}`)
for (const v of [-1, 2001]) assert.equal(run({ customMg: v }).invalid.length, 1, `custom ${v}`)
for (const v of [1.5, 9.5]) assert.equal(run({ halfLifeH: v }).invalid.length, 0, `half-life ${v}`)
for (const v of [1.4, 9.6]) assert.equal(run({ halfLifeH: v }).invalid.length, 1, `half-life ${v}`)
for (const t of ['00:00', '23:59']) assert.equal(run({ bedtime: t }).invalid.length, 0, t)
for (const t of ['24:00', '23:60', '7:00', '07:5']) assert.equal(run({ bedtime: t }).invalid.length, 1, t)
assert.deepEqual([CAFFEINE_RANGES.servings.max, CAFFEINE_RANGES.customMg.max, CAFFEINE_RANGES.halfLifeH.min, CAFFEINE_RANGES.halfLifeH.max], [20, 2000, 1.5, 9.5])

const page = readFileSync(new URL('../../src/pages/CaffeineCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/caffeineAtBedtime\(\{/.test(page) && /parseNumberField\(v\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page) && /hasil\.invalid\.length === 0 && totalDose > 0/.test(page), 'hasil tidak digerbang oleh validasi')
console.log('caffeine-sleep: nilai tangan 13,6 mg/14,35%, pita 25/12,5, lewat tengah malam, kosong=0 sah, di luar rentang gagal tertutup')
