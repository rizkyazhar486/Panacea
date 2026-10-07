import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { childPugh, childPughClass, cpBilirubinPts, cpAlbuminPts, cpInrPts, CP_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { bilirubin: 1.5, albumin: 4.0, inr: 1.2, ascites: 1, enceph: 1 }
const run = (o: Partial<typeof base> = {}) => childPugh({ ...base, ...o })

// Nilai tangan: bilirubin 1.5 → 1; albumin 4.0 → 1; INR 1.2 → 1; asites 1; ensefalopati 1 = 5 → Class A.
const d = run()
assert.equal(d.pts, 5); assert.deepEqual(d.cls, { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' })
assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
// Maksimum: bilirubin 4 (3), albumin 2.0 (3), INR 3 (3), asites 3, ensefalopati 3 = 15 → Class C.
const c = run({ bilirubin: 4, albumin: 2, inr: 3, ascites: 3, enceph: 3 })
assert.equal(c.pts, 15); assert.deepEqual(c.cls, { label: 'Class C', tone: 'critical', survival: '~45% 1-year, ~35% 2-year survival' })
// Pasangan: hanya asites naik 1→2 menambah tepat 1 poin; ensefalopati sama.
assert.equal(run({ ascites: 2 }).pts, 6); assert.equal(run({ enceph: 2 }).pts, 6); assert.equal(run({ ascites: 3, enceph: 3 }).pts, 9)
// Kelas tepat di batas 6/7 dan 9/10.
for (const [s, l, t, sv] of [[5, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [6, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [7, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [9, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [10, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival'], [15, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival']] as const) assert.deepEqual(childPughClass(s), { label: l, tone: t, survival: sv }, `skor ${s}`)
// Ambang campuran: bilirubin (<2 →1, ≤3 →2, >3 →3), albumin (>3.5 →1, ≥2.8 →2), INR (<1.7 →1, ≤2.3 →2).
for (const [v, e] of [[1.99, 1], [2, 2], [3, 2], [3.01, 3]] as const) assert.equal(cpBilirubinPts(v), e, `bili ${v}`)
for (const [v, e] of [[3.51, 1], [3.5, 2], [2.8, 2], [2.79, 3]] as const) assert.equal(cpAlbuminPts(v), e, `alb ${v}`)
for (const [v, e] of [[1.69, 1], [1.7, 2], [2.3, 2], [2.31, 3]] as const) assert.equal(cpInrPts(v), e, `inr ${v}`)
assert.equal(run({ bilirubin: 2 }).pts, 6); assert.equal(run({ bilirubin: 3 }).pts, 6); assert.equal(run({ bilirubin: 3.01 }).pts, 7)
assert.deepEqual(run(), run())

// Kosong → "belum diisi" bernama, tanpa kelas; pasangan hanya satu kosong.
const kosong = run({ bilirubin: NaN, albumin: NaN, inr: NaN })
assert.deepEqual(kosong.missing, ['total bilirubin', 'albumin', 'INR']); assert.equal(kosong.pts, null); assert.equal(kosong.cls, null); assert.deepEqual(kosong.invalid, [])
const satu = run({ inr: NaN }); assert.deepEqual(satu.missing, ['INR']); assert.equal(satu.cls, null)
// Regresi: dulu bilirubin 999 / INR 99 lolos "> 0" dan tampil sebagai kelas; kontrol positif lalu penolakan.
assert.equal(cpBilirubinPts(999), 3)
assert.deepEqual(run({ bilirubin: 999 }).invalid, ['total bilirubin must be 0.1–60 mg/dL']); assert.equal(run({ bilirubin: 999 }).cls, null)
assert.deepEqual(run({ inr: 99 }).invalid, ['INR must be 0.5–15'])

// Rentang dipatok literal; batas diterima, di luar ditolak.
assert.deepEqual(JSON.parse(JSON.stringify(CP_RANGES)), {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' }, albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' }, inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
})
for (const k of ['bilirubin', 'albumin', 'inr'] as const) {
  const { min, max } = CP_RANGES[k]
  assert.notEqual(run({ [k]: min }).pts, null, `${k} min`); assert.notEqual(run({ [k]: max }).pts, null, `${k} max`)
  for (const bad of [min - 0.01, max + 0.01, 0, -1, Infinity, -Infinity]) {
    if (bad >= min && bad <= max) continue
    const r = run({ [k]: bad }); assert.equal(r.pts, null, `${k}=${bad}`); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, []); assert.equal(r.cls, null)
  }
  for (const salah of [null, '5', {}, undefined] as unknown as number[]) assert.equal(run({ [k]: salah }).pts, null, `${k} tipe`)
}
for (const lv of [0, 4, 1.5, NaN, Infinity, -1]) {
  assert.deepEqual(run({ ascites: lv }).invalid, ['Ascites level must be 1–3'], `asites ${lv}`); assert.equal(run({ ascites: lv }).pts, null)
  assert.deepEqual(run({ enceph: lv }).invalid, ['Encephalopathy level must be 1–3'], `ens ${lv}`); assert.equal(run({ enceph: lv }).cls, null)
}
const banyak = run({ bilirubin: NaN, inr: 99, ascites: 9 }); assert.deepEqual(banyak.missing, ['total bilirubin']); assert.equal(banyak.invalid.length, 2)

// Regresi vs aturan halaman lama pada grid.
const B = (v: number) => (v < 2 ? 1 : v <= 3 ? 2 : 3), A = (v: number) => (v > 3.5 ? 1 : v >= 2.8 ? 2 : 3), I = (v: number) => (v < 1.7 ? 1 : v <= 2.3 ? 2 : 3)
let n = 0
for (const bilirubin of [0.5, 1.99, 2, 2.5, 3, 3.01, 10]) for (const albumin of [1.5, 2.79, 2.8, 3.2, 3.5, 3.51, 5]) for (const inr of [1, 1.69, 1.7, 2, 2.3, 2.31, 4]) for (const ascites of [1, 2, 3]) for (const enceph of [1, 2, 3]) {
  assert.equal(run({ bilirubin, albumin, inr, ascites, enceph }).pts, B(bilirubin) + A(albumin) + I(inr) + ascites + enceph); n++
}
assert.equal(n, 7 * 7 * 7 * 9)

// Halaman.
const src = readFileSync('src/pages/clinical/scores/ChildPughScore.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { childPugh, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/function (bilirubin|albumin|inr)Pts|function classify/.test(src), 'ambang tidak boleh disalin ke halaman')
assert.ok(lines.includes('{lengkap && cls !== null && pts !== null ? ('))
assert.ok(lines.includes('{lengkap && pts !== null && ('), 'titik tren hanya untuk skor lengkap yang sah')
assert.ok(lines.some((l) => l.includes('res.invalid.map(')))

console.log('child-pugh: hand values, mixed-operator cutoffs, class bands, missing vs invalid, 2401-case old-rule regression, bilirubin 999 / INR 99 no longer scored')
