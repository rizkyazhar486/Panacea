import assert from 'node:assert/strict'
import test from 'node:test'
import { ANATOMICAL_SYSTEM_IDS, isRealityViewState } from '../../src/types/realityView.ts'
import { createPurposeConsentLedger } from '../../src/lib/purposeConsentLedger.ts'
import { buildRealityViewState } from '../../src/engines/reality-view/realityViewStateEngine.ts'
import { OverrideMemoryStore } from '../../src/engines/reality-view/overrideMemoryStore.ts'
import {
  MESH_TO_ONTOLOGY_MAP,
  listBindingsBySystem,
  projectTm1DualCodingMetadata,
  resolveMeshOntology,
} from '../../src/engines/reality-view/anatomyOntologyRegistry.ts'
import {
  FpsTierWatchdog,
  QUIET_MODE_MAX_BYTES,
  QUIET_MODE_SHELL_MANIFEST,
  RealityViewLodResourcePool,
  detectPerformanceTier,
  resolveActiveLodBundlePlan,
} from '../../src/components/reality-view/performanceTierManager.ts'
import {
  MemoryVaultStorageAdapter,
  assertOutboundClinicalSyncAuthorized,
  bootRealityViewOfflineFirst,
  deriveVaultAesKey,
  loadEncryptedRealityViewSnapshot,
  sanitizeClinicalText,
  saveEncryptedRealityViewSnapshot,
} from '../../src/engines/reality-view/realityViewVaultSync.ts'
import {
  DEMOGRAPHIC_COHORT_IDS,
  classifyDemographicCohort,
  parseNaturalDemographicIntake,
  synthesizeAnthropometryManifold,
} from '../../src/engines/reality-view/demographicManifold.ts'

test('1:1 mesh-to-ontology registry covers all 10 systems with zero fuzzy matching and immutable TM1 overlay', () => {
  for (const sys of ANATOMICAL_SYSTEM_IDS) {
    assert.ok(listBindingsBySystem(sys).length >= 1, `missing binding for ${sys}`)
  }
  const lv = resolveMeshOntology('Left ventricle')
  assert.equal(lv.selectable, true)
  assert.equal(lv.binding.canonicalOntologyId, 'FMA:7101')
  assert.equal(lv.binding.systemId, 'cardiovascular')
  assert.ok(MESH_TO_ONTOLOGY_MAP.get('Liver')?.indonesianLabel.includes('Hati'))

  // Zero fuzzy string matching
  assert.equal(resolveMeshOntology('left ventricle').selectable, false)
  assert.equal(resolveMeshOntology('shell_decoration').selectable, false)

  // TM1 dual coding never alters meshId or canonicalOntologyId
  const tmOff = projectTm1DualCodingMetadata('Liver', false)
  const tmOn = projectTm1DualCodingMetadata('Liver', true)
  assert.equal(tmOff.icd11Tm1Code, undefined)
  assert.equal(tmOn.icd11Tm1Code, 'SF70')
  assert.equal(tmOn.meshId, 'Liver')
  assert.equal(tmOn.canonicalOntologyId, 'FMA:7197')
})

