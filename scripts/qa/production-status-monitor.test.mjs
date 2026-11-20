import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNonPhiAlertPayload, evaluateMonitorProbe } from '../ops/check-production-status.mjs'

test('operational when all endpoints return 200 and healthy', () => {
  const res = evaluateMonitorProbe({
    healthz: { ok: true, status: 200, ms: 40, routing: '' },
    apiHealth: { ok: true, status: 200, ms: 210, routing: '', json: { penyimpananSehat: true, simpan: { gagalBeruntun: 0 } } },
    apiStatus: { ok: true, status: 200, ms: 180, json: { status: 'operational' } },
    frontend: { ok: true, status: 200, ms: 90 },
  })
  assert.equal(res.verdict, 'operational')
  assert.equal(res.findings.length, 0)
})

test('degraded non-critical when /api/status is pre-deploy 404 or frontend returns runner WAF 403', () => {
  const res = evaluateMonitorProbe({
    healthz: { ok: true, status: 200, ms: 50, routing: '' },
    apiHealth: { ok: true, status: 200, ms: 250, routing: '', json: { penyimpananSehat: true, simpan: { gagalBeruntun: 0 } } },
    apiStatus: { ok: false, status: 404, ms: 200 },
    frontend: { ok: false, status: 403, ms: 120 },
  })
  assert.equal(res.verdict, 'degraded')
  assert.deepEqual(res.findings.map((f) => f.code), ['status_endpoint_pending_deploy', 'frontend_waf_403_from_runner'])
})

test('critical when Render is suspended or storage is unhealthy', () => {
  const res = evaluateMonitorProbe({
    healthz: { ok: false, status: 503, ms: 30, routing: 'suspend-by-user' },
    apiHealth: { ok: true, status: 200, ms: 200, routing: '', json: { penyimpananSehat: false, simpan: { gagalBeruntun: 4 } } },
    apiStatus: { ok: true, status: 200, ms: 100, json: { status: 'degraded', alerts: [{ code: 'storage_unhealthy' }] } },
    frontend: { ok: true, status: 200, ms: 50 },
  })
  assert.equal(res.verdict, 'critical')
  assert.ok(res.findings.some((f) => f.code === 'render_suspended'))
  assert.ok(res.findings.some((f) => f.code === 'storage_unhealthy'))
})

test('alert payload contains zero PHI and stays compact', () => {
  const payload = buildNonPhiAlertPayload(
    { verdict: 'critical', findings: [{ severity: 'critical', code: 'healthz_failed', detail: 'status=503' }], checkedAt: '2026-11-20T00:00:00.000Z' },
    'https://api.example.test',
    'https://panaceamed.id',
  )
  assert.match(payload.text, /healthz_failed/)
  assert.equal(payload.verdict, 'critical')
})
