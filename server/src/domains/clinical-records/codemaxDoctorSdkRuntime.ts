/**
 * PanaceaMed Server — CodeMax Doctor AI-EMR Environment Ecosystem Runtime.
 *
 * Self-contained backend SDK runtime (zero frontend imports; obeys server-tidak-impor-frontend):
 * - Resolves multi-provider model environment (AI_CODEMAX_MODEL / AI_EMR_MODEL / OpenRouter / Anthropic)
 *   without ever exposing secret API keys.
 * - Validates and bounds doctor encounter requests + clinic ambient environmental telemetry.
 * - Enforces Constitutional Law IV (clinician STR sign-off required; AI never auto-signs prescriptions).
 * - Computes deterministic environmental clinical modifiers + vital red-flag screening + SHA-256 FHIR
 *   preview digest + strictly PHI-free audit envelopes, with seamless deterministic fallback when offline.
 */

import { createHash } from 'node:crypto'

export const SERVER_CODEMAX_SDK_VERSION = 'codemax-doctor-emr-sdk-v1' as const
export const MAX_CODEMAX_NOTE_CHARS = 12_000

export interface ServerCodeMaxEnvironmentStatus {
  readonly sdkVersion: typeof SERVER_CODEMAX_SDK_VERSION
  readonly primaryModel: string
  readonly aiProviderConfigured: boolean
  readonly providerBackend: 'openrouter' | 'anthropic' | 'deterministic_offline_only'
  readonly satusehatConfigured: boolean
  readonly icd11Configured: boolean
  readonly deterministicFallbackReady: true
  readonly zeroPhiTelemetry: true
}

export interface ServerCodeMaxAmbientInput {
  readonly ambientTempC: number
  readonly relativeHumidityPct: number
  readonly pm25UgM3: number
  readonly uvIndex: number
  readonly altitudeM: number
}

export interface ServerCodeMaxDoctorRequest {
  readonly encounterId: string
  readonly careSetting: 'RAWAT_JALAN' | 'IGD' | 'IGD_PONEK' | 'RAWAT_INAP' | 'ICU_NICU_PICU_HCU'
  readonly rawClinicalNote: string
  readonly ambientExposure: ServerCodeMaxAmbientInput
  readonly vitals?: {
    readonly heartRateBpm?: number
    readonly systolicMmHg?: number
    readonly spo2Pct?: number
    readonly respRatePerMin?: number
    readonly tempC?: number
  }
  readonly useRemoteModel?: boolean
}

export interface ServerCodeMaxValidationResult {
  readonly ok: boolean
  readonly value?: ServerCodeMaxDoctorRequest
  readonly error?: string
}

export interface ServerCodeMaxEncounterResult {
  readonly sdkVersion: typeof SERVER_CODEMAX_SDK_VERSION
  readonly encounterId: string
  readonly modelRouteUsed: string
  readonly fallbackUsed: boolean
  readonly clinicianStrVerified: boolean
  readonly strSignOffRequired: true
  readonly autoPrescriptionBlocked: true
  readonly environmentalModifiers: readonly { readonly code: string; readonly severity: 'INFO' | 'MODERATE' | 'HIGH'; readonly detail: string }[]
  readonly vitalRedFlags: readonly { readonly code: string; readonly metric: string; readonly severity: 'URGENT' | 'CRITICAL' }[]
  readonly fhirPreviewDigestSha256: string
  readonly remoteSynthesisHint?: string
  readonly auditMeta: {
    readonly sdkVersion: typeof SERVER_CODEMAX_SDK_VERSION
    readonly encounterId: string
    readonly clinicianId: string
    readonly containsRawPhi: false
  }
}

const VALID_SETTINGS = new Set<ServerCodeMaxDoctorRequest['careSetting']>([
  'RAWAT_JALAN',
  'IGD',
  'IGD_PONEK',
  'RAWAT_INAP',
  'ICU_NICU_PICU_HCU',
])

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  return Math.max(min, Math.min(max, v))
}

