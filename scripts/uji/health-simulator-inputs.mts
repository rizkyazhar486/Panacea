import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateFraminghamInput, FRAMINGHAM_RANGE, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'
import { framinghamCVD } from '../../src/lib/riskModels.ts'

const ok = { age: 50, totChol: 200, hdl: 50, sbp: 130 }

// Positif: nilai sah lolos persis, dan menghasilkan risiko dari persamaan terbitan (bukan angka tebakan).
assert.deepEqual(validateFraminghamInput(ok), { ok: true, value: ok })
const risk = framinghamCVD({ ...ok, sex: 'M', treatedBP: false, smoker: false, diabetic: false })
assert.equal(typeof risk, 'number')

// Batas berpasangan: tepat di batas lolos, ±1 langkah di luar ditolak dengan pesan eksak per kolom.
const msg = { age: 'age must be 30–74 years', totChol: 'total cholesterol must be 100–500 mg/dL', hdl: 'HDL must be 10–150 mg/dL', sbp: 'systolic BP must be 70–300 mmHg' } as const
for (const f of Object.keys(FRAMINGHAM_RANGE) as (keyof typeof FRAMINGHAM_RANGE)[]) {
  const { min, max } = FRAMINGHAM_RANGE[f]
  for (const v of [min, max]) assert.equal(validateFraminghamInput({ ...ok, [f]: v }).ok, true, `${f}=${v}`)
  for (const v of [min - 1, max + 1, 0, -5]) assert.deepEqual(validateFraminghamInput({ ...ok, [f]: v }), { ok: false, problems: { [f]: msg[f] } }, `${f}=${v}`)
}

// Negatif: kosong (NaN) = "required", bukan 0; Infinity / bukan angka ditolak; tidak ada `value` yang bocor.
for (const f of Object.keys(msg) as (keyof typeof msg)[]) {
  const r = validateFraminghamInput({ ...ok, [f]: NaN })
  assert.equal(r.ok, false); assert.equal('value' in r, false)
  assert.deepEqual(r.ok ? null : r.problems, { [f]: `${FRAMINGHAM_RANGE[f].label} is required` })
  assert.equal(validateFraminghamInput({ ...ok, [f]: Infinity }).ok, false)
  assert.equal(validateFraminghamInput({ ...ok, [f]: '50' as unknown as number }).ok, false)
}
// Banyak masalah sekaligus dilaporkan bersama; semua kolom kosong → empat "required".
const blank = validateFraminghamInput({ age: parseNumberField(''), totChol: parseNumberField('  '), hdl: parseNumberField(undefined), sbp: parseNumberField('') })
assert.deepEqual(blank, { ok: false, problems: { age: 'age is required', totChol: 'total cholesterol is required', hdl: 'HDL is required', sbp: 'systolic BP is required' } })

// Determinisme.
assert.deepEqual(validateFraminghamInput(ok), validateFraminghamInput(ok))

// Regresi halaman: tanpa `|| 0`, tanpa getDemo(), tanpa nilai awal karangan 200/50/140; hasil digerbang oleh masukan sah.
const kode = readFileSync(new URL('../../src/pages/HealthSimulator.tsx', import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
assert.ok(!/\|\|\s*0\b/.test(kode.replace(/\|\|\s*0\.\d/g, '')) , 'kolom kosong kembali terbaca 0')
assert.ok(!/\bgetDemo\s*\(/.test(kode), 'getDemo() kembali')
assert.ok(!/totChol: 200|hdl: 50|sbp: 140|age: demo\.age \|\| 45/.test(kode), 'nilai awal karangan kembali')
assert.ok(/validateFraminghamInput\(/.test(kode) && /parseNumberField\(txt\./.test(kode), 'halaman tidak memakai mesin domain')
console.log('health-simulator-inputs: Framingham wajib diisi, usia 30–74, kosong ≠ 0, tanpa profil karangan')
