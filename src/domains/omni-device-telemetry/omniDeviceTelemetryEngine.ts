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
  safetyAndValidationBoundary: {
    clinicalValidationState: 'UNVALIDATED_MATHEMATICAL_MODEL_NOT_PATIENT_SPECIFIC';
    deviceActuationPermitted: false;
    digitalTwinRepresentationStatus: 'THEORETICAL_TELEMETRY_PROJECTION_NOT_INDIVIDUAL_TWIN';
    unverifiedAssumptions: string[];
  };
  provenanceHash: string;
  isClinicallyAuthoritative: false;
}

export function evaluateOmniDeviceTelemetry(input: OmniTelemetryInput): OmniTelemetryUnifiedReport {
  const pressureAtm = Math.max(0.1, input.environmentalPressureAtm || 1.0);
  const fio2 = Math.min(1.0, Math.max(0.21, input.inspiredOxygenFractionFio2 ?? 0.21));
  const bsa = Math.max(0.5, input.bodySurfaceAreaM2 ?? 1.85);

  const patmMmHg = pressureAtm * 760;
  const estimatedAlveolarPo2MmHg = Number(Math.max(0, fio2 * (patmMmHg - 47) - 40 / 0.8).toFixed(2));

  const inspiredN2Atm = pressureAtm * (1 - fio2);
  const buhlmannDecompressionGradientFactor = Number((inspiredN2Atm / 0.79).toFixed(3));

  let status: OmniTelemetryUnifiedReport['environmentalAdaptationStatus'] = 'HOMEOSTASIS_OPTIMAL';
  let insight = 'Theoretical normobaric/normoxic calculation within nominal bounds (non-diagnostic).';
  const targets: string[] = ['CARDIOVASCULAR_SYSTEM', 'AUTONOMIC_NERVOUS_SYSTEM'];

  const unverifiedAssumptions: string[] = [
    'Assumes fixed arterial PaCO2 of 40 mmHg and respiratory quotient (RQ) of 0.8 without ABG measurement.',
    'Assumes water vapor pressure of 47 mmHg at 37.0°C core temperature.',
    'Does not account for patient-specific intrapulmonary shunt, V/Q mismatch, or membrane oxygenator oxygen transfer efficiency.',
    'Mathematical output is an illustrative physiological calculation and MUST NOT be used for clinical diagnosis or ECMO/ventilator actuation.'
  ];

  if (input.sourceType === 'ECMO_MACHINE') {
    const cardiacIndexEquivalent = input.primaryBiometricValue / bsa;
    if (cardiacIndexEquivalent < 1.8 || input.primaryBiometricValue < 2.2) {
      status = 'CRITICAL_HARDWARE_INTERVENTION_REQUIRED';
      insight = `Unvalidated low-flow alert threshold triggered (flow=${input.primaryBiometricValue} L/min, index=${cardiacIndexEquivalent.toFixed(2)} L/min/m2). Human clinician verification required; automated pump actuation is prohibited.`;
      targets.push('MYOCARDIAL_PERFUSION', 'RENAL_CORTEX_OXYGENATION', 'CEREBRAL_HEMODYNAMICS');
    }
  } else if (
    pressureAtm > 2.0 ||
    input.gpsSpatialCoordinates.altitudeMeters > 3000 ||
    estimatedAlveolarPo2MmHg < 60
  ) {
    status = 'ENVIRONMENTAL_STRESS_DETECTED';
    insight = `Theoretical barometric/hydrostatic stress threshold crossed (PAO2=${estimatedAlveolarPo2MmHg} mmHg, N2-ratio=${buhlmannDecompressionGradientFactor}x, alt=${input.gpsSpatialCoordinates.altitudeMeters}m).`;
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
    safetyAndValidationBoundary: {
      clinicalValidationState: 'UNVALIDATED_MATHEMATICAL_MODEL_NOT_PATIENT_SPECIFIC',
      deviceActuationPermitted: false,
      digitalTwinRepresentationStatus: 'THEORETICAL_TELEMETRY_PROJECTION_NOT_INDIVIDUAL_TWIN',
      unverifiedAssumptions
    },
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
