import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cronAuthorized, safeEqualSecret } from '../src/shared/secretCompare.js'

const SECRET = 'synthetic-cron-secret-value'
const req = (query: Record<string, unknown> = {}, authorization?: string | string[]) => ({ query, headers: { authorization } })

// ── safeEqualSecret ──
assert.equal(safeEqualSecret(SECRET, SECRET), true)
assert.equal(safeEqualSecret('a', 'a'), true)
// Pasangan: hanya satu karakter berbeda (awal, tengah, akhir) → ditolak; panjang berbeda (awalan/akhiran) → ditolak.
for (const salah of ['Xynthetic-cron-secret-value', 'synthetic-cron-Xecret-value', 'synthetic-cron-secret-valuX', SECRET.slice(0, -1), SECRET + 'x', SECRET.toUpperCase(), ` ${SECRET}`, `${SECRET} `]) {
  assert.equal(safeEqualSecret(salah, SECRET), false, JSON.stringify(salah))
}
// Gagal tertutup: rahasia yang diharapkan kosong/tidak ada tidak pernah cocok, termasuk dengan masukan kosong yang "sama".
for (const expected of [undefined, '']) {
  assert.equal(safeEqualSecret(SECRET, expected), false, `expected=${JSON.stringify(expected)}`)
  assert.equal(safeEqualSecret('', expected), false, 'kosong vs kosong tidak boleh cocok')
  assert.equal(safeEqualSecret(undefined, expected), false)
}
for (const supplied of [undefined, null, '', 0, 12345, true, {}, [], [SECRET], ['a', SECRET]] as unknown[]) {
  assert.equal(safeEqualSecret(supplied, SECRET), false, `supplied=${JSON.stringify(supplied)}`)
}
assert.equal(safeEqualSecret('😀 rahasia', '😀 rahasia'), true, 'unicode')
assert.equal(safeEqualSecret('😀 rahasia', '😁 rahasia'), false)

// ── cronAuthorized ──
assert.equal(cronAuthorized(req({ key: SECRET }), SECRET), true, 'query key lama tetap diterima')
assert.equal(cronAuthorized(req({}, `Bearer ${SECRET}`), SECRET), true)
assert.equal(cronAuthorized(req({}, `bearer ${SECRET}`), SECRET), true, 'skema tidak peka huruf besar-kecil')
assert.equal(cronAuthorized(req({}, `  Bearer   ${SECRET}  `), SECRET), true, 'spasi di sekitar header ditoleransi')
assert.equal(cronAuthorized(req({ key: 'salah' }, `Bearer ${SECRET}`), SECRET), true, 'bearer benar mengalahkan query salah')
assert.equal(cronAuthorized(req({ key: SECRET }, 'Bearer salah'), SECRET), true, 'query benar tetap sah bila bearer salah (jalur lama)')
// Negatif: tanpa kredensial, kredensial salah, skema salah, bentuk salah.
for (const [nama, r] of [
  ['tanpa apa pun', req()],
  ['query salah', req({ key: 'salah' })],
  ['query kosong', req({ key: '' })],
  ['query array (key=a&key=b)', req({ key: [SECRET, SECRET] })],
  ['query array berisi rahasia', req({ key: [SECRET] })],
  ['query objek', req({ key: { 0: SECRET } })],
  ['query angka', req({ key: 12345 })],
  ['parameter lain bernama secret', req({ secret: SECRET })],
  ['bearer salah', req({}, 'Bearer salah')],
  ['bearer kosong', req({}, 'Bearer ')],
  ['skema Basic', req({}, `Basic ${SECRET}`)],
  ['tanpa skema', req({}, SECRET)],
  ['header berupa daftar', req({}, [`Bearer ${SECRET}`])],
  ['bearer + awalan ekstra', req({}, `xBearer ${SECRET}`)],
] as const) assert.equal(cronAuthorized(r, SECRET), false, nama)
// Rahasia server tidak dikonfigurasi: semuanya ditolak, bahkan masukan kosong.
for (const r of [req({ key: SECRET }), req({ key: '' }), req({}, `Bearer ${SECRET}`), req({}, 'Bearer '), req()]) {
  assert.equal(cronAuthorized(r, undefined), false)
  assert.equal(cronAuthorized(r, ''), false)
}

// ── Struktur: tidak ada perbandingan rahasia yang bergantung data, dan rute memakai helper ──
const helper = readFileSync(new URL('../src/shared/secretCompare.ts', import.meta.url), 'utf8')
assert.match(helper, /timingSafeEqual\(a, b\)/)
assert.match(helper, /createHash\('sha256'\)/)
assert.doesNotMatch(helper.replace(/\/\*[\s\S]*?\*\//g, ''), /(?:supplied|expected|key|bearer)\s*(?:===|!==|==|!=)\s*(?:supplied|expected|secret|key|bearer)\b/, 'helper tidak boleh membandingkan rahasia dengan ===')
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.match(index, /import \{ cronAuthorized \} from '\.\/shared\/secretCompare\.js'/)
assert.match(index, /if \(!cronAuthorized\(req, process\.env\.CRON_SECRET\)\) return res\.status\(403\)/)
assert.doesNotMatch(index, /req\.query\.key\s*(?:!==|===)/, 'rute cron tidak boleh membandingkan query key dengan ===')
assert.doesNotMatch(index, /const secret = process\.env\.CRON_SECRET/, 'rahasia cron dibaca hanya lewat pemanggilan helper')
console.log('secretCompare: constant-time cron secret check; bearer header or legacy ?key=; fails closed on missing secret, arrays and non-strings')
