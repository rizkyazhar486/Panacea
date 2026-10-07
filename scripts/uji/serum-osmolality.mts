import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { serumOsmolality, osmBand, gapBand, OSM_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { na: 140, glucose: 90, bun: 14 }
const run = (o: Record<string, number | undefined> = {}) => serumOsmolality({ ...base, ...o })
const data = (o: Record<string, number | undefined> = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan: 2·140 + 90/18 + 14/2.8 = 280 + 5 + 5 = 290 → Normal; tanpa terukur: tidak ada selisih.
const d = data()
close(d.calculated, 290); assert.deepEqual(d.band, { label: 'Normal', tone: 'brand' }); assert.equal(d.gap, null); assert.equal(d.gapBand, null)
// Terukur 310 → selisih 20 → "Elevated gap" (> 10, bukan > 20).
const g = data({ measured: 310 })
close(g.gap as number, 20); assert.deepEqual(g.gapBand, { label: 'Elevated gap', tone: 'low' })
assert.deepEqual(data({ measured: 330 }).gapBand, { label: 'Markedly elevated gap', tone: 'critical' })
assert.deepEqual(data({ measured: 285 }).gapBand, { label: 'Normal gap', tone: 'brand' })
assert.deepEqual(data({ measured: 270 }).gapBand, { label: 'Negative gap — recheck values/units', tone: 'low' })
// Etanol: ethanol/3.7 ditambahkan hanya bila > 0. 92 mg/dL → +24.864…; etanol 0 sama dengan tanpa etanol (pasangan).
close(data({ ethanol: 92 }).calculated, 290 + 92 / 3.7)
assert.equal(data({ ethanol: 0 }).calculated, data().calculated)
// Catatan: `ethanol > 0` pada engine setara dengan `ethanol !== undefined` karena rentang melarang etanol negatif dan 0/3.7 = 0 (mutan setara, terbukti).
// Pita osmolalitas dan selisih tepat di batas.
for (const [v, l] of [[274.99, 'Hypo-osmolal'], [275, 'Normal'], [295, 'Normal'], [295.01, 'Hyperosmolal'], [320, 'Hyperosmolal'], [320.01, 'Severely hyperosmolal']] as const) assert.equal(osmBand(v).label, l, `osm ${v}`)
for (const [v, l] of [[20.01, 'Markedly elevated gap'], [20, 'Elevated gap'], [10.01, 'Elevated gap'], [10, 'Normal gap'], [-10, 'Normal gap'], [-10.01, 'Negative gap — recheck values/units']] as const) assert.equal(gapBand(v).label, l, `gap ${v}`)
assert.deepEqual(osmBand(274.99).tone, 'low'); assert.equal(osmBand(320.01).tone, 'critical'); assert.equal(gapBand(20.01).tone, 'critical'); assert.equal(gapBand(-10).tone, 'brand')
assert.deepEqual(run(), run())

// Regresi vs halaman lama pada grid.
const lama = (na: number, glu: number, bun: number, eth: number, meas: number) => {
  const c = 2 * na + glu / 18 + bun / 2.8 + (eth > 0 ? eth / 3.7 : 0); return { c, gap: meas > 0 ? meas - c : null }
}
let n = 0
for (const na of [115, 135, 140, 150, 170]) for (const glu of [60, 90, 400, 1200]) for (const bun of [5, 14, 80]) for (const eth of [0, 50, 300]) for (const meas of [0, 280, 300, 340, 450]) {
  const o = lama(na, glu, bun, eth, meas); const r = data({ na, glucose: glu, bun, ethanol: eth, measured: meas === 0 ? undefined : meas })
  assert.equal(r.calculated, o.c); assert.equal(r.gap, o.gap); n++
}
assert.equal(n, 5 * 4 * 3 * 3 * 5)

// Rentang dipatok literal; batas diterima, di luar ditolak tanpa data.
assert.deepEqual(JSON.parse(JSON.stringify(OSM_RANGES)), {
  na: { min: 90, max: 200, name: 'Na', unit: ' mmol/L' }, glucose: { min: 20, max: 2000, name: 'Glucose', unit: ' mg/dL' }, bun: { min: 1, max: 300, name: 'BUN', unit: ' mg/dL' },
  ethanol: { min: 0, max: 1000, name: 'Ethanol', unit: ' mg/dL' }, measured: { min: 150, max: 600, name: 'Measured osmolality', unit: ' mOsm/kg' },
})
for (const k of Object.keys(OSM_RANGES) as (keyof typeof OSM_RANGES)[]) {
  const { min, max, name, unit } = OSM_RANGES[k]
  assert.equal(run({ [k]: min }).ok, true, `${k} min`); assert.equal(run({ [k]: max }).ok, true, `${k} max`)
  for (const bad of [min - 0.001, max + 0.001, Number.NaN, Infinity, -Infinity]) {
    const r = run({ [k]: bad }); assert.deepEqual(r, { ok: false, reason: `${name} must be ${min}–${max}${unit}` }, `${k}=${bad}`); assert.equal('data' in r, false)
  }
  for (const salah of [null, '5', {}] as unknown as number[]) assert.equal(run({ [k]: salah }).ok, false, `${k} tipe`)
}
for (const k of ['na', 'glucose', 'bun'] as const) assert.equal(run({ [k]: undefined }).ok, false, `${k} wajib`)
for (const k of ['ethanol', 'measured'] as const) assert.equal(run({ [k]: undefined }).ok, true, `${k} opsional`)
// Regresi: Na kosong dulu → 0 → "Hypo-osmolal" dengan angka palsu; terukur "0" dulu diam-diam dianggap tidak diberikan.
assert.equal(lama(0, 90, 14, 0, 0).c < 275, true)
assert.deepEqual(run({ na: parseNumberField('') }), { ok: false, reason: 'Na must be 90–200 mmol/L' })
assert.deepEqual(run({ measured: 0 }), { ok: false, reason: 'Measured osmolality must be 150–600 mOsm/kg' })
assert.deepEqual(run({ na: 0, glucose: -1 }), { ok: false, reason: 'Na must be 90–200 mmol/L' }) // urutan terdokumentasi

// Halaman.
const src = readFileSync('src/pages/clinical/scores/SerumOsmolality.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { parseNumberField, serumOsmolality } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/2 \* na|function gapBand|function osmBand|\/ 18|\/ 2\.8/.test(src), 'rumus tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('))
assert.ok(lines.some((l) => l.includes('{res.reason}')))
assert.ok(lines.includes("const optional = (t: string) => (t.trim() === '' ? undefined : parseNumberField(t))"))

console.log('serum-osmolality: hand values, band/gap cutoffs, optional ethanol/measured, 900-case old-page regression, fail-closed ranges, empty Na no longer hypo-osmolal')
