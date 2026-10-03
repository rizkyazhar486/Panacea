import assert from 'node:assert/strict'
import { cronAuthorized, cronKeyMatches, extractCronKey } from '../src/cronAuth.js'

const S = 's3cret-key'
const req = (headers: Record<string, string | string[]> = {}, query: Record<string, unknown> = {}) => ({ headers, query })

// positif
assert.equal(cronKeyMatches(S, S), true)
assert.equal(cronAuthorized(req({ authorization: `Bearer ${S}` }), S), true)
assert.equal(cronAuthorized(req({ 'x-cron-key': S }), S), true)
assert.equal(cronAuthorized(req({}, { key: S }), S), true)

// negatif: ditolak dan tidak ada nilai tebakan
assert.equal(cronKeyMatches('wrong', S), false)
assert.equal(cronKeyMatches(S + 'x', S), false)
assert.equal(cronKeyMatches(S.slice(0, -1), S), false)
assert.equal(cronKeyMatches('', S), false)
assert.equal(cronKeyMatches(undefined, S), false)
assert.equal(cronKeyMatches(['s3cret-key'], S), false, 'query ?key=a&key=b menghasilkan array')
assert.equal(cronKeyMatches(S, undefined), false, 'secret tak diset → tutup')
assert.equal(cronKeyMatches('', ''), false, 'secret kosong tak boleh cocok dengan kunci kosong')
assert.equal(cronAuthorized(req(), S), false)
assert.equal(cronAuthorized(req({ authorization: 'Bearer wrong' }), S), false)
assert.equal(cronAuthorized(req({ authorization: `Basic ${S}` }), S), false)
assert.equal(cronAuthorized(req({}, { key: [S] }), S), false)

// berpasangan: hanya sumber yang berbeda; kunci salah di Bearer tidak jatuh ke query benar
assert.equal(cronAuthorized(req({ authorization: 'Bearer wrong' }, { key: S }), S), false)

// urutan & sumber
assert.deepEqual(extractCronKey(req({ authorization: 'bearer abc' })), { key: 'abc', via: 'bearer' })
assert.deepEqual(extractCronKey(req({ 'x-cron-key': ['a', 'b'] })), { key: 'a', via: 'header' })
assert.deepEqual(extractCronKey(req({}, { key: 'q' })), { key: 'q', via: 'query' })
assert.deepEqual(extractCronKey(req()), { key: undefined, via: 'none' })

console.log('cronAuth.uji: ok')
