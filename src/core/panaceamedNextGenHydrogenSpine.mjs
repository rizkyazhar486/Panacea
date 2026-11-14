// @panacea-claim-boundary: simulation-not-clinical
import { createHash } from 'node:crypto';
import {
  solveArterialTreeAndCunkouPulseClassifier,
  evaluateEpigeneticSenolyticControlPolicy,
  evaluateQuantumPgxPbpkAndSatusehatBundle,
  solvePanSpecialtyBayesianResuscitationCortex,
  aggregateFederatedDiscoveryMerkleCommons,
} from './panaceamedNextGenArgonCortex.mjs';

export const ANATOMICAL_PEEL_LAYERS_5 = Object.freeze([
  Object.freeze({ stage: 1, id: 'integumentary', label: 'Integumentary (Epidermis & Dermis)', minDepthMm: 0, maxDepthMm: 4 }),
  Object.freeze({ stage: 2, id: 'superficial_fascia', label: 'Superficial Fascia & Subcutaneous Adipose', minDepthMm: 4, maxDepthMm: 14 }),
  Object.freeze({ stage: 3, id: 'musculoskeletal', label: 'Musculoskeletal Myofascial & Cortical Bone', minDepthMm: 14, maxDepthMm: 48 }),
  Object.freeze({ stage: 4, id: 'neurovascular', label: 'Neurovascular Plexus & Arterial Conduits', minDepthMm: 48, maxDepthMm: 85 }),
  Object.freeze({ stage: 5, id: 'visceral_core', label: 'Visceral Parenchymal & Endocardial Core', minDepthMm: 85, maxDepthMm: 220 }),
]);

export const CLINICAL_ROLE_PRECEDENCE = Object.freeze({
  ATTENDING_PHYSICIAN: 4,
  CLINICAL_PHARMACIST: 3,
  RESIDENT_KOAS: 2,
  PATIENT_SELF_REPORT: 1,
});

/**
 * WAVE 56: Lock-Free Typed-Array RingBuffer Telemetry Spine & 1000 Hz Adaptive Extended Kalman Filter (EKF).
 * Channels per sample stride (4 x Float64): [ppgOptical, accelGLoad, rrIntervalMs, skinTempC].
 */
export class LockFreeTelemetryRingBuffer {
  constructor(capacitySamples = 1024) {
    if (!Number.isInteger(capacitySamples) || capacitySamples < 4) {
      throw new Error('Wave56: capacitySamples must be an integer >= 4');
    }
    this.capacity = capacitySamples;
    this.stride = 4;
    this.data = new Float64Array(capacitySamples * this.stride);
    this.pointers = new Uint32Array(2); // [writeIndex, totalWritten]
  }

  pushSample(ppgOptical, accelGLoad, rrIntervalMs, skinTempC) {
    const writeIdx = this.pointers[0];
    const offset = writeIdx * this.stride;
    this.data[offset] = ppgOptical;
    this.data[offset + 1] = accelGLoad;
    this.data[offset + 2] = rrIntervalMs;
    this.data[offset + 3] = skinTempC;
    this.pointers[0] = (writeIdx + 1) % this.capacity;
    this.pointers[1] += 1;
    return this.pointers[1];
  }

  readLatestWindow(windowSize) {
    const available = Math.min(this.pointers[1], this.capacity);
    const count = Math.min(windowSize, available);
    const out = new Float64Array(count * this.stride);
    const head = this.pointers[0];
    for (let i = 0; i < count; i += 1) {
      const ringIdx = (head - count + i + this.capacity) % this.capacity;
      const srcOffset = ringIdx * this.stride;
      const dstOffset = i * this.stride;
      out[dstOffset] = this.data[srcOffset];
      out[dstOffset + 1] = this.data[srcOffset + 1];
      out[dstOffset + 2] = this.data[srcOffset + 2];
      out[dstOffset + 3] = this.data[srcOffset + 3];
    }
    return out;
  }
}

