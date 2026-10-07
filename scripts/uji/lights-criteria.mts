import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { lightsCriteria, LIGHTS_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { pleuralProtein: 3.5, serumProtein: 6.5, pleuralLdh: 180, serumLdh: 200, serumLdhUln: 200 }
const run = (o: Partial<typeof base>) => lightsCriteria({ ...base, ...o })
const mets = (o: Partial<typeof base>) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data.criteria.map((c) => c.met) : [] }
const exu = (o: Partial<typeof base>) => { const r = run(o); assert.ok(r.ok); return r.ok && r.data.exudate }

// Nilai tangan (bawaan halaman): 3.5/6.5 = 0.54 > 0.5 → terpenuhi; 180/200 = 0.90 > 0.6 → terpenuhi; 180 > ⅔×200 = 133.3 → terpenuhi.
const d = run({})
assert.ok(d.ok)
if (d.ok) {
  assert.deepEqual(d.data.criteria.map((c) => c.value), ['0.54', '0.90', '180'])
  assert.deepEqual(d.data.criteria.map((c) => c.label), ['Pleural/serum protein ratio > 0.5', 'Pleural/serum LDH ratio > 0.6', 'Pleural LDH > ⅔ upper limit of normal serum LDH'])
  assert.equal(d.data.exudate, true)
}
// Transudat klasik: semua kriteria tidak terpenuhi. 2/6 = 0.33; 100/200 = 0.5; 100 < 133.3.
assert.deepEqual(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 100 }), [false, false, false])
assert.equal(exu({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 100 }), false)
// Pasangan: tepat SATU kriteria cukup. Hanya protein: 4/6 = 0.67 > 0.5, LDH 100 → 0.5 dan 100 < 133.3.
assert.deepEqual(mets({ pleuralProtein: 4, serumProtein: 6, pleuralLdh: 100 }), [true, false, false])
assert.equal(exu({ pleuralProtein: 4, serumProtein: 6, pleuralLdh: 100 }), true)
// Hanya rasio LDH: 130/200 = 0.65 > 0.6, 130 < 133.3, protein 0.33.
assert.deepEqual(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 130 }), [false, true, false])
// Hanya ⅔ ULN: serum LDH 1000 (rasio 0.14), ULN 200 → 140 > 133.3.
assert.deepEqual(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 140, serumLdh: 1000 }), [false, false, true])
// Batas ">" tepat: protein 3/6 = 0.5 tidak; LDH 120/200 = 0.6 tidak (aritmetika sama dengan halaman lama); 2/3×300 = 200.
assert.equal(mets({ pleuralProtein: 3, serumProtein: 6, pleuralLdh: 100 })[0], false)
assert.equal(mets({ pleuralProtein: 3.01, serumProtein: 6, pleuralLdh: 100 })[0], true)
assert.equal(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 120 })[1], 120 / 200 > 0.6)
assert.equal(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 121 })[1], true)
assert.equal(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 100, serumLdh: 1000, serumLdhUln: 150 })[2], 100 / ((2 / 3) * 150) > 1)
assert.equal(mets({ pleuralProtein: 2, serumProtein: 6, pleuralLdh: 101, serumLdh: 1000, serumLdhUln: 150 })[2], true)
assert.deepEqual(run({}), run({}))

// Regresi vs halaman lama pada grid: hasil identik untuk semua masukan valid.
const lama = (pp: number, sp: number, pl: number, sl: number, u: number) => {
  const pr = sp > 0 ? pp / sp : 0, lr = sl > 0 ? pl / sl : 0, lu = u > 0 ? pl / ((2 / 3) * u) : 0
  return [pr > 0.5, lr > 0.6, lu > 1]
}
let n = 0
for (const pp of [0.5, 2, 3, 3.5, 5]) for (const sp of [4, 6, 6.5, 8]) for (const pl of [50, 120, 133, 134, 200, 900]) for (const sl of [100, 200, 400]) for (const u of [150, 200, 250]) {
  assert.deepEqual(mets({ pleuralProtein: pp, serumProtein: sp, pleuralLdh: pl, serumLdh: sl, serumLdhUln: u }), lama(pp, sp, pl, sl, u)); n++
}
assert.equal(n, 5 * 4 * 6 * 3 * 3)

// Rentang dipatok literal.
assert.deepEqual(JSON.parse(JSON.stringify(LIGHTS_RANGES)), {
  pleuralProtein: { min: 0.1, max: 15, unit: ' g/dL', name: 'Pleural protein' }, serumProtein: { min: 0.5, max: 15, unit: ' g/dL', name: 'Serum protein' },
  pleuralLdh: { min: 1, max: 20000, unit: ' IU/L', name: 'Pleural LDH' }, serumLdh: { min: 1, max: 20000, unit: ' IU/L', name: 'Serum LDH' },
  serumLdhUln: { min: 1, max: 2000, unit: ' IU/L', name: 'Serum LDH upper limit' },
})
for (const k of Object.keys(LIGHTS_RANGES) as (keyof typeof LIGHTS_RANGES)[]) {
  const { min, max, unit, name } = LIGHTS_RANGES[k]
  assert.equal(run({ [k]: min }).ok, true, `${k} min`); assert.equal(run({ [k]: max }).ok, true, `${k} max`)
  for (const buruk of [min - 0.001, max + 0.001, Number.NaN, Infinity, -Infinity, 0, -1]) {
    if (buruk >= min && buruk <= max) continue
    const r = run({ [k]: buruk })
    assert.deepEqual(r, { ok: false, reason: `${name} must be ${min}–${max}${unit}` }, `${k}=${buruk}`)
    assert.equal('data' in r, false)
  }
  for (const salah of [undefined, null, '5', {}] as unknown as number[]) assert.equal(run({ [k]: salah }).ok, false, `${k} tipe`)
}
// Regresi: semua kolom kosong dulu → semua rasio 0 → "Transudate". Kini ditolak, dan serum kosong tidak lagi membuat rasio 0.
assert.deepEqual(lama(0, 0, 0, 0, 0), [false, false, false])
assert.deepEqual(lightsCriteria({ pleuralProtein: NaN, serumProtein: NaN, pleuralLdh: NaN, serumLdh: NaN, serumLdhUln: NaN }), { ok: false, reason: 'Pleural protein must be 0.1–15 g/dL' })
assert.deepEqual(run({ serumProtein: parseNumberField('') }), { ok: false, reason: 'Serum protein must be 0.5–15 g/dL' })
assert.deepEqual(run({ serumLdh: parseNumberField(' ') }), { ok: false, reason: 'Serum LDH must be 1–20000 IU/L' })
assert.deepEqual(run({ pleuralProtein: 0, pleuralLdh: -5 }), { ok: false, reason: 'Pleural protein must be 0.1–15 g/dL' }) // urutan terdokumentasi

// Halaman.
const src = readFileSync('src/pages/clinical/scores/LightsCriteria.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { lightsCriteria, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.equal(src.match(/parseNumberField\(/g)?.length, 5)
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0')
assert.ok(!/proteinRatio|ldhRatio|ldhVsUln/.test(src), 'rumus tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('))
assert.ok(lines.some((l) => l.includes('{res.reason}')))
assert.ok(lines.some((l) => l.includes('res.data.exudate ?')))
assert.ok(lines.includes('{res.data.criteria.map((c) => ('))

console.log("lights-criteria: hand values, each criterion alone suffices, exact cutoffs, old-page grid regression, fail-closed ranges, empty fields no longer 'Transudate'")
