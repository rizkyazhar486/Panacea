// E4: logout harus MENCABUT token di server (bukan hanya menghapus cookie klien). Akun sintetis; bukan klaim kepatuhan hukum.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const running = await startIsolatedServer('logout-revoke', 'logout-owner@localhost.test')
const r = running
try {
  const login = async (email: string) => { const x = await r.call('POST', '/api/auth/dev-login', undefined, { email, role: 'pasien', name: email }); assert.equal(x.status, 200); return x.body.token as string }
  const a1 = await login('logout-a@localhost.test')
  const a2 = await login('logout-a@localhost.test') // sesi kedua akun yang sama (perangkat lain)
  const b = await login('logout-b@localhost.test')
  const me = (t?: string) => r.call('GET', '/api/auth/me', t)

  // kontrol positif: semua token berlaku sebelum logout
  for (const t of [a1, a2, b]) assert.equal((await me(t)).status, 200, 'token sah diterima sebelum logout')

  // logout memakai a1 saja
  assert.equal((await r.call('POST', '/api/auth/logout', a1)).status, 200)
  assert.equal((await me(a1)).status, 401, 'token yang di-logout ditolak (dicabut di server)')
  assert.equal((await r.call('GET', '/api/wallet', a1)).status, 401, 'rute terlindungi juga menolak token dicabut')
  // pasangan: hanya token itu yang dicabut — sesi lain akun sama dan akun lain tetap sah
  assert.equal((await me(a2)).status, 200, 'sesi perangkat lain akun yang sama tidak terdampak')
  assert.equal((await me(b)).status, 200, 'akun lain tidak terdampak')

  // logout tanpa token / token sampah: tidak crash, tidak mencabut apa pun
  assert.equal((await r.call('POST', '/api/auth/logout', undefined)).status, 200)
  assert.equal((await r.call('POST', '/api/auth/logout', 'bukan.jwt.valid')).status, 200)
  assert.equal((await me(a2)).status, 200)

  // pencabutan bertahan melewati restart proses
  await running.restart()
  assert.equal((await me(a1)).status, 401, 'token dicabut tetap ditolak setelah restart')
  assert.equal((await me(a2)).status, 200, 'token sah tetap diterima setelah restart')

  // hanya hash yang tersimpan, tidak pernah token mentah
  const { readFileSync } = await import('node:fs')
  const mentah = readFileSync(running.dataFile, 'utf8')
  assert.equal(mentah.includes(a1), false, 'token mentah tidak boleh tertulis di berkas data')
  assert.ok(Object.keys(JSON.parse(mentah).tokenDicabut ?? {}).length >= 1, 'hash token dicabut tersimpan')
  console.log('logoutRevokeHttp OK')
} finally { await running.stop() }
