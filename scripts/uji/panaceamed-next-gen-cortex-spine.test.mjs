import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  PULSE_CATALOG_28, solveArterialTreeAndCunkouPulseClassifier, evaluateEpigeneticSenolyticControlPolicy,
  evaluateQuantumPgxPbpkAndSatusehatBundle, solvePanSpecialtyBayesianResuscitationCortex,
  aggregateFederatedDiscoveryMerkleCommons, verifyMerkleInclusionProof,
} from '../../src/core/panaceamedNextGenArgonCortex.mjs';
import {
  ANATOMICAL_PEEL_LAYERS_5, LockFreeTelemetryRingBuffer, runAdaptiveEkfAndPeakDetector,
  raycastBvhKayKajiyaSlab, buildWebGpuTissuePeelPipeline, mergeHybridClinicalCrdtStates,
  evaluateV2xAutonomousMedevacDispatch, handleNextGenEdgeHttpGateway, runPanaceaMedNextGenTandemOrchestrator,
} from '../../src/core/panaceamedNextGenHydrogenSpine.mjs';

const STANDARD_ARTERIAL_SEGMENTS = [
  { segmentId: 'ascending_aorta', lengthM: 0.08, radiusM: 0.014, wallThicknessM: 0.0016, youngsModulusPa: 4.2e5 },
  { segmentId: 'subclavian_artery', lengthM: 0.14, radiusM: 0.0045, wallThicknessM: 0.0007, youngsModulusPa: 6.0e5 },
  { segmentId: 'brachial_artery', lengthM: 0.22, radiusM: 0.0024, wallThicknessM: 0.00045, youngsModulusPa: 8.5e5 },
  { segmentId: 'radial_cunkou', lengthM: 0.18, radiusM: 0.0013, wallThicknessM: 0.00032, youngsModulusPa: 1.15e6 },
];

test('Test #91 (Wave 47): 1D Arterial Tree Navier-Stokes PWV, reflection Gamma_b/Gamma_f & 28-Pulse Wiry (Xian) classification', () => {
  const stiffSegments = STANDARD_ARTERIAL_SEGMENTS.map((s, idx) => (idx === 3 ? { ...s, youngsModulusPa: 1.95e6 } : s));
  const res = solveArterialTreeAndCunkouPulseClassifier({
    segments: stiffSegments, cardiacOutputLMin: 5.4, heartRateBpm: 76, terminalResistancePaSM3: 2.8e9,
    sdppgWaves: { a: 1.0, b: -0.42, c: -0.25, d: -0.41, e: 0.08 },
    cunkouTensor3x3: [[42, 58, 64], [45, 62, 66], [40, 55, 60]],
  });
  assert.equal(res.catalogSize, 28);
  assert.equal(PULSE_CATALOG_28.length, 28);
  assert.ok(res.segmentHydraulics[3].pwvMs > 9.5);
  assert.equal(res.classifiedPulse.id, 'xian_wiry');
  assert.equal(res.classifiedPulse.icd11Tm1Code, 'SF55');
  assert.equal(res.clinicallyReviewed, false);
});

test('Test #92 (Wave 47): Cunkou 3x3 depth tensor distinguishes Fu (Floating) vs Chen (Sinking) pulses', () => {
  const floating = solveArterialTreeAndCunkouPulseClassifier({
    segments: STANDARD_ARTERIAL_SEGMENTS, heartRateBpm: 72, terminalResistancePaSM3: 8.0e8,
    cunkouTensor3x3: [[68, 42, 28], [64, 40, 26], [62, 38, 25]],
  });
  assert.equal(floating.classifiedPulse.id, 'fu_floating');
  assert.equal(floating.classifiedPulse.icd11Tm1Code, 'SF50');
  const sinking = solveArterialTreeAndCunkouPulseClassifier({
    segments: STANDARD_ARTERIAL_SEGMENTS, heartRateBpm: 70, terminalResistancePaSM3: 8.0e8,
    cunkouTensor3x3: [[22, 44, 66], [24, 46, 68], [20, 42, 64]],
  });
  assert.equal(sinking.classifiedPulse.id, 'chen_sinking');
  assert.equal(sinking.classifiedPulse.icd11Tm1Code, 'SF51');
});

