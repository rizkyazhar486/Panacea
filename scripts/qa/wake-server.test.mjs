import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../ops/wake-server.sh', import.meta.url))

// Hanya batas I/O diganti: skrip produksi, pemilihan URL, dan loop tetap dijalankan.
function run(mode = 'once', extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'panacea-wake-'))
  const capture = join(dir, 'calls')
  const shims = {
    curl: 'printf "%s\\n" "$*" >> "$WAKE_CAPTURE"\nprintf "%s" "${WAKE_HTTP:-200}"\nexit "${WAKE_EXIT:-0}"\n',
    sleep: 'printf "sleep %s\\n" "$*" >> "$WAKE_CAPTURE"\n',
    date: 'if [ "$2" = "+%H" ]; then printf "%s\\n" "${WAKE_HOUR:-17}"; elif [ -f "$WAKE_CAPTURE.tick" ]; then echo 21400; elif [ -f "$WAKE_CAPTURE.clock" ]; then touch "$WAKE_CAPTURE.tick"; printf "%s\\n" "${WAKE_NOW:-1000}"; else touch "$WAKE_CAPTURE.clock"; echo 1000; fi\n',
  }
  try {
    for (const [name, body] of Object.entries(shims)) {
      writeFileSync(join(dir, name), `#!/bin/bash\n${body}`, { mode: 0o755 })
    }
    const result = spawnSync('bash', [script, mode], {
      encoding: 'utf8', timeout: 20_000, // hanya pagar anti-gantung untuk bash+shim; 2 dtk gagal di mesin dengan load average ≈10 (status null)
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, SERVER_URL: '', SERVER_URL_SECRET: '', VITE_API_URL: '', VITE_API_URL_SECRET: '', WAKE_CAPTURE: capture, ...extra },
    })
    return { ...result, calls: existsSync(capture) ? readFileSync(capture, 'utf8').trim().split('\n') : [] }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

test('missing_endpoint_exits_without_network_or_sleep', () => {
  const r = run('keepalive')
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(r.calls, [])
})

test('endpoint_priority_uses_first_nonempty_setting_and_one_health_request', () => {
  const settings = ['SERVER_URL', 'SERVER_URL_SECRET', 'VITE_API_URL', 'VITE_API_URL_SECRET']
  for (let first = 0; first < settings.length; first++) {
    const env = Object.fromEntries(settings.slice(first).map((key, i) => [key, `https://wake-${first + i}.invalid/`]))
    const r = run('once', env)
    assert.equal(r.status, 0, r.stderr)
    assert.deepEqual(r.calls, [`-s -o /dev/null -w %{http_code} %header{x-render-routing} --max-time 90 https://wake-${first}.invalid/api/health`])
    assert.equal(r.stdout.trim(), 'HTTP 200')
  }
})

test('cold_start_non200_warns_without_failing_best_effort_wake', () => {
  const r = run('once', { SERVER_URL: 'https://wake.invalid', WAKE_HTTP: '503' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^HTTP 503\n::warning::/)
  assert.equal(r.calls.length, 1)
})

test('transport_failure_reports_single_000_without_endpoint_or_response_body', () => {
  const r = run('once', { SERVER_URL_SECRET: 'https://private-wake.invalid', WAKE_HTTP: '000', WAKE_EXIT: '28' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^HTTP 000\n::warning::/)
  assert.doesNotMatch(r.stdout + r.stderr, /000000|private-wake|https:/)
})

test('keepalive_stops_after_quiet_hours_and_retains_nine_minute_interval', () => {
  const r = run('keepalive', { SERVER_URL: 'https://wake.invalid', WAKE_HOUR: '17' })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.calls.length, 2)
  assert.equal(r.calls[1], 'sleep 540')
})

test('keepalive_stops_at_340_minutes_before_sleeping_again', () => {
  const r = run('keepalive', { SERVER_URL: 'https://wake.invalid', WAKE_NOW: '21400', WAKE_HOUR: '21' })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.calls.length, 1)
})

test('keepalive_continues_only_inside_active_utc_hours', () => {
  for (const hour of ['00', '09', '16', '17', '20', '21', '23']) {
    const r = run('keepalive', { SERVER_URL: 'https://wake.invalid', WAKE_HOUR: hour })
    assert.equal(r.status, 0, `${hour}: ${r.stderr}`)
    assert.equal(r.calls.filter(x => x.startsWith('-s ')).length, ['17', '20'].includes(hour) ? 1 : 2, hour)
    assert.equal(r.calls.filter(x => x.startsWith('sleep ')).length, 1, hour)
  }
})

test('unknown_mode_is_rejected_before_network', () => {
  const r = run('forever', { SERVER_URL: 'https://wake.invalid' })
  assert.equal(r.status, 2, r.stderr)
  assert.deepEqual(r.calls, [])
})

test('suspended_render_service_names_the_cause_and_stops_keepalive_without_sleeping', () => {
  const r = run('keepalive', { SERVER_URL: 'https://wake.invalid', WAKE_HTTP: '503 suspend-by-user', WAKE_HOUR: '21' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^HTTP 503\n::warning::Render: layanan DISUSPEND oleh pemiliknya \(x-render-routing: suspend-by-user\)/)
  assert.match(r.stdout, /resume/)
  assert.deepEqual(r.calls.filter((x) => x.startsWith('sleep')), [], 'no sleep after a suspended answer')
  assert.equal(r.calls.filter((x) => x.startsWith('-s ')).length, 1)
  assert.doesNotMatch(r.stdout, /wake\.invalid/)
})

test('other_routing_values_keep_the_existing_best_effort_loop', () => {
  // pasangan: hanya nilai header yang berbeda; 503 biasa (mis. cold start) tetap mencoba lagi seperti sebelumnya
  for (const http of ['503 dynamic', '503', '200 ']) {
    const r = run('keepalive', { SERVER_URL: 'https://wake.invalid', WAKE_HTTP: http, WAKE_HOUR: '21' })
    assert.equal(r.status, 0, `${http}: ${r.stderr}`)
    assert.equal(r.calls.filter((x) => x.startsWith('-s ')).length, 2, http)
    assert.ok(r.calls.includes('sleep 540'), http)
    assert.doesNotMatch(r.stdout, /DISUSPEND/, http)
    assert.match(r.stdout, new RegExp(`^HTTP ${http.split(' ')[0]}\n`), http)
  }
})

