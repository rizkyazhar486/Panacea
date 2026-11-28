/**
 * PanaceaMed CodeMax Doctor AI-EMR SDK — Client & Orchestration Kernel.
 *
 * Strengthens the doctor AI-EMR environment ecosystem with:
 * - Deterministic 6-stage clinical pipeline (STR gate -> Environment Physiology Coupler ->
 *   Vitals Red-Flag Guardrail -> Clinical-to-Claim Coding Shield -> Closed-Loop Care Emitter ->
 *   SATUSEHAT FHIR R4 Bundle Packager)
 * - Automatic Circuit Breaker & Offline Deterministic Failover (zero dead screens on 2G/rural clinics)
 * - Composable Specialty Plugin API (`sdk.use(plugin)`)
 * - Strictly PHI-free audit envelopes & SHA-256 FHIR bundle integrity digests
 */

import { coupleEnvironmentToPhysiology } from '../../domains/body-exposure/engine/environmentPhysiologyCoupler'
import { evaluateClinicalToClaimShield } from '../../domains/clinical-operations/engine/clinicalToClaimShieldEngine'
import type { ClosedLoopCareItem } from '../../domains/clinical-operations/engine/closedLoopCareAndMemoryEngine'
import {
  CODEMAX_SDK_VERSION,
  type CodeMaxAmbientExposure,
  type CodeMaxCircuitState,
  type CodeMaxEncounterRequest,
  type CodeMaxEncounterResponse,
  type CodeMaxEnvironmentHealth,
  type CodeMaxEnvironmentProfile,
  type CodeMaxEnvironmentalModifier,
  type CodeMaxPlugin,
  type CodeMaxRedFlagSignal,
  type CodeMaxRemoteTransport,
  type CodeMaxSdkConfig,
  type CodeMaxStageTrace,
} from './types'

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function addHoursIso(baseIso: string, hours: number): string {
  const ms = Date.parse(baseIso)
  const valid = Number.isFinite(ms) ? ms : Date.UTC(2026, 10, 24, 12, 0, 0)
  return new Date(valid + hours * 3_600_000).toISOString()
}

function deriveEnvironmentalModifiers(
  env: ReturnType<typeof coupleEnvironmentToPhysiology>,
): CodeMaxEnvironmentalModifier[] {
  const mods: CodeMaxEnvironmentalModifier[] = []
  if (env.thermoregulation.heatStrainTier === 'CRITICAL_HYPERTHERMIA') {
    mods.push({
      code: 'CRITICAL_HEAT_DEHYDRATION_RISK',
      severity: 'HIGH',
      detail: `Wet-bulb ${env.thermoregulation.wetBulbTempC}°C (HI ${env.thermoregulation.apparentHeatIndexC}°C); sweat loss ~${env.thermoregulation.sweatRateLPerHr} L/h — prioritize hydration & heat-stroke differential.`,
    })
  } else if (env.thermoregulation.heatStrainTier === 'HIGH_STRAIN') {
    mods.push({
      code: 'HIGH_HEAT_STRAIN_ADVISORY',
      severity: 'MODERATE',
      detail: `Elevated wet-bulb ${env.thermoregulation.wetBulbTempC}°C; consider thermal orthostatic & fluid-balance shift.`,
    })
  }
  if (env.airway.airQualityTier === 'HAZARDOUS' || env.airway.airQualityTier === 'UNHEALTHY') {
    mods.push({
      code: 'HAZARDOUS_PM25_AIRWAY_LOAD',
      severity: env.airway.airQualityTier === 'HAZARDOUS' ? 'HIGH' : 'MODERATE',
      detail: `PM2.5 ${env.airway.pm25UgM3} ug/m3 (US-AQI ${env.airway.estimatedUsAqi}); airway resistance x${env.airway.airwayResistanceMultiplier} — screen for asthma/COPD exacerbation.`,
    })
  }
  if (
    env.atmosphere.hypoxiaTier === 'HIGH_ALTITUDE_HYPOXIA' ||
    env.atmosphere.hypoxiaTier === 'MODERATE_HYPOXIA'
  ) {
    mods.push({
      code: 'HYPOBARIC_ALTITUDE_HYPOXIA',
      severity: env.atmosphere.hypoxiaTier === 'HIGH_ALTITUDE_HYPOXIA' ? 'HIGH' : 'MODERATE',
      detail: `Altitude ${env.sanitizedInput.altitudeM}m (Pb ${env.atmosphere.barometricMmHg} mmHg, PAO2 ${env.atmosphere.pao2AlveolarMmHg} mmHg); interpret resting SpO2 against hypobaric baseline.`,
    })
  }
  if (env.photobiology.uvRiskTier === 'EXTREME') {
    mods.push({
      code: 'EXTREME_UV_PHOTODAMAGE_RISK',
      severity: 'INFO',
      detail: `Extreme UV index (${env.photobiology.uvIndex}); advise photoprotection for photosensitizing prescriptions.`,
    })
  }
  return mods
}

