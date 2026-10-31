import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../ops/render-live-smoke.sh', import.meta.url))
const repo = fileURLToPath(new URL('../..', import.meta.url))

// Hanya batas I/O yang diganti (curl, sleep): skrip produksi, pemilihan URL dan loop percobaan tetap dijalankan.
// curl palsu: permintaan /api/health mencetak SMOKE_HEALTH_W (kode + header x-render-routing), lainnya SMOKE_CAP_CODE.
function run(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'panacea-smoke-'))
  const capture = join(dir, 'calls')
  const shims = {
    curl: [
      'printf "curl %s\\n" "${@: -1}" >> "$SMOKE_CAPTURE"',
      'case "${@: -1}" in',
      '  */api/health) printf "%s" "${SMOKE_HEALTH_W:-200 }" ;;',
      '  *) printf "%s" "${SMOKE_CAP_CODE:-503}" ;;',
      'esac',
    ].join('\n'),
    sleep: 'printf "sleep %s\\n" "$*" >> "$SMOKE_CAPTURE"',
  }
  try {
    for (const [name, body] of Object.entries(shims)) writeFileSync(join(dir, name), `#!/bin/bash\n${body}\n`, { mode: 0o755 })
    const result = spawnSync('bash', [script], {
      cwd: repo, encoding: 'utf8', timeout: 60_000, // pagar anti-gantung untuk bash+shim, bukan batas waktu fungsional
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, SERVER_URL: '', SERVER_URL_SECRET: '', VITE_API_URL: '', VITE_API_URL_SECRET: '', SMOKE_CAPTURE: capture, ...extra },
    })
    return { ...result, calls: existsSync(capture) ? readFileSync(capture, 'utf8').trim().split('\n') : [] }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
const attempts = (r) => (r.stdout.match(/^Attempt \d+:/gm) ?? []).length

test('menolak_tanpa_endpoint_tanpa_jaringan', () => {
  const r = run()
  assert.equal(r.status, 1)
  assert.match(r.stderr, /VITE_API_URL\/SERVER_URL is not configured\./)
  assert.deepEqual(r.calls, [])
})

test('layanan_disuspend_gagal_segera_dengan_alasan_tanpa_mengulang', () => {
  const r = run({ SERVER_URL: 'https://smoke.invalid/', SMOKE_HEALTH_W: '503 suspend-by-user' })
  assert.equal(r.status, 1, 'a suspended service must still fail: the deployment cannot be verified')
  assert.match(r.stderr, /::error::Render service is suspended \(x-render-routing: suspend-by-user\)/)
  assert.deepEqual(r.calls, ['curl https://smoke.invalid/api/genomics/compute/capabilities', 'curl https://smoke.invalid/api/health'], 'exactly one attempt, no sleep')
  assert.equal(attempts(r), 0)
  assert.doesNotMatch(r.stdout + r.stderr, /may still be deploying/)
})

test('berpasangan_503_tanpa_header_suspend_tetap_mencoba_45_kali_lalu_gagal', () => {
  // Hanya header x-render-routing yang berbeda dari kasus suspend: perilaku menunggu-deploy yang lama dipertahankan.
  const r = run({ SERVER_URL: 'https://smoke.invalid/', SMOKE_HEALTH_W: '503 ' })
  assert.equal(r.status, 1)
  assert.equal(attempts(r), 45)
  assert.equal(r.calls.filter((c) => c === 'sleep 10').length, 45)
  assert.match(r.stderr, /Live Render genomics capability check did not converge\./)
  assert.doesNotMatch(r.stderr, /suspended/)
})

test('nilai_routing_lain_bukan_suspend_tidak_menghentikan_percobaan', () => {
  const r = run({ SERVER_URL: 'https://smoke.invalid/', SMOKE_HEALTH_W: '503 hibernate-wake' })
  assert.equal(r.status, 1)
  assert.equal(attempts(r), 45, 'only suspend* values stop the loop early')
})

test('kegagalan_transport_tanpa_spasi_tidak_dibaca_sebagai_routing', () => {
  // curl yang gagal total bisa mencetak "000" saja (tanpa spasi): itu bukan nilai header.
  const r = run({ SERVER_URL: 'https://smoke.invalid/', SMOKE_HEALTH_W: '000' })
  assert.equal(r.status, 1)
  assert.equal(attempts(r), 45)
  assert.match(r.stdout, /health HTTP 000;/)
})
