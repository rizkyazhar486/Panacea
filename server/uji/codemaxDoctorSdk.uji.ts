import assert from 'node:assert/strict'
import {
  SERVER_CODEMAX_SDK_VERSION,
  evaluateServerCodeMaxEncounter,
  resolveCodeMaxEnvironmentStatus,
  validateCodeMaxDoctorRequest,
} from '../src/domains/clinical-records/codemaxDoctorSdkRuntime.js'

// 1. Environment status never exposes secrets and resolves model priority cleanly
const envStatus = resolveCodeMaxEnvironmentStatus({
  env: { AI_CODEMAX_MODEL: 'panacea/codemax-clinical-v2', OPENROUTER_API_KEY: 'sk-test-secret-never-echo' },
  satusehatReady: true,
  icd11Ready: true,
})
assert.equal(envStatus.sdkVersion, SERVER_CODEMAX_SDK_VERSION)
assert.equal(envStatus.primaryModel, 'panacea/codemax-clinical-v2')
assert.equal(envStatus.providerBackend, 'openrouter')
assert.equal(JSON.stringify(envStatus).includes('sk-test-secret'), false)

// 2. Request validation rejects empty / oversized notes
assert.equal(validateCodeMaxDoctorRequest({}).ok, false)
assert.equal(validateCodeMaxDoctorRequest({ encounterId: 'enc_1', rawClinicalNote: '' }).ok, false)
assert.equal(validateCodeMaxDoctorRequest({ encounterId: 'enc_1', rawClinicalNote: 'x'.repeat(13_000) }).ok, false)

const valid = validateCodeMaxDoctorRequest({
  encounterId: 'enc_srv_01',
  careSetting: 'IGD',
  rawClinicalNote: 'Demam tinggi, sesak napas berat, paparan asap kebakaran.',
  ambientExposure: { ambientTempC: 39, relativeHumidityPct: 85, pm25UgM3: 210, uvIndex: 9, altitudeM: 2600 },
  vitals: { spo2Pct: 87, systolicMmHg: 85, heartRateBpm: 136 },
})
assert.equal(valid.ok, true)

// 3. Server encounter evaluation: deterministic fallback on remote error + Law IV safety + SHA-256 digest
const evaluated = await evaluateServerCodeMaxEncounter({
  request: valid.value!,
  clinicianId: 'doc_str_1',
  clinicianStrVerified: true,
  envStatus,
  invokeModel: async () => {
    throw new Error('upstream timeout')
  },
})
assert.equal(evaluated.fallbackUsed, true)
assert.equal(evaluated.strSignOffRequired, true)
assert.equal(evaluated.autoPrescriptionBlocked, true)
assert.ok(evaluated.environmentalModifiers.some((m) => m.code === 'CRITICAL_HEAT_DEHYDRATION_RISK'))
assert.ok(evaluated.environmentalModifiers.some((m) => m.code === 'HAZARDOUS_PM25_AIRWAY_LOAD'))
assert.ok(evaluated.environmentalModifiers.some((m) => m.code === 'HYPOBARIC_ALTITUDE_HYPOXIA'))
assert.ok(evaluated.vitalRedFlags.some((f) => f.code === 'HYPOXEMIA_CRITICAL'))
assert.equal(evaluated.fhirPreviewDigestSha256.length, 64)
assert.equal(evaluated.auditMeta.containsRawPhi, false)

// 4. Remote LLM enrichment succeeds cleanly when healthy
const enriched = await evaluateServerCodeMaxEncounter({
  request: valid.value!,
  clinicianId: 'doc_str_1',
  clinicianStrVerified: true,
  envStatus,
  invokeModel: async () => 'Consider acute hypoxemic respiratory failure exacerbated by PM2.5 and hypobaric altitude.',
})
assert.equal(enriched.fallbackUsed, false)
assert.equal(enriched.modelRouteUsed, 'panacea/codemax-clinical-v2')
assert.ok(enriched.remoteSynthesisHint?.includes('PM2.5'))

console.log('codemaxDoctorSdk.uji: server environment resolver, validation, failover, remote enrichment & Law-IV audit PASS')
