import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMeetCoordinates } from '../src/modules/meets/domain/coordinates.ts'

const bad = { ok: false, error: 'invalid_coordinates' }

// positif
assert.deepEqual(parseMeetCoordinates(-6.2, 106.8), { ok: true, lat: -6.2, lng: 106.8 })
assert.deepEqual(parseMeetCoordinates(undefined, undefined), { ok: true, lat: 0, lng: 0 })
assert.deepEqual(parseMeetCoordinates(null, null), { ok: true, lat: 0, lng: 0 })
assert.deepEqual(parseMeetCoordinates(0, 0), { ok: true, lat: 0, lng: 0 })

// batas berpasangan
for (const [a, b] of [[90, 180], [-90, -180]]) assert.deepEqual(parseMeetCoordinates(a, b), { ok: true, lat: a, lng: b })
for (const [a, b] of [[90.0001, 0], [-90.0001, 0], [0, 180.0001], [0, -180.0001]]) assert.deepEqual(parseMeetCoordinates(a, b), bad)

// negatif
for (const v of [NaN, Infinity, -Infinity, '1', '', {}, [], true]) {
  assert.deepEqual(parseMeetCoordinates(v, 10), bad)
  assert.deepEqual(parseMeetCoordinates(10, v), bad)
}
assert.deepEqual(parseMeetCoordinates(10, undefined), bad)
assert.deepEqual(parseMeetCoordinates(undefined, 10), bad)

// determinisme
assert.deepEqual(parseMeetCoordinates(1, 2), parseMeetCoordinates(1, 2))

// regresi: handler memakai parser, bukan `Number(b.lat) || 0`
const src = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.match(src, /parseMeetCoordinates\(b\.lat, b\.lng\)/)
assert.doesNotMatch(src, /Number\(b\.lat\) \|\| 0/)
console.log('meetCoordinates ok')
