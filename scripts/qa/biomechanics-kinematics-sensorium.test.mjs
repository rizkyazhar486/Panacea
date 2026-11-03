import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateSagittalKinematics,
  calculateVerticalGrf,
  calculateRobinsonSymmetryIndex,
  evaluateGaitSymmetry,
  synthesizeKinematicTelemetry,
  classifyPathologicalGaitCycle,
  KINEMATICS_SENSORIUM_METADATA,
  GAIT_LIBRARY_DISCLAIMER,
  GAIT_BIOMECHANICS_SOURCE,
} from '../../src/domains/body-exposure/engine/gaitKinematicsSensoriumEngine.ts';

test('Sensorium 1: Sagittal kinematics envelope conforms to Perry & Winter literature', () => {
  // Test Initial Contact (0%)
  const ic = calculateSagittalKinematics(0);
  assert.strictEqual(ic.phaseId, 'initial-contact');
  assert.ok(ic.hipDeg >= 20 && ic.hipDeg <= 30, `Hip angle at IC should be ~25°, got ${ic.hipDeg}`);
  assert.ok(ic.kneeDeg >= 0 && ic.kneeDeg <= 6, `Knee at IC should be nearly extended, got ${ic.kneeDeg}`);
  assert.strictEqual(ic.mtpDeg, 0, 'MTP should be neutral at heel strike');
  assert.strictEqual(ic.windlassActive, false);

  // Test Terminal Stance (45-50%): Hip extension peak, MTP dorsiflexion begins
  const ts = calculateSagittalKinematics(50);
  assert.strictEqual(ts.phaseId, 'terminal-stance');
  assert.ok(ts.hipDeg <= -10, `Hip should be in hyperextension at 50%, got ${ts.hipDeg}`);
  // Hip excursion Δθ_hip ≈ 40°
  const hipExcursion = ic.hipDeg - ts.hipDeg;
  assert.ok(hipExcursion >= 35 && hipExcursion <= 45, `Hip excursion should be ~40°, got ${hipExcursion}`);

  // Test Pre-Swing / Toe Break (60%): Peak MTP dorsiflexion & Windlass mechanism
  const ps = calculateSagittalKinematics(60);
  assert.strictEqual(ps.phaseId, 'pre-swing');
  assert.ok(ps.mtpDeg >= 55 && ps.mtpDeg <= 65, `MTP dorsiflexion should peak at 55°-65°, got ${ps.mtpDeg}`);
  assert.strictEqual(ps.windlassActive, true, 'Windlass mechanism must be active during toe break');
  assert.ok(ps.ankleDeg <= -15, `Ankle should be in push-off plantarflexion, got ${ps.ankleDeg}`);

  // Test Initial Swing (72%): Peak knee flexion for toe clearance
  const isw = calculateSagittalKinematics(72);
  assert.strictEqual(isw.phaseId, 'initial-swing');
  assert.strictEqual(isw.kneeDeg, 60, `Peak swing knee flexion must reach 60°, got ${isw.kneeDeg}`);
  assert.strictEqual(isw.windlassActive, false);
});

test('Sensorium 2: Bimodal Ground Reaction Force (GRF) and swing unloading', () => {
  const bodyMassKg = 70;

  // Stance phase: weight acceptance impact peak (~18% of stance)
  const impact = calculateVerticalGrf(12, bodyMassKg, 60);
  assert.strictEqual(impact.phase, 'impact-peak');
  assert.ok(impact.normalizedBw >= 1.0 && impact.normalizedBw <= 1.25, `Impact peak should be ~1.18 BW, got ${impact.normalizedBw}`);
  assert.ok(impact.forceN > 700, `Force in N should be positive, got ${impact.forceN}`);
  assert.ok(impact.loadingRateBwPerSec > 0, 'Initial loading rate should be positive');

  // Stance phase: mid-stance trough (~30% cycle = 50% stance)
  const trough = calculateVerticalGrf(30, bodyMassKg, 60);
  assert.strictEqual(trough.phase, 'mid-stance-trough');
  assert.ok(trough.normalizedBw < impact.normalizedBw, 'Mid-stance trough should be lower than impact peak');
  assert.ok(trough.normalizedBw >= 0.70 && trough.normalizedBw <= 0.85, `Trough should be ~0.76 BW, got ${trough.normalizedBw}`);

  // Stance phase: propulsion peak (~48% cycle = 80% stance)
  const prop = calculateVerticalGrf(48, bodyMassKg, 60);
  assert.strictEqual(prop.phase, 'propulsion-peak');
  assert.ok(prop.normalizedBw >= 1.0 && prop.normalizedBw <= 1.25, `Propulsion peak should be ~1.18 BW, got ${prop.normalizedBw}`);

  // Swing phase (> 60% cycle): completely unloaded
  const swing = calculateVerticalGrf(75, bodyMassKg, 60);
  assert.strictEqual(swing.phase, 'swing-unloaded');
  assert.strictEqual(swing.normalizedBw, 0);
  assert.strictEqual(swing.forceN, 0);
  assert.strictEqual(swing.loadingRateBwPerSec, 0);
});

