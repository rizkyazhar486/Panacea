import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseUnsupportedClaimCount as p, UNSUPPORTED_CLAIM_MAX } from '../../src/domains/clinical-review/index.ts'

// Positif: nol eksplisit dan bilangan bulat diterima persis.
assert.deepEqual(p('0'), { ok: true, value: 0 })
assert.deepEqual(p(' 3 '), { ok: true, value: 3 })
// Batas berpasangan: 100 diterima, 101 ditolak.
assert.deepEqual(p(String(UNSUPPORTED_CLAIM_MAX)), { ok: true, value: 100 })
assert.deepEqual(p('101'), { ok: false, problem: 'Unsupported claims cannot exceed 100.' })
// Negatif: kosong tidak boleh menjadi 0 (inti perbaikan), begitu juga teks/negatif/pecahan/eksponen/Infinity.
const kosong = { ok: false, problem: 'Enter the number of unsupported claims (0 if none).' }
assert.deepEqual(p(''), kosong)
assert.deepEqual(p('   '), kosong)
const bukanBulat = { ok: false, problem: 'Unsupported claims must be a whole number.' }
for (const v of ['abc', '-1', '2.5', '1e2', 'Infinity', 'NaN', '0x10', '1,5']) assert.deepEqual(p(v), bukanBulat, v)
// Determinisme.
assert.deepEqual(p('7'), p('7'))

// Runtime callers must fail closed, not throw or coerce a non-text value.
for (const bad of [null, undefined, 0, true, {}, []]) assert.equal(p(bad as unknown as string).ok, false)

const component = readFileSync(new URL('../../src/components/clinical/StudiValidasiKlinis.tsx', import.meta.url), 'utf8')
const guard = component.indexOf('if (!klaim.ok)')
assert.ok(guard > component.indexOf('parseUnsupportedClaimCount(f.klaim)'))
assert.ok(guard < component.indexOf('api.submitValidationAssessment'))
assert.match(component, /klaimTakDidukung: klaim.value/)
assert.doesNotMatch(component, /Number\(f.klaim\)\s*\|\|\s*0/)
const workflow = readFileSync(new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url), 'utf8')
assert.match(workflow, /run: node scripts\/qa\/claim-count-input-smoke\.mjs/)
console.log('klaim-tak-didukung-entry: OK; missing/runtime-invalid denied before submission')