test('Test #93 (Wave 48): Multi-Omics Epigenetic & Senolytic Control achieves DunedinPACE < 0.75 while preserving hypertrophy', () => {
  const optimal = evaluateEpigeneticSenolyticControlPolicy({
    nadPlusToNadhRatio: 5.5, ampkActivation: 0.85, mtorc1Activation: 0.25, deltaPsiMMv: -172,
    saspCytokines: { il6PgMl: 0.7, tnfAlphaPgMl: 0.9, gdf15PgMl: 340, hsCrpMgL: 0.3 },
    fastingHoursPerDay: 18, zone2MinutesWeekly: 210, calisthenicsSessionsWeekly: 4,
    pulsedSenolyticActive: true, hoursBetweenSenolyticAndHypertrophy: 60,
  });
  assert.equal(optimal.dunedinPaceTargetMet, true);
  assert.ok(optimal.predictedDunedinPace < 0.75);
  assert.equal(optimal.anabolicCatabolicSeparationSafe, true);
  assert.equal(optimal.myofibrillarHypertrophyPreserved, true);
});

test('Test #94 (Wave 48): High SASP inflammation and <48h senolytic-hypertrophy overlap flags blunted hypertrophy', () => {
  const inflamed = evaluateEpigeneticSenolyticControlPolicy({
    nadPlusToNadhRatio: 1.2, ampkActivation: 0.3, mtorc1Activation: 0.7, deltaPsiMMv: -95,
    saspCytokines: { il6PgMl: 6.5, tnfAlphaPgMl: 7.2, gdf15PgMl: 1800, hsCrpMgL: 4.8 },
    fastingHoursPerDay: 10, zone2MinutesWeekly: 30, calisthenicsSessionsWeekly: 4,
    pulsedSenolyticActive: true, hoursBetweenSenolyticAndHypertrophy: 18,
  });
  assert.equal(inflamed.dunedinPaceTargetMet, false);
  assert.equal(inflamed.anabolicCatabolicSeparationSafe, false);
  assert.equal(inflamed.myofibrillarHypertrophyPreserved, false);
});

test('Test #95 (Wave 49): Indonesian HLA-B*15:02 +HLA-B*58:01 & CYP2C19 PM Clopidogrel contraindications emit SATUSEHAT FHIR Bundle', () => {
  const pgx = evaluateQuantumPgxPbpkAndSatusehatBundle({
    patientId: 'ihs-idn-001', ageYears: 58, sex: 'male', serumCreatinineMgDl: 1.3, childPughClass: 'B',
    baselineQtMs: 430, heartRateBpm: 68, hlaAlleles: ['HLA-B*15:02', 'HLA-B*58:01'],
    cypPhenotypes: { CYP2C19: 'poor_metabolizer', CYP3A4: 'normal_metabolizer' },
    transporterVariants: { SLCO1B1: 'c.521T>C_homozygous' },
    medications: [
      { drugName: 'Carbamazepine', rxNormCode: '2002', primaryEnzyme: 'CYP3A4', fractionMetabolized: 0.8 },
      { drugName: 'Allopurinol', rxNormCode: '519', primaryEnzyme: 'CYP3A4', fractionMetabolized: 0.2 },
      { drugName: 'Clopidogrel', rxNormCode: '32968', primaryEnzyme: 'CYP2C19', fractionMetabolized: 0.85 },
    ],
  });
  assert.equal(pgx.satusehatFhirBundle.resourceType, 'Bundle');
  assert.equal(pgx.satusehatFhirBundle.type, 'transaction');
  const codes = pgx.detectedIssues.map((i) => i.code);
  assert.ok(codes.includes('HLA-B*15:02-SJS-TEN-CONTRAINDICATION'));
  assert.ok(codes.includes('HLA-B*58:01-SCAR-CONTRAINDICATION'));
  assert.ok(codes.includes('CYP2C19-PM-CLOPIDOGREL-FAILURE'));
});

