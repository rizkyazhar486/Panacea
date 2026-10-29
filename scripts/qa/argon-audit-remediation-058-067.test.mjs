import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDynamicDominoCascade } from '../../src/kernel/domino-matrix/dynamicDominoEngine.ts';
import { evaluateTrillionQuantumDominoMatrix } from '../../src/kernel/trillion-domino/trillionQuantumDominoEngine.ts';
import { evaluateBodyExposureSync } from '../../src/domains/body-exposure/bodyExposureEnterpriseEngine.ts';
import { evaluateOmniDeviceTelemetry } from '../../src/domains/omni-device-telemetry/omniDeviceTelemetryEngine.ts';
import { synthesizeUniversalDigitalTwin } from '../../src/domains/universal-scanner-twin/universalScannerTwinEngine.ts';
import { evaluateLongitudinalCausalProjection } from '../../src/domains/body-exposure-longitudinal/longitudinalCausalEngine.ts';

test('Argon Audit 1: Directive 058 & 059 produce deterministic SHA-256 and consequential organ/clerkship mappings', () => {
  const d1 = evaluateDynamicDominoCascade({
    nodeId: 'MITO-COMPLEX-I',
    layerLevel: 'SUB_ATOMIC',
    initialPerturbationValue: 45,
    cascadeDepth: 4
  });
  const d2 = evaluateDynamicDominoCascade({
    nodeId: 'MITO-COMPLEX-I',
    layerLevel: 'SUB_ATOMIC',
    initialPerturbationValue: 45,
    cascadeDepth: 4
  });

  // Deterministic SHA-256 (never random!)
  assert.equal(d1.provenanceHash, d2.provenanceHash);
  assert.equal(d1.provenanceHash.length, 64);
  assert.ok(d1.cascadeTrajectory[3].consequentialOrganTargets.includes('CARDIOVASCULAR_MYOCARDIUM'));

  const matrix = evaluateTrillionQuantumDominoMatrix({
    seedEntityId: 'MITO-COMPLEX-I',
    initiatingLayer: 'SUB_ATOMIC_QUANTUM',
    quantumTunnelingIndex: 0.25,
    chemicalGibbsFreeEnergy: -62.5,
    cellularAtpFlux: 3.2,
    organSystemStressFactor: 4
  });
  assert.ok(matrix.propagatedCascadePath.length === 5);
  assert.ok(matrix.propagatedCascadePath[4].impactedClinicalClerkships.includes('INTERNAL_MEDICINE'));
});

test('Argon Audit 2: Directive 060 refuses to claim AAA quality when only config flags are passed without real asset hash', () => {
  const unverifiedSync = evaluateBodyExposureSync({
    entityId: 'AVATAR-UNVERIFIED',
    meshPolycountTarget: 'ULTRA_AAA',
    subsurfaceScatteringIndex: 0.9,
    pbrTextureResolution: '8K',
    enableDynamicLighting: true
  });

  assert.equal(unverifiedSync.graphicsQualityVerdict, 'CONFIG_REQUESTED_UNVERIFIED_ASSET');
  assert.equal(unverifiedSync.evidenceGateStatus, 'ARTIFACT_HASH_MISMATCH');
});

test('Argon Audit 3: Directive 062 computes real Alveolar Gas Equation (PAO2) and detects ECMO low-flow', () => {
  const ecmoAlert = evaluateOmniDeviceTelemetry({
    deviceId: 'ECMO-01',
    sourceType: 'ECMO_MACHINE',
    primaryBiometricValue: 1.6,
    environmentalPressureAtm: 1.0,
    gpsSpatialCoordinates: { latitude: -6.2, longitude: 106.8, altitudeMeters: 15 },
    socialInteractionModeIndex: 0.2,
    inspiredOxygenFractionFio2: 0.21,
    bodySurfaceAreaM2: 1.9
  });

  assert.equal(ecmoAlert.environmentalAdaptationStatus, 'CRITICAL_HARDWARE_INTERVENTION_REQUIRED');
  assert.ok(ecmoAlert.estimatedAlveolarPo2MmHg > 95 && ecmoAlert.estimatedAlveolarPo2MmHg < 105);
  assert.ok(ecmoAlert.consequentialAnatomicalTargets.includes('MYOCARDIAL_PERFUSION'));
});

test('Argon Audit 4: Directive 065 & 066 enforce reference-atlas boundary and distinguish association from causality', () => {
  const twin = synthesizeUniversalDigitalTwin({
    scanId: 'SCAN-01',
    modality: 'QUANTUM_MRI_3T_7T',
    spatialResolutionMicrons: 50,
    rawSignalTensorData: [12.4, 15.2, 14.8, 13.9],
    userBiometricCalibrationHash: 'calib-01'
    // No verifiedIndividualImagingSha256 provided -> must stay REFERENCE_ATLAS_CALIBRATED_ONLY
  });
  assert.equal(twin.digitalTwinFidelityClassification, 'REFERENCE_ATLAS_CALIBRATED_ONLY');

  const longitudinal = evaluateLongitudinalCausalProjection({
    userId: 'USER-01',
    temporalTimestampEpoch: 1761780000000,
    spatialCoordinate: { lat: -6.2, lng: 106.8, elevationMeters: 20 },
    causalTriggerEvent: 'DIVING_DESCENT_30M',
    biometricDeltaVector: [3.0, 4.0]
  });
  assert.equal(longitudinal.l2NormMagnitude, 5);
  assert.equal(longitudinal.inferenceEpistemicClass, 'TEMPORAL_ASSOCIATION_OBSERVED');
});