test('Sensorium 3: Robinson Symmetry Index (SI) and Antalgic gait detection', () => {
  // Test Robinson formula directly
  assert.strictEqual(calculateRobinsonSymmetryIndex(1.4, 1.4), 0, 'Identical values have 0% asymmetry');
  // 1.5 vs 1.3: 2 * |0.2| / 2.8 = 0.4 / 2.8 = 14.29%
  const testSi = calculateRobinsonSymmetryIndex(1.5, 1.3);
  assert.ok(Math.abs(testSi - 14.29) < 0.1, `Expected ~14.29%, got ${testSi}`);

  // Symmetric input
  const symmetric = evaluateGaitSymmetry({
    leftStrideLengthM: 1.42,
    rightStrideLengthM: 1.42,
    leftStancePercent: 60,
    rightStancePercent: 60,
    leftPeakGrfBw: 1.18,
    rightPeakGrfBw: 1.18,
    cadenceStepsPerMin: 112,
  });
  assert.strictEqual(symmetric.compositeSymmetryScore, 100);
  assert.strictEqual(symmetric.symmetryClass, 'normal-symmetric');

  // Asymmetric / Antalgic limping gait input
  const antalgicSymmetry = evaluateGaitSymmetry({
    leftStrideLengthM: 1.42,
    rightStrideLengthM: 1.15,
    leftStancePercent: 62,
    rightStancePercent: 48,
    leftPeakGrfBw: 1.20,
    rightPeakGrfBw: 0.85,
    cadenceStepsPerMin: 92,
  });
  assert.ok(antalgicSymmetry.compositeSymmetryScore < 85, `Score should reflect asymmetry, got ${antalgicSymmetry.compositeSymmetryScore}`);
  assert.strictEqual(antalgicSymmetry.symmetryClass, 'pathological-asymmetry');

  // Verify Antalgic classification in pathological gait engine
  const antalgicPattern = classifyPathologicalGaitCycle({
    stancePhasePercent: 48,
    swingPhasePercent: 52,
    cadenceStepsPerMin: 90,
    stepWidthCm: 11,
    swingAnkleDorsiflexionDeg: 2,
    swingKneeFlexionPeakDeg: 58,
    contralateralPelvicDropDeg: 2,
    stepTimingVariabilityCvPercent: 4.0,
  });
  assert.strictEqual(antalgicPattern.ok, true);
  assert.strictEqual(antalgicPattern.primaryPattern, 'antalgic-limping-gait');
});

test('Sensorium 4: Full Kinematic Telemetry envelope synthesis is pure & deterministic', () => {
  const telemetry = synthesizeKinematicTelemetry(
    58, // terminal stance / pre-swing
    {
      leftStrideLengthM: 1.40,
      rightStrideLengthM: 1.40,
      leftStancePercent: 60,
      rightStancePercent: 60,
      leftPeakGrfBw: 1.18,
      rightPeakGrfBw: 1.18,
      cadenceStepsPerMin: 110,
    },
    {
      stancePhasePercent: 60,
      swingPhasePercent: 40,
      cadenceStepsPerMin: 110,
      stepWidthCm: 9,
      swingAnkleDorsiflexionDeg: 2,
      swingKneeFlexionPeakDeg: 60,
      contralateralPelvicDropDeg: 1.5,
      stepTimingVariabilityCvPercent: 2.5,
    },
    75,
    1700000000000,
  );

  assert.strictEqual(telemetry.cyclePercent, 58);
  assert.strictEqual(telemetry.timestamp, 1700000000000);
  assert.strictEqual(telemetry.truthClass, 'derived');
  assert.strictEqual(telemetry.disclaimer, GAIT_LIBRARY_DISCLAIMER);
  assert.strictEqual(telemetry.source, GAIT_BIOMECHANICS_SOURCE);
  assert.strictEqual(telemetry.pathology.ok, true);
  assert.strictEqual(telemetry.pathology.primaryPattern, 'normal-physiological-gait');
  assert.strictEqual(telemetry.sagittal.windlassActive, true);
  assert.ok(telemetry.grf.normalizedBw > 0);
});