export function resolveCodeMaxEnvironmentStatus(params: {
  readonly env?: Record<string, string | undefined>
  readonly satusehatReady: boolean
  readonly icd11Ready: boolean
}): ServerCodeMaxEnvironmentStatus {
  const env = params.env ?? process.env
  const hasOpenRouter = Boolean(env.OPENROUTER_API_KEY?.trim())
  const hasAnthropic = Boolean(env.ANTHROPIC_API_KEY?.trim())
  const primaryModel =
    env.AI_CODEMAX_MODEL?.trim() ||
    env.AI_EMR_MODEL?.trim() ||
    (hasOpenRouter ? 'z-ai/glm-5.2' : hasAnthropic ? 'claude-sonnet-4-6' : 'deterministic/codemax-clinical-kernel-v1')

  return {
    sdkVersion: SERVER_CODEMAX_SDK_VERSION,
    primaryModel,
    aiProviderConfigured: hasOpenRouter || hasAnthropic,
    providerBackend: hasOpenRouter ? 'openrouter' : hasAnthropic ? 'anthropic' : 'deterministic_offline_only',
    satusehatConfigured: params.satusehatReady,
    icd11Configured: params.icd11Ready,
    deterministicFallbackReady: true,
    zeroPhiTelemetry: true,
  }
}

export function validateCodeMaxDoctorRequest(body: unknown): ServerCodeMaxValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'invalid_json_body' }
  }
  const b = body as Record<string, unknown>
  const encounterId = typeof b.encounterId === 'string' ? b.encounterId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : ''
  if (!encounterId) return { ok: false, error: 'missing_encounter_id' }

  const rawNote = typeof b.rawClinicalNote === 'string' ? b.rawClinicalNote.trim() : ''
  if (!rawNote) return { ok: false, error: 'missing_clinical_note' }
  if (rawNote.length > MAX_CODEMAX_NOTE_CHARS) return { ok: false, error: 'clinical_note_too_long' }

  const settingRaw = typeof b.careSetting === 'string' ? b.careSetting : 'RAWAT_JALAN'
  const careSetting: ServerCodeMaxDoctorRequest['careSetting'] = VALID_SETTINGS.has(
    settingRaw as ServerCodeMaxDoctorRequest['careSetting'],
  )
    ? (settingRaw as ServerCodeMaxDoctorRequest['careSetting'])
    : 'RAWAT_JALAN'

  const amb = (b.ambientExposure && typeof b.ambientExposure === 'object' ? b.ambientExposure : {}) as Record<string, unknown>
  const ambientExposure: ServerCodeMaxAmbientInput = {
    ambientTempC: clampNum(amb.ambientTempC, 28, -20, 55),
    relativeHumidityPct: clampNum(amb.relativeHumidityPct, 65, 5, 100),
    pm25UgM3: clampNum(amb.pm25UgM3, 18, 0, 500),
    uvIndex: clampNum(amb.uvIndex, 5, 0, 15),
    altitudeM: clampNum(amb.altitudeM, 50, 0, 6000),
  }

  const vRaw = (b.vitals && typeof b.vitals === 'object' ? b.vitals : undefined) as Record<string, unknown> | undefined
  const vitals = vRaw
    ? {
        ...(typeof vRaw.heartRateBpm === 'number' && Number.isFinite(vRaw.heartRateBpm) ? { heartRateBpm: vRaw.heartRateBpm } : {}),
        ...(typeof vRaw.systolicMmHg === 'number' && Number.isFinite(vRaw.systolicMmHg) ? { systolicMmHg: vRaw.systolicMmHg } : {}),
        ...(typeof vRaw.spo2Pct === 'number' && Number.isFinite(vRaw.spo2Pct) ? { spo2Pct: vRaw.spo2Pct } : {}),
        ...(typeof vRaw.respRatePerMin === 'number' && Number.isFinite(vRaw.respRatePerMin) ? { respRatePerMin: vRaw.respRatePerMin } : {}),
        ...(typeof vRaw.tempC === 'number' && Number.isFinite(vRaw.tempC) ? { tempC: vRaw.tempC } : {}),
      }
    : undefined

  return {
    ok: true,
    value: {
      encounterId,
      careSetting,
      rawClinicalNote: rawNote,
      ambientExposure,
      ...(vitals ? { vitals } : {}),
      useRemoteModel: b.useRemoteModel !== false,
    },
  }
}

