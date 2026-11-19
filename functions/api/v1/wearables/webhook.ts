import {
  jsonResponse,
  preflightResponse,
  runNeonParameterizedSql,
  sanitizeProfileKey,
  type EdgeEnv,
} from '../_edgeGuard'

type WearableVendorSource = 'whoop' | 'garmin' | 'oura' | 'apple_watch' | 'amazfit'

const VENDOR_MAP: Readonly<Record<string, WearableVendorSource>> = {
  whoop: 'whoop',
  garmin: 'garmin',
  oura: 'oura',
  apple_health: 'apple_watch',
  apple_watch: 'apple_watch',
  amazfit: 'amazfit',
}

interface NormalizedWearableMetric {
  readonly metricCode: string
  readonly loincCode: string
  readonly value: number
  readonly unitUcum: string
}

function normalizeVendorPayload(raw: Record<string, unknown>): NormalizedWearableMetric[] {
  const out: NormalizedWearableMetric[] = []
  const pushIfFinite = (key: string, metricCode: string, loincCode: string, unitUcum: string, min: number, max: number) => {
    const val = raw[key]
    if (typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max) {
      out.push({ metricCode, loincCode, value: val, unitUcum })
    }
  }
  pushIfFinite('restingHrBpm', 'resting_hr', '8867-4', '/min', 25, 220)
  pushIfFinite('restingHr', 'resting_hr', '8867-4', '/min', 25, 220)
  pushIfFinite('hrvMs', 'hrv_rmssd', '80404-7', 'ms', 1, 400)
  pushIfFinite('vo2max', 'vo2max', '60842-2', 'mL/kg/min', 5, 100)
  pushIfFinite('sleepHours', 'sleep_duration', '93832-4', 'h', 0.1, 24)
  pushIfFinite('spo2Pct', 'spo2', '2708-6', '%', 40, 100)
  pushIfFinite('steps', 'daily_steps', '55423-8', '{steps}', 0, 150000)
  return out
}

export async function onRequestOptions(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  return preflightResponse(context.request, context.env)
}

export async function onRequestPost(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed wearable webhook JSON.' })
  }

  const vendorRaw = String(body.source ?? body.vendor ?? '').toLowerCase().trim()
  const vendor = VENDOR_MAP[vendorRaw]
  if (!vendor) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Unsupported wearable vendor source.' })
  }

  const profileKey = sanitizeProfileKey(body.profileKey ?? context.request.headers.get('X-Profile-Key'))
  const capturedAt = typeof body.capturedAtIso === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(body.capturedAtIso)
    ? body.capturedAtIso
    : null
  if (!capturedAt) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Explicit ISO capturedAtIso timestamp is required.' })
  }

  const metrics = normalizeVendorPayload(body)
  if (metrics.length === 0) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'No valid finite physiological readings in payload.' })
  }

  const dbUrl = context.env?.DATABASE_URL?.trim()
  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      mode: 'local_first_sovereign',
      vendor,
      truthClass: 'measured',
      normalizedCount: metrics.length,
      metrics,
    })
  }

  for (const m of metrics) {
    const res = await runNeonParameterizedSql(
      dbUrl,
      profileKey,
      `INSERT INTO panacea_wearable_telemetry (profile_key, source_device, metric_code, loinc_code, value_numeric, unit_ucum, truth_class, captured_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'measured', $7::timestamptz)`,
      [profileKey, vendor, m.metricCode, m.loincCode, m.value, m.unitUcum, capturedAt],
    )
    if (!res.ok) {
      return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error })
    }
  }

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    mode: 'neon_rls',
    vendor,
    truthClass: 'measured',
    ingestedCount: metrics.length,
  })
}
