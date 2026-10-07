import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { graceScore, graceBand, graceAgePts, graceHrPts, graceSbpPts, graceCreatPts, GRACE_RANGES, KILLIP_PTS, ARREST_PTS, ST_DEVIATION_PTS, MARKERS_PTS } from '../../src/domains/clinical-calculators/index.ts'

const base = { age: 60, hr: 80, sbp: 130, creat: 1.0, killip: 0, arrest: false, stDev: false, markers: false }
const run = (o: Partial<typeof base> = {}) => graceScore({ ...base, ...o })

// Nilai tangan: usia 60 → 58; nadi 80 → 9; TD 130 → 34; kreatinin 1.0 → 7; Killip I → 0 = 108 → batas atas "Low risk".
const d = run()
assert.equal(d.score, 108); assert.deepEqual(d.band, { label: 'Low risk', tone: 'brand', mortality: '<1% in-hospital mortality' })
assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
// Pasangan: tepat +1 poin (penanda +14 → 122) pindah ke Intermediate; tiap tambahan tetap sendiri.
assert.equal(run({ markers: true }).score, 108 + 14); assert.equal(run({ markers: true }).band?.label, 'Intermediate risk')
assert.equal(run({ stDev: true }).score, 108 + 28); assert.equal(run({ arrest: true }).score, 108 + 39)
assert.equal(run({ stDev: true, arrest: true, markers: true }).score, 108 + 28 + 39 + 14)
for (let k = 0; k < 4; k++) assert.equal(run({ killip: k }).score, 108 + KILLIP_PTS[k], `killip ${k}`)
assert.deepEqual([...KILLIP_PTS], [0, 20, 39, 59]); assert.equal(ARREST_PTS, 39); assert.equal(ST_DEVIATION_PTS, 28); assert.equal(MARKERS_PTS, 14)
// Pita tepat di batas: 108 / 109 / 140 / 141.
for (const [s, l, t, m] of [[108, 'Low risk', 'brand', '<1% in-hospital mortality'], [109, 'Intermediate risk', 'low', '1-3% in-hospital mortality'], [140, 'Intermediate risk', 'low', '1-3% in-hospital mortality'], [141, 'High risk', 'critical', '>3% in-hospital mortality'], [372, 'High risk', 'critical', '>3% in-hospital mortality']] as const) assert.deepEqual(graceBand(s), { label: l, tone: t, mortality: m }, `skor ${s}`)

// Ambang tiap tabel (di bawah dan tepat pada ambang).
for (const [v, e] of [[29.99, 0], [30, 8], [39.99, 8], [40, 25], [49.99, 25], [50, 41], [59.99, 41], [60, 58], [69.99, 58], [70, 75], [79.99, 75], [80, 91], [89.99, 91], [90, 100], [120, 100]] as const) assert.equal(graceAgePts(v), e, `usia ${v}`)
for (const [v, e] of [[49.99, 0], [50, 3], [69.99, 3], [70, 9], [89.99, 9], [90, 15], [109.99, 15], [110, 24], [149.99, 24], [150, 38], [199.99, 38], [200, 46], [300, 46]] as const) assert.equal(graceHrPts(v), e, `nadi ${v}`)
for (const [v, e] of [[79.99, 58], [80, 53], [99.99, 53], [100, 43], [119.99, 43], [120, 34], [139.99, 34], [140, 24], [159.99, 24], [160, 10], [199.99, 10], [200, 0], [300, 0]] as const) assert.equal(graceSbpPts(v), e, `TD ${v}`)
for (const [v, e] of [[0.39, 1], [0.4, 4], [0.79, 4], [0.8, 7], [1.19, 7], [1.2, 10], [1.59, 10], [1.6, 13], [1.99, 13], [2.0, 21], [3.99, 21], [4.0, 28], [25, 28]] as const) assert.equal(graceCreatPts(v), e, `kreatinin ${v}`)

// Kosong (NaN): "belum diisi" bernama, tanpa skor/pita; pasangan: hanya satu kosong.
const kosong = graceScore({ ...base, age: NaN, hr: NaN, sbp: NaN, creat: NaN })
assert.deepEqual(kosong.missing, ['age', 'heart rate', 'systolic BP', 'creatinine']); assert.equal(kosong.score, null); assert.equal(kosong.band, null); assert.deepEqual(kosong.invalid, [])
const satu = run({ hr: NaN }); assert.deepEqual(satu.missing, ['heart rate']); assert.equal(satu.score, null)
// Regresi: dulu usia 500 → 100 poin dan TD 9999 → 0 poin tampak sah; kontrol positif lalu penolakan.
assert.equal(graceAgePts(500), 100); assert.equal(graceSbpPts(9999), 0)
assert.deepEqual(run({ age: 500 }).invalid, ['age must be 18–120 years']); assert.equal(run({ age: 500 }).score, null)
assert.deepEqual(run({ sbp: 9999 }).invalid, ['systolic BP must be 40–300 mmHg'])

