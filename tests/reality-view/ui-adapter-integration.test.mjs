import assert from 'node:assert/strict'
import test from 'node:test'
import { OverrideMemoryStore } from '../../src/engines/reality-view/overrideMemoryStore.ts'
import { buildRealityViewState } from '../../src/engines/reality-view/realityViewStateEngine.ts'
import { createPurposeConsentLedger } from '../../src/lib/purposeConsentLedger.ts'
import {
  assertOutboundClinicalSyncAuthorized,
  evaluateLiveVaultAuthSession,
  GLB_LAYER_ESTIMATED_BYTES,
  inspectSelectedMesh,
  mapLodPlanToGlbLayers,
  QUIET_MODE_MAX_BYTES,
  resolveActiveLodBundlePlan,
} from '../../src/components/reality-view/realityViewAdapter.ts'

test('realityViewStateEngine anchors match MESH_TO_ONTOLOGY_MAP canonical IDs', () => {
  const recordedAt = '2026-11-23T08:00:00Z'
  const consent = { granted: true, purposes: ['personal-visualization'], grantedAt: recordedAt }
  const state = buildRealityViewState({
    patientId: 'ui-adapter-subject',
    mode: 'split',
    nowIso: '2026-11-23T12:00:00Z',
    timeAxisCursorIso: '2026-11-23T12:00:00Z',
    dualCodingTm1Enabled: false,
    consentLedger: createPurposeConsentLedger(),
    readings: [
      {
        evidenceClass: 'observed_fhir',
        provenance: { id: 'p-hr', fhirResourceType: 'Observation', sourceLabel: 'FHIR', recordedAt, verified: true },
        event: {
          id: 'e-hr', subjectId: 'ui-adapter-subject', domain: 'vital', metric: 'heart-rate',
          value: 72, unit: 'bpm', recordedAt, confidence: 1, semanticState: 'measured',
          provenance: { sourceKind: 'clinical-system', sourceId: 'fhir', capturedAt: recordedAt, receivedAt: recordedAt },
          consent, review: { state: 'accepted', reviewerId: 'dr', reviewedAt: recordedAt },
        },
      },
      {
        evidenceClass: 'ocr_verified',
        provenance: { id: 'p-sgpt', fhirResourceType: 'DiagnosticReport', sourceLabel: 'OCR', recordedAt, verified: true },
        event: {
          id: 'e-sgpt', subjectId: 'ui-adapter-subject', domain: 'lab', metric: 'lab.sgpt',
          value: 28, unit: 'U/L', recordedAt, confidence: 1, semanticState: 'imported',
          provenance: { sourceKind: 'import', sourceId: 'lab-ocr', capturedAt: recordedAt, receivedAt: recordedAt },
          consent, review: { state: 'accepted', reviewerId: 'dr', reviewedAt: recordedAt },
        },
      },
    ],
  })

  assert.equal(state.nodes['Left ventricle'].canonicalOntologyId, 'FMA:7101')
  assert.equal(state.nodes.Liver.canonicalOntologyId, 'FMA:7197')
})

test('OverrideMemoryStore.fromJSON restores immutable hardSafetyLock suppression floor and rejects corrupt payloads', () => {
  const store = new OverrideMemoryStore()
  store.recordOverride('rule-hyperk', 'clinical_red_flag', true, 'K >= 6.5 mEq/L')
  store.recordOverride('rule-hydration', 'lifestyle', false, 'Low urgency reminder')
  store.recordOverride('rule-hydration', 'lifestyle', false, 'Low urgency reminder 2')

  const restored = OverrideMemoryStore.fromJSON(store.toJSON())
  assert.deepEqual(restored.shouldSuppressAlert('rule-hyperk', false), {
    suppressed: false,
    overrideCount: 1,
    lockEnforced: true,
  })
  assert.deepEqual(restored.shouldSuppressAlert('rule-hydration', false), {
    suppressed: true,
    overrideCount: 2,
    lockEnforced: false,
  })
  assert.throws(() => OverrideMemoryStore.fromJSON({ audit: [{ ruleKey: '' }] }), TypeError)
  assert.throws(() => OverrideMemoryStore.fromJSON(null), TypeError)
})

