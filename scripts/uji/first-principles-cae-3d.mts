import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BIOMED_FRONTIER_EXHIBIT_MAP, CAE_ENGINE_BOUNDARY, SYSTEM_MULTISCALE_ATLAS, TWELVE_BIOLOGICAL_SCALES,
  computeAxisExplodeAndProjectile, computeCochlearGreenwoodFrequency, evaluateErgonomicHumanLoad,
  evaluateFirstPrinciplesCase, evaluateFrontierDiscoveryEducation, evaluateLaserAndCaeInspection,
  evaluateMicrofluidicChipFlow, evaluateSurgicalSutureQuality, planEmergencyNetworkDijkstra, selectAdaptive3TChannel,
} from '../../src/domains/body-exposure/cae-studio/firstPrinciplesHumanCaeEngine.ts';

test('12 biological scales and frontier exhibit map keep strict provenance and non-immortality boundaries', () => {
  assert.equal(TWELVE_BIOLOGICAL_SCALES.length, 12);
  assert.equal(TWELVE_BIOLOGICAL_SCALES[0]?.id, 'whole-body');
  assert.equal(TWELVE_BIOLOGICAL_SCALES[10]?.id, 'chemical-quantum');
  assert.match(TWELVE_BIOLOGICAL_SCALES[11]!.epistemicBoundary, /NEVER consciousness upload/i);
  assert.ok(BIOMED_FRONTIER_EXHIBIT_MAP.length >= 9);
  for (const sys of Object.values(SYSTEM_MULTISCALE_ATLAS)) {
    for (const s of TWELVE_BIOLOGICAL_SCALES) assert.ok(sys.scaleEntities[s.id].trim().length > 0);
  }
});

test('first-principles solver obeys r^4 scaling, determinism, and rejects NaN or inverted pressure', () => {
  const base = { caseId: 'poiseuille-hemodynamics' as const, radiusPrimary: 1, secondaryDimension: 50, drivingParamA: 90, drivingParamB: 20, drivingParamC: 0.0035 };
  const r1 = evaluateFirstPrinciplesCase(base);
  assert.deepEqual(r1, evaluateFirstPrinciplesCase(base));
  const r2 = evaluateFirstPrinciplesCase({ ...base, radiusPrimary: 2 });
  assert.ok(r1.ok && r2.ok && Math.abs(r2.primaryValue / r1.primaryValue - 16) < 0.05);
  assert.equal(evaluateFirstPrinciplesCase({ ...base, radiusPrimary: Number.NaN }).ok, false);
  assert.equal(evaluateFirstPrinciplesCase({ ...base, drivingParamA: 20, drivingParamB: 90 }).ok, false);
  const nernst = evaluateFirstPrinciplesCase({ caseId: 'nernst-electrochemical', radiusPrimary: 37, secondaryDimension: 10, drivingParamA: 145, drivingParamB: 12, drivingParamC: 1 });
  assert.ok(nernst.ok && nernst.primaryValue > 60 && nernst.primaryValue < 72);
  assert.equal(evaluateFirstPrinciplesCase({ caseId: 'nernst-electrochemical', radiusPrimary: 37, secondaryDimension: 10, drivingParamA: 145, drivingParamB: 12, drivingParamC: 0 }).ok, false);
});

test('XYZ axis exploder and 1-projectile vectors snap cleanly to zero', () => {
  const zero = computeAxisExplodeAndProjectile({ explodeX: 0, explodeY: 0, explodeZ: 0, projectileFactor: 0 });
  for (const v of Object.values(zero)) assert.deepEqual(v, [0, 0, 0]);
  const x = computeAxisExplodeAndProjectile({ explodeX: 1, explodeY: 0, explodeZ: 0, projectileFactor: 0 });
  assert.notEqual(x.muscular[0], 0); assert.equal(x.muscular[1], 0); assert.equal(x.muscular[2], 0);
  const p = computeAxisExplodeAndProjectile({ explodeX: 0, explodeY: 0, explodeZ: 0, projectileFactor: 1 });
  assert.ok(p.surface[2] > 0 && p.nervous[2] < 0);
});

