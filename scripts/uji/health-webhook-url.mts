// Tautan sinkron Apple Watch harus selalu menuju backend: asal absolut https, token polos, satu pembangun untuk
// semua halaman; selain itu tidak ada tautan (gagal tertutup), bukan tautan yang diam-diam membuang data.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { healthWebhookUrl } from '../../src/domains/devices/engine/healthWebhookUrl.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const T = 'aB3_dE5-fG7hJ9kL1mN2'

gagal('tautan-absolut-ke-backend', () => {
  assert.equal(healthWebhookUrl('https://panaceamed-backend.onrender.com', T), `https://panaceamed-backend.onrender.com/api/health-webhook/${T}`)
})
gagal('garis-miring-akhir-dan-path-dasar', () => {
  assert.equal(healthWebhookUrl('https://api.example.org/', T), `https://api.example.org/api/health-webhook/${T}`)
  assert.equal(healthWebhookUrl('https://example.org/v2//', T), `https://example.org/v2/api/health-webhook/${T}`)
})
gagal('localhost-http-boleh-untuk-dev', () => {
  assert.equal(healthWebhookUrl('http://localhost:8787', T), `http://localhost:8787/api/health-webhook/${T}`)
})
gagal('asal-kosong-atau-relatif-ditolak', () => {
  for (const o of ['', '/', '/api', 'panaceamed.id', undefined, null, 42]) assert.equal(healthWebhookUrl(o, T), null, `asal ${String(o)}`)
})
gagal('http-publik-ditolak', () => {
  assert.equal(healthWebhookUrl('http://panaceamed-backend.onrender.com', T), null, 'data kesehatan tidak boleh lewat http')
})
gagal('token-cacat-ditolak', () => {
  for (const t of ['', 'short', `${T}/../x`, `${T}?a=1`, 'https://x.y/api/health-webhook/abc', ' '.repeat(20), 'a'.repeat(257), null, 7]) {
    assert.equal(healthWebhookUrl('https://api.example.org', t), null, `token ${String(t)}`)
  }
})
gagal('batas-panjang-token', () => {
  assert.notEqual(healthWebhookUrl('https://api.example.org', 'a'.repeat(16)), null)
  assert.equal(healthWebhookUrl('https://api.example.org', 'a'.repeat(15)), null)
  assert.notEqual(healthWebhookUrl('https://api.example.org', 'a'.repeat(256)), null)
})
gagal('halaman-memakai-satu-pembangun', () => {
  for (const f of ['src/pages/bodyhub/HealthSyncTutorial.tsx', 'src/pages/bodyhub/HealthProfile.tsx']) {
    const src = readFileSync(f, 'utf8')
    assert.match(src, /healthWebhookUrl\(apiBaseUrl, token\)/, `${f} harus memakai healthWebhookUrl`)
    assert.doesNotMatch(src, /`[^`]*\/api\/health-webhook\/\$\{/, `${f} merakit tautan sendiri`)
    assert.doesNotMatch(src, /VITE_API_URL[^\n]*health-webhook/, `${f} memakai VITE_API_URL yang kosong di produksi`)
  }
})

console.log('health-webhook-url: OK')
