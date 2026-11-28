import assert from 'node:assert/strict'
import {
  CODEMAX_SDK_VERSION,
  createCodeMaxDoctorSdk,
  type CodeMaxEncounterRequest,
  type CodeMaxEnvironmentProfile,
} from '../../src/sdk/codemax/index.ts'

const harshEnv: CodeMaxEnvironmentProfile = {
  clinicTier: 'RURAL_2G_STARLINK',
  connectivity: 'ONLINE_LOW_LATENCY',
  ambientExposure: {
    ambientTempC: 39,
    relativeHumidityPct: 82,
    pm25UgM3: 185,
    uvIndex: 11,
    altitudeM: 3600,
  },
  primaryModel: 'panacea/codemax-clinical-v1',
  fallbackStrategy: 'DETERMINISTIC_CLINICAL_KERNEL',
  satusehatEnabled: true,
  zeroPhiTelemetry: true,
}

let remoteCallCount = 0
const failingTransport = async () => {
  remoteCallCount++
  throw new Error('simulated 503 network partition')
}

const sdk = createCodeMaxDoctorSdk({
  environment: harshEnv,
  transport: failingTransport,
  circuitFailureThreshold: 2,
})

// 1. Register a custom hospital specialty plugin
sdk.use({
  id: 'pulmo-env-plugin',
  description: 'Flags high-altitude + PM2.5 double pulmonary burden',
  execute(ctx) {
    ctx.stageTraces.push({
      stageId: 'plugin:pulmo-env-plugin',
      status: 'OK',
      epistemicSource: 'MECHANISTIC_SIMULATION',
      summary: `Plugin inspected ${ctx.modifiers.length} environmental modifiers.`,
    })
  },
})

const req: CodeMaxEncounterRequest = {
  encounterId: 'enc_codemax_001',
  patientRefId: 'pt_anon_77',
  careSetting: 'ICU_NICU_PICU_HCU',
  executionMode: 'REALTIME_SHIELD',
  rawClinicalNote:
    'Pasien sesak napas berat dengan pneumonia, intubasi dan ventilasi mekanis 104 jam. Tidak ada sepsis. Foto toraks infiltrat bilateral.',
  vitals: {
    heartRateBpm: 138,
    systolicMmHg: 84,
    spo2Pct: 86,
    respRatePerMin: 32,
    tempC: 39.8,
    provenance: 'OBSERVED_CLINICAL',
  },
  ventilatorHours: 104,
  environment: harshEnv,
  doctor: {
    clinicianId: 'dr_rizky_01',
    displayName: 'dr. Rizky',
    role: 'DOCTOR',
    strVerified: true,
    strNumberMasked: 'STR-****-9912',
    facilityCode: 'RSUD-001',
  },
  nowIso: '2026-11-24T12:00:00.000Z',
}

// 2. First call: remote transport fails -> seamless deterministic failover without throwing
const res1 = await sdk.runEncounterPipeline(req)
assert.equal(res1.sdkVersion, CODEMAX_SDK_VERSION)
assert.equal(res1.fallbackUsed, true)
assert.equal(res1.safetyGates.strSignOffRequired, true)
assert.equal(res1.safetyGates.autoPrescriptionBlocked, true)
assert.equal(res1.safetyGates.signOffStatus, 'READY_FOR_DOCTOR_SIGNATURE')

// Environment modifiers coupled deterministically
const modCodes = new Set(res1.environmentalModifiers.map((m) => m.code))
assert.ok(modCodes.has('CRITICAL_HEAT_DEHYDRATION_RISK'))
assert.ok(modCodes.has('HAZARDOUS_PM25_AIRWAY_LOAD'))
assert.ok(modCodes.has('HYPOBARIC_ALTITUDE_HYPOXIA'))
assert.ok(modCodes.has('EXTREME_UV_PHOTODAMAGE_RISK'))

// Vital red flags + clinical coding + closed-loop care + FHIR R4 digest + PHI-free audit
assert.ok(res1.safetyGates.redFlags.some((f) => f.code === 'HYPOXEMIA_CRITICAL'))
assert.ok(res1.safetyGates.redFlags.some((f) => f.code === 'HYPOTENSION_SHOCK_SCREEN'))
assert.ok(res1.clinicalToClaim.clinical_coding?.procedures_icd9cm.some((p) => p.icd9cm === '96.72'))
assert.ok(res1.careLoopsEmitted.some((l) => l.priority === 'CRITICAL'))
assert.equal(res1.fhirR4Preview.profile, 'SATUSEHAT_FHIR_R4')
assert.equal(res1.fhirR4Preview.sha256DigestHex.length, 64)
assert.equal(res1.fhirR4Preview.readyForServerSubmission, true)
assert.equal(res1.auditEnvelope.containsRawPhi, false)
assert.ok(res1.stageTraces.some((s) => s.stageId === 'plugin:pulmo-env-plugin'))

// 3. Second failure opens circuit breaker -> third call skips broken remote completely
await sdk.runEncounterPipeline(req)
assert.equal(sdk.inspectEnvironmentHealth().circuitState, 'OPEN_FALLBACK')
const callsBeforeOpen = remoteCallCount
await sdk.runEncounterPipeline(req)
assert.equal(remoteCallCount, callsBeforeOpen, 'Open circuit breaker must bypass broken remote transport')

// 4. Unverified STR doctor MUST be locked out of sign-off and SATUSEHAT submission
const unverifiedRes = await sdk.runEncounterPipeline({
  ...req,
  doctor: { ...req.doctor, strVerified: false },
})
assert.equal(unverifiedRes.safetyGates.signOffStatus, 'LOCKED_STR_UNVERIFIED')
assert.equal(unverifiedRes.fhirR4Preview.readyForServerSubmission, false)

// 5. SDK snippet export contains clean typed import
assert.ok(sdk.exportSdkSnippet().includes('createCodeMaxDoctorSdk'))

console.log(
  `codemax-doctor-emr-sdk: 6-stage pipeline, ${res1.environmentalModifiers.length} env modifiers, ${res1.safetyGates.redFlags.length} vital red-flags, circuit-breaker failover, STR lock, FHIR SHA-256 (${res1.fhirR4Preview.sha256DigestHex.slice(0, 12)}) PASS`,
)
