import type { Ringkasan } from './observabilitas.js'

export interface ServiceAlert {
  code: string
  severity: 'warn' | 'critical'
  detail: string
}

export interface ServiceStatusReport {
  status: 'operational' | 'degraded' | 'maintenance'
  errorRate5xxPct: number
  alerts: ServiceAlert[]
}

export const ALERT_THRESHOLDS = {
  errorRate5xxPct: 1,
  p95LatencyMs: 1500,
  consecutiveSaveFailures: 3,
} as const

/** Evaluates non-PHI runtime health into explicit status and actionable alerts. */
export function evaluateServiceAlerts(input: {
  storageHealthy: boolean
  consecutiveSaveFailures: number
  http: Ringkasan
  readOnlyMode?: boolean
  signupKillSwitch?: boolean
}): ServiceStatusReport {
  const alerts: ServiceAlert[] = []
  const errorRate5xxPct = input.http.total > 0
    ? Number(((input.http.s5xx / input.http.total) * 100).toFixed(2))
    : 0

  if (!input.storageHealthy) {
    alerts.push({ code: 'storage_unhealthy', severity: 'critical', detail: 'Storage adapter reported unhealthy persistence state.' })
  }
  if (input.consecutiveSaveFailures >= ALERT_THRESHOLDS.consecutiveSaveFailures) {
    alerts.push({ code: 'save_failures_consecutive', severity: 'critical', detail: `Consecutive save failures: ${input.consecutiveSaveFailures}.` })
  }
  if (input.http.total >= 20 && errorRate5xxPct >= ALERT_THRESHOLDS.errorRate5xxPct) {
    alerts.push({ code: 'high_5xx_rate', severity: 'critical', detail: `5xx rate ${errorRate5xxPct}% >= ${ALERT_THRESHOLDS.errorRate5xxPct}%.` })
  }
  if (input.http.p95Ms !== null && input.http.p95Ms >= ALERT_THRESHOLDS.p95LatencyMs) {
    alerts.push({ code: 'high_p95_latency', severity: 'warn', detail: `p95 latency ${input.http.p95Ms}ms >= ${ALERT_THRESHOLDS.p95LatencyMs}ms.` })
  }
  if (input.readOnlyMode) {
    alerts.push({ code: 'read_only_mode', severity: 'warn', detail: 'Service is in read-only kill-switch mode.' })
  }
  if (input.signupKillSwitch) {
    alerts.push({ code: 'signup_paused', severity: 'warn', detail: 'New account registrations are paused via kill switch.' })
  }

  let status: ServiceStatusReport['status'] = 'operational'
  if (input.readOnlyMode) status = 'maintenance'
  else if (alerts.some((a) => a.severity === 'critical' || a.code === 'high_p95_latency')) status = 'degraded'

  return { status, errorRate5xxPct, alerts }
}