function screenVitalsRedFlags(request: CodeMaxEncounterRequest): CodeMaxRedFlagSignal[] {
  const v = request.vitals
  if (!v) return []
  const flags: CodeMaxRedFlagSignal[] = []
  if (typeof v.spo2Pct === 'number' && Number.isFinite(v.spo2Pct) && v.spo2Pct < 90) {
    flags.push({
      code: 'HYPOXEMIA_CRITICAL',
      metric: 'SpO2',
      observedValue: `${v.spo2Pct}%`,
      severity: 'CRITICAL',
      provenance: v.provenance,
    })
  }
  if (typeof v.systolicMmHg === 'number' && Number.isFinite(v.systolicMmHg)) {
    if (v.systolicMmHg < 90) {
      flags.push({
        code: 'HYPOTENSION_SHOCK_SCREEN',
        metric: 'SBP',
        observedValue: `${v.systolicMmHg} mmHg`,
        severity: 'CRITICAL',
        provenance: v.provenance,
      })
    } else if (v.systolicMmHg >= 180) {
      flags.push({
        code: 'HYPERTENSIVE_CRISIS_SCREEN',
        metric: 'SBP',
        observedValue: `${v.systolicMmHg} mmHg`,
        severity: 'URGENT',
        provenance: v.provenance,
      })
    }
  }
  if (typeof v.heartRateBpm === 'number' && Number.isFinite(v.heartRateBpm) && (v.heartRateBpm > 130 || v.heartRateBpm < 45)) {
    flags.push({
      code: 'SEVERE_DYSRHYTHMIA_RATE',
      metric: 'HR',
      observedValue: `${v.heartRateBpm} bpm`,
      severity: 'CRITICAL',
      provenance: v.provenance,
    })
  }
  if (typeof v.respRatePerMin === 'number' && Number.isFinite(v.respRatePerMin) && v.respRatePerMin >= 28) {
    flags.push({
      code: 'TACHYPNEA_DISTRESS',
      metric: 'RR',
      observedValue: `${v.respRatePerMin}/min`,
      severity: 'URGENT',
      provenance: v.provenance,
    })
  }
  if (typeof v.tempC === 'number' && Number.isFinite(v.tempC) && v.tempC >= 39.5) {
    flags.push({
      code: 'HYPERPYREXIA_SCREEN',
      metric: 'Temp',
      observedValue: `${v.tempC}°C`,
      severity: 'URGENT',
      provenance: v.provenance,
    })
  }
  return flags
}

export class CodeMaxDoctorEmrSdk {
  private environment: CodeMaxEnvironmentProfile
  private readonly transport?: CodeMaxRemoteTransport
  private readonly failureThreshold: number
  private consecutiveFailures = 0
  private circuitState: CodeMaxCircuitState = 'CLOSED'
  private readonly plugins: CodeMaxPlugin[] = []

  constructor(config: CodeMaxSdkConfig) {
    this.environment = config.environment
    this.transport = config.transport
    this.failureThreshold = Math.max(1, config.circuitFailureThreshold ?? 2)
  }

  /** Register a specialty or clinic-specific clinical middleware plugin. */
  use(plugin: CodeMaxPlugin): this {
    if (!this.plugins.some((p) => p.id === plugin.id)) {
      this.plugins.push(plugin)
    }
    return this
  }

