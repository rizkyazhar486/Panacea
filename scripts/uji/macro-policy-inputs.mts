import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validatePolicyInput, POLICY_BOUNDS, type PolicyInputText } from '../../src/domains/macro-policy/index.ts'

const base: PolicyInputText = { startInflationPct: '6', targetInflationPct: '2.5', startPolicyRatePct: '6', outputGapPct: '1' }
const run = (p: Partial<PolicyInputText>) => validatePolicyInput({ ...base, ...p })
const bad = (p: Partial<PolicyInputText>) => { const r = run(p); assert.equal(r.ok, false, JSON.stringify(p)); return r.ok ? {} : r.problems }

// Positif: nilai persis, termasuk desimal dan negatif yang dulu tak bisa diketik.
assert.deepEqual(run({}), { ok: true, value: { startInflationPct: 6, targetInflationPct: 2.5, startPolicyRatePct: 6, outputGapPct: 1 } })
assert.deepEqual(run({ outputGapPct: '-2.5', startInflationPct: '-0.5' }), { ok: true, value: { startInflationPct: -0.5, targetInflationPct: 2.5, startPolicyRatePct: 6, outputGapPct: -2.5 } })
assert.deepEqual(run({ targetInflationPct: ' 3 ' }).ok, true)
// Determinisme.
assert.deepEqual(run({}), run({}))

// Batas berpasangan per kolom: tepat di batas diterima, ±langkah ditolak, hanya kolom itu yang dilaporkan.
for (const k of Object.keys(POLICY_BOUNDS) as (keyof typeof POLICY_BOUNDS)[]) {
  const { min, max, label } = POLICY_BOUNDS[k]
  assert.equal(run({ [k]: String(min) }).ok, true, `${k} min`)
  assert.equal(run({ [k]: String(max) }).ok, true, `${k} max`)
  assert.deepEqual(bad({ [k]: String(min - 0.01) }), { [k]: `${label}: ${min} to ${max}` })
  assert.deepEqual(bad({ [k]: String(max + 0.01) }), { [k]: `${label}: ${min} to ${max}` })
}

// Negatif: kosong, spasi, "-", ".", bukan angka, NaN, Infinity → "enter a number", tanpa nilai tebakan.
for (const t of ['', '   ', '-', '.', 'abc', 'NaN', 'Infinity', '-Infinity', '1e999']) {
  assert.deepEqual(bad({ outputGapPct: t }), { outputGapPct: 'Output gap: enter a number' }, JSON.stringify(t))
}
// Banyak masalah sekaligus, tanpa `value`.
const banyak = validatePolicyInput({ startInflationPct: '', targetInflationPct: '99', startPolicyRatePct: '6', outputGapPct: 'x' })
assert.equal(banyak.ok, false)
assert.deepEqual(Object.keys(banyak.ok ? {} : banyak.problems).sort(), ['outputGapPct', 'startInflationPct', 'targetInflationPct'])
assert.equal('value' in (banyak as object), false)
// Data tak tepercaya: tipe salah ditolak, tidak melempar.
assert.equal(validatePolicyInput({ ...base, outputGapPct: 1 as unknown as string }).ok, false)
assert.equal(validatePolicyInput(undefined as unknown as PolicyInputText).ok, false)

// Regresi: bentuk lama menelan kosong dan "-" sebagai 0.
assert.equal(Number('') || 0, 0); assert.equal(Number('-') || 0, 0)
assert.equal(run({ startInflationPct: '' }).ok, false); assert.equal(run({ outputGapPct: '-' }).ok, false)

// Wiring halaman: memakai validator lewat index domain, tanpa `|| 0` di SimTab, grafik hanya bila sah.
const halaman = readFileSync(new URL('../../src/pages/MacroLab.tsx', import.meta.url), 'utf8')
assert.match(halaman, /from '\.\.\/domains\/macro-policy'/, 'MacroLab harus memakai domain macro-policy lewat index')
assert.match(halaman, /validatePolicyInput\(text\)/)
const sim = halaman.slice(halaman.indexOf('function SimTab()'), halaman.indexOf('function TradeTab()'))
assert.doesNotMatch(sim, /Number\(e\.target\.value\) \|\| 0/, 'bentuk lama Number(x) || 0 kembali di SimTab')
assert.match(sim, /checked\.ok \? simulatePolicy\(/, 'simulasi hanya boleh jalan dengan masukan sah')
assert.match(sim, /No simulation yet/, 'keadaan tak sah harus menampilkan pesan, bukan grafik')
console.log('macro-policy-inputs: ok')
