import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseNumberField, waistToHeight } from '../../src/domains/clinical-calculators/index.ts'

const ok = (w: number, h: number) => { const r = waistToHeight(w, h); assert.ok(r.ok, `${w}/${h}`); return r.ok ? r.data : (undefined as never) }

// Positif: nilai tangan 80/160 = 0,5 → pita tengah (batas bawah termasuk "Increased").
assert.deepEqual(ok(80, 160), { ratio: 0.5, label: 'Increased risk', tone: 'low' })
assert.deepEqual(ok(70, 160), { ratio: 0.4375, label: 'Lower risk', tone: 'brand' })
assert.deepEqual(ok(96, 160), { ratio: 0.6, label: 'High risk', tone: 'critical' })
// Batas berpasangan di tiap ambang: tepat 0,5 / 0,6 naik pita, satu langkah di bawahnya tidak.
assert.equal(ok(79.9, 160).label, 'Lower risk'); assert.equal(ok(80, 160).label, 'Increased risk')
assert.equal(ok(95.9, 160).label, 'Increased risk'); assert.equal(ok(96, 160).label, 'High risk')
// Determinisme.
assert.deepEqual(waistToHeight(88, 172), waistToHeight(88, 172))
// Rentang diterima di batas, ditolak ±langkah di luar dengan alasan eksplisit dan tanpa data.
for (const [w, h] of [[40, 100], [200, 230], [40, 230], [200, 100]] as const) assert.equal(waistToHeight(w, h).ok, true, `${w}/${h}`)
const GW = { ok: false, reason: 'Waist must be 40–200 cm' }, GH = { ok: false, reason: 'Height must be 100–230 cm' }
for (const w of [39.99, 0, -80, 200.01, NaN, Infinity, parseNumberField('')]) assert.deepEqual(waistToHeight(w, 170), GW, `waist ${w}`)
for (const h of [99.99, 0, -170, 230.01, NaN, Infinity, parseNumberField('   ')]) assert.deepEqual(waistToHeight(80, h), GH, `height ${h}`)
for (const salah of [undefined, null, '80', {}] as unknown as number[]) { assert.equal(waistToHeight(salah, 170).ok, false); assert.equal(waistToHeight(80, salah).ok, false) }
assert.equal('data' in (waistToHeight(80, 0) as object), false)
// Regresi: tinggi kosong dulu → 0 → rasio Infinity "High risk"; kini ditolak.
assert.equal(80 / (Number('') || 0), Infinity)
assert.equal(waistToHeight(80, parseNumberField('')).ok, false)
// Halaman memakai engine dan tidak lagi membaca kolom kosong sebagai 0.
const halaman = readFileSync(new URL('../../src/pages/SelfAssessmentToolkit.tsx', import.meta.url), 'utf8')
assert.match(halaman, /waistToHeight\(parseNumberField\(waist\), parseNumberField\(height\)\)/)
assert.doesNotMatch(halaman, /Number\(e\.target\.value\) \|\| 0/)
console.log('waist-height OK')
