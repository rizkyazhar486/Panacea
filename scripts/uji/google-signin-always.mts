// Tombol Google tidak boleh hilang hanya karena backend sedang tidur: ID klien diambil dari server, lalu dari
// build, lalu dari cache browser; nilai cacat dari sumber mana pun ditolak.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GOOGLE_CLIENT_ID_CACHE_KEY, isGoogleClientId, readCachedGoogleClientId, rememberGoogleClientId, resolveGoogleClientId,
} from '../../src/domains/identity/googleClientId.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const A = '123456789012-abcdefgh1234ijkl.apps.googleusercontent.com'
const B = '987654321098-zyxwvuts9876qrst.apps.googleusercontent.com'
const store = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) }, m } }

gagal('bentuk-id-sah-diterima', () => { assert.equal(isGoogleClientId(A), true) })
gagal('bentuk-id-cacat-ditolak', () => {
  for (const v of ['', ' ', 'abc', `${A} `, ` ${A}`, A.replace('.apps.', '.app.'), 'x-abcdefgh1234.apps.googleusercontent.com', `12345678-<script>.apps.googleusercontent.com`, null, undefined, 42, {}]) {
    assert.equal(isGoogleClientId(v), false, `harus ditolak: ${String(v)}`)
  }
})
gagal('server-menang-atas-build-dan-cache', () => {
  assert.deepEqual(resolveGoogleClientId({ server: A, build: B, cache: B }), { id: A, source: 'server' })
})
gagal('tanpa-server-tombol-tetap-ada-dari-build', () => {
  assert.deepEqual(resolveGoogleClientId({ server: undefined, build: B, cache: A }), { id: B, source: 'build' })
})
gagal('tanpa-server-dan-build-tombol-dari-cache', () => {
  assert.deepEqual(resolveGoogleClientId({ server: null, build: '', cache: A }), { id: A, source: 'cache' })
})
gagal('sumber-cacat-dilewati-bukan-dipakai', () => {
  assert.deepEqual(resolveGoogleClientId({ server: 'rusak', build: B }), { id: B, source: 'build' })
  assert.equal(resolveGoogleClientId({ server: 'rusak', build: 'rusak', cache: 'rusak' }), null)
  assert.equal(resolveGoogleClientId({}), null)
})
gagal('cache-hanya-menyimpan-id-sah', () => {
  const s = store()
  assert.equal(rememberGoogleClientId(s, 'rusak'), false); assert.equal(s.m.size, 0, 'tidak ada efek samping')
  assert.equal(rememberGoogleClientId(s, A), true); assert.equal(s.m.get(GOOGLE_CLIENT_ID_CACHE_KEY), A)
  assert.equal(readCachedGoogleClientId(s), A)
})
gagal('cache-rusak-atau-diblokir-dibaca-kosong', () => {
  const s = store(); s.setItem(GOOGLE_CLIENT_ID_CACHE_KEY, 'diubah-tangan')
  assert.equal(readCachedGoogleClientId(s), null)
  const blokir = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceeded') } }
  assert.equal(readCachedGoogleClientId(blokir), null)
  assert.equal(rememberGoogleClientId(blokir, A), false)
  assert.equal(readCachedGoogleClientId(null), null)
})
gagal('login-merender-tombol-tanpa-menunggu-health', () => {
  const src = readFileSync('src/pages/landing/Login.tsx', 'utf8')
  assert.match(src, /resolveGoogleClientId\(\{ server: health\?\.googleClientId, build: import\.meta\.env\.VITE_GOOGLE_CLIENT_ID, cache: cachedGoogleId \}\)/)
  assert.match(src, /\{googleClientId \? \(/, 'slot tombol bergantung pada ID terpilih, bukan health')
  assert.doesNotMatch(src, /\{health\?\.googleClientId \? \(/, 'slot tidak boleh lagi menunggu health')
  assert.match(src, /rememberGoogleClientId\(window\.localStorage, h\?\.googleClientId\)/)
})

console.log('google-signin-always: OK')
