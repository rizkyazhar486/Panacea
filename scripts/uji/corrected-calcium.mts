import assert from 'node:assert/strict'
import { correctedCalcium, calciumBand, CALCIUM_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const run = (totalCa: number, albumin: number) => correctedCalcium({ totalCa, albumin })

// Valor tangan Payne 1973: 7.6 + 0.8 × (4.0 − 2.0) = 9.2; total "Hypocalcemia" menjadi koreksi "Normal".
const d = run(7.6, 2.0)
assert.ok(Math.abs((d.corrected as number) - 9.2) < 1e-9)
assert.deepEqual(d.totalBand, { label: 'Hypocalcemia', tone: 'low' }); assert.deepEqual(d.correctedBand, { label: 'Normal', tone: 'brand' })
assert.equal(d.changesCategory, true); assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
// Pasangan: albumin 4.0 tidak mengubah angka maupun kategori; albumin > 4 menurunkan nilai.
assert.equal(run(9, 4.0).corrected, 9); assert.equal(run(9, 4.0).changesCategory, false)
assert.ok(Math.abs((run(9, 5.0).corrected as number) - 8.2) < 1e-9)

// Pita tepat di batas: 6.99 / 7.0 / 8.49 / 8.5 / 10.5 / 10.51 / 12 / 12.01.
for (const [v, l] of [[6.99, 'Severe hypocalcemia'], [7.0, 'Hypocalcemia'], [8.49, 'Hypocalcemia'], [8.5, 'Normal'], [10.5, 'Normal'], [10.51, 'Hypercalcemia'], [12, 'Hypercalcemia'], [12.01, 'Severe hypercalcemia']] as const) assert.equal(calciumBand(v).label, l, `Ca ${v}`)

// Kosong (NaN) → "belum diisi" bernama, tanpa angka/pita; pasangan: satu kosong saja.
const kosong = run(NaN, NaN)
assert.deepEqual(kosong.missing, ['measured total calcium', 'measured albumin']); assert.equal(kosong.corrected, null); assert.equal(kosong.totalBand, null); assert.equal(kosong.correctedBand, null); assert.deepEqual(kosong.invalid, [])
assert.deepEqual(run(8, NaN).missing, ['measured albumin']); assert.equal(run(8, NaN).corrected, null)

// Regresi: dulu Ca 999 / albumin 50 lolos `> 0` dan menghasilkan kategori; sekarang ditolak dengan alasan dan tanpa angka.
assert.equal(calciumBand(999).label, 'Severe hypercalcemia')
for (const [r, msg] of [[run(999, 4), 'total calcium must be 1–25 mg/dL'], [run(9, 50), 'albumin must be 0.5–7 g/dL']] as const) {
  assert.deepEqual(r.invalid, [msg]); assert.equal(r.corrected, null); assert.equal(r.totalBand, null); assert.deepEqual(r.missing, []); assert.equal(r.changesCategory, false)
}

// Rentang literal; batas diterima, di luar/0/negatif/Infinity/tipe salah ditolak (bukan "belum diisi").
assert.deepEqual(JSON.parse(JSON.stringify(CALCIUM_RANGES)), { totalCa: { min: 1, max: 25, name: 'total calcium', unit: ' mg/dL' }, albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' } })
for (const k of ['totalCa', 'albumin'] as const) {
  const { min, max } = CALCIUM_RANGES[k]
  const mk = (v: unknown) => correctedCalcium({ totalCa: 9, albumin: 4, [k]: v } as never)
  assert.notEqual(mk(min).corrected, null, `${k} min`); assert.notEqual(mk(max).corrected, null, `${k} max`)
  for (const bad of [min - 0.01, max + 0.01, 0, -1, Infinity, -Infinity, null, '5', {}, undefined]) {
    const r = mk(bad); assert.equal(r.corrected, null, `${k}=${String(bad)}`); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, [])
  }
}
// Determinisme.
assert.deepEqual(run(7.6, 2.0), run(7.6, 2.0))
console.log('corrected-calcium: ok')