test('Test #96 (Wave 49): Multi-drug CYP3A4 inhibition + cumulative hERG blockade triggers Fridericia QTcF >= 500 ms TdP alert', () => {
  const tdp = evaluateQuantumPgxPbpkAndSatusehatBundle({
    patientId: 'ihs-idn-002', ageYears: 64, sex: 'female', serumCreatinineMgDl: 1.8, childPughClass: 'B',
    baselineQtMs: 445, heartRateBpm: 60, cypPhenotypes: { CYP3A4: 'intermediate_metabolizer' },
    medications: [
      { drugName: 'Clarithromycin', rxNormCode: '21212', primaryEnzyme: 'CYP3A4', inhibitsEnzyme: 'CYP3A4', unboundConcentrationUm: 4.5, inhibitionKiUm: 0.9, hergIc50Um: 8.0 },
      { drugName: 'Domperidone', rxNormCode: '3626', primaryEnzyme: 'CYP3A4', unboundConcentrationUm: 2.2, hergIc50Um: 3.5 },
    ],
  });
  assert.equal(tdp.torsadesRiskHigh, true);
  assert.ok(tdp.projectedQtcFMs >= 500);
  assert.ok(tdp.detectedIssues.some((d) => d.code === 'HERG-CUMULATIVE-QTCF-PROLONGATION'));
});

test('Test #97 (Wave 50): Pan-Specialty Neuro (Monro-Kellie CPP, Marshall CT), Cardio Acid-Base (Winters & Delta Ratio) & ENT/Ophtho', () => {
  const cortex = solvePanSpecialtyBayesianResuscitationCortex({
    priorProbability: 0.3, likelihoodRatios: [4.5, 2.8],
    neuro: { mapMmHg: 92, icpMmHg: 24, midlineShiftMm: 7, nihssScore: 14 },
    cardioIcu: { strokeVolumeMl: 65, heartRateBpm: 90, cvpMmHg: 10, naMmolL: 142, clMmolL: 100, hco3MmolL: 14, paco2MmHg: 29, albuminGdl: 3.0 },
    entOphtho: { airConductionDb: 45, boneConductionDb: 15, bppvCanal: 'horizontal', measuredIopMmHg: 22, centralCornealThicknessUm: 505 },
  });
  assert.ok(cortex.bayesianUpdate.posteriorProbability > 0.8);
  assert.equal(cortex.neuro.cppMmHg, 68);
  assert.equal(cortex.neuro.marshallCtClass, 'Marshall_IV_Midline_Shift_GT_5mm');
  assert.equal(cortex.neuro.lvoSuspected, true);
  assert.equal(cortex.cardioIcu.albuminCorrectedAnionGap, 30.5);
  assert.equal(cortex.cardioIcu.expectedWintersPaco2, 29);
  assert.equal(cortex.cardioIcu.wintersCompensationAppropriate, true);
  assert.equal(cortex.entOphtho.airBoneGapDb, 30);
  assert.equal(cortex.entOphtho.recommendedBppvManeuver, 'Barbecue_Roll_Lempert_270');
  assert.equal(cortex.entOphtho.ehlersCorrectedIopMmHg, 24.84);
});

test('Test #98 (Wave 50): Pan-Specialty Dengue Shock Syndrome (Delta Ht >= 20%), Holliday-Segar, Parkland Burn & Bühlmann ZHL-16C', () => {
  const cortex = solvePanSpecialtyBayesianResuscitationCortex({
    pedsInternal: { sledai2kScore: 12, ifnGeneSignatureHigh: true, weightKg: 24, baselineHematocritPct: 36, currentHematocritPct: 45, pulsePressureMmHg: 16, burnTbsaPct: 25 },
    hyperbaric: { depthMetersSeawater: 30, bottomTimeMinutes: 25, fractionO2: 0.32, compartmentHalfTimeMin: 12.5 },
  });
  assert.equal(cortex.pedsInternal.anifrolumabCandidate, true);
  assert.equal(cortex.pedsInternal.hollidaySegarMlHr, 64);
  assert.equal(cortex.pedsInternal.hematocritRisePct, 25);
  assert.equal(cortex.pedsInternal.dengueShockSyndromeDetected, true);
  assert.equal(cortex.pedsInternal.parklandTotal24hMl, 2400);
  assert.equal(cortex.pedsInternal.parklandFirst8hMl, 1200);
  assert.equal(cortex.hyperbaric.ambientPressureBar, 4);
  assert.equal(cortex.hyperbaric.ppO2Bar, 1.28);
  assert.equal(cortex.hyperbaric.maxOperatingDepthMeters, 33.8);
  assert.ok(cortex.hyperbaric.tissueN2TensionBar > 1.8);
});