test('cochlea, microfluidic Re, CABG suture QA, laser, discovery, and 3T Dijkstra validate boundaries & fail closed', () => {
  const apex = computeCochlearGreenwoodFrequency(0), base = computeCochlearGreenwoodFrequency(1);
  assert.ok(apex.ok && base.ok && apex.frequencyHz < 100 && base.frequencyHz > 15000);
  assert.equal(computeCochlearGreenwoodFrequency(1.01).ok, false);

  const chip = evaluateMicrofluidicChipFlow({ hydraulicDiameterUm: 100, velocityMmSec: 5 });
  assert.ok(chip.ok && chip.regime === 'LAMINAR_DIFFUSION_CONTROLLED');
  assert.equal(evaluateMicrofluidicChipFlow({ hydraulicDiameterUm: 0, velocityMmSec: 5 }).ok, false);

  const pass = evaluateSurgicalSutureQuality({ procedurePhase: 'LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS', instrument: 'CASTROVIEJO_NEEDLE_HOLDER_8_0', graftRadiusMm: 1.5, graftLengthMm: 120, mapMmHg: 88, distalPressureMmHg: 25, distanceToPhrenicMm: 5, stitchSpacingMm: 1.1, biteDepthMm: 0.9, tensionUniformity0to1: 0.92, edgeAppositionGapMm: 0.1 });
  assert.ok(pass.ok && pass.verdict === 'PASS');
  const fail = evaluateSurgicalSutureQuality({ procedurePhase: 'LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS', instrument: 'CASTROVIEJO_NEEDLE_HOLDER_8_0', graftRadiusMm: 1.5, graftLengthMm: 120, mapMmHg: 88, distalPressureMmHg: 25, distanceToPhrenicMm: 4.9, stitchSpacingMm: 2.4, biteDepthMm: 0.3, tensionUniformity0to1: 0.5, edgeAppositionGapMm: 0.5 });
  assert.ok(fail.ok && fail.verdict === 'ANOMALY' && fail.detectedAnomalies.includes('PHRENIC_NERVE_CORRIDOR_PROXIMITY'));
  assert.equal(evaluateSurgicalSutureQuality({ procedurePhase: 'LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS', instrument: 'CASTROVIEJO_NEEDLE_HOLDER_8_0', graftRadiusMm: 1.5, graftLengthMm: 120, mapMmHg: 88, distalPressureMmHg: 25, distanceToPhrenicMm: 10, stitchSpacingMm: 1.1, biteDepthMm: 0.9, tensionUniformity0to1: 1.2, edgeAppositionGapMm: 0.1 }).ok, false);

  const lOk = evaluateLaserAndCaeInspection({ wavelengthNm: 532, slicePitchMm: 2, scanSpeedMmSec: 120, fluenceMjCm2: 150 });
  const lHi = evaluateLaserAndCaeInspection({ wavelengthNm: 532, slicePitchMm: 2, scanSpeedMmSec: 120, fluenceMjCm2: 151 });
  assert.ok(lOk.ok && lHi.ok && lOk.surfaceSafetyStatus === 'WITHIN_NON_ABLATIVE_SCAN_ENVELOPE' && lHi.surfaceSafetyStatus === 'EXCEEDS_EDUCATIONAL_SAFE_CONTOUR_LIMIT');
  assert.equal(evaluateLaserAndCaeInspection({ wavelengthNm: -1, slicePitchMm: 2, scanSpeedMmSec: 120, fluenceMjCm2: 40 }).ok, false);

  const bio = evaluateFrontierDiscoveryEducation({ vaccinePeakResponsePct: 90, vaccineHalfLifeDays: 100, daysPostPriming: 100, stemStateWeights: [1, 1, 1], hdrEvents: 25, nhejEvents: 75, phredQScore: 30, readCount: 1000, readLengthBp: 150, targetPanelBp: 15000 });
  assert.ok(bio.ok && bio.vaccineAdaptiveRetentionPct === 45 && bio.hdrPrecisionRatioPct === 25 && bio.landerWatermanCoverage === 10);
  assert.equal(evaluateFrontierDiscoveryEducation({ vaccinePeakResponsePct: 90, vaccineHalfLifeDays: 100, daysPostPriming: 100, stemStateWeights: [1, 1, 1], hdrEvents: 25, nhejEvents: 75, phredQScore: 65, readCount: 1000, readLengthBp: 150, targetPanelBp: 15000 }).ok, false);

  const ch = selectAdaptive3TChannel({ environment: 'underground_basement', activeBearer: 'offline-queue', bandwidthKHz: 25, snrLinear: 1, pendingPacketsKb: 120 });
  assert.ok(ch.ok && ch.payloadPolicy === 'STORE_AND_FORWARD_DELTA' && ch.estimatedDrainSec === null);
  assert.equal(selectAdaptive3TChannel({ environment: 'rural_3t', activeBearer: '3g-umts', bandwidthKHz: 0, snrLinear: 2, pendingPacketsKb: 10 }).ok, false);

  const d = planEmergencyNetworkDijkstra({ edges: [{ from: 'A', to: 'B', baseDistanceKm: 10, trafficMultiplier: 1, hazardBlocked: true }], origin: 'A', destination: 'B', availableBeds: 5, incomingPatients: 8 });
  assert.ok(d.ok && !d.reachable && d.supplyDemandStatus === 'SURGE_DEFICIT_ESCALATE');
  assert.equal(planEmergencyNetworkDijkstra({ edges: [], origin: ' ', destination: 'B', availableBeds: 5, incomingPatients: 1 }).ok, false);

  const e25 = evaluateErgonomicHumanLoad({ neckFlexionDeg: 25, screenDistanceCm: 55, continuousMinutes: 44 });
  const e26 = evaluateErgonomicHumanLoad({ neckFlexionDeg: 26, screenDistanceCm: 55, continuousMinutes: 44 });
  assert.ok(e25.ok && !e25.needsMicroBreakOrAdjustment && e26.ok && e26.needsMicroBreakOrAdjustment);
});

test('Studio component, MedStudyHubBase route, and pure engine enforce Meshopt, purity, and claim limits', () => {
  const studio = readFileSync(new URL('../../src/components/bodyhub/MedSciBodyCaeStudio3D.tsx', import.meta.url), 'utf8');
  const medstudy = readFileSync(new URL('../../src/pages/medstudy/MedStudyHubBase.tsx', import.meta.url), 'utf8');
  const engine = readFileSync(new URL('../../src/domains/body-exposure/cae-studio/firstPrinciplesHumanCaeEngine.ts', import.meta.url), 'utf8');
  assert.match(studio, /setMeshoptDecoder\(MeshoptDecoder\)/);
  assert.match(studio, /parser\.associations/);
  assert.match(studio, /disposeOwnedObject3DResources/);
  assert.match(studio, /clinically_reviewed:\s*false/);
  assert.match(medstudy, /import\('\.\.\/\.\.\/components\/bodyhub\/MedSciBodyCaeStudio3D\.tsx'\)/);
  assert.match(medstudy, /<BatasKlaimKesehatan permukaan="clinical\.med-study"/);
  assert.doesNotMatch(engine, /\b(window\.|document\.|localStorage\.|Date\.now\(|new Date\(|Math\.random\(|fetch\()/);
  assert.ok(CAE_ENGINE_BOUNDARY.includes('Not clinical diagnosis'));
});