  /** Update clinic environment profile dynamically (e.g., connectivity drop or weather station update). */
  updateEnvironment(patch: Partial<CodeMaxEnvironmentProfile> & { readonly ambientExposure?: Partial<CodeMaxAmbientExposure> }): void {
    this.environment = {
      ...this.environment,
      ...patch,
      ambientExposure: {
        ...this.environment.ambientExposure,
        ...(patch.ambientExposure ?? {}),
      },
      zeroPhiTelemetry: true,
    }
    if (this.environment.connectivity === 'ONLINE_LOW_LATENCY' && this.circuitState === 'OPEN_FALLBACK') {
      this.consecutiveFailures = 0
      this.circuitState = 'CLOSED'
    }
  }

  /** Reset circuit breaker manually after network recovery. */
  resetCircuitBreaker(): void {
    this.consecutiveFailures = 0
    this.circuitState = 'CLOSED'
  }

  inspectEnvironmentHealth(): CodeMaxEnvironmentHealth {
    return {
      sdkVersion: CODEMAX_SDK_VERSION,
      clinicTier: this.environment.clinicTier,
      connectivity: this.environment.connectivity,
      primaryModel: this.environment.primaryModel,
      circuitState: this.circuitState,
      consecutiveTransportFailures: this.consecutiveFailures,
      registeredPlugins: this.plugins.map((p) => p.id),
      deterministicFallbackReady: true,
      satusehatEnabled: this.environment.satusehatEnabled,
      zeroPhiTelemetry: true,
    }
  }

