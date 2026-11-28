/**
 * PanaceaMed CodeMax Doctor AI-EMR SDK — Canonical TypeScript Contracts (v1).
 *
 * Isomorphic, zero-dependency contracts unifying:
 * - Clinic & Planetary Environment Ecosystem Telemetry (connectivity, ambient climate, PM2.5, altitude, UV)
 * - Doctor STR/SIP Sovereign Authority Gates (Constitutional Law IV)
 * - Deterministic Clinical-to-Claim Coding Shield (ICD-10, ICD-9-CM, INA-CBG/iDRG, Group J, KLL/KK/PAK/KAPJ)
 * - Closed-Loop Clinical Service Follow-Up Emitters (WP-08)
 * - SATUSEHAT / FHIR R4 Transaction Bundle Packaging & PHI-Free Audit Telemetry
 */

import type {
  CareSetting,
  ClinicalToClaimOutput,
  ExecutionMode,
} from '../../domains/clinical-operations/engine/clinicalToClaimShieldEngine'
import type { ClosedLoopCareItem } from '../../domains/clinical-operations/engine/closedLoopCareAndMemoryEngine'
import type { EnvironmentPhysiologyReport } from '../../domains/body-exposure/engine/environmentPhysiologyCoupler'

export const CODEMAX_SDK_VERSION = 'codemax-doctor-emr-sdk-v1' as const

export type CodeMaxClinicTier =
  | 'TERTIARY_HOSPITAL'
  | 'PUSKESMAS_PRIMARY'
  | 'RURAL_2G_STARLINK'
  | 'OFFLINE_VAULT'

export type CodeMaxConnectivityMode =
  | 'ONLINE_LOW_LATENCY'
  | 'DEGRADED_2G'
  | 'OFFLINE'

export type CodeMaxCircuitState = 'CLOSED' | 'OPEN_FALLBACK'

export interface CodeMaxAmbientExposure {
  readonly ambientTempC: number
  readonly relativeHumidityPct: number
  readonly pm25UgM3: number
  readonly uvIndex: number
  readonly altitudeM: number
}

export interface CodeMaxEnvironmentProfile {
  readonly clinicTier: CodeMaxClinicTier
  readonly connectivity: CodeMaxConnectivityMode
  readonly ambientExposure: CodeMaxAmbientExposure
  readonly primaryModel: string
  readonly fallbackStrategy: 'DETERMINISTIC_CLINICAL_KERNEL'
  readonly satusehatEnabled: boolean
  readonly zeroPhiTelemetry: true
}

export interface CodeMaxDoctorIdentity {
  readonly clinicianId: string
  readonly displayName: string
  readonly role: 'DOCTOR' | 'OWNER_CLINICIAN'
  readonly strVerified: boolean
  readonly strNumberMasked?: string
  readonly facilityCode?: string
}

export interface CodeMaxPatientVitalsSnapshot {
  readonly heartRateBpm?: number
  readonly systolicMmHg?: number
  readonly diastolicMmHg?: number
  readonly spo2Pct?: number
  readonly respRatePerMin?: number
  readonly tempC?: number
  readonly provenance: 'OBSERVED_CLINICAL' | 'OBSERVED_CONSUMER'
}

export interface CodeMaxEncounterRequest {
  readonly encounterId: string
  readonly patientRefId: string
  readonly careSetting: CareSetting
  readonly executionMode: ExecutionMode
  readonly rawClinicalNote: string
  readonly vitals?: CodeMaxPatientVitalsSnapshot
  readonly ventilatorHours?: number | null
  readonly bpjsPendingQuery?: string | null
  readonly existingMedications?: readonly string[]
  readonly allergies?: readonly string[]
  readonly environment: CodeMaxEnvironmentProfile
  readonly doctor: CodeMaxDoctorIdentity
  readonly nowIso: string
}

export interface CodeMaxEnvironmentalModifier {
  readonly code:
    | 'CRITICAL_HEAT_DEHYDRATION_RISK'
    | 'HIGH_HEAT_STRAIN_ADVISORY'
    | 'HAZARDOUS_PM25_AIRWAY_LOAD'
    | 'HYPOBARIC_ALTITUDE_HYPOXIA'
    | 'EXTREME_UV_PHOTODAMAGE_RISK'
  readonly severity: 'INFO' | 'MODERATE' | 'HIGH'
  readonly detail: string
}

