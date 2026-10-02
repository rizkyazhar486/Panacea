import assert from 'node:assert/strict'
import { cronRequestAuthorized, cronSecretMatches } from '../src/cronAuth.js'

const S = 'cron-secret-0123456789'

// positif
assert.equal(cronSecretMatches(S, S), true)
assert.equal(cronRequestAuthorized({ query: { key: S }, headers: {} }, S), true)
assert.equal(cronRequestAuthorized({ query: {}, headers: { authorization: `Bearer ${S}` } }, S), true)
assert.equal(cronRequestAuthorized({ query: {}, headers: { authorization: `bearer  ${S} ` } }, S), true)

// negatif: rahasia belum dikonfigurasi => selalu tolak (fail closed), termasuk kunci kosong
assert.equal(cronSecretMatches('', ''), false)
assert.equal(cronSecretMatches(undefined, undefined), false)
assert.equal(cronRequestAuthorized({ query: { key: '' }, headers: {} }, ''), false)
assert.equal(cronRequestAuthorized({ query: { key: S }, headers: {} }, undefined), false)

// negatif berpasangan: hanya satu karakter / panjang yang berbeda
assert.equal(cronSecretMatches(S.slice(0, -1) + 'X', S), false)
assert.equal(cronSecretMatches(S + 'x', S), false)
assert.equal(cronSecretMatches(S.slice(0, -1), S), false)
assert.equal(cronSecretMatches('x'.repeat(10_000), S), false)

// negatif: bukan string (array dari ?key=a&key=b, objek, angka)
assert.equal(cronRequestAuthorized({ query: { key: [S, S] }, headers: {} }, S), false)
assert.equal(cronRequestAuthorized({ query: { key: { a: S } }, headers: {} }, S), false)
assert.equal(cronSecretMatches(123, '123'), false)

// negatif: skema/header salah; header salah tidak menyelamatkan query salah
assert.equal(cronRequestAuthorized({ query: {}, headers: { authorization: `Basic ${S}` } }, S), false)
assert.equal(cronRequestAuthorized({ query: {}, headers: { authorization: S } }, S), false)
assert.equal(cronRequestAuthorized({ query: { key: 'salah' }, headers: { authorization: 'Bearer salah' } }, S), false)
// header salah tetapi query benar => tetap diterima (kompatibilitas ?key=)
assert.equal(cronRequestAuthorized({ query: { key: S }, headers: { authorization: 'Bearer salah' } }, S), true)

console.log('cronAuth.uji OK')
