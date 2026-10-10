import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cvdRisk, fib4, fib4Band, ostIndex, ostBand, RISK_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// ── Framingham: rumus ditulis ulang di sini (koefisien D'Agostino 2008) supaya tes tidak sekadar mencerminkan lib.
const ref = (age: number, sex: 'M' | 'F', tc: number, hdl: number, sbp: number, tx: boolean, sm: boolean, dm: boolean) => {
  const ln = Math.log
  const L = sex === 'M'
    ? 3.06117 * ln(age) + 1.12370 * ln(tc) - 0.93263 * ln(hdl) + (tx ? 1.99881 : 1.93303) * ln(sbp) + 0.65451 * +sm + 0.57367 * +dm
    : 2.32888 * ln(age) + 1.20904 * ln(tc) - 0.70833 * ln(hdl) + (tx ? 2.82263 : 2.76157) * ln(sbp) + 0.52873 * +sm + 0.69154 * +dm
  const [s0, mean] = sex === 'M' ? [0.88936, 23.9802] : [0.95012, 26.1931]
  return +((1 - Math.pow(s0, Math.exp(L - mean))) * 100).toFixed(1)
}
const cvdBase = { age: 55, sex: 'M', totChol: 213, hdl: 50, sbp: 120, treatedBP: false, smoker: false, diabetic: false } as const
type Cvd = Parameters<typeof cvdRisk>[0]
const cvd = (o: Partial<Cvd> = {}) => cvdRisk({ ...cvdBase, ...o } as Cvd)
assert.equal(cvd().riskPct, ref(55, 'M', 213, 50, 120, false, false, false))
assert.equal(cvd({ sex: 'F', treatedBP: true, smoker: true, diabetic: true, age: 62, sbp: 150 }).riskPct, ref(62, 'F', 213, 50, 150, true, true, true))
assert.ok(cvd({ smoker: true }).riskPct! > cvd().riskPct!); assert.ok(cvd({ diabetic: true }).riskPct! > cvd().riskPct!) // pasangan: hanya satu faktor
assert.ok(cvd({ sex: 'F' }).riskPct !== cvd().riskPct)
// Pita 7,5 / 20 (dari lib): label sesuai nilai yang dihitung.
const bandUntuk = (r: number | null) => r === null ? null : r < 7.5 ? 'Low risk' : r < 20 ? 'Intermediate risk' : 'High risk'
for (const o of [cvdBase, { ...cvdBase, age: 70, smoker: true, diabetic: true, sbp: 170 }, { ...cvdBase, age: 35, hdl: 70, totChol: 160 }]) assert.equal(cvdRisk(o).band?.label, bandUntuk(cvdRisk(o).riskPct))
assert.deepEqual(cvd(), cvd())
// Kosong → bernama; tanpa angka/pita. Negatif/di luar rentang → ditolak dengan alasan.
const kosong = cvd({ age: NaN, totChol: NaN, hdl: NaN, sbp: NaN })
assert.deepEqual(kosong.missing, ['age', 'total cholesterol', 'HDL', 'systolic BP']); assert.equal(kosong.riskPct, null); assert.equal(kosong.band, null)
assert.deepEqual(cvd({ totChol: 1e9 }).invalid, ['total cholesterol must be 50–1000 mg/dL']); assert.deepEqual(cvd({ sbp: 5000 }).invalid, ['systolic BP must be 50–300 mmHg'])
assert.deepEqual(cvd({ age: 500 }).invalid, ['age must be 18–120 years']); assert.deepEqual(cvd({ hdl: 400 }).invalid.includes('HDL must be 5–200 mg/dL'), true)
assert.deepEqual(cvd({ totChol: 100, hdl: 100 }).invalid, ['HDL must be below total cholesterol']); assert.equal(cvd({ totChol: 100, hdl: 99 }).invalid.length, 0) // batas HDL < TC, keduanya dalam rentang
assert.equal(cvd({ totChol: 100, hdl: 100 }).riskPct, null)
assert.deepEqual(cvd({ sex: 'X' as unknown as 'M' }).invalid, ['sex must be M or F']); assert.deepEqual(cvd({ smoker: 1 as unknown as boolean }).invalid, ['smoker must be yes or no'])
for (const bad of [Infinity, -1, 0]) assert.equal(cvd({ sbp: bad }).riskPct, null, `sbp ${bad}`)
assert.equal(cvd({ age: '55' as unknown as number }).riskPct, null)