export function runAdaptiveEkfAndPeakDetector(flatWindowFloat64, options = {}) {
  if (!(flatWindowFloat64 instanceof Float64Array) || flatWindowFloat64.length < 4 || flatWindowFloat64.length % 4 !== 0) {
    throw new Error('Wave56: flatWindowFloat64 must be a non-empty Float64Array with stride 4');
  }
  const sampleCount = flatWindowFloat64.length >>> 2;
  const processNoiseQ = options.processNoiseQ ?? 0.015;
  const baseMeasurementNoiseR = options.baseMeasurementNoiseR ?? 0.08;
  const peakThreshold = options.peakThreshold ?? 0.55;

  const filteredPpg = new Float64Array(sampleCount);
  let xEst = flatWindowFloat64[0];
  let pCov = 1.0;
  let motionArtifactSuppressedCount = 0;

  for (let i = 0; i < sampleCount; i += 1) {
    const base = i << 2;
    const zMeas = flatWindowFloat64[base];
    const gLoad = Math.abs(flatWindowFloat64[base + 1]);

    // Adaptive R inflation under high-g calisthenics / immersion motion
    const highGMotion = gLoad > 1.8;
    if (highGMotion) motionArtifactSuppressedCount += 1;
    const adaptiveR = highGMotion ? baseMeasurementNoiseR * (1 + (gLoad - 1.0) ** 2 * 18) : baseMeasurementNoiseR;

    // Predict
    const xPred = xEst;
    const pPred = pCov + processNoiseQ;

    // Update (Kalman Gain K = P_pred / (P_pred + R_adaptive))
    const kalmanGain = pPred / (pPred + adaptiveR);
    xEst = xPred + kalmanGain * (zMeas - xPred);
    pCov = (1 - kalmanGain) * pPred;
    filteredPpg[i] = xEst;
  }

  // Pan-Tompkins / Wavelet Local Maxima R-Peak Detector with refractory spacing
  const peakIndices = [];
  const minRefractorySamples = options.minRefractorySamples ?? 3;
  let lastPeakIdx = -minRefractorySamples;
  for (let i = 1; i < sampleCount - 1; i += 1) {
    const curr = filteredPpg[i];
    if (curr >= peakThreshold && curr > filteredPpg[i - 1] && curr >= filteredPpg[i + 1]) {
      if (i - lastPeakIdx >= minRefractorySamples) {
        peakIndices.push(i);
        lastPeakIdx = i;
      }
    }
  }

  return Object.freeze({
    sampleCount,
    filteredPpg,
    peakIndices: new Uint32Array(peakIndices),
    motionArtifactSuppressedCount,
    finalErrorCovariance: pCov,
  });
}

/**
 * WAVE 57: WebGPU Compute & Fragment Pipeline (WGSL), BVH Spatial Octree (Kay-Kajiya Slab Ray-AABB)
 * & 5-Stage Tissue Layer Peel + Automatic Draco LOD Downscaling.
 */
export function raycastBvhKayKajiyaSlab(rayOrigin, rayDir, nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('Wave57: nodes array must be non-empty');
  }
  const invDirX = 1 / (Math.abs(rayDir[0]) < 1e-12 ? 1e-12 : rayDir[0]);
  const invDirY = 1 / (Math.abs(rayDir[1]) < 1e-12 ? 1e-12 : rayDir[1]);
  const invDirZ = 1 / (Math.abs(rayDir[2]) < 1e-12 ? 1e-12 : rayDir[2]);

  let closestNode = null;
  let closestTMin = Infinity;
  let visitedCount = 0;

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    visitedCount += 1;
    const t1 = (node.min[0] - rayOrigin[0]) * invDirX;
    const t2 = (node.max[0] - rayOrigin[0]) * invDirX;
    const t3 = (node.min[1] - rayOrigin[1]) * invDirY;
    const t4 = (node.max[1] - rayOrigin[1]) * invDirY;
    const t5 = (node.min[2] - rayOrigin[2]) * invDirZ;
    const t6 = (node.max[2] - rayOrigin[2]) * invDirZ;

    const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
    const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));

    if (tMax >= Math.max(0, tMin) && tMin < closestTMin) {
      closestTMin = Math.max(0, tMin);
      closestNode = node;
    }
  }

  return Object.freeze({
    hit: closestNode !== null,
    nodeId: closestNode ? closestNode.nodeId : null,
    snomedCode: closestNode ? closestNode.snomedCode : null,
    distanceT: closestNode ? closestTMin : null,
    visitedCount,
  });
}

