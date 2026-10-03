import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { childPugh, childPughClass, childPughBilirubinPts, childPughAlbuminPts, childPughInrPts, CHILD_PUGH_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { bili: 1, alb: 4, inr: 1.2, ascites: 1, enceph: 1 }
const run = (o: Partial<typeof base> = {}) => childPugh({ ...base, ...o })

// Nilai tangan: 1+1+1+1+1 = 5 → Class A (kasus terendah).
const d = run()
assert.equal(d.points, 5); assert.deepEqual(d.cls, { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' })
assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
assert.equal(run({ bili: 5, alb: 2, inr: 3, ascites: 3, enceph: 3 }).points, 15)
assert.equal(run({ bili: 5, alb: 2, inr: 3, ascites: 3, enceph: 3 }).cls?.label, 'Class C')

// Pita kelas tepat di batas: 6 / 7 / 9 / 10.
for (const [s, l, t, v] of [[5, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [6, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [7, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [9, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [10, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival'], [15, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival']] as const) assert.deepEqual(childPughClass(s), { label: l, tone: t, survival: v }, `skor ${s}`)
// Pasangan: satu tambahan poin asites memindahkan 6 → 7 (A → B).
assert.equal(run({ ascites: 2 }).points, 6); assert.equal(run({ ascites: 2 }).cls?.label, 'Class A')
assert.equal(run({ ascites: 2, enceph: 2 }).points, 7); assert.equal(run({ ascites: 2, enceph: 2 }).cls?.label, 'Class B')

// Ambang tiap tabel.
for (const [v, e] of [[1.99, 1], [2, 2], [3, 2], [3.01, 3], [60, 3]] as const) assert.equal(childPughBilirubinPts(v), e, `bili ${v}`)
for (const [v, e] of [[3.51, 1], [3.5, 2], [2.8, 2], [2.79, 3], [0.5, 3]] as const) assert.equal(childPughAlbuminPts(v), e, `alb ${v}`)
for (const [v, e] of [[1.69, 1], [1.7, 2], [2.3, 2], [2.31, 3], [15, 3]] as const) assert.equal(childPughInrPts(v), e, `inr ${v}`)

// Kosong (NaN): "belum diisi" bernama, tanpa skor/kelas; pasangan: hanya satu kosong.
const kosong = run({ bili: NaN, alb: NaN, inr: NaN })
assert.deepEqual(kosong.missing, ['total bilirubin', 'albumin', 'INR']); assert.equal(kosong.points, null); assert.equal(kosong.cls, null); assert.deepEqual(kosong.invalid, [])
const satu = run({ inr: NaN }); assert.deepEqual(satu.missing, ['INR']); assert.equal(satu.points, null)
// Regresi: dulu bilirubin 500 dan albumin 99 diberi poin/kelas; kontrol positif lalu penolakan.
assert.equal(childPughBilirubinPts(500), 3); assert.equal(childPughAlbuminPts(99), 1)
assert.deepEqual(run({ bili: 500 }).invalid, ['total bilirubin must be 0.1–60 mg/dL']); assert.equal(run({ bili: 500 }).points, null); assert.equal(run({ bili: 500 }).cls, null)
assert.deepEqual(run({ alb: 99 }).invalid, ['albumin must be 0.5–6 g/dL'])

// Rentang dipatok literal; batas diterima, di luar ditolak.
assert.deepEqual(JSON.parse(JSON.stringify(CHILD_PUGH_RANGES)), {
  bili: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' }, alb: { min: 0.5, max: 6, name: 'albumin', unit: ' g/dL' }, inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
})
for (const k of ['bili', 'alb', 'inr'] as const) {
  const { min, max } = CHILD_PUGH_RANGES[k]
  assert.notEqual(run({ [k]: min }).points, null, `${k} min`); assert.notEqual(run({ [k]: max }).points, null, `${k} max`)
  for (const bad of [min - 0.01, max + 0.01, 0, -1, Infinity, -Infinity]) {
    const r = run({ [k]: bad }); assert.equal(r.points, null, `${k}=${bad}`); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, []); assert.equal(r.cls, null)
  }
  for (const salah of [null, '5', {}, undefined] as unknown as number[]) assert.equal(run({ [k]: salah }).points, null, `${k} tipe`)
}
// Asites/ensefalopati: hanya 1, 2, 3 bulat.
for (const f of ['ascites', 'enceph'] as const) {
  for (const l of [1, 2, 3]) assert.notEqual(run({ [f]: l }).points, null, `${f} ${l}`)
  for (const bad of [0, 4, 1.5, -1, NaN, Infinity, '2' as unknown as number]) { const r = run({ [f]: bad }); assert.equal(r.points, null, `${f}=${bad}`); assert.equal(r.invalid.length, 1); assert.equal(r.cls, null) }
}
const banyak = run({ bili: NaN, alb: 99, ascites: 9 }); assert.deepEqual(banyak.missing, ['total bilirubin']); assert.equal(banyak.invalid.length, 2)
assert.deepEqual(run(), run())

// Regresi vs tabel halaman lama (ditulis ulang) pada grid.
const B = (v: number) => (v < 2 ? 1 : v <= 3 ? 2 : 3)
const A = (v: number) => (v > 3.5 ? 1 : v >= 2.8 ? 2 : 3)
const I = (v: number) => (v < 1.7 ? 1 : v <= 2.3 ? 2 : 3)
const K = (s: number) => (s <= 6 ? 'Class A' : s <= 9 ? 'Class B' : 'Class C')
let n = 0
for (const bili of [0.5, 1.99, 2, 2.5, 3, 3.01, 10, 40]) for (const alb of [1, 2.79, 2.8, 3.2, 3.5, 3.51, 5]) for (const inr of [0.9, 1.69, 1.7, 2, 2.3, 2.31, 5]) for (const ascites of [1, 2, 3]) for (const enceph of [1, 2, 3]) {
  const exp = B(bili) + A(alb) + I(inr) + ascites + enceph
  const r = run({ bili, alb, inr, ascites, enceph }); assert.equal(r.points, exp); assert.equal(r.cls?.label, K(exp)); n++
}
assert.equal(n, 8 * 7 * 7 * 3 * 3)

// Halaman.
const src = readFileSync('src/pages/ChildPughScore.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { childPugh, parseNumberField } from '../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/function (bilirubin|albumin|inr)Pts|function classify/.test(src), 'tabel tidak boleh disalin ke halaman')
assert.ok(lines.includes('{lengkap && cls !== null && pts !== null ? ('))
assert.ok(lines.some((l) => l.includes('res.invalid.map(')))

console.log('child-pugh: hand values, every table/class cutoff, missing vs invalid, 2205-case old-table regression, bilirubin 500 / albumin 99 no longer scored')
