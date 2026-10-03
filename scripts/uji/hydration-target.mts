import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hydrationTarget, HYDRATION_RANGES, INTENSITY_ML_PER_HOUR, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { weightKg: 70, exerciseMin: 0, intensity: 'moderate' as const, hotClimate: false, pregnant: false, breastfeeding: false }
const run = (o: Partial<typeof base> = {}) => hydrationTarget({ ...base, ...o })
const data = (o: Partial<typeof base> = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan: 70 kg × 33 = 2310 mL = 2.3 L (9.24 → 9 gelas).
const d0 = data()
assert.equal(d0.totalMl, 2310); close(d0.totalL, 2.31); assert.equal(d0.glasses, 9)
assert.deepEqual(d0.rows, [{ label: 'Baseline (33 mL/kg body weight)', ml: 2310 }])
// Olahraga: 90 menit sedang = 1.5 × 600 = 900 → 3210.
const d1 = data({ exerciseMin: 90 })
assert.equal(d1.totalMl, 3210); assert.equal(d1.rows[1].label, 'Exercise (90 min, moderate)'); assert.equal(d1.rows[1].ml, 900)
// Tiap intensitas (60 menit) = tabel per jam; "none" tidak menambah dan tidak membuat baris.
for (const [k, v] of [['none', 0], ['light', 400], ['moderate', 600], ['intense', 800]] as const) {
  assert.equal(data({ exerciseMin: 60, intensity: k }).totalMl, 2310 + v, k)
  assert.equal(data({ exerciseMin: 60, intensity: k }).rows.length, v > 0 ? 2 : 1, k)
}
// Tambahan tetap, masing-masing sendiri (pasangan): +500, +300, +700.
assert.equal(data({ hotClimate: true }).totalMl, 2810)
assert.equal(data({ pregnant: true }).totalMl, 2610)
assert.equal(data({ breastfeeding: true }).totalMl, 3010)
assert.equal(data({ hotClimate: true, pregnant: true, breastfeeding: true }).totalMl, 2310 + 1500)
assert.deepEqual(data({ hotClimate: true, pregnant: true, breastfeeding: true, exerciseMin: 60 }).rows.map((r) => r.label), [
  'Baseline (33 mL/kg body weight)', 'Exercise (60 min, moderate)', 'Hot/humid climate', 'Pregnancy', 'Breastfeeding',
])
// Pembulatan gelas tepat di batas .5: 125 mL lebih → 2435 / 250 = 9.74 → 10; 2375 / 250 = 9.5 → 10 (Math.round).
assert.equal(data({ weightKg: 70, hotClimate: false, exerciseMin: 6.5 / 1 }).glasses, Math.round((2310 + (6.5 / 60) * 600) / 250))
assert.deepEqual(run(), run())
// Regresi: halaman lama (rumus asli) pada grid.
const lama = (w: number, m: number, it: keyof typeof INTENSITY_ML_PER_HOUR, h: boolean, p: boolean, b: boolean) => w * 33 + (m / 60) * INTENSITY_ML_PER_HOUR[it] + (h ? 500 : 0) + (p ? 300 : 0) + (b ? 700 : 0)
let n = 0
for (const w of [30, 55, 70, 99.5, 200]) for (const m of [0, 15, 45, 90, 600]) for (const it of ['none', 'light', 'moderate', 'intense'] as const) for (const h of [false, true]) for (const p of [false, true]) for (const b of [false, true]) {
  assert.equal(data({ weightKg: w, exerciseMin: m, intensity: it, hotClimate: h, pregnant: p, breastfeeding: b }).totalMl, lama(w, m, it, h, p, b)); n++
}
assert.equal(n, 5 * 5 * 4 * 8)

// Konstanta dan rentang dipatok literal.
assert.deepEqual({ ...INTENSITY_ML_PER_HOUR }, { none: 0, light: 400, moderate: 600, intense: 800 })
assert.deepEqual(JSON.parse(JSON.stringify(HYDRATION_RANGES)), { weightKg: { min: 30, max: 200 }, exerciseMin: { min: 0, max: 600 } })
const GW = { ok: false, reason: 'Body weight must be 30–200 kg' }
for (const w of [30, 200]) assert.equal(run({ weightKg: w }).ok, true)
for (const w of [29.99, 0, -70, 200.01, Number.NaN, Infinity, -Infinity]) assert.deepEqual(run({ weightKg: w }), GW, `berat ${w}`)
for (const salah of [undefined, null, '70', {}] as unknown as number[]) assert.deepEqual(run({ weightKg: salah }), GW)
const GE = { ok: false, reason: 'Exercise must be 0–600 minutes' }
for (const m of [0, 600]) assert.equal(run({ exerciseMin: m }).ok, true)
for (const m of [-1, 600.01, 601, Number.NaN, Infinity]) assert.deepEqual(run({ exerciseMin: m }), GE, `menit ${m}`)
assert.deepEqual(run({ intensity: 'extreme' as 'none' }), { ok: false, reason: 'Unknown exercise intensity' })
assert.deepEqual(run({ intensity: 'toString' as 'none' }), { ok: false, reason: 'Unknown exercise intensity' }) // bukan properti prototipe
// Regresi: berat kosong dulu → 0 → target hanya tambahan (di sini 1.4 L tampak sah). Kontrol positif lalu penolakan.
assert.equal(lama(0, 0, 'moderate', true, false, true), 1200)
assert.deepEqual(run({ weightKg: parseNumberField(''), hotClimate: true, breastfeeding: true }), GW)
assert.equal('data' in run({ weightKg: 0 }), false)
assert.deepEqual(run({ weightKg: 0, exerciseMin: -1 }), GW) // urutan terdokumentasi

// Halaman.
const src = readFileSync('src/pages/HydrationCalculator.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { hydrationTarget, parseNumberField, type HydrationIntensity } from '../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0')
assert.ok(!/\*\s*33\b|INTENSITY_ML_PER_HOUR|const baseMl|const totalMl/.test(src), 'rumus/konstanta tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('))
assert.ok(lines.some((l) => l.includes('{res.reason}')))

console.log('hydration-target: hand values, per-intensity and add-on pairs, 800-case old-page regression, fail-closed weight/minutes, empty weight no longer a valid-looking target')
