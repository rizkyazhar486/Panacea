import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { centorMcIsaac, fletcherIndex, paradiseCriteria, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

// ── parseNumberField: "belum diisi" tidak pernah menjadi 0 ──
for (const kosong of ['', ' ', '\t\n', undefined, null, 5, {}, []] as unknown[]) assert.ok(Number.isNaN(parseNumberField(kosong)), `kosong/bukan teks: ${JSON.stringify(kosong)}`)
assert.equal(parseNumberField('0'), 0); assert.equal(parseNumberField('12.5'), 12.5); assert.equal(parseNumberField('-3'), -3)
assert.ok(Number.isNaN(parseNumberField('abc'))); assert.equal(parseNumberField('1e999'), Infinity)

// ── Centor / McIsaac ──
const none = { fever: false, noCough: false, tenderNodes: false, exudate: false }
const all = { fever: true, noCough: true, tenderNodes: true, exudate: true }
const cm = (c: typeof none, age: number) => { const r = centorMcIsaac(c, age); assert.ok(r.ok, `${JSON.stringify(c)} ${age}`); return r.ok ? r.data : (undefined as never) }
assert.deepEqual(cm(none, 30), { score: 0, label: 'Very low risk (1-2.5%)', tone: 'normal', note: 'No swab/empiric antibiotics needed.' })
assert.deepEqual(cm(all, 30), { score: 4, label: 'Very high risk (51-53%)', tone: 'critical', note: 'Consider empiric antibiotics (e.g. penicillin) or a rapid test first per local policy.' })
// Penyesuaian usia tepat di batas (pasangan di tiap sisi): < 15 → +1, 15-44 → 0, ≥ 45 → −1.
for (const [age, adj] of [[0, 1], [14, 1], [14.99, 1], [15, 0], [44, 0], [44.99, 0], [45, -1], [120, -1]] as const) assert.equal(cm(none, age).score, adj, `usia ${age}`)
assert.equal(cm({ ...none, fever: true, noCough: true }, 14).score, 3); assert.equal(cm({ ...none, fever: true, noCough: true }, 45).score, 1)
// Setiap tingkat risiko dicapai tepat satu kali.
const label = (n: number) => cm({ fever: n >= 1, noCough: n >= 2, tenderNodes: n >= 3, exudate: n >= 4 }, 30).label
assert.deepEqual([0, 1, 2, 3, 4].map(label), ['Very low risk (1-2.5%)', 'Low risk (5-10%)', 'Moderate risk (11-17%)', 'High risk (28-35%)', 'Very high risk (51-53%)'])
assert.equal(cm(none, 45).label, 'Very low risk (1-2.5%)', 'skor −1 tetap tingkat terendah')
const GA = { ok: false, reason: 'Age must be 0–120 years' }
for (const age of [-0.01, -1, 120.01, 300, NaN, Infinity, -Infinity, parseNumberField('')]) assert.deepEqual(centorMcIsaac(none, age), GA, `usia ${age}`)
for (const salah of [undefined, null, '30'] as unknown as number[]) assert.equal(centorMcIsaac(none, salah).ok, false)
assert.equal(centorMcIsaac({ ...none, fever: 1 as unknown as boolean }, 30).ok, false, 'kriteria harus boolean')
assert.equal(centorMcIsaac(undefined as unknown as typeof none, 30).ok, false)
assert.equal('data' in (centorMcIsaac(none, NaN) as object), false)
// Jebakan nyata halaman lama: usia kosong → 0 → +1 poin tanpa satu pun gejala.
assert.equal((+'' < 15 ? 1 : 0), 1)

// ── Paradise ──
const pc = (a: number, b: number, c: number, d: boolean) => { const r = paradiseCriteria(a, b, c, d); assert.ok(r.ok, `${a},${b},${c},${d}`); return r.ok ? r.data.meetsCriteria : (undefined as never) }
for (const [a, b, c, ok] of [
  [7, 0, 0, true], [6, 0, 0, false], [5, 5, 0, true], [5, 4, 0, false], [4, 5, 0, false], [3, 3, 3, true], [3, 3, 2, false], [3, 2, 3, false],
  [0, 0, 0, false], [100, 100, 100, true],
] as const) assert.equal(pc(a, b, c, true), ok, `${a},${b},${c}`)
// Dokumentasi tidak lengkap: tidak pernah terpenuhi, apa pun jumlahnya (pasangan dengan kasus terpenuhi).
for (const [a, b, c] of [[7, 0, 0], [5, 5, 0], [3, 3, 3], [365, 365, 365]] as const) { assert.equal(pc(a, b, c, true), true); assert.equal(pc(a, b, c, false), false) }
// Regresi: identik dengan logika halaman lama pada grid masukan sah.
for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) for (const d of [true, false]) {
  assert.equal(pc(a, b, c, d), d && (a >= 7 || (a >= 5 && b >= 5) || (a >= 3 && b >= 3 && c >= 3)), `${a},${b},${c},${d}`)
}
// Batas dan penolakan, dengan nama kolom: bilangan bulat 0–365.
for (const n of [0, 365]) assert.equal(paradiseCriteria(n, 0, 0, true).ok, true)
for (const bad of [-1, 366, 6.5, 0.5, NaN, Infinity, -Infinity]) {
  assert.deepEqual(paradiseCriteria(bad, 0, 0, true), { ok: false, reason: 'Episodes this year must be a whole number of 0–365' }, `thisYear ${bad}`)
  assert.deepEqual(paradiseCriteria(0, bad, 0, true), { ok: false, reason: 'Episodes last year must be a whole number of 0–365' }, `lastYear ${bad}`)
  assert.deepEqual(paradiseCriteria(0, 0, bad, true), { ok: false, reason: 'Episodes two years ago must be a whole number of 0–365' }, `twoYears ${bad}`)
}
for (const salah of [undefined, null, '7'] as unknown as number[]) assert.equal(paradiseCriteria(salah, 0, 0, true).ok, false)
assert.equal(paradiseCriteria(7, 0, 0, 'ya' as unknown as boolean).ok, false)
assert.equal('data' in (paradiseCriteria(Infinity, 0, 0, true) as object), false)
// Jebakan nyata: 1e999 → Infinity → halaman lama menyatakan "Meets Paradise criteria".
assert.equal(Infinity >= 7, true); assert.equal(paradiseCriteria(parseNumberField('1e999'), 0, 0, true).ok, false)

