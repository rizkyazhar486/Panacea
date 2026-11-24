import assert from 'node:assert/strict'
import {
  ALL_20_CAUSAL_RELATIONS,
  BIOLOGICAL_SCALE_ORDER,
  MULTISCALE_CAUSAL_EDGES,
  MULTISCALE_ENTITY_REGISTRY,
  computeMichaelisMentenVelocity,
  computeReceptorOccupancy,
  getEntityNeighborhood,
  searchMultiscaleEntities,
  simulateFirstOrderPharmacokinetics,
  simulateGeneExpressionOde,
  traceSemanticZoomPath,
} from '../../src/engines/reality-view/multiscaleRealityGraph.ts'
import {
  computeCoRegisteredOrganScales,
  createSanitizedBiometricTwinProfile,
  decryptSocialTwinFromCloud,
  encryptSocialTwinForCloud,
  mintPersonalizedTwinBarcode,
  verifyPersonalizedTwinBarcode,
} from '../../src/engines/reality-view/personifiedSocialTwinVault.ts'

// 1. Canonical 20 relations & 11 scales & provenance enforcement
assert.equal(ALL_20_CAUSAL_RELATIONS.length, 20)
assert.equal(BIOLOGICAL_SCALE_ORDER.length, 11)
assert.ok(MULTISCALE_ENTITY_REGISTRY.length >= 20)
for (const entity of MULTISCALE_ENTITY_REGISTRY) {
  assert.ok(entity.provenance.citations.length >= 1, `missing citation on ${entity.id}`)
  assert.ok(entity.summaryPatient.id.length > 5 && entity.summaryClinician.en.length > 5)
}

// 2. Bidirectional Infinite Semantic Zoom paths + Spatial vs Conceptual registration marker
const heartToMito = traceSemanticZoomPath('human_twin', 'org_mitochondrion')
assert.equal(heartToMito.length, 6, `expected 6-hop multiscale path, got ${heartToMito.length}`)
assert.equal(heartToMito[1].spatialRegistration, 'SPATIALLY_REGISTERED')
assert.equal(heartToMito[3].spatialRegistration, 'CONCEPTUAL_SCALE_BRIDGE')

const geneToHeart = traceSemanticZoomPath('gene_myh7', 'organ_heart')
assert.ok(geneToHeart.length >= 3, 'MYH7 must traverse upward to heart')

const drugToCad = traceSemanticZoomPath('drug_atorvastatin', 'disease_cad')
assert.equal(drugToCad.length, 2)
assert.equal(drugToCad[1].viaEdge?.relation, 'PREVENTS')

const kidneyNeighborhood = getEntityNeighborhood('prot_sglt2')
assert.ok(kidneyNeighborhood.incoming.some((e) => e.fromNodeId === 'drug_empagliflozin' && e.relation === 'INHIBITS'))
assert.ok(searchMultiscaleEntities('CFTR').some((n) => n.id === 'gene_cftr'))

// 3. Deterministic Mathematical & Pharmacological Solvers (Section 22)
const mm = computeMichaelisMentenVelocity({ substrateUm: 10, vmaxUmPerMin: 100, kmUm: 10 })
assert.equal(mm.velocityUmPerMin, 50)
assert.equal(mm.saturationFraction, 0.5)
assert.equal(mm.epistemicProvenance.source, 'MECHANISTIC_SIMULATION')

const occ = computeReceptorOccupancy({ ligandNm: 5, kdNm: 5, hillCoeff: 1 })
assert.equal(occ.occupancyFraction, 0.5)
assert.equal(occ.occupancyPct, 50)

const pk = simulateFirstOrderPharmacokinetics({
  doseMg: 100,
  volumeDistributionL: 50,
  bioavailabilityF: 1.0,
  eliminationRateKPerHr: Math.LN2 / 12,
  durationHr: 24,
  stepHr: 6,
})
assert.equal(pk.initialConcentrationMgL, 2)
assert.equal(pk.halfLifeHr, 12)
const c12 = pk.curve.find((p) => p.hour === 12)
assert.ok(c12 && Math.abs(c12.concentrationMgL - 1.0) < 0.01, `expected C(t1/2)=1.0, got ${c12?.concentrationMgL}`)

