export const CLINICAL_ONE_OS_WORKFLOW_STAGES = [
  "BEFORE_VISIT",
  "CLINICIAN_REVIEW",
  "ENCOUNTER",
  "DOCUMENTATION",
  "RESULTS",
  "FOLLOW_UP"
] as const;

export type ClinicalWorkflowStage = (typeof CLINICAL_ONE_OS_WORKFLOW_STAGES)[number];

export interface GenesisDeviceSignalPacket {
  readonly deviceId: string;
  readonly patientId: string;
  readonly consentVerified: boolean;
  readonly metricCode: "HR_BPM" | "SPO2_PERCENT" | "SBP_MMHG" | "DBP_MMHG";
  readonly measuredValue: number | null;
  readonly unit: string;
  readonly recordedAtIso: string;
}

export function ingestGenesisDeviceSignalSafely(packet: GenesisDeviceSignalPacket) {
  if (!packet.consentVerified) {
    throw new Error("PART XIII-F3 SECURITY GUARD: Cannot ingest Genesis Device signal without verified patient consent.");
  }
  return {
    patientId: packet.patientId,
    metricCode: packet.metricCode,
    authoritativeValue: packet.measuredValue === null ? "MISSING_OBSERVATION" : packet.measuredValue,
    truthClass: "OBSERVED_CLINICAL" as const,
    consentVerified: true as const
  };
}

export function buildBoundedHumanDigitalTwinSnapshot(params: {
  patientId: string;
  workflowStage: ClinicalWorkflowStage;
  observedHeartRateBpm: number | null;
  modeledStrokeVolumeMl: number;
}) {
  return {
    patientId: params.patientId,
    workflowStage: params.workflowStage,
    measuredClinicalState: {
      heartRateBpm: params.observedHeartRateBpm === null ? "MISSING_OBSERVATION" : params.observedHeartRateBpm,
      truthClass: "OBSERVED_CLINICAL" as const
    },
    educationalDigitalTwinProjection: {
      modeledStrokeVolumeMl: params.modeledStrokeVolumeMl,
      truthClass: "SIMULATED_EDUCATIONAL" as const,
      anatomicalReconstructionClaimed: false as const
    },
    clinicalAuthorityPreserved: true as const
  };
}