test('mapLodPlanToGlbLayers isolates Quiet Mode <= 1.8 MB shell and maps 2.5D fallback to zero GLBs', () => {
  const quietPlan = resolveActiveLodBundlePlan({
    tier: 'mobile_lod',
    mode: 'quiet',
    requestedSystems: ['cardiovascular', 'nervous'],
  })
  const quietMapped = mapLodPlanToGlbLayers(quietPlan)
  assert.deepEqual(quietMapped.layersToLoad, ['surface'])
  assert.equal(quietMapped.estimatedPayloadBytes, GLB_LAYER_ESTIMATED_BYTES.surface)
  assert.ok(quietMapped.estimatedPayloadBytes <= QUIET_MODE_MAX_BYTES)

  const splitCardio = resolveActiveLodBundlePlan({
    tier: 'mobile_lod',
    mode: 'split',
    requestedSystems: ['cardiovascular'],
  })
  assert.deepEqual(mapLodPlanToGlbLayers(splitCardio).layersToLoad, ['surface', 'cardiovascular'])

  const fallbackPlan = resolveActiveLodBundlePlan({
    tier: 'fallback_25d',
    mode: 'fullscreen',
    requestedSystems: ['cardiovascular', 'nervous'],
  })
  assert.deepEqual(mapLodPlanToGlbLayers(fallbackPlan), { layersToLoad: [], estimatedPayloadBytes: 0 })
})

test('inspectSelectedMesh resolves 1:1 ontology + TM1 overlay strictly without fuzzy matching', () => {
  const emptyState = buildRealityViewState({
    patientId: 'ui-inspect',
    mode: 'split',
    nowIso: '2026-11-23T12:00:00Z',
    timeAxisCursorIso: '2026-11-23T12:00:00Z',
    consentLedger: createPurposeConsentLedger(),
    readings: [],
  })

  const exact = inspectSelectedMesh('Left ventricle', emptyState, true)
  assert.equal(exact.resolution.selectable, true)
  assert.equal(exact.resolution.binding.canonicalOntologyId, 'FMA:7101')
  assert.ok(exact.tm1Metadata.icd11Tm1Code)
  assert.ok(exact.knowledgeGraphEdges.length > 0)

  const hiddenTm1 = inspectSelectedMesh('Left ventricle', emptyState, false)
  assert.equal(hiddenTm1.tm1Metadata.icd11Tm1Code, undefined)

  for (const invalid of ['left ventricle', 'Left ventricle ', 'Decorative_Outer_01', '']) {
    const res = inspectSelectedMesh(invalid, emptyState, true)
    assert.equal(res.resolution.selectable, false)
    assert.equal(res.resolution.binding, null)
    assert.deepEqual(res.knowledgeGraphEdges, [])
  }
})

test('evaluateLiveVaultAuthSession + assertOutboundClinicalSyncAuthorized fail closed for guests or locked vaults', () => {
  const now = 1_000_000
  const acc = { id: 'u1', email: 'u1@example.com', name: 'Dr. U', role: 'dokter', isSubscriber: false, loggedAt: new Date(now).toISOString() }

  const guestSession = evaluateLiveVaultAuthSession(
    acc,
    true,
    now,
    { token: '', sessionRaw: JSON.stringify({ loginAt: now, authProvider: 'guest' }) },
  )
  assert.equal(assertOutboundClinicalSyncAuthorized(guestSession, 'satusehat_fhir_r4', now).authorized, false)

  const lockedVault = evaluateLiveVaultAuthSession(
    acc,
    false,
    now,
    { token: 'tok-valid', sessionRaw: JSON.stringify({ loginAt: now, authProvider: 'google' }) },
  )
  assert.equal(assertOutboundClinicalSyncAuthorized(lockedVault, 'medgemma_inference', now).authorized, false)

  const unlockedGoogle = evaluateLiveVaultAuthSession(
    acc,
    true,
    now,
    { token: 'tok-valid', sessionRaw: JSON.stringify({ loginAt: now, authProvider: 'google' }) },
  )
  assert.equal(assertOutboundClinicalSyncAuthorized(unlockedGoogle, 'satusehat_fhir_r4', now).authorized, true)
  assert.equal(assertOutboundClinicalSyncAuthorized(unlockedGoogle, 'medgemma_inference', now).authorized, true)
})
