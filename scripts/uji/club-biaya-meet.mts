import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMeetFee, MEET_FEE_MAX_RP } from '../../src/domains/club/index.ts'

const problem = (x: unknown) => { const r = parseMeetFee(x); assert.equal(r.ok, false, String(x)); return r.ok ? '' : r.problem }

// Positif: nol eksplisit = gratis; biaya bulat sah.
assert.deepEqual(parseMeetFee('0'), { ok: true, feeRp: 0 })
assert.deepEqual(parseMeetFee('85000'), { ok: true, feeRp: 85000 })
// Batas berpasangan: 0 / -0.01 dan max / max+1.
assert.equal(parseMeetFee(String(MEET_FEE_MAX_RP)).ok, true)
assert.equal(problem(String(MEET_FEE_MAX_RP + 1)), 'too_large')
assert.equal(problem('-0.01'), 'negative'); assert.equal(problem('-5000'), 'negative')
// Negatif: kosong bukan gratis; jenis penolakan eksak dan tanpa angka.
assert.equal(problem(''), 'empty'); assert.equal(problem('   '), 'empty')
for (const x of [undefined, null, 0, {}]) assert.equal(problem(x), 'empty')
for (const x of ['abc', 'Infinity', '-Infinity', 'NaN', '1e999']) assert.equal(problem(x), 'not_a_number', x)
assert.equal(problem('12500.5'), 'fractional')
assert.equal('feeRp' in (parseMeetFee('') as object), false)
// Determinisme.
assert.deepEqual(parseMeetFee('45000'), parseMeetFee('45000'))
// Regresi: dulu kosong/negatif → 0 (meet gratis tak disengaja) lewat `Number(x) || 0`.
assert.equal(Number('') || 0, 0)
const halaman = readFileSync(new URL('../../src/pages/ClubHub.tsx', import.meta.url), 'utf8')
assert.match(halaman, /parseMeetFee\(feeText\)/)
assert.match(halaman, /if \(!fee\.ok\) \{ setError\(fee\.message\); return \}/)
assert.doesNotMatch(halaman, /setFeeRp\(Number\(e\.target\.value\) \|\| 0\)/)
console.log('club-biaya-meet OK')