const geneOde = simulateGeneExpressionOde({
  transcriptionRateKt: 12,
  mrnaDecayGammaM: 0.6,
  translationRateKp: 4,
  proteinDecayGammaP: 0.2,
  durationHr: 48,
  stepHr: 2,
})
assert.equal(geneOde.steadyStateMrna, 20)
assert.equal(geneOde.steadyStateProtein, 400)
const lastPoint = geneOde.trajectory[geneOde.trajectory.length - 1]
assert.ok(Math.abs(lastPoint.mrna - 20) < 0.05)
assert.ok(lastPoint.protein > 390)

// 4. Persistent Cloud Personified Twin + Privacy Gate 4 + Organ Co-Registration
const { profile, rawPhotoPurged } = createSanitizedBiometricTwinProfile({
  profileId: 'twin_rizky_01',
  personaHandle: 'dr.rizky',
  cohortId: 'YAD_M',
  ageYears: 34,
  biologicalSex: 'male',
  heightCm: 175,
  weightKg: 74,
  waistCm: 84,
  morphWeights: { torsoAthletic: 0.72, overflowWeight: 4.5, negativeWeight: -2 },
  rawSourcePhotoDataUrl: 'data:image/jpeg;base64,/9j/SENSITIVE_FACE_BYTES',
  retainPhotoInEncryptedVault: false,
  consentTimestampISO: '2026-11-24T04:00:00.000Z',
  streakDays: 21,
})

assert.equal(rawPhotoPurged, true)
assert.equal(profile.privacyPolicy.rawPhotoRetained, false)
assert.equal(JSON.stringify(profile).includes('SENSITIVE_FACE_BYTES'), false, 'raw photo leaked into profile!')
assert.equal(profile.morphWeights.overflowWeight, 1)
assert.equal(profile.morphWeights.negativeWeight, 0)
assert.equal(profile.cloudSyncState, 'CLOUD_SYNC_QUEUED')

const scales = computeCoRegisteredOrganScales({ heightCm: 195, weightKg: 110, waistCm: 110 })
for (const dims of Object.values(scales)) {
  for (const s of dims) {
    assert.ok(s >= 0.72 && s <= 1.38, `organ scale ${s} out of safe anatomical bounds`)
  }
}

// 5. Cryptographic Personalized Social Twin Barcode (SHA-256, zero raw PHI) + Tamper Rejection
const barcode = await mintPersonalizedTwinBarcode(profile)
assert.equal(barcode.containsRawPhi, false)
assert.ok(barcode.payload.startsWith('PMD-TWIN-V1:'))
assert.equal(barcode.bars.length, 48)
assert.equal(await verifyPersonalizedTwinBarcode(barcode.payload), true)
assert.equal(await verifyPersonalizedTwinBarcode(barcode.payload.replace('dr.rizky', 'spoofed')), false)

// 6. Zero-Knowledge AES-GCM Cloud Sync Envelope Round-Trip + Wrong-Key Fail-Closed
const key = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
const wrongKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
const envelope = await encryptSocialTwinForCloud(profile, key, '2026-11-24T04:10:00.000Z')
assert.equal(envelope.ciphertextBase64.includes('dr.rizky'), false)
const restored = await decryptSocialTwinFromCloud(envelope, key)
assert.equal(restored.profileId, profile.profileId)
assert.equal(restored.personaHandle, 'dr.rizky')
assert.equal(restored.dailyMonitoring.streakDays, 21)
await assert.rejects(() => decryptSocialTwinFromCloud(envelope, wrongKey))

console.log(
  `multiscale-reality-and-social-twin: ${MULTISCALE_ENTITY_REGISTRY.length} entities, ${MULTISCALE_CAUSAL_EDGES.length} edges, 6-hop zoom, MM/Hill/PK/RK4-ODE, Gate-4 photo purge, SHA-256 barcode (${barcode.shortDigestHex}), AES-GCM cloud vault PASS`,
)
