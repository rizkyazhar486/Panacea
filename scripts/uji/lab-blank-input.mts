// C2: kartu Performance Lab tidak menghitung dari kolom kosong (bukan 0).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { parseMetricInput: pi, computeMetric: cm, metricValue: mv } = await import('../../src/pages/fitness/metricInputs.ts')
assert.equal(pi('0'), 0, 'nol diketik = nol sungguhan'); assert.equal(pi('200'), 200); assert.equal(pi(' 12.5 '), 12.5); assert.equal(pi('-3'), -3)
for (const bad of ['', '   ', 'abc', 'Infinity', '-Infinity', 'NaN']) assert.ok(Number.isNaN(pi(bad)), `"${bad}" belum diisi`)
const mlss = (v: Record<string, number>) => v.ftp * 0.95
assert.equal(cm(['ftp'], { ftp: 200 }, mlss), 190)
assert.equal(cm(['ftp'], { ftp: 0 }, mlss), 0, 'nol sungguhan dihitung')
for (const v of [{}, { ftp: NaN }, { ftp: null }, { ftp: '200' }, { ftp: Infinity }, { ftp: undefined }]) assert.ok(Number.isNaN(cm(['ftp'], v as any, mlss)), `${JSON.stringify(v)} → tidak dihitung`)
assert.ok(Number.isNaN(cm(['a', 'b'], { a: 1 }, (v) => v.a + v.b)), 'satu kolom kosong cukup untuk membatalkan')
assert.ok(Number.isNaN(cm(['a', 'b'], { a: 1 }, (v) => v.a)), 'kolom lain kosong → tidak dihitung walau rumus tidak memakainya')
assert.equal(cm(['a', 'b'], { a: 1, b: 2 }, (v) => v.a + v.b), 3)
assert.equal(cm(['t'], { t: 5 }, () => 'teks'), 'teks', 'hasil teks tetap lewat')
assert.equal(mv(0), true); assert.equal(mv(NaN), false); assert.equal(mv(null), false)
const page = readFileSync('src/pages/fitness/PerformanceLab.tsx', 'utf8')
assert.match(page, /parseMetricInput\(e\.target\.value\)/); assert.doesNotMatch(page, /set\(inp\.key, \+e\.target\.value\)/)
assert.match(page, /computeMetric\(inputs\.map/); assert.match(page, /interpret && lengkap/); assert.match(page, /metricValue\(vals\[inp\.key\]\) \? vals\[inp\.key\] : ''/)
console.log('lab-blank-input: ok')