// ── Fletcher ──
const fl = (mode: 'basic' | 'complete', a: number, b: number, c: number, d?: number) => { const r = fletcherIndex(mode, a, b, c, d); assert.ok(r.ok, `${mode} ${a},${b},${c},${d}`); return r.ok ? r.data : (undefined as never) }
assert.deepEqual(fl('basic', 20, 20, 20), { indexDb: 20, label: 'Normal', tone: 'normal' })
assert.deepEqual(fl('complete', 20, 20, 20, 80), { indexDb: 35, label: 'Mild hearing loss', tone: 'low' })
assert.equal(fl('basic', 10, 20, 60, 999).indexDb, 30, 'mode dasar mengabaikan 3000 Hz')
// Setiap batas klasifikasi (26/41/56/71/91) tepat di batas dan satu langkah di bawahnya.
for (const [v, lbl] of [
  [25, 'Normal'], [26, 'Mild hearing loss'], [40, 'Mild hearing loss'], [41, 'Moderate hearing loss'], [55, 'Moderate hearing loss'],
  [56, 'Moderately severe hearing loss'], [70, 'Moderately severe hearing loss'], [71, 'Severe hearing loss'], [90, 'Severe hearing loss'], [91, 'Profound (total) hearing loss'],
] as const) assert.equal(fl('basic', v, v, v).label, lbl, `rata-rata ${v}`)
assert.equal(fl('basic', 25, 25, 26).label, 'Normal', 'rata-rata 25.33 masih normal'); assert.equal(fl('basic', 26, 26, 25).label, 'Normal', '25.67 masih normal')
// Regresi: identik dengan logika halaman lama pada grid masukan sah.
const lama = (idx: number) => idx < 26 ? 'Normal' : idx < 41 ? 'Mild hearing loss' : idx < 56 ? 'Moderate hearing loss' : idx < 71 ? 'Moderately severe hearing loss' : idx < 91 ? 'Severe hearing loss' : 'Profound (total) hearing loss'
for (let a = -10; a <= 120; a += 13) for (let b = -10; b <= 120; b += 17) for (let c = -10; c <= 120; c += 19) for (const d of [-10, 40, 120]) {
  const bas = fl('basic', a, b, c), kom = fl('complete', a, b, c, d)
  assert.equal(bas.indexDb, (a + b + c) / 3); assert.equal(bas.label, lama((a + b + c) / 3))
  assert.equal(kom.indexDb, (a + b + c + d) / 4); assert.equal(kom.label, lama((a + b + c + d) / 4))
}
// Penolakan: batas diterima, selangkah di luar ditolak dengan nama frekuensi; kolom kosong (NaN) ditolak.
for (const v of [-10, 120]) assert.equal(fletcherIndex('basic', v, v, v, undefined).ok, true)
for (const bad of [-10.01, 120.01, NaN, Infinity, -Infinity, parseNumberField('')]) {
  assert.deepEqual(fletcherIndex('basic', bad, 20, 20, undefined), { ok: false, reason: '500 Hz threshold must be -10–120 dB' }, `500 ${bad}`)
  assert.deepEqual(fletcherIndex('basic', 20, bad, 20, undefined), { ok: false, reason: '1000 Hz threshold must be -10–120 dB' }, `1000 ${bad}`)
  assert.deepEqual(fletcherIndex('basic', 20, 20, bad, undefined), { ok: false, reason: '2000 Hz threshold must be -10–120 dB' }, `2000 ${bad}`)
  assert.deepEqual(fletcherIndex('complete', 20, 20, 20, bad), { ok: false, reason: '3000 Hz threshold must be -10–120 dB' }, `3000 ${bad}`)
}
assert.equal(fletcherIndex('basic', 20, 20, 20, NaN).ok, true, 'mode dasar tidak memerlukan 3000 Hz')
assert.equal(fletcherIndex('complete', 20, 20, 20, undefined).ok, false, 'mode lengkap memerlukan 3000 Hz')
assert.equal(fletcherIndex('triple' as 'basic', 20, 20, 20, 20).ok, false)
for (const salah of [undefined, null, '20'] as unknown as number[]) assert.equal(fletcherIndex('basic', salah, 20, 20, undefined).ok, false)
assert.equal('data' in (fletcherIndex('basic', NaN, 20, 20, undefined) as object), false)
// Jebakan nyata halaman lama: semua kolom kosong → 0 dB → "Normal" tanpa data audiometri.
assert.equal(lama((+'' + +'' + +'') / 3), 'Normal'); assert.equal(fletcherIndex('basic', parseNumberField(''), parseNumberField(''), parseNumberField(''), undefined).ok, false)

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /centorMcIsaac\(\{ fever, noCough, tenderNodes, exudate \}, parseNumberField\(age\)\)/)
assert.match(halaman, /paradiseCriteria\(y1, y2, y3, documented\)/)
assert.match(halaman, /fletcherIndex\(mode, parseNumberField\(t500\), parseNumberField\(t1000\), parseNumberField\(t2000\), parseNumberField\(t3000\)\)/)
for (const re of [/centor\.ok \?/, /paradise\.ok \?/, /fletcher\.ok \?/, /\{centor\.reason\}/, /\{paradise\.reason\}/, /\{fletcher\.reason\}/]) assert.match(halaman, re)
assert.match(halaman, /const \[age, setAge\] = useState\('30'\)/); assert.match(halaman, /const \[t500, setT500\] = useState\('20'\)/)
assert.doesNotMatch(halaman, /const ageAdj = age < 15/, 'penyesuaian usia Centor tidak boleh dihitung ulang di halaman')
assert.doesNotMatch(halaman, /y1 >= 7 \|\|/, 'kriteria Paradise tidak boleh dihitung ulang di halaman')
assert.doesNotMatch(halaman, /const index = mode === 'basic'/, 'indeks Fletcher tidak boleh dihitung ulang di halaman')
console.log('centor-paradise-fletcher: golden values, every threshold at the boundary, regression grids, empty fields never read as 0, single-source rules')
