import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MAX_SERVINGS_PER_WEEK, parseServingField, sanitizeServings, estimateRecordedFood } from '../../src/domains/personal-health/engine/dietServings.ts'

// Positif
assert.deepEqual(parseServingField('3'), { ok: true, value: 3 })
assert.deepEqual(parseServingField(' 2.5 '), { ok: true, value: 2.5 })
assert.deepEqual(parseServingField(''), { ok: false, reason: 'required' }, 'blank is unknown, not no food')
assert.deepEqual(parseServingField(0), { ok: true, value: 0 })
// Batas berpasangan: 100 sah, 100.01 ditolak; 0 sah, -0.01 ditolak
assert.deepEqual(parseServingField(String(MAX_SERVINGS_PER_WEEK)), { ok: true, value: 100 })
assert.deepEqual(parseServingField('100.01'), { ok: false, reason: 'too_many' })
assert.deepEqual(parseServingField('-0.01'), { ok: false, reason: 'negative' })
// Negatif: jenis penolakan eksak
for (const bad of ['abc', '1e2', '0x10', '1,5', 'NaN', 'Infinity', '--1', '1 2']) assert.deepEqual(parseServingField(bad), { ok: false, reason: 'not_a_number' }, bad)
for (const bad of [NaN, Infinity, -Infinity]) assert.deepEqual(parseServingField(bad), { ok: false, reason: 'not_a_number' })
for (const bad of [null, undefined, {}, [], true]) assert.deepEqual(parseServingField(bad), { ok: false, reason: 'not_a_number' })
assert.deepEqual(parseServingField(-1), { ok: false, reason: 'negative' })

// sanitizeServings: data simpanan rusak tidak masuk
const keys = ['beef', 'rice']
assert.deepEqual(sanitizeServings({ beef: 2, rice: 3 }, keys), { beef: 2, rice: 3 })
assert.deepEqual(sanitizeServings({ beef: -2, rice: 3 }, keys), { rice: 3 }, 'negatif dibuang, yang sah tetap')
assert.deepEqual(sanitizeServings({ beef: '2', rice: NaN, x: 5 }, keys), {}, 'string, NaN, kunci asing dibuang')
assert.deepEqual(sanitizeServings({ beef: 1e9 }, keys), {})
assert.deepEqual(sanitizeServings({ __proto__: { beef: 2 } }, keys), {}, 'tidak membaca prototipe')
for (const bad of [null, undefined, 5, 'x', [1, 2]]) assert.deepEqual(sanitizeServings(bad, keys), {})
// Determinisme
assert.deepEqual(sanitizeServings({ beef: 2 }, keys), sanitizeServings({ beef: 2 }, keys))

// Regresi halaman: tidak lagi memaksa nilai tak sah menjadi angka lewat `|| 0`
const halaman = readFileSync('src/pages/CarbonDiet.tsx', 'utf8')
assert.ok(!/Number\([^()]*\)\s*\|\|\s*0/.test(halaman), 'CarbonDiet masih memakai Number(...) || 0')
assert.ok(halaman.includes('parseServingField') && halaman.includes('sanitizeServings'))
console.log('carbon-diet-sajian: ok')

assert.deepEqual(sanitizeServings({ beef: 0 }, keys), { beef: 0 }, 'explicit zero must survive persistence')
const factors = [{ key: 'beef', servingG: 113, kgCo2ePerKg: 99.5 }, { key: 'rice', servingG: 158, kgCo2ePerKg: 4.5 }]
assert.deepEqual(estimateRecordedFood({}, factors), { totalWeek: null, recorded: 0, missing: 2 })
assert.deepEqual(estimateRecordedFood({ beef: 0 }, factors), { totalWeek: 0, recorded: 1, missing: 1 })
assert.deepEqual(estimateRecordedFood({ beef: 0, rice: 0 }, factors), { totalWeek: 0, recorded: 2, missing: 0 })
assert.equal(estimateRecordedFood({ beef: 2, rice: 3 }, factors).totalWeek, 24.62)
assert.deepEqual(estimateRecordedFood({ beef: -1, rice: '3' }, factors), { totalWeek: null, recorded: 0, missing: 2 })
