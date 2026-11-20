#!/usr/bin/env node
import { fileURLToPath } from 'node:url'

export function evaluateMonitorProbe(input) {
  const findings = []
  const routing = String(input.healthz?.routing || input.apiHealth?.routing || '')
  if (routing.startsWith('suspend')) {
    findings.push({ severity: 'critical', code: 'render_suspended', detail: `x-render-routing=${routing}` })
  }
  if (!input.healthz?.ok || input.healthz.status !== 200) {
    findings.push({ severity: 'critical', code: 'healthz_failed', detail: `status=${input.healthz?.status ?? 0}` })
  }
  if (!input.apiHealth?.ok || input.apiHealth.status !== 200) {
    findings.push({ severity: 'critical', code: 'api_health_failed', detail: `status=${input.apiHealth?.status ?? 0}` })
  } else {
    const h = input.apiHealth.json || {}
    if (h.penyimpananSehat === false) {
      findings.push({ severity: 'critical', code: 'storage_unhealthy', detail: `storage=${h.penyimpanan || 'unknown'}` })
    }
    if (Number(h.simpan?.gagalBeruntun ?? 0) >= 3) {
      findings.push({ severity: 'critical', code: 'consecutive_save_failures', detail: `failures=${h.simpan.gagalBeruntun}` })
    }
    if (Number(input.apiHealth.ms ?? 0) >= 5000) {
      findings.push({ severity: 'critical', code: 'api_latency_critical', detail: `ms=${Math.round(input.apiHealth.ms)}` })
    } else if (Number(input.apiHealth.ms ?? 0) >= 1500) {
      findings.push({ severity: 'warn', code: 'api_latency_warn', detail: `ms=${Math.round(input.apiHealth.ms)}` })
    }
  }

  if (input.apiStatus) {
    if (input.apiStatus.status === 404) {
      findings.push({ severity: 'warn', code: 'status_endpoint_pending_deploy', detail: 'HTTP 404' })
    } else if (!input.apiStatus.ok) {
      findings.push({ severity: 'critical', code: 'api_status_failed', detail: `status=${input.apiStatus.status}` })
    } else if (input.apiStatus.json?.status === 'degraded') {
      findings.push({ severity: 'critical', code: 'service_degraded', detail: JSON.stringify(input.apiStatus.json.alerts || []) })
    }
  }

  if (input.frontend) {
    if (input.frontend.status === 403) {
      findings.push({ severity: 'warn', code: 'frontend_waf_403_from_runner', detail: 'HTTP 403 from runner IP' })
    } else if (!input.frontend.ok) {
      findings.push({ severity: 'critical', code: 'frontend_unreachable', detail: `status=${input.frontend.status}` })
    }
  }

  const hasCritical = findings.some((f) => f.severity === 'critical')
  const hasWarn = findings.some((f) => f.severity === 'warn')
  const verdict = hasCritical ? 'critical' : hasWarn ? 'degraded' : 'operational'
  return { verdict, findings }
}

async function probeUrl(url, expectJson = false) {
  const t0 = performance.now()
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'cache-control': 'no-cache' } })
    const ms = Number((performance.now() - t0).toFixed(1))
    const routing = r.headers.get('x-render-routing') || ''
    const json = expectJson && r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : null
    if (!json) await r.arrayBuffer().catch(() => null)
    return { ok: r.ok, status: r.status, ms, routing, json }
  } catch (err) {
    return { ok: false, status: 0, ms: Number((performance.now() - t0).toFixed(1)), routing: '', json: null, error: err instanceof Error ? err.message : 'fetch_failed' }
  }
}

export function buildNonPhiAlertPayload(report, backendUrl, frontendUrl) {
  const summary = report.findings.map((f) => `${f.severity}:${f.code}(${f.detail})`).join('; ') || 'all checks ok'
  const text = `[Panaceamed Monitor] verdict=${report.verdict} backend=${backendUrl} frontend=${frontendUrl} findings=${summary}`
  return { text, content: text, verdict: report.verdict, findings: report.findings, checkedAt: report.checkedAt }
}

async function run() {
  const backendUrl = (process.env.BACKEND_URL || process.env.VITE_API_URL || 'https://panaceamed-backend.onrender.com').replace(/\/+$/, '')
  const frontendUrl = (process.env.FRONTEND_URL || 'https://panaceamed.id').replace(/\/+$/, '')
  const [healthz, apiHealth, apiStatus, frontend] = await Promise.all([
    probeUrl(`${backendUrl}/healthz`),
    probeUrl(`${backendUrl}/api/health`, true),
    probeUrl(`${backendUrl}/api/status`, true),
    probeUrl(`${frontendUrl}/`),
  ])
  const evalRes = evaluateMonitorProbe({ healthz, apiHealth, apiStatus, frontend })
  const report = {
    verdict: evalRes.verdict,
    findings: evalRes.findings,
    measurements: {
      healthzStatus: healthz.status, healthzMs: healthz.ms,
      apiHealthStatus: apiHealth.status, apiHealthMs: apiHealth.ms,
      storageMode: apiHealth.json?.penyimpanan ?? null,
      apiStatusCode: apiStatus.status, apiStatusMs: apiStatus.ms,
      frontendStatus: frontend.status, frontendMs: frontend.ms,
    },
    checkedAt: new Date().toISOString(),
  }
  console.log(JSON.stringify(report, null, 2))

  const webhook = process.env.ALERT_WEBHOOK_URL?.trim()
  if (webhook && evalRes.verdict !== 'operational') {
    const payload = buildNonPhiAlertPayload(report, backendUrl, frontendUrl)
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {})
  }
  if (evalRes.verdict === 'critical') process.exit(1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch((err) => {
    console.error(`check-production-status FAILED: ${err instanceof Error ? err.message : 'unknown'}`)
    process.exit(1)
  })
}