test('Test #99 (Wave 51): Zero-Knowledge Federated Discovery Commons clips L2 gradients & verifies SHA-256 Merkle inclusion proof', () => {
  const makeNode = (nodeId, scalar, salt, grad) => ({
    nodeId, biomarkerScalar: scalar, salt,
    rangeCommitmentHash: createHash('sha256').update(`${nodeId}:${scalar}:${salt}`).digest('hex'), gradientVector: grad,
  });
  const fed = aggregateFederatedDiscoveryMerkleCommons({
    clippingNormBound: 1.0, privacyEpsilon: 1.0, privacyDelta: 1e-5, validRange: { min: 40, max: 250 },
    contributions: [makeNode('rsup-cipto-01', 96, 's1', [3.0, 4.0]), makeNode('rsud-soetomo-02', 112, 's2', [0.6, 0.8])],
  });
  assert.equal(fed.participantCount, 2);
  assert.deepEqual(fed.meanClippedGradient, [0.6, 0.8]);
  assert.equal(fed.leafHashes.length, 2);
  assert.equal(verifyMerkleInclusionProof(fed.leafHashes[0], [{ position: 'right', siblingHash: fed.leafHashes[1] }], fed.merkleRoot), true);
});

test('Test #100 (Wave 51): Zero-Knowledge Federated Commons rejects out-of-range or tampered commitment nodes', () => {
  assert.throws(() => aggregateFederatedDiscoveryMerkleCommons({
    validRange: { min: 50, max: 180 },
    contributions: [{ nodeId: 'tampered-edge-node', biomarkerScalar: 999, salt: 'bad', gradientVector: [0.1, 0.2] }],
  }), /zero-knowledge range or commitment verification failed/);
});

test('Test #101 (Wave 56): Lock-Free Float64Array RingBuffer wraps circularly without allocation loss', () => {
  const rb = new LockFreeTelemetryRingBuffer(4);
  for (let i = 1; i <= 6; i += 1) rb.pushSample(i * 0.1, 1.0, 800 + i, 36.5);
  const win = rb.readLatestWindow(4);
  assert.equal(win.length, 16);
  assert.equal(Math.round(win[0] * 10), 3);
  assert.equal(Math.round(win[12] * 10), 6);
});

test('Test #102 (Wave 56): Adaptive EKF suppresses high-g calisthenics motion artifacts and detects PPG systolic peaks', () => {
  const rb = new LockFreeTelemetryRingBuffer(16);
  [0.2, 0.82, 0.25, 0.15, 0.22, 0.88, 0.2, 0.18, 0.25, 0.91, 0.22, 0.15].forEach((val, idx) => rb.pushSample(val, idx === 4 ? 3.4 : 1.0, 820, 36.6));
  const ekf = runAdaptiveEkfAndPeakDetector(rb.readLatestWindow(12), { peakThreshold: 0.45, minRefractorySamples: 3 });
  assert.equal(ekf.motionArtifactSuppressedCount, 1);
  assert.ok(ekf.peakIndices.length >= 2);
});

test('Test #103 (Wave 57): Kay-Kajiya Slab Ray-AABB BVH resolves closest anatomical organ hit deterministically', () => {
  const nodes = [
    { nodeId: 'pectoralis_major', snomedCode: '60005003', min: [-10, -10, 5], max: [10, 10, 15] },
    { nodeId: 'left_ventricle_myocardium', snomedCode: '87878005', min: [-8, -8, 25], max: [8, 8, 45] },
  ];
  const hit = raycastBvhKayKajiyaSlab([0, 0, 0], [0, 0, 1], nodes);
  assert.equal(hit.hit, true);
  assert.equal(hit.nodeId, 'pectoralis_major');
  assert.equal(hit.distanceT, 5);
});

test('Test #104 (Wave 57): WebGPU 5-Stage Tissue Layer Peel & Draco Mesh LOD auto-downscaling when VRAM > 85%', () => {
  assert.equal(ANATOMICAL_PEEL_LAYERS_5.length, 5);
  const pipeline = buildWebGpuTissuePeelPipeline({ clipDepthMm: 64, vramUtilizationPct: 91, myocardialPerfusionIndex: 0.88 });
  assert.equal(pipeline.activePeelStage, 4);
  assert.equal(pipeline.activePeelLayerId, 'neurovascular');
  assert.equal(pipeline.selectedDracoLod, 'LOD2');
  assert.ok(pipeline.wgslShaderSource.includes('@compute @workgroup_size(64)'));
});

