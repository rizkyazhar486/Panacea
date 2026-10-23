import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateMaterialPrice } from '../../src/domains/marketplace/engine/materialPrice.ts'

// Positif + batas: 0 sah (gratis eksplisit), bulat positif sah.
assert.deepEqual(validateMaterialPrice(5), { ok: true, priceTokens: 5 })
assert.deepEqual(validateMaterialPrice(0), { ok: true, priceTokens: 0 })
// Negatif: tiap aturan berpasangan dengan kasus sah di atas.
const bad = { ok: false, problem: 'Price must be a safe whole number of 0 PNC or more' }
assert.deepEqual(validateMaterialPrice(-1), bad)
assert.deepEqual(validateMaterialPrice(NaN), bad)
assert.deepEqual(validateMaterialPrice(Infinity), bad)
assert.deepEqual(validateMaterialPrice(2.5), bad)
// Determinisme.
assert.deepEqual(validateMaterialPrice(7), validateMaterialPrice(7))
// Regresi halaman: harga tidak lagi dipaksa 0 lewat `|| 0`.
const hal = readFileSync(new URL('../../src/pages/finance/Marketplace.tsx', import.meta.url), 'utf8')
assert.ok(!/priceTokens: Number\(f\.price\) \|\| 0/.test(hal))
assert.ok(hal.includes('validateMaterialPrice(f.price)'))
// Regresi Editor: harga kosong (NaN) ditolak, bukan jadi listing gratis.
const ed = readFileSync(new URL('../../src/pages/medstudy/Editor.tsx', import.meta.url), 'utf8')
assert.ok(!/Number\(price\) \|\| 0/.test(ed))
assert.ok(ed.includes('validateMaterialPrice(price)'))
assert.ok(ed.includes("e.target.value === '' ? NaN"))

// A token price must preserve exact integer units in JavaScript and JSON.
assert.deepEqual(validateMaterialPrice(Number.MAX_SAFE_INTEGER), { ok: true, priceTokens: Number.MAX_SAFE_INTEGER })
assert.equal(validateMaterialPrice(Number.MAX_SAFE_INTEGER + 1).ok, false)
assert.equal(validateMaterialPrice(1e20).ok, false)

for (const bad of [-Infinity, '5', null, undefined, true, {}, []]) assert.equal(validateMaterialPrice(bad as unknown as number).ok, false)
console.log('marketplace-harga: OK; missing/invalid/unsafe prices denied; explicit free remains valid')
