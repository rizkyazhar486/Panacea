import crypto from 'node:crypto';

export type HardwareSourceType =
  | 'ECMO_MACHINE'
  | 'MECHANICAL_VENTILATOR'
  | 'ADVANCED_WEARABLE_WHOOP_GARMIN_PLUS'
  | 'UNDERWATER_DIVING_GEAR'
  | 'AVIATION_BAROMETRIC_GPS';

export interface OmniTelemetryInput {
  deviceId: string;
  sourceType: HardwareSourceType;
  primaryBiometricValue: number;
  environmentalPressureAtm: number;
  gpsSpatialCoordinates: { latitude: number; longitude: number; altitudeMeters: number };
  socialInteractionModeIndex: number;
  inspiredOxygenFractionFio2?: number;
  bodySurfaceAreaM2?: number;
}

export interface OmniTelemetryUnifiedReport {
  telemetrySessionId: string;
  deviceId: string;
  sourceType: HardwareSourceType;
  environmentalAdaptationStatus:
    | 'HOMEOSTASIS_OPTIMAL'
    | 'ENVIRONMENTAL_STRESS_DETECTED'
    | 'CRITICAL_HARDWARE_INTERVENTION_REQUIRED';
  estimatedAlveolarPo2MmHg: number;
  buhlmannDecompressionGradientFactor: number;
  holisticHumanEnvironmentQuotient: number;
  consequentialAnatomicalTargets: string[];
  sportMedicalInsight: string;
  provenanceHash: string;
  isClinicallyAuthoritative: false;
}

export function evaluateOmniDeviceTelemetry(input: OmniTelemetryInput): OmniTelemetryUnifiedReport {
  const pressureAtm = Math.max(0.1, input.environmentalPressureAtm || 1.0);
  const fio2 = Math.min(1.0, Math.max(0.21, input.inspiredOxygenFractionFio2 ?? 0.21));
  const bsa = Math.max(0.5, input.bodySurfaceAreaM2 ?? 1.85);

  // Alveolar Gas Equation: PAO2 = FiO2 * (Patm_mmHg - PH2O_47) - (PaCO2_40 / RQ_0.8)
  const patmMmHg = pressureAtm * 760;
  const estimatedAlveolarPo2MmHg = Number(Math.max(0, fio2 * (patmMmHg - 47) - 40 / 0.8).toFixed(2));

  // Hydrostatic / barometric nitrogen loading ratio relative to sea-level 0.79 atm N2
  const inspiredN2Atm = pressureAtm * (1 - fio2);
  const buhlmannDecompressionGradientFactor = Number((inspiredN2Atm / 0.79).toFixed(3));

  let status: OmniTelemetryUnifiedReport['environmentalAdaptationStatus'] = 'HOMEOSTASIS_OPTIMAL';
  let insight = 'Physiological homeostasis maintained within normobaric and normoxic boundaries.';
  const targets: string[] = ['CARDIOVASCULAR_SYSTEM', 'AUTONOMIC_NERVOUS_SYSTEM'];

  if (input.sourceType === 'ECMO_MACHINE') {
    const cardiacIndexEquivalent = input.primaryBiometricValue / bsa;
    if (cardiacIndexEquivalent < 1.8 || input.primaryBiometricValue < 2.2) {
      status = 'CRITICAL_HARDWARE_INTERVENTION_REQUIRED';
      insight = `Critical ECMO perfusion deficit (flow=${input.primaryBiometricValue} L/min, index=${cardiacIndexEquivalent.toFixed(2)} L/min/m2). Immediate clinician review required.`;
      targets.push('MYOCARDIAL_PERFUSION', 'RENAL_CORTEX_OXYGENATION', 'CEREBRAL_HEMODYNAMICS');
    }
  } else if (
    pressureAtm > 2.0 ||
    input.gpsSpatialCoordinates.altitudeMeters > 3000 ||
    estimatedAlveolarPo2MmHg < 60
  ) {
    status = 'ENVIRONMENTAL_STRESS_DETECTED';
    insight = `Hyperbaric/hypobaric stress detected (PAO2=${estimatedAlveolarPo2MmHg} mmHg, N2-load=${buhlmannDecompressionGradientFactor}x, alt=${input.gpsSpatialCoordinates.altitudeMeters}m).`;
    targets.push('PULMONARY_ALVEOLAR_MEMBRANE', 'INNER_EAR_LABYRINTH_THT', 'PERIPHERAL_VASCULAR_BED');
  }

  const quotient = Number(
    ((input.primaryBiometricValue * (1 + input.socialInteractionModeIndex * 0.25)) / pressureAtm).toFixed(3)
  );

  const provenanceHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        deviceId: input.deviceId,
        sourceType: input.sourceType,
        estimatedAlveolarPo2MmHg,
        buhlmannDecompressionGradientFactor,
        quotient,
        status
      })
    )
    .digest('hex');

  return {
    telemetrySessionId: `OMNI-TEL-${provenanceHash.slice(0, 12).toUpperCase()}`,
    deviceId: input.deviceId,
    sourceType: input.sourceType,
    environmentalAdaptationStatus: status,
    estimatedAlveolarPo2MmHg,
    buhlmannDecompressionGradientFactor,
    holisticHumanEnvironmentQuotient: quotient,
    consequentialAnatomicalTargets: targets,
    sportMedicalInsight: insight,
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