export interface CodeMaxRedFlagSignal {
  readonly code: string
  readonly metric: string
  readonly observedValue: string
  readonly severity: 'URGENT' | 'CRITICAL'
  readonly provenance: 'OBSERVED_CLINICAL' | 'OBSERVED_CONSUMER'
}

export interface CodeMaxSafetyGates {
  readonly strSignOffRequired: true
  readonly autoPrescriptionBlocked: true
  readonly doctorStrVerified: boolean
  readonly signOffStatus: 'READY_FOR_DOCTOR_SIGNATURE' | 'LOCKED_STR_UNVERIFIED'
  readonly redFlags: readonly CodeMaxRedFlagSignal[]
}

export interface CodeMaxFhirPreview {
  readonly resourceType: 'Bundle'
  readonly type: 'transaction'
  readonly profile: 'SATUSEHAT_FHIR_R4'
  readonly resourceCount: number
  readonly resourceTypes: readonly string[]
  readonly sha256DigestHex: string
  readonly readyForServerSubmission: boolean
}

export interface CodeMaxStageTrace {
  readonly stageId: string
  readonly status: 'OK' | 'DEGRADED_OFFLINE' | 'BLOCKED_SAFETY'
  readonly epistemicSource: 'OBSERVED_CLINICAL' | 'OBSERVED_CONSUMER' | 'CLINICAL_RECORD' | 'MECHANISTIC_SIMULATION'
  readonly summary: string
}

export interface CodeMaxAuditEnvelope {
  readonly sdkVersion: typeof CODEMAX_SDK_VERSION
  readonly encounterId: string
  readonly clinicianId: string
  readonly clinicTier: CodeMaxClinicTier
  readonly connectivity: CodeMaxConnectivityMode
  readonly modelRouteUsed: string
  readonly fallbackUsed: boolean
  readonly timestampIso: string
  readonly containsRawPhi: false
}

export interface CodeMaxPluginContext {
  readonly request: CodeMaxEncounterRequest
  readonly environmentPhysiology: EnvironmentPhysiologyReport
  readonly modifiers: CodeMaxEnvironmentalModifier[]
  readonly redFlags: CodeMaxRedFlagSignal[]
  readonly stageTraces: CodeMaxStageTrace[]
}

export interface CodeMaxPlugin {
  readonly id: string
  readonly description: string
  readonly execute: (ctx: CodeMaxPluginContext) => void
}

export interface CodeMaxRemoteEnrichmentResult {
  readonly modelSlug: string
  readonly clinicalSynthesisHint?: string
  readonly latencyMs?: number
}

export type CodeMaxRemoteTransport = (
  request: CodeMaxEncounterRequest,
) => Promise<CodeMaxRemoteEnrichmentResult>

export interface CodeMaxSdkConfig {
  readonly environment: CodeMaxEnvironmentProfile
  readonly transport?: CodeMaxRemoteTransport
  readonly circuitFailureThreshold?: number
}

export interface CodeMaxEnvironmentHealth {
  readonly sdkVersion: typeof CODEMAX_SDK_VERSION
  readonly clinicTier: CodeMaxClinicTier
  readonly connectivity: CodeMaxConnectivityMode
  readonly primaryModel: string
  readonly circuitState: CodeMaxCircuitState
  readonly consecutiveTransportFailures: number
  readonly registeredPlugins: readonly string[]
  readonly deterministicFallbackReady: true
  readonly satusehatEnabled: boolean
  readonly zeroPhiTelemetry: true
}

export interface CodeMaxEncounterResponse {
  readonly sdkVersion: typeof CODEMAX_SDK_VERSION
  readonly modelRouteUsed: string
  readonly fallbackUsed: boolean
  readonly remoteSynthesisHint?: string
  readonly environmentPhysiology: EnvironmentPhysiologyReport
  readonly environmentalModifiers: readonly CodeMaxEnvironmentalModifier[]
  readonly clinicalToClaim: ClinicalToClaimOutput
  readonly safetyGates: CodeMaxSafetyGates
  readonly careLoopsEmitted: readonly ClosedLoopCareItem[]
  readonly fhirR4Preview: CodeMaxFhirPreview
  readonly stageTraces: readonly CodeMaxStageTrace[]
  readonly auditEnvelope: CodeMaxAuditEnvelope
}
