import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseNumberField, validateAltitude, validateAltitudeExposure, validateHeatExposure } from '../../src/domains/sport/index.ts'

const NaNs = [NaN, Infinity, -Infinity, parseNumberField(''), parseNumberField('   '), parseNumberField('abc')]

// Positif: nilai sah diteruskan persis.
assert.deepEqual(validateHeatExposure(32, 60), { ok: true, value: { suhuC: 32, menit: 60 } })
assert.deepEqual(validateAltitudeExposure(2500, 14), { ok: true, value: { meter: 2500, jam: 14 } })
assert.deepEqual(validateAltitude(0), { ok: true, value: 0 })
// Batas berpasangan: tepat di batas diterima, ±langkah ditolak dengan alasan eksplisit.
for (const [t, m] of [[0, 1], [60, 1440], [0, 1440], [60, 1]] as const) assert.equal(validateHeatExposure(t, m).ok, true, `${t}/${m}`)
const GT = { ok: false, reason: 'Temperature must be 0–60 °C' }, GM = { ok: false, reason: 'Minutes must be 1–1440' }
for (const t of [-0.01, 60.01, ...NaNs]) assert.deepEqual(validateHeatExposure(t, 60), GT, `suhu ${t}`)
for (const m of [0.99, 0, 1440.01, ...NaNs]) assert.deepEqual(validateHeatExposure(32, m), GM, `menit ${m}`)
const GA = { ok: false, reason: 'Altitude must be 0–8900 m' }, GJ = { ok: false, reason: 'Hours must be 0.5–24' }
for (const a of [-1, 8900.01, ...NaNs]) { assert.deepEqual(validateAltitude(a), GA, `alt ${a}`); assert.deepEqual(validateAltitudeExposure(a, 14), GA) }
assert.equal(validateAltitude(8900).ok, true)
for (const j of [0.49, 0, 24.01, ...NaNs]) assert.deepEqual(validateAltitudeExposure(2500, j), GJ, `jam ${j}`)
for (const j of [0.5, 24]) assert.equal(validateAltitudeExposure(2500, j).ok, true)
// Bukan-angka ditolak, tidak ada data.
for (const x of [undefined, null, '32', {}] as unknown as number[]) { assert.equal(validateHeatExposure(x, 60).ok, false); assert.equal(validateAltitude(x).ok, false) }
assert.equal('value' in (validateHeatExposure(NaN, 60) as object), false)
// Regresi: kolom kosong dulu → 0 → paparan 0 °C/0 menit tersimpan dan penalti "−0%" tampil; kini ditolak.
assert.equal(Number('') || 0, 0)
assert.equal(validateHeatExposure(parseNumberField(''), parseNumberField('')).ok, false)
assert.equal(validateAltitude(parseNumberField('')).ok, false)
// Determinisme.
assert.deepEqual(validateHeatExposure(30, 45), validateHeatExposure(30, 45))
// Halaman memakai engine dan tidak lagi menyimpan kolom kosong sebagai 0.
const h = readFileSync(new URL('../../src/pages/fitness/EnduranceTools.tsx', import.meta.url), 'utf8')
assert.match(h, /validateAltitudeExposure\(parseNumberField\(tMeter\), parseNumberField\(tJam\)\)/)
assert.match(h, /validateHeatExposure\(parseNumberField\(pSuhu\), parseNumberField\(pMenit\)\)/)
assert.doesNotMatch(h, /Number\((tMeter|tJam|pSuhu|pMenit)\) \|\| 0/)
console.log('aklimatisasi-log OK')
