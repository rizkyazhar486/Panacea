import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { autophagyTiming, AUTOPHAGY_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { bodyFatPct: 20, hoursSinceMeal: 2 }
type In = Parameters<typeof autophagyTiming>[0]
const run = (o: Partial<In> = {}) => autophagyTiming({ ...base, ...o })
const dekat = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)

// Nilai tangan: lemak 20% → dasar 14 − 0,8×2 = 12,4 h; makan 2 h lalu → sisa 10,4 h.
dekat(run().hoursRemaining, 10.4); assert.equal(run().started, false)
// Lemak 3% (batas bawah): 14 − 0,97×2 = 12,06; lemak 70%: 14 − 0,3×2 = 13,4 (lemak lebih tinggi → lebih lama).
dekat(run({ hoursSinceMeal: 0, bodyFatPct: 3 }).hoursRemaining, 12.06); dekat(run({ hoursSinceMeal: 0, bodyFatPct: 70 }).hoursRemaining, 13.4)
// Batas "sudah mulai": sisa tepat 0 vs masih 0,1 h (hanya jam yang berubah).
dekat(run({ hoursSinceMeal: 12.4 }).hoursRemaining, 0); assert.equal(run({ hoursSinceMeal: 12.4 }).started, true)
assert.equal(run({ hoursSinceMeal: 12.3 }).started, false)
assert.equal(run({ hoursSinceMeal: 72 }).started, true) // sisa tak pernah negatif
assert.deepEqual(run(), run()) // deterministik

// Kosong → bernama, tanpa angka. Pasangan: base lengkap menghasilkan angka.
const kosong = run({ bodyFatPct: NaN, hoursSinceMeal: NaN })
assert.deepEqual(kosong.missing, ['body fat', 'hours since last meal']); assert.equal(kosong.hoursRemaining, null); assert.equal(kosong.started, null)
assert.deepEqual(run({ bodyFatPct: NaN }).missing, ['body fat']); assert.equal(run({ bodyFatPct: NaN }).hoursRemaining, null)
// Regresi: kolom kosong dulu = 0 jam sejak makan → "10,4 h"/"12,4 h" seolah sah; kini tidak ada angka.
assert.equal(run({ hoursSinceMeal: NaN }).hoursRemaining, null)
// Di luar rentang / bukan angka → ditolak dengan alasan, tanpa angka.
assert.deepEqual(run({ bodyFatPct: 150 }).invalid, ['body fat must be 3–70 %']); assert.equal(run({ bodyFatPct: 150 }).hoursRemaining, null)
assert.deepEqual(run({ hoursSinceMeal: -1 }).invalid, ['hours since last meal must be 0–72 h'])
for (const bad of [Infinity, -Infinity]) assert.equal(run({ hoursSinceMeal: bad }).hoursRemaining, null)
assert.equal(run({ bodyFatPct: '20' as unknown as number }).hoursRemaining, null)
assert.equal(run({ bodyFatPct: null as unknown as number }).hoursRemaining, null)
// Batas rentang literal diterima; ±1 langkah ditolak.
for (const k of ['bodyFatPct', 'hoursSinceMeal'] as const) {
  const { min, max } = AUTOPHAGY_RANGES[k]
  assert.equal(run({ [k]: min }).invalid.length, 0, `${k} min`); assert.equal(run({ [k]: max }).invalid.length, 0, `${k} max`)
  assert.equal(run({ [k]: min - 0.1 }).invalid.length, 1, `${k} min-`); assert.equal(run({ [k]: max + 0.1 }).invalid.length, 1, `${k} max+`)
}

const page = readFileSync(new URL('../../src/pages/PredictiveModelsToolkit.tsx', import.meta.url), 'utf8')
const blok = page.slice(page.indexOf('function AutophagyTiming'), page.indexOf('function CortisolAwakening'))
assert.ok(/autophagyTiming\(\{/.test(blok) && /parseNumberField\(mealText\)/.test(blok), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(blok), '`|| 0` kembali di AutophagyTiming')
console.log('autophagy-timing: rumus tak berubah, kosong ≠ 0, di luar rentang gagal tertutup')