  /** Execute the full 6-stage CodeMax Doctor AI-EMR Environment Pipeline. */
  async runEncounterPipeline(request: CodeMaxEncounterRequest): Promise<CodeMaxEncounterResponse> {
    const stageTraces: CodeMaxStageTrace[] = []

    // Stage 1: Constitutional Law IV STR Sovereignty Gate
    const strOk = request.doctor.strVerified
    stageTraces.push({
      stageId: 'str-authority-gate',
      status: strOk ? 'OK' : 'BLOCKED_SAFETY',
      epistemicSource: 'CLINICAL_RECORD',
      summary: strOk
        ? `Verified clinician ${request.doctor.clinicianId}; draft sign-off authority enabled.`
        : `Unverified STR for ${request.doctor.clinicianId}; encounter locked to read/draft-only until STR verification.`,
    })

    // Stage 2: Environment-Physiology Ecosystem Coupling
    const envPhys = coupleEnvironmentToPhysiology({
      ambientTempC: request.environment.ambientExposure.ambientTempC,
      relativeHumidityPct: request.environment.ambientExposure.relativeHumidityPct,
      pm25UgM3: request.environment.ambientExposure.pm25UgM3,
      uvIndex: request.environment.ambientExposure.uvIndex,
      altitudeM: request.environment.ambientExposure.altitudeM,
      restingHrBpm: request.vitals?.heartRateBpm ?? 72,
    })
    const modifiers = deriveEnvironmentalModifiers(envPhys)
    stageTraces.push({
      stageId: 'env-ecosystem-coupler',
      status: 'OK',
      epistemicSource: 'MECHANISTIC_SIMULATION',
      summary: `Coupled Pb=${envPhys.atmosphere.barometricMmHg}mmHg, Tw=${envPhys.thermoregulation.wetBulbTempC}°C, AQI=${envPhys.airway.estimatedUsAqi} (${modifiers.length} modifier(s)).`,
    })

    // Stage 3: Vitals Red-Flag Guardrail
    const redFlags = screenVitalsRedFlags(request)
    stageTraces.push({
      stageId: 'vitals-redflag-guardrail',
      status: redFlags.length > 0 ? 'BLOCKED_SAFETY' : 'OK',
      epistemicSource: request.vitals?.provenance ?? 'OBSERVED_CLINICAL',
      summary: redFlags.length > 0
        ? `Detected ${redFlags.length} critical/urgent vital red-flag(s): ${redFlags.map((f) => f.code).join(', ')}.`
        : 'No acute vital-sign red flags triggered.',
    })

    // Execute registered specialty plugins cleanly inside bounded context
    for (const plugin of this.plugins) {
      plugin.execute({
        request,
        environmentPhysiology: envPhys,
        modifiers,
        redFlags,
        stageTraces,
      })
    }

    // Stage 4: CodeMax Clinical-to-Claim Coding Shield (Doctor Role)
    const clinicalToClaim = evaluateClinicalToClaimShield({
      execution_mode: request.executionMode,
      user_role: 'DOCTOR',
      care_setting: request.careSetting,
      encounter_date_iso: request.nowIso,
      raw_clinical_input: request.rawClinicalNote,
      ventilator_hours: request.ventilatorHours ?? null,
      bpjs_pending_query: request.bpjsPendingQuery ?? null,
    })
    stageTraces.push({
      stageId: 'codemax-claim-coding-shield',
      status: 'OK',
      epistemicSource: 'CLINICAL_RECORD',
      summary: `Pending risk ${clinicalToClaim.pending_prevention_shield.risk_level}, payer=${clinicalToClaim.meta.payer_routing_alert}, ICD-10=${clinicalToClaim.clinical_coding?.principal_diagnosis.icd10 ?? 'N/A'}.`,
    })

    // Optional Remote CodeMax Model Transport with Circuit Breaker & Seamless Deterministic Failover
    let modelRouteUsed = 'deterministic/codemax-clinical-kernel-v1'
    let fallbackUsed = true
    let remoteSynthesisHint: string | undefined

    const canCallRemote =
      Boolean(this.transport) &&
      request.environment.connectivity !== 'OFFLINE' &&
      this.circuitState === 'CLOSED'

    if (canCallRemote && this.transport) {
      try {
        const remote = await this.transport(request)
        this.consecutiveFailures = 0
        modelRouteUsed = remote.modelSlug || request.environment.primaryModel
        fallbackUsed = false
        remoteSynthesisHint = remote.clinicalSynthesisHint
        stageTraces.push({
          stageId: 'codemax-remote-transport',
          status: 'OK',
          epistemicSource: 'MECHANISTIC_SIMULATION',
          summary: `Remote model ${modelRouteUsed} responded cleanly.`,
        })
      } catch {
        this.consecutiveFailures += 1
        if (this.consecutiveFailures >= this.failureThreshold) {
          this.circuitState = 'OPEN_FALLBACK'
        }
        fallbackUsed = true
        stageTraces.push({
          stageId: 'codemax-remote-transport',
          status: 'DEGRADED_OFFLINE',
          epistemicSource: 'CLINICAL_RECORD',
          summary: `Remote transport unavailable (failures=${this.consecutiveFailures}, circuit=${this.circuitState}); served deterministically via offline kernel.`,
        })
      }
    } else {
      stageTraces.push({
        stageId: 'codemax-remote-transport',
        status: 'DEGRADED_OFFLINE',
        epistemicSource: 'CLINICAL_RECORD',
        summary: `Offline/circuit-open mode (${request.environment.connectivity}/${this.circuitState}); deterministic clinical kernel active.`,
      })
    }

    // Stage 5: Closed-Loop Clinical Service Follow-Up Emitter
    const careLoopsEmitted: ClosedLoopCareItem[] = []
    for (const missing of clinicalToClaim.pending_prevention_shield.missing_evidence_artifacts.slice(0, 4)) {
      careLoopsEmitted.push({
        loopId: `loop_${request.encounterId}_${missing.category.toLowerCase()}`,
        patientId: request.patientRefId,
        kind: 'DIAGNOSTIC_ORDER',
        title: `Complete ${missing.artifact}`,
        priority: missing.urgency === 'HIGH' ? 'URGENT' : 'ROUTINE',
        stage: 'CREATED',
        createdAtIso: request.nowIso,
        dueAtIso: addHoursIso(request.nowIso, missing.urgency === 'HIGH' ? 24 : 72),
        linkedRecordIds: [request.encounterId],
        transitions: [],
      })
    }
    if (redFlags.some((f) => f.severity === 'CRITICAL')) {
      careLoopsEmitted.push({
        loopId: `loop_${request.encounterId}_critical_escalation`,
        patientId: request.patientRefId,
        kind: 'DISCHARGE_FOLLOW_UP',
        title: `Critical Vital Red-Flag Escalation (${redFlags.map((f) => f.metric).join('/')})`,
        priority: 'CRITICAL',
        stage: 'CREATED',
        createdAtIso: request.nowIso,
        dueAtIso: addHoursIso(request.nowIso, 2),
        linkedRecordIds: [request.encounterId],
        transitions: [],
      })
    }
    stageTraces.push({
      stageId: 'closed-loop-care-emitter',
      status: 'OK',
      epistemicSource: 'CLINICAL_RECORD',
      summary: `Emitted ${careLoopsEmitted.length} traceable closed-loop care item(s).`,
    })

    // Stage 6: SATUSEHAT FHIR R4 Bundle Packager + SHA-256 Digest + PHI-Free Audit Envelope
    const resourceTypes = [
      'Patient',
      'Encounter',
      'Condition',
      'Observation',
      ...(modifiers.length > 0 ? ['Observation(EnvironmentExposure)'] : []),
      ...(redFlags.length > 0 ? ['DetectedIssue'] : []),
    ]
    const fhirSkeleton = {
      resourceType: 'Bundle',
      type: 'transaction',
      encounterId: request.encounterId,
      careSetting: request.careSetting,
      icd10: clinicalToClaim.clinical_coding?.principal_diagnosis.icd10 ?? null,
      procedures: clinicalToClaim.clinical_coding?.procedures_icd9cm.map((p) => p.icd9cm) ?? [],
      resourceTypes,
      timestampIso: request.nowIso,
    }
    const sha256DigestHex = await sha256Hex(JSON.stringify(fhirSkeleton))
    stageTraces.push({
      stageId: 'fhir-r4-satusehat-packager',
      status: 'OK',
      epistemicSource: 'CLINICAL_RECORD',
      summary: `Packaged ${resourceTypes.length} FHIR R4 resources (SHA-256 ${sha256DigestHex.slice(0, 12)}).`,
    })

    return {
      sdkVersion: CODEMAX_SDK_VERSION,
      modelRouteUsed,
      fallbackUsed,
      ...(remoteSynthesisHint ? { remoteSynthesisHint } : {}),
      environmentPhysiology: envPhys,
      environmentalModifiers: modifiers,
      clinicalToClaim,
      safetyGates: {
        strSignOffRequired: true,
        autoPrescriptionBlocked: true,
        doctorStrVerified: strOk,
        signOffStatus: strOk ? 'READY_FOR_DOCTOR_SIGNATURE' : 'LOCKED_STR_UNVERIFIED',
        redFlags,
      },
      careLoopsEmitted,
      fhirR4Preview: {
        resourceType: 'Bundle',
        type: 'transaction',
        profile: 'SATUSEHAT_FHIR_R4',
        resourceCount: resourceTypes.length,
        resourceTypes,
        sha256DigestHex,
        readyForServerSubmission: strOk && request.environment.satusehatEnabled,
      },
      stageTraces,
      auditEnvelope: {
        sdkVersion: CODEMAX_SDK_VERSION,
        encounterId: request.encounterId,
        clinicianId: request.doctor.clinicianId,
        clinicTier: request.environment.clinicTier,
        connectivity: request.environment.connectivity,
        modelRouteUsed,
        fallbackUsed,
        timestampIso: request.nowIso,
        containsRawPhi: false,
      },
    }
  }

