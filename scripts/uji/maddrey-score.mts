import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { maddreyScore, MADDREY_RANGES, DF_COEFFICIENT, SEVERE_DF_THRESHOLD } from '../../src/domains/clinical-calculators/index.ts'

const base = { bilirubin: 3, patientPt: 14, controlPt: 12 }
const run = (o: Partial<typeof base> = {}) => maddreyScore({ ...base, ...o })
const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan: DF = 4.6 × (14 − 12) + 3 = 12.2 → tidak berat.
const d = run()
close(d.df, 12.2); close(d.ptDiff, 2); assert.equal(d.severe, false); assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
assert.equal(DF_COEFFICIENT, 4.6); assert.equal(SEVERE_DF_THRESHOLD, 32)
// Kasus berat: bilirubin 8, PT 22 vs kontrol 12 → 4.6 × 10 + 8 = 54 ≥ 32.
const berat = run({ bilirubin: 8, patientPt: 22, controlPt: 12 }); close(berat.df, 54); assert.equal(berat.severe, true)
// Batas tepat 32: bilirubin 3.4 + 4.6×6.2 = tepat 32 (6.2 → PT 18.2 vs 12). Dihitung dengan aritmetika yang sama seperti mesin.
const tepat = run({ bilirubin: 4, patientPt: 18, controlPt: 12 }) // 4.6×6 + 4 = 31.6 → tidak berat
close(tepat.df, 31.6); assert.equal(tepat.severe, false)
const lewat = run({ bilirubin: 4.4, patientPt: 18, controlPt: 12 }) // 27.6 + 4.4 = 32.0
assert.equal(lewat.severe, (4.6 * 6 + 4.4) >= 32)
assert.equal(run({ bilirubin: 5, patientPt: 18, controlPt: 12 }).severe, true) // 32.6
// Pasangan: hanya bilirubin yang berbeda memutar keputusan 31.6 ↔ 32.6 (selisih tepat 1 mg/dL).
assert.notEqual(run({ bilirubin: 4, patientPt: 18, controlPt: 12 }).severe, run({ bilirubin: 5, patientPt: 18, controlPt: 12 }).severe)
// Batas eksak tanpa galat float: PT pasien = kontrol → DF = bilirubin. 32 → berat (≥), 31.99 → tidak.
assert.equal(run({ bilirubin: 32, patientPt: 12, controlPt: 12 }).severe, true)
assert.equal(run({ bilirubin: 31.99, patientPt: 12, controlPt: 12 }).severe, false)
// PT pasien lebih pendek dari kontrol tetap diterima (selisih negatif), seperti sebelumnya.
const neg = run({ patientPt: 11, controlPt: 12 }); close(neg.df, 4.6 * -1 + 3); close(neg.ptDiff, -1); assert.equal(neg.severe, false)
assert.deepEqual(run(), run())

// Kosong → "belum diisi" bernama, tanpa DF/selisih/penilaian.
const kosong = run({ bilirubin: NaN, patientPt: NaN, controlPt: NaN })
assert.deepEqual(kosong.missing, ['total bilirubin', 'patient PT', 'control PT']); assert.equal(kosong.df, null); assert.equal(kosong.ptDiff, null); assert.equal(kosong.severe, null); assert.deepEqual(kosong.invalid, [])
const satu = run({ controlPt: NaN }); assert.deepEqual(satu.missing, ['control PT']); assert.equal(satu.severe, null)
// Regresi: dulu PT 5000 detik lolos "> 0" → DF raksasa "Severe"; kontrol positif lalu penolakan.
assert.ok(4.6 * (5000 - 12) + 3 >= 32)
assert.deepEqual(run({ patientPt: 5000 }).invalid, ['patient PT must be 5–150 s']); assert.equal(run({ patientPt: 5000 }).severe, null); assert.equal(run({ patientPt: 5000 }).df, null)
assert.deepEqual(run({ bilirubin: 999 }).invalid, ['total bilirubin must be 0.1–60 mg/dL'])
assert.deepEqual(run({ controlPt: 2 }).invalid, ['control PT must be 5–60 s'])

// Rentang dipatok literal; batas diterima, di luar ditolak tanpa nilai.
assert.deepEqual(JSON.parse(JSON.stringify(MADDREY_RANGES)), {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' }, patientPt: { min: 5, max: 150, name: 'patient PT', unit: ' s' }, controlPt: { min: 5, max: 60, name: 'control PT', unit: ' s' },
})
for (const k of ['bilirubin', 'patientPt', 'controlPt'] as const) {
  const { min, max } = MADDREY_RANGES[k]
  assert.notEqual(run({ [k]: min }).df, null, `${k} min`); assert.notEqual(run({ [k]: max }).df, null, `${k} max`)
  for (const bad of [min - 0.01, max + 0.01, 0, -1, Infinity, -Infinity]) {
    if (bad >= min && bad <= max) continue
    const r = run({ [k]: bad }); assert.equal(r.df, null, `${k}=${bad}`); assert.equal(r.severe, null); assert.equal(r.ptDiff, null); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, [])
  }
  for (const salah of [null, '5', {}, undefined] as unknown as number[]) assert.equal(run({ [k]: salah }).df, null, `${k} tipe`)
}
const banyak = run({ bilirubin: NaN, patientPt: 999, controlPt: 1 }); assert.deepEqual(banyak.missing, ['total bilirubin']); assert.equal(banyak.invalid.length, 2)

// Regresi vs rumus halaman lama pada grid.
let n = 0
for (const bilirubin of [0.5, 2, 8, 20, 55]) for (const patientPt of [8, 12, 15, 22, 40, 120]) for (const controlPt of [8, 12, 14, 50]) {
  const r = run({ bilirubin, patientPt, controlPt }); const df = 4.6 * (patientPt - controlPt) + bilirubin
  assert.equal(r.df, df); assert.equal(r.severe, df >= 32); n++
}
assert.equal(n, 5 * 6 * 4)

// Halaman.
const src = readFileSync('src/pages/clinical/scores/MaddreyScore.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { maddreyScore, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/4\.6 \*|df >= 32/.test(src.replace(/\(≥32\)|\(<32\)/g, '')), 'rumus/ambang tidak boleh disalin ke halaman')
assert.ok(lines.includes('const severe = res.severe === true'))
assert.ok(lines.includes('const lengkap = res.df !== null'))
assert.ok(lines.some((l) => l.includes('res.invalid.map(')))

console.log('maddrey-score: hand values, exact 32 cutoff, missing vs invalid, 120-case old-formula regression, PT 5000 no longer "severe"')
