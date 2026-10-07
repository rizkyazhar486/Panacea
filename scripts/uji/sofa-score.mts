import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sofaScore, respPts, coagPts, liverPts, renalPts, cnsPts, sofaMortalityBand, SOFA_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { pf: 350, plt: 180, bili: 0.8, creat: 1.0, gcs: 15, supported: false, cv: 0 }
const run = (o: Partial<typeof base> = {}) => sofaScore({ ...base, ...o })

// Nilai tangan: 1 + 0 + 0 + 0 + 0 + 0 = 1 → "Minimal dysfunction".
const d = run()
assert.deepEqual(d.points, { resp: 1, coag: 0, liver: 0, renal: 0, cns: 0, cv: 0 })
assert.equal(d.total, 1); assert.deepEqual(d.band, { label: 'Minimal dysfunction', tone: 'brand', mortality: '<10%' })
assert.deepEqual(d.missing, []); assert.deepEqual(d.invalid, [])
// Pasien berat: pf 80 + ventilasi (4), plt 15 (4), bili 13 (4), creat 5.2 (4), gcs 3 (4), cv 4 → 24 → Extreme.
const berat = run({ pf: 80, supported: true, plt: 15, bili: 13, creat: 5.2, gcs: 3, cv: 4 })
assert.equal(berat.total, 24); assert.equal(berat.band?.label, 'Extreme dysfunction')
// Pasangan: pf 80 TANPA ventilasi → resp 2 (bukan 4): ventilasi yang menentukan.
assert.equal(run({ pf: 80, supported: false }).points.resp, 2)
assert.equal(run({ pf: 80, supported: true }).points.resp, 4)
assert.equal(run({ pf: 150, supported: true }).points.resp, 3); assert.equal(run({ pf: 150, supported: false }).points.resp, 2)

// Batas tiap subskor (tepat di ambang dan satu langkah di bawahnya).
for (const [pf, s, e] of [[99.99, true, 4], [100, true, 3], [199.99, true, 3], [200, true, 2], [299.99, false, 2], [300, false, 1], [399.99, false, 1], [400, false, 0]] as const) assert.equal(respPts(pf, s), e, `pf ${pf}`)
for (const [v, e] of [[19.99, 4], [20, 3], [49.99, 3], [50, 2], [99.99, 2], [100, 1], [149.99, 1], [150, 0]] as const) assert.equal(coagPts(v), e, `plt ${v}`)
for (const [v, e] of [[1.19, 0], [1.2, 1], [1.99, 1], [2, 2], [5.99, 2], [6, 3], [11.99, 3], [12, 4]] as const) assert.equal(liverPts(v), e, `bili ${v}`)
for (const [v, e] of [[1.19, 0], [1.2, 1], [1.99, 1], [2, 2], [3.49, 2], [3.5, 3], [4.99, 3], [5, 4]] as const) assert.equal(renalPts(v), e, `creat ${v}`)
for (const [v, e] of [[15, 0], [14, 1], [13, 1], [12, 2], [10, 2], [9, 3], [6, 3], [5, 4], [3, 4]] as const) assert.equal(cnsPts(v), e, `gcs ${v}`)
for (const [v, l, t, m] of [[0, 'Minimal dysfunction', 'brand', '<10%'], [1, 'Minimal dysfunction', 'brand', '<10%'], [2, 'Mild-moderate dysfunction', 'low', '~10-20%'], [5, 'Mild-moderate dysfunction', 'low', '~10-20%'], [6, 'Moderate-severe dysfunction', 'critical', '~20-40%'], [9, 'Moderate-severe dysfunction', 'critical', '~20-40%'], [10, 'Severe dysfunction', 'critical', '~50-60%'], [12, 'Severe dysfunction', 'critical', '~50-60%'], [13, 'Extreme dysfunction', 'critical', '>80%'], [24, 'Extreme dysfunction', 'critical', '>80%']] as const) assert.deepEqual(sofaMortalityBand(v), { label: l, tone: t, mortality: m }, `skor ${v}`)

// Kosong (NaN) → "belum diisi": subskor organ itu null, total/pita null, tidak ada angka palsu.
const kosong = sofaScore({ pf: NaN, plt: NaN, bili: NaN, creat: NaN, gcs: NaN, supported: false, cv: 0 })
assert.deepEqual(kosong.points, { resp: null, coag: null, liver: null, renal: null, cns: null, cv: 0 })
assert.deepEqual(kosong.missing, ['PaO₂/FiO₂', 'platelets', 'bilirubin', 'creatinine', 'Glasgow Coma Scale'])
assert.equal(kosong.total, null); assert.equal(kosong.band, null); assert.deepEqual(kosong.invalid, [])
// Pasangan: hanya trombosit kosong → hanya coag null, total null, missing hanya trombosit.
const satu = run({ plt: NaN })
assert.equal(satu.points.coag, null); assert.equal(satu.points.resp, 1); assert.deepEqual(satu.missing, ['platelets']); assert.equal(satu.total, null)
// Regresi: dulu trombosit kosong = 0 → 4 poin palsu di rincian. Kontrol positif lalu penolakan.
assert.equal(coagPts(0), 4)
assert.equal(satu.points.coag, null)