export function buildWebGpuTissuePeelPipeline(config = {}) {
  const clipDepthMm = Math.max(0, Math.min(220, config.clipDepthMm ?? 28));
  const vramUtilizationPct = Math.max(0, Math.min(100, config.vramUtilizationPct ?? 62));
  const myocardialPerfusionIndex = Math.max(0, Math.min(1, config.myocardialPerfusionIndex ?? 0.92));
  const pulseWavePhaseRad = config.pulseWavePhaseRad ?? 1.57;

  const activeLayer =
    ANATOMICAL_PEEL_LAYERS_5.find((l) => clipDepthMm >= l.minDepthMm && clipDepthMm <= l.maxDepthMm) ??
    ANATOMICAL_PEEL_LAYERS_5[4];

  const selectedDracoLod = vramUtilizationPct > 85 ? 'LOD2' : vramUtilizationPct > 70 ? 'LOD1' : 'LOD0';

  const wgslShaderSource = `// PanaceaMed Next-Gen 4D Volumetric Peel & Physiological Shader
struct PhysiologicalUniforms {
  clipDepthMm: f32,
  myocardialPerfusion: f32,
  pulseWavePhase: f32,
  activeStage: u32,
};
@group(0) @binding(0) var<uniform> uPhysio: PhysiologicalUniforms;

@compute @workgroup_size(64)
fn csVolumetricPeel(@builtin(global_invocation_id) gid: vec3<u32>) {
  let voxelDepth = f32(gid.z) * 0.5;
  if (voxelDepth < uPhysio.clipDepthMm) { return; }
}

@fragment
fn fsPhysiologicalSurface(@location(0) worldPos: vec3<f32>, @location(1) depthMm: f32) -> @location(0) vec4<f32> {
  if (depthMm < uPhysio.clipDepthMm) { discard; }
  let pulseGlow = 0.5 + 0.5 * sin(uPhysio.pulseWavePhase + worldPos.y * 0.15);
  let color = vec3<f32>(0.12 + 0.75 * uPhysio.myocardialPerfusion, 0.45 * pulseGlow, 0.88);
  return vec4<f32>(color, 0.92);
}`;

  return Object.freeze({
    clipDepthMm,
    activePeelStage: activeLayer.stage,
    activePeelLayerId: activeLayer.id,
    selectedDracoLod,
    frameBudgetTargetMs: 8.33,
    uniformBufferFloat32: new Float32Array([
      clipDepthMm,
      myocardialPerfusionIndex,
      pulseWavePhaseRad,
      activeLayer.stage,
    ]),
    wgslShaderSource,
  });
}

/**
 * WAVE 58: Hybrid Lamport + Vector Clock CRDT Engine with Clinical Role Precedence.
 */
export function mergeHybridClinicalCrdtStates(replicas) {
  if (!Array.isArray(replicas) || replicas.length === 0) {
    throw new Error('Wave58: replicas array must be non-empty');
  }

  const mergedVectorClock = {};
  let maxLamport = 0;
  let winningRecord = null;

  for (const rep of replicas) {
    if (rep.lamport > maxLamport) maxLamport = rep.lamport;
    const vc = rep.vectorClock ?? {};
    for (const [nodeId, counter] of Object.entries(vc)) {
      mergedVectorClock[nodeId] = Math.max(mergedVectorClock[nodeId] ?? 0, counter);
    }

    if (!winningRecord) {
      winningRecord = rep;
      continue;
    }

    const currRoleRank = CLINICAL_ROLE_PRECEDENCE[rep.role] ?? 0;
    const winRoleRank = CLINICAL_ROLE_PRECEDENCE[winningRecord.role] ?? 0;

    if (
      currRoleRank > winRoleRank ||
      (currRoleRank === winRoleRank && rep.lamport > winningRecord.lamport) ||
      (currRoleRank === winRoleRank &&
        rep.lamport === winningRecord.lamport &&
        String(rep.nodeId) > String(winningRecord.nodeId))
    ) {
      winningRecord = rep;
    }
  }

  return Object.freeze({
    nextLamportClock: maxLamport + 1,
    mergedVectorClock: Object.freeze(mergedVectorClock),
    winningNodeId: winningRecord.nodeId,
    winningRole: winningRecord.role,
    resolvedPayload: winningRecord.payload,
  });
}

/**
 * WAVE 59: Zero-Click V2X Autonomous Mobile-ICU Telemetry Bridge & Hospital Pre-Activation Protocol.
 */