export async function evaluateServerCodeMaxEncounter(params: {
  readonly request: ServerCodeMaxDoctorRequest
  readonly clinicianId: string
  readonly clinicianStrVerified: boolean
  readonly envStatus: ServerCodeMaxEnvironmentStatus
  readonly invokeModel?: (system: string, prompt: string, maxTokens: number, json: boolean) => Promise<string>
}): Promise<ServerCodeMaxEncounterResult> {
  const { request, clinicianId, clinicianStrVerified, envStatus, invokeModel } = params
  const mods: Array<{ readonly code: string; readonly severity: 'INFO' | 'MODERATE' | 'HIGH'; readonly detail: string }> = []

  const t = request.ambientExposure.ambientTempC
  const rh = request.ambientExposure.relativeHumidityPct
  const wetBulb =
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035

  if (wetBulb >= 31) {
    mods.push({
      code: 'CRITICAL_HEAT_DEHYDRATION_RISK',
      severity: 'HIGH',
      detail: `Clinic ambient wet-bulb ${wetBulb.toFixed(1)}°C; flag heat exhaustion/dehydration risk.`,
    })
  }
  if (request.ambientExposure.pm25UgM3 > 55.4) {
    mods.push({
      code: 'HAZARDOUS_PM25_AIRWAY_LOAD',
      severity: request.ambientExposure.pm25UgM3 > 150 ? 'HIGH' : 'MODERATE',
      detail: `Ambient PM2.5 ${request.ambientExposure.pm25UgM3} ug/m3; screen airway hyperreactivity.`,
    })
  }
  if (request.ambientExposure.altitudeM >= 2200) {
    mods.push({
      code: 'HYPOBARIC_ALTITUDE_HYPOXIA',
      severity: request.ambientExposure.altitudeM >= 3500 ? 'HIGH' : 'MODERATE',
      detail: `High-altitude clinic (${request.ambientExposure.altitudeM}m); adjust expected baseline SpO2.`,
    })
  }

  const vitalRedFlags: Array<{ readonly code: string; readonly metric: string; readonly severity: 'URGENT' | 'CRITICAL' }> = []
  if (request.vitals?.spo2Pct !== undefined && request.vitals.spo2Pct < 90) {
    vitalRedFlags.push({ code: 'HYPOXEMIA_CRITICAL', metric: 'SpO2', severity: 'CRITICAL' })
  }
  if (request.vitals?.systolicMmHg !== undefined && request.vitals.systolicMmHg < 90) {
    vitalRedFlags.push({ code: 'HYPOTENSION_SHOCK_SCREEN', metric: 'SBP', severity: 'CRITICAL' })
  }
  if (request.vitals?.heartRateBpm !== undefined && (request.vitals.heartRateBpm > 130 || request.vitals.heartRateBpm < 45)) {
    vitalRedFlags.push({ code: 'SEVERE_DYSRHYTHMIA_RATE', metric: 'HR', severity: 'CRITICAL' })
  }

  let modelRouteUsed = 'deterministic/codemax-clinical-kernel-v1'
  let fallbackUsed = true
  let remoteSynthesisHint: string | undefined

  if (request.useRemoteModel && envStatus.aiProviderConfigured && invokeModel) {
    try {
      const synthesis = await invokeModel(
        'You are PanaceaMed CodeMax Doctor AI-EMR assistant. Draft concise clinician-in-loop structured clinical considerations without issuing prescriptions or final diagnoses.',
        `Setting: ${request.careSetting}. Env modifiers: ${mods.map((m) => m.code).join(', ') || 'none'}. Encounter summary: ${request.rawClinicalNote.slice(0, 1500)}`,
        450,
        false,
      )
      if (synthesis && synthesis.trim()) {
        modelRouteUsed = envStatus.primaryModel
        fallbackUsed = false
        remoteSynthesisHint = synthesis.trim().slice(0, 1200)
      }
    } catch {
      fallbackUsed = true
    }
  }

  const digestPayload = JSON.stringify({
    sdk: SERVER_CODEMAX_SDK_VERSION,
    encounterId: request.encounterId,
    careSetting: request.careSetting,
    modCodes: mods.map((m) => m.code),
    redFlagCodes: vitalRedFlags.map((f) => f.code),
  })
  const fhirPreviewDigestSha256 = createHash('sha256').update(digestPayload).digest('hex')

  return {
    sdkVersion: SERVER_CODEMAX_SDK_VERSION,
    encounterId: request.encounterId,
    modelRouteUsed,
    fallbackUsed,
    clinicianStrVerified,
    strSignOffRequired: true,
    autoPrescriptionBlocked: true,
    environmentalModifiers: mods,
    vitalRedFlags,
    fhirPreviewDigestSha256,
    ...(remoteSynthesisHint ? { remoteSynthesisHint } : {}),
    auditMeta: {
      sdkVersion: SERVER_CODEMAX_SDK_VERSION,
      encounterId: request.encounterId,
      clinicianId,
      containsRawPhi: false,
    },
  }
}
