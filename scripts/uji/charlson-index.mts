import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { charlsonIndex, charlsonAgePoints, CHARLSON_CONDITIONS, CHARLSON_AGE, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const ref = (t: number) => 100 * Math.exp(Math.exp(0.9 * t) * Math.log(0.983)) // rujukan independen: exp/log, bukan Math.pow
const data = (age: number, keys: string[] = []) => {
  const r = charlsonIndex(age, Object.fromEntries(keys.map((k) => [k, true])))
  assert.ok(r.ok, `${age} ${keys}`)
  return r.ok ? r.data : (undefined as never)
}

// Nilai tangan.
assert.deepEqual({ ...data(45), survival10y: undefined }, { comorbidityPts: 0, agePts: 0, total: 0, survival10y: undefined, tone: 'brand' })
assert.ok(Math.abs(data(45).survival10y - 98.3) < 1e-9)
const dua = data(45, ['mi', 'chf'])
assert.equal(dua.total, 2); assert.ok(Math.abs(dua.survival10y - 90.14702690368213) < 1e-9); assert.equal(dua.tone, 'brand')
// Usia 72 (+3) + metastasis (6) + tumor (2 dikecualikan oleh pasangan eksklusif) = 9.
assert.equal(data(72, ['mets', 'tumor']).total, 9)
assert.equal(data(72, ['mets', 'tumor']).comorbidityPts, 6)
// Bobot per kondisi: tepat 19 kondisi, 10×1, 6×2, 1×3, 2×6 = 10+12+3+12 = 37.
assert.equal(CHARLSON_CONDITIONS.length, 19)
assert.equal(CHARLSON_CONDITIONS.reduce((s, c) => s + c.pts, 0), 37)
for (const c of CHARLSON_CONDITIONS) assert.equal(data(45, [c.key]).comorbidityPts, c.key === 'dm' || c.key === 'liverMild' || c.key === 'tumor' ? c.pts : c.pts, c.key)
// Pasangan eksklusif: hanya bentuk lebih berat; tanpa bentuk berat, bentuk ringan dihitung.
assert.equal(data(45, ['dm', 'dmOrgan']).comorbidityPts, 2); assert.equal(data(45, ['dm']).comorbidityPts, 1)
assert.equal(data(45, ['liverMild', 'liverSevere']).comorbidityPts, 3); assert.equal(data(45, ['liverMild']).comorbidityPts, 1)
assert.equal(data(45, ['tumor', 'mets']).comorbidityPts, 6); assert.equal(data(45, ['tumor']).comorbidityPts, 2)
// Poin usia tepat di batas.
for (const [a, p] of [[18, 0], [49, 0], [50, 1], [59, 1], [60, 2], [69, 2], [70, 3], [79, 3], [80, 4], [110, 4]] as const) assert.equal(charlsonAgePoints(a), p, `usia ${a}`)
// Kesintasan terhadap rujukan independen dan batas nada (≥90 brand, ≥50 low) untuk skor 0..20.
for (let t = 0; t <= 20; t++) {
  const keys = t <= 6 ? (t === 6 ? ['mets'] : Array.from({ length: t }, (_, i) => CHARLSON_CONDITIONS[i].key).filter((k) => CHARLSON_CONDITIONS.find((c) => c.key === k)!.pts === 1)) : []
  if (t > 6) continue
  const r = data(45, keys)
  if (keys.length === t || t === 6) assert.ok(Math.abs(r.survival10y - ref(r.total)) < 1e-9, `skor ${t}`)
}
for (const [t, tone] of [[0, 'brand'], [2, 'brand'], [3, 'low'], [4, 'low'], [5, 'critical'], [6, 'critical']] as const) {
  assert.equal(ref(t) >= 90 ? 'brand' : ref(t) >= 50 ? 'low' : 'critical', tone, `rujukan nada ${t}`)
}
assert.equal(data(45, ['mi', 'chf', 'pvd']).tone, 'low')       // skor 3: 78%
assert.equal(data(45, ['mi', 'chf', 'pvd', 'cva']).tone, 'low') // skor 4: 53%
assert.equal(data(45, ['mi', 'chf', 'pvd', 'cva', 'dementia']).tone, 'critical') // skor 5: 21%
// Operator ">=" pada 90/50 tidak dapat dibedakan dari ">": tidak ada skor bulat yang memberi kesintasan tepat 90 atau 50.
// Dibuktikan di sini (bukan diklaim): jarak terdekat skor 0..40 ke kedua ambang selalu > 0.05.
for (let t = 0; t <= 40; t++) { assert.ok(Math.abs(ref(t) - 90) > 0.05 && Math.abs(ref(t) - 50) > 0.05, `skor ${t} terlalu dekat ambang`) }
assert.deepEqual(data(45), data(45))

// Regresi vs halaman lama (rumus asli) pada grid usia × subset kondisi.
const lama = (age: number, ck: Record<string, boolean>) => {
  const cp = CHARLSON_CONDITIONS.reduce((s, c) => { if (!ck[c.key]) return s; if (c.key === 'dm' && ck.dmOrgan) return s; if (c.key === 'liverMild' && ck.liverSevere) return s; if (c.key === 'tumor' && ck.mets) return s; return s + c.pts }, 0)
  const ap = age < 50 ? 0 : age < 60 ? 1 : age < 70 ? 2 : age < 80 ? 3 : 4
  return { cp, ap, sv: Math.pow(0.983, Math.exp(0.9 * (cp + ap))) * 100 }
}
let n = 0
for (const age of [18, 45, 49, 50, 59, 60, 69, 70, 79, 80, 110]) for (let mask = 0; mask < 1 << 10; mask++) {
  const ck: Record<string, boolean> = {}; const keys = ['mi', 'dm', 'dmOrgan', 'liverMild', 'liverSevere', 'tumor', 'mets', 'hemiplegia', 'aids', 'ckd']
  keys.forEach((k, i) => { if (mask & (1 << i)) ck[k] = true })
  const o = lama(age, ck); const r = charlsonIndex(age, ck)
  assert.ok(r.ok); if (r.ok) { assert.equal(r.data.comorbidityPts, o.cp); assert.equal(r.data.agePts, o.ap); assert.equal(r.data.survival10y, o.sv) }
  n++
}
assert.equal(n, 11 * 1024)

// Usia: batas, negatif, tipe.
assert.deepEqual(JSON.parse(JSON.stringify(CHARLSON_AGE)), { min: 18, max: 110 })
const GALAT = { ok: false, reason: 'Age must be 18–110 years' }
for (const ok of [18, 110]) assert.equal(charlsonIndex(ok, {}).ok, true)
for (const bad of [17.99, 17, 0, -1, 110.01, 111, Number.NaN, Infinity, -Infinity]) assert.deepEqual(charlsonIndex(bad, { mets: true }), GALAT, `usia ${bad}`)
for (const salah of [undefined, null, '45', {}] as unknown as number[]) assert.deepEqual(charlsonIndex(salah, {}), GALAT)
// Regresi: usia kosong dulu → 0 → poin usia 0 → kesintasan tampak lebih baik. Kontrol positif lalu penolakan.
assert.equal(lama(0, {}).ap, 0)
assert.deepEqual(charlsonIndex(parseNumberField(''), { mets: true }), GALAT)
assert.equal('data' in charlsonIndex(parseNumberField(' '), {}), false)

// Halaman.
const src = readFileSync('src/pages/clinical/scores/CharlsonIndex.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { CHARLSON_CONDITIONS, charlsonIndex, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/Math\.pow\(|agePts\(|const CONDITIONS/.test(src), 'rumus/bobot tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('))
assert.ok(lines.some((l) => l.includes('{res.reason}')))
assert.ok(lines.includes('const res = charlsonIndex(parseNumberField(age), checked)'))

// Regresi: umur bawaan (45/40) tidak boleh disulihkan; hanya umur tersimpan.
assert.ok(!/\bgetDemo\(\)/.test(src) && src.includes('getDemoTersimpan()'), 'halaman tidak boleh memakai getDemo()')

console.log('charlson-index: independent survival reference, exclusive pairs, exact age/tone cutoffs, 11264-case old-page regression, empty age fails closed')