// Rentang dipatok literal; batas diterima, di luar ditolak.
assert.deepEqual(JSON.parse(JSON.stringify(GRACE_RANGES)), {
  age: { min: 18, max: 120, name: 'age', unit: ' years', integer: false }, hr: { min: 20, max: 300, name: 'heart rate', unit: ' bpm', integer: false },
  sbp: { min: 40, max: 300, name: 'systolic BP', unit: ' mmHg', integer: false }, creat: { min: 0.1, max: 25, name: 'creatinine', unit: ' mg/dL', integer: false },
})
for (const k of ['age', 'hr', 'sbp', 'creat'] as const) {
  const { min, max } = GRACE_RANGES[k]
  assert.notEqual(run({ [k]: min }).score, null, `${k} min`); assert.notEqual(run({ [k]: max }).score, null, `${k} max`)
  for (const bad of [min - 0.01, max + 0.01, 0, -1, Infinity, -Infinity]) {
    if (bad >= min && bad <= max) continue
    const r = run({ [k]: bad }); assert.equal(r.score, null, `${k}=${bad}`); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, []); assert.equal(r.band, null)
  }
  for (const salah of [null, '5', {}, undefined] as unknown as number[]) assert.equal(run({ [k]: salah }).score, null, `${k} tipe`)
}
for (const kl of [-1, 4, 1.5, NaN, Infinity]) { const r = run({ killip: kl }); assert.equal(r.score, null, `killip ${kl}`); assert.deepEqual(r.invalid, ['Killip class must be 0–3']) }
const banyak = run({ age: NaN, hr: 999, killip: 9 }); assert.deepEqual(banyak.missing, ['age']); assert.equal(banyak.invalid.length, 2)
assert.deepEqual(run(), run())

// Regresi vs tabel halaman lama (ditulis ulang) pada grid.
const A = (v: number) => (v < 30 ? 0 : v < 40 ? 8 : v < 50 ? 25 : v < 60 ? 41 : v < 70 ? 58 : v < 80 ? 75 : v < 90 ? 91 : 100)
const H = (v: number) => (v < 50 ? 0 : v < 70 ? 3 : v < 90 ? 9 : v < 110 ? 15 : v < 150 ? 24 : v < 200 ? 38 : 46)
const S = (v: number) => (v < 80 ? 58 : v < 100 ? 53 : v < 120 ? 43 : v < 140 ? 34 : v < 160 ? 24 : v < 200 ? 10 : 0)
const C = (v: number) => (v < 0.4 ? 1 : v < 0.8 ? 4 : v < 1.2 ? 7 : v < 1.6 ? 10 : v < 2 ? 13 : v < 4 ? 21 : 28)
let n = 0
for (const age of [25, 45, 65, 85, 95]) for (const hr of [45, 80, 120, 180, 220]) for (const sbp of [70, 110, 150, 190, 230]) for (const creat of [0.3, 1.0, 1.8, 3, 5]) for (const killip of [0, 1, 2, 3]) for (const m of [0, 1, 2, 3, 4, 5, 6, 7]) {
  const arrest = !!(m & 1), stDev = !!(m & 2), markers = !!(m & 4)
  const exp = A(age) + H(hr) + S(sbp) + C(creat) + [0, 20, 39, 59][killip] + (arrest ? 39 : 0) + (stDev ? 28 : 0) + (markers ? 14 : 0)
  assert.equal(run({ age, hr, sbp, creat, killip, arrest, stDev, markers }).score, exp); n++
}
assert.equal(n, 5 * 5 * 5 * 5 * 4 * 8)

// Halaman.
const src = readFileSync('src/pages/clinical/scores/GraceScore.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { graceScore, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/function (age|hr|sbp|creat)Pts|const KILLIP_PTS|function band/.test(src), 'tabel tidak boleh disalin ke halaman')
assert.ok(lines.includes('{lengkap && result !== null && score !== null ? ('))
assert.ok(lines.some((l) => l.includes('res.invalid.map(')))

console.log('grace-score: hand values, every table/band cutoff, missing vs invalid, 20000-case old-table regression, age 500 / SBP 9999 no longer scored')