test('hardware tiers, 3-second FPS watchdog, Quiet Mode LOD plan, and explicit .dispose() memory hygiene', () => {
  assert.equal(detectPerformanceTier({ hasWebGPU: true, hasWebGL2: true, isMobile: false, deviceMemoryGb: 16 }).tier, 'webgpu_high')
  assert.equal(detectPerformanceTier({ hasWebGPU: false, hasWebGL2: true, isMobile: true, deviceMemoryGb: 6 }).tier, 'mobile_lod')
  assert.equal(detectPerformanceTier({ hasWebGPU: true, hasWebGL2: true, isMobile: true, deviceMemoryGb: 2 }).tier, 'fallback_25d')

  const watchdog = new FpsTierWatchdog()
  assert.equal(watchdog.recordOneSecondSample(22).shouldDowngradeTo25D, false)
  assert.equal(watchdog.recordOneSecondSample(20).shouldDowngradeTo25D, false)
  assert.equal(watchdog.recordOneSecondSample(19).shouldDowngradeTo25D, true)
  watchdog.reset()
  assert.equal(watchdog.recordOneSecondSample(60).consecutiveLowSeconds, 0)

  const quietPlan = resolveActiveLodBundlePlan({ tier: 'mobile_lod', mode: 'quiet', requestedSystems: ['cardiovascular', 'renal'] })
  assert.equal(quietPlan.loadOuterShell, true)
  assert.deepEqual(quietPlan.streamableSystems, [])
  assert.ok(QUIET_MODE_SHELL_MANIFEST.length >= 10 && QUIET_MODE_MAX_BYTES === Math.round(1.8 * 1024 * 1024))

  const splitPlan = resolveActiveLodBundlePlan({ tier: 'mobile_lod', mode: 'split', requestedSystems: ['cardiovascular'] })
  assert.deepEqual(splitPlan.streamableSystems, ['cardiovascular'])

  let shellDisposed = false
  let organDisposed = false
  const pool = new RealityViewLodResourcePool()
  pool.register({ id: 'shell', lod: 'lod0_shell', estimatedBytes: 900_000, dispose: () => { shellDisposed = true } })
  pool.register({ id: 'heart-hd', lod: 'lod2_clinical_detail', estimatedBytes: 8_000_000, dispose: () => { organDisposed = true } })
  assert.equal(pool.evictFullscreenResources(), 1)
  assert.equal(organDisposed, true)
  assert.equal(shellDisposed, false)
  assert.equal(pool.activeCount, 1)
  assert.equal(pool.disposeAll(), 1)
  assert.equal(shellDisposed, true)
})

test('AES-GCM encrypted vault round-trip, wrong-key fail-closed, <500ms offline boot, auth gating & XSS sanitizer', async () => {
  const storage = new MemoryVaultStorageAdapter()
  const salt = new Uint8Array(16).fill(7)
  const keyA = await deriveVaultAesKey('panacea-unlocked-vault-key-alpha', salt)
  const keyB = await deriveVaultAesKey('different-wrong-vault-key-beta', salt)

  const ledger = createPurposeConsentLedger()
  const recordedAt = '2026-11-23T08:00:00Z'
  const state = buildRealityViewState({
    patientId: 'patient-rv-01',
    mode: 'split',
    nowIso: '2026-11-24T08:00:00Z',
    timeAxisCursorIso: '2026-11-24T08:00:00Z',
    consentLedger: ledger,
    readings: [{
      event: {
        id: 'hr-01', subjectId: 'patient-rv-01', domain: 'vital', metric: 'heart-rate', value: 72, unit: 'bpm',
        recordedAt, confidence: 1, semanticState: 'measured',
        provenance: { sourceKind: 'clinical-system', sourceId: 'siloam-hl7', capturedAt: recordedAt, receivedAt: recordedAt },
        consent: { granted: true, purposes: ['personal-visualization'], grantedAt: recordedAt },
        review: { state: 'accepted', reviewerId: 'dr-reviewer', reviewedAt: recordedAt },
      },
      provenance: { id: 'hr-01', fhirResourceType: 'Observation', sourceLabel: 'Verified ECG', recordedAt, verified: true },
      evidenceClass: 'observed_fhir',
      statusScore: 0.88,
    }],
  })
  const store = new OverrideMemoryStore()
  store.recordOverride('hydration_nudge', 'lifestyle', false, 'dismissed')
  store.recordOverride('hydration_nudge', 'lifestyle', false, 'dismissed')
  store.recordOverride('critical_ddi', 'clinical_red_flag', true, 'attempted')

  const encrypted = await saveEncryptedRealityViewSnapshot({ state, overrideStore: store, vaultKey: keyA, storage })
  assert.equal(encrypted.alg, 'AES-GCM')
  assert.ok(!encrypted.ciphertextBase64.includes('patient-rv-01'), 'PHI/patientId must not appear in plaintext')

  // Wrong key must fail closed
  await assert.rejects(() => loadEncryptedRealityViewSnapshot({ patientId: 'patient-rv-01', vaultKey: keyB, storage }))

  // Offline boot hydrates quiet mode directly from encrypted cache in < 500ms
  const booted = await bootRealityViewOfflineFirst({ patientId: 'patient-rv-01', isOnline: false, vaultKey: keyA, storage })
  assert.equal(booted.hydratedFromCache, true)
  assert.equal(booted.offlineIndicator, true)
  assert.ok(booted.elapsedMs < 500, `Offline boot exceeded 500ms (${booted.elapsedMs}ms)`)
  assert.ok(booted.state && isRealityViewState(booted.state))
  assert.equal(booted.state.mode, 'quiet')
  assert.equal(booted.state.nodes['Left ventricle'].shaderUniforms.conductionState?.length, 64)
  assert.equal(booted.overrideStore.shouldSuppressAlert('hydration_nudge', false).suppressed, true)
  assert.equal(booted.overrideStore.shouldSuppressAlert('critical_ddi', true).suppressed, false)

  // Auth & Vault Gating
  const nowMs = Date.parse('2026-11-24T08:00:00Z')
  assert.equal(assertOutboundClinicalSyncAuthorized(null, 'satusehat_fhir_r4', nowMs).authorized, false)
  assert.equal(assertOutboundClinicalSyncAuthorized({ googleAuthVerified: false, vaultUnlocked: true, sessionExpiresAtMs: nowMs + 60_000, providerUserId: 'u1' }, 'medgemma_inference', nowMs).authorized, false)
  assert.equal(assertOutboundClinicalSyncAuthorized({ googleAuthVerified: true, vaultUnlocked: false, sessionExpiresAtMs: nowMs + 60_000, providerUserId: 'u1' }, 'satusehat_fhir_r4', nowMs).authorized, false)
  assert.equal(assertOutboundClinicalSyncAuthorized({ googleAuthVerified: true, vaultUnlocked: true, sessionExpiresAtMs: nowMs + 60_000, providerUserId: 'u1' }, 'satusehat_fhir_r4', nowMs).authorized, true)

  // Sanitizer strips script/HTML payloads
  assert.equal(sanitizeClinicalText('<script>alert(1)</script><b>SBP 128</b> mmHg'), 'SBP 128 mmHg')
})