  /** Export a copy-ready TypeScript integration snippet for hospital SIMRS / Doctor workstations. */
  exportSdkSnippet(): string {
    return [
      "import { createCodeMaxDoctorSdk } from '@panaceamed/sdk/codemax'",
      '',
      'const sdk = createCodeMaxDoctorSdk({',
      '  environment: {',
      `    clinicTier: '${this.environment.clinicTier}',`,
      `    connectivity: '${this.environment.connectivity}',`,
      `    primaryModel: '${this.environment.primaryModel}',`,
      "    fallbackStrategy: 'DETERMINISTIC_CLINICAL_KERNEL',",
      `    satusehatEnabled: ${String(this.environment.satusehatEnabled)},`,
      '    zeroPhiTelemetry: true,',
      `    ambientExposure: { ambientTempC: ${this.environment.ambientExposure.ambientTempC}, relativeHumidityPct: ${this.environment.ambientExposure.relativeHumidityPct}, pm25UgM3: ${this.environment.ambientExposure.pm25UgM3}, uvIndex: ${this.environment.ambientExposure.uvIndex}, altitudeM: ${this.environment.ambientExposure.altitudeM} },`,
      '  },',
      '})',
      'const result = await sdk.runEncounterPipeline(encounterRequest)',
    ].join('\n')
  }
}

export function createCodeMaxDoctorSdk(config: CodeMaxSdkConfig): CodeMaxDoctorEmrSdk {
  return new CodeMaxDoctorEmrSdk(config)
}