// Di luar rentang → invalid (bukan missing), subskor null, total null; batas tepat diterima.
assert.deepEqual(JSON.parse(JSON.stringify(SOFA_RANGES)), {
  pf: { min: 20, max: 800, name: 'PaO₂/FiO₂', unit: '', integer: false }, plt: { min: 1, max: 2000, name: 'platelets', unit: ' ×10³/µL', integer: false },
  bili: { min: 0.1, max: 60, name: 'bilirubin', unit: ' mg/dL', integer: false }, creat: { min: 0.1, max: 25, name: 'creatinine', unit: ' mg/dL', integer: false },
  gcs: { min: 3, max: 15, name: 'Glasgow Coma Scale', unit: '', integer: true },
})
for (const k of ['pf', 'plt', 'bili', 'creat', 'gcs'] as const) {
  const { min, max } = SOFA_RANGES[k]
  assert.equal(run({ [k]: min }).total !== null, true, `${k} min`); assert.equal(run({ [k]: max }).total !== null, true, `${k} max`)
  for (const bad of [min - 1, max + 1, 0, -5, Infinity, -Infinity]) {
    if (bad >= min && bad <= max) continue
    const r = run({ [k]: bad }); assert.equal(r.total, null, `${k}=${bad}`); assert.equal(r.invalid.length, 1); assert.deepEqual(r.missing, []); assert.equal(r.band, null)
  }
}
assert.deepEqual(run({ gcs: 40 }).invalid, ['Glasgow Coma Scale must be a whole number 3–15'])
assert.equal(run({ gcs: 40 }).points.cns, null) // dulu 40 → 0 poin dan tersimpan sebagai titik tren
assert.equal(cnsPts(40), 0)
assert.deepEqual(run({ gcs: 12.5 }).invalid, ['Glasgow Coma Scale must be a whole number 3–15'])
assert.deepEqual(run({ creat: 99 }).invalid, ['creatinine must be 0.1–25 mg/dL'])
for (const cv of [-1, 5, 2.5, NaN, Infinity]) { const r = run({ cv }); assert.equal(r.total, null, `cv ${cv}`); assert.deepEqual(r.invalid, ['Cardiovascular level must be 0–4']); assert.equal(r.points.cv, null) }
for (const cv of [0, 1, 2, 3, 4]) assert.equal(run({ cv }).points.cv, cv)
for (const salah of [null, '5', {}, undefined] as unknown as number[]) assert.equal(run({ pf: salah }).total, null, `tipe ${String(salah)}`)
// Beberapa masalah sekaligus dilaporkan semuanya.
const banyak = run({ pf: NaN, gcs: 99, creat: 0 })
assert.deepEqual(banyak.missing, ['PaO₂/FiO₂']); assert.equal(banyak.invalid.length, 2)
assert.deepEqual(run(), run())

// Regresi vs rumus halaman lama pada grid (total identik untuk semua masukan valid).
const lama = (pf: number, sup: boolean, plt: number, bili: number, creat: number, gcs: number, cv: number) => {
  const r = pf < 100 && sup ? 4 : pf < 200 && sup ? 3 : pf < 300 ? 2 : pf < 400 ? 1 : 0
  const c = plt < 20 ? 4 : plt < 50 ? 3 : plt < 100 ? 2 : plt < 150 ? 1 : 0
  const l = bili >= 12 ? 4 : bili >= 6 ? 3 : bili >= 2 ? 2 : bili >= 1.2 ? 1 : 0
  const re = creat >= 5 ? 4 : creat >= 3.5 ? 3 : creat >= 2 ? 2 : creat >= 1.2 ? 1 : 0
  const cn = gcs < 6 ? 4 : gcs < 10 ? 3 : gcs < 13 ? 2 : gcs < 15 ? 1 : 0
  return r + c + l + re + cn + cv
}
let n = 0
for (const pf of [50, 150, 250, 350, 450]) for (const sup of [false, true]) for (const plt of [10, 40, 90, 140, 300]) for (const bili of [0.5, 1.5, 4, 8, 20]) for (const creat of [0.8, 1.5, 2.5, 4, 6]) for (const gcs of [3, 8, 11, 14, 15]) for (const cv of [0, 3]) {
  assert.equal(run({ pf, supported: sup, plt, bili, creat, gcs, cv }).total, lama(pf, sup, plt, bili, creat, gcs, cv)); n++
}
assert.equal(n, 5 * 2 * 5 * 5 * 5 * 5 * 2)

// Halaman.
const src = readFileSync('src/pages/clinical/scores/SofaScore.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { parseNumberField, sofaScore, type CvLevel } from '../../../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0')
assert.ok(!/function (resp|coag|liver|renal|cns)Pts|function mortalityBand/.test(src), 'ambang tidak boleh disalin ke halaman')
assert.ok(lines.some((l) => l.includes("{r.pts ?? '—'}")), 'subskor yang belum sah harus tampil sebagai —')
assert.ok(lines.includes('{lengkap && total !== null && ('), 'titik tren hanya boleh disimpan untuk skor lengkap yang sah')
assert.ok(lines.some((l) => l.includes('res.invalid.map(')))

console.log('sofa-score: hand values, every subscore/band cutoff, missing vs invalid, no fake subscores, 6250-case old-page regression, GCS 40 no longer scores 0')
