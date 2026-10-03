import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { childPugh, classifyChildPugh, bilirubinPts, albuminPts, inrPts, CHILD_PUGH_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { bilirubin: 1.0, albumin: 4.0, inr: 1.0, ascites: 1, enceph: 1 }
const run = (o: Partial<typeof base> = {}) => childPugh({ ...base, ...o })
const okR = (o: Partial<typeof base> = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r : (undefined as never) }

// Nilai tangan: 1+1+1+1+1 = 5 → Class A. Pasien berat: 3+3+3+3+3 = 15 → Class C. Tengah: 2+2+2+2+2 = 10 → Class C.
assert.deepEqual(okR(), { ok: true, points: 5, cls: { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' } })
assert.equal(okR({ bilirubin: 4, albumin: 2, inr: 3, ascites: 3, enceph: 3 }).points, 15)
assert.equal(okR({ bilirubin: 2.5, albumin: 3, inr: 2, ascites: 2, enceph: 2 }).points, 10)
// Pasangan: hanya asites berubah 1 → 3 menambah tepat 2 poin.
assert.equal(okR({ ascites: 3 }).points - okR().points, 2)

// Batas tiap kriteria: tepat di ambang dan satu langkah di sekitarnya.
for (const [v, e] of [[1.99, 1], [2, 2], [3, 2], [3.01, 3]] as const) assert.equal(bilirubinPts(v), e, `bili ${v}`)
for (const [v, e] of [[3.51, 1], [3.5, 2], [2.8, 2], [2.79, 3]] as const) assert.equal(albuminPts(v), e, `alb ${v}`)
for (const [v, e] of [[1.69, 1], [1.7, 2], [2.3, 2], [2.31, 3]] as const) assert.equal(inrPts(v), e, `inr ${v}`)
for (const [s, l, t, m] of [[5, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [6, 'Class A', 'brand', '~100% 1-year, ~85% 2-year survival'], [7, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [9, 'Class B', 'low', '~80% 1-year, ~60% 2-year survival'], [10, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival'], [15, 'Class C', 'critical', '~45% 1-year, ~35% 2-year survival']] as const) {
  assert.deepEqual(classifyChildPugh(s), { label: l, tone: t, survival: m }, `skor ${s}`)
}

// Kosong (NaN) → "belum diisi": tidak ada poin/kelas; nama kolom dilaporkan; tidak ada pesan "di luar rentang".
assert.deepEqual(childPugh({ ...base, bilirubin: NaN, albumin: NaN, inr: NaN }), { ok: false, missing: ['total bilirubin', 'albumin', 'INR'], invalid: [] })
// Pasangan: hanya INR kosong → hanya INR dilaporkan.
assert.deepEqual(run({ inr: NaN }), { ok: false, missing: ['INR'], invalid: [] })
// parseNumberField: kolom kosong/spasi → NaN → missing (bukan 0).
assert.deepEqual(run({ albumin: parseNumberField('') }), { ok: false, missing: ['albumin'], invalid: [] })
assert.deepEqual(run({ albumin: parseNumberField('   ') }), { ok: false, missing: ['albumin'], invalid: [] })
assert.equal(okR({ albumin: parseNumberField('3.6') }).points, 5)

// Rentang: batas diterima, satu langkah di luar ditolak dengan pesan eksplisit dan tanpa angka.
assert.deepEqual(JSON.parse(JSON.stringify(CHILD_PUGH_RANGES)), {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' },
  inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
})
const MSG = { bilirubin: 'total bilirubin must be 0.1–60 mg/dL', albumin: 'albumin must be 0.5–7 g/dL', inr: 'INR must be 0.5–15' } as const
for (const [k, lo, hi] of [['bilirubin', 0.1, 60], ['albumin', 0.5, 7], ['inr', 0.5, 15]] as const) {
  assert.equal(run({ [k]: lo }).ok, true, `${k} batas bawah`); assert.equal(run({ [k]: hi }).ok, true, `${k} batas atas`)
  for (const bad of [lo - 0.01, hi + 0.01, 0, -1, 9999, Infinity, -Infinity]) assert.deepEqual(run({ [k]: bad }), { ok: false, missing: [], invalid: [MSG[k]] }, `${k} ${bad}`)
}
// Regresi: bilirubin 9999 dulu tetap menghasilkan kelas C; sekarang ditolak. Kontrol positif lalu penolakan.
assert.equal(bilirubinPts(9999), 3)
assert.equal(run({ bilirubin: 9999 }).ok, false)

// Asites/ensefalopati: hanya 1, 2, 3.
for (const bad of [0, 4, 1.5, -1, NaN, Infinity, '2', null, undefined] as unknown as number[]) {
  assert.deepEqual(run({ ascites: bad }), { ok: false, missing: [], invalid: ['Ascites must be 1, 2 or 3 points'] }, `asites ${bad}`)
  assert.deepEqual(run({ enceph: bad }), { ok: false, missing: [], invalid: ['Hepatic encephalopathy must be 1, 2 or 3 points'] }, `ensef ${bad}`)
}
// Tipe salah pada kolom lab (bukan angka) ditolak, bukan dihitung.
for (const bad of ['1.0', null, undefined, {}] as unknown as number[]) assert.deepEqual(run({ bilirubin: bad }), { ok: false, missing: [], invalid: [MSG.bilirubin] })
// Gabungan: kosong dan di luar rentang dilaporkan terpisah.
assert.deepEqual(run({ albumin: NaN, inr: 99 }), { ok: false, missing: ['albumin'], invalid: [MSG.inr] })

// Determinisme dan tanpa efek samping pada masukan.
const inp = Object.freeze({ ...base })
assert.deepEqual(childPugh(inp), childPugh(inp))

// Regresi vs halaman lama (aritmetika asli) pada grid nilai sah.
const lama = (b: number, a: number, i: number, as: number, en: number) => {
  const p = (b < 2 ? 1 : b <= 3 ? 2 : 3) + (a > 3.5 ? 1 : a >= 2.8 ? 2 : 3) + (i < 1.7 ? 1 : i <= 2.3 ? 2 : 3) + as + en
  return { p, c: p <= 6 ? 'Class A' : p <= 9 ? 'Class B' : 'Class C' }
}
let n = 0
for (const b of [0.1, 1.99, 2, 3, 3.01, 60]) for (const a of [0.5, 2.79, 2.8, 3.5, 3.51, 7]) for (const i of [0.5, 1.69, 1.7, 2.3, 2.31, 15]) for (const as of [1, 2, 3]) for (const en of [1, 2, 3]) {
  const o = lama(b, a, i, as, en); const r = okR({ bilirubin: b, albumin: a, inr: i, ascites: as, enceph: en })
  assert.equal(r.points, o.p); assert.equal(r.cls.label, o.c); n++
}
assert.equal(n, 6 * 6 * 6 * 9)

// Halaman memakai fungsi domain dan tidak lagi mengubah teks kosong menjadi 0.
const page = readFileSync(new URL('../../src/pages/ChildPughScore.tsx', import.meta.url), 'utf8')
assert.ok(page.includes("from '../domains/clinical-calculators'"), 'page must use the domain function')
assert.ok(!/Number\(e\.target\.value\)\s*\|\|\s*0/.test(page), 'empty text read as 0 is back')

console.log('child-pugh: ok')