test('Universal human demographic manifold covers 0-115+ years, obstetric Week 1-42, geriatric senescence & natural voice intake', () => {
  assert.equal(DEMOGRAPHIC_COHORT_IDS.length, 22)
  assert.equal(classifyDemographicCohort({ ageYears: 0.02, biologicalSex: 'male', preterm: true }), 'NEO_PRE_M')
  assert.equal(classifyDemographicCohort({ ageYears: 0.5, biologicalSex: 'female' }), 'INF_F')
  assert.equal(classifyDemographicCohort({ ageYears: 76, biologicalSex: 'male' }), 'GER_M')
  assert.equal(classifyDemographicCohort({ ageYears: 92, biologicalSex: 'female' }), 'LON_F')
  assert.equal(classifyDemographicCohort({ ageYears: 30, biologicalSex: 'female', gestationalWeek: 32 }), 'MAT_PREG')

  const elderly = synthesizeAnthropometryManifold({ ageYears: 78, biologicalSex: 'male', heightCm: 165, weightKg: 58 })
  assert.equal(elderly.cohortId, 'GER_M')
  assert.ok(elderly.senescenceVector.thoracicKyphosisDeg >= 45)
  assert.ok(elderly.senescenceVector.sarcopeniaIndex > 0.4)

  const pregnant = parseNaturalDemographicIntake('Ibu hamil 32 minggu, usia 29 tahun, tinggi 160 cm, berat 66 kg')
  assert.equal(pregnant.cohortId, 'MAT_PREG')
  assert.equal(pregnant.obstetricHemodynamics?.gestationalWeek, 32)
  assert.ok((pregnant.obstetricHemodynamics?.cardiacOutputGainPct ?? 0) >= 35)
})