test('Test #105 (Wave 58): Hybrid Lamport + Vector Clock CRDT resolves concurrent edits using ATTENDING_PHYSICIAN precedence', () => {
  const merged = mergeHybridClinicalCrdtStates([
    { nodeId: 'patient-wearable-01', role: 'PATIENT_SELF_REPORT', lamport: 19, vectorClock: { n1: 5, n2: 1 }, payload: { mapTargetMmHg: 70 } },
    { nodeId: 'icu-ipad-attending', role: 'ATTENDING_PHYSICIAN', lamport: 14, vectorClock: { n1: 3, n2: 4 }, payload: { mapTargetMmHg: 65 } },
  ]);
  assert.equal(merged.winningRole, 'ATTENDING_PHYSICIAN');
  assert.equal(merged.winningNodeId, 'icu-ipad-attending');
  assert.equal(merged.nextLamportClock, 20);
  assert.deepEqual(merged.mergedVectorClock, { n1: 5, n2: 4 });
});

test('Test #106 (Wave 58): Hybrid CRDT breaks equal-role ties deterministically via Lamport clock then nodeId', () => {
  const merged = mergeHybridClinicalCrdtStates([
    { nodeId: 'koas-a', role: 'RESIDENT_KOAS', lamport: 10, vectorClock: { a: 2 }, payload: { note: 'v1' } },
    { nodeId: 'koas-b', role: 'RESIDENT_KOAS', lamport: 12, vectorClock: { b: 3 }, payload: { note: 'v2' } },
  ]);
  assert.equal(merged.winningNodeId, 'koas-b');
  assert.equal(merged.resolvedPayload.note, 'v2');
});

test('Test #107 (Wave 59): V2X Autonomous Medevac FSM triggers CATH_LAB_PRIMARY_PCI on ST-elevation >= 2.0 mm', () => {
  const v2x = evaluateV2xAutonomousMedevacDispatch({ patientId: 'ihs-stemi-09', stElevationMm: 2.6, cppMmHg: 74 });
  assert.equal(v2x.emergencyTriggered, true);
  assert.equal(v2x.fsmState, 'V2X_AUTONOMOUS_INTERCEPT_ACTIVE');
  assert.equal(v2x.targetUnit, 'CATH_LAB_PRIMARY_PCI');
  assert.equal(v2x.cabinEffectors.l4PodLocked, true);
  assert.equal(v2x.cabinEffectors.fio2TargetFraction, 0.4);
});

test('Test #108 (Wave 59): V2X Autonomous Medevac remains passive during stable baseline physiological drift', () => {
  const calm = evaluateV2xAutonomousMedevacDispatch({ patientId: 'ihs-stable-01', stElevationMm: 0.2, lvoStrokeAsymmetry: false, cppMmHg: 80, mahalanobisDriftZ: 0.9 });
  assert.equal(calm.emergencyTriggered, false);
  assert.equal(calm.fsmState, 'CONTINUOUS_PASSIVE_SURVEILLANCE');
  assert.equal(calm.cabinEffectors.l4PodLocked, false);
});

test('Test #109 (Wave 60): Sub-Millisecond HTTP Gateway serves /healthz and /body-exposure Dark Glassmorphism Cockpit', () => {
  const health = handleNextGenEdgeHttpGateway({ method: 'GET', path: '/healthz' });
  assert.equal(health.statusCode, 200);
  assert.equal(JSON.parse(health.body).status, 'ok');
  const cockpit = handleNextGenEdgeHttpGateway({ method: 'GET', path: '/body-exposure' });
  assert.equal(cockpit.statusCode, 200);
  assert.ok(cockpit.body.includes('data-surface="body-exposure-webgpu-cockpit"'));
});

test('Test #110 (Wave 60): Sub-Millisecond HTTP Gateway serves /api/v2/nextgen/telemetry & Tandem Orchestrator SHA-256 seal', () => {
  const tel = handleNextGenEdgeHttpGateway({ method: 'GET', path: '/api/v2/nextgen/telemetry' });
  const parsed = JSON.parse(tel.body);
  assert.equal(tel.statusCode, 200);
  assert.equal(parsed.clinicallyReviewed, false);
  assert.equal(parsed.requiresHumanPhysicianSignoff, true);
  const tandem = runPanaceaMedNextGenTandemOrchestrator();
  assert.equal(tandem.tandemSha256Seal.length, 64);
  assert.equal(tandem.clinicallyReviewed, false);
});
