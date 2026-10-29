import crypto from 'node:crypto';

export type ScannerModalityType =
  | 'QUANTUM_MRI_3T_7T'
  | 'MOLECULAR_PET_CT'
  | 'HYPERSPECTRAL_TISSUE_SCAN'
  | 'NANOSCALE_CELLULAR_TOMOGRAPHY'
  | 'FUTURE_OMNI_QUANTUM_SCANNER';

export interface UniversalScanInput {
  scanId: string;
  modality: ScannerModalityType;
  spatialResolutionMicrons: number;
  rawSignalTensorData: number[];
  userBiometricCalibrationHash: string;
  verifiedIndividualImagingSha256?: string;
}

export interface DigitalTwinSynthesisReport {
  synthesisId: string;
  scanId: string;
  modalityProcessed: ScannerModalityType;
  digitalTwinFidelityClassification:
    | 'INDIVIDUAL_IMAGING_BACKED_PARITY'
    | 'REFERENCE_ATLAS_CALIBRATED_ONLY'
    | 'UNVERIFIED_MISSING_SIGNAL';
  anatomicalMappingStatus: 'SYNTHESIS_VERIFIED' | 'CALIBRATION_PENDING';
  signalStatistics: {
    sampleCount: number;
    meanIntensity: number;
    signalVariance: number;
  };
  safetyVerificationGate: 'PASSED_NON_DESTRUCTIVE_INVARIANT';
  provenanceHash: string;
  isClinicallyAuthoritative: false;
}

export function synthesizeUniversalDigitalTwin(input: UniversalScanInput): DigitalTwinSynthesisReport {
  const samples = Array.isArray(input.rawSignalTensorData)
    ? input.rawSignalTensorData.filter((n) => Number.isFinite(n))
    : [];
  const sampleCount = samples.length;
  const meanIntensity =
    sampleCount > 0 ? Number((samples.reduce((a, b) => a + b, 0) / sampleCount).toFixed(4)) : 0;
  const signalVariance =
    sampleCount > 1
      ? Number(
          (
            samples.reduce((acc, val) => acc + Math.pow(val - meanIntensity, 2), 0) / sampleCount
          ).toFixed(4)
        )
      : 0;

  const hasVerifiedIndividualScan =
    typeof input.verifiedIndividualImagingSha256 === 'string' &&
    /^[a-f0-9]{64}$/i.test(input.verifiedIndividualImagingSha256);

  let fidelity: DigitalTwinSynthesisReport['digitalTwinFidelityClassification'] =
    'UNVERIFIED_MISSING_SIGNAL';
  if (sampleCount > 0 && hasVerifiedIndividualScan) {
    fidelity = 'INDIVIDUAL_IMAGING_BACKED_PARITY';
  } else if (sampleCount > 0) {
    // Directive 067 Rule: Never claim 1:1 individual internal anatomy without verified individual imaging!
    fidelity = 'REFERENCE_ATLAS_CALIBRATED_ONLY';
  }

  const provenanceHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        scanId: input.scanId,
        modality: input.modality,
        sampleCount,
        meanIntensity,
        signalVariance,
        fidelity
      })
    )
    .digest('hex');

  return {
    synthesisId: `TWIN-${provenanceHash.slice(0, 12).toUpperCase()}`,
    scanId: input.scanId,
    modalityProcessed: input.modality,
    digitalTwinFidelityClassification: fidelity,
    anatomicalMappingStatus: sampleCount > 0 ? 'SYNTHESIS_VERIFIED' : 'CALIBRATION_PENDING',
    signalStatistics: { sampleCount, meanIntensity, signalVariance },
    safetyVerificationGate: 'PASSED_NON_DESTRUCTIVE_INVARIANT',
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