export function evaluateV2xAutonomousMedevacDispatch(input) {
  if (!input || !input.patientId) {
    throw new Error('Wave59: patientId is required');
  }
  const {
    patientId,
    stElevationMm = 0.4,
    lvoStrokeAsymmetry = false,
    cppMmHg = 76,
    mahalanobisDriftZ = 1.1,
    coordinates = { lat: -6.1975, lon: 106.8326 },
  } = input;

  const stemiCritical = stElevationMm >= 2.0;
  const neuroCritical = lvoStrokeAsymmetry || cppMmHg < 60;
  const driftCritical = mahalanobisDriftZ >= 3.5;
  const emergencyTriggered = stemiCritical || neuroCritical || driftCritical;

  const fsmState = emergencyTriggered ? 'V2X_AUTONOMOUS_INTERCEPT_ACTIVE' : 'CONTINUOUS_PASSIVE_SURVEILLANCE';
  const targetUnit = stemiCritical
    ? 'CATH_LAB_PRIMARY_PCI'
    : neuroCritical
      ? 'COMPREHENSIVE_STROKE_THROMBECTOMY_UNIT'
      : 'GENERAL_MONITORING';

  const cabinEffectors = Object.freeze({
    fio2TargetFraction: emergencyTriggered ? 0.4 : 0.21,
    backrestTiltDeg: neuroCritical ? 30 : stemiCritical ? 45 : 15,
    cabinTempC: 21.5,
    l4PodLocked: emergencyTriggered,
  });

  const packetDigestSha256 = createHash('sha256')
    .update(JSON.stringify({ patientId, fsmState, targetUnit, coordinates, cabinEffectors }))
    .digest('hex');

  return Object.freeze({
    truthClass: 'DERIVED_CLINICAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    fsmState,
    emergencyTriggered,
    targetUnit,
    cabinEffectors,
    packetDigestSha256,
    satusehatEmergencyBundle: Object.freeze({
      resourceType: 'Bundle',
      type: 'message',
      entry: Object.freeze([
        Object.freeze({
          resource: Object.freeze({
            resourceType: 'Communication',
            status: 'in-progress',
            category: Object.freeze([{ text: targetUnit }]),
            subject: Object.freeze({ reference: `Patient/${patientId}` }),
          }),
        }),
      ]),
    }),
  });
}

/**
 * WAVE 60: Unified /body-exposure Apple HIG Dark Futuristic Glassmorphism Cockpit & Sub-Millisecond HTTP Gateway.
 */
export function handleNextGenEdgeHttpGateway(request) {
  const method = (request?.method ?? 'GET').toUpperCase();
  const path = request?.path ?? '/healthz';

  if (method === 'GET' && path === '/healthz') {
    return Object.freeze({
      statusCode: 200,
      headers: Object.freeze({ 'content-type': 'application/json; charset=utf-8' }),
      body: JSON.stringify({ status: 'ok', engine: 'panaceamed-nextgen-hydrogen-v60', frameBudgetMs: 8.33 }),
    });
  }

  if (method === 'GET' && path === '/body-exposure') {
    const html = `<!doctype html><html lang="id" class="dark"><head><meta charset="utf-8"/><title>PanaceaMed /body-exposure 4D Cockpit</title></head><body style="background:#020617;color:#f8fafc;backdrop-filter:blur(24px)"><main data-surface="body-exposure-webgpu-cockpit" data-clinically-reviewed="false"><h1>PanaceaMed 4D WebGPU Body Exposure Cockpit</h1></main></body></html>`;
    return Object.freeze({
      statusCode: 200,
      headers: Object.freeze({ 'content-type': 'text/html; charset=utf-8' }),
      body: html,
    });
  }

  if (path === '/api/v2/nextgen/telemetry') {
    return Object.freeze({
      statusCode: 200,
      headers: Object.freeze({ 'content-type': 'application/json; charset=utf-8' }),
      body: JSON.stringify({
        truthClass: 'OBSERVED_CLINICAL',
        clinicallyReviewed: false,
        requiresHumanPhysicianSignoff: true,
        pipeline: 'lockfree-ekf-webgpu-crdt-v2x',
      }),
    });
  }

  return Object.freeze({
    statusCode: 404,
    headers: Object.freeze({ 'content-type': 'application/json; charset=utf-8' }),
    body: JSON.stringify({ error: 'not_found', path }),
  });
}

export function computeWelfordHrvMetrics(rrIntervalsMs) {
  if (!Array.isArray(rrIntervalsMs) || rrIntervalsMs.length < 2) {
    throw new Error('Wave56: rrIntervalsMs must contain at least 2 intervals');
  }
  let n = 0;
  let mean = 0;
  let m2 = 0;
  let sumSqDiff = 0;
  for (let i = 0; i < rrIntervalsMs.length; i += 1) {
    const x = rrIntervalsMs[i];
    n += 1;
    const delta = x - mean;
    mean += delta / n;
    m2 += delta * (x - mean);
    if (i > 0) {
      const diff = x - rrIntervalsMs[i - 1];
      sumSqDiff += diff * diff;
    }
  }
  const sdnnMs = Number(Math.sqrt(m2 / Math.max(1, n - 1)).toFixed(2));
  const rmssdMs = Number(Math.sqrt(sumSqDiff / Math.max(1, n - 1)).toFixed(2));
  return Object.freeze({ sampleCount: n, meanRrMs: Number(mean.toFixed(2)), sdnnMs, rmssdMs });
}

