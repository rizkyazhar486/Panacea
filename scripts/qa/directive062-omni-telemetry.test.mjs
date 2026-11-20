import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateOmniDeviceTelemetry } from '../../src/domains/omni-device-telemetry/omniDeviceTelemetryEngine.ts';

test('Omni-Device Telemetry Positive Control: Evaluates wearable GPS and environmental telemetry successfully', () => {
  const result = evaluateOmniDeviceTelemetry({
    deviceId: 'GARMIN-TACTIX-PRO-01',
    sourceType: 'ADVANCED_WEARABLE_WHOOP_GARMIN_PLUS',
    primaryBiometricValue: 65.4, // HRV or VO2 metric
    environmentalPressureAtm: 1.0,
    gpsSpatialCoordinates: { latitude: -6.2088, longitude: 106.8456, altitudeMeters: 50 },
    socialInteractionModeIndex: 0.85
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.environmentalAdaptationStatus, 'HOMEOSTASIS_OPTIMAL');
  assert.ok(result.holisticHumanEnvironmentQuotient > 0);
  console.log('✅ Omni-Device Wearables Positive Control Passed:', result);
});

test('Omni-Device Telemetry Negative Control: Triggers critical intervention alert on ECMO hardware anomaly', () => {
  const result = evaluateOmniDeviceTelemetry({
    deviceId: 'ECMO-MAQUET-ALTA-02',
    sourceType: 'ECMO_MACHINE',
    primaryBiometricValue: 1.5, // Low blood flow L/min
    environmentalPressureAtm: 1.0,
    gpsSpatialCoordinates: { latitude: -6.22, longitude: 106.81, altitudeMeters: 20 },
    socialInteractionModeIndex: 0.1
  });

  assert.equal(result.environmentalAdaptationStatus, 'CRITICAL_HARDWARE_INTERVENTION_REQUIRED');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Critical Hardware Negative Control Passed:', result);
});