// ── FIB-4: (50×40)/(200×√36) = 2000/1200 = 1,67 → Indeterminate (usia <65: <1,3 rendah; ≤2,67 tak tentu).
const fib = (o: Partial<Parameters<typeof fib4>[0]> = {}) => fib4({ age: 50, ast: 40, alt: 36, platelets: 200, ...o })
close(fib().value, 1.67); assert.equal(fib().band?.label, 'Indeterminate')
close(fib({ alt: 49 }).value, +(2000 / (200 * 7)).toFixed(2))
for (const [v, age, l] of [[1.29, 40, 'Low'], [1.3, 40, 'Indeterminate'], [1.99, 65, 'Low'], [2.0, 65, 'Indeterminate'], [1.99, 64, 'Indeterminate'], [2.67, 40, 'Indeterminate'], [2.68, 40, 'High']] as const) assert.equal(fib4Band(v, age).label, l, `${v}/${age}`)
assert.equal(fib4Band(3, 40).tone, 'critical'); assert.equal(fib4Band(1.5, 40).tone, 'low'); assert.equal(fib4Band(1, 40).tone, 'brand')
assert.deepEqual(fib({ ast: NaN, platelets: NaN }).missing, ['AST', 'platelets']); assert.equal(fib({ ast: NaN }).value, null)
assert.deepEqual(fib({ ast: 1e9 }).invalid, ['AST must be 1–5000 U/L']); assert.deepEqual(fib({ platelets: 0 }).invalid, ['platelets must be 5–2000 ×10⁹/L'])
assert.deepEqual(fib({ alt: -4 }).invalid, ['ALT must be 1–5000 U/L']); assert.equal(fib({ alt: -4 }).band, null)

// ── OST: 0,2×(60−70) = −2 → Moderate; truncated bukan dibulatkan: 0,2×(65−70) = −1 → Moderate, 0,2×(66−70) = −0,8 → trunc 0 → Lower.
const ost = (o: Partial<Parameters<typeof ostIndex>[0]> = {}) => ostIndex({ age: 70, weightKg: 60, ...o })
assert.equal(ost().value, -2); assert.equal(ost().band?.label, 'Moderate risk')
assert.equal(ost({ weightKg: 65 }).value, -1); assert.equal(ost({ weightKg: 66 }).value === 0, true); assert.equal(ost({ weightKg: 66 }).band?.label, 'Lower risk')
for (const [v, l] of [[0, 'Lower risk'], [-1, 'Moderate risk'], [-4, 'Moderate risk'], [-5, 'Higher risk']] as const) assert.equal(ostBand(v).label, l, String(v))
assert.equal(ost({ weightKg: 45 }).band?.label, 'Higher risk')
assert.deepEqual(ost({ age: NaN, weightKg: NaN }).missing, ['weight', 'age']); assert.equal(ost({ weightKg: NaN }).value, null)
assert.deepEqual(ost({ weightKg: 5000 }).invalid, ['weight must be 20–400 kg']); assert.deepEqual(ost({ age: 5 }).invalid, ['age must be 18–120 years'])
// Batas rentang literal: diterima; ±1 ditolak (usia pada OST sebagai wakil).
for (const [k, lo, hi] of [['age', 18, 120], ['weightKg', 20, 400]] as const) {
  assert.equal(ost({ [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(ost({ [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(ost({ [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(ost({ [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}
// HDL 5 menjaga aturan silang HDL < kolesterol total tidak ikut menolak di batas bawah kolesterol.
for (const [k, lo, hi] of [['totChol', 50, 1000], ['sbp', 50, 300]] as const) {
  assert.equal(cvd({ hdl: 5, [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(cvd({ hdl: 5, [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(cvd({ hdl: 5, [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(cvd({ hdl: 5, [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}
for (const [lo, hi] of [[5, 200]] as const) { // HDL: batas atas diuji dengan kolesterol di atasnya
  assert.equal(cvd({ totChol: 400, hdl: lo }).invalid.length, 0, 'hdl 5'); assert.equal(cvd({ totChol: 400, hdl: hi }).invalid.length, 0, 'hdl 200')
  assert.equal(cvd({ totChol: 400, hdl: lo - 1 }).invalid.length, 1, 'hdl 4'); assert.equal(cvd({ totChol: 400, hdl: hi + 1 }).invalid.length, 1, 'hdl 201')
}
for (const [k, lo, hi] of [['ast', 1, 5000], ['alt', 1, 5000], ['platelets', 5, 2000]] as const) {
  assert.equal(fib({ [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(fib({ [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(fib({ [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(fib({ [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}
assert.equal(RISK_RANGES.hdl.max, 200)

const page = readFileSync(new URL('../../src/pages/clinical/scores/RiskCalculators.tsx', import.meta.url), 'utf8')
const kode = page.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
assert.ok(/cvdRisk\(\{/.test(kode) && /hitungFib4\(\{/.test(kode) && /hitungOst\(\{/.test(kode), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(kode) && !/\bgetDemo\s*\(/.test(kode), '`|| 0` atau getDemo() kembali')
assert.ok(/getDemoTersimpan/.test(kode), 'profil tersimpan tidak dibaca')
assert.ok((kode.match(/role="alert"/g) ?? []).length >= 1 && /alasan\(cvdHasil\)/.test(kode) && /alasan\(fibHasil\)/.test(kode) && /alasan\(ostHasil\)/.test(kode), 'penolakan tidak ditampilkan di tiga kartu')
console.log('risk-screens: Framingham = rumus tulis-ulang, FIB-4 1,67, OST trunc, pita berpasangan, kosong/di luar rentang gagal tertutup')