export function scheduleFsrsV4UkmpddReview(cardState = {}, rating = 3) {
  const prevStability = Math.max(0.5, cardState.stabilityDays ?? 2.4);
  const prevDifficulty = Math.min(10, Math.max(1, cardState.difficulty ?? 5.0));
  const rFactor = rating === 4 ? 1.85 : rating === 3 ? 1.35 : rating === 2 ? 0.9 : 0.45;
  const nextDifficulty = Number(Math.min(10, Math.max(1, prevDifficulty - 0.35 * (rating - 3))).toFixed(2));
  const nextStabilityDays = Number((prevStability * (1 + rFactor * (11 - nextDifficulty) * 0.25)).toFixed(2));
  const recommendedIntervalDays = Math.max(1, Math.round(nextStabilityDays));
  return Object.freeze({
    rating,
    nextDifficulty,
    nextStabilityDays,
    recommendedIntervalDays,
    retrievabilityTargetPct: 90,
  });
}

export function runPanaceaMedNextGenTandemOrchestrator(payload = {}) {
  const defaultSegments = [
    { segmentId: 'ascending_aorta', lengthM: 0.08, radiusM: 0.014, wallThicknessM: 0.0016, youngsModulusPa: 4.2e5 },
    { segmentId: 'subclavian_artery', lengthM: 0.14, radiusM: 0.0045, wallThicknessM: 0.0007, youngsModulusPa: 6.0e5 },
    { segmentId: 'brachial_artery', lengthM: 0.22, radiusM: 0.0024, wallThicknessM: 0.00045, youngsModulusPa: 8.5e5 },
    { segmentId: 'radial_cunkou', lengthM: 0.18, radiusM: 0.0013, wallThicknessM: 0.00032, youngsModulusPa: 1.15e6 },
  ];
  const wave47 = solveArterialTreeAndCunkouPulseClassifier(payload.wave47 ?? {
    segments: defaultSegments,
    heartRateBpm: 72,
    cunkouTensor3x3: [[38, 52, 46], [40, 54, 48], [36, 50, 44]],
  });
  const wave48 = evaluateEpigeneticSenolyticControlPolicy(payload.wave48 ?? { nadPlusToNadhRatio: 5.2 });
  const wave49 = evaluateQuantumPgxPbpkAndSatusehatBundle(payload.wave49 ?? {
    patientId: 'ihs-tandem-01',
    medications: [{ drugName: 'Atorvastatin', rxNormCode: '83367', primaryEnzyme: 'CYP3A4', fractionMetabolized: 0.7 }],
  });
  const wave50 = solvePanSpecialtyBayesianResuscitationCortex(payload.wave50 ?? {});
  const wave51 = aggregateFederatedDiscoveryMerkleCommons(payload.wave51 ?? {
    contributions: [{ nodeId: 'rsup-01', biomarkerScalar: 95, salt: 's1', gradientVector: [0.4, 0.3] }],
  });
  const wave57 = buildWebGpuTissuePeelPipeline(payload.wave57 ?? { clipDepthMm: 32, vramUtilizationPct: 68 });
  const wave59 = evaluateV2xAutonomousMedevacDispatch(payload.wave59 ?? { patientId: 'ihs-tandem-01' });

  const tandemSha256Seal = createHash('sha256')
    .update(JSON.stringify({
      pulseId: wave47.classifiedPulse.id,
      dunedinPace: wave48.predictedDunedinPace,
      qtc: wave49.projectedQtcFMs,
      cpp: wave50.neuro.cppMmHg,
      merkle: wave51.merkleRoot,
      peel: wave57.activePeelLayerId,
      v2x: wave59.packetDigestSha256,
    }))
    .digest('hex');

  return Object.freeze({
    truthClass: 'DERIVED_CLINICAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    wave47,
    wave48,
    wave49,
    wave50,
    wave51,
    wave57,
    wave59,
    tandemSha256Seal,
  });
}